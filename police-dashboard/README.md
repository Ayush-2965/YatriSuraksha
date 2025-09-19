# Police Dashboard - YatriSuraksha

A real-time monitoring dashboard for law enforcement to track tourist activities and respond to emergency alerts.

## Features

- **Real-time Tour Monitoring**: Track active tourist tours with live location updates
- **Emergency Alert System**: Receive instant notifications when tourists trigger emergency alerts
- **Interactive Maps**: View tourist locations and emergency alerts on Google Maps
- **Tour Management**: Monitor tour status, duration, and participant details
- **Alert Response**: Mark emergency alerts as resolved and track response times
- **Live Updates**: Real-time communication via WebSocket connections

## Tech Stack

- **Frontend**: React 18, Vite, Tailwind CSS
- **Maps**: Google Maps JavaScript API
- **Real-time**: Socket.io Client
- **Routing**: React Router
- **Date/Time**: date-fns
- **HTTP Client**: Axios

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Google Maps API key
- Backend server running (YatriSuraksha backend-services)

### Installation

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Environment Configuration**:
   ```bash
   cp .env.example .env
   ```
   
   Update `.env` with your configuration:
   ```env
   VITE_BACKEND_URL=http://localhost:3001
   VITE_GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here
   VITE_API_BASE_URL=http://localhost:3001/api
   VITE_SOCKET_URL=http://localhost:3001
   ```

3. **Start Development Server**:
   ```bash
   npm run dev
   ```

4. **Build for Production**:
   ```bash
   npm run build
   ```

## Usage

### Dashboard Overview
- View summary statistics of active tours and emergency alerts
- Monitor system connectivity status
- Quick access to recent emergency alerts and active tours

### Live Tours Monitoring
- Real-time tracking of all active tourist tours
- Filter tours by status (active, completed, cancelled)
- View detailed location information and last update times
- Interactive map showing all tour locations

### Emergency Alerts Management
- Receive instant emergency notifications
- View alert details including location, timestamp, and user information
- Mark alerts as resolved
- Priority-based alert classification
- Emergency location mapping

### Tour Details
- Detailed view of individual tours
- Emergency history for specific users
- Real-time location tracking status
- Historical tracking data

## API Integration

The dashboard connects to the YatriSuraksha backend API:

- **WebSocket Events**: Real-time location updates and emergency alerts
- **REST API**: Tour data retrieval and alert management
- **Location Services**: GPS coordinate tracking and mapping

## Emergency Response Workflow

1. **Alert Reception**: Emergency alerts are received via WebSocket
2. **Notification**: Browser notifications and visual alerts
3. **Location Display**: Emergency location shown on interactive map
4. **Response Tracking**: Officers can mark alerts as resolved
5. **Documentation**: All alerts are logged with timestamps and status

## Development

### Project Structure
```
src/
├── components/          # React components
│   ├── Dashboard.jsx    # Main dashboard overview
│   ├── LiveTours.jsx    # Tour monitoring interface
│   ├── EmergencyAlerts.jsx  # Emergency management
│   ├── TourDetails.jsx  # Individual tour details
│   ├── TourMap.jsx      # Google Maps integration
│   └── Navbar.jsx       # Navigation component
├── context/             # React context providers
│   └── SocketContext.jsx   # WebSocket connection management
├── App.jsx             # Main application component
├── main.jsx            # Application entry point
└── index.css           # Global styles
```

### Available Scripts

- `npm run dev`: Start development server (port 5174)
- `npm run build`: Build for production
- `npm run preview`: Preview production build
- `npm run lint`: Run ESLint

## Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_BACKEND_URL` | Backend server URL | `http://localhost:3001` |
| `VITE_GOOGLE_MAPS_API_KEY` | Google Maps API key | Required |
| `VITE_API_BASE_URL` | API base URL | `http://localhost:3001/api` |
| `VITE_SOCKET_URL` | Socket.io server URL | `http://localhost:3001` |
| `VITE_POLICE_STATION_ID` | Police station identifier | `STATION_001` |
| `VITE_POLICE_DISTRICT` | Police district name | `SAMPLE_DISTRICT` |

## Deployment

### Production Build
```bash
npm run build
```

### Docker Deployment
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 5174
CMD ["npm", "run", "preview"]
```

## Security Considerations

- **Authentication**: Implement police officer authentication
- **Authorization**: Role-based access control
- **HTTPS**: Use secure connections in production
- **API Security**: Validate all API requests
- **Data Privacy**: Ensure tourist data protection

## Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature/new-feature`
3. Commit changes: `git commit -am 'Add new feature'`
4. Push to branch: `git push origin feature/new-feature`
5. Submit pull request

## License

This project is part of the YatriSuraksha tourist safety system.

## Support

For technical support or questions:
- Create an issue in the repository
- Contact the development team
- Refer to the main YatriSuraksha documentation