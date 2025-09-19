const express = require('express');
const router = express.Router();
const redisClient = require('../config/redis');

// Get all active tours for police dashboard
router.get('/tours/active', async (req, res) => {
  try {
    // Get all active user locations from Redis
    const activeUsers = await redisClient.keys('location:*');
    const activeTours = [];

    for (const userKey of activeUsers) {
      const locationData = await redisClient.get(userKey);
      if (locationData) {
        const data = JSON.parse(locationData);
        const userId = userKey.replace('location:', '');
        
        activeTours.push({
          userId,
          userName: data.userName || `User ${userId}`,
          currentLocation: data.location,
          lastUpdate: data.timestamp,
          status: 'active'
        });
      }
    }

    res.json({
      success: true,
      data: activeTours,
      count: activeTours.length
    });
  } catch (error) {
    console.error('Error fetching active tours:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch active tours'
    });
  }
});

// Get tour history for a specific user
router.get('/tours/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Get current location data
    const locationData = await redisClient.get(`location:${userId}`);
    
    if (!locationData) {
      return res.status(404).json({
        success: false,
        error: 'User location data not found'
      });
    }

    const data = JSON.parse(locationData);
    
    res.json({
      success: true,
      data: {
        userId,
        userName: data.userName || `User ${userId}`,
        currentLocation: data.location,
        lastUpdate: data.timestamp,
        status: 'active'
      }
    });
  } catch (error) {
    console.error('Error fetching user tour data:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch user tour data'
    });
  }
});

// Get emergency alerts for police
router.get('/emergency/alerts', async (req, res) => {
  try {
    // Get emergency alerts from Redis
    const alertKeys = await redisClient.keys('emergency:*');
    const alerts = [];

    for (const alertKey of alertKeys) {
      const alertData = await redisClient.get(alertKey);
      if (alertData) {
        const data = JSON.parse(alertData);
        alerts.push({
          id: alertKey.replace('emergency:', ''),
          ...data
        });
      }
    }

    // Sort by timestamp (newest first)
    alerts.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    res.json({
      success: true,
      data: alerts,
      count: alerts.length
    });
  } catch (error) {
    console.error('Error fetching emergency alerts:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch emergency alerts'
    });
  }
});

// Mark emergency alert as resolved
router.put('/emergency/resolve/:alertId', async (req, res) => {
  try {
    const { alertId } = req.params;
    
    const alertData = await redisClient.get(`emergency:${alertId}`);
    if (!alertData) {
      return res.status(404).json({
        success: false,
        error: 'Emergency alert not found'
      });
    }

    const data = JSON.parse(alertData);
    data.status = 'resolved';
    data.resolvedAt = new Date().toISOString();

    await redisClient.set(`emergency:${alertId}`, JSON.stringify(data));

    res.json({
      success: true,
      message: 'Emergency alert marked as resolved',
      data
    });
  } catch (error) {
    console.error('Error resolving emergency alert:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to resolve emergency alert'
    });
  }
});

// Get police dashboard statistics
router.get('/stats', async (req, res) => {
  try {
    const activeUsers = await redisClient.keys('location:*');
    const emergencyAlerts = await redisClient.keys('emergency:*');
    
    let activeEmergencies = 0;
    for (const alertKey of emergencyAlerts) {
      const alertData = await redisClient.get(alertKey);
      if (alertData) {
        const data = JSON.parse(alertData);
        if (data.status === 'active') {
          activeEmergencies++;
        }
      }
    }

    res.json({
      success: true,
      data: {
        activeTours: activeUsers.length,
        totalEmergencies: emergencyAlerts.length,
        activeEmergencies,
        resolvedEmergencies: emergencyAlerts.length - activeEmergencies
      }
    });
  } catch (error) {
    console.error('Error fetching police stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch statistics'
    });
  }
});

module.exports = router;