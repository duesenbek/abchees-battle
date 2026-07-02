import React, { useState, useRef } from 'react';
import { useGameStore } from '../../core/chess/GameEngine';
import { JsonValidator } from '../../core/chess/JsonValidator';
import type { Puzzle } from '../../core/chess/types';
import { Modal } from '../../shared/ui/Modal';
import defaultPuzzlesRaw from '../../data/puzzles/mate1.json';
import mate2PuzzlesRaw from '../../data/puzzles/mate2.json';
import pinsPuzzlesRaw from '../../data/puzzles/pins.json';
import forksPuzzlesRaw from '../../data/puzzles/forks.json';
import discoveredPuzzlesRaw from '../../data/puzzles/discovered.json';
import endgamesPuzzlesRaw from '../../data/puzzles/endgames.json';
import { type PuzzleFile } from '../../core/chess/types';
import { UploadCloud, FileJson, Copy, CheckCircle2 } from 'lucide-react';
import { Chessboard } from 'react-chessboard';

const defaultPuzzles = (defaultPuzzlesRaw as unknown as PuzzleFile).puzzles;
const mate2Puzzles = (mate2PuzzlesRaw as unknown as PuzzleFile).puzzles;
const pinsPuzzles = (pinsPuzzlesRaw as unknown as PuzzleFile).puzzles;
const forksPuzzles = (forksPuzzlesRaw as unknown as PuzzleFile).puzzles;
const discoveredPuzzles = (discoveredPuzzlesRaw as unknown as PuzzleFile).puzzles;
const endgamesPuzzles = (endgamesPuzzlesRaw as unknown as PuzzleFile).puzzles;

interface PresetPack { id: string; label: string; count: number; difficulty: string; category: string; description: string; puzzles: Puzzle[] | null; }

const PRESET_PACKS: Record<string, PresetPack> = {
  'mate-1':     { id: 'mate-1',     label: 'Мат в 1 ход',         count: defaultPuzzles.length, difficulty: 'Легкая',  category: 'Тактика', description: 'Базовые задачи на постановку мата в 1 ход.', puzzles: null },
  'mate-2':     { id: 'mate-2',     label: 'Мат в 2 хода',        count: mate2Puzzles.length,   difficulty: 'Средняя', category: 'Тактика', description: 'Комбинации для постановки мата в 2 хода.', puzzles: mate2Puzzles },
  'pins':       { id: 'pins',       label: 'Связки',               count: pinsPuzzles.length,    difficulty: 'Средняя', category: 'Приемы',  description: 'Использование связки для получения преимущества.', puzzles: pinsPuzzles },
  'forks':      { id: 'forks',      label: 'Вилки',                count: forksPuzzles.length,   difficulty: 'Средняя', category: 'Приемы',  description: 'Двойной удар (вилка) конем или другой фигурой.', puzzles: forksPuzzles },
  'discovered': { id: 'discovered', label: 'Двойной шах',          count: discoveredPuzzles.length, difficulty: 'Сложная', category: 'Атака',   description: 'Открытое нападение с объявлением шаха.', puzzles: discoveredPuzzles },
  'endgames':   { id: 'endgames',   label: 'Пешечные окончания',   count: endgamesPuzzles.length, difficulty: 'Сложная', category: 'Эндшпиль', description: 'Практика разыгрывания пешечных окончаний.', puzzles: endgamesPuzzles },
};

interface AdminPanelProps {
  playerCount: 2 | 4;
  setPlayerCount: (count: 2 | 4) => void;
  names: string[];
  setNames: (names: string[]) => void;
  avatars: string[];
  setAvatars: (avatars: string[]) => void;
  onStart: () => void;
  isStarting: boolean;
}

interface UploadedFileState {
  filename: string;
  puzzleCount: number;
  isValid: boolean;
  validationStatus: string;
  puzzles?: Puzzle[];
  packTitle?: string;
  packDescription?: string;
  packDifficulty?: string;
  warnings?: string[];
}

type TabType = 'library' | 'settings' | 'import' | 'preview';

export const AdminPanel: React.FC<AdminPanelProps> = ({
  playerCount,
  setPlayerCount,
  names,
  setNames,
  avatars,
  setAvatars,
  onStart,
  isStarting,
}) => {
  const [activeTab, setActiveTab]         = useState<TabType>('library');
  const [selectedPackId, setSelectedPackId] = useState('mate-1');
  const [avatarPickerFor, setAvatarPickerFor] = useState<number | null>(null);
  const [uploadedFile, setUploadedFile]   = useState<UploadedFileState | null>(null);
  const [dragActive, setDragActive]       = useState(false);
  const [copiedPrompt, setCopiedPrompt]   = useState(false);
  const [jsonText, setJsonText]           = useState('');
  const fileInputRef                      = useRef<HTMLInputElement>(null);

  const { defaultTimeLimit, setDefaultTimeLimit, setCustomPuzzles, boardTheme, setBoardTheme,
    showMoveHints, setShowMoveHints,
    showSolutionHints, setShowSolutionHints,
    maxSolutionHintsPerPuzzle, setMaxSolutionHintsPerPuzzle,
    maxAttemptsPerPuzzle, setMaxAttemptsPerPuzzle, customPuzzles
  } = useGameStore();
  const [localTime, setLocalTime] = useState(defaultTimeLimit);

  const handleApplyPack = (id: string, puzzles: Puzzle[] | null) => {
    setSelectedPackId(id);
    if (id === 'custom' && uploadedFile?.isValid && uploadedFile.puzzles) {
      setCustomPuzzles(uploadedFile.puzzles);
    } else {
      setCustomPuzzles(puzzles);
    }
  };

  const processJsonFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const parsed = JSON.parse(e.target?.result as string);
        const validation = JsonValidator.validate(parsed);
        if (validation.success && validation.puzzles) {
          setUploadedFile({ 
            filename: file.name, 
            puzzleCount: validation.puzzles.length, 
            isValid: true, 
            validationStatus: 'Проверено', 
            puzzles: validation.puzzles,
            packTitle: validation.packTitle,
            packDescription: validation.packDescription,
            packDifficulty: validation.packDifficulty,
            warnings: validation.warnings
          });
          handleApplyPack('custom', validation.puzzles);
          if (!validation.warnings || validation.warnings.length === 0) {
            setActiveTab('library');
          }
        } else {
          setUploadedFile({ filename: file.name, puzzleCount: 0, isValid: false, validationStatus: validation.error || 'Неверный формат' });
        }
      } catch {
        setUploadedFile({ filename: file.name, puzzleCount: 0, isValid: false, validationStatus: 'Ошибка парсинга JSON' });
      }
    };
    reader.readAsText(file);
  };

  const handleJsonTextSubmit = () => {
    try {
      let cleanedText = jsonText.trim();
      const startIndex = cleanedText.indexOf('{');
      const endIndex = cleanedText.lastIndexOf('}');
      if (startIndex !== -1 && endIndex !== -1) {
        cleanedText = cleanedText.substring(startIndex, endIndex + 1);
      }
      
      const parsed = JSON.parse(cleanedText);
      const validation = JsonValidator.validate(parsed);
      if (validation.success && validation.puzzles) {
        setUploadedFile({ 
          filename: validation.packTitle || 'Свой набор ИИ', 
          puzzleCount: validation.puzzles.length, 
          isValid: true, 
          validationStatus: 'Проверено', 
          puzzles: validation.puzzles,
          packTitle: validation.packTitle,
          packDescription: validation.packDescription,
          packDifficulty: validation.packDifficulty,
          warnings: validation.warnings
        });
        handleApplyPack('custom', validation.puzzles);
        if (!validation.warnings || validation.warnings.length === 0) {
          setActiveTab('library');
        }
        setJsonText('');
      } else {
        setUploadedFile({ filename: 'Вставленный текст', puzzleCount: 0, isValid: false, validationStatus: validation.error || 'Неверный формат' });
      }
    } catch {
      setUploadedFile({ filename: 'Вставленный текст', puzzleCount: 0, isValid: false, validationStatus: 'Ошибка парсинга JSON. Проверьте синтаксис.' });
    }
  };

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files[0];
    if (file) processJsonFile(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processJsonFile(file);
  };

  return (
    <div className="setup-screen">
      <div className="setup-sidebar">
        <div style={{ padding: '32px 24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <img src="/icon.png" alt="ABCHESS Logo" style={{ width: 32, height: 32, borderRadius: 8 }} />
          <h1 className="t-h2">Панель Учителя</h1>
        </div>

        <div className="flex-col gap-1" style={{ flex: 1, padding: '0 12px' }}>
          <button className={`setup-nav-item ${activeTab === 'library' ? 'active' : ''}`} onClick={() => setActiveTab('library')}>
            Библиотека задач
          </button>
          <button className={`setup-nav-item ${activeTab === 'settings' ? 'active' : ''}`} onClick={() => setActiveTab('settings')}>
            Настройки турнира
          </button>
          <button className={`setup-nav-item ${activeTab === 'import' ? 'active' : ''}`} onClick={() => setActiveTab('import')}>
            Импорт JSON
          </button>
          <button className={`setup-nav-item ${activeTab === 'preview' ? 'active' : ''}`} onClick={() => setActiveTab('preview')}>
            Предпросмотр
          </button>
        </div>

        <div style={{ padding: 24, borderTop: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <a 
            href="https://t.me/duesenbek" 
            target="_blank" 
            rel="noreferrer"
            style={{ 
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', 
              color: '#3390ec', textDecoration: 'none', fontSize: '14px', fontWeight: 500,
              padding: '8px', borderRadius: '8px', background: 'rgba(51, 144, 236, 0.1)'
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 2L11 13M22 2L15 22L11 13M11 13L2 9L22 2"/>
            </svg>
            Связаться с разработчиком (@duesenbek)
          </a>
          <button onClick={onStart} disabled={isStarting} className="btn-primary" style={{ width: '100%' }}>
            {isStarting ? 'Запуск...' : 'Начать турнир'}
          </button>
        </div>
      </div>

      <div className="setup-content">
        {activeTab === 'library' && (
          <div style={{ maxWidth: 800 }}>
            <h1 className="t-h1" style={{ marginBottom: 32 }}>Наборы задач</h1>
            <div className="dataset-grid">
              {Object.values(PRESET_PACKS).map((pack) => (
                <div
                  key={pack.id}
                  className={`dataset-card ${selectedPackId === pack.id ? 'active' : ''}`}
                  onClick={() => handleApplyPack(pack.id, pack.puzzles)}
                >
                  <div className="flex-col" style={{ gap: '4px', flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <span className="t-h3">{pack.label}</span>
                      {selectedPackId === pack.id && (
                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--accent)', marginTop: 6 }} />
                      )}
                    </div>
                    <span className="t-caption" style={{ color: 'var(--accent)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{pack.category}</span>
                    <span className="t-body" style={{ marginTop: '8px', fontSize: '13px', lineHeight: 1.4 }}>{pack.description}</span>
                  </div>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--border)' }}>
                    <div className="flex-col">
                      <span className="t-caption" style={{ fontSize: '11px' }}>ЗАДАЧ</span>
                      <span className="t-value">{pack.count}</span>
                    </div>
                    <div className="flex-col" style={{ alignItems: 'flex-end' }}>
                      <span className="t-caption" style={{ fontSize: '11px' }}>СЛОЖНОСТЬ</span>
                      <span className="t-value">{pack.difficulty}</span>
                    </div>
                  </div>
                </div>
              ))}
              
              {uploadedFile?.isValid && (
                <div
                  className={`dataset-card ${selectedPackId === 'custom' ? 'active' : ''}`}
                  onClick={() => handleApplyPack('custom', uploadedFile.puzzles || null)}
                >
                  <div className="flex-col" style={{ gap: '4px', flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <span className="t-h3">{uploadedFile.packTitle || uploadedFile.filename}</span>
                      {selectedPackId === 'custom' && (
                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--accent)', marginTop: 6 }} />
                      )}
                    </div>
                    <span className="t-caption" style={{ color: 'var(--accent)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>СВОЙ НАБОР</span>
                    <span className="t-body" style={{ marginTop: '8px', fontSize: '13px', lineHeight: 1.4 }}>
                      {uploadedFile.packDescription || 'Пользовательский набор задач загруженный из файла или текста.'}
                    </span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--border)' }}>
                    <div className="flex-col">
                      <span className="t-caption" style={{ fontSize: '11px' }}>ЗАДАЧ</span>
                      <span className="t-value">{uploadedFile.puzzleCount}</span>
                    </div>
                    <div className="flex-col" style={{ alignItems: 'flex-end' }}>
                      <span className="t-caption" style={{ fontSize: '11px' }}>СЛОЖНОСТЬ</span>
                      <span className="t-value">{uploadedFile.packDifficulty || 'Разная'}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'import' && (
          <div style={{ maxWidth: 600 }}>
            <h1 className="t-h1" style={{ marginBottom: 32 }}>Импорт задач</h1>
            
            {!uploadedFile ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <div
                  onDragEnter={() => setDragActive(true)}
                  onDragLeave={() => setDragActive(false)}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={handleFileDrop}
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    border: `2px dashed ${dragActive ? 'var(--accent)' : 'var(--border)'}`,
                    borderRadius: 12,
                    padding: '80px 32px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    textAlign: 'center',
                    cursor: 'pointer',
                    background: dragActive ? 'rgba(59, 130, 246, 0.05)' : 'var(--surface)',
                    transition: 'all 0.2s ease',
                  }}
                >
                  <UploadCloud size={48} color={dragActive ? 'var(--accent)' : 'var(--text-secondary)'} style={{ marginBottom: 16 }} />
                  <div className="t-h2" style={{ marginBottom: 8, fontWeight: 600 }}>Drop JSON file</div>
                  <div className="t-body">or click to browse</div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".json,.pgn"
                    style={{ display: 'none' }}
                    onChange={handleFileChange}
                  />
                </div>

                <div style={{ textAlign: 'center', position: 'relative' }}>
                  <div style={{ position: 'absolute', top: '50%', left: 0, right: 0, height: '1px', background: 'var(--border)', zIndex: 1 }}></div>
                  <span className="t-caption" style={{ background: 'var(--bg)', padding: '0 16px', position: 'relative', zIndex: 2 }}>ИЛИ ВСТАВЬТЕ JSON КОД</span>
                </div>

                <div style={{ position: 'relative' }}>
                  <textarea
                    value={jsonText}
                    onChange={(e) => setJsonText(e.target.value)}
                    placeholder="Вставьте сгенерированный JSON сюда..."
                    style={{ 
                      width: '100%', 
                      minHeight: '160px', 
                      background: 'var(--surface)', 
                      border: '1px solid var(--border)', 
                      borderRadius: '12px', 
                      padding: '16px', 
                      color: 'var(--text-primary)', 
                      fontFamily: 'monospace', 
                      fontSize: '13px', 
                      resize: 'vertical',
                      outline: 'none'
                    }}
                  />
                  <button 
                    className="btn-primary" 
                    style={{ position: 'absolute', bottom: '16px', right: '16px', opacity: jsonText.trim() ? 1 : 0.5, cursor: jsonText.trim() ? 'pointer' : 'not-allowed' }}
                    onClick={handleJsonTextSubmit}
                    disabled={!jsonText.trim()}
                  >
                    Загрузить из текста
                  </button>
                </div>
              </div>
            ) : (
              <div style={{
                border: '1px solid var(--border)',
                borderRadius: 12,
                padding: 24,
                background: 'var(--surface)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
                  <div style={{ width: 48, height: 48, borderRadius: 8, background: uploadedFile.isValid ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <FileJson size={24} color={uploadedFile.isValid ? 'var(--success)' : 'var(--danger)'} />
                  </div>
                  <div className="flex-col">
                    <span className="t-h3">{uploadedFile.filename}</span>
                    <span className="t-body" style={{ color: uploadedFile.isValid ? 'var(--success)' : 'var(--danger)' }}>
                      {uploadedFile.validationStatus}
                    </span>
                  </div>
                </div>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', paddingTop: '24px', borderTop: '1px solid var(--border)' }}>
                  <div className="flex-col" style={{ gap: '4px' }}>
                    <span className="t-caption">ЗАДАЧ НАЙДЕНО</span>
                    <span className="t-h2">{uploadedFile.puzzleCount}</span>
                  </div>
                  <div className="flex-col" style={{ gap: '4px', alignItems: 'flex-end' }}>
                    <span className="t-caption">СТАТУС</span>
                    <span className="t-h2" style={{ color: uploadedFile.isValid ? 'var(--success)' : 'var(--danger)' }}>
                      {uploadedFile.isValid ? 'Готово' : 'Ошибка'}
                    </span>
                  </div>
                </div>

                {uploadedFile.warnings && uploadedFile.warnings.length > 0 && (
                  <div style={{ 
                    marginTop: 16, 
                    padding: 16, 
                    background: 'rgba(249, 115, 22, 0.1)', 
                    border: '1px solid rgba(249, 115, 22, 0.3)', 
                    borderRadius: 8,
                    maxHeight: 180,
                    overflowY: 'auto'
                  }}>
                    <span className="t-caption" style={{ color: 'rgb(249, 115, 22)', fontWeight: 'bold', display: 'block', marginBottom: 8 }}>
                      ⚠️ Пропущено задач с ошибками: {uploadedFile.warnings.length}
                    </span>
                    <ul style={{ margin: 0, paddingLeft: 20, fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                      {uploadedFile.warnings.map((w, idx) => (
                        <li key={idx}>{w}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
                  {uploadedFile.isValid && (
                    <button className="btn-primary" onClick={() => setActiveTab('library')} style={{ flex: 1 }}>
                      Перейти в библиотеку
                    </button>
                  )}
                  <button className="btn-secondary" onClick={() => setUploadedFile(null)} style={{ flex: 1 }}>
                    Загрузить другой файл
                  </button>
                </div>
              </div>
            )}

            {/* AI Generator Instructions */}
            <div style={{ marginTop: 40, padding: 24, background: 'var(--surface)', borderRadius: 12, border: '1px solid var(--border)' }}>
              <h2 className="t-h3" style={{ marginBottom: 8 }}>Как создать свой набор задач с помощью ИИ?</h2>
              <p className="t-body" style={{ marginBottom: 16, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                Вы можете попросить ChatGPT, Claude или любую другую нейросеть сгенерировать для вас уникальный набор задач. 
                Скопируйте промпт ниже, измените параметры <span style={{color:'var(--accent)'}}>(тему, сложность, количество)</span> и отправьте нейросети. Сохраните ответ в файл <code>.json</code> и загрузите сюда.
              </p>
              
              <div style={{ position: 'relative', background: 'rgba(0,0,0,0.2)', padding: 16, borderRadius: 8, border: '1px solid var(--border)' }}>
                <button
                  onClick={() => {
                    const prompt = `Сгенерируй JSON файл с шахматными задачами.
Тема: Мат в 2 хода (выбери любую: вилки, связки, эндшпиль и т.д.)
Количество: 5 задач
Уровень: для начинающих детей

ЖЕСТКИЕ ШАХМАТНЫЕ ПРАВИЛА ДЛЯ ИИ:
1. НЕ ПРИДУМЫВАЙ позиции самостоятельно! Это всегда приводит к грубым шахматным ошибкам, невозможным ходам и зависаниям.
   Вместо этого найди в своей базе знаний РЕАЛЬНЫЕ известные учебные задачи или позиции из исторических партий гроссмейстеров.
2. ЕСЛИ ТЕМА "ВИЛКИ" — ход решения должен РЕАЛЬНО делать вилку (нападать сразу на две фигуры).
   Убедись, что соперник не может поставить тебе мат на следующем ходу (например, по 1-й горизонтали), если только твой ход не является шахом с последующим взятием.
3. ЕСЛИ ТЕМА "СВЯЗКИ" — связывающая фигура обязательно должна быть ЗАЩИЩЕНА. Связанная фигура соперника не должна иметь возможности бесплатно съесть твою связывающую фигуру.
4. ЕСЛИ ТЕМА "МАТ" — финальный ход в массиве solution ОБЯЗАТЕЛЬНО должен приводить к состоянию мата (checkmate), а не просто к шаху!
5. УНИКАЛЬНОСТЬ: Каждая задача должна иметь уникальную позицию. Не повторяй одну и ту же позицию несколько раз с заменой пары пешек.
6. ВАЛИДАЦИЯ FEN: 
   - На доске должен быть строго 1 белый и 1 черный король.
   - Сторона, которая НЕ делает ход, НЕ должна находиться под шахом (иначе позиция нелегальна!).
   - Не может быть пешек на 1-й или 8-й горизонтали.

Ходы в массиве "solution" перечисли в формате UCI (например "e2e4", "g8f6") или SAN (например "Nf3", "Qxf7+").

Ответ должен быть СТРОГО в формате JSON без markdown блоков и лишнего текста. Формат:
{
  "schemaVersion": 1,
  "packTitle": "Название набора (например: Маты для детей)",
  "packDescription": "Краткое описание набора",
  "packDifficulty": "Легкая",
  "puzzles": [
    {
      "id": "uniq-id-1",
      "type": "tactic",
      "validation": "exact-moves",
      "title": "Название задачи",
      "fen": "FEN-строка шахматной позиции",
      "solution": ["e2e4", "e7e5"],
      "description": "Краткая подсказка для ученика"
    }
  ]
}`;
                    navigator.clipboard.writeText(prompt);
                    setCopiedPrompt(true);
                    setTimeout(() => setCopiedPrompt(false), 2000);
                  }}
                  style={{
                    position: 'absolute', top: 12, right: 12,
                    background: 'var(--surface-hover)', border: '1px solid var(--border)',
                    borderRadius: 6, padding: '6px 12px', display: 'flex', alignItems: 'center', gap: 6,
                    color: copiedPrompt ? 'var(--success)' : 'var(--text-primary)', cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                >
                  {copiedPrompt ? <CheckCircle2 size={14} /> : <Copy size={14} />}
                  <span style={{ fontSize: 12, fontWeight: 500 }}>{copiedPrompt ? 'Скопировано!' : 'Копировать'}</span>
                </button>

                <pre style={{ margin: 0, whiteSpace: 'pre-wrap', fontSize: 13, color: 'var(--text-secondary)', fontFamily: 'monospace', lineHeight: 1.5, paddingRight: 100 }}>
                  <span style={{color: 'var(--accent)'}}>Сгенерируй JSON файл с шахматными задачами.</span><br/>
                  Тема: Мат в 2 хода (выбери любую: вилки, связки, эндшпиль и т.д.)<br/>
                  Количество: 5 задач<br/>
                  Уровень: для начинающих детей<br/><br/>
                  <span style={{color: 'var(--danger)', fontWeight: 'bold'}}>ЖЕСТКИЕ ШАХМАТНЫЕ ПРАВИЛА ДЛЯ ИИ:</span><br/>
                  1. НЕ ПРИДУМЫВАЙ позиции сам. Используй РЕАЛЬНЫЕ учебные задачи или партии из своей базы данных.<br/>
                  2. ЕСЛИ ТЕМА "ВИЛКИ" — убедись, что это РЕАЛЬНАЯ вилка, и твой король не получает мат на следующем ходу.<br/>
                  3. ЕСЛИ ТЕМА "СВЯЗКИ" — связывающая фигура обязательно должна быть ЗАЩИЩЕНА от взятия.<br/>
                  4. ЕСЛИ ТЕМА "МАТ" — финальный ход в решении должен ставить МАТ (checkmate), а не просто шах.<br/>
                  5. УНИКАЛЬНОСТЬ: Задачи не должны повторяться с мелкими изменениями.<br/>
                  6. ВАЛИДАЦИЯ FEN: Должно быть по 1 королю. Сторона, не делающая ход, НЕ должна быть под шахом.<br/><br/>
                  Ответ должен быть СТРОГО в формате JSON без markdown блоков. Формат:<br/>
{`{
  "schemaVersion": 1,
  "packTitle": "Название набора (например: Маты для детей)",
  "packDescription": "Краткое описание набора",
  "packDifficulty": "Легкая",
  "puzzles": [
    {
      "id": "uniq-id-1",
      "type": "tactic",
      "validation": "exact-moves",
      "title": "Название задачи",
      "fen": "FEN-строка шахматной позиции",
      "solution": ["e2e4", "e7e5"],
      "description": "Краткая подсказка для ученика"
    }
  ]
}`}
                </pre>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div style={{ maxWidth: 600 }}>
            <h1 className="t-h1" style={{ marginBottom: 32 }}>Настройки турнира</h1>
            <div className="flex-col gap-4">
              
              <div className="flex-col gap-1">
                <label className="t-section">Количество игроков</label>
                <div className="flex-row gap-2">
                  <button className="btn-secondary" style={playerCount === 2 ? { borderColor: 'var(--accent)', color: 'var(--accent)' } : {}} onClick={() => setPlayerCount(2)}>2 Игрока</button>
                  <button className="btn-secondary" style={playerCount === 4 ? { borderColor: 'var(--accent)', color: 'var(--accent)' } : {}} onClick={() => setPlayerCount(4)}>4 Игрока</button>
                </div>
              </div>

              <div className="flex-col gap-1">
                <label className="t-section">Время раунда (сек)</label>
                <input
                  type="number"
                  className="input-field"
                  value={localTime}
                  onChange={(e) => setLocalTime(Number(e.target.value))}
                  onBlur={() => setDefaultTimeLimit(Math.max(10, localTime))}
                />
              </div>

              <div className="flex-col gap-1">
                <label className="t-section">Тема доски</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '8px' }}>
                  {[
                    { id: 'zone', label: 'Турнирная', colors: ['#2A2F3A', '#1A1D24'] },
                    { id: 'classic', label: 'Классическая', colors: ['#F0D9B5', '#B58863'] },
                    { id: 'emerald', label: 'Изумрудная', colors: ['#EBECD0', '#739552'] }
                  ].map(theme => (
                    <button
                      key={theme.id}
                      onClick={() => setBoardTheme(theme.id as any)}
                      style={{
                        padding: '8px',
                        background: 'var(--surface)',
                        border: `2px solid ${boardTheme === theme.id ? 'var(--accent)' : 'var(--border)'}`,
                        borderRadius: '8px',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '8px',
                        cursor: 'pointer',
                        transition: 'border-color 0.2s'
                      }}
                    >
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', width: '40px', height: '40px', borderRadius: '4px', overflow: 'hidden', border: '1px solid var(--border)' }}>
                        <div style={{ backgroundColor: theme.colors[0] }} />
                        <div style={{ backgroundColor: theme.colors[1] }} />
                        <div style={{ backgroundColor: theme.colors[1] }} />
                        <div style={{ backgroundColor: theme.colors[0] }} />
                      </div>
                      <span className="t-caption" style={{ color: boardTheme === theme.id ? 'var(--accent)' : 'var(--text-secondary)' }}>
                        {theme.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* ── HINT SETTINGS ── */}
              <div style={{ borderTop: '1px solid var(--border)', paddingTop: '24px' }}>
                <label className="t-section" style={{ display: 'block', marginBottom: '16px' }}>Система подсказок</label>

                {/* Hint Type 1: Move Hints */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <div>
                    <div className="t-body" style={{ fontWeight: 500 }}>Подсказки ходов</div>
                    <div className="t-caption" style={{ color: 'var(--text-secondary)' }}>Подсвечивает возможные клетки при клике на фигуру</div>
                  </div>
                  <button
                    onClick={() => setShowMoveHints(!showMoveHints)}
                    style={{
                      width: 44, height: 24, borderRadius: 12,
                      background: showMoveHints ? 'var(--accent)' : 'var(--surface-hover)',
                      border: 'none', cursor: 'pointer', position: 'relative', transition: 'background 0.2s',
                      flexShrink: 0,
                    }}
                  >
                    <div style={{
                      width: 18, height: 18, borderRadius: '50%', background: 'white',
                      position: 'absolute', top: 3,
                      left: showMoveHints ? 23 : 3,
                      transition: 'left 0.2s',
                    }} />
                  </button>
                </div>

                {/* Hint Type 2: Solution Hints */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <div>
                    <div className="t-body" style={{ fontWeight: 500 }}>Подсказки решения</div>
                    <div className="t-caption" style={{ color: 'var(--text-secondary)' }}>Кнопка 💡 подсвечивает правильный ход зелёным</div>
                  </div>
                  <button
                    onClick={() => setShowSolutionHints(!showSolutionHints)}
                    style={{
                      width: 44, height: 24, borderRadius: 12,
                      background: showSolutionHints ? 'var(--accent)' : 'var(--surface-hover)',
                      border: 'none', cursor: 'pointer', position: 'relative', transition: 'background 0.2s',
                      flexShrink: 0,
                    }}
                  >
                    <div style={{
                      width: 18, height: 18, borderRadius: '50%', background: 'white',
                      position: 'absolute', top: 3,
                      left: showSolutionHints ? 23 : 3,
                      transition: 'left 0.2s',
                    }} />
                  </button>
                </div>

                {/* Max solution hints per puzzle */}
                {showSolutionHints && (
                  <div className="flex-col gap-1" style={{ marginBottom: '12px' }}>
                    <label className="t-caption" style={{ color: 'var(--text-secondary)' }}>Максимум подсказок на задачу (0 = без ограничений)</label>
                    <div className="flex-row gap-2">
                      {[0, 1, 2, 3].map(n => (
                        <button
                          key={n}
                          className="btn-secondary"
                          style={maxSolutionHintsPerPuzzle === n ? { borderColor: 'var(--accent)', color: 'var(--accent)' } : {}}
                          onClick={() => setMaxSolutionHintsPerPuzzle(n)}
                        >
                          {n === 0 ? '∞' : n}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Max attempts per puzzle */}
                <div className="flex-col gap-1">
                  <label className="t-caption" style={{ color: 'var(--text-secondary)' }}>Максимум попыток на задачу (0 = без ограничений)</label>
                  <div className="flex-row gap-2">
                    {[0, 3, 5, 10].map(n => (
                      <button
                        key={n}
                        className="btn-secondary"
                        style={maxAttemptsPerPuzzle === n ? { borderColor: 'var(--accent)', color: 'var(--accent)' } : {}}
                        onClick={() => setMaxAttemptsPerPuzzle(n)}
                      >
                        {n === 0 ? '∞' : n}
                      </button>
                    ))}
                  </div>
                  {maxAttemptsPerPuzzle > 0 && (
                    <span className="t-caption" style={{ color: 'var(--text-secondary)', marginTop: 4 }}>При исчерпании попыток задача пропускается автоматически</span>
                  )}
                </div>
              </div>

              <div className="flex-col gap-1">
                <label className="t-section">Имена игроков</label>
                {Array.from({ length: playerCount }).map((_, i) => (
                  <input
                    key={`name-${i}`}
                    className="input-field"
                    value={names[i]}
                    onChange={(e) => {
                      const n = [...names];
                      n[i] = e.target.value;
                      setNames(n);
                    }}
                    placeholder={`Игрок ${i + 1}`}
                  />
                ))}
              </div>

              <div className="flex-col gap-1">
                <label className="t-section">Аватары игроков</label>
                {Array.from({ length: playerCount }).map((_, i) => (
                  <div key={`avatar-${i}`} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ minWidth: '70px', color: 'var(--text-secondary)' }}>Игрок {i + 1}</span>
                    <button
                      className="btn-secondary"
                      style={{ padding: '4px', display: 'flex', alignItems: 'center', gap: '8px', flex: 1, justifyContent: 'flex-start' }}
                      onClick={() => setAvatarPickerFor(i)}
                    >
                      <img src={avatars[i]} alt="Avatar" width={32} height={32} style={{ borderRadius: '50%' }} />
                      <span style={{ color: 'var(--text-primary)' }}>Выбрать аватар</span>
                    </button>
                  </div>
                ))}
              </div>

              <Modal 
                isOpen={avatarPickerFor !== null} 
                onClose={() => setAvatarPickerFor(null)}
                title={`Выберите аватар для Игрока ${avatarPickerFor !== null ? avatarPickerFor + 1 : ''}`}
                maxWidth="lg"
              >
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(64px, 1fr))', gap: '12px', padding: '8px' }}>
                  {Array.from({ length: 45 }).map((_, idx) => {
                    const avatarUrl = `/avatars/${idx + 1}.png`;
                    const isSelected = avatarPickerFor !== null && avatars[avatarPickerFor] === avatarUrl;
                    return (
                      <button
                        key={idx}
                        onClick={() => {
                          if (avatarPickerFor !== null) {
                            const newAvatars = [...avatars];
                            newAvatars[avatarPickerFor] = avatarUrl;
                            setAvatars(newAvatars);
                            setAvatarPickerFor(null);
                          }
                        }}
                        style={{
                          background: 'none',
                          border: `2px solid ${isSelected ? 'var(--accent)' : 'transparent'}`,
                          borderRadius: '50%',
                          padding: '2px',
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                          opacity: isSelected ? 1 : 0.8,
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.opacity = '1';
                          e.currentTarget.style.transform = 'scale(1.05)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.opacity = isSelected ? '1' : '0.8';
                          e.currentTarget.style.transform = 'scale(1)';
                        }}
                      >
                        <img 
                          src={avatarUrl} 
                          alt={`Avatar ${idx + 1}`} 
                          style={{ width: '100%', height: 'auto', aspectRatio: '1', borderRadius: '50%', objectFit: 'cover' }} 
                        />
                      </button>
                    );
                  })}
                </div>
              </Modal>

            </div>
          </div>
        )}

        {activeTab === 'preview' && (
          <div style={{ maxWidth: 800 }}>
            <h1 className="t-h1" style={{ marginBottom: 32 }}>Предпросмотр задач</h1>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {(customPuzzles || defaultPuzzles).map((puzzle, index) => (
                <div key={puzzle.id} style={{ background: 'var(--surface)', padding: '24px', borderRadius: '12px', border: '1px solid var(--border)' }}>
                  <h3 className="t-h3" style={{ marginBottom: 8 }}>{index + 1}. {puzzle.title}</h3>
                  <div className="t-body" style={{ color: 'var(--text-secondary)', marginBottom: 16 }}>{puzzle.description}</div>
                  
                  <div style={{ display: 'flex', gap: '24px', alignItems: 'flex-start' }}>
                    <div style={{ width: '240px', flexShrink: 0, borderRadius: '4px', overflow: 'hidden', border: '1px solid var(--border)' }}>
                      <Chessboard 
                        options={{
                          position: puzzle.fen,
                          boardStyle: { width: 240, height: 240 },
                          allowDragging: false,
                          boardOrientation: puzzle.fen.split(' ')[1] === 'b' ? 'black' : 'white'
                        }}
                      />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="t-caption" style={{ color: 'var(--text-secondary)' }}>FEN позиция:</div>
                      <code style={{ display: 'block', padding: '12px', background: 'rgba(0,0,0,0.2)', borderRadius: '6px', fontSize: '12px', wordBreak: 'break-all', marginBottom: '16px', border: '1px solid rgba(255,255,255,0.05)', color: 'var(--text-primary)' }}>
                        {puzzle.fen}
                      </code>
                      <div className="t-caption" style={{ color: 'var(--text-secondary)' }}>Победная серия ходов:</div>
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '8px' }}>
                        {puzzle.solution.map((move, i) => (
                          <span key={i} style={{ padding: '6px 10px', background: 'var(--accent)', color: 'white', borderRadius: '6px', fontSize: '13px', fontWeight: 600, letterSpacing: '0.05em' }}>
                            {move}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
