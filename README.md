# ABCHESS Duel ♟️

A high-performance, real-time multiplayer chess puzzle battle application. Compete with 2-4 players to solve chess puzzles as fast as possible.

## Features ✨

- **Real-time multiplayer** (2 or 4 players)
- **High-quality UI/UX** with Glassmorphism, animations, and sound effects
- **Progressive Web App (PWA)** support for mobile and desktop installation
- **Custom Puzzles:** Upload your own `.json` chess puzzle sets in the Teacher Panel
- **Offline Mode:** Assets are cached for instant loading

## Setup 🚀

1. Clone the repository
2. Run `npm install`
3. Run `npm run dev` to start the development server
4. Open `http://localhost:5173`

## Environment Setup

Copy `.env.example` to `.env` if you plan to add API integration.

```bash
cp .env.example .env
```

## Build 📦

To build for production:

```bash
npm run build
```

You can preview the built app using:

```bash
npm run preview
```

## Built With 🛠️

- [React](https://reactjs.org/) + [Vite](https://vitejs.dev/)
- [Zustand](https://github.com/pmndrs/zustand) (State Management)
- [TailwindCSS v4](https://tailwindcss.com/)
- [chess.js](https://github.com/jhlywa/chess.js) + [react-chessboard](https://github.com/Clariity/react-chessboard)
- [Lucide React](https://lucide.dev/) (Icons)
- [Vite PWA](https://vite-pwa-org.netlify.app/)
