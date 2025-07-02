import React, { useState } from 'react';
import { Globe, Users, Activity, Menu, X, Wifi, WifiOff } from 'lucide-react';

const Navigation = ({ connectionStatus, onlineUsers, activeChats }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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

  const getConnectionIcon = () => {
    return connectionStatus === 'connected' ? Wifi : WifiOff;
  };

  const ConnectionIcon = getConnectionIcon();

  return (
    <header className="p-4 lg:p-6 backdrop-blur-sm bg-white/5 border-b border-white/10 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Logo and Brand */}
        <div className="flex items-center space-x-3 lg:space-x-4">
          <div className="w-10 h-10 lg:w-12 lg:h-12 bg-gradient-to-r from-pink-500 to-violet-500 rounded-xl lg:rounded-2xl flex items-center justify-center shadow-lg">
            <Globe className="w-5 h-5 lg:w-7 lg:h-7 text-white" />
          </div>
          <div>
            <h1 className="text-xl lg:text-3xl font-bold text-white">RandomText</h1>
            <p className="text-white/60 text-xs lg:text-sm hidden sm:block">Connect • Chat • Discover</p>
          </div>
        </div>

        {/* Desktop Navigation */}
        <div className="hidden lg:flex items-center space-x-8 text-white/80">
          <div className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full ${getConnectionStatusColor()} animate-pulse`}></div>
            <ConnectionIcon className="w-4 h-4" />
            <span className="text-sm font-medium">{getConnectionStatusText()}</span>
          </div>
          <div className="flex items-center space-x-2">
            <Users className="w-5 h-5 text-green-400" />
            <span className="font-semibold">{onlineUsers.toLocaleString()}</span>
            <span className="text-sm">online</span>
          </div>
          <div className="flex items-center space-x-2">
            <Activity className="w-5 h-5 text-blue-400" />
            <span className="font-semibold">{activeChats}</span>
            <span className="text-sm">chats</span>
          </div>
        </div>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="lg:hidden p-2 rounded-xl bg-white/10 border border-white/20 text-white hover:bg-white/20 transition-colors"
        >
          {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="lg:hidden mt-4 p-4 bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 animate-in slide-in-from-top duration-200">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-white/80 text-sm">Connection Status</span>
              <div className="flex items-center space-x-2">
                <div className={`w-3 h-3 rounded-full ${getConnectionStatusColor()} animate-pulse`}></div>
                <ConnectionIcon className="w-4 h-4 text-white/80" />
                <span className="text-white text-sm font-medium">{getConnectionStatusText()}</span>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-white/80 text-sm">Online Users</span>
              <div className="flex items-center space-x-2">
                <Users className="w-4 h-4 text-green-400" />
                <span className="text-white font-semibold">{onlineUsers.toLocaleString()}</span>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-white/80 text-sm">Active Chats</span>
              <div className="flex items-center space-x-2">
                <Activity className="w-4 h-4 text-blue-400" />
                <span className="text-white font-semibold">{activeChats}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default Navigation;