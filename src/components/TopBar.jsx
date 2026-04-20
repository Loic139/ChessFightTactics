import { T, FONTS } from '../theme.js';

export default function TopBar({ level, phase, budget, onBack }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '8px 12px',
      background: T.panel,
      borderBottom: `1px solid ${T.border}`,
      flexShrink: 0,
    }}>
      <button
        onClick={onBack}
        style={{
          background: 'transparent', border: 'none',
          color: T.textDim, cursor: 'pointer',
          padding: '4px 8px 4px 0', fontSize: 22, lineHeight: 1,
        }}
      >
        ←
      </button>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 9, letterSpacing: 2, color: T.textMuted, fontFamily: FONTS.mono }}>
          NIVEAU {level} · {phase.toUpperCase()}
        </div>
      </div>
      <div style={{ textAlign: 'right' }}>
        <div style={{ fontSize: 9, color: T.textMuted, letterSpacing: 1, fontFamily: FONTS.mono }}>BUDGET</div>
        <div style={{ fontSize: 15, fontWeight: 700, color: T.gold, fontFamily: FONTS.mono }}>${budget}</div>
      </div>
    </div>
  );
}
