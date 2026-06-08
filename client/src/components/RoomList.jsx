import React, { useState } from 'react';
import UserList from './UserList';

/**
 * RoomList — left sidebar showing rooms, create-room form, and online users.
 * Props:
 *   rooms         Room[]    — all rooms
 *   activeRoom    string    — currently active room name
 *   onRoomSelect  fn(room)
 *   onCreateRoom  fn(name)
 *   onlineUsers   string[]  — users in the active room
 *   username      string    — current user
 *   sidebarOpen   boolean   — mobile: whether sidebar is visible
 */
const RoomList = ({
  rooms,
  activeRoom,
  onRoomSelect,
  onCreateRoom,
  onlineUsers,
  username,
  sidebarOpen,
}) => {
  const [showInput, setShowInput] = useState(false);
  const [newRoomName, setNewRoomName] = useState('');

  const roomIcons = { general: '💬', tech: '💻', random: '🎲' };

  const handleCreate = () => {
    const trimmed = newRoomName.trim();
    if (!trimmed) return;
    onCreateRoom(trimmed);
    setNewRoomName('');
    setShowInput(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleCreate();
    if (e.key === 'Escape') { setShowInput(false); setNewRoomName(''); }
  };

  return (
    <div className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
      {/* Header */}
      <div className="sidebar-header">
        <div className="sidebar-logo">💬</div>
        <h2>ChatFlow</h2>
        <div className="user-badge">
          <div className="user-avatar" title={username}>
            {username ? username[0].toUpperCase() : '?'}
          </div>
        </div>
      </div>

      {/* Rooms */}
      <div className="sidebar-section" style={{ flexShrink: 0 }}>
        <div className="sidebar-section-title">Rooms</div>
        <ul className="room-list">
          {rooms.map((room) => (
            <li
              key={room.name}
              className={`room-item ${activeRoom === room.name ? 'active' : ''}`}
              onClick={() => onRoomSelect(room.name)}
            >
              <span className="room-icon">{roomIcons[room.name] || '🔹'}</span>
              <span className="room-name">{room.name}</span>
              {activeRoom === room.name && onlineUsers.length > 0 && (
                <span className="room-badge">{onlineUsers.length}</span>
              )}
            </li>
          ))}
        </ul>

        {/* Create room */}
        {showInput ? (
          <div className="create-room-input-row">
            <input
              autoFocus
              value={newRoomName}
              onChange={(e) => setNewRoomName(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="room-name"
              maxLength={24}
            />
            <button onClick={handleCreate}>+</button>
          </div>
        ) : (
          <button className="create-room-btn" onClick={() => setShowInput(true)}>
            <span>＋</span>
            <span>New Room</span>
          </button>
        )}
      </div>

      {/* Online users in active room */}
      <div className="online-users-section">
        <div className="sidebar-section-title" style={{ marginBottom: 8 }}>
          Online — {onlineUsers.length}
        </div>
        <UserList users={onlineUsers} username={username} />
      </div>
    </div>
  );
};

export default RoomList;
