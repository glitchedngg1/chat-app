import React, { useState, useEffect, useCallback } from 'react';
import socket from './socket/socket';
import RoomList from './components/RoomList';
import ChatWindow from './components/ChatWindow';

// In development: Vite proxies /api → http://localhost:5000
// In production:  calls the deployed backend directly
const API = import.meta.env.VITE_BACKEND_URL
  ? `${import.meta.env.VITE_BACKEND_URL}/api`
  : '/api';

function App() {
  // ── Auth ─────────────────────────────────────────────────────────────────
  const [username, setUsername] = useState(() => localStorage.getItem('chat_username') || '');
  const [inputName, setInputName] = useState('');
  const [loggedIn, setLoggedIn] = useState(!!localStorage.getItem('chat_username'));

  // ── Rooms & presence ─────────────────────────────────────────────────────
  const [rooms, setRooms] = useState([]);
  const [activeRoom, setActiveRoom] = useState('');
  const [onlineUsers, setOnlineUsers] = useState([]);

  // ── Mobile sidebar ────────────────────────────────────────────────────────
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // ── Connect socket after login ────────────────────────────────────────────
  useEffect(() => {
    if (!loggedIn) return;
    if (!socket.connected) socket.connect();
    fetchRooms();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loggedIn]);

  // ── Sync online users for active room ─────────────────────────────────────
  useEffect(() => {
    const handler = ({ room, users }) => {
      if (room === activeRoom) setOnlineUsers(users);
    };
    socket.on('online-users', handler);
    return () => socket.off('online-users', handler);
  }, [activeRoom]);

  // ── Fetch all rooms from REST API ─────────────────────────────────────────
  const fetchRooms = async () => {
    try {
      const res = await fetch(`${API}/rooms`);
      const data = await res.json();
      if (data.success) {
        setRooms(data.rooms);
        if (data.rooms.length > 0) {
          joinRoom(data.rooms[0].name);
        }
      }
    } catch (err) {
      console.error('Failed to fetch rooms:', err);
    }
  };

  // ── Join room via socket ──────────────────────────────────────────────────
  const joinRoom = useCallback(
    (roomName) => {
      if (roomName === activeRoom) return;
      if (activeRoom) socket.emit('leave-room', { room: activeRoom, username });
      setActiveRoom(roomName);
      setOnlineUsers([]);
      socket.emit('join-room', { room: roomName, username });
    },
    [activeRoom, username]
  );

  // ── Create a new room ─────────────────────────────────────────────────────
  const handleCreateRoom = async (name) => {
    try {
      const res = await fetch(`${API}/rooms`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, createdBy: username }),
      });
      const data = await res.json();
      if (data.success) {
        await fetchRooms();
        joinRoom(data.room.name);
      } else {
        alert(data.message || 'Could not create room');
      }
    } catch (err) {
      console.error('Failed to create room:', err);
    }
  };

  // ── Login submit ──────────────────────────────────────────────────────────
  const handleLogin = (e) => {
    e.preventDefault();
    const name = inputName.trim();
    if (!name || name.length < 2) return;
    localStorage.setItem('chat_username', name);
    setUsername(name);
    setLoggedIn(true);
  };

  // ── LOGIN SCREEN ──────────────────────────────────────────────────────────
  if (!loggedIn) {
    return (
      <div className="login-screen">
        <div className="login-card">
          <div className="login-logo">
            <div className="login-logo-icon">💬</div>
            <h1>ChatFlow</h1>
          </div>
          <p className="subtitle">
            Real-time messaging. Pick a username and jump in — no signup needed.
          </p>
          <form onSubmit={handleLogin}>
            <div className="input-group">
              <label htmlFor="username-input">Your username</label>
              <input
                id="username-input"
                type="text"
                value={inputName}
                onChange={(e) => setInputName(e.target.value)}
                placeholder="e.g. cooluser99"
                maxLength={20}
                autoFocus
                autoComplete="off"
              />
            </div>
            <button
              type="submit"
              className="btn-primary"
              disabled={inputName.trim().length < 2}
            >
              Enter Chat →
            </button>
          </form>
        </div>
      </div>
    );
  }

  // ── ROOM ICON helper ──────────────────────────────────────────────────────
  const roomIcon = (r) =>
    r === 'general' ? '💬' : r === 'tech' ? '💻' : r === 'random' ? '🎲' : '#';

  // ── MAIN LAYOUT ───────────────────────────────────────────────────────────
  return (
    <div className="app-layout">
      {/* Mobile sidebar overlay */}
      <div
        className={`sidebar-overlay ${sidebarOpen ? 'visible' : ''}`}
        onClick={() => setSidebarOpen(false)}
      />

      {/* ── Left Panel ── */}
      <RoomList
        rooms={rooms}
        activeRoom={activeRoom}
        onRoomSelect={(r) => { joinRoom(r); setSidebarOpen(false); }}
        onCreateRoom={handleCreateRoom}
        onlineUsers={onlineUsers}
        username={username}
        sidebarOpen={sidebarOpen}
      />

      {/* ── Right Panel ── */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          minWidth: 0,
          overflow: 'hidden',
        }}
      >
        {/* Chat header */}
        <div className="chat-header">
          {/* Hamburger (mobile only) */}
          <button
            className="hamburger-btn"
            onClick={() => setSidebarOpen((v) => !v)}
            aria-label="Toggle sidebar"
          >
            ☰
          </button>

          <div className="chat-header-avatar">
            {activeRoom ? roomIcon(activeRoom) : '💬'}
          </div>

          <div className="chat-header-info">
            <div className="chat-header-room" style={{ textTransform: 'capitalize' }}>
              {activeRoom || 'Select a Room'}
            </div>
            <div className="chat-header-meta">
              <div className="online-dot" />
              <span>{onlineUsers.length} online</span>
            </div>
          </div>

          {/* Current user avatar */}
          <div className="user-avatar lg" title={username}>
            {username[0].toUpperCase()}
          </div>
        </div>

        {/* Chat window (messages + input) */}
        <ChatWindow room={activeRoom} username={username} />
      </div>
    </div>
  );
}

export default App;
