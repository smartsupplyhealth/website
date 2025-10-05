import React, { useState, useRef, useEffect } from 'react';
import api from '../../services/api';
import { useAuth } from '../../contexts/AuthContext'; // <-- Import the Auth hook
import './Chatbot.css';

// (Icon components remain the same)
const ChatIcon = () => <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 16 16" height="1.5em" width="1.5em" xmlns="http://www.w3.org/2000/svg"><path d="M14 1a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1h-2.5a2 2 0 0 0-1.6.8L8 14.333 6.1 11.8a2 2 0 0 0-1.6-.8H2a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1h12zM2 0a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2.5a1 1 0 0 1 .8.4l1.9 2.533a1 1 0 0 0 1.6 0l1.9-2.533a1 1 0 0 1 .8-.4H14a2 2 0 0 0 2-2V2a2 2 0 0 0-2-2H2z"></path></svg>;
const CloseIcon = () => <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 24 24" height="1.5em" width="1.5em" xmlns="http://www.w3.org/2000/svg"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"></path></svg>;
const SendIcon = () => <svg stroke="currentColor" fill="none" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" height="1.5em" width="1.5em" xmlns="http://www.w3.org/2000/svg"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>;


const Chatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const { user } = useAuth(); // <-- Get the current user

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [messages]);

  // This useEffect now correctly depends on the user.
  // It will re-run when the user logs in or out.
  useEffect(() => {
    // Function to fetch history
    const fetchHistory = async () => {
      setIsLoading(true);
      try {
        const response = await api.get('/chatbot/history');
        const history = response.data.messages.map(msg => ({
          sender: msg.role === 'user' ? 'user' : 'bot',
          text: msg.content,
        }));

        if (history.length === 0) {
          setMessages([{ sender: 'bot', text: 'Bonjour ! Je suis SmartBot. Comment puis-je vous aider ?' }]);
        } else {
          setMessages(history);
        }
      } catch (error) {
        console.error("Erreur lors de la récupération de l'historique:", error);
        setMessages([{ sender: 'bot', text: "Impossible de charger l'historique." }]);
      } finally {
        setIsLoading(false);
      }
    };

    // If the chat is open AND there is a user logged in, fetch their history.
    if (isOpen && user) {
      fetchHistory();
    } else {
      // If there's no user or the chat is closed, reset the messages.
      setMessages([]);
    }
  }, [isOpen, user]); // <-- CRITICAL: Dependency on 'user' ensures this runs on login/logout.

  const toggleChat = () => setIsOpen(!isOpen);

  const handleSend = async () => {
    if (input.trim() === '' || isLoading) return;

    console.log('Sending message:', input);
    const userMessage = { sender: 'user', text: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      console.log('Calling chatbot API...');
      const response = await api.post('/chatbot', { message: input });
      console.log('Chatbot API response:', response.data);
      const botMessage = { sender: 'bot', text: response.data.reply };
      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error("Erreur de l'API Chatbot:", error);
      const errorMessage = { sender: 'bot', text: "Désolé, une erreur est survenue." };
      setMessages(prev => [...prev.slice(0, -1), errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSend();
    }
  };

  // Debug: Log user status
  console.log('Chatbot component - user:', user);
  console.log('Chatbot component - isOpen:', isOpen);

  // Don't render the chatbot button at all if no user is logged in
  if (!user) {
    console.log('Chatbot: No user logged in, not rendering');
    return null;
  }

  return (
    <div className="chatbot-container">
      <div className={`chatbot-window ${isOpen ? 'open' : ''}`}>
        <div className="chatbot-header">
          <h3>SmartBot Assistant</h3>
          <button onClick={toggleChat} className="chatbot-close-btn"><CloseIcon /></button>
        </div>
        <div className="chatbot-messages">
          {messages.map((msg, index) => (
            <div key={index} className={`message ${msg.sender}`}>
              <p>{msg.text}</p>
            </div>
          ))}
          {isLoading && <div className="message bot typing-indicator"><span></span><span></span><span></span></div>}
          <div ref={messagesEndRef} />
        </div>
        <div className="chatbot-input-area">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Posez votre question..."
            disabled={isLoading}
          />
          <button onClick={handleSend} disabled={isLoading}><SendIcon /></button>
        </div>
      </div>
      <button className="chatbot-toggle-btn" onClick={toggleChat}>
        {isOpen ? <CloseIcon /> : <ChatIcon />}
      </button>
    </div>
  );
};

export default Chatbot;
