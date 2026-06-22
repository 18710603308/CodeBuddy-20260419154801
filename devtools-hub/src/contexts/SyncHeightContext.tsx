import { createContext, useContext } from 'react'

/**
 * 同步高度 Context
 * 用于 DiffTool / CodeMergeTool 等需要左右两个面板同步高度的场景
 */
export interface SyncHeightContextValue {
  syncedHeight: number
  setSyncedHeight: (h: number) => void
}

export const SyncHeightContext = createContext<SyncHeightContextValue | null>(null)

export const useSyncHeight = () => {
  const ctx = useContext(SyncHeightContext)
  if (!ctx) throw new Error('useSyncHeight must be used within SyncHeightProvider')
  return ctx
}
