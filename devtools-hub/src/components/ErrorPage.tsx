import { useRouteError } from 'react-router-dom'
import { useNavigate } from 'react-router-dom'

export function ErrorPage() {
  const error = useRouteError() as { statusCode?: number; message?: string }
  const navigate = useNavigate()
  
  const getErrorMessage = () => {
    if (error?.statusCode === 404) {
      return {
        title: '页面找不到',
        subtitle: '您访问的页面不存在',
        description: '可能是链接有误，或者该页面已被移除',
        emoji: '🔍',
      }
    } else if (error?.statusCode === 500) {
      return {
        title: '服务器错误',
        subtitle: '服务器遇到了一些问题',
        description: '我们正在努力修复，请稍后重试',
        emoji: '💥',
      }
    } else {
      return {
        title: '出了点小问题',
        subtitle: '意外的错误发生了',
        description: '请刷新页面重试，或联系管理员',
        emoji: '😕',
      }
    }
  }
  
  const errorInfo = getErrorMessage()

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex flex-col items-center justify-center p-4">
      <div className="text-center max-w-md">
        {/* 错误图标 */}
        <div className="text-8xl mb-6 animate-bounce">
          {errorInfo.emoji}
        </div>
        
        {/* 错误标题 */}
        <h1 className="text-3xl font-bold text-white mb-2">
          {errorInfo.title}
        </h1>
        
        {/* 错误状态码 */}
        {error?.statusCode && (
          <div className="text-6xl font-bold text-red-500/30 mb-4">
            {error.statusCode}
          </div>
        )}
        
        {/* 错误副标题 */}
        <p className="text-xl text-gray-300 mb-4">
          {errorInfo.subtitle}
        </p>
        
        {/* 错误描述 */}
        <p className="text-gray-400 mb-8">
          {errorInfo.description}
        </p>
        
        {/* 操作按钮 */}
        <div className="flex flex-col gap-3">
          <button
            onClick={() => navigate(-1)}
            className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
          >
            ← 返回上一页
          </button>
          <button
            onClick={() => navigate('/')}
            className="w-full px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white font-semibold rounded-lg transition-colors"
          >
            🏠 返回首页
          </button>
        </div>
        
        {/* 调试信息 */}
        {error?.message && (
          <div className="mt-8 p-4 bg-gray-800/50 rounded-lg text-left">
            <p className="text-gray-500 text-sm font-mono">
              {error.message}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
