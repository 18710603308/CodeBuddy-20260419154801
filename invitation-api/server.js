/**
 * 电子请柬短链接 API — PostgreSQL 存储 + 阿里云 OSS 照片
 *
 * 存储请柬数据到 PostgreSQL，返回 8 位短 ID，前端通过短链接访问。
 * - 数据存 PostgreSQL（gaussdb-pg 容器，postgres:18，库 gaussdb_learn）
 * - 照片 base64 自动转存阿里云 OSS，数据库只存 URL（超大源文件走对象存储 + CDN，不再占源站带宽）
 * - 未配置 OSS 时回退本地 uploads/（兼容旧部署与本地开发）
 * - GET 读取时自动累计浏览量 views
 *
 * 环境变量：
 *   PORT                监听端口，默认 3002
 *   PGHOST/PGPORT/PGDATABASE/PGUSER/PGPASSWORD   PostgreSQL 连接（默认 127.0.0.1:5432/gaussdb_learn/postgres）
 *   OSS_REGION          OSS 地域，如 oss-cn-shenzhen；无地域属性(中国内地) bucket 填 oss-rg-china-mainland.aliyuncs.com（配置后启用 OSS 照片存储）
 *   OSS_BUCKET          OSS bucket，默认 52cv-website
 *   OSS_ACCESS_KEY_ID   RAM 子账号 AccessKey ID
 *   OSS_ACCESS_KEY_SECRET  RAM 子账号 AccessKey Secret
 *   OSS_CDN_HOST        可选，照片访问域名（如 cdn.example.com，配 CDN 时用；缺省用 bucket 默认域名）
 *
 * 端点：
 *   POST /invitation          { data: InvitationData }  → { id }
 *   GET  /invitation/:id      → { data, views }
 *   GET  /uploads/:file       → 静态图片（旧数据本地照片，兼容）
 *   GET  /health              → { ok: true }
 */
'use strict'

const http = require('http')
const crypto = require('crypto')
const path = require('path')
const fs = require('fs')
const { Pool } = require('pg')

const PORT = Number(process.env.PORT || 3002)
const ID_LEN = 8
const MAX_BODY = 100 * 1024 * 1024 // 100MB（多张照片原图 base64；nginx 侧 client_max_body_size 需同步 ≥ 该值）
const UPLOAD_DIR = path.join(__dirname, 'uploads')
const IMG_RE = /^data:image\/(png|jpe?g|gif|webp);base64,([A-Za-z0-9+/=]+)$/
const MIN_INLINE = 512 // 小于该字节的 base64 保持内联（图标等），避免碎片化
const MIME = { png: 'image/png', jpg: 'image/jpeg', gif: 'image/gif', webp: 'image/webp' }

fs.mkdirSync(UPLOAD_DIR, { recursive: true })

// ==================== 阿里云 OSS 照片存储（可选） ====================
const OSS_REGION = process.env.OSS_REGION
const OSS_BUCKET = process.env.OSS_BUCKET || '52cv-website'
const OSS_AK = process.env.OSS_ACCESS_KEY_ID
const OSS_SK = process.env.OSS_ACCESS_KEY_SECRET
// 照片访问基址：配了 CDN 用 CDN 域名；无地域属性 bucket 的 region 是 oss.aliyuncs.com（完整 endpoint），
// 默认域名为 <bucket>.oss.aliyuncs.com；常规地域为 <bucket>.<region>.aliyuncs.com
function ossBaseUrl() {
  if (process.env.OSS_CDN_HOST) return `https://${process.env.OSS_CDN_HOST}`
  if (!OSS_REGION) return null
  if (OSS_REGION.endsWith('.aliyuncs.com')) return `https://${OSS_BUCKET}.${OSS_REGION}`
  return `https://${OSS_BUCKET}.${OSS_REGION}.aliyuncs.com`
}
const OSS_PUBLIC_BASE = ossBaseUrl()

let oss = null
function initOSS() {
  if (!OSS_REGION || !OSS_AK || !OSS_SK) {
    console.warn('[invitation-api] OSS 未配置（OSS_REGION/OSS_ACCESS_KEY_ID/OSS_ACCESS_KEY_SECRET），照片回退本地 uploads/')
    return
  }
  const OSS = require('ali-oss')
  const opts = { bucket: OSS_BUCKET, accessKeyId: OSS_AK, accessKeySecret: OSS_SK }
  if (OSS_REGION.endsWith('.aliyuncs.com')) {
    // 无地域属性 bucket（如 oss-rg-china-mainland.aliyuncs.com）：SDK region 参数不允许点号，须用 endpoint
    opts.endpoint = `https://${OSS_REGION}`
  } else {
    opts.region = OSS_REGION
  }
  oss = new OSS(opts)
  console.log(`[invitation-api] OSS store: ${OSS_BUCKET}.${OSS_REGION} → ${OSS_PUBLIC_BASE}`)
}

// ==================== 存储层（PostgreSQL） ====================
const pool = new Pool({
  host: process.env.PGHOST || '127.0.0.1',
  port: Number(process.env.PGPORT || 5432),
  database: process.env.PGDATABASE || 'gaussdb_learn',
  user: process.env.PGUSER || 'postgres',
  password: process.env.PGPASSWORD || '95AfslRpWgM9056aZOIh',
  max: 10,
  connectionTimeoutMillis: 5000,
})

let store

