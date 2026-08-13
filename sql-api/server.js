/**
 * GaussDB 学习平台 · 服务器真库 SQL API
 * 提供浏览器端无法做到的"真实 PostgreSQL 服务器"验证能力
 *
 * 安全设计：
 *  - PostgreSQL 只监听 127.0.0.1，不暴露公网
 *  - /execute 使用低权限角色 gaussdb_app（密码存 .apppass）
 *  - /reset 使用 postgres 管理员（密码存 .pgpass），仅用于重建示例数据集
 *  - 单语句限制 + statement_timeout=5s，防止拖库/危险操作
 */
const express = require('express');
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

const app = express();
const PORT = process.env.PORT || 3002;

const PG_HOST = process.env.PG_HOST || '127.0.0.1';
const PG_PORT = parseInt(process.env.PG_PORT || '5432', 10);
const PG_DB = 'gaussdb_learn';

function readSecret(file) {
  try {
    return fs.readFileSync(path.join(__dirname, file), 'utf8').trim();
  } catch {
    return '';
  }
}

const ADMIN_PASS = readSecret('.pgpass'); // postgres 超级用户
const APP_PASS = readSecret('.apppass');  // 低权限应用角色

const adminPool = new Pool({
  host: PG_HOST,
  port: PG_PORT,
  database: PG_DB,
  user: 'postgres',
  password: ADMIN_PASS,
  max: 2,
  connectionTimeoutMillis: 5000,
});

const appPool = new Pool({
  host: PG_HOST,
  port: PG_PORT,
  database: PG_DB,
  user: 'gaussdb_app',
  password: APP_PASS,
  max: 5,
  connectionTimeoutMillis: 5000,
});

app.use(express.json({ limit: '256kb' }));

/* ---------- 工具：轻量单语句校验 ---------- */
// 忽略字符串字面量/注释后统计顶层分号，并记录最后一个顶层分号位置
function analyzeStatements(sql) {
  let count = 0;
  let lastSemi = -1;
  let inStr = null;
  let inLine = false;
  let inBlock = false;
  let depth = 0;
  for (let i = 0; i < sql.length; i++) {
    const c = sql[i];
    const n = sql[i + 1];
    if (inLine) {
      if (c === '\n') inLine = false;
      continue;
    }
    if (inBlock) {
      if (c === '*' && n === '/') { inBlock = false; i++; }
      continue;
    }
    if (inStr) {
      if (c === '\\') { i++; continue; }
      if (c === inStr) inStr = null;
      continue;
    }
    if (c === '-' && n === '-') { inLine = true; i++; continue; }
    if (c === '/' && n === '*') { inBlock = true; i++; continue; }
    if (c === "'" || c === '"' || c === '`') { inStr = c; continue; }
    if (c === '(') depth++;
    else if (c === ')') depth--;
    else if (c === ';' && depth <= 0) { count++; lastSemi = i; }
  }
  return { count, lastSemi };
}

// 检查片段（跳过空白与注释后）是否仍有 SQL 内容
function hasSqlToken(text) {
  let inLine = false;
  let inBlock = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    const n = text[i + 1];
    if (inLine) {
      if (c === '\n') inLine = false;
      continue;
    }
    if (inBlock) {
      if (c === '*' && n === '/') { inBlock = false; i++; }
      continue;
    }
    if (c === '-' && n === '-') { inLine = true; i++; continue; }
    if (c === '/' && n === '*') { inBlock = true; i++; continue; }
    if (!/\s/.test(c)) return true;
  }
  return false;
}

// 判断是否为多条语句（安全：每次只允许 1 条）
function isMultiple(sql) {
  const { count, lastSemi } = analyzeStatements(sql);
  if (count >= 2) return true;
  if (count === 1 && lastSemi !== -1) {
    return hasSqlToken(sql.slice(lastSemi + 1));
  }
  return false;
}

/* ---------- 接口 ---------- */

// 执行单条 SQL
app.post('/execute', async (req, res) => {
  const sql = (req.body && req.body.sql || '').trim();
  if (!sql) return res.status(400).json({ error: 'SQL 不能为空' });

  if (isMultiple(sql)) {
    return res.status(400).json({
      error: `检测到多条 SQL 语句，为安全起见每次只允许执行 1 条。多条语句请分次执行，或先「重置数据」恢复初始状态。`,
    });
  }

  const client = await appPool.connect();
  try {
    await client.query('SET statement_timeout = 5000');
    const start = Date.now();
    const result = await client.query(sql);
    const elapsedMs = Date.now() - start;
    res.json({
      columns: result.fields.map((f) => f.name),
      rows: result.rows,
      affectedRows: result.command === 'SELECT' ? null : (result.rowCount ?? 0),
      command: result.command,
      elapsedMs,
    });
  } catch (e) {
    res.status(400).json({ error: e.message });
  } finally {
    client.release();
  }
});

// 重置示例数据集（departments / jobs / employees）
app.post('/reset', async (req, res) => {
  const client = await adminPool.connect();
  try {
    await client.query('SET statement_timeout = 15000');
    const initSql = fs.readFileSync(path.join(__dirname, 'init.sql'), 'utf8');
    await client.query(initSql);
    res.json({ success: true, message: '示例数据集已重置' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  } finally {
    client.release();
  }
});

// 健康检查
app.get('/health', async (req, res) => {
  try {
    const r = await adminPool.query('SELECT version() AS v');
    const m = String(r.rows[0].v).match(/PostgreSQL (\d+\.\d+)/);
    res.json({ ok: true, version: m ? m[1] : 'unknown', database: PG_DB });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`SQL API 服务运行在端口 ${PORT} (${PG_DB} @ ${PG_HOST}:${PG_PORT})`);
});
