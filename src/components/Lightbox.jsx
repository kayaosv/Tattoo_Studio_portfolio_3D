import { useRef, useEffect } from 'react'
import gsap from 'gsap'
import { DESC_LIB } from '../data/photos'
import { triggerUnsplashDownload } from '../utils/unsplash'

export default function Lightbox({ open, index, total, photos, imageUrl, onClose, onPrev, onNext }) {
  const ref = useRef()

  useEffect(() => {
    if (!ref.current) return
    if (open) {
      gsap.to(ref.current, { opacity: 1, duration: 0.38, ease: 'power2.out' })
    } else {
      gsap.to(ref.current, { opacity: 0, duration: 0.28, ease: 'power2.in' })
    }
  }, [open])

  const item = index >= 0 ? photos[index % photos.length] : null

  // Unsplash guideline: register the photo "use" when the lightbox opens.
  useEffect(() => {
    if (open && item?.downloadLocation) triggerUnsplashDownload(item.downloadLocation)
  }, [open, item])
  const avail = index >= 0 && index % 4 === 0 ? 'Reservada · esperando piel' : 'Sí · cita Q3 2026'
  const desc = index >= 0 ? DESC_LIB[index % DESC_LIB.length] : ''
  const mailto = item
    ? `mailto:hola@studiotattoo.es?subject=${encodeURIComponent('Reserva — ' + item.title)}&body=${encodeURIComponent('Hola, me interesa la pieza ' + item.title + ' (N° ' + String(index + 1).padStart(2, '0') + '). ¿Cuándo podríamos vernos?')}`
    : '#'

  return (
    <div
      ref={ref}
      className={`lightbox${open ? ' is-open' : ''}`}
      role="dialog"
      aria-modal="true"
      aria-hidden={!open}
      onClick={(e) => e.target === ref.current && onClose()}
    >
      {item && (
        <>
          <div className="lb-head">
            <div className="col">
              <span className="lb-eyebrow">N° {String(index + 1).padStart(2, '00')} / {String(total).padStart(2, '00')}</span>
              <span className="lb-h">{item.title}</span>
            </div>
            <div className="col center">
              <span className="lb-eyebrow">Studio Tattoo · Flash</span>
            </div>
            <div className="col end">
              <button className="lb-close" onClick={onClose} aria-label="Cerrar">✕</button>
            </div>
          </div>

          <div className="lb-body">
            <div className="lb-stage">
              <img className="lb-img" src={imageUrl} alt={item.title} />
            </div>
            <div className="lb-meta">
              <h2>
                {item.title.split(' ').map((w, k) =>
                  k === 1
                    ? <span key={k}><span className="ink-accent">·</span> {w} </span>
                    : <span key={k}>{w} </span>
                )}
              </h2>
              <p>{desc}</p>
              <dl>
                <dt>Estilo</dt><dd>{item.style}</dd>
                <dt>Artista</dt><dd>{item.artist}</dd>
                <dt>Tamaño</dt><dd>{item.size}</dd>
                <dt>Sesión</dt><dd>{item.session}</dd>
                <dt>Disponible</dt><dd>{avail}</dd>
              </dl>
              <a className="lb-cta" href={mailto}>
                <span>Reservar esta pieza</span><span className="arrow">→</span>
              </a>
            </div>
          </div>

          <div className="lb-foot">
            <span>
              {item.style.split(' · ')[0]} · {item.year}
              {item.author && (
                <> · Imagen <a className="lb-credit" href={item.authorUrl} target="_blank" rel="noreferrer">{item.author}</a> / Unsplash</>
              )}
            </span>
            <div className="lb-nav">
              <button onClick={onPrev}>← Prev</button>
              <span className="sep">·</span>
              <button onClick={onNext}>Next →</button>
            </div>
            <span>Esc to close</span>
          </div>
        </>
      )}
    </div>
  )
}
