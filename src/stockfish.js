// Stockfish 18 lite — single-threaded Web Worker wrapper (UCI protocol)
let worker = null;
let ready = false;
let pendingCmds = [];
let onBestMove = null;

function ensureWorker() {
  if (worker) return;
  worker = new Worker('/stockfish-18-lite-single.js');
  worker.onmessage = ({ data: line }) => {
    if (typeof line !== 'string') return;
    if (line === 'uciok') {
      worker.postMessage('isready');
    }
    if (line === 'readyok') {
      ready = true;
      for (const cmd of pendingCmds) worker.postMessage(cmd);
      pendingCmds = [];
    }
    if (line.startsWith('bestmove')) {
      const move = line.split(' ')[1];
      const cb = onBestMove;
      onBestMove = null;
      if (cb && move && move !== '(none)') cb(move);
    }
  };
  worker.onerror = (e) => console.error('[Stockfish]', e);
  worker.postMessage('uci');
}

function send(cmd) {
  if (!ready) { pendingCmds.push(cmd); }
  else worker.postMessage(cmd);
}

export function getBestMove(fen, { skillLevel = 10, depth = 10 } = {}, callback) {
  ensureWorker();
  onBestMove = callback;
  send(`setoption name Skill Level value ${skillLevel}`);
  send(`position fen ${fen}`);
  send(`go depth ${depth}`);
}

export function stopSearch() {
  if (worker && ready) worker.postMessage('stop');
  onBestMove = null;
}
