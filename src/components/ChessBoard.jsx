import ChessPiece from './ChessPiece.jsx';

const BOARD_THEMES = {
  green: {
    light:'#EEEED2', dark:'#769656',
    selected:'rgba(255,255,80,0.55)', lastMove:'rgba(255,255,80,0.45)',
    legalDot:'rgba(0,0,0,0.18)', legalRing:'rgba(0,0,0,0.22)',
    check:'radial-gradient(circle, rgba(255,50,50,0.85) 0%, rgba(255,50,50,0) 70%)',
    coordLight:'#B9C19B', coordDark:'#EEEED2',
  },
  wood: {
    light:'#F0D9B5', dark:'#B58863',
    selected:'rgba(255,235,80,0.55)', lastMove:'rgba(255,220,130,0.5)',
    legalDot:'rgba(0,0,0,0.22)', legalRing:'rgba(0,0,0,0.28)',
    check:'radial-gradient(circle, rgba(255,50,50,0.85) 0%, rgba(255,50,50,0) 70%)',
    coordLight:'#B58863', coordDark:'#F0D9B5',
  },
  slate: {
    light:'#DEE3E6', dark:'#788A94',
    selected:'rgba(120,200,255,0.55)', lastMove:'rgba(140,200,255,0.45)',
    legalDot:'rgba(0,0,0,0.22)', legalRing:'rgba(0,0,0,0.28)',
    check:'radial-gradient(circle, rgba(255,60,60,0.85) 0%, rgba(255,60,60,0) 70%)',
    coordLight:'#788A94', coordDark:'#DEE3E6',
  },
};

export default function ChessBoard({
  board,
  size = 360,
  theme = 'slate',
  selected = null,
  legalTargets = [],
  lastMove = null,
  checkSquare = null,
  canDrag = () => false,
  onSquareClick = () => {},
  onDropOnSquare = () => {},
  accepts = () => true,
  hoverSq,
  setHoverSq = () => {},
}) {
  const TH = BOARD_THEMES[theme] || BOARD_THEMES.slate;
  const cell = size / 8;

  const squares = [];
  for (let r = 7; r >= 0; r--) {
    for (let f = 0; f < 8; f++) {
      const sq = r * 8 + f;
      const isLight = (r + f) % 2 === 1;
      const isSelected = selected === sq;
      const isLegal = legalTargets.includes(sq);
      const hasPiece = !!board[sq];
      const isLast = lastMove && (lastMove.from === sq || lastMove.to === sq);
      const isCheck = checkSquare === sq;
      const isHover = hoverSq === sq;
      const showFile = r === 0;
      const showRank = f === 0;

      squares.push(
        <div
          key={sq}
          data-board-sq={sq}
          onClick={() => onSquareClick(sq)}
          onDragOver={(e) => { e.preventDefault(); setHoverSq(sq); }}
          onDragLeave={() => setHoverSq(null)}
          onDrop={(e) => {
            e.preventDefault();
            setHoverSq(null);
            try {
              const data = JSON.parse(e.dataTransfer.getData('application/json') || '{}');
              if (accepts(sq, data)) onDropOnSquare(sq, data);
            } catch (_) {}
          }}
          style={{
            position: 'absolute',
            left: f * cell, top: (7 - r) * cell,
            width: cell, height: cell,
            background: isLight ? TH.light : TH.dark,
            cursor: 'pointer', userSelect: 'none', boxSizing: 'border-box',
          }}
        >
          {isLast && <div style={{ position:'absolute', inset:0, background:TH.lastMove, pointerEvents:'none' }} />}
          {isSelected && <div style={{ position:'absolute', inset:0, background:TH.selected, pointerEvents:'none' }} />}
          {isCheck && <div style={{ position:'absolute', inset:0, background:TH.check, pointerEvents:'none' }} />}
          {isHover && <div style={{ position:'absolute', inset:0, boxShadow:'inset 0 0 0 3px rgba(255,255,255,0.85)', pointerEvents:'none' }} />}
          {isLegal && !hasPiece && (
            <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center', pointerEvents:'none' }}>
              <div style={{ width:cell*0.32, height:cell*0.32, borderRadius:'50%', background:TH.legalDot }} />
            </div>
          )}
          {isLegal && hasPiece && (
            <div style={{ position:'absolute', inset:0, boxShadow:`inset 0 0 0 ${cell*0.08}px ${TH.legalRing}`, borderRadius:2, pointerEvents:'none' }} />
          )}
          {showFile && (
            <div style={{ position:'absolute', bottom:1, right:3, fontSize:cell*0.2, fontWeight:700, color:isLight?TH.coordLight:TH.coordDark, pointerEvents:'none' }}>
              {String.fromCharCode(97 + f)}
            </div>
          )}
          {showRank && (
            <div style={{ position:'absolute', top:1, left:3, fontSize:cell*0.2, fontWeight:700, color:isLight?TH.coordLight:TH.coordDark, pointerEvents:'none' }}>
              {r + 1}
            </div>
          )}
        </div>
      );
    }
  }

  const pieces = Object.entries(board).map(([k, p]) => {
    const sq = +k;
    const f = sq % 8, r = sq >> 3;
    const draggable = canDrag(sq);
    const isSelected = selected === sq;

    return (
      <div
        key={`p-${sq}`}
        draggable={draggable}
        onDragStart={(e) => {
          e.dataTransfer.effectAllowed = 'move';
          e.dataTransfer.setData('application/json', JSON.stringify({ fromSq: sq }));
        }}
        onDragOver={(e) => { e.preventDefault(); setHoverSq(sq); }}
        onDragLeave={() => setHoverSq(null)}
        onDrop={(e) => {
          e.preventDefault();
          setHoverSq(null);
          try {
            const data = JSON.parse(e.dataTransfer.getData('application/json') || '{}');
            if (accepts(sq, data)) onDropOnSquare(sq, data);
          } catch (_) {}
        }}
        onClick={(e) => { e.stopPropagation(); onSquareClick(sq); }}
        style={{
          position: 'absolute',
          left: f * cell, top: (7 - r) * cell,
          width: cell, height: cell,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: draggable ? 'grab' : 'pointer',
          transform: isSelected ? 'scale(1.05)' : 'scale(1)',
          filter: isSelected ? 'drop-shadow(0 4px 8px rgba(0,0,0,0.4))' : 'none',
          zIndex: isSelected ? 3 : 2,
          transition: 'left 0.15s ease, top 0.15s ease',
        }}
      >
        <ChessPiece type={p.type} color={p.color} size={cell * 0.88} />
      </div>
    );
  });

  return (
    <div style={{
      position: 'relative',
      width: size, height: size,
      boxShadow: '0 18px 40px rgba(0,0,0,0.45), inset 0 2px 0 rgba(255,255,255,0.08)',
      borderRadius: 6,
      overflow: 'hidden',
      flexShrink: 0,
    }}>
      {squares}
      {pieces}
    </div>
  );
}
