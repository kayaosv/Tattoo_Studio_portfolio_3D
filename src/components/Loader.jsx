import { useRef, useEffect } from 'react'
import gsap from 'gsap'

export default function Loader({ loaded }) {
  const ref = useRef()

  useEffect(() => {
    if (loaded && ref.current) {
      gsap.to(ref.current, {
        opacity: 0,
        duration: 0.6,
        ease: 'power2.inOut',
        onComplete: () => {
          if (ref.current) ref.current.style.display = 'none'
        },
      })
    }
  }, [loaded])

  return (
    <div ref={ref} className="loader">
      <div className="loader-inner">
        <div className="loader-title">Studio Tattoo</div>
        <div className="loader-sub">Sevilla · Loading flash</div>
        <div className="loader-bar" />
      </div>
    </div>
  )
}
