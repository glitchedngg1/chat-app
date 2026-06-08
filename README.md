<div align="center">

# 💬 ChatFlow — Real-Time Chat Application

**A full-stack, real-time messaging platform built with React, Node.js, Socket.io & MongoDB.**

![Node.js](https://img.shields.io/badge/Node.js-18%2B-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![Socket.io](https://img.shields.io/badge/Socket.io-4.x-010101?style=for-the-badge&logo=socketdotio&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-7.x-47A248?style=for-the-badge&logo=mongodb&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-5.x-646CFF?style=for-the-badge&logo=vite&logoColor=white)

</div>

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Database Schemas](#-database-schemas)
- [API Endpoints](#-api-endpoints)
- [Socket.io Events](#-socketio-events)
- [UI Design](#-ui-design)
- [Prerequisites](#-prerequisites)
- [Installation & Setup](#-installation--setup)
- [Running the Application](#-running-the-application)
- [Environment Variables](#-environment-variables)
- [Usage Guide](#-usage-guide)
- [Troubleshooting](#-troubleshooting)

---

## 🌟 Overview

**ChatFlow** is a production-ready, real-time chat application that enables users to communicate instantly across multiple chat rooms. It requires no sign-up — just pick a username and start chatting. Messages persist in MongoDB so conversations survive page refreshes and reconnections.

The app features a sleek dark-themed UI inspired by modern messaging platforms like WhatsApp and Discord, with smooth animations, typing indicators, and live presence tracking.

---

## ✨ Features

### 🔐 Authentication
- **Username-only entry** — no password or email required
- Username saved in `localStorage` for seamless session persistence across page refreshes
- Avatar initials auto-generated from the username

### 🏠 Chat Rooms
| Room | Emoji | Description |
|------|-------|-------------|
| `general` | 💬 | Default public room for everyone |
| `tech` | 💻 | Technology discussions |
| `random` | 🎲 | Off-topic conversations |
| *Custom* | 🔹 | Any room created by users |

- **Create custom rooms** via the sidebar "New Room" button
- Active room is visually highlighted in the sidebar
- Real-time online user count shown per room

### 💬 Real-Time Messaging
- **Instant delivery** via Socket.io WebSocket connections
- Messages appear without any page refresh
- **Auto-scroll** to the latest message on new arrivals
- **Typing indicator** — animated dots with "X is typing..." text
- **Timestamps** displayed on every message
- **Enter to send**, Shift+Enter for new lines

### 📂 Message History
- All messages persisted in **MongoDB**
- Last **50 messages** loaded instantly when joining a room
- History survives page reloads and server restarts

### 👥 Online Presence
- Live list of online users in the current room
- **"User joined"** and **"User left"** system notifications in the chat
- Online count updates in real-time in both header and sidebar
- Green pulsing dot indicator for each online user

### 📱 Responsive Design
- **Desktop**: Full two-panel layout (sidebar + chat)
- **Mobile**: Sidebar accessible via hamburger menu with overlay backdrop
- Works seamlessly on all screen sizes (480px → 4K)

---

## 🛠 Tech Stack

### Frontend
| Technology | Version | Purpose |
|-----------|---------|---------|
| React.js | 18.2 | UI framework |
| Vite | 5.x | Build tool & dev server |
| Socket.io-client | 4.7 | Real-time WebSocket client |
| Vanilla CSS3 | — | Styling with CSS custom properties |
| Inter (Google Font) | — | Typography |

### Backend
| Technology | Version | Purpose |
|-----------|---------|---------|
| Node.js | 18+ | JavaScript runtime |
| Express.js | 4.18 | HTTP server & REST API |
| Socket.io | 4.7 | WebSocket server |
| Mongoose | 8.x | MongoDB ODM |
| CORS | 2.8 | Cross-origin resource sharing |
| dotenv | 16.x | Environment variable management |

### Database
| Technology | Purpose |
|-----------|---------|
| MongoDB | Persistent storage for messages & rooms |

---

## 📁 Project Structure

```
chat-app/
├── README.md
│
├── server/                          # Node.js Backend
│   ├── server.js                    # Main entry — Express + Socket.io + MongoDB
│   ├── package.json
│   ├── .env                         # Environment variables (PORT, MONGO_URI, etc.)
│   │
│   ├── models/
│   │   ├── Message.js               # Mongoose schema for chat messages
│   │   └── Room.js                  # Mongoose schema for chat rooms
│   │
│   ├── routes/
│   │   ├── messages.js              # GET /api/messages/:room
│   │   └── rooms.js                 # GET /api/rooms  |  POST /api/rooms
│   │
│   └── socket/
│       └── socketHandler.js         # All Socket.io event logic
│
└── client/                          # React Frontend (Vite)
    ├── index.html                   # HTML entry point
    ├── vite.config.js               # Vite config + API proxy
    ├── package.json
    │
    └── src/
        ├── main.jsx                 # React DOM root render
        ├── App.jsx                  # Root component — auth, rooms, layout
        ├── index.css                # Global design system & CSS variables
        │
        ├── socket/
        │   └── socket.js            # Singleton Socket.io-client instance
        │
        └── components/
            ├── ChatWindow.jsx        # Messages list + input bar
            ├── RoomList.jsx          # Left sidebar (rooms + online users)
            ├── MessageBubble.jsx     # Individual message renderer
            ├── UserList.jsx          # Online users list
            └── TypingIndicator.jsx   # Animated typing dots
```

---

## 🗄 Database Schemas

### Message Schema
```js
{
  username:  String,   // Who sent the message
  content:   String,   // Message text
  room:      String,   // Which room it belongs to
  timestamp: String,   // Human-readable "HH:MM AM/PM"
  createdAt: Date,     // Auto-managed by Mongoose timestamps
  updatedAt: Date
}
// Index: { room: 1, createdAt: -1 } for fast room queries
```

### Room Schema
```js
{
  name:      String,   // Unique room identifier (lowercase, hyphenated)
  createdBy: String,   // Username who created it (or "system" for defaults)
  isDefault: Boolean,  // true for general / tech / random
  createdAt: Date,
  updatedAt: Date
}
```

---

## 🔌 API Endpoints

| Method | Endpoint | Description | Response |
|--------|----------|-------------|----------|
| `GET` | `/api/health` | Server health check | `{ status: "ok" }` |
| `GET` | `/api/rooms` | Fetch all rooms (defaults first) | `{ success, rooms[] }` |
| `POST` | `/api/rooms` | Create a new room | `{ success, room }` |
| `GET` | `/api/messages/:room` | Fetch last 50 messages for a room | `{ success, messages[] }` |

### POST `/api/rooms` — Request Body
```json
{
  "name": "my-cool-room",
  "createdBy": "Alice"
}
```

---

## ⚡ Socket.io Events

### Client → Server (Emitted by frontend)

| Event | Payload | Description |
|-------|---------|-------------|
| `join-room` | `{ room, username }` | Join a chat room |
| `leave-room` | `{ room, username }` | Leave a chat room |
| `send-message` | `{ room, username, content }` | Send a message |
| `typing` | `{ room, username }` | Start typing signal |
| `stop-typing` | `{ room, username }` | Stop typing signal |

### Server → Client (Received by frontend)

| Event | Payload | Description |
|-------|---------|-------------|
| `message-history` | `Message[]` | Last 50 messages on room join |
| `receive-message` | `Message` | New real-time message |
| `user-joined` | `{ username, room, timestamp }` | Someone joined the room |
| `user-left` | `{ username, room, timestamp }` | Someone left the room |
| `online-users` | `{ room, users[] }` | Updated online user list |
| `typing` | `{ username, room }` | Someone started typing |
| `stop-typing` | `{ username, room }` | Someone stopped typing |

---

## 🎨 UI Design

### Design System
- **Theme**: Dark mode with deep navy/indigo palette
- **Primary Color**: `#6C63FF` (vibrant violet)
- **Accent**: `#FF6584` (coral pink)
- **Background**: `#0F0F1A` (deep dark)
- **Font**: Inter (Google Fonts)

### Message Styling
| Message Type | Alignment | Color |
|-------------|-----------|-------|
| Own messages | Right | Gradient violet (`#6C63FF → #4E46E5`) |
| Others' messages | Left | Dark card (`#1E1E35`) |
| System notifications | Center | Subtle pill badge |

### Animations
- Login card slides up on load
- Messages animate in from below (msgIn)
- Typing dots bounce with staggered delays
- Hover effects on all interactive elements
- Smooth room transitions

---

## ✅ Prerequisites

Before running this project, make sure you have:

| Tool | Version | Check Command |
|------|---------|---------------|
| **Node.js** | 18 or higher | `node --version` |
| **npm** | 8 or higher | `npm --version` |
| **MongoDB** | 6 or higher | `mongod --version` |
| **Git** | Any | `git --version` |

> **MongoDB** must be installed and running locally. Download from [mongodb.com/try/download/community](https://www.mongodb.com/try/download/community).

---

## 🚀 Installation & Setup

### Step 1 — Clone or navigate to the project

```bash
# If cloning:
git clone <your-repo-url>
cd chat-app

# Or if already in the directory:
cd /path/to/chat-app
```

### Step 2 — Install Backend Dependencies

```bash
cd server
npm install
```

### Step 3 — Install Frontend Dependencies

```bash
cd ../client
npm install
```

### Step 4 — Configure Environment Variables

The `.env` file is already created at `server/.env` with defaults:

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/chatapp
CLIENT_URL=http://localhost:5173
```

> Edit `MONGODB_URI` if your MongoDB runs on a different host/port or requires authentication (e.g., MongoDB Atlas).

---

## ▶️ Running the Application

You need **two terminals** — one for the backend, one for the frontend.

### Terminal 1 — Start the Backend Server

```bash
cd chat-app/server
node server.js
```

**Expected output:**
```
🚀 Server running on http://localhost:5000
✅ MongoDB connected
✅ Default rooms seeded
```

> For development with auto-reload, use `npm run dev` (requires nodemon, already in devDependencies).

---

### Terminal 2 — Start the Frontend Dev Server

```bash
cd chat-app/client
npm run dev
```

**Expected output:**
```
  VITE v5.x  ready in 160ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

---

### Step 3 — Open in Browser

```
http://localhost:5173
```

> The Vite dev server automatically proxies all `/api/*` requests to `http://localhost:5000`, so you never need to worry about CORS during development.

---

## 🔧 Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `5000` | Backend server port |
| `MONGODB_URI` | `mongodb://localhost:27017/chatapp` | MongoDB connection string |
| `CLIENT_URL` | `http://localhost:5173` | Frontend URL (for CORS + Socket.io) |

### MongoDB Atlas (Cloud) Setup

If using MongoDB Atlas instead of local MongoDB:

1. Create a free cluster at [cloud.mongodb.com](https://cloud.mongodb.com)
2. Get your connection string
3. Update `server/.env`:
```env
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/chatapp?retryWrites=true&w=majority
```

---

## 📖 Usage Guide

### Entering the Chat
1. Open `http://localhost:5173` in your browser
2. Type a username (minimum 2 characters) in the input field
3. Click **"Enter Chat →"** or press `Enter`
4. You'll be automatically joined to the **General** room

### Switching Rooms
- Click any room name in the **left sidebar**
- You'll automatically leave your current room and join the selected one
- The last 50 messages will load instantly

### Sending Messages
- Type in the message box at the bottom
- Press **Enter** to send
- Press **Shift + Enter** to add a new line without sending

### Creating a Custom Room
1. Click **"＋ New Room"** at the bottom of the room list
2. Type a room name (letters, numbers, spaces — max 24 chars)
3. Press **Enter** or click **"+"**
4. You'll be auto-joined to the new room

### Typing Indicator
- When you start typing, others in the room see **"[your name] is typing..."**
- The indicator disappears automatically after 1.5 seconds of inactivity

### Mobile Usage
- Tap the **☰ hamburger icon** in the top-left to open the sidebar
- Tap anywhere on the overlay to close it
- Full feature parity with desktop

---

## 🔍 Troubleshooting

### ❌ MongoDB connection error
```
❌ MongoDB connection error: connect ECONNREFUSED 127.0.0.1:27017
```
**Fix:** Start MongoDB service:
```bash
# Linux / macOS
sudo systemctl start mongod
# or
mongod --dbpath /data/db

# macOS (Homebrew)
brew services start mongodb-community
```

---

### ❌ Port already in use
```
Error: listen EADDRINUSE: address already in use :::5000
```
**Fix:** Kill the process on that port:
```bash
# Find and kill process on port 5000
lsof -ti:5000 | xargs kill -9

# Or use a different port in .env
PORT=5001
```

---

### ❌ Frontend can't connect to backend
- Ensure the backend is running on port `5000`
- Check `client/vite.config.js` proxy settings point to `http://localhost:5000`
- Ensure `CLIENT_URL` in `server/.env` matches your frontend URL

---

### ❌ Messages not persisting after restart
- Confirm MongoDB is running and `MONGODB_URI` is correct
- Check server logs for any Mongoose errors

---

### ❌ Socket not connecting
- Open browser DevTools → Console — check for WebSocket errors
- Ensure `server/.env` has `CLIENT_URL=http://localhost:5173`
- Try clearing `localStorage` and refreshing

---

## 📦 Production Build

To build the frontend for production:

```bash
cd client
npm run build
```

The optimised static files will be in `client/dist/`. Serve them with any static file server or configure Express to serve them:

```js
// Add to server.js for production
const path = require('path');
app.use(express.static(path.join(__dirname, '../client/dist')));
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/dist/index.html'));
});
```

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

---

<div align="center">

**Built with ❤️ using React · Node.js · Socket.io · MongoDB**

</div>
