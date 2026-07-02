# API Документация (Draft)

На данный момент API изолирован в заглушках внутри `src/core/services`.

## PuzzleApiService
**Метод:** `fetchDailyPuzzles(): Promise<Puzzle[]>`
Возвращает список шахматных задач в формате JSON.
Сейчас возвращает локальный JSON (`src/data/defaultPuzzles.json`) с задержкой 500мс для симуляции сети.

## AuthService
**Метод:** `login(): Promise<User>`
**Метод:** `logout(): Promise<void>`
Планируется интеграция с JWT токенами.

## MatchmakingService
**Метод:** `findMatch(): Promise<Match>`
**Метод:** `connectToWebSocket(matchId: string): void`
Подготовка к Socket.io. Все ходы будут отправляться через WS на бэкенд, который будет транслировать их оппонентам.
