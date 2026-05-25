export default function HUD({ hoveredIdx }) {
  const label = hoveredIdx !== null ? String(hoveredIdx + 1).padStart(2, '0') : '01'

  return (
    <div className="hud">
      <div className="hud-eyebrow">In view —</div>
      <div className="hud-now">{label}</div>
      <div className="hud-hint">Drag · scroll · click any piece</div>
    </div>
  )
}
