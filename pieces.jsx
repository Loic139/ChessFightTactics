// Piece renderer — loads SVG files from /pieces/<set>/<color><PIECE>.svg
// Available sets (freely licensed, sourced from lichess-org/lila):
//   - cburnett  (Colin M.L. Burnett, CC-BY-SA-3.0) — the classic lichess default
//   - merida    (Armando Hernández Marroquin)       — tournament-style
//   - alpha     (Eric Bentzen)                      — bold, blocky silhouette

const PIECE_SETS = ['cburnett', 'merida', 'alpha'];
const PIECE_SET_LABELS = {
  cburnett: 'Cburnett',
  merida:   'Merida',
  alpha:    'Alpha',
};

// Current set (module-level so tweaks can flip it without prop drilling)
let _currentSet = 'cburnett';
try {
  const s = localStorage.getItem('chess-piece-set');
  if (s && PIECE_SETS.includes(s)) _currentSet = s;
} catch (e) {}

function getPieceSet() { return _currentSet; }
function setPieceSet(s) {
  if (!PIECE_SETS.includes(s)) return;
  _currentSet = s;
  try { localStorage.setItem('chess-piece-set', s); } catch (e) {}
  // Notify listeners so every <ChessPiece> re-reads the new set.
  window.dispatchEvent(new CustomEvent('piece-set-changed', { detail: s }));
}

const TYPE_TO_LETTER = {
  king: 'K', queen: 'Q', rook: 'R',
  bishop: 'B', knight: 'N', pawn: 'P',
};

function pieceSrc(type, color, set = _currentSet) {
  const letter = TYPE_TO_LETTER[type.toLowerCase()];
  return `pieces/${set}/${color}${letter}.svg`;
}

function ChessPiece({ type, color, size = 64, style = {} }) {
  // Subscribe to set changes so every piece updates when the tweak flips.
  const [, force] = React.useState(0);
  React.useEffect(() => {
    const h = () => force(n => n + 1);
    window.addEventListener('piece-set-changed', h);
    return () => window.removeEventListener('piece-set-changed', h);
  }, []);

  const src = pieceSrc(type, color);
  return (
    <img
      src={src}
      alt={`${color}${TYPE_TO_LETTER[type.toLowerCase()]}`}
      draggable={false}
      width={size}
      height={size}
      style={{
        display: 'block',
        width: size,
        height: size,
        filter: 'drop-shadow(0 1.5px 1.5px rgba(0,0,0,0.28))',
        userSelect: 'none',
        pointerEvents: 'none',
        ...style,
      }}
    />
  );
}

function fenCharToPiece(fc) {
  const map = { p: 'pawn', n: 'knight', b: 'bishop', r: 'rook', q: 'queen', k: 'king' };
  const lower = fc.toLowerCase();
  return { type: map[lower], color: fc === lower ? 'b' : 'w' };
}

Object.assign(window, {
  ChessPiece, fenCharToPiece,
  PIECE_SETS, PIECE_SET_LABELS,
  getPieceSet, setPieceSet, pieceSrc,
});
