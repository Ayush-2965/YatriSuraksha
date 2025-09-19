const socketService = {
  initializeSocketHandlers: (io) => {
    io.on('connection', (socket) => {
      console.log(`🔌 Client connected: ${socket.id}`);
      
      // Handle police dashboard connection
      socket.on('join-police-dashboard', (data) => {
        socket.join('police-dashboard');
        console.log(`👮 Police dashboard connected: ${socket.id}`);
        
        // Send current active tours and emergencies
        socketService.sendActiveData(socket);
      });
      
      // Handle tourist app connection
      socket.on('join-tour-tracking', (data) => {
        const { tourId, userId } = data;
        socket.join(`tour:${tourId}`);
        socket.tourId = tourId;
        socket.userId = userId;
        console.log(`🎯 Tourist joined tracking: User ${userId}, Tour ${tourId}`);
      });
      
      // Handle real-time location updates from tourist app
      socket.on('location-update', (data) => {
        const { tourId, location } = data;
        
        // Broadcast to police dashboard
        socket.to('police-dashboard').emit('location-update', {
          tourId,
          userId: socket.userId,
          location,
          socketId: socket.id
        });
        
        console.log(`📍 Location update from tour ${tourId}`);
      });
      
      // Handle emergency alerts
      socket.on('emergency-alert', (data) => {
        const { tourId, location, message } = data;
        
        // Broadcast emergency to all police dashboard clients
        io.to('police-dashboard').emit('emergency-alert', {
          tourId,
          userId: socket.userId,
          location,
          message,
          timestamp: new Date().toISOString(),
          socketId: socket.id
        });
        
        console.log(`🚨 Emergency alert from tour ${tourId}`);
      });
      
      // Handle police response to emergency
      socket.on('emergency-response', (data) => {
        const { emergencyId, tourId, response, responderId } = data;
        
        // Send response to specific tour
        socket.to(`tour:${tourId}`).emit('emergency-response', {
          emergencyId,
          response,
          responderId,
          timestamp: new Date().toISOString()
        });
        
        console.log(`👮 Police response to emergency ${emergencyId}`);
      });
      
      // Handle disconnection
      socket.on('disconnect', () => {
        console.log(`🔌 Client disconnected: ${socket.id}`);
        
        if (socket.tourId) {
          // Notify police dashboard that tour went offline
          socket.to('police-dashboard').emit('tour-offline', {
            tourId: socket.tourId,
            userId: socket.userId,
            timestamp: new Date().toISOString()
          });
        }
      });
      
      // Handle tour completion
      socket.on('tour-completed', (data) => {
        const { tourId } = data;
        
        // Notify police dashboard
        socket.to('police-dashboard').emit('tour-completed', {
          tourId,
          userId: socket.userId,
          timestamp: new Date().toISOString()
        });
        
        socket.leave(`tour:${tourId}`);
        console.log(`✅ Tour completed: ${tourId}`);
      });
      
      // Heartbeat for connection monitoring
      socket.on('heartbeat', () => {
        socket.emit('heartbeat-ack', { timestamp: new Date().toISOString() });
      });
    });
    
    console.log('🔌 Socket.IO handlers initialized');
  },
  
  sendActiveData: async (socket) => {
    try {
      const redisClient = require('../config/redis');
      
      // Get active tours
      const activeKeys = await redisClient.keys('tracking:active:*');
      const activeTours = [];
      
      for (const key of activeKeys) {
        const tourId = key.split(':')[2];
        const tourDataStr = await redisClient.get(key);
        
        if (tourDataStr) {
          try {
            const tourData = JSON.parse(tourDataStr);
            activeTours.push({
              tourId,
              ...tourData,
              latitude: parseFloat(tourData.latitude),
              longitude: parseFloat(tourData.longitude)
            });
          } catch (parseError) {
            console.error(`Error parsing tour data for ${key}:`, parseError);
          }
        }
      }
      
      // Get active emergencies
      const emergenciesListStr = await redisClient.get('emergencies:active');
      const emergencies = [];
      
      if (emergenciesListStr) {
        try {
          const emergencyIds = JSON.parse(emergenciesListStr);
          
          for (const emergencyId of emergencyIds) {
            const emergencyDataStr = await redisClient.get(`emergency:${emergencyId}`);
            if (emergencyDataStr) {
              try {
                const emergencyData = JSON.parse(emergencyDataStr);
                emergencies.push({
                  id: emergencyId,
                  ...emergencyData,
                  latitude: parseFloat(emergencyData.latitude),
                  longitude: parseFloat(emergencyData.longitude)
                });
              } catch (parseError) {
                console.error(`Error parsing emergency data for ${emergencyId}:`, parseError);
              }
            }
          }
        } catch (parseError) {
          console.error('Error parsing emergencies list:', parseError);
        }
      }
      
      // Send initial data to police dashboard
      socket.emit('initial-data', {
        activeTours,
        emergencies,
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      console.error('Error sending active data:', error);
    }
  },
  
  broadcastToPolice: (io, event, data) => {
    io.to('police-dashboard').emit(event, {
      ...data,
      timestamp: new Date().toISOString()
    });
  },
  
  sendToTour: (io, tourId, event, data) => {
    io.to(`tour:${tourId}`).emit(event, {
      ...data,
      timestamp: new Date().toISOString()
    });
  }
};

module.exports = socketService;