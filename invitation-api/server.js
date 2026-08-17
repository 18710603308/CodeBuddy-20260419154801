/**
 * 电子请柬短链接 API — 零依赖实现
 *
 * 存储请柬数据到数据库，返回 8 位短 ID，前端通过短链接访问。
 * - 优先使用 better-sqlite3（若已安装）→ SQLite 数据库
 * - 否则回退 JSON 文件存储（零依赖，可直接运行）
 *
 * 环境变量：
 *   PORT         监听端口，默认 3002
 *   INV_DB_PATH  数据库文件路径，默认本目录 invitations.db / invitations.json
 *
 * 端点：
 *   POST /invitation          { data: InvitationData }  → { id }
 *   GET  /invitation/:id      → { data }
 *   GET  /health              → { ok: true }
 */
'use strict'

const http = require('http')
const crypto = require('crypto')
const path = require('path')
const fs = require('fs')

const PORT = Number(process.env.PORT || 3002)
const ID_LEN = 8
const MAX_BODY = 25 * 1024 * 1024 // 25MB（照片 base64）

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
       created_at INTEGER NOT NULL
     )`
  )
  const insert = db.prepare('INSERT INTO invitations (id, data, created_at) VALUES (?, ?, ?)')
  const getStmt = db.prepare('SELECT data FROM invitations WHERE id = ?')
  store = {
    kind: 'sqlite',
    set: (id, data) => insert.run(id, data, Date.now()),
    get: (id) => {
      const row = getStmt.get(id)
      return row ? row.data : null
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
      map[id] = { data, created_at: Date.now() }
      persist()
    },
    get: (id) => (map[id] ? map[id].data : null),
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
      store.set(id, JSON.stringify(data))
      return send(res, 200, { id })
    }

    // 读取请柬 → { data }
    if (req.method === 'GET' && url.pathname.startsWith('/invitation/')) {
      const id = decodeURIComponent(url.pathname.slice('/invitation/'.length))
      if (!/^[A-Za-z0-9_-]{4,32}$/.test(id)) {
        return send(res, 400, { error: 'invalid id' })
      }
      const row = store.get(id)
      if (!row) return send(res, 404, { error: 'not found' })
      return send(res, 200, { data: JSON.parse(row) })
    }

    send(res, 404, { error: 'not found' })
  } catch (e) {
    send(res, 500, { error: 'internal error', detail: String(e && e.message || e) })
  }
})

server.listen(PORT, () => {
  console.log(`[invitation-api] listening on :${PORT} (store=${store.kind})`)
})
