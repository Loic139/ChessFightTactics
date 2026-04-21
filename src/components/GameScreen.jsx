import { useState, useEffect, useMemo, useRef } from 'react';
import { T, FONTS } from '../theme.js';
import { LEVELS } from '../levels.js';
import { legalMoves, allLegalMoves, gameStatus, applyMove, findKing, sqToAlg, boardToFen, parseUciMove, initialCastlingRights, EMPTY_STATE } from '../engine.js';
import { getBestMove, stopSearch } from '../stockfish.js';
import ChessBoard from './ChessBoard.jsx';
import ChessPiece from './ChessPiece.jsx';
import TopBar from './TopBar.jsx';
import sfx from '../sfx.js';

export default function GameScreen({ gameState, initialBoard, onExit, onResult }) {
  const level = LEVELS[gameState.levelIdx];
  const [board, setBoard] = useState(initialBoard);
  const [gameInfo, setGameInfo] = useState(() => ({
    enPassant: null,
    castling: initialCastlingRights(initialBoard),
  }));
  const [turn, setTurn] = useState('w');
  const [selected, setSelected] = useState(null);
  const [legal, setLegal] = useState([]);
  const [lastMove, setLastMove] = useState(null);
  const [history, setHistory] = useState([]);
  const [captured, setCaptured] = useState({ w: [], b: [] });
  const [thinking, setThinking] = useState(false);
  const [status, setStatus] = useState('playing');
  const [pendingPromo, setPendingPromo] = useState(null);
  const [hoverSq, setHoverSq] = useState(null);

  const checkSq = useMemo(() => {
    if (status === 'check' || status === 'checkmate') return findKing(board, turn);
    return null;
  }, [board, turn, status]);

  useEffect(() => {
    const s = gameStatus(board, turn, gameInfo);
    setStatus(s);
    if (s === 'check') sfx.check();
    if (s === 'checkmate' || s === 'stalemate') {
      const whiteWins = s === 'checkmate' && turn === 'b';
      const outcome = s === 'stalemate' ? 'draw' : (whiteWins ? 'win' : 'loss');
      if (outcome === 'win') setTimeout(() => sfx.gameEndWin(), 300);
      else if (outcome === 'loss') setTimeout(() => sfx.gameEndLoss(), 300);
      else setTimeout(() => sfx.gameEndDraw(), 300);
      setTimeout(() => onResult({ outcome }), 700);
    }
  }, [board, turn, gameInfo]);

  // Skill level scales with game level: 1→4, 2→8, 3→14
  const SKILL = [4, 8, 14];
  const DEPTH = [6, 9, 12];
  const levelIdx = gameState.levelIdx;

  useEffect(() => {
    if (turn !== 'b' || status === 'checkmate' || status === 'stalemate' || pendingPromo) return;
    setThinking(true);
    const fen = boardToFen(board, 'b', gameInfo.castling, gameInfo.enPassant);
    let done = false;

    function playFallback() {
      if (done) return;
      done = true;
      const moves = allLegalMoves(board, 'b', gameInfo);
      if (moves.length === 0) { setThinking(false); return; }
      const caps = moves.filter(m => board[m.to]);
      const { from, to } = (caps.length ? caps : moves)[Math.floor(Math.random() * (caps.length || moves.length))];
      doMove(from, to, 'b', 'queen');
      setThinking(false);
    }

    const fallbackTimer = setTimeout(playFallback, 5000);

    getBestMove(
      fen,
      { skillLevel: SKILL[Math.min(levelIdx, 2)], depth: DEPTH[Math.min(levelIdx, 2)] },
      (uciMove) => {
        if (done) return;
        done = true;
        clearTimeout(fallbackTimer);
        const { from, to, promo } = parseUciMove(uciMove);
        doMove(from, to, 'b', promo || 'queen');
        setThinking(false);
      }
    );
    return () => { stopSearch(); clearTimeout(fallbackTimer); };
  }, [turn, board, status, pendingPromo]);

  function doMove(from, to, side, promo) {
    const piece = board[from];
    const target = board[to];
    const isProm = piece.type === 'pawn' &&
      ((side === 'w' && (to >> 3) === 7) || (side === 'b' && (to >> 3) === 0));
    const result = applyMove(board, from, to, isProm ? (promo || 'queen') : undefined, gameInfo);
    // Detect en passant capture: pawn moved diagonally onto empty square
    const isEnPassant = piece.type === 'pawn' && !target && to === gameInfo.enPassant;
    const capturedPiece = target || (isEnPassant ? { type: 'pawn', color: side === 'w' ? 'b' : 'w' } : null);
    if (isProm) sfx.promote();
    else if (capturedPiece) sfx.capture();
    else sfx.move();
    setBoard(result.board);
    setGameInfo({ enPassant: result.enPassant, castling: result.castling });
    if (capturedPiece) setCaptured(c => ({ ...c, [side]: [...c[side], capturedPiece] }));
    setLastMove({ from, to });
    setSelected(null); setLegal([]);
    setHistory(h => [...h, { side, from, to, piece: piece.type, captured: !!capturedPiece, promo: isProm ? (promo||'queen') : null }]);
    setTurn(side === 'w' ? 'b' : 'w');
  }

  function onSquareClick(sq) {
    if (turn !== 'w' || thinking || pendingPromo || status === 'checkmate' || status === 'stalemate') return;
    const p = board[sq];
    if (selected == null) {
      if (p && p.color === 'w') { setSelected(sq); setLegal(legalMoves(board, sq, gameInfo)); }
      return;
    }
    if (legal.includes(sq)) {
      const piece = board[selected];
      if (piece.type === 'pawn' && (sq >> 3) === 7) {
        setPendingPromo({ from: selected, to: sq }); setSelected(null); setLegal([]);
      } else { doMove(selected, sq, 'w'); }
      return;
    }
    if (p && p.color === 'w') { setSelected(sq); setLegal(legalMoves(board, sq, gameInfo)); }
    else { setSelected(null); setLegal([]); }
  }

  function onDropOnSquare(toSq, payload) {
    if (turn !== 'w' || thinking || pendingPromo || payload.fromSq == null) return;
    const from = payload.fromSq;
    const piece = board[from];
    if (!piece || piece.color !== 'w') return;
    if (!legalMoves(board, from, gameInfo).includes(toSq)) return;
    if (piece.type === 'pawn' && (toSq >> 3) === 7) setPendingPromo({ from, to: toSq });
    else doMove(from, toSq, 'w');
  }

  const canDrag = (sq) => {
    const p = board[sq];
    return p && p.color === 'w' && turn === 'w' && !thinking && !pendingPromo;
  };

  const statusText =
    thinking ? "L'adversaire réfléchit…" :
    status === 'checkmate' && turn === 'w' ? '💀 Échec et mat' :
    status === 'checkmate' && turn === 'b' ? '🎉 Échec et mat !' :
    status === 'stalemate' ? 'Pat — partie nulle' :
    status === 'check' && turn === 'w' ? '⚠️ Vous êtes en échec' :
    status === 'check' && turn === 'b' ? 'Échec aux noirs' :
    turn === 'w' ? 'À vous de jouer' : 'Aux noirs de jouer';

  const statusColor =
    (status === 'checkmate' && turn === 'w') ? T.danger :
    (status === 'checkmate' && turn === 'b') ? T.accent :
    status === 'check' ? T.danger : T.text;

  const VALUES = { pawn:1, knight:3, bishop:3, rook:5, queen:9, king:0 };
  const whiteMat = captured.w.reduce((s,p)=>s+VALUES[p.type],0);
  const blackMat = captured.b.reduce((s,p)=>s+VALUES[p.type],0);
  const diff = whiteMat - blackMat;

  const boardSize = Math.min(window.innerWidth - 8, 390);

  return (
    <div style={{
      width:'100%', height:'100%',
      display:'flex', flexDirection:'column',
      background:T.bg, color:T.text, fontFamily:FONTS.sans,
    }}>
      <TopBar level={level.number} phase="Partie" budget={gameState.budget} onBack={onExit} />

      <PlayerStrip name="Adversaire" rating={1100 + level.number * 100} color="b"
        active={turn==='b'} thinking={thinking} capturedSet={captured.b} matDiff={-diff} />

      <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', padding:'4px 0', minHeight:0 }}>
        <ChessBoard
          board={board} size={boardSize} theme={gameState.theme}
          selected={selected} legalTargets={legal}
          lastMove={lastMove} checkSquare={checkSq}
          canDrag={canDrag} onSquareClick={onSquareClick}
          onDropOnSquare={onDropOnSquare} accepts={() => true}
          hoverSq={hoverSq} setHoverSq={setHoverSq}
        />
      </div>

      <PlayerStrip name="Vous" rating={1200} color="w"
        active={turn==='w' && !thinking} thinking={false} capturedSet={captured.w} matDiff={diff} />

      <div style={{ background:T.panel, borderTop:`1px solid ${T.border}`, padding:'10px 14px 14px', flexShrink:0 }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:6 }}>
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <div style={{ width:8, height:8, borderRadius:999, background:statusColor, boxShadow:`0 0 10px ${statusColor}` }} />
            <div style={{ fontSize:13, fontWeight:600, color:statusColor }}>{statusText}</div>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <MoveHistory history={history} />
            {status === 'playing' || status === 'check' ? (
              <button
                onClick={() => { sfx.gameEndLoss(); setTimeout(() => onResult({ outcome: 'loss' }), 200); }}
                style={{
                  background:'transparent', border:`1px solid ${T.danger55}`,
                  borderRadius:8, padding:'4px 10px',
                  color:T.danger, fontSize:11, fontWeight:600,
                  cursor:'pointer', fontFamily:FONTS.sans,
                  opacity:0.7,
                }}
              >Abandonner</button>
            ) : null}
          </div>
        </div>
      </div>

      {pendingPromo && (
        <PromotionDialog
          onPick={(promo) => { const {from,to}=pendingPromo; setPendingPromo(null); doMove(from,to,'w',promo); }}
          onCancel={() => setPendingPromo(null)}
        />
      )}
    </div>
  );
}

