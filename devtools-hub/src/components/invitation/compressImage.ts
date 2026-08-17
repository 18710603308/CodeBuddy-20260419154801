/**
 * 图片压缩工具：本地文件 -> canvas 压缩 -> base64 DataURL。
 * 用于电子请柬编辑器"上传照片"，压缩后随链接分享。
 */
export function compressImage(file: File, maxSize = 900, quality = 0.74): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const img = new Image()
      img.onload = () => {
        const scale = Math.min(1, maxSize / Math.max(img.width, img.height))
        const w = Math.max(1, Math.round(img.width * scale))
        const h = Math.max(1, Math.round(img.height * scale))
        const canvas = document.createElement('canvas')
        canvas.width = w
        canvas.height = h
        const ctx = canvas.getContext('2d')
        if (!ctx) {
          reject(new Error('无法创建画布'))
          return
        }
        // 白底填充，避免透明 PNG 转 JPEG 变黑
        ctx.fillStyle = '#ffffff'
        ctx.fillRect(0, 0, w, h)
        ctx.drawImage(img, 0, 0, w, h)
        resolve(canvas.toDataURL('image/jpeg', quality))
      }
      img.onerror = () => reject(new Error('图片解析失败'))
      img.src = reader.result as string
    }
    reader.onerror = () => reject(new Error('文件读取失败'))
    reader.readAsDataURL(file)
  })
}

/** 估算 base64 字符串对应的原始大小（KB） */
export function dataUrlSizeKb(dataUrl: string): number {
  // 去掉 data:image/jpeg;base64, 前缀
  const b64 = dataUrl.slice(dataUrl.indexOf(',') + 1)
  return Math.round((b64.length * 0.75) / 1024)
}
