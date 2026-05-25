// Fetches real tattoo photos from the official Unsplash API.
// Needs VITE_UNSPLASH_ACCESS_KEY in .env. Returns null if the key is
// missing or the request fails, so callers can fall back to static photos.

const KEY = import.meta.env.VITE_UNSPLASH_ACCESS_KEY
const UTM = '?utm_source=studio_tattoo&utm_medium=referral'

export async function fetchTattooPhotos(count) {
  if (!KEY) return null

  const per = Math.max(8, Math.min(30, count | 0))
  const endpoint =
    `https://api.unsplash.com/search/photos` +
    `?query=tattoo&orientation=portrait&content_filter=high` +
    `&per_page=${per}&client_id=${KEY}`

  try {
    const res = await fetch(endpoint)
    if (!res.ok) return null
    const data = await res.json()
    const results = data?.results
    if (!Array.isArray(results) || results.length === 0) return null

    return results.map((p) => ({
      url: `${p.urls.raw}&w=768&h=1152&fit=crop&q=80`,
      author: p.user?.name || 'Unsplash',
      authorUrl: (p.user?.links?.html || 'https://unsplash.com') + UTM,
      downloadLocation: p.links?.download_location || null,
      alt: p.alt_description || 'Tatuaje',
    }))
  } catch {
    return null
  }
}

// Unsplash guideline: trigger the download endpoint when a photo is "used"
// (e.g. opened in the lightbox). Fire-and-forget, errors ignored.
export function triggerUnsplashDownload(downloadLocation) {
  if (!KEY || !downloadLocation) return
  fetch(`${downloadLocation}&client_id=${KEY}`).catch(() => {})
}
