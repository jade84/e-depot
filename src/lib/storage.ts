import { supabase } from './supabase'

// Tạo ID ngẫu nhiên — crypto.randomUUID chỉ có ở https/localhost,
// nên có fallback để chạy được khi mở qua http trên điện thoại.
function uid(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

// Nén ảnh trước khi upload (giảm dung lượng, xoay theo camera điện thoại).
async function compress(file: File, maxSize = 1280, quality = 0.82): Promise<Blob> {
  const bitmap = await createImageBitmap(file)
  let { width, height } = bitmap
  if (width > maxSize || height > maxSize) {
    const scale = maxSize / Math.max(width, height)
    width = Math.round(width * scale)
    height = Math.round(height * scale)
  }
  const canvas = document.createElement('canvas')
  canvas.width = width; canvas.height = height
  canvas.getContext('2d')!.drawImage(bitmap, 0, 0, width, height)
  return await new Promise<Blob>(res => canvas.toBlob(b => res(b!), 'image/jpeg', quality))
}

// Upload 1 ảnh → trả về public URL. Ảnh nằm trong thư mục theo userId (RLS).
export async function uploadImage(bucket: string, userId: string, file: File): Promise<string> {
  const blob = await compress(file).catch(() => file)   // lỗi nén thì dùng file gốc
  const path = `${userId}/${uid()}.jpg`
  const { error } = await supabase.storage.from(bucket).upload(path, blob, {
    contentType: 'image/jpeg', upsert: false,
  })
  if (error) throw error
  return supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl
}
