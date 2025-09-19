const express = require('express');
const router = express.Router();
const redisClient = require('../config/redis');
const smsService = require('../services/smsService');
const appwriteService = require('../services/appwriteService');
const { v4: uuidv4 } = require('uuid');

// Trigger emergency alert
router.post('/alert', async (req, res) => {
  try {
    const { 
      userId, 
      tourId, 
      latitude, 
      longitude, 
      message = 'EMERGENCY ALERT: Tourist needs immediate assistance!' 
    } = req.body;
    
    console.log('🚨 Emergency Alert Debug:');
    console.log('🔍 userId:', userId);
    console.log('🔍 tourId:', tourId);
    console.log('🔍 location:', { latitude, longitude });
    console.log('🔍 message:', message);
    
    // Fetch emergency contacts from Appwrite users collection
    console.log('🔍 Fetching emergency contacts from Appwrite...');
    const emergencyContacts = await appwriteService.getEmergencyContacts(userId);
    console.log('🔍 emergencyContacts from Appwrite:', emergencyContacts);
    
    if (!userId || !tourId || !latitude || !longitude) {
      return res.status(400).json({ 
        error: 'Missing required fields: userId, tourId, latitude, longitude' 
      });
    }
    
    const emergencyId = uuidv4();
    const timestamp = new Date().toISOString();
    
    const emergencyData = {
      id: emergencyId,
      userId,
      tourId,
      latitude: parseFloat(latitude),
      longitude: parseFloat(longitude),
      message,
      timestamp,
      status: 'active',
      emergencyContacts: emergencyContacts || []
    };
    
    // Store emergency alert in Redis
    await redisClient.set(`emergency:${emergencyId}`, JSON.stringify(emergencyData), { EX: 86400 }); // Expire after 24 hours
    
    // Add to active emergencies list
    const activeEmergencies = await redisClient.get('emergencies:active');
    let emergenciesList = activeEmergencies ? JSON.parse(activeEmergencies) : [];
    emergenciesList.unshift(emergencyId); // Add to beginning
    
    // Keep last 100 emergencies
    if (emergenciesList.length > 100) {
      emergenciesList = emergenciesList.slice(0, 100);
    }
    
    await redisClient.set('emergencies:active', JSON.stringify(emergenciesList), { EX: 86400 });
    
    // Broadcast to police dashboard immediately
    const io = req.app.get('io');
    if (io) {
      // Get user name from Appwrite for better police dashboard display
      const userData = await appwriteService.getUserById(userId);
      const userName = userData ? userData.name : `User ${userId}`;
      
      io.to('police-dashboard').emit('emergency-alert', {
        id: emergencyData.id,
        userId: emergencyData.userId,
        userName: userName,
        location: {
          latitude: emergencyData.latitude,
          longitude: emergencyData.longitude
        },
        timestamp: emergencyData.timestamp,
        message: emergencyData.message,
        tourId: emergencyData.tourId,
        status: emergencyData.status,
        priority: 'high'
      });
      
      console.log(`🚨 Emergency alert broadcasted to police dashboard: ${emergencyId}`);
    }
    
    // Send SMS notifications to emergency contacts
    if (emergencyContacts && emergencyContacts.length > 0) {
      try {
        // Create a shorter message for Twilio trial account limits (160 chars per segment)
        const locationUrl = `https://maps.google.com/maps?q=${latitude},${longitude}`;
        const smsMessage = `EMERGENCY: ${message}\nLocation: ${locationUrl}\nTime: ${new Date().toLocaleTimeString()}`;
        
        console.log(`🔍 SMS Message length: ${smsMessage.length} characters`);
        console.log(`🔍 SMS Message: ${smsMessage}`);
        
        const smsPromises = emergencyContacts.map(contact => 
          smsService.sendEmergencySMS(contact.phone, smsMessage, contact.name)
        );
        
        const smsResults = await Promise.allSettled(smsPromises);
        
        // Log SMS results
        const successfulSMS = smsResults.filter(result => result.status === 'fulfilled').length;
        const failedSMS = smsResults.filter(result => result.status === 'rejected').length;
        
        console.log(`Emergency SMS sent: ${successfulSMS} successful, ${failedSMS} failed`);
        
        // Store SMS results by updating the emergency data
        const updatedEmergencyData = {
          ...emergencyData,
          smsResults: JSON.stringify(smsResults),
          smsSentAt: new Date().toISOString(),
          smsSuccessCount: successfulSMS,
          smsFailureCount: failedSMS
        };
        
        await redisClient.set(`emergency:${emergencyId}`, JSON.stringify(updatedEmergencyData), { EX: 86400 });
        
      } catch (smsError) {
        console.error('Error sending emergency SMS:', smsError);
      }
    }
    
    // Police will be notified via dashboard only (no SMS to police)
    console.log('👮 Police will be notified via dashboard real-time updates');
    
    res.status(200).json({ 
      success: true, 
      emergencyId,
      message: 'Emergency alert triggered successfully',
      timestamp
    });
    
  } catch (error) {
    console.error('Error triggering emergency alert:', error);
    res.status(500).json({ error: 'Failed to trigger emergency alert' });
  }
});

