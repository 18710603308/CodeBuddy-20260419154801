/**
 * 电子请柬短链接 API — 零依赖实现
 *
 * 存储请柬数据到数据库，返回 8 位短 ID，前端通过短链接访问。
 * - 优先使用 better-sqlite3（若已安装）→ SQLite 数据库
 * - 否则回退 JSON 文件存储（零依赖，可直接运行）
 * - 照片 base64 自动落盘到 uploads/，数据库只存 URL（读写更快，浏览器可并发加载）
 * - GET 读取时自动累计浏览量 views
 *
 * 环境变量：
 *   PORT         监听端口，默认 3002
 *   INV_DB_PATH  数据库文件路径，默认本目录 invitations.db / invitations.json
 *
 * 端点：
 *   POST /invitation          { data: InvitationData }  → { id }
 *   GET  /invitation/:id      → { data, views }
 *   GET  /uploads/:file       → 静态图片（照片文件）
 *   GET  /health              → { ok: true }
 */
'use strict'

const http = require('http')
const crypto = require('crypto')
const path = require('path')
const fs = require('fs')

const PORT = Number(process.env.PORT || 3002)
const ID_LEN = 8
const MAX_BODY = 40 * 1024 * 1024 // 40MB（多张照片 base64）
const UPLOAD_DIR = path.join(__dirname, 'uploads')
const IMG_RE = /^data:image\/(png|jpe?g|gif|webp);base64,([A-Za-z0-9+/=]+)$/
const MIN_INLINE = 512 // 小于该字节的 base64 保持内联（图标等），避免碎片化
const MIME = { png: 'image/png', jpg: 'image/jpeg', gif: 'image/gif', webp: 'image/webp' }

fs.mkdirSync(UPLOAD_DIR, { recursive: true })

// ==================== 存储层 ====================
let store

// 尝试 SQLite（better-sqlite3）
try {
  const Database = require('better-sqlite3')
  const dbPath = process.env.INV_DB_PATH || path.join(__dirname, 'invitations.db')
  const db = new Database(dbPath)
  db.exec(
    `CREATE TABLE IF NOT EXISTS invitations (
       id TEXT PRIMARY KEY,
       data TEXT NOT NULL,
       views INTEGER NOT NULL DEFAULT 0,
       created_at INTEGER NOT NULL
     )`
  )
  // 兼容旧表（无 views 列时补充）
  const cols = db.prepare('PRAGMA table_info(invitations)').all().map((c) => c.name)
  if (!cols.includes('views')) db.exec('ALTER TABLE invitations ADD COLUMN views INTEGER NOT NULL DEFAULT 0')

  const insert = db.prepare('INSERT INTO invitations (id, data, views, created_at) VALUES (?, ?, 0, ?)')
  const getStmt = db.prepare('SELECT data, views FROM invitations WHERE id = ?')
  const bumpStmt = db.prepare('UPDATE invitations SET views = views + 1 WHERE id = ?')
  store = {
    kind: 'sqlite',
    set: (id, data) => insert.run(id, data, Date.now()),
    get: (id) => {
      const row = getStmt.get(id)
      return row ? { data: row.data, views: row.views || 0 } : null
    },
    bump: (id) => {
      const row = getStmt.get(id)
      if (!row) return null
      bumpStmt.run(id)
      return (row.views || 0) + 1
    },
  }
  console.log(`[invitation-api] SQLite store: ${dbPath}`)
} catch (e) {
  // JSON 文件存储（零依赖回退）
  const jsonPath = process.env.INV_DB_PATH || path.join(__dirname, 'invitations.json')
  let map = {}
  try {
    map = JSON.parse(fs.readFileSync(jsonPath, 'utf8'))
  } catch {
    /* 首次运行 */
  }
  const persist = () => {
    fs.writeFileSync(jsonPath, JSON.stringify(map))
  }
  store = {
    kind: 'json',
    set: (id, data) => {
      map[id] = { data, views: 0, created_at: Date.now() }
      persist()
    },
    get: (id) => (map[id] ? { data: map[id].data, views: map[id].views || 0 } : null),
    bump: (id) => {
      if (!map[id]) return null
      map[id].views = (map[id].views || 0) + 1
      persist()
      return map[id].views
    },
  }
  console.log(`[invitation-api] JSON store: ${jsonPath} (better-sqlite3 未安装)`)
}

// ==================== 工具 ====================
const ID_CHARS = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
function genId(len = ID_LEN) {
  const bytes = crypto.randomBytes(len)
  let s = ''
  for (let i = 0; i < len; i++) s += ID_CHARS[bytes[i] % ID_CHARS.length]
  return s
}

