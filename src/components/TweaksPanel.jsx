const ACCENT_SWATCHES = ['#e94560', '#f0a8a8', '#e6c46a', '#7ec4a8', '#f4f4f1']

export default function TweaksPanel({ open, state, onClose, onAccent, onFloat, onDensity }) {
  return (
    <aside className={`tweaks${open ? ' is-open' : ''}`} aria-hidden={!open}>
      <div className="tweaks-head">
        <span>Tweaks</span>
        <button onClick={onClose}>✕</button>
      </div>
      <div className="tweaks-body">
        <div className="tw-row">
          <div className="tw-label">
            <span>Accent</span>
            <span className="val">{state.accent}</span>
          </div>
          <div className="tw-swatches">
            {ACCENT_SWATCHES.map(c => (
              <button
                key={c}
                className={`tw-swatch${state.accent === c ? ' is-active' : ''}`}
                style={{ background: c }}
                onClick={() => onAccent(c)}
              />
            ))}
          </div>
        </div>

        <div className="tw-row">
          <div className="tw-label">
            <span>Float</span>
            <span className="val">{state.float.toFixed(2)}</span>
          </div>
          <input
            className="tw-range"
            type="range" min="0" max="1.2" step="0.05"
            value={state.float}
            onChange={e => onFloat(parseFloat(e.target.value))}
          />
        </div>

        <div className="tw-row">
          <div className="tw-label">
            <span>Piezas</span>
            <span className="val">{state.density}</span>
          </div>
          <input
            className="tw-range"
            type="range" min="8" max="20" step="1"
            value={state.density}
            onChange={e => onDensity(parseInt(e.target.value, 10))}
          />
        </div>
      </div>
    </aside>
  )
}
