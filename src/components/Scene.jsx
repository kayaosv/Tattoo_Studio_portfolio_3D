import { useRef, useEffect, useMemo } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'

// Solid placeholder colors shown while each photo streams in (paper tones).
const PLACEHOLDER_COLORS = [0xecead8, 0x1f1f23, 0x0a0a0c]

const CARD_W = 1.4
const CARD_H = 2.1

function lerp(a, b, t) { return a + (b - a) * t }
function damp(cur, target, lambda, dt) {
  return cur + (target - cur) * (1 - Math.exp(-lambda * dt))
}

function spiralTargetsFor(n) {
  const out = []
  const radius = 4.6, perTurn = 7, stepY = 0.62
  const totalH = (n - 1) * stepY
  const startY = -totalH / 2
  for (let i = 0; i < n; i++) {
    const angle = (i / perTurn) * Math.PI * 2 + Math.PI / 6
    const r = radius + Math.sin(i * 0.7) * 0.25 + Math.cos(i * 0.31) * 0.18
    out.push({
      pos: new THREE.Vector3(Math.cos(angle) * r, startY + i * stepY, Math.sin(angle) * r),
      rot: new THREE.Euler(Math.cos(i * 1.3) * 0.06, -angle + Math.PI / 2, Math.sin(i * 1.7) * 0.08),
    })
  }
  return out
}


