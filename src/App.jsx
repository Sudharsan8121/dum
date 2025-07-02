import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import {
  MessageCircle,
  Globe,
  Users,
  Send,
  UserX,
  Loader,
  MapPin,
  Heart,
  Zap,
  Search,
  Star,
  Shield,
  Wifi,
  Clock,
  Activity
} from 'lucide-react';
import Navigation from './components/Nav';
import ChatHeader from './components/ChatHeader';

// Dynamic socket connection based on environment
const getSocketUrl = () => {
  if (typeof window !== 'undefined') {
    const protocol = window.location.protocol === 'https:' ? 'https:' : 'http:';
    const host = window.location.host;

    // In development, use localhost:3001 with the same protocol as the frontend
    if (host.includes('localhost') || host.includes('127.0.0.1')) {
      return `${protocol}//localhost:3001`;
    }

    // In production, use the same host
    return window.location.origin;
  }
  return 'http://localhost:3001';
};

const socket = io(getSocketUrl(), {
  transports: ['websocket', 'polling'],
  timeout: 20000,
  forceNew: true
});

function App() {
  const [currentView, setCurrentView] = useState('home');
  const [username, setUsername] = useState('');
  const [location, setLocation] = useState('');
  const [interests, setInterests] = useState('');
  const [roomId, setRoomId] = useState('');
  const [partner, setPartner] = useState(null);
  const [messages, setMessages] = useState([]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [partnerTyping, setPartnerTyping] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState(2847);
  const [activeChats, setActiveChats] = useState(156);
  const [connectionStatus, setConnectionStatus] = useState('connecting');
  const [chatDuration, setChatDuration] = useState(0);
  const [error, setError] = useState('');

  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const chatStartTimeRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);

  useEffect(() => {
    // Simulate realistic user count fluctuation
    const userInterval = setInterval(() => {
      setOnlineUsers(prev => {
        const change = Math.floor(Math.random() * 50) - 25;
        return Math.max(1500, Math.min(15000, prev + change));
      });

      setActiveChats(prev => {
        const change = Math.floor(Math.random() * 10) - 5;
        return Math.max(50, Math.min(800, prev + change));
      });
    }, 5000);

    // Chat duration timer
    const durationInterval = setInterval(() => {
      if (currentView === 'chat' && chatStartTimeRef.current) {
        const duration = Math.floor((Date.now() - chatStartTimeRef.current) / 1000);
        setChatDuration(duration);
      }
    }, 1000);

    return () => {
      clearInterval(userInterval);
      clearInterval(durationInterval);
    };
  }, [currentView]);

  useEffect(() => {
    // Socket connection management
    socket.on('connect', () => {
      console.log('✅ Connected to server');
      setConnectionStatus('connected');
      setError('');
      clearTimeout(reconnectTimeoutRef.current);
    });

    socket.on('disconnect', (reason) => {
      console.log('❌ Disconnected from server:', reason);
      setConnectionStatus('disconnected');

      // Auto-reconnect after 3 seconds
      reconnectTimeoutRef.current = setTimeout(() => {
        if (socket.disconnected) {
          console.log('🔄 Attempting to reconnect...');
          socket.connect();
        }
      }, 3000);
    });

    socket.on('connect_error', (error) => {
      console.error('❌ Connection error:', error);
      setConnectionStatus('error');
      setError('Connection failed. Retrying...');
    });

    socket.on('waiting-for-stranger', () => {
      setCurrentView('waiting');
      setError('');
    });

    socket.on('stranger-found', (data) => {
      console.log('🎉 Stranger found:', data);
      setRoomId(data.roomId);
      setPartner(data.partner);
      setCurrentView('chat');
      setMessages([]);
      chatStartTimeRef.current = Date.now();
      setChatDuration(0);
      setError('');
    });

    socket.on('new-message', (messageData) => {
      setMessages(prev => [...prev, messageData]);
    });

    socket.on('user-typing', (data) => {
      setPartnerTyping(data.isTyping);
    });

    socket.on('chat-ended', () => {
      console.log('💔 Chat ended');
      resetChat();
    });

    socket.on('partner-disconnected', () => {
      console.log('👋 Partner disconnected');
      resetChat();
    });

    socket.on('stats-update', (stats) => {
      if (stats.onlineUsers) setOnlineUsers(stats.onlineUsers);
      if (stats.activeChats) setActiveChats(stats.activeChats);
    });

    socket.on('error', (error) => {
      console.error('❌ Socket error:', error);
      setError(error.message || 'An error occurred');
    });

    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('connect_error');
      socket.off('waiting-for-stranger');
      socket.off('stranger-found');
      socket.off('new-message');
      socket.off('user-typing');
      socket.off('chat-ended');
      socket.off('partner-disconnected');
      socket.off('stats-update');
      socket.off('error');
      clearTimeout(reconnectTimeoutRef.current);
    };
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const resetChat = () => {
    setCurrentView('home');
    setRoomId('');
    setPartner(null);
    setMessages([]);
    chatStartTimeRef.current = null;
    setChatDuration(0);
    setPartnerTyping(false);
    setIsTyping(false);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const findStranger = () => {
    if (!username.trim()) {
      setError('Please enter a username to start chatting!');
      return;
    }

    if (connectionStatus !== 'connected') {
      setError('Not connected to server. Please wait...');
      return;
    }

    const userData = {
      username: username.trim(),
      location: location.trim() || 'Unknown',
      interests: interests.split(',').map(i => i.trim()).filter(i => i)
    };

    console.log('🔍 Finding stranger with data:', userData);
    socket.emit('find-stranger', userData);
    setError('');
  };

  const sendMessage = () => {
    if (!currentMessage.trim() || !roomId) return;

    const messageData = {
      roomId,
      message: currentMessage.trim(),
      timestamp: new Date().toISOString()
    };

    socket.emit('send-message', messageData);
    setCurrentMessage('');
    handleTyping(false);
  };

  const handleTyping = (typing) => {
    if (typing !== isTyping) {
      setIsTyping(typing);
      socket.emit('typing', { roomId, isTyping: typing });
    }

    if (typing) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        setIsTyping(false);
        socket.emit('typing', { roomId, isTyping: false });
      }, 1000);
    }
  };

  const endChat = () => {
    if (window.confirm('Are you sure you want to end this chat?')) {
      socket.emit('end-chat', roomId);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getConnectionStatusColor = () => {
    switch (connectionStatus) {
      case 'connected': return 'bg-green-400';
      case 'connecting': return 'bg-yellow-400';
      case 'disconnected': return 'bg-red-400';
      case 'error': return 'bg-red-500';
      default: return 'bg-gray-400';
    }
  };

  const getConnectionStatusText = () => {
    switch (connectionStatus) {
      case 'connected': return 'Connected';
      case 'connecting': return 'Connecting...';
      case 'disconnected': return 'Disconnected';
      case 'error': return 'Connection Error';
      default: return 'Unknown';
    }
  };

  // Home View
  if (currentView === 'home') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 relative overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0">
          <div className="absolute top-10 left-10 lg:top-20 lg:left-20 w-48 h-48 lg:w-72 lg:h-72 bg-blue-500/10 rounded-full blur-3xl animate-pulse-slow"></div>
          <div className="absolute bottom-10 right-10 lg:bottom-20 lg:right-20 w-64 h-64 lg:w-96 lg:h-96 bg-pink-500/10 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '1s' }}></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-56 h-56 lg:w-80 lg:h-80 bg-purple-500/10 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '2s' }}></div>
        </div>

        <div className="relative z-10">
          {/* Navigation */}
          <Navigation 
            connectionStatus={connectionStatus}
            onlineUsers={onlineUsers}
            activeChats={activeChats}
          />

          {/* Error Message */}
          {error && (
            <div className="max-w-4xl mx-auto px-4 lg:px-6 pt-4">
              <div className="bg-red-500/20 border border-red-500/30 rounded-xl p-4 text-red-200 text-center text-sm lg:text-base">
                {error}
              </div>
            </div>
          )}

          {/* Hero Section */}
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-10 lg:py-16">
            <div className="text-center mb-8 lg:mb-16">
              <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-black text-white mb-4 lg:mb-6 leading-tight">
                Meet Amazing
                <span className="block bg-gradient-to-r from-pink-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent">
                  Strangers
                </span>
                Worldwide
              </h2>
              <p className="text-sm sm:text-base lg:text-lg text-white/80 mb-6 lg:mb-8 max-w-xl mx-auto leading-relaxed px-4">
                Break barriers, share stories, and create meaningful connections with fascinating people
                from every corner of our beautiful planet. Your next great conversation is just one click away.
              </p>

              {/* Stats */}
              <div className="flex justify-center space-x-6 lg:space-x-12 mb-8 lg:mb-16">
                <div className="text-center">
                  <div className="text-2xl lg:text-3xl font-bold text-white mb-1">190+</div>
                  <div className="text-white/60 text-xs lg:text-sm">Countries</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl lg:text-3xl font-bold text-white mb-1">{Math.floor(onlineUsers / 100)}K+</div>
                  <div className="text-white/60 text-xs lg:text-sm">Daily Chats</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl lg:text-3xl font-bold text-white mb-1">24/7</div>
                  <div className="text-white/60 text-xs lg:text-sm">Available</div>
                </div>
              </div>
            </div>

            {/* Features Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-6 mb-8 lg:mb-12 px-2">
              <div className="bg-white/10 backdrop-blur-lg rounded-2xl lg:rounded-3xl p-4 lg:p-6 border border-white/20 hover:bg-white/15 transition-all duration-300 hover:scale-105">
                <Zap className="w-8 h-8 lg:w-12 lg:h-12 text-yellow-400 mx-auto mb-2 lg:mb-4" />
                <h3 className="text-sm lg:text-lg font-bold text-white mb-1 lg:mb-2">Instant Connect</h3>
                <p className="text-white/70 text-xs lg:text-sm">Match with strangers in under 3 seconds</p>
              </div>
              <div className="bg-white/10 backdrop-blur-lg rounded-2xl lg:rounded-3xl p-4 lg:p-6 border border-white/20 hover:bg-white/15 transition-all duration-300 hover:scale-105">
                <Globe className="w-8 h-8 lg:w-12 lg:h-12 text-blue-400 mx-auto mb-2 lg:mb-4" />
                <h3 className="text-sm lg:text-lg font-bold text-white mb-1 lg:mb-2">Global Network</h3>
                <p className="text-white/70 text-xs lg:text-sm">Chat with people from 190+ countries</p>
              </div>
              <div className="bg-white/10 backdrop-blur-lg rounded-2xl lg:rounded-3xl p-4 lg:p-6 border border-white/20 hover:bg-white/15 transition-all duration-300 hover:scale-105">
                <Shield className="w-8 h-8 lg:w-12 lg:h-12 text-green-400 mx-auto mb-2 lg:mb-4" />
                <h3 className="text-sm lg:text-lg font-bold text-white mb-1 lg:mb-2">Safe & Secure</h3>
                <p className="text-white/70 text-xs lg:text-sm">Anonymous chatting with privacy protection</p>
              </div>
              <div className="bg-white/10 backdrop-blur-lg rounded-2xl lg:rounded-3xl p-4 lg:p-6 border border-white/20 hover:bg-white/15 transition-all duration-300 hover:scale-105">
                <Heart className="w-8 h-8 lg:w-12 lg:h-12 text-pink-400 mx-auto mb-2 lg:mb-4" />
                <h3 className="text-sm lg:text-lg font-bold text-white mb-1 lg:mb-2">Make Friends</h3>
                <p className="text-white/70 text-xs lg:text-sm">Build meaningful connections worldwide</p>
              </div>
            </div>

            {/* Join Form */}
            <div className="max-w-lg mx-auto px-4">
              <div className="bg-white/10 backdrop-blur-xl rounded-2xl lg:rounded-3xl p-6 lg:p-8 border border-white/20 shadow-2xl">
                <div className="text-center mb-6 lg:mb-8">
                  <h3 className="text-2xl lg:text-3xl font-bold text-white mb-2">Start Your Journey</h3>
                  <p className="text-white/70 text-sm lg:text-base">Join thousands of people chatting right now</p>
                </div>

                <div className="space-y-4 lg:space-y-6">
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Choose your username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="w-full px-4 py-3 text-sm sm:text-base bg-white/20 border border-white/30 rounded-2xl text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent font-medium"
                      maxLength={20}
                    />
                  </div>

                  <div className="relative">
                    <MapPin className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/60" />
                    <input
                      type="text"
                      placeholder="Your location (optional)"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 text-sm sm:text-base bg-white/20 border border-white/30 rounded-2xl text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                    />
                  </div>

                  <div className="relative">
                    <Star className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/60" />
                    <input
                      type="text"
                      placeholder="Your interests (music, sports, travel...)"
                      value={interests}
                      onChange={(e) => setInterests(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 text-sm sm:text-base bg-white/20 border border-white/30 rounded-2xl text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                    />
                  </div>

                  <button
                    onClick={findStranger}
                    disabled={connectionStatus !== 'connected' || !username.trim()}
                    className="w-full bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 hover:from-pink-600 hover:via-purple-600 hover:to-indigo-600 disabled:from-gray-500 disabled:to-gray-600 text-white font-bold py-4 lg:py-5 rounded-2xl transition-all duration-300 hover:scale-105 hover:shadow-2xl disabled:hover:scale-100 flex items-center justify-center space-x-3 text-base lg:text-lg"
                  >
                    <Search className="w-5 h-5 lg:w-6 lg:h-6" />
                    <span>
                      {connectionStatus === 'connected' ? 'Find a Stranger' : 'Connecting...'}
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Waiting View
  if (currentView === 'waiting') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 flex items-center justify-center relative overflow-hidden">
        {/* Animated background */}
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-48 h-48 lg:w-64 lg:h-64 bg-blue-500/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-1/4 right-1/4 w-64 h-64 lg:w-80 lg:h-80 bg-pink-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        </div>

        <div className="text-center relative z-10 px-4">
          <div className="w-24 h-24 lg:w-32 lg:h-32 bg-gradient-to-r from-pink-500 to-violet-500 rounded-full flex items-center justify-center mx-auto mb-6 lg:mb-8 animate-pulse shadow-2xl">
            <Loader className="w-12 h-12 lg:w-16 lg:h-16 text-white animate-spin" />
          </div>
          <h2 className="text-2xl lg:text-4xl font-bold text-white mb-4">Finding Your Perfect Match...</h2>
          <p className="text-white/80 text-base lg:text-xl mb-6 lg:mb-8 max-w-md mx-auto">
            We're connecting you with someone amazing from around the world. This usually takes just a few seconds!
          </p>

          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-4 lg:p-6 max-w-sm mx-auto border border-white/20 mb-6 lg:mb-8">
            <div className="flex items-center justify-center space-x-2 lg:space-x-4 text-white/80 mb-4">
              <div className={`w-3 h-3 rounded-full ${getConnectionStatusColor()} animate-pulse`}></div>
              <span className="font-medium text-sm lg:text-base">{getConnectionStatusText()}</span>
            </div>
            <div className="flex items-center justify-center space-x-2 text-white/60 mb-2 text-sm lg:text-base">
              <Users className="w-4 h-4 lg:w-5 lg:h-5" />
              <span>{onlineUsers.toLocaleString()} people online now</span>
            </div>
            <div className="flex items-center justify-center space-x-2 text-white/60 text-sm lg:text-base">
              <Activity className="w-4 h-4 lg:w-5 lg:h-5" />
              <span>{activeChats} active conversations</span>
            </div>
          </div>

          <button
            onClick={resetChat}
            className="bg-white/20 hover:bg-white/30 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-200 hover:scale-105 border border-white/30"
          >
            Cancel Search
          </button>
        </div>
      </div>
    );
  }

  // Chat View
  if (currentView === 'chat') {
    return (
      <div className="h-screen bg-gray-50 flex flex-col">
        {/* Chat Header */}
        <ChatHeader
          partner={partner}
          connectionStatus={connectionStatus}
          chatDuration={chatDuration}
          onEndChat={endChat}
          getConnectionStatusColor={getConnectionStatusColor}
          getConnectionStatusText={getConnectionStatusText}
          formatDuration={formatDuration}
        />

        {/* Messages Container */}
        <div className="flex-1 overflow-y-auto p-4 lg:p-6 space-y-4 bg-gradient-to-b from-gray-50 to-gray-100">
          {messages.length === 0 && (
            <div className="text-center text-gray-500 py-8 lg:py-16">
              <div className="w-16 h-16 lg:w-20 lg:h-20 bg-gradient-to-r from-pink-500 to-violet-500 rounded-full flex items-center justify-center mx-auto mb-4 lg:mb-6 shadow-lg">
                <MessageCircle className="w-8 h-8 lg:w-10 lg:h-10 text-white" />
              </div>
              <h3 className="text-lg lg:text-xl font-semibold mb-2">Start the conversation!</h3>
              <p className="text-gray-400 text-sm lg:text-base">Say hello to {partner?.username} and break the ice 👋</p>
            </div>
          )}

          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.senderId === socket.id ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-xs sm:max-w-sm lg:max-w-md px-4 lg:px-5 py-3 rounded-3xl shadow-lg ${message.senderId === socket.id
                    ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white'
                    : 'bg-white border border-gray-200 text-gray-900'
                  }`}
              >
                <p className="break-words leading-relaxed text-sm lg:text-base">{message.message}</p>
                <p className={`text-xs mt-2 ${message.senderId === socket.id ? 'text-blue-100' : 'text-gray-500'
                  }`}>
                  {formatTime(message.timestamp)}
                </p>
              </div>
            </div>
          ))}

          {partnerTyping && (
            <div className="flex justify-start">
              <div className="bg-white border border-gray-200 px-4 lg:px-5 py-3 rounded-3xl shadow-lg">
                <div className="flex items-center space-x-2">
                  <span className="text-gray-600 text-sm">{partner?.username} is typing</span>
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Message Input */}
        <div className="bg-white border-t border-gray-200 p-4 lg:p-6 shadow-lg">
          <div className="flex space-x-3 lg:space-x-4 max-w-4xl mx-auto">
            <input
              type="text"
              value={currentMessage}
              onChange={(e) => {
                setCurrentMessage(e.target.value);
                handleTyping(e.target.value.length > 0);
              }}
              onKeyPress={handleKeyPress}
              placeholder="Type your message..."
              className="flex-1 px-4 lg:px-6 py-3 lg:py-4 border border-gray-300 rounded-3xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base lg:text-lg shadow-sm"
              maxLength={500}
              disabled={connectionStatus !== 'connected'}
            />
            <button
              onClick={sendMessage}
              disabled={!currentMessage.trim() || connectionStatus !== 'connected'}
              className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 disabled:from-gray-300 disabled:to-gray-400 text-white p-3 lg:p-4 rounded-3xl transition-all duration-200 hover:scale-105 shadow-lg disabled:hover:scale-100 flex-shrink-0"
            >
              <Send className="w-5 h-5 lg:w-6 lg:h-6" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}

export default App;