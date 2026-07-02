import React, { useEffect } from 'react';
import { useGameStore } from '../../core/chess/GameEngine';
import { Play, RotateCcw, Settings, LogOut } from 'lucide-react';

export const GameMenu: React.FC = () => {
  const { settings, closeMenu, resetGame, startGame, exitToMenu } = useGameStore();
  const isMenuOpen = settings.isMenuOpen;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        const { toggleMenu } = useGameStore.getState();
        toggleMenu();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  if (!isMenuOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(0,0,0,0.7)',
      backdropFilter: 'blur(4px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 12,
        padding: '32px',
        width: '400px',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
          <h2 className="t-h2">Меню паузы</h2>
        </div>

        <button 
          className="btn-primary" 
          style={{ width: '100%', height: '48px', fontSize: '16px' }} 
          onClick={closeMenu}
        >
          <Play size={18} />
          Продолжить
        </button>

        <button 
          className="btn-secondary" 
          style={{ width: '100%', height: '48px', fontSize: '16px' }} 
          onClick={() => {
            resetGame();
            startGame();
            closeMenu();
          }}
        >
          <RotateCcw size={18} />
          Перезапустить турнир
        </button>

        <button 
          className="btn-secondary" 
          style={{ width: '100%', height: '48px', fontSize: '16px' }} 
          onClick={() => {
            exitToMenu();
            closeMenu();
          }}
        >
          <Settings size={18} />
          Панель учителя (Настройки)
        </button>

        <button 
          className="btn-secondary" 
          style={{ width: '100%', height: '48px', fontSize: '16px', color: 'var(--danger)', borderColor: 'var(--danger)' }} 
          onClick={() => {
            exitToMenu();
            closeMenu();
          }}
        >
          <LogOut size={18} />
          Завершить турнир
        </button>
      </div>
    </div>
  );
};
