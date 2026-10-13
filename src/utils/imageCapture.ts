/** Photo capture helpers for the health assistant (camera + gallery). */

export interface ChatAttachmentData {
  dataUrl: string
  name: string
  kind: 'camera' | 'photo'
}

const MAX_DIMENSION = 1024
const JPEG_QUALITY = 0.82

/** Downscales an image data URL so conversations stay small in local storage. */
export function compressImageDataUrl(
  source: string,
  maxDim = MAX_DIMENSION,
  quality = JPEG_QUALITY,
): Promise<string> {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.onload = () => {
      const scale = Math.min(1, maxDim / Math.max(image.width, image.height))
      if (scale >= 1) {
        resolve(source)
        return
      }
      const width = Math.max(1, Math.round(image.width * scale))
      const height = Math.max(1, Math.round(image.height * scale))
      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        resolve(source)
        return
      }
      ctx.drawImage(image, 0, 0, width, height)
      resolve(canvas.toDataURL('image/jpeg', quality))
    }
    image.onerror = () => reject(new Error('Could not read that image.'))
    image.src = source
  })
}

/** Reads a gallery image and returns a compressed attachment. */
export function fileToChatAttachment(file: File): Promise<ChatAttachmentData> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      reject(new Error('Choose an image file: JPG, PNG or WebP.'))
      return
    }
    const reader = new FileReader()
    reader.onload = () => {
      const dataUrl = typeof reader.result === 'string' ? reader.result : ''
      if (!dataUrl) {
        reject(new Error('Could not read that image.'))
        return
      }
      void compressImageDataUrl(dataUrl).then(
        (compressed) => resolve({ dataUrl: compressed, name: file.name, kind: 'photo' }),
        reject,
      )
    }
    reader.onerror = () => reject(new Error('Could not read that image.'))
    reader.readAsDataURL(file)
  })
}