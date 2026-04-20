// ChessBoard — chess.com-inspired board with two themes, coordinates,
// last-move highlight, check highlight, legal-move dots, drag + click-to-move.

const BOARD_THEMES = {
  green: {
    light: '#EEEED2',
    dark:  '#769656',
    selected: 'rgba(255,255,80,0.55)',
    lastMove: 'rgba(255,255,80,0.45)',
    legalDot: 'rgba(0,0,0,0.18)',
    legalRing: 'rgba(0,0,0,0.22)',
    check: 'radial-gradient(circle, rgba(255,50,50,0.85) 0%, rgba(255,50,50,0) 70%)',
    coordLight: '#B9C19B',
    coordDark: '#EEEED2',
  },
  wood: {
    light: '#F0D9B5',
    dark:  '#B58863',
    selected: 'rgba(255,235,80,0.55)',
    lastMove: 'rgba(255,220,130,0.5)',
    legalDot: 'rgba(0,0,0,0.22)',
    legalRing: 'rgba(0,0,0,0.28)',
    check: 'radial-gradient(circle, rgba(255,50,50,0.85) 0%, rgba(255,50,50,0) 70%)',
    coordLight: '#B58863',
    coordDark: '#F0D9B5',
  },
  slate: {
    light: '#DEE3E6',
    dark:  '#788A94',
    selected: 'rgba(120,200,255,0.55)',
    lastMove: 'rgba(140,200,255,0.45)',
    legalDot: 'rgba(0,0,0,0.22)',
    legalRing: 'rgba(0,0,0,0.28)',
    check: 'radial-gradient(circle, rgba(255,60,60,0.85) 0%, rgba(255,60,60,0) 70%)',
    coordLight: '#788A94',
    coordDark: '#DEE3E6',
  },
};

