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

#### Quick Start (Recommended)

Run both frontend and backend together from the root directory:

1. Install all dependencies:
```bash
npm run install:all
```

2. Start both servers:
```bash
npm run dev
```

This will start:
- Backend on `http://localhost:3001`
- Frontend on `http://localhost:5173`

#### Individual Setup

If you prefer to run them separately:

##### Backend Setup

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

##### Frontend Setup

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

1. Start both servers using `npm run dev` from the root directory
2. Open the frontend in your browser (default: `http://localhost:5173`)
3. A new room will be automatically created with a unique room ID
4. Click "Share Link" to copy the room URL
5. Share the link with candidates - they can join and collaborate in real-time
6. All users can edit code, change languages, and see updates in real-time
7. Use the "Run Code" button to execute JavaScript code in the browser

### Available Scripts

From the root directory (`02-end-to-end/`):

- `npm run dev` - Start both backend and frontend in development mode
- `npm start` - Start backend in production mode and frontend in dev mode
- `npm run build` - Build the frontend for production
- `npm test` - Run backend integration tests
- `npm run test:watch` - Run tests in watch mode
- `npm run install:all` - Install dependencies for root, backend, and frontend

### API Documentation

The OpenAPI specification is available in `openapi.yaml`. It documents:
- REST API endpoints for room management
- WebSocket events for real-time collaboration

### Syntax Highlighting

The platform uses **Monaco Editor** (the same editor that powers VS Code) for syntax highlighting. The following features are supported:

- ✅ **JavaScript** - Full syntax highlighting with semantic highlighting
- ✅ **Python** - Full syntax highlighting with semantic highlighting
- ✅ **Java, C++, C#, Go, Rust, TypeScript** - Syntax highlighting support

**Enhanced Features:**
- Color-coded brackets and parentheses
- Semantic highlighting (variables, functions, keywords)
- Line highlighting
- Format on paste and type
- Auto-indentation
- Code folding

When switching languages, the editor automatically updates the syntax highlighting. If the code is empty or matches the default template, it will load a language-appropriate template.

### Code Execution (WASM)

The platform supports **secure code execution in the browser** using WebAssembly (WASM). Code execution happens entirely in the browser - no code is sent to the server for security reasons.

**Supported Languages:**
- ✅ **JavaScript** - Native browser execution with console output capture
- ✅ **Python** - Executed via **Pyodide** (Python compiled to WASM)

**Pyodide** is the library used for compiling Python to WebAssembly. It's the standard library used by AI tools and development platforms for running Python code securely in the browser. Pyodide is maintained by Mozilla and provides a full Python 3.x runtime compiled to WebAssembly.

**Features:**
- Secure execution - all code runs in the browser sandbox
- No server-side execution - protects server resources
- Real-time output - see results immediately
- Error handling - clear error messages for debugging
- Python standard library support via Pyodide

**How it works:**
1. JavaScript code executes natively in the browser using the Function constructor
2. Python code is executed using Pyodide, which:
   - Loads Python runtime from CDN (first load may take a few seconds)
   - Compiles Python to WebAssembly
   - Executes in a secure browser sandbox
   - Captures stdout/stderr for display

**Note:** The first time Python code is executed, Pyodide needs to download the Python runtime (~10MB) from CDN. This is a one-time download that's cached by the browser.

### Technologies Used

**Frontend:**
- React 19
- Vite
- Monaco Editor (syntax highlighting with semantic highlighting)
- Socket.io Client (WebSocket)
- UUID (room ID generation)
- **Pyodide** (Python to WASM compilation for secure browser execution)

**Backend:**
- Express.js
- Socket.io (WebSocket server)
- CORS (cross-origin support)

### Docker Containerization

The application is containerized using Docker with a multi-stage build process. Both backend and frontend are served from a single container.

**Base Image:** `node:20-alpine` (Node.js 20 LTS on Alpine Linux for smaller image size)

**Docker Features:**
- Multi-stage build for optimized image size
- Frontend built in separate stage
- Backend dependencies installed separately
- Non-root user for security
- Proper signal handling with dumb-init
- Health checks included

**Building the Docker Image:**

```bash
# Build the image
docker build -t code-interview-platform .

# Or using docker-compose
docker-compose build
```

**Running with Docker:**

```bash
# Run the container
docker run -p 3001:3001 code-interview-platform

# Or using docker-compose
docker-compose up
```

**Docker Compose:**

The `docker-compose.yml` file includes:
- Service configuration
- Port mapping (3001:3001)
- Environment variables
- Health checks
- Restart policies

**Environment Variables:**

- `NODE_ENV=production` - Production mode
- `PORT=3001` - Server port
- `FRONTEND_URL=http://localhost:3001` - Frontend URL (for CORS)

**Access the Application:**

Once running, access the application at:
- Frontend: `http://localhost:3001`
- API: `http://localhost:3001/api/rooms`
- WebSocket: `ws://localhost:3001`

**Cloud Deployment:**

- **AWS Deployment:** See [AWS_DEPLOYMENT.md](./AWS_DEPLOYMENT.md) for detailed AWS deployment guides
  - AWS App Runner (easiest, recommended)
  - AWS ECS with Fargate (production-ready)
  - AWS Elastic Beanstalk (simpler alternative)
  
- **Other Platforms:** See [DEPLOYMENT.md](./DEPLOYMENT.md) for other cloud options:
  - Railway (easiest, recommended for beginners)
  - Render (simple, reliable)
  - Fly.io (global edge deployment)
  - Google Cloud Run (serverless)
  - DigitalOcean App Platform

**Docker Image Size:**

The multi-stage build results in a smaller final image by:
- Only including production dependencies
- Excluding build tools and dev dependencies
- Using Alpine Linux base image

---
## Question 2:

Ask AI to write integration tests that check that the interaction between client and server works.

> Write integration tests that check that the interaction between client and server works. Run the integration tests.

# Integration tests summary
Test coverage
REST API endpoints (4 tests):
- ✅ Create room with auto-generated ID
- ✅ Create room with provided roomId
- ✅ Get room information for existing room
- ✅ Return 404 for non-existent room
WebSocket events (11 tests):
- ✅ Client can join a room
- ✅ Users are notified when someone joins
- ✅ New users receive current room state
- ✅ Invalid room ID handling
- ✅ Code updates broadcast to other users
- ✅ Room state updates when code changes
- ✅ Language updates when changed
- ✅ Updates don't broadcast to sender
- ✅ Users are notified when someone leaves
- ✅ User count decrements on disconnect
End-to-end integration (1 test):
- ✅ Complete interview session flow (REST API → WebSocket join → code updates → multi-user collaboration)

Command to run tests:
`cd /Users/kelvinchan/Documents/dev/aidev/ai-dev-tools-zoomcamp/02-end-to-end/backend && npm test`
---

## Question 3: Running Both Client and Server

Now let's make it possible to run both client and server at the same time. Use `concurrently` for that.

What's the command you have in `package.json` for `npm dev` for running both?

> Make it possible to run both client and server at the same time. Use concurrently for that.

---

## Question 4: Syntax Highlighting

Let's now add support for syntax highlighting for JavaScript and Python.

> add support for syntax highlighting for JavaScript and Python

---

## Question 5: Code Execution

Now let's add code execution.

For security reasons, we don't want to execute code directly on the server. Instead, let's use WASM to execute the code only in the browser.

Which library did AI use for compiling Python to WASM?

> Let's add code execution. For security reasons, we don't want to execute code directly on the server. Instead, let's use WASM to execute the code only in the browser.

---

## Question 6: Containerization

Now let's containerize our application. Ask AI to help you create a Dockerfile for the application. Put both backend and frontend in one container.

What's the base image you used for your Dockerfile?

> Containerize our application. Create a Dockerfile for the application. Put both backedn and frontend in one container.

---

## Question 7: Deployment

Now let's deploy it. Choose a service to deploy your application.

Which service did you use for deployment?

