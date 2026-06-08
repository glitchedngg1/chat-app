import React from 'react';

/**
 * TypingIndicator — shows "X is typing..." with animated dots.
 * Props:
 *   typingUsers  string[] — usernames currently typing
 */
const TypingIndicator = ({ typingUsers }) => {
  if (!typingUsers || typingUsers.length === 0) return null;

  let label;
  if (typingUsers.length === 1) {
    label = `${typingUsers[0]} is typing`;
  } else if (typingUsers.length === 2) {
    label = `${typingUsers[0]} and ${typingUsers[1]} are typing`;
  } else {
    label = `${typingUsers.length} people are typing`;
  }

  return (
    <div className="typing-indicator">
      <div className="typing-dots">
        <span />
        <span />
        <span />
      </div>
      <span>{label}</span>
    </div>
  );
};

export default TypingIndicator;
