import sharp from 'sharp'
import { createClient } from '@supabase/supabase-js'

/**
 * Download image from URL, resize to 1200x630 WebP, upload to Supabase Storage.
 * Returns the public URL of the uploaded image.
 */
export async function downloadAndUpload(
  imageUrl: string,
  slug: string,
  projectSupabaseUrl: string,
  projectServiceKey: string,
  storageBucket: string = 'images'
): Promise<string> {
  // Download image
  const response = await fetch(imageUrl)
  if (!response.ok) {
    throw new Error(`Failed to download image: ${response.statusText}`)
  }

  const arrayBuffer = await response.arrayBuffer()
  const inputBuffer = Buffer.from(arrayBuffer)

  // Resize to 1200x630 WebP with sharp
  const outputBuffer = await sharp(inputBuffer)
    .resize(1200, 630, { fit: 'cover' })
    .webp({ quality: 85 })
    .toBuffer()

  // Upload to Supabase Storage
  const supabase = createClient(projectSupabaseUrl, projectServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  const filePath = `blog-covers/${slug}.webp`

  const { error: uploadError } = await supabase.storage
    .from(storageBucket)
    .upload(filePath, outputBuffer, {
      contentType: 'image/webp',
      upsert: true,
    })

  if (uploadError) {
    throw new Error(`Failed to upload image: ${uploadError.message}`)
  }

  // Get public URL
  const { data: urlData } = supabase.storage
    .from(storageBucket)
    .getPublicUrl(filePath)

  return urlData.publicUrl
}