function ChessBoard({
  board,            // { sq: {type, color} }
  size = 360,
  theme = 'green',
  selected = null,
  legalTargets = [],
  lastMove = null,  // {from, to}
  checkSquare = null,
  canDrag = () => false,
  onSquareClick = () => {},
  onDropOnSquare = () => {},  // (toSq, payload) — payload can be {fromSq} or {piece}
  accepts = () => true,       // (toSq, payload) → bool
  hoverSq,
  setHoverSq = () => {},
  orientation = 'white',      // 'white' = rank 8 on top
  showCoords = true,
}) {
  const T = BOARD_THEMES[theme] || BOARD_THEMES.green;
  const cell = size / 8;
  const boardRef = useRef(null);
  const [touchDrag, setTouchDrag] = useState(null); // { sq, x, y }

  function sqFromPoint(x, y) {
    if (!boardRef.current) return null;
    const rect = boardRef.current.getBoundingClientRect();
    const bx = x - rect.left;
    const by = y - rect.top;
    if (bx < 0 || by < 0 || bx >= size || by >= size) return null;
    const ff = Math.floor(bx / cell);
    const rr = 7 - Math.floor(by / cell);
    const f = orientation === 'white' ? ff : 7 - ff;
    const r = orientation === 'white' ? rr : 7 - rr;
    return r * 8 + f;
  }

  const squares = [];
  for (let r = 7; r >= 0; r--) {
    for (let f = 0; f < 8; f++) {
      const sq = r * 8 + f;
      const rr = orientation === 'white' ? r : 7 - r;
      const ff = orientation === 'white' ? f : 7 - f;
      const isLight = (r + f) % 2 === 1;
      const bg = isLight ? T.light : T.dark;
      const isSelected = selected === sq;
      const isLegal = legalTargets.includes(sq);
      const hasPiece = !!board[sq];
      const isLast = lastMove && (lastMove.from === sq || lastMove.to === sq);
      const isCheck = checkSquare === sq;
      const isHover = hoverSq === sq;

      // coord labels
      const showFile = rr === 0;
      const showRank = ff === 0;

      squares.push(
        <div
          key={sq}
          onClick={() => onSquareClick(sq)}
          onDragOver={(e) => { e.preventDefault(); setHoverSq(sq); }}
          onDragLeave={() => setHoverSq(null)}
          onDrop={(e) => {
            e.preventDefault();
            setHoverSq(null);
            try {
              const data = JSON.parse(e.dataTransfer.getData('application/json') || '{}');
              if (accepts(sq, data)) onDropOnSquare(sq, data);
            } catch (err) {}
          }}
          style={{
            position: 'absolute',
            left: ff * cell,
            top: (7 - rr) * cell,
            width: cell,
            height: cell,
            background: bg,
            cursor: 'pointer',
            userSelect: 'none',
            boxSizing: 'border-box',
          }}
        >
          {/* last-move tint */}
          {isLast && (
            <div style={{
              position: 'absolute', inset: 0, background: T.lastMove,
              pointerEvents: 'none',
            }} />
          )}
          {/* selection tint */}
          {isSelected && (
            <div style={{
              position: 'absolute', inset: 0, background: T.selected,
              pointerEvents: 'none',
            }} />
          )}
          {/* check glow */}
          {isCheck && (
            <div style={{
              position: 'absolute', inset: 0, background: T.check,
              pointerEvents: 'none',
            }} />
          )}
          {/* hover outline when drag-over */}
          {isHover && (
            <div style={{
              position: 'absolute', inset: 0,
              boxShadow: 'inset 0 0 0 3px rgba(255,255,255,0.85)',
              pointerEvents: 'none',
            }} />
          )}
          {/* legal move indicator */}
          {isLegal && !hasPiece && (
            <div style={{
              position: 'absolute', inset: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              pointerEvents: 'none',
            }}>
              <div style={{
                width: cell * 0.32, height: cell * 0.32,
                borderRadius: '50%',
                background: T.legalDot,
              }} />
            </div>
          )}
          {isLegal && hasPiece && (
            <div style={{
              position: 'absolute', inset: 0,
              boxShadow: `inset 0 0 0 ${cell * 0.08}px ${T.legalRing}`,
              borderRadius: 2,
              pointerEvents: 'none',
            }} />
          )}
          {/* coordinates */}
          {showCoords && showFile && (
            <div style={{
              position: 'absolute', bottom: 1, right: 3,
              fontSize: cell * 0.2,
              fontWeight: 700,
              color: isLight ? T.coordLight : T.coordDark,
              fontFamily: 'Inter, system-ui',
              pointerEvents: 'none',
            }}>{String.fromCharCode(97 + f)}</div>
          )}
          {showCoords && showRank && (
            <div style={{
              position: 'absolute', top: 1, left: 3,
              fontSize: cell * 0.2,
              fontWeight: 700,
              color: isLight ? T.coordLight : T.coordDark,
              fontFamily: 'Inter, system-ui',
              pointerEvents: 'none',
            }}>{r + 1}</div>
          )}
        </div>
      );
    }
  }

  // piece overlay (absolute-positioned so transitions look clean)
  const pieces = Object.entries(board).map(([k, p]) => {
    const sq = +k;
    const f = sq % 8, r = sq >> 3;
    const rr = orientation === 'white' ? r : 7 - r;
    const ff = orientation === 'white' ? f : 7 - f;
    const draggable = canDrag(sq);
    const isSelected = selected === sq;

    const isTouchDragging = touchDrag?.sq === sq;

    return (
      <div
        key={`p-${sq}`}
        draggable={draggable}
        onDragStart={(e) => {
          e.dataTransfer.effectAllowed = 'move';
          e.dataTransfer.setData('application/json', JSON.stringify({ fromSq: sq }));
        }}
        onClick={(e) => { e.stopPropagation(); onSquareClick(sq); }}
        onTouchStart={(e) => {
          if (!canDrag(sq)) return;
          e.preventDefault();
          const touch = e.touches[0];
          setTouchDrag({ sq, x: touch.clientX, y: touch.clientY });
          onSquareClick(sq);
        }}
        onTouchMove={(e) => {
          if (!touchDrag || touchDrag.sq !== sq) return;
          e.preventDefault();
          const touch = e.touches[0];
          const hoveredSq = sqFromPoint(touch.clientX, touch.clientY);
          setTouchDrag(prev => ({ ...prev, x: touch.clientX, y: touch.clientY }));
          if (hoveredSq !== null) setHoverSq(hoveredSq);
        }}
        onTouchEnd={(e) => {
          if (!touchDrag || touchDrag.sq !== sq) return;
          e.preventDefault();
          const touch = e.changedTouches[0];
          const toSq = sqFromPoint(touch.clientX, touch.clientY);
          setTouchDrag(null);
          setHoverSq(null);
          if (toSq !== null && toSq !== sq) {
            onDropOnSquare(toSq, { fromSq: sq });
          }
        }}
        style={{
          position: 'absolute',
          left: ff * cell,
          top: (7 - rr) * cell,
          width: cell,
          height: cell,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: draggable ? 'grab' : 'pointer',
          transition: isTouchDragging ? 'none' : 'left 0.18s ease, top 0.18s ease',
          transform: isSelected ? 'scale(1.05)' : 'scale(1)',
          filter: isSelected ? 'drop-shadow(0 4px 8px rgba(0,0,0,0.4))' : 'none',
          opacity: isTouchDragging ? 0.3 : 1,
          zIndex: isSelected ? 3 : 2,
          pointerEvents: 'auto',
        }}
      >
        <ChessPiece type={p.type} color={p.color} size={cell * 0.88} />
      </div>
    );
  });

  const touchPiece = touchDrag && board[touchDrag.sq];

  return (
    <div ref={boardRef} style={{
      position: 'relative',
      width: size,
      height: size,
      boxShadow: '0 18px 40px rgba(0,0,0,0.45), 0 2px 0 rgba(255,255,255,0.08) inset',
      borderRadius: 6,
      overflow: 'hidden',
      flexShrink: 0,
    }}>
      {squares}
      {pieces}
      {touchPiece && (
        <div style={{
          position: 'fixed',
          left: touchDrag.x - cell * 0.6,
          top: touchDrag.y - cell * 0.6,
          width: cell * 1.2,
          height: cell * 1.2,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          pointerEvents: 'none',
          zIndex: 9999,
          filter: 'drop-shadow(0 6px 12px rgba(0,0,0,0.5))',
          transform: 'scale(1.15)',
        }}>
          <ChessPiece type={touchPiece.type} color={touchPiece.color} size={cell * 1.0} />
        </div>
      )}
    </div>
  );
}

Object.assign(window, { ChessBoard, BOARD_THEMES });
