import { useState, useEffect } from 'react';

const TYPE_TO_LETTER = {
  king:'K', queen:'Q', rook:'R', bishop:'B', knight:'N', pawn:'P',
};

let _currentSet = 'cburnett';
try {
  const s = localStorage.getItem('chess-piece-set');
  if (s && ['cburnett','alpha','merida'].includes(s)) _currentSet = s;
} catch (e) {}

export function getPieceSet() { return _currentSet; }
export function setPieceSet(s) {
  _currentSet = s;
  try { localStorage.setItem('chess-piece-set', s); } catch (e) {}
  window.dispatchEvent(new CustomEvent('piece-set-changed', { detail: s }));
}

export function pieceSrc(type, color, set = _currentSet) {
  return `pieces/${set}/${color}${TYPE_TO_LETTER[type]}.svg`;
}

export default function ChessPiece({ type, color, size = 64 }) {
  const [, force] = useState(0);
  useEffect(() => {
    const h = () => force(n => n + 1);
    window.addEventListener('piece-set-changed', h);
    return () => window.removeEventListener('piece-set-changed', h);
  }, []);

  return (
    <img
      src={pieceSrc(type, color)}
      alt={`${color}${TYPE_TO_LETTER[type]}`}
      draggable={false}
      width={size}
      height={size}
      style={{
        display: 'block',
        width: size, height: size,
        filter: 'drop-shadow(0 1.5px 1.5px rgba(0,0,0,0.28))',
        userSelect: 'none',
        pointerEvents: 'none',
      }}
    />
  );
}
