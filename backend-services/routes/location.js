const express = require('express');
const router = express.Router();
const redisClient = require('../config/redis');
const { v4: uuidv4 } = require('uuid');
const moment = require('moment');

// Simple location endpoint for basic lat/lng updates
router.post('/', async (req, res) => {
  try {
    const { lat, lng } = req.body;
    
    if (!lat || !lng) {
      return res.status(400).json({ 
        error: 'Missing required fields: lat, lng' 
      });
    }
    
    console.log(`📍 Location update received: ${lat}, ${lng}`);
    
    // Store basic location data
    const locationData = {
      id: uuidv4(),
      latitude: parseFloat(lat),
      longitude: parseFloat(lng),
      timestamp: new Date().toISOString(),
      receivedAt: new Date().toISOString()
    };
    
    // Store in Redis with a simple key
    await redisClient.set(`location:${locationData.id}`, JSON.stringify(locationData), { EX: 3600 });
    
    // Emit to connected clients
    const io = req.app.get('io');
    if (io) {
      io.emit('locationUpdate', locationData);
    }
    
    res.status(200).json({ 
      success: true, 
      message: 'Location updated successfully',
      data: locationData
    });
    
  } catch (error) {
    console.error('Location update error:', error);
    res.status(500).json({ error: 'Failed to update location' });
  }
});

// Update user location
router.post('/update', async (req, res) => {
  try {
    const { userId, tourId, latitude, longitude, accuracy, timestamp, speed, heading } = req.body;
    
    if (!userId || !tourId || !latitude || !longitude) {
      return res.status(400).json({ 
        error: 'Missing required fields: userId, tourId, latitude, longitude' 
      });
    }
    
    const locationData = {
      id: uuidv4(),
      userId,
      tourId,
      latitude: parseFloat(latitude),
      longitude: parseFloat(longitude),
      accuracy: parseFloat(accuracy) || null,
      speed: parseFloat(speed) || null,
      heading: parseFloat(heading) || null,
      timestamp: timestamp || new Date().toISOString(),
      receivedAt: new Date().toISOString()
    };
    
    // Store current location
    await redisClient.set(`location:current:${userId}`, JSON.stringify(locationData), { EX: 3600 });
    
    // Store in location history (with expiration)
    const historyKey = `location:history:${userId}:${tourId}`;
    const existingHistory = await redisClient.get(historyKey);
    let history = existingHistory ? JSON.parse(existingHistory) : [];
    
    // Add new location to the beginning of the array
    history.unshift(locationData);
    
    // Keep only last 1000 locations
    if (history.length > 1000) {
      history = history.slice(0, 1000);
    }
    
    await redisClient.set(historyKey, JSON.stringify(history), { EX: 86400 }); // 24 hours
    
    // Store in real-time tracking (for police dashboard)
    const trackingData = {
      tourId,
      userId,
      lastUpdate: new Date().toISOString(),
      latitude: locationData.latitude,
      longitude: locationData.longitude,
      accuracy: locationData.accuracy || 0,
      speed: locationData.speed || 0
    };
    await redisClient.set(`tracking:active:${tourId}`, JSON.stringify(trackingData), { EX: 3600 }); // Expire after 1 hour of no updates
    
    // Broadcast to police dashboard via Socket.IO
    const io = req.app.get('io');
    if (io) {
      io.to('police-dashboard').emit('location-update', {
        tourId,
        userId,
        userName: `User ${userId}`, // You might want to fetch actual name from user data
        location: locationData,
        timestamp: locationData.timestamp,
        lastUpdate: new Date().toISOString()
      });
      
      console.log(`📍 Location update broadcasted to police dashboard: User ${userId}, Tour ${tourId}`);
    }
    
    res.status(200).json({ 
      success: true, 
      locationId: locationData.id,
      timestamp: locationData.receivedAt
    });
    
  } catch (error) {
    console.error('Error updating location:', error);
    res.status(500).json({ error: 'Failed to update location' });
  }
});

// Get current location for a user
router.get('/current/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const locationDataJson = await redisClient.get(`location:current:${userId}`);
    
    if (!locationDataJson) {
      return res.status(404).json({ error: 'No location data found for user' });
    }
    
    const locationData = JSON.parse(locationDataJson);
    
    res.status(200).json({ location: locationData });
    
  } catch (error) {
    console.error('Error getting current location:', error);
    res.status(500).json({ error: 'Failed to get current location' });
  }
});

// Get location history for a user/tour
router.get('/history/:userId/:tourId', async (req, res) => {
  try {
    const { userId, tourId } = req.params;
    const { limit = 100, offset = 0 } = req.query;
    
    const historyKey = `location:history:${userId}:${tourId}`;
    const locationStrings = await redisClient.lRange(historyKey, offset, offset + limit - 1);
    
    const locations = locationStrings.map(locStr => JSON.parse(locStr));
    
    res.status(200).json({ 
      locations,
      total: await redisClient.lLen(historyKey),
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
    
  } catch (error) {
    console.error('Error getting location history:', error);
    res.status(500).json({ error: 'Failed to get location history' });
  }
});

// Get all active tours (for police dashboard)
router.get('/active-tours', async (req, res) => {
  try {
    const activeKeys = await redisClient.keys('tracking:active:*');
    const activeTours = [];
    
    for (const key of activeKeys) {
      const tourId = key.split(':')[2];
      const tourDataJson = await redisClient.get(key);
      
      if (tourDataJson) {
        const tourData = JSON.parse(tourDataJson);
        activeTours.push({
          tourId,
          ...tourData,
          latitude: parseFloat(tourData.latitude || 0),
          longitude: parseFloat(tourData.longitude || 0),
          accuracy: parseFloat(tourData.accuracy || 0),
          speed: parseFloat(tourData.speed || 0)
        });
      }
    }
    
    res.status(200).json({ activeTours });
    
  } catch (error) {
    console.error('Error getting active tours:', error);
    res.status(500).json({ error: 'Failed to get active tours' });
  }
});

// Start tour tracking
router.post('/start-tracking/:tourId', async (req, res) => {
  try {
    const { tourId } = req.params;
    const { userId } = req.body;
    
    if (!userId) {
      return res.status(400).json({ error: 'Missing userId' });
    }
    
    // Initialize tracking record
    const trackingInfo = {
      tourId,
      userId,
      startedAt: new Date().toISOString(),
      status: 'active'
    };
    await redisClient.set(`tracking:active:${tourId}`, JSON.stringify(trackingInfo), { EX: 86400 }); // 24 hours
    
    res.status(200).json({ success: true, message: 'Tracking started' });
    
  } catch (error) {
    console.error('Error starting tracking:', error);
    res.status(500).json({ error: 'Failed to start tracking' });
  }
});

// Stop tour tracking
router.post('/stop-tracking/:tourId', async (req, res) => {
  try {
    const { tourId } = req.params;
    
    // Remove from active tracking
    await redisClient.del(`tracking:active:${tourId}`);
    
    // Notify police dashboard
    const io = req.app.get('io');
    if (io) {
      io.to('police-dashboard').emit('tour-ended', { tourId });
    }
    
    res.status(200).json({ success: true, message: 'Tracking stopped' });
    
  } catch (error) {
    console.error('Error stopping tracking:', error);
    res.status(500).json({ error: 'Failed to stop tracking' });
  }
});

module.exports = router;