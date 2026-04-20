import { T, FONTS } from '../theme.js';
import { LEVELS } from '../levels.js';
import ChessPiece from './ChessPiece.jsx';

const LEVEL_META = [
  {
    label: 'Débutant',
    desc: 'Un roi et 4 pions. Apprenez les bases.',
    pieces: [{ type: 'pawn', color: 'b' }, { type: 'king', color: 'b' }],
    color: T.accent, c18: T.accent18, c33: T.accent33, c44: T.accent44,
  },
  {
    label: 'Intermédiaire',
    desc: 'Tours et rangée de pions. Contrôle du centre.',
    pieces: [{ type: 'rook', color: 'b' }, { type: 'pawn', color: 'b' }],
    color: T.gold, c18: T.gold18, c33: T.gold33, c44: T.gold44,
  },
  {
    label: 'Avancé',
    desc: 'Armée complète. Chaque pièce compte.',
    pieces: [{ type: 'queen', color: 'b' }, { type: 'knight', color: 'b' }],
    color: T.danger, c18: T.danger18, c33: T.danger33, c44: T.danger44,
  },
];

export default function ChallengeScreen({ profile, onPlayLevel }) {
  return (
    <div style={{
      width: '100%', height: '100%',
      display: 'flex', flexDirection: 'column',
      background: T.bg, color: T.text, fontFamily: FONTS.sans,
      overflowY: 'auto',
    }}>
      {/* Header */}
      <div style={{
        padding: '20px 16px 12px',
        borderBottom: `1px solid ${T.border}`,
        flexShrink: 0,
      }}>
        <div style={{ fontSize: 9, letterSpacing: 3, color: T.textMuted, fontFamily: FONTS.mono }}>SÉLECTION</div>
        <div style={{ fontSize: 24, fontWeight: 800, marginTop: 2, letterSpacing: -0.5 }}>Défis</div>
        <div style={{ fontSize: 12, color: T.textMuted, marginTop: 4 }}>
          Choisissez un niveau pour commencer une nouvelle partie.
        </div>
      </div>

      {/* Level cards */}
      <div style={{ flex: 1, padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {LEVELS.map((level, idx) => {
          const meta = LEVEL_META[idx];
          const isCompleted = profile.levelsCompleted.includes(idx);
          const isUnlocked = idx === 0 || profile.levelsCompleted.includes(idx - 1);
          return (
            <LevelCard
              key={idx}
              level={level}
              meta={meta}
              idx={idx}
              isCompleted={isCompleted}
              isUnlocked={isUnlocked}
              onPlay={() => onPlayLevel(idx)}
            />
          );
        })}
      </div>
    </div>
  );
}

function LevelCard({ level, meta, idx, isCompleted, isUnlocked, onPlay }) {
  return (
    <div style={{
      background: T.panel,
      border: `1px solid ${isUnlocked ? meta.color + '33' : T.border}`,
      borderRadius: 16,
      padding: '16px',
      opacity: isUnlocked ? 1 : 0.45,
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Background accent */}
      {isUnlocked && (
        <div style={{
          position: 'absolute', right: -20, top: -20,
          width: 100, height: 100,
          background: `radial-gradient(circle, ${meta.c18} 0%, transparent 70%)`,
          pointerEvents: 'none',
        }} />
      )}

      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
        {/* Level badge */}
        <div style={{
          width: 44, height: 44, borderRadius: 12, flexShrink: 0,
          background: isUnlocked ? meta.c18 : T.glass,
          border: `1.5px solid ${isUnlocked ? meta.c44 : T.border}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <span style={{ fontSize: 16, fontWeight: 800, color: meta.color, fontFamily: FONTS.mono }}>
            {level.number}
          </span>
        </div>

        {/* Info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
            <span style={{ fontSize: 15, fontWeight: 700, color: T.text }}>{meta.label}</span>
            {isCompleted && (
              <span style={{
                fontSize: 9, letterSpacing: 1, fontFamily: FONTS.mono, fontWeight: 700,
                color: T.accent, background: T.accent18,
                padding: '2px 7px', borderRadius: 6,
              }}>RÉUSSI</span>
            )}
            {!isUnlocked && (
              <span style={{
                fontSize: 9, letterSpacing: 1, fontFamily: FONTS.mono, fontWeight: 700,
                color: T.textMuted, background: T.glass,
                padding: '2px 7px', borderRadius: 6,
              }}>VERROUILLÉ</span>
            )}
          </div>
          <div style={{ fontSize: 12, color: T.textMuted, lineHeight: 1.4 }}>{meta.desc}</div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 8 }}>
            <div style={{ display: 'flex', gap: 4 }}>
              {meta.pieces.map((p, i) => (
                <div key={i} style={{ opacity: 0.7 }}>
                  <ChessPiece type={p.type} color={p.color} size={20} />
                </div>
              ))}
            </div>
            <div style={{ fontSize: 11, color: T.textMuted }}>
              Budget de départ :
              <span style={{ color: T.gold, fontWeight: 700, fontFamily: FONTS.mono, marginLeft: 4 }}>
                ${level.bonus}
              </span>
            </div>
          </div>
        </div>

        {/* Difficulty dots */}
        <div style={{ display: 'flex', gap: 3, paddingTop: 2 }}>
          {[0, 1, 2].map(i => (
            <div key={i} style={{
              width: 6, height: 6, borderRadius: 3,
              background: i <= idx ? meta.color : T.glassMid,
            }} />
          ))}
        </div>
      </div>

      {isUnlocked && (
        <button
          onClick={onPlay}
          style={{
            marginTop: 14, width: '100%', padding: '10px',
            background: meta.c18,
            border: `1px solid ${meta.c33}`,
            borderRadius: 10,
            color: meta.color, fontWeight: 700, fontSize: 13,
            cursor: 'pointer', fontFamily: FONTS.sans,
          }}
        >
          {isCompleted ? 'Rejouer' : 'Commencer'}
        </button>
      )}
    </div>
  );
}
