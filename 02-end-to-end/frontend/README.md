# Code Interview Platform - Frontend

React + Vite frontend for the online coding interview platform.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file (see `.env.example`):
```
VITE_WS_URL=http://localhost:3001
```

3. Start the development server:
```bash
npm run dev
```

4. Build for production:
```bash
npm run build
```

## Features

- Real-time code collaboration using WebSocket
- Syntax highlighting for multiple languages (Monaco Editor)
- Code execution in the browser (JavaScript)
- Room creation and link sharing
- User count display

## Technologies

- React 19
- Vite
- Monaco Editor
- Socket.io Client
- UUID