/** 建表并初始化 store（pg 为异步，须在 listen 前完成） */
async function initStore() {
  await pool.query(
    `CREATE TABLE IF NOT EXISTS invitations (
       id TEXT PRIMARY KEY,
       data TEXT NOT NULL,
       views INTEGER NOT NULL DEFAULT 0,
       created_at BIGINT NOT NULL
     )`
  )
  store = {
    kind: 'postgres',
    set: async (id, data) => {
      await pool.query('INSERT INTO invitations (id, data, views, created_at) VALUES ($1, $2, 0, $3)', [
        id,
        data,
        Date.now(),
      ])
    },
    get: async (id) => {
      const r = await pool.query('SELECT data, views FROM invitations WHERE id = $1', [id])
      if (r.rowCount === 0) return null
      return { data: r.rows[0].data, views: r.rows[0].views || 0 }
    },
    update: async (id, data) => {
      const r = await pool.query('UPDATE invitations SET data = $1 WHERE id = $2', [data, id])
      return r.rowCount > 0
    },
    bump: async (id) => {
      const r = await pool.query('UPDATE invitations SET views = views + 1 WHERE id = $1 RETURNING views', [id])
      if (r.rowCount === 0) return null
      return r.rows[0].views
    },
  }
  console.log(
    `[invitation-api] PostgreSQL store: ${process.env.PGHOST || '127.0.0.1'}:${process.env.PGPORT || 5432}/${
      process.env.PGDATABASE || 'gaussdb_learn'
    }`
  )
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
    'Access-Control-Allow-Methods': 'GET,POST,PUT,OPTIONS',
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

/** 把照片 base64 转存（OSS 优先，未配置时落盘本地 uploads/），数据库只存 URL；小图保持内联 */
async function extractPhotos(data, id) {
  if (!Array.isArray(data.photos) || data.photos.length === 0) return
  const urls = []
  for (let i = 0; i < data.photos.length; i++) {
    const src = data.photos[i]
    const m = typeof src === 'string' ? src.match(IMG_RE) : null
    if (!m) {
      urls.push(src) // 已是 URL 或非 base64，原样保留
      continue
    }
    const ext = m[1] === 'jpeg' ? 'jpg' : m[1]
    const buf = Buffer.from(m[2], 'base64')
    if (buf.length < MIN_INLINE) {
      urls.push(src) // 小图保持内联，避免大量碎片文件
      continue
    }
    const name = `${id}-p${i}.${ext}`
    const key = `invitation/${name}`
    if (oss) {
      await oss.put(key, buf, {
        headers: {
          'Content-Type': MIME[ext],
          'Cache-Control': 'public, max-age=31536000, immutable',
        },
      })
      urls.push(`${OSS_PUBLIC_BASE}/${key}`)
    } else {
      fs.writeFileSync(path.join(UPLOAD_DIR, name), buf)
      urls.push(`/inv-api/uploads/${name}`)
    }
  }
  data.photos = urls
}

/** 删除某请柬 id 的旧照片（OSS 或本地，编辑重传前清理避免残留） */
async function removeInvPhotos(id) {
  const prefix = `invitation/${id}-p`
  try {
    if (oss) {
      // 分批列出并删除 OSS 对象
      let marker
      do {
        const r = await oss.list({ prefix, 'max-keys': 100, marker })
        const objs = (r.objects || []).filter((o) => o.name.startsWith(prefix))
        if (objs.length) await oss.deleteMulti(objs.map((o) => o.name))
        marker = r.nextMarker || null
      } while (marker)
      return
    }
    for (const f of fs.readdirSync(UPLOAD_DIR)) {
      if (f.startsWith(`${id}-p`)) fs.unlinkSync(path.join(UPLOAD_DIR, f))
    }
  } catch {
    /* ignore */
  }
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
      'Access-Control-Allow-Methods': 'GET,POST,PUT,OPTIONS',
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
      } while (await store.get(id))
      // 照片 base64 转存 OSS/本地 → 数据库只存 URL
      await extractPhotos(data, id)
      await store.set(id, JSON.stringify(data))
      return send(res, 200, { id })
    }

    // 更新请柬（编辑已生成的请柬）→ { ok, id }
    if (req.method === 'PUT' && url.pathname.startsWith('/invitation/')) {
      const id = decodeURIComponent(url.pathname.slice('/invitation/'.length))
      if (!/^[A-Za-z0-9_-]{4,32}$/.test(id)) {
        return send(res, 400, { error: 'invalid id' })
      }
      if (!(await store.get(id))) return send(res, 404, { error: 'not found' })
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
      // 清理该 id 旧照片后重新转存（避免删除/重排照片后残留旧文件）
      await removeInvPhotos(id)
      await extractPhotos(data, id)
      await store.update(id, JSON.stringify(data))
      return send(res, 200, { ok: true, id })
    }

    // 读取请柬 → { data, views }（自动累计浏览量）
    if (req.method === 'GET' && url.pathname.startsWith('/invitation/')) {
      const id = decodeURIComponent(url.pathname.slice('/invitation/'.length))
      if (!/^[A-Za-z0-9_-]{4,32}$/.test(id)) {
        return send(res, 400, { error: 'invalid id' })
      }
      const row = await store.get(id)
      if (!row) return send(res, 404, { error: 'not found' })
      const views = await store.bump(id)
      return send(res, 200, { data: JSON.parse(row.data), views })
    }

    send(res, 404, { error: 'not found' })
  } catch (e) {
    send(res, 500, { error: 'internal error', detail: String(e && e.message || e) })
  }
})

initOSS()
initStore()
  .then(() => {
    server.listen(PORT, () => {
      console.log(`[invitation-api] listening on :${PORT} (store=${store.kind}, photos=${oss ? 'oss' : 'local'})`)
    })
  })
  .catch((e) => {
    console.error(`[invitation-api] PostgreSQL init failed: ${e.message}`)
    process.exit(1)
  })
