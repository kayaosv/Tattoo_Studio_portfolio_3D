import { useState, useEffect, useMemo, useCallback } from 'react'
import { PHOTOS } from './data/photos'
import { fetchTattooPhotos } from './utils/unsplash'
import Scene from './components/Scene'
import Nav from './components/Nav'
import HUD from './components/HUD'
import Loader from './components/Loader'
import Lightbox from './components/Lightbox'
import TweaksPanel from './components/TweaksPanel'

export default function App() {
  const [accent, setAccent] = useState('#e94560')
  const [floatVal, setFloatVal] = useState(0.75)
  const [density, setDensity] = useState(20)
  const [hoveredIdx, setHoveredIdx] = useState(null)
  const [lightbox, setLightbox] = useState({ open: false, index: -1 })
  const [loaded, setLoaded] = useState(false)
  const [tweaksOpen, setTweaksOpen] = useState(false)
  const [photos, setPhotos] = useState(PHOTOS)

  const sceneState = useMemo(() => ({
    accent, float: floatVal, density,
  }), [accent, floatVal, density])

  // Fetch real tattoo photos from Unsplash; keep curated studio metadata,
  // override only the image url + photographer credit. Falls back to static PHOTOS.
  useEffect(() => {
    let cancelled = false
    fetchTattooPhotos(PHOTOS.length).then((shots) => {
      if (cancelled || !shots) return
      setPhotos(PHOTOS.map((p, i) => {
        const shot = shots[i % shots.length]
        return {
          ...p,
          url: shot.url,
          author: shot.author,
          authorUrl: shot.authorUrl,
          downloadLocation: shot.downloadLocation,
        }
      }))
    })
    return () => { cancelled = true }
  }, [])

  const handleOpenLightbox = useCallback((index) => {
    setLightbox({ open: true, index })
  }, [])

  function closeLightbox() {
    setLightbox({ open: false, index: -1 })
  }

  function navigateLightbox(dir) {
    setLightbox(prev => {
      if (prev.index < 0) return prev
      return { open: true, index: (prev.index + dir + density) % density }
    })
  }

  useEffect(() => {
    function onKey(e) {
      if (lightbox.open) {
        if (e.key === 'Escape') closeLightbox()
        else if (e.key === 'ArrowLeft') navigateLightbox(-1)
        else if (e.key === 'ArrowRight') navigateLightbox(+1)
      } else {
        if (e.key === 't') setTweaksOpen(v => !v)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [lightbox.open, density])

  useEffect(() => {
    document.documentElement.style.setProperty('--accent', accent)
  }, [accent])

  return (
    <>
      <Loader loaded={loaded} />

      <Scene
        state={sceneState}
        photos={photos}
        onHoverCard={setHoveredIdx}
        onClickCard={handleOpenLightbox}
        onLoaded={() => setLoaded(true)}
      />

      <div className="vignette" />
      <div className="grain" />

      <div className="rail rail-left">
        Flash 01 — {density}<span className="accent-stroke">/</span>Selected, 2021 — present
      </div>
      <div className="rail rail-right">
        Calle Feria 27, Sevilla<span className="accent-stroke">/</span>By appointment only
      </div>

      <div className="wordmark">
        <span>STUDIO TATTOO</span><span className="dot-accent">.</span>
      </div>
      <div className="wordmark-sub">Tattoo · Sevilla · MMXXVI</div>

      <Nav />
      <HUD hoveredIdx={hoveredIdx} />

      <Lightbox
        open={lightbox.open}
        index={lightbox.index}
        total={density}
        photos={photos}
        imageUrl={photos[lightbox.index]?.url || ''}
        onClose={closeLightbox}
        onPrev={() => navigateLightbox(-1)}
        onNext={() => navigateLightbox(+1)}
      />

      <TweaksPanel
        open={tweaksOpen}
        state={{ accent, float: floatVal, density }}
        onClose={() => setTweaksOpen(false)}
        onAccent={setAccent}
        onFloat={setFloatVal}
        onDensity={setDensity}
      />
    </>
  )
}