function send(res, status, obj) {
  const body = JSON.stringify(obj)
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(body),
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  })
  res.end(body)
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = []
    let size = 0
    req.on('data', (c) => {
      size += c.length
      if (size > MAX_BODY) {
        reject(new Error('body too large'))
        req.destroy()
        return
      }
      chunks.push(c)
    })
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')))
    req.on('error', reject)
  })
}

/** 把照片 base64 落盘为静态文件，数据库只存 URL；小图保持内联 */
function extractPhotos(data, id) {
  if (!Array.isArray(data.photos) || data.photos.length === 0) return
  const urls = []
  data.photos.forEach((src, i) => {
    const m = typeof src === 'string' ? src.match(IMG_RE) : null
    if (!m) {
      urls.push(src) // 已是 URL 或非 base64，原样保留
      return
    }
    const ext = m[1] === 'jpeg' ? 'jpg' : m[1]
    const buf = Buffer.from(m[2], 'base64')
    if (buf.length < MIN_INLINE) {
      urls.push(src) // 小图保持内联，避免大量碎片文件
      return
    }
    const name = `${id}-p${i}.${ext}`
    fs.writeFileSync(path.join(UPLOAD_DIR, name), buf)
    urls.push(`/inv-api/uploads/${name}`)
  })
  data.photos = urls
}

/** 静态服务 uploads/ 下的照片文件 */
function serveUpload(res, file) {
  if (!/^[A-Za-z0-9][A-Za-z0-9._-]*$/.test(file)) {
    res.writeHead(400, { 'Content-Type': 'text/plain' })
    return res.end('bad request')
  }
  const full = path.join(UPLOAD_DIR, file)
  if (!full.startsWith(UPLOAD_DIR + path.sep)) {
    res.writeHead(400, { 'Content-Type': 'text/plain' })
    return res.end('bad request')
  }
  fs.stat(full, (err, st) => {
    if (err || !st.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/plain' })
      return res.end('not found')
    }
    const ext = path.extname(file).slice(1).toLowerCase()
    res.writeHead(200, {
      'Content-Type': MIME[ext] || 'application/octet-stream',
      'Content-Length': st.size,
      // 文件名含 ID+序号，内容不可变，可长期缓存
      'Cache-Control': 'public, max-age=31536000, immutable',
      'Access-Control-Allow-Origin': '*',
    })
    fs.createReadStream(full).pipe(res)
  })
}

// ==================== 路由 ====================
const server = http.createServer(async (req, res) => {
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    })
    res.end()
    return
  }

  const url = new URL(req.url, 'http://localhost')

  try {
    // 健康检查
    if (req.method === 'GET' && url.pathname === '/health') {
      return send(res, 200, { ok: true, store: store.kind })
    }

    // 照片静态文件
    if (req.method === 'GET' && url.pathname.startsWith('/uploads/')) {
      return serveUpload(res, decodeURIComponent(url.pathname.slice('/uploads/'.length)))
    }

    // 保存请柬 → { id }
    if (req.method === 'POST' && url.pathname === '/invitation') {
      const raw = await readBody(req)
      let data
      try {
        data = JSON.parse(raw).data
      } catch {
        return send(res, 400, { error: 'invalid JSON body' })
      }
      if (!data || typeof data !== 'object' || !data.date) {
        return send(res, 400, { error: 'invalid invitation data' })
      }
      // 生成不重复的短 ID
      let id
      do {
        id = genId()
      } while (store.get(id))
      // 照片 base64 落盘 → 数据库只存 URL
      extractPhotos(data, id)
      store.set(id, JSON.stringify(data))
      return send(res, 200, { id })
    }

    // 读取请柬 → { data, views }（自动累计浏览量）
    if (req.method === 'GET' && url.pathname.startsWith('/invitation/')) {
      const id = decodeURIComponent(url.pathname.slice('/invitation/'.length))
      if (!/^[A-Za-z0-9_-]{4,32}$/.test(id)) {
        return send(res, 400, { error: 'invalid id' })
      }
      const row = store.get(id)
      if (!row) return send(res, 404, { error: 'not found' })
      const views = store.bump(id)
      return send(res, 200, { data: JSON.parse(row.data), views })
    }

    send(res, 404, { error: 'not found' })
  } catch (e) {
    send(res, 500, { error: 'internal error', detail: String(e && e.message || e) })
  }
})

server.listen(PORT, () => {
  console.log(`[invitation-api] listening on :${PORT} (store=${store.kind})`)
})
