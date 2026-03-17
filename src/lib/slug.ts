export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9ก-๙-]/g, '')
}

/**
 * Convert any string to an ASCII-safe URL slug.
 * Strips non-ASCII characters (Thai etc.), normalizes dashes.
 * Falls back to a timestamp-based slug if result is empty.
 */
export function toUrlSlug(text: string): string {
  const ascii = text
    .toLowerCase()
    .replace(/[^\x00-\x7F]/g, '')
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
  return ascii || `article-${Date.now()}`
}