function Gallery({ state, photos, onHoverCard, onClickCard, onLoaded }) {
  const { camera, gl, scene } = useThree()
  const groupRef = useRef()
  const cardsRef = useRef([])
  const cardGeom = useMemo(() => new THREE.PlaneGeometry(CARD_W, CARD_H), [])

  const mouse = useRef({ x: 0, y: 0, tx: 0, ty: 0 })
  const drag = useRef({ active: false, startX: 0, startY: 0, startYaw: 0, startVOff: 0 })
  const spiralYRotTarget = useRef(0)
  const manualYOffset = useRef(0)
  const verticalOffset = useRef(0)
  const hoveredMesh = useRef(null)
  const raycaster = useRef(new THREE.Raycaster())
  const ndc = useRef(new THREE.Vector2())
  const hasLoaded = useRef(false)

  const stateRef = useRef(state)
  useEffect(() => { stateRef.current = state }, [state])

  const onHoverRef = useRef(onHoverCard)
  const onClickRef = useRef(onClickCard)
  const onLoadedRef = useRef(onLoaded)
  useEffect(() => { onHoverRef.current = onHoverCard }, [onHoverCard])
  useEffect(() => { onClickRef.current = onClickCard }, [onClickCard])
  useEffect(() => { onLoadedRef.current = onLoaded }, [onLoaded])

  useEffect(() => {
    scene.fog = new THREE.Fog(0x080808, 8, 28)
    return () => { scene.fog = null }
  }, [scene])

  // Build cards: solid paper placeholder first, then stream in the real photo texture.
  useEffect(() => {
    if (!groupRef.current) return

    const snapshot = [...cardsRef.current]
    for (const c of snapshot) {
      groupRef.current.remove(c.mesh)
      c.mesh.material.map?.dispose()
      c.mesh.material.dispose()
    }
    cardsRef.current = []

    const n = Math.max(8, Math.min(photos.length, state.density | 0))
    const spirals = spiralTargetsFor(n)
    const loader = new THREE.TextureLoader()
    loader.setCrossOrigin('anonymous')

    for (let i = 0; i < n; i++) {
      const photo = photos[i]
      const mat = new THREE.MeshBasicMaterial({
        color: PLACEHOLDER_COLORS[i % PLACEHOLDER_COLORS.length],
        side: THREE.DoubleSide, toneMapped: false,
      })
      const mesh = new THREE.Mesh(cardGeom, mat)
      mesh.userData.index = i
      groupRef.current.add(mesh)

      const card = {
        mesh, photo,
        spiral: spirals[i],
        bobPhase: Math.random() * Math.PI * 2,
        bobAmp: 0.06 + Math.random() * 0.06,
        rotPhase: Math.random() * Math.PI * 2,
        scaleX: 1.0, scaleY: 1.0,
      }
      cardsRef.current.push(card)

      loader.load(photo.url, (tex) => {
        if (mat !== mesh.material) return // material was disposed during a rebuild
        tex.colorSpace = THREE.SRGBColorSpace
        tex.anisotropy = gl.capabilities.getMaxAnisotropy()
        tex.minFilter = THREE.LinearFilter
        tex.magFilter = THREE.LinearFilter
        mat.map = tex
        mat.color.set(0xffffff)
        mat.needsUpdate = true
      })
    }

    if (!hasLoaded.current) {
      hasLoaded.current = true
      requestAnimationFrame(() => requestAnimationFrame(() => onLoadedRef.current()))
    }
  }, [state.density, photos, cardGeom, gl])

  // Pointer / wheel events
  useEffect(() => {
    function onMove(e) {
      mouse.current.tx = (e.clientX / window.innerWidth) * 2 - 1
      mouse.current.ty = (e.clientY / window.innerHeight) * 2 - 1
      if (drag.current.active) {
        manualYOffset.current = drag.current.startYaw + (e.clientX - drag.current.startX) * 0.0055
        verticalOffset.current = drag.current.startVOff + (e.clientY - drag.current.startY) * 0.012
      }
    }
    function onDown(e) {
      drag.current = {
        active: true, startX: e.clientX, startY: e.clientY,
        startYaw: manualYOffset.current, startVOff: verticalOffset.current,
      }
      document.body.classList.add('is-dragging')
    }
    function onUp(e) {
      const moved = Math.hypot(e.clientX - drag.current.startX, e.clientY - drag.current.startY)
      if (moved <= 8 && hoveredMesh.current) onClickRef.current(hoveredMesh.current.userData.index)
      drag.current.active = false
      document.body.classList.remove('is-dragging')
    }
    function onWheel(e) {
      manualYOffset.current += e.deltaY * 0.0028
      e.preventDefault()
    }
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerdown', onDown)
    window.addEventListener('pointerup', onUp)
    window.addEventListener('pointercancel', onUp)
    window.addEventListener('wheel', onWheel, { passive: false })
    return () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerdown', onDown)
      window.removeEventListener('pointerup', onUp)
      window.removeEventListener('pointercancel', onUp)
      window.removeEventListener('wheel', onWheel)
    }
  }, [])

  useFrame(({ clock }, rawDt) => {
    const dt = Math.min(0.05, rawDt)
    const t = clock.elapsedTime
    const s = stateRef.current

    mouse.current.x = damp(mouse.current.x, mouse.current.tx, 5, dt)
    mouse.current.y = damp(mouse.current.y, mouse.current.ty, 5, dt)

    // Camera parallax — always spiral position
    camera.position.x = damp(camera.position.x, mouse.current.x * 1.1, 4, dt)
    camera.position.y = damp(camera.position.y, -mouse.current.y * 0.7, 4, dt)
    camera.position.z = damp(camera.position.z, 12, 4, dt)
    camera.lookAt(0, 0, 0)

    // Spiral slow auto-rotation + drag offset
    if (!drag.current.active) spiralYRotTarget.current += dt * 0.06
    groupRef.current.rotation.y = damp(
      groupRef.current.rotation.y,
      spiralYRotTarget.current + manualYOffset.current,
      4, dt
    )

    // Per-card float animation
    for (const c of cardsRef.current) {
      const m = c.mesh
      const sp = c.spiral
      const bob = Math.sin(t * 0.9 + c.bobPhase) * c.bobAmp * s.float
      m.position.set(sp.pos.x, sp.pos.y + bob, sp.pos.z)
      m.rotation.x = sp.rot.x + Math.sin(t * 0.6 + c.rotPhase) * 0.04 * s.float
      m.rotation.y = sp.rot.y + Math.cos(t * 0.5 + c.rotPhase) * 0.04 * s.float
      m.rotation.z = sp.rot.z

      const scaleTarget = hoveredMesh.current === m ? 1.06 : 1.0
      c.scaleX = damp(c.scaleX, scaleTarget, 6, dt)
      c.scaleY = damp(c.scaleY, scaleTarget, 6, dt)
      m.scale.set(c.scaleX, c.scaleY, 1)
    }

    // Hover raycasting
    if (!drag.current.active) {
      ndc.current.set(mouse.current.tx, -mouse.current.ty)
      raycaster.current.setFromCamera(ndc.current, camera)
      const hits = raycaster.current.intersectObjects(cardsRef.current.map(c => c.mesh), false)
      const newHover = hits[0]?.object || null
      if (newHover !== hoveredMesh.current) {
        hoveredMesh.current = newHover
        document.body.classList.toggle('is-hover-card', !!newHover)
        onHoverRef.current(newHover ? newHover.userData.index : null)
      }
    }
  })

  return <group ref={groupRef} />
}

export default function Scene({ state, photos, onHoverCard, onClickCard, onLoaded }) {
  return (
    <Canvas
      style={{ position: 'fixed', inset: 0, zIndex: 1 }}
      camera={{ fov: 36, position: [0, 0, 12], near: 0.1, far: 200 }}
      gl={{ antialias: true, alpha: false }}
      onCreated={({ gl }) => {
        gl.setClearColor(0x080808, 1)
        gl.outputColorSpace = THREE.SRGBColorSpace
        gl.setPixelRatio(Math.min(window.devicePixelRatio, 2))
      }}
    >
      <ambientLight intensity={1.0} />
      <Gallery
        state={state}
        photos={photos}
        onHoverCard={onHoverCard}
        onClickCard={onClickCard}
        onLoaded={onLoaded}
      />
    </Canvas>
  )
}
