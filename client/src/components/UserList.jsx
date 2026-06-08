import React from 'react';

/**
 * UserList — displays online users in the current room.
 * Props:
 *   users     string[]  — list of usernames online in the room
 *   username  string    — current user's own username (highlighted)
 */
const UserList = ({ users, username }) => {
  if (!users || users.length === 0) return null;

  return (
    <>
      {users.map((u) => (
        <div key={u} className="online-user-item">
          <div className="online-dot" />
          <div className={`user-avatar`} style={{ width: 26, height: 26, fontSize: 11 }}>
            {u[0].toUpperCase()}
          </div>
          <span className={`online-user-name ${u === username ? 'is-me' : ''}`}>
            {u === username ? `${u} (you)` : u}
          </span>
        </div>
      ))}
    </>
  );
};

export default UserList;