// Get emergency details
router.get('/:emergencyId', async (req, res) => {
  try {
    const { emergencyId } = req.params;
    
    const emergencyDataJson = await redisClient.get(`emergency:${emergencyId}`);
    
    if (!emergencyDataJson) {
      return res.status(404).json({ error: 'Emergency not found' });
    }
    
    const emergencyData = JSON.parse(emergencyDataJson);
    
    res.status(200).json({ emergency: emergencyData });
    
  } catch (error) {
    console.error('Error getting emergency details:', error);
    res.status(500).json({ error: 'Failed to get emergency details' });
  }
});

// Get all active emergencies (for police dashboard)
router.get('/active/all', async (req, res) => {
  try {
    const emergenciesListJson = await redisClient.get('emergencies:active');
    const emergencyIds = emergenciesListJson ? JSON.parse(emergenciesListJson) : [];
    const emergencies = [];
    
    for (const emergencyId of emergencyIds) {
      const emergencyDataJson = await redisClient.get(`emergency:${emergencyId}`);
      if (emergencyDataJson) {
        const emergencyData = JSON.parse(emergencyDataJson);
        emergencies.push({
          id: emergencyId,
          ...emergencyData,
          latitude: parseFloat(emergencyData.latitude || 0),
          longitude: parseFloat(emergencyData.longitude || 0)
        });
      }
    }
    
    res.status(200).json({ emergencies });
    
  } catch (error) {
    console.error('Error getting active emergencies:', error);
    res.status(500).json({ error: 'Failed to get active emergencies' });
  }
});

// Update emergency status
router.patch('/:emergencyId/status', async (req, res) => {
  try {
    const { emergencyId } = req.params;
    const { status, responderId, response } = req.body;
    
    if (!status) {
      return res.status(400).json({ error: 'Status is required' });
    }
    
    // Get current emergency data
    const emergencyDataJson = await redisClient.get(`emergency:${emergencyId}`);
    if (!emergencyDataJson) {
      return res.status(404).json({ error: 'Emergency not found' });
    }
    
    const emergencyData = JSON.parse(emergencyDataJson);
    
    const updates = {
      status,
      updatedAt: new Date().toISOString()
    };
    
    if (responderId) updates.responderId = responderId;
    if (response) updates.response = response;
    
    // Update emergency data
    const updatedEmergencyData = { ...emergencyData, ...updates };
    await redisClient.set(`emergency:${emergencyId}`, JSON.stringify(updatedEmergencyData), { EX: 86400 });
    
    // If emergency is resolved, remove from active list
    if (status === 'resolved' || status === 'closed') {
      await redisClient.lRem('emergencies:active', 1, emergencyId);
    }
    
    // Broadcast status update to police dashboard
    const io = req.app.get('io');
    if (io) {
      io.to('police-dashboard').emit('emergency-status-update', {
        emergencyId,
        status,
        responderId,
        response,
        updatedAt: updates.updatedAt
      });
    }
    
    res.status(200).json({ 
      success: true, 
      message: 'Emergency status updated',
      emergencyId,
      status
    });
    
  } catch (error) {
    console.error('Error updating emergency status:', error);
    res.status(500).json({ error: 'Failed to update emergency status' });
  }
});

module.exports = router;