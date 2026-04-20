import { useState } from 'react';
import { LEVELS, rollShop } from './levels.js';
import PrepScreen from './components/PrepScreen.jsx';
import GameScreen, { ResultOverlay } from './components/GameScreen.jsx';
import MenuShell from './components/MenuShell.jsx';
import HomeScreen from './components/HomeScreen.jsx';
import ChallengeScreen from './components/ChallengeScreen.jsx';
import ProfileScreen from './components/ProfileScreen.jsx';
import SettingsScreen from './components/SettingsScreen.jsx';

const DEFAULT_PROFILE = {
  name: 'Joueur',
  gamesPlayed: 0,
  wins: 0,
  losses: 0,
  draws: 0,
  levelsCompleted: [],
};

function loadProfile() {
  try { return { ...DEFAULT_PROFILE, ...JSON.parse(localStorage.getItem('cft-profile')) }; }
  catch { return DEFAULT_PROFILE; }
}

function saveProfile(p) {
  try { localStorage.setItem('cft-profile', JSON.stringify(p)); } catch (_) {}
}

export default function App() {
  const [phase, setPhase] = useState('menu');   // 'menu' | 'prep' | 'game'
  const [activeTab, setActiveTab] = useState('home');
  const [profile, setProfileState] = useState(loadProfile);

  const [gameState, setGameState] = useState(() => ({
    levelIdx: 0,
    budget: LEVELS[0].bonus,
    shop: rollShop(),
    theme: 'slate',
  }));
  const [gameBoard, setGameBoard] = useState(null);
  const [result, setResult] = useState(null);

  function setProfile(updater) {
    setProfileState(prev => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      saveProfile(next);
      return next;
    });
  }

  // Start from the current level (home screen "Jouer")
  function onPlay() {
    setPhase('prep');
  }

  // Start a specific level from challenge screen
  function onPlayLevel(idx) {
    setGameState(g => ({
      ...g,
      levelIdx: idx,
      budget: LEVELS[idx].bonus,
      shop: rollShop(),
    }));
    setGameBoard(null);
    setResult(null);
    setPhase('prep');
  }

  function onStart({ board, spent }) {
    setGameState(g => ({ ...g, budget: g.budget - spent }));
    setGameBoard(board);
    setPhase('game');
    setResult(null);
  }

  function onResult({ outcome }) {
    setResult({ outcome });
    setProfile(p => {
      const updated = {
        ...p,
        gamesPlayed: p.gamesPlayed + 1,
        wins:   outcome === 'win'  ? p.wins + 1   : p.wins,
        losses: outcome === 'loss' ? p.losses + 1 : p.losses,
        draws:  outcome === 'draw' ? p.draws + 1  : p.draws,
        levelsCompleted: outcome === 'win' && !p.levelsCompleted.includes(gameState.levelIdx)
          ? [...p.levelsCompleted, gameState.levelIdx]
          : p.levelsCompleted,
      };
      saveProfile(updated);
      return updated;
    });
  }

  function nextLevel() {
    const idx = Math.min(gameState.levelIdx + 1, LEVELS.length - 1);
    setGameState(g => ({
      levelIdx: idx,
      budget: LEVELS[idx].bonus + g.budget,
      shop: rollShop(),
      theme: g.theme,
    }));
    setPhase('prep');
    setResult(null);
    setGameBoard(null);
  }

  function replay() {
    setGameState(g => ({
      ...g,
      budget: LEVELS[g.levelIdx].bonus,
      shop: rollShop(),
    }));
    setPhase('prep');
    setResult(null);
    setGameBoard(null);
  }

  function onExitToMenu() {
    setPhase('menu');
    setResult(null);
    setGameBoard(null);
    setActiveTab('home');
  }

  if (phase === 'prep') {
    return (
      <div className="app-shell">
        <PrepScreen
          gameState={gameState}
          setGameState={setGameState}
          onStart={onStart}
          onBack={onExitToMenu}
        />
      </div>
    );
  }

  if (phase === 'game' && gameBoard) {
    return (
      <div className="app-shell" style={{ position: 'relative' }}>
        <GameScreen
          gameState={gameState}
          initialBoard={gameBoard}
          onExit={() => setPhase('prep')}
          onResult={onResult}
        />
        {result && (
          <ResultOverlay
            outcome={result.outcome}
            level={LEVELS[gameState.levelIdx].number}
            budget={gameState.budget}
            onNext={nextLevel}
            onReplay={replay}
            onMenu={onExitToMenu}
          />
        )}
      </div>
    );
  }

  // Menu phase
  return (
    <div className="app-shell">
      <MenuShell activeTab={activeTab} setActiveTab={setActiveTab}>
        {activeTab === 'home' && (
          <HomeScreen
            gameState={gameState}
            profile={profile}
            onPlay={onPlay}
          />
        )}
        {activeTab === 'challenge' && (
          <ChallengeScreen
            profile={profile}
            onPlayLevel={onPlayLevel}
          />
        )}
        {activeTab === 'profile' && (
          <ProfileScreen
            profile={profile}
            setProfile={setProfile}
            gameState={gameState}
          />
        )}
        {activeTab === 'settings' && (
          <SettingsScreen
            gameState={gameState}
            setGameState={setGameState}
          />
        )}
      </MenuShell>
    </div>
  );
}
