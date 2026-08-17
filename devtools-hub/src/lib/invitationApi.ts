import { DEFAULT_INVITATION } from '../data/invitation'
import type { InvitationData } from '../data/invitation'

/**
 * 电子请柬短链接 API 封装。
 * 后端：invitation-api（/inv-api/ 由 vite / nginx 代理到 :3002）
 */

const API_BASE = '/inv-api'

/** 保存请柬数据到数据库，返回短 ID */
export async function saveInvitation(data: InvitationData): Promise<string> {
  const res = await fetch(`${API_BASE}/invitation`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ data }),
  })
  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as { error?: string }
    throw new Error(err.error || `保存失败 (${res.status})`)
  }
  const json = (await res.json()) as { id: string }
  return json.id
}

/** 通过短 ID 读取请柬数据（自动补齐缺省字段） */
export async function loadInvitation(id: string): Promise<InvitationData> {
  const res = await fetch(`${API_BASE}/invitation/${encodeURIComponent(id)}`)
  if (!res.ok) {
    if (res.status === 404) throw new Error('请柬不存在或已删除')
    throw new Error(`加载失败 (${res.status})`)
  }
  const json = (await res.json()) as { data: Partial<InvitationData> }
  return { ...DEFAULT_INVITATION, ...json.data }
}