function PlayerStrip({ name, rating, color, active, thinking, capturedSet, matDiff }) {
  return (
    <div style={{
      display:'flex', alignItems:'center', justifyContent:'space-between',
      padding:'6px 14px',
      background: active ? T.accentBg : 'transparent',
      borderBottom: color==='b' ? `1px solid ${T.border}` : 'none',
      borderTop: color==='w' ? `1px solid ${T.border}` : 'none',
      flexShrink: 0,
    }}>
      <div style={{ display:'flex', alignItems:'center', gap:10 }}>
        <div style={{
          width:32, height:32, borderRadius:8,
          background: color==='w' ? '#FAF7F0' : '#1F2024',
          border:`2px solid ${active ? T.accent : T.border}`,
          boxShadow: active ? `0 0 0 3px ${T.accentBg}` : 'none',
          display:'flex', alignItems:'center', justifyContent:'center',
          transition:'all 0.2s ease',
        }}>
          <div style={{ fontSize:16, fontWeight:900, color:color==='w'?'#1F2024':'#FAF7F0' }}>
            {color==='w'?'V':'A'}
          </div>
        </div>
        <div>
          <div style={{ fontSize:13, fontWeight:600, color:T.text, display:'flex', alignItems:'center', gap:6 }}>
            {name}
            <span style={{ fontSize:11, color:T.textMuted }}>({rating})</span>
            {thinking && <span style={{ fontSize:11, color:T.gold }}>• réfléchit</span>}
          </div>
          <CapturedRow pieces={capturedSet} diff={matDiff} />
        </div>
      </div>
    </div>
  );
}

function CapturedRow({ pieces, diff }) {
  const order = ['pawn','bishop','knight','rook','queen'];
  const sorted = [...pieces].sort((a,b)=>order.indexOf(a.type)-order.indexOf(b.type));
  return (
    <div style={{ display:'flex', alignItems:'center', gap:1, marginTop:2, minHeight:16 }}>
      {sorted.map((p,i) => (
        <div key={i} style={{ marginLeft:i===0?0:-6, opacity:0.85 }}>
          <ChessPiece type={p.type} color={p.color} size={16} />
        </div>
      ))}
      {diff > 0 && <span style={{ fontSize:11, color:T.accent, marginLeft:6, fontFamily:FONTS.mono, fontWeight:700 }}>+{diff}</span>}
    </div>
  );
}

function MoveHistory({ history }) {
  const ref = useRef(null);
  useEffect(() => { if (ref.current) ref.current.scrollLeft = ref.current.scrollWidth; }, [history.length]);
  const LETTER = { pawn:'', knight:'N', bishop:'B', rook:'R', queen:'Q', king:'K' };
  return (
    <div ref={ref} style={{ display:'flex', gap:4, overflowX:'auto', maxWidth:180, fontFamily:FONTS.mono }}>
      {history.length === 0
        ? <span style={{ color:T.textMuted, fontSize:11 }}>—</span>
        : history.slice(-6).map((m,i) => (
          <span key={i} style={{
            fontSize:11, fontWeight:700, flexShrink:0,
            color: m.side==='w' ? T.text : T.textDim,
            background: m.side==='w' ? 'rgba(255,255,255,0.05)' : 'transparent',
            padding:'2px 6px', borderRadius:4,
          }}>
            {LETTER[m.piece]}{m.captured?'×':''}{sqToAlg(m.to)}{m.promo?'='+LETTER[m.promo]:''}
          </span>
        ))
      }
    </div>
  );
}

function PromotionDialog({ onPick, onCancel }) {
  const opts = [
    { type:'queen',  label:'Dame',     cost:7 },
    { type:'rook',   label:'Tour',     cost:4 },
    { type:'bishop', label:'Fou',      cost:2 },
    { type:'knight', label:'Cavalier', cost:2 },
  ];
  return (
    <div style={{
      position:'absolute', inset:0,
      background:'rgba(0,0,0,0.65)',
      display:'flex', alignItems:'center', justifyContent:'center',
      zIndex:100, backdropFilter:'blur(6px)',
    }}>
      <div style={{
        background:T.panel, borderRadius:20,
        border:`1px solid ${T.borderHi}`,
        padding:18, width:300,
        boxShadow:'0 30px 60px rgba(0,0,0,0.6)',
      }}>
        <div style={{ fontSize:10, letterSpacing:2, color:T.gold, fontFamily:FONTS.mono, fontWeight:700, marginBottom:4 }}>PROMOTION</div>
        <div style={{ fontSize:16, fontWeight:700, marginBottom:14, color:T.text }}>Choisissez votre pièce</div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
          {opts.map(o => (
            <button key={o.type} onClick={() => onPick(o.type)} style={{
              background:'linear-gradient(180deg, #1C2734 0%, #141B24 100%)',
              border:`1px solid ${T.border}`, borderRadius:12,
              padding:'10px 8px',
              display:'flex', flexDirection:'column', alignItems:'center', gap:4,
              cursor:'pointer', color:T.text, fontFamily:FONTS.sans,
            }}>
              <ChessPiece type={o.type} color="w" size={40} />
              <div style={{ fontSize:12, color:T.textDim }}>{o.label}</div>
            </button>
          ))}
        </div>
        <button onClick={onCancel} style={{
          marginTop:12, width:'100%', background:'transparent', border:'none',
          color:T.textMuted, fontSize:11, cursor:'pointer', fontFamily:FONTS.mono,
        }}>Annuler</button>
      </div>
    </div>
  );
}

export function ResultOverlay({ outcome, level, budget, onNext, onReplay, onMenu }) {
  const isWin = outcome === 'win';
  const isDraw = outcome === 'draw';
  const accent = isWin ? T.accent : isDraw ? T.gold : T.danger;
  const title = isWin ? 'Victoire' : isDraw ? 'Match nul' : 'Défaite';
  const sub = isWin
    ? `Niveau ${level} terminé. Budget conservé : $${budget}.`
    : isDraw ? 'Pat. Vous gardez votre budget.'
    : "Les noirs l'emportent.";
  const emoji = isWin ? '🏆' : isDraw ? '🤝' : '💀';

  return (
    <div style={{
      position:'absolute', inset:0,
      background:'rgba(0,0,0,0.75)',
      display:'flex', alignItems:'center', justifyContent:'center',
      zIndex:100, backdropFilter:'blur(8px)', padding:20,
    }}>
      <div style={{
        background:T.panel, borderRadius:24,
        border:`1px solid ${T.borderHi}`,
        padding:24, width:'100%',
        boxShadow:`0 30px 60px rgba(0,0,0,0.7), 0 0 0 1px ${accent}22`,
        textAlign:'center',
      }}>
        <div style={{ fontSize:48, marginBottom:4 }}>{emoji}</div>
        <div style={{ fontSize:10, letterSpacing:2, color:accent, fontFamily:FONTS.mono, fontWeight:700 }}>
          {isWin?'NIVEAU RÉUSSI':isDraw?'PARTIE NULLE':'PARTIE PERDUE'}
        </div>
        <div style={{ fontSize:28, fontWeight:800, marginTop:4, color:T.text, letterSpacing:-0.5 }}>{title}</div>
        <div style={{ fontSize:13, color:T.textDim, marginTop:8, lineHeight:1.5 }}>{sub}</div>
        <div style={{ marginTop:20, display:'flex', flexDirection:'column', gap:8 }}>
          {isWin && (
            <button onClick={onNext} style={{
              padding:'12px', borderRadius:12, border:'none',
              background:`linear-gradient(180deg, ${T.accentHi}, ${T.accent})`,
              color:T.accentText, fontWeight:700, fontSize:14,
              cursor:'pointer', fontFamily:FONTS.sans,
            }}>Niveau suivant →</button>
          )}
          <button onClick={onReplay} style={{
            padding:'12px', borderRadius:12,
            background:'transparent', border:`1px solid ${T.borderHi}`,
            color:T.text, fontWeight:600, fontSize:13,
            cursor:'pointer', fontFamily:FONTS.sans,
          }}>{isWin?'Rejouer ce niveau':'Réessayer'}</button>
          <button onClick={onMenu} style={{
            padding:'10px', borderRadius:12,
            background:'transparent', border:'none',
            color:T.textMuted, fontWeight:500, fontSize:12,
            cursor:'pointer', fontFamily:FONTS.sans,
          }}>← Retour au menu</button>
        </div>
      </div>
    </div>
  );
}
