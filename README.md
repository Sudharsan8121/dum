# World Wide Stranger Chat

A real-time anonymous chat application that connects strangers from around the world. Built with React, Node.js, Express, and Socket.IO.

## Features

- 🌍 **Global Connections**: Chat with people from 190+ countries
- ⚡ **Instant Matching**: Connect with strangers in under 3 seconds
- 🔒 **Anonymous & Safe**: No registration required, privacy-focused
- 📱 **Responsive Design**: Works on all devices and screen sizes
- 🎨 **Beautiful UI**: Modern, gradient-based design with smooth animations
- 💬 **Real-time Chat**: Instant messaging with typing indicators
- 📊 **Live Stats**: See online users and active chats in real-time

## Tech Stack

### Frontend
- React 18
- Tailwind CSS
- Socket.IO Client
- Lucide React (icons)
- Vite (build tool)

### Backend
- Node.js
- Express.js
- Socket.IO
- CORS enabled

## Quick Start

### Development

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd world-wide-stranger-chat
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start development servers**
   ```bash
   npm run dev
   ```
   This starts both the React frontend (port 5173) and Node.js backend (port 3001)

4. **Open your browser**
   Navigate to `http://localhost:5173`

### Production Build

1. **Build the frontend**
   ```bash
   npm run build
   ```

2. **Start the production server**
   ```bash
   npm start
   ```

## Deployment

### Heroku Deployment

1. **Create a Heroku app**
   ```bash
   heroku create your-app-name
   ```

2. **Set environment variables**
   ```bash
   heroku config:set NODE_ENV=production
   heroku config:set CLIENT_URL=https://your-app-name.herokuapp.com
   ```

3. **Deploy**
   ```bash
   git push heroku main
   ```

### Netlify/Vercel (Frontend) + Railway/Render (Backend)

For separate frontend and backend deployment:

1. **Frontend**: Deploy the `dist` folder to Netlify or Vercel
2. **Backend**: Deploy the server code to Railway, Render, or similar
3. **Update socket connection**: Modify the `getSocketUrl()` function in `src/App.jsx`

### Environment Variables

Create a `.env` file based on `.env.example`:

```env
PORT=3001
NODE_ENV=production
CLIENT_URL=https://your-domain.com
FRONTEND_URL=https://your-domain.com
```

## API Endpoints

- `GET /health` - Health check with server stats
- `GET /stats` - Server statistics
- `GET /api/stats` - Frontend-friendly stats endpoint
- `GET /*` - Serves React app (SPA support)

## Socket Events

### Client to Server
- `find-stranger` - Join the waiting queue
- `send-message` - Send a chat message
- `typing` - Typing indicator
- `end-chat` - End current chat

### Server to Client
- `waiting-for-stranger` - User is in waiting queue
- `stranger-found` - Match found, chat started
- `new-message` - New message received
- `user-typing` - Partner typing status
- `chat-ended` - Chat ended by partner
- `partner-disconnected` - Partner left
- `stats-update` - Live stats update

## Features in Detail

### Real-time Matching
- Users are matched instantly when both are available
- Smart cleanup of inactive connections
- Automatic reconnection handling

### Chat Features
- Real-time messaging with Socket.IO
- Typing indicators
- Message timestamps
- Chat duration tracking
- Graceful disconnection handling

### Responsive Design
- Mobile-first approach
- Smooth animations and transitions
- Beautiful gradient backgrounds
- Accessible UI components

### Performance
- Optimized bundle splitting
- Efficient re-renders
- Memory leak prevention
- Connection pooling

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+
- Mobile browsers (iOS Safari, Chrome Mobile)

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - feel free to use this project for personal or commercial purposes.

## Support

For issues or questions, please create an issue in the GitHub repository.

---

**Made with ❤️ for connecting people worldwide**