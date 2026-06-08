import React from 'react';

/**
 * MessageBubble — renders a single chat message or a system notification.
 * Props:
 *   message  { _id, username, content, timestamp, isSystem }
 *   isOwn    boolean — true if the message belongs to the current user
 */
const MessageBubble = ({ message, isOwn }) => {
  // System messages (join / leave notifications)
  if (message.isSystem) {
    return (
      <div className="message-row system-row">
        <span className="system-message">{message.content}</span>
      </div>
    );
  }

  const initial = message.username ? message.username[0].toUpperCase() : '?';

  return (
    <div className={`message-row ${isOwn ? 'own' : ''}`}>
      {/* Avatar — shown only for other users */}
      {!isOwn && (
        <div className="message-avatar" title={message.username}>
          {initial}
        </div>
      )}

      <div className="message-content">
        {/* Sender name — shown only for other users */}
        {!isOwn && (
          <span className="message-sender">{message.username}</span>
        )}

        <div className={`bubble ${isOwn ? 'own' : 'other'}`}>
          {message.content}
        </div>

        <span className="message-time">{message.timestamp}</span>
      </div>
    </div>
  );
};

export default MessageBubble;
