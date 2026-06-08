import React, { useEffect, useRef, useState, useCallback } from 'react';
import socket from '../socket/socket';
import MessageBubble from './MessageBubble';
import TypingIndicator from './TypingIndicator';

/**
 * ChatWindow — messages list + input bar only.
 * The header is rendered by App.jsx so we keep this component lean.
 * Props:
 *   room      string  — active room name
 *   username  string  — current user
 */
const ChatWindow = ({ room, username }) => {
  const [messages, setMessages] = useState([]);
  const [inputVal, setInputVal] = useState('');
  const [typingUsers, setTypingUsers] = useState([]);
  const bottomRef = useRef(null);
  const typingTimerRef = useRef(null);
  const isTypingRef = useRef(false);
  const textareaRef = useRef(null);

  // ── Auto-scroll ──────────────────────────────────────────────────────────
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typingUsers]);

  // ── Socket event listeners ───────────────────────────────────────────────
  useEffect(() => {
    if (!room) return;

    // Clear state when switching rooms
    setMessages([]);
    setTypingUsers([]);

    const onHistory = (history) => setMessages(history);

    const onReceive = (msg) =>
      setMessages((prev) => [...prev, msg]);

    const onUserJoined = ({ username: u, timestamp }) =>
      setMessages((prev) => [
        ...prev,
        { _id: `sys-join-${Date.now()}`, isSystem: true, content: `${u} joined the room`, timestamp },
      ]);

    const onUserLeft = ({ username: u, timestamp }) =>
      setMessages((prev) => [
        ...prev,
        { _id: `sys-left-${Date.now()}`, isSystem: true, content: `${u} left the room`, timestamp },
      ]);

    const onTyping = ({ username: u }) =>
      setTypingUsers((prev) => (prev.includes(u) ? prev : [...prev, u]));

    const onStopTyping = ({ username: u }) =>
      setTypingUsers((prev) => prev.filter((x) => x !== u));

    socket.on('message-history', onHistory);
    socket.on('receive-message', onReceive);
    socket.on('user-joined', onUserJoined);
    socket.on('user-left', onUserLeft);
    socket.on('typing', onTyping);
    socket.on('stop-typing', onStopTyping);

    return () => {
      socket.off('message-history', onHistory);
      socket.off('receive-message', onReceive);
      socket.off('user-joined', onUserJoined);
      socket.off('user-left', onUserLeft);
      socket.off('typing', onTyping);
      socket.off('stop-typing', onStopTyping);
    };
  }, [room]);

  // ── Typing detection ─────────────────────────────────────────────────────
  const handleTyping = () => {
    if (!isTypingRef.current) {
      isTypingRef.current = true;
      socket.emit('typing', { room, username });
    }
    clearTimeout(typingTimerRef.current);
    typingTimerRef.current = setTimeout(() => {
      isTypingRef.current = false;
      socket.emit('stop-typing', { room, username });
    }, 1500);
  };

  // ── Send message ─────────────────────────────────────────────────────────
  const sendMessage = () => {
    const content = inputVal.trim();
    if (!content || !room) return;
    socket.emit('send-message', { room, username, content });
    setInputVal('');
    clearTimeout(typingTimerRef.current);
    isTypingRef.current = false;
    socket.emit('stop-typing', { room, username });
    textareaRef.current?.focus();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // ── Empty room placeholder ───────────────────────────────────────────────
  if (!room) {
    return (
      <div className="empty-state" style={{ flex: 1 }}>
        <div className="empty-state-icon">💬</div>
        <p>Select a room to start chatting</p>
      </div>
    );
  }

  const visibleTypers = typingUsers.filter((u) => u !== username);

  return (
    <>
      {/* Messages */}
      <div className="messages-container">
        {messages.length === 0 && (
          <div style={{ textAlign: 'center', marginTop: 60, color: 'var(--text-muted)' }}>
            <div style={{ fontSize: 40, marginBottom: 10 }}>🚀</div>
            <p style={{ fontSize: 14 }}>Be the first to say something!</p>
          </div>
        )}

        {messages.map((msg) => (
          <MessageBubble
            key={msg._id}
            message={msg}
            isOwn={msg.username === username}
          />
        ))}

        <div ref={bottomRef} />
      </div>

      {/* Typing indicator sits just above the input bar */}
      {visibleTypers.length > 0 && (
        <TypingIndicator typingUsers={visibleTypers} />
      )}

      {/* Input bar */}
      <div className="input-bar">
        <textarea
          ref={textareaRef}
          value={inputVal}
          onChange={(e) => { setInputVal(e.target.value); handleTyping(); }}
          onKeyDown={handleKeyDown}
          placeholder={`Message #${room}… (Enter to send)`}
          rows={1}
        />
        <button
          className="send-btn"
          onClick={sendMessage}
          disabled={!inputVal.trim()}
          title="Send (Enter)"
        >
          ➤
        </button>
      </div>
    </>
  );
};

export default ChatWindow;
