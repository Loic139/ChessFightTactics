import { T, FONTS } from '../theme.js';
import { LEVELS } from '../levels.js';
import ChessPiece from './ChessPiece.jsx';

const DECO_PIECES = [
  { type: 'queen',  color: 'w', x: 14, y: 18, rot: -12, scale: 1.3 },
  { type: 'knight', color: 'b', x: 72, y: 12, rot: 8,   scale: 1.1 },
  { type: 'rook',   color: 'w', x: 6,  y: 52, rot: -6,  scale: 0.9 },
  { type: 'bishop', color: 'b', x: 78, y: 55, rot: 10,  scale: 0.95 },
  { type: 'pawn',   color: 'w', x: 20, y: 72, rot: -4,  scale: 0.8 },
  { type: 'pawn',   color: 'b', x: 68, y: 70, rot: 5,   scale: 0.8 },
];

export default function HomeScreen({ gameState, profile, onPlay }) {
  const level = LEVELS[Math.min(gameState.levelIdx, LEVELS.length - 1)];
  const winRate = profile.gamesPlayed > 0
    ? Math.round((profile.wins / profile.gamesPlayed) * 100)
    : null;

  return (
    <div style={{
      width: '100%', height: '100%',
      display: 'flex', flexDirection: 'column',
      background: T.bg, color: T.text, fontFamily: FONTS.sans,
      overflowY: 'auto',
    }}>
      {/* Hero area */}
      <div style={{
        flex: 1, position: 'relative',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: '32px 24px 20px',
        overflow: 'hidden', minHeight: 260,
      }}>
        {/* Decorative pieces */}
        {DECO_PIECES.map((p, i) => (
          <div key={i} style={{
            position: 'absolute',
            left: `${p.x}%`, top: `${p.y}%`,
            transform: `rotate(${p.rot}deg) scale(${p.scale})`,
            opacity: 0.12,
            pointerEvents: 'none',
          }}>
            <ChessPiece type={p.type} color={p.color} size={48} />
          </div>
        ))}

        {/* Logo */}
        <div style={{ textAlign: 'center', position: 'relative', zIndex: 1 }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            width: 72, height: 72, borderRadius: 20,
            background: `linear-gradient(135deg, ${T.accentBg}, ${T.accent33})`,
            border: `1.5px solid ${T.accent44}`,
            boxShadow: `0 0 40px rgba(125,216,125,0.15)`,
            marginBottom: 16,
          }}>
            <ChessPiece type="king" color="w" size={44} />
          </div>

          <div style={{ fontSize: 10, letterSpacing: 3, color: T.textMuted, fontFamily: FONTS.mono, marginBottom: 4 }}>
            CHESS FIGHT
          </div>
          <div style={{
            fontSize: 34, fontWeight: 800, letterSpacing: -1,
            background: `linear-gradient(180deg, ${T.text} 0%, ${T.textDim} 100%)`,
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            marginBottom: 8,
          }}>
            Tactics
          </div>
          <div style={{ fontSize: 13, color: T.textMuted, lineHeight: 1.5, maxWidth: 240 }}>
            Constituez votre armée, déjouez le roi adverse.
          </div>
        </div>
      </div>

      {/* Stats strip */}
      {profile.gamesPlayed > 0 && (
        <div style={{
          margin: '0 16px',
          padding: '12px 16px',
          background: T.panel,
          borderRadius: 14,
          border: `1px solid ${T.border}`,
          display: 'flex', justifyContent: 'space-around',
          flexShrink: 0,
        }}>
          <StatPill label="Parties" value={profile.gamesPlayed} />
          <div style={{ width: 1, background: T.border }} />
          <StatPill label="Victoires" value={profile.wins} color={T.accent} />
          <div style={{ width: 1, background: T.border }} />
          <StatPill label="Taux" value={winRate != null ? `${winRate}%` : '—'} color={T.gold} />
        </div>
      )}

      {/* Level info + CTA */}
      <div style={{ padding: '16px 16px 20px', flexShrink: 0 }}>
        <div style={{
          marginBottom: 10, padding: '10px 14px',
          background: T.panel, borderRadius: 12,
          border: `1px solid ${T.border}`,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <div>
            <div style={{ fontSize: 9, letterSpacing: 2, color: T.textMuted, fontFamily: FONTS.mono }}>NIVEAU ACTUEL</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: T.text, marginTop: 2 }}>
              Niveau {level.number}
              <span style={{ fontSize: 11, color: T.textMuted, fontWeight: 400, marginLeft: 8 }}>
                {['Débutant', 'Intermédiaire', 'Avancé'][gameState.levelIdx] ?? ''}
              </span>
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 9, letterSpacing: 1, color: T.textMuted, fontFamily: FONTS.mono }}>BUDGET</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: T.gold, fontFamily: FONTS.mono }}>
              ${gameState.budget}
            </div>
          </div>
        </div>

        <button
          onClick={onPlay}
          style={{
            width: '100%', padding: '16px',
            background: `linear-gradient(180deg, ${T.accentHi}, ${T.accent})`,
            border: 'none', borderRadius: 14,
            color: T.accentText, fontWeight: 800, fontSize: 16,
            cursor: 'pointer', fontFamily: FONTS.sans,
            boxShadow: `0 4px 24px rgba(125,216,125,0.3)`,
            letterSpacing: 0.3,
          }}
        >
          ▶ Jouer
        </button>
      </div>
    </div>
  );
}

function StatPill({ label, value, color = T.text }) {
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontSize: 18, fontWeight: 800, color, fontFamily: FONTS.mono }}>{value}</div>
      <div style={{ fontSize: 9, color: T.textMuted, letterSpacing: 1, fontFamily: FONTS.mono, marginTop: 1 }}>{label.toUpperCase()}</div>
    </div>
  );
}
