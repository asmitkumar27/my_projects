// client/src/App.js
import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';
import './App.css';

// Connect to the backend server
const socket = io.connect("http://localhost:4000");

function App() {
  const [username, setUsername] = useState('');
  const [message, setMessage] = useState('');
  const [chat, setChat] = useState([]);
  const [isUsernameSet, setIsUsernameSet] = useState(false);

  useEffect(() => {
    // Listen for incoming messages
    socket.on('receive_message', (data) => {
      setChat((prevChat) => [...prevChat, data]);
    });

    // Clean up the event listener on component unmount
    return () => {
      socket.off('receive_message');
    };
  }, []);

  const sendMessage = (e) => {
    e.preventDefault();
    if (message.trim() && isUsernameSet) {
      const messageData = {
        username,
        message,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      };
      socket.emit('send_message', messageData);
      setMessage('');
    }
  };

  const handleUsernameSubmit = (e) => {
    e.preventDefault();
    if (username.trim()) {
      setIsUsernameSet(true);
    }
  };

  if (!isUsernameSet) {
    return (
      <div className="container">
        <h1>Join Chat</h1>
        <form onSubmit={handleUsernameSubmit} className="form-container">
          <input
            type="text"
            placeholder="Enter your name..."
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          <button type="submit">Join</button>
        </form>
      </div>
    );
  }

  return (
    <div className="container">
      <h1>Real-Time Chat</h1>
      <div className="chat-window">
        {chat.map((msg, index) => (
          <p key={index}>
            <b>{msg.username}</b> [{msg.timestamp}]: {msg.message}
          </p>
        ))}
      </div>
      <form onSubmit={sendMessage} className="form-container">
        <input
          type="text"
          placeholder="Type your message..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />
        <button type="submit">Send</button>
      </form>
    </div>
  );
}

export default App;