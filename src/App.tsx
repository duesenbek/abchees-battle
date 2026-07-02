import { useEffect, useState } from 'react';
import { useGameStore } from './core/chess/GameEngine';
import { GameZone } from './features/game/GameZone';
import { Leaderboard } from './features/leaderboard/Leaderboard';
import { GameMenu } from './shared/ui/GameMenu';
import { PodiumScreen } from './features/podium/PodiumScreen';
import { AdminPanel } from './features/admin/AdminPanel';
import { audioManager } from './core/services/AudioManager';

function App() {
  const {
    status,
    zones,
    initGame,
    startGame,
    tick,
    timeLeft,
    settings,
  } = useGameStore();
  const isMuted = settings.isMuted;

  const [playerCount, setPlayerCount] = useState<2 | 4>(2);
  const [names, setNames]             = useState<string[]>(['Игрок A', 'Игрок B', 'Игрок C', 'Игрок D']);
  const [avatars, setAvatars]         = useState<string[]>(['/avatars/1.png', '/avatars/2.png', '/avatars/3.png', '/avatars/4.png']);
  const [isStarting, setIsStarting]   = useState(false);

  // Timer
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (status === 'active') {
      interval = setInterval(() => tick(), 1000);
    }
    return () => { if (interval) clearInterval(interval); };
  }, [status, tick]);

  // Tick sound
  useEffect(() => {
    if (status === 'active' && timeLeft > 0 && timeLeft <= 10 && !isMuted) {
      audioManager.play('tick', isMuted);
    }
  }, [timeLeft, status, isMuted]);

  // Victory / timeout sound
  useEffect(() => {
    if (status === 'completed' && !isMuted) {
      const { winnerId } = useGameStore.getState();
      if (winnerId) {
        audioManager.play('victory', isMuted);
        audioManager.play('fanfare', isMuted);
      } else {
        audioManager.play('timeout', isMuted);
      }
    }
  }, [status, isMuted]);

  // UI sounds (hover and click)
  useEffect(() => {
    let lastHoveredButton: HTMLElement | null = null;
    let lastClickTime = 0;

    const handleMouseOver = (e: MouseEvent) => {
      const btn = (e.target as HTMLElement).closest('button');
      if (btn && btn !== lastHoveredButton) {
        lastHoveredButton = btn;
        // Don't play hover sound if we just clicked (e.g., button appeared under cursor)
        if (Date.now() - lastClickTime > 200 && !isMuted) {
          audioManager.play('hover', isMuted);
        }
      } else if (!btn) {
        lastHoveredButton = null;
      }
    };
    
    const handleMouseClick = (e: MouseEvent) => {
      if ((e.target as HTMLElement).closest('button') && !isMuted) {
        lastClickTime = Date.now();
        audioManager.play('click', isMuted);
      }
    };

    document.addEventListener('mouseover', handleMouseOver);
    document.addEventListener('mousedown', handleMouseClick);
    return () => {
      document.removeEventListener('mouseover', handleMouseOver);
      document.removeEventListener('mousedown', handleMouseClick);
    };
  }, [isMuted]);

  const handleStartGame = () => {
    audioManager.unlock();
    setIsStarting(true);
    initGame(names.slice(0, playerCount), avatars.slice(0, playerCount));
    setTimeout(() => {
      startGame();
      setIsStarting(false);
      if (!isMuted) audioManager.play('start');
    }, 500);
  };

  // ── SETUP SCREEN (Admin Panel takes full screen) ──────────────────────
  const renderSetup = () => {
    return (
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        <AdminPanel
          playerCount={playerCount}
          setPlayerCount={setPlayerCount}
          names={names}
          setNames={setNames}
          avatars={avatars}
          setAvatars={setAvatars}
          onStart={handleStartGame}
          isStarting={isStarting}
        />
      </div>
    );
  };

  // ── COMPLETED SCREEN ──────────────────────────────────────────────────────
  const renderCompleted = () => <PodiumScreen />;

  // ── ROOT LAYOUT ───────────────────────────────────────────────────────────
  return (
    <div className="app-container" style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
      {/* HEADER */}
      {status !== 'setup' && <Leaderboard />}

      {/* Content */}
      {status === 'setup'     && renderSetup()}
      {status === 'active'    && (
        <main style={{ 
          flex: 1, 
          display: 'grid', 
          gridTemplateColumns: '1fr 1fr', 
          gridTemplateRows: '1fr',
          padding: '16px',
          gap: '16px',
          overflow: 'hidden'
        }}>
          {/* PLAYER A (GameZone) */}
          <div style={{ minWidth: 0, height: '100%' }}>
            {'zone-a' in zones && <GameZone zoneId="zone-a" side="left" />}
          </div>
          
          {/* PLAYER B (GameZone) */}
          <div style={{ minWidth: 0, height: '100%' }}>
            {'zone-b' in zones && <GameZone zoneId="zone-b" side="right" />}
          </div>
        </main>
      )}
      {status === 'completed' && renderCompleted()}

      <GameMenu />
    </div>
  );
}

export default App;
