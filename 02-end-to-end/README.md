## AI Development Tools Zoomcamp - Homework 2

The prompts and configuration of the project is explained here.

Reference [here](https://github.com/DataTalksClub/ai-dev-tools-zoomcamp/blob/main/cohorts/2025/02-end-to-end/homework.md) for the specifications of the homework.

The high level requirements
---
We will implement a platform for online coding interviews.

The app should be able to do the following:

- Create a link and share it with candidates
- Allow everyone who connects to edit code in the code panel
- Show real-time updates to all connected users
- Support syntax highlighting for multiple languages
- Execute code safely in the browser

You can choose any technologies you want. For example:
- Frontend: React + Vite
- Backend: Express.js

---
## Question 1 - Create Frontend and Backend

> Implement a platform for online coding interviews. The app should be able to do the following: Create a link and share it with candidates; Allow everyone who connects to edit code in the code panel; Show real-time updates to all connected users; Support syntax highlighting for multiple languages; Execute code safely in the browser.

> Implement frontend in the ./frontend folder and backend in the ./backend folder. The frontend uses React + Vite. After implementing the frontend, extract OpenAPI specs from the frontend, and then create the backend uses Express.js based on the OpenAPI specs.

## Implementation Status

✅ **Completed**: Frontend and backend have been implemented with all required features.

### Features Implemented

- ✅ Create a link and share it with candidates
- ✅ Allow everyone who connects to edit code in the code panel
- ✅ Show real-time updates to all connected users (WebSocket)
- ✅ Support syntax highlighting for multiple languages (Monaco Editor)
- ✅ Execute code safely in the browser (JavaScript execution)

### Project Structure

```
02-end-to-end/
├── frontend/          # React + Vite frontend
├── backend/           # Express.js backend with Socket.io
└── openapi.yaml       # OpenAPI specification
```

### Setup Instructions

#### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file (optional, defaults are provided):
```
PORT=3001
FRONTEND_URL=http://localhost:5173
```

4. Start the backend server:
```bash
npm start
```

The backend will run on `http://localhost:3001`

#### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file (optional, defaults are provided):
```
VITE_WS_URL=http://localhost:3001
```

4. Start the development server:
```bash
npm run dev
```

The frontend will run on `http://localhost:5173` (or another port if 5173 is taken)

### Usage

1. Open the frontend in your browser (default: `http://localhost:5173`)
2. A new room will be automatically created with a unique room ID
3. Click "Share Link" to copy the room URL
4. Share the link with candidates - they can join and collaborate in real-time
5. All users can edit code, change languages, and see updates in real-time
6. Use the "Run Code" button to execute JavaScript code in the browser

### API Documentation

The OpenAPI specification is available in `openapi.yaml`. It documents:
- REST API endpoints for room management
- WebSocket events for real-time collaboration

### Technologies Used

**Frontend:**
- React 19
- Vite
- Monaco Editor (syntax highlighting)
- Socket.io Client (WebSocket)
- UUID (room ID generation)

**Backend:**
- Express.js
- Socket.io (WebSocket server)
- CORS (cross-origin support)

---
## Question 2: