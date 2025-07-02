import React from 'react';
import { MessageCircle, MapPin, Star, Clock, UserX, Menu, X } from 'lucide-react';

const ChatHeader = ({
  partner,
  connectionStatus,
  chatDuration,
  onEndChat,
  getConnectionStatusColor,
  getConnectionStatusText,
  formatDuration
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  return (
    <div className="bg-white border-b border-gray-200 p-4 lg:p-6 shadow-sm">
      <div className="flex items-center justify-between">
        {/* Partner Info */}
        <div className="flex items-center space-x-3 lg:space-x-4 min-w-0 flex-1">
          <div className="w-10 h-10 lg:w-12 lg:h-12 bg-gradient-to-r from-pink-500 to-violet-500 rounded-full flex items-center justify-center shadow-lg flex-shrink-0">
            <MessageCircle className="w-5 h-5 lg:w-6 lg:h-6 text-white" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="font-bold text-gray-900 text-base lg:text-lg truncate">{partner?.username}</h3>
            <div className="hidden sm:flex items-center space-x-3 lg:space-x-4 text-xs lg:text-sm text-gray-500">
              {partner?.location && (
                <div className="flex items-center space-x-1">
                  <MapPin className="w-3 h-3 lg:w-4 lg:h-4" />
                  <span className="truncate max-w-24 lg:max-w-none">{partner.location}</span>
                </div>
              )}
              {partner?.interests?.length > 0 && (
                <div className="flex items-center space-x-1">
                  <Star className="w-3 h-3 lg:w-4 lg:h-4" />
                  <span className="truncate max-w-32 lg:max-w-none">{partner.interests.slice(0, 2).join(', ')}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Desktop Controls */}
        <div className="hidden lg:flex items-center space-x-4">
          <div className="flex items-center space-x-2 text-sm text-gray-500">
            <div className={`w-3 h-3 rounded-full ${getConnectionStatusColor()}`}></div>
            <span>{getConnectionStatusText()}</span>
          </div>
          <div className="flex items-center space-x-2 text-sm text-gray-500">
            <Clock className="w-4 h-4" />
            <span>{formatDuration(chatDuration)}</span>
          </div>
          <button
            onClick={onEndChat}
            className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-xl font-semibold transition-all duration-200 hover:scale-105 flex items-center space-x-2 shadow-lg"
          >
            <UserX className="w-4 h-4" />
            <span>End</span>
          </button>
        </div>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="lg:hidden p-2 rounded-xl bg-gray-100 hover:bg-gray-200 transition-colors flex-shrink-0"
        >
          {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile Partner Info & Controls */}
      {isMobileMenuOpen && (
        <div className="lg:hidden mt-4 p-4 bg-gray-50 rounded-2xl space-y-4 animate-in slide-in-from-top duration-200">
          {/* Partner Details */}
          <div className="space-y-2">
            {partner?.location && (
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <MapPin className="w-4 h-4" />
                <span>{partner.location}</span>
              </div>
            )}
            {partner?.interests?.length > 0 && (
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <Star className="w-4 h-4" />
                <span>{partner.interests.join(', ')}</span>
              </div>
            )}
          </div>

          {/* Status & Duration */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <div className={`w-3 h-3 rounded-full ${getConnectionStatusColor()}`}></div>
              <span>{getConnectionStatusText()}</span>
            </div>
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <Clock className="w-4 h-4" />
              <span>{formatDuration(chatDuration)}</span>
            </div>
          </div>

          {/* End Chat Button */}
          <button
            onClick={onEndChat}
            className="w-full bg-red-500 hover:bg-red-600 text-white py-3 rounded-xl font-semibold transition-all duration-200 flex items-center justify-center space-x-2"
          >
            <UserX className="w-4 h-4" />
            <span>End Chat</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default ChatHeader;