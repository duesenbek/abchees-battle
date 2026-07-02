# Архитектура Проекта ABCHESS Duel

Проект использует упрощенную **Feature-based** архитектуру (похожую на Feature-Sliced Design).
Это обеспечивает высокую масштабируемость и изоляцию бизнес-логики.

## Слои (Layers)

1. **`src/core/`** — Ядро приложения. Инфраструктура, сервисы и глобальный State (Zustand). Этот слой не зависит от React-компонентов.
2. **`src/shared/`** — Переиспользуемые элементы (Theme, UI Kit).
3. **`src/features/`** — Бизнес-фичи. Каждый модуль инкапсулирует свой UI, стили и локальную логику.

## Диаграмма Потоков Данных (Data Flow)

Ниже представлена диаграмма взаимодействия UI-слоя с сервисами и стейтом.

```mermaid
graph TD
    %% UI Layer
    subgraph Features ["Features Layer (UI)"]
        GameZone["GameZone.tsx"]
        CentralHub["CentralHub.tsx"]
        AdminPanel["AdminPanel.tsx"]
        Leaderboard["Leaderboard.tsx"]
    end

    %% State Layer
    subgraph CoreStore ["Core Store"]
        GameStore[("useGameStore (Zustand)")]
    end

    %% Services Layer
    subgraph CoreServices ["Core Services"]
        ChessEngine[["ChessEngine (chess.js)"]]
        TimerService[["TimerService"]]
        AudioManager[["AudioManager"]]
        PuzzleAPI[["PuzzleApiService (Mock)"]]
        AuthService[["AuthService (Mock)"]]
    end

    %% Flow interactions
    GameZone -- "Dispatches Move" --> GameStore
    AdminPanel -- "Uploads Puzzles" --> GameStore
    GameStore -- "Validates Move" --> ChessEngine
    GameStore -- "Plays Sound" --> AudioManager
    
    App["App.tsx"] -- "Starts Game" --> GameStore
    App -- "Initializes Timer" --> TimerService
    TimerService -. "onTick" .-> GameStore

    PuzzleAPI -- "Provides Data" --> GameStore
```

## Подготовка к Онлайну (WebSocket)
В папке `core/services/` созданы заглушки сервисов (например, `MatchmakingService`), которые в будущем будут заменены на реальные подключения (Socket.io или native WebSockets). UI компоненты не придется переписывать, так как они взаимодействуют только со стором.
