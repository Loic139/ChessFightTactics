// Game screen: play white vs a simple "AI" (prefer captures → random).

function GameScreen({ gameState, initialBoard, onExit, onResult }) {
  const level = LEVELS[gameState.levelIdx];
  const [board, setBoard] = useState(initialBoard);
  const [turn, setTurn] = useState('w');
  const [selected, setSelected] = useState(null);
  const [legal, setLegal] = useState([]);
  const [lastMove, setLastMove] = useState(null);
  const [history, setHistory] = useState([]);   // [{ side, san, from, to }]
  const [captured, setCaptured] = useState({ w: [], b: [] }); // captured BY color
  const [thinking, setThinking] = useState(false);
  const [status, setStatus] = useState('playing');
  const [pendingPromo, setPendingPromo] = useState(null); // {from, to}
  const [hoverSq, setHoverSq] = useState(null);

  const checkSq = useMemo(() => {
    if (status === 'check' || status === 'checkmate') {
      return findKing(board, turn);
    }
    return null;
  }, [board, turn, status]);

  // After any board change, check status for side to move
  useEffect(() => {
    const s = gameStatus(board, turn);
    setStatus(s);
    if (s === 'check') window.sfx?.check();
    if (s === 'checkmate' || s === 'stalemate') {
      const whiteWins = s === 'checkmate' && turn === 'b';
      const outcome = s === 'stalemate' ? 'draw' : (whiteWins ? 'win' : 'loss');
      if (outcome === 'win') window.sfx?.gameEndWin();
      else if (outcome === 'loss') window.sfx?.gameEndLoss();
      else window.sfx?.gameEndDraw();
      setTimeout(() => onResult({ outcome }), 700);
    }
  }, [board, turn]);

  // Schedule AI move when it's black's turn
  useEffect(() => {
    if (turn !== 'b' || status === 'checkmate' || status === 'stalemate' || pendingPromo) return;
    setThinking(true);
    const t = setTimeout(() => {
      const moves = allLegalMoves(board, 'b');
      if (moves.length === 0) { setThinking(false); return; }
      // Prefer captures, then random
      const caps = moves.filter(m => board[m.to]);
      const pool = caps.length ? caps : moves;
      const m = pool[Math.floor(Math.random() * pool.length)];
      doMove(m.from, m.to, 'b', 'queen');
      setThinking(false);
    }, 650);
    return () => clearTimeout(t);
  }, [turn, board, status, pendingPromo]);

  function doMove(from, to, side, promo) {
    const piece = board[from];
    const target = board[to];
    const isProm = piece.type === 'pawn' &&
      ((side === 'w' && (to >> 3) === 7) || (side === 'b' && (to >> 3) === 0));
    const next = applyMove(board, from, to, isProm ? (promo || 'queen') : undefined);
    // Sound: capture > promote > move
    if (isProm) window.sfx?.promote();
    else if (target) window.sfx?.capture();
    else window.sfx?.move();
    setBoard(next);
    if (target) {
      setCaptured(c => ({
        ...c,
        [side]: [...c[side], target],
      }));
    }
    setLastMove({ from, to });
    setSelected(null);
    setLegal([]);
    setHistory(h => [...h, {
      side, from, to,
      piece: piece.type,
      captured: !!target,
      promo: isProm ? (promo || 'queen') : null,
    }]);
    setTurn(side === 'w' ? 'b' : 'w');
  }

  function onSquareClick(sq) {
    if (turn !== 'w' || thinking || pendingPromo || status === 'checkmate' || status === 'stalemate') return;
    const p = board[sq];
    if (selected == null) {
      if (p && p.color === 'w') {
        setSelected(sq);
        setLegal(legalMoves(board, sq));
      }
      return;
    }
    if (legal.includes(sq)) {
      const piece = board[selected];
      const isProm = piece.type === 'pawn' && (sq >> 3) === 7;
      if (isProm) {
        setPendingPromo({ from: selected, to: sq });
        setSelected(null);
        setLegal([]);
      } else {
        doMove(selected, sq, 'w');
      }
      return;
    }
    if (p && p.color === 'w') {
      setSelected(sq);
      setLegal(legalMoves(board, sq));
    } else {
      setSelected(null);
      setLegal([]);
    }
  }

  function onDropOnSquare(toSq, payload) {
    if (turn !== 'w' || thinking || pendingPromo) return;
    if (payload.fromSq == null) return;
    const from = payload.fromSq;
    const piece = board[from];
    if (!piece || piece.color !== 'w') return;
    const moves = legalMoves(board, from);
    if (!moves.includes(toSq)) return;
    const isProm = piece.type === 'pawn' && (toSq >> 3) === 7;
    if (isProm) {
      setPendingPromo({ from, to: toSq });
    } else {
      doMove(from, toSq, 'w');
    }
  }

  const canDrag = (sq) => {
    const p = board[sq];
    return p && p.color === 'w' && turn === 'w' && !thinking && !pendingPromo;
  };

  // Status banner text
  const statusText =
    thinking ? "L'adversaire réfléchit…" :
    status === 'checkmate' && turn === 'w' ? '💀 Échec et mat' :
    status === 'checkmate' && turn === 'b' ? '🎉 Échec et mat !' :
    status === 'stalemate' ? 'Pat — partie nulle' :
    status === 'check' && turn === 'w' ? '⚠️ Vous êtes en échec' :
    status === 'check' && turn === 'b' ? 'Échec aux noirs' :
    turn === 'w' ? 'À vous de jouer' : 'Aux noirs de jouer';

  const statusColor =
    status === 'checkmate' && turn === 'w' ? T.danger :
    status === 'checkmate' && turn === 'b' ? T.accent :
    status === 'check' ? T.danger :
    T.text;

  // Material differential (approx points)
  const VALUES = { pawn:1, knight:3, bishop:3, rook:5, queen:9, king:0 };
  const whiteMat = captured.w.reduce((s,p)=>s+VALUES[p.type],0);
  const blackMat = captured.b.reduce((s,p)=>s+VALUES[p.type],0);
  const diff = whiteMat - blackMat;

  return (
    <div style={{
      width: '100%', height: '100%',
      display: 'flex', flexDirection: 'column',
      background: T.bg, color: T.text,
      fontFamily: FONTS.sans,
    }}>
      <TopBar
        level={level.number}
        phase="Partie"
        budget={gameState.budget}
        budgetMax={gameState.budget}
        onBack={onExit}
      />

      {/* Opponent strip */}
      <PlayerStrip
        name="Adversaire"
        rating={1100 + level.number * 100}
        color="b"
        active={turn === 'b'}
        thinking={thinking}
        capturedSet={captured.b}
        matDiff={-diff}
      />

      {/* Board */}
      <div style={{
        flex: 1,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '4px 0',
        position: 'relative',
      }}>
        <ChessBoard
          board={board}
          size={356}
          theme={gameState.theme}
          selected={selected}
          legalTargets={legal}
          lastMove={lastMove}
          checkSquare={checkSq}
          canDrag={canDrag}
          onSquareClick={onSquareClick}
          onDropOnSquare={onDropOnSquare}
          accepts={() => true}
          hoverSq={hoverSq}
          setHoverSq={setHoverSq}
        />
      </div>

      {/* You strip */}
      <PlayerStrip
        name="Vous"
        rating={1200}
        color="w"
        active={turn === 'w' && !thinking}
        thinking={false}
        capturedSet={captured.w}
        matDiff={diff}
      />

      {/* Status + move list */}
      <div style={{
        background: T.panel,
        borderTop: `1px solid ${T.border}`,
        padding: '10px 14px 14px',
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          marginBottom: 8,
        }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
          }}>
            <div style={{
              width: 8, height: 8, borderRadius: 999,
              background: statusColor, boxShadow: `0 0 10px ${statusColor}`,
            }} />
            <div style={{ fontSize: 13, fontWeight: 600, color: statusColor }}>
              {statusText}
            </div>
          </div>
          <MoveHistory history={history} />
        </div>
      </div>

      {pendingPromo && (
        <PromotionDialog
          onPick={(promo) => {
            const { from, to } = pendingPromo;
            setPendingPromo(null);
            doMove(from, to, 'w', promo);
          }}
          onCancel={() => setPendingPromo(null)}
        />
      )}
    </div>
  );
}

function PlayerStrip({ name, rating, color, active, thinking, capturedSet, matDiff }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '6px 14px',
      background: active ? 'rgba(92,184,92,0.06)' : 'transparent',
      borderBottom: color === 'b' ? `1px solid ${T.border}` : 'none',
      borderTop: color === 'w' ? `1px solid ${T.border}` : 'none',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{
          width: 32, height: 32, borderRadius: 8,
          background: color === 'w' ? '#FAF7F0' : '#1F2024',
          border: `2px solid ${active ? T.accent : T.border}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: active ? `0 0 0 3px ${T.accentBg}` : 'none',
          transition: 'all 0.2s ease',
        }}>
          <div style={{
            fontSize: 18, fontWeight: 900,
            color: color === 'w' ? '#1F2024' : '#FAF7F0',
            fontFamily: FONTS.sans,
          }}>
            {color === 'w' ? 'V' : 'A'}
          </div>
        </div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: T.text, display: 'flex', alignItems: 'center', gap: 6 }}>
            {name}
            <span style={{ fontSize: 11, color: T.textMuted, fontWeight: 500 }}>({rating})</span>
            {thinking && <span style={{ fontSize: 11, color: T.gold }}>• réfléchit</span>}
          </div>
          <CapturedRow pieces={capturedSet} diff={matDiff} />
        </div>
      </div>
    </div>
  );
}

function CapturedRow({ pieces, diff }) {
  // Order: P, B, N, R, Q
  const order = ['pawn','bishop','knight','rook','queen'];
  const sorted = [...pieces].sort((a,b) => order.indexOf(a.type) - order.indexOf(b.type));
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 1, marginTop: 2, minHeight: 16 }}>
      {sorted.map((p, i) => (
        <div key={i} style={{ marginLeft: i === 0 ? 0 : -6, opacity: 0.85 }}>
          <ChessPiece type={p.type} color={p.color} size={16} />
        </div>
      ))}
      {diff > 0 && (
        <span style={{
          fontSize: 11, color: T.accent, marginLeft: 6,
          fontFamily: FONTS.mono, fontWeight: 700,
        }}>+{diff}</span>
      )}
    </div>
  );
}

function MoveHistory({ history }) {
  const ref = useRef(null);
  useEffect(() => {
    if (ref.current) ref.current.scrollLeft = ref.current.scrollWidth;
  }, [history.length]);

  const LETTER = { pawn: '', knight: 'N', bishop: 'B', rook: 'R', queen: 'Q', king: 'K' };
  const items = history.map((m, i) => {
    const toAlg = sqToAlg(m.to);
    const x = m.captured ? '×' : '';
    const letter = LETTER[m.piece];
    const notation = (letter || '') + x + toAlg + (m.promo ? '=' + LETTER[m.promo] : '');
    return { n: i, notation, side: m.side };
  });

  return (
    <div ref={ref} style={{
      display: 'flex', gap: 4, overflowX: 'auto',
      maxWidth: 200, padding: '2px 2px',
      fontFamily: FONTS.mono,
    }}>
      {items.length === 0 ? (
        <span style={{ color: T.textMuted, fontSize: 11 }}>—</span>
      ) : items.slice(-6).map((m, i) => (
        <span key={i} style={{
          fontSize: 11, fontWeight: 700,
          color: m.side === 'w' ? T.text : T.textDim,
          background: m.side === 'w' ? 'rgba(255,255,255,0.05)' : 'transparent',
          padding: '2px 6px', borderRadius: 4,
          flexShrink: 0,
        }}>
          {m.notation}
        </span>
      ))}
    </div>
  );
}

function PromotionDialog({ onPick, onCancel }) {
  const opts = [
    { type: 'queen', label: 'Dame', cost: 7 },
    { type: 'rook',  label: 'Tour', cost: 4 },
    { type: 'bishop',label: 'Fou',  cost: 2 },
    { type: 'knight',label: 'Cavalier', cost: 2 },
  ];
  return (
    <div style={{
      position: 'absolute', inset: 0,
      background: 'rgba(0,0,0,0.65)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 100, backdropFilter: 'blur(6px)',
    }}>
      <div style={{
        background: T.panel, borderRadius: 20,
        border: `1px solid ${T.borderHi}`,
        padding: 18, width: 300,
        boxShadow: '0 30px 60px rgba(0,0,0,0.6)',
      }}>
        <div style={{
          fontSize: 10, letterSpacing: 2, color: T.gold,
          fontFamily: FONTS.mono, fontWeight: 700, marginBottom: 4,
        }}>PROMOTION</div>
        <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 14, color: T.text }}>
          Choisissez votre pièce
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          {opts.map((o) => (
            <button key={o.type} onClick={() => onPick(o.type)} style={{
              background: 'linear-gradient(180deg, #1C2734 0%, #141B24 100%)',
              border: `1px solid ${T.border}`,
              borderRadius: 12, padding: '10px 8px',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
              cursor: 'pointer', color: T.text,
            }}>
              <ChessPiece type={o.type} color="w" size={40} />
              <div style={{ fontSize: 12, color: T.textDim }}>{o.label}</div>
            </button>
          ))}
        </div>
        <button onClick={onCancel} style={{
          marginTop: 12, width: '100%',
          background: 'transparent', border: 'none',
          color: T.textMuted, fontSize: 11, cursor: 'pointer',
          fontFamily: FONTS.mono, letterSpacing: 0.5,
        }}>Annuler</button>
      </div>
    </div>
  );
}

function ResultOverlay({ outcome, level, budget, onNext, onReplay }) {
  const isWin = outcome === 'win';
  const isDraw = outcome === 'draw';
  const accent = isWin ? T.accent : (isDraw ? T.gold : T.danger);
  const title = isWin ? 'Victoire' : isDraw ? 'Match nul' : 'Défaite';
  const sub = isWin
    ? `Niveau ${level} terminé. Budget conservé : $${budget}.`
    : isDraw ? 'Pat. Vous gardez votre budget.'
    : 'Les noirs l\'emportent.';
  const emoji = isWin ? '🏆' : isDraw ? '🤝' : '💀';

  return (
    <div style={{
      position: 'absolute', inset: 0,
      background: 'rgba(0,0,0,0.75)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 100, backdropFilter: 'blur(8px)',
      padding: 20,
    }}>
      <div style={{
        background: T.panel, borderRadius: 24,
        border: `1px solid ${T.borderHi}`,
        padding: 24, width: '100%',
        boxShadow: `0 30px 60px rgba(0,0,0,0.7), 0 0 0 1px ${accent}22`,
        textAlign: 'center',
      }}>
        <div style={{ fontSize: 48, marginBottom: 4 }}>{emoji}</div>
        <div style={{
          fontSize: 10, letterSpacing: 2, color: accent,
          fontFamily: FONTS.mono, fontWeight: 700,
        }}>{isWin ? 'NIVEAU RÉUSSI' : isDraw ? 'PARTIE NULLE' : 'PARTIE PERDUE'}</div>
        <div style={{
          fontSize: 28, fontWeight: 800, marginTop: 4, color: T.text,
          letterSpacing: -0.5,
        }}>{title}</div>
        <div style={{ fontSize: 13, color: T.textDim, marginTop: 8, lineHeight: 1.5 }}>
          {sub}
        </div>
        <div style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: 8 }}>
          {isWin && (
            <button onClick={onNext} style={{
              padding: '12px', borderRadius: 12, border: 'none',
              background: `linear-gradient(180deg, ${T.accentHi}, ${T.accent})`,
              color: '#0B1A0B', fontWeight: 700, fontSize: 14,
              cursor: 'pointer', fontFamily: FONTS.sans,
            }}>Niveau suivant →</button>
          )}
          <button onClick={onReplay} style={{
            padding: '12px', borderRadius: 12,
            background: 'transparent',
            border: `1px solid ${T.borderHi}`,
            color: T.text, fontWeight: 600, fontSize: 13,
            cursor: 'pointer', fontFamily: FONTS.sans,
          }}>{isWin ? 'Rejouer ce niveau' : 'Réessayer'}</button>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { GameScreen, ResultOverlay, PromotionDialog });
