const twilio = require('twilio');

class SMSService {
  constructor() {
    console.log('🔍 SMS Service - Initializing...');
    console.log('🔍 SMS Service - TWILIO_ACCOUNT_SID present:', !!process.env.TWILIO_ACCOUNT_SID);
    console.log('🔍 SMS Service - TWILIO_AUTH_TOKEN present:', !!process.env.TWILIO_AUTH_TOKEN);
    console.log('🔍 SMS Service - TWILIO_PHONE_NUMBER present:', !!process.env.TWILIO_PHONE_NUMBER);
    console.log('🔍 SMS Service - TWILIO_MESSAGING_SERVICE_SID present:', !!process.env.TWILIO_MESSAGING_SERVICE_SID);
    
    // Initialize Twilio client (primary SMS provider)
    if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
      try {
        this.twilioClient = twilio(
          process.env.TWILIO_ACCOUNT_SID,
          process.env.TWILIO_AUTH_TOKEN
        );
        this.twilioNumber = process.env.TWILIO_PHONE_NUMBER;
        this.twilioMessagingServiceSid = process.env.TWILIO_MESSAGING_SERVICE_SID;
        this.provider = 'twilio';
        console.log(`✅ SMS Service initialized with Twilio`);
        console.log(`📱 Twilio Phone Number: ${this.twilioNumber}`);
        console.log(`📱 Twilio Messaging Service SID: ${this.twilioMessagingServiceSid}`);
      } catch (error) {
        console.error('❌ Failed to initialize Twilio client:', error.message);
        this.provider = null;
      }
    } else {
      console.warn('⚠️  Twilio SMS provider not configured. SMS notifications will not work.');
      console.warn('⚠️  Please set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_PHONE_NUMBER');
    }
  }
  
  async sendEmergencySMS(phoneNumber, message, recipientName = 'Contact') {
    console.log(`🔍 SMS Debug - Attempting to send SMS to ${recipientName} (${phoneNumber})`);
    console.log(`🔍 SMS Debug - Provider: ${this.provider}`);
    console.log(`🔍 SMS Debug - Message: ${message.substring(0, 100)}...`);
    
    if (!this.provider || this.provider !== 'twilio') {
      console.error('❌ SMS Debug - Twilio not configured');
      throw new Error('Twilio SMS provider not configured');
    }
    
    try {
      console.log('🔍 SMS Debug - Using Twilio provider');
      const result = await this.sendViaTwilio(phoneNumber, message);
      
      console.log(`✅ Emergency SMS sent to ${recipientName} (${phoneNumber})`);
      console.log(`📱 SMS Result:`, result);
      return result;
      
    } catch (error) {
      console.error(`❌ Failed to send SMS to ${recipientName} (${phoneNumber}):`, error.message);
      console.error(`❌ SMS Error Details:`, error);
      throw error;
    }
  }
  
  async sendViaTwilio(phoneNumber, message) {
    console.log(`🔍 Twilio Debug - Starting SMS send process`);
    console.log(`🔍 Twilio Debug - twilioClient exists:`, !!this.twilioClient);
    console.log(`🔍 Twilio Debug - twilioNumber:`, this.twilioNumber);
    console.log(`🔍 Twilio Debug - twilioMessagingServiceSid:`, this.twilioMessagingServiceSid);
    
    if (!this.twilioClient) {
      const error = 'Twilio client not initialized. Please check TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN';
      console.error(`❌ ${error}`);
      throw new Error(error);
    }

    if (!this.twilioNumber && !this.twilioMessagingServiceSid) {
      const error = 'Twilio sending method not configured. Please set either TWILIO_PHONE_NUMBER or TWILIO_MESSAGING_SERVICE_SID';
      console.error(`❌ ${error}`);
      throw new Error(error);
    }
    
    // Format phone number for international use
    let formattedNumber = phoneNumber;
    
    // If it's an Indian number without country code, add +91
    if (phoneNumber.match(/^[6-9]\d{9}$/)) {
      formattedNumber = `+91${phoneNumber}`;
    } else if (phoneNumber.match(/^91[6-9]\d{9}$/)) {
      formattedNumber = `+${phoneNumber}`;
    } else if (!phoneNumber.startsWith('+')) {
      // If no + prefix, assume it needs +91 for Indian numbers
      const cleanNumber = phoneNumber.replace(/[^\d]/g, '');
      if (cleanNumber.length === 10 && cleanNumber.match(/^[6-9]/)) {
        formattedNumber = `+91${cleanNumber}`;
      }
    }
    
    console.log(`🔍 Twilio Debug - Original: ${phoneNumber}, Formatted: ${formattedNumber}`);
    console.log(`🔍 Twilio Debug - Message length: ${message.length}`);
    
    // Prepare message data - prefer MessagingServiceSid over phone number
    const messageData = {
      body: message,
      to: formattedNumber
    };

    if (this.twilioMessagingServiceSid) {
      messageData.messagingServiceSid = this.twilioMessagingServiceSid;
      console.log(`🔍 Twilio Debug - Using Messaging Service: ${this.twilioMessagingServiceSid}`);
    } else {
      messageData.from = this.twilioNumber;
      console.log(`🔍 Twilio Debug - Using From number: ${this.twilioNumber}`);
    }
    
    try {
      console.log(`🔍 Twilio Debug - Calling Twilio API with:`, messageData);
      const result = await this.twilioClient.messages.create(messageData);
      
      console.log(`✅ Twilio Debug - SMS sent successfully!`);
      console.log(`📱 Twilio Response:`, {
        sid: result.sid,
        status: result.status,
        to: result.to,
        from: result.from
      });
      
      return {
        provider: 'twilio',
        messageId: result.sid,
        status: result.status,
        to: formattedNumber,
        originalNumber: phoneNumber
      };
    } catch (twilioError) {
      console.error(`❌ Twilio API Error:`, twilioError.message);
      console.error(`❌ Twilio Error Code:`, twilioError.code);
      console.error(`❌ Twilio Error Details:`, twilioError);
      throw new Error(`Twilio SMS failed: ${twilioError.message}`);
    }
  }
  
  async sendLocationUpdateSMS(phoneNumber, tourId, location, touristName) {
    const message = `📍 Location Update: ${touristName} is currently at https://maps.google.com/maps?q=${location.latitude},${location.longitude} (Tour: ${tourId}) - ${new Date().toLocaleString()}`;
    
    return this.sendEmergencySMS(phoneNumber, message, 'Location Update');
  }
  
  async sendTourStartSMS(phoneNumber, tourId, touristName, startLocation) {
    const message = `🎯 Tour Started: ${touristName} has started tour ${tourId}. Starting location: https://maps.google.com/maps?q=${startLocation.latitude},${startLocation.longitude} - ${new Date().toLocaleString()}`;
    
    return this.sendEmergencySMS(phoneNumber, message, 'Tour Start');
  }
  
  async sendTourEndSMS(phoneNumber, tourId, touristName, endLocation) {
    const message = `✅ Tour Completed: ${touristName} has safely completed tour ${tourId}. Final location: https://maps.google.com/maps?q=${endLocation.latitude},${endLocation.longitude} - ${new Date().toLocaleString()}`;
    
    return this.sendEmergencySMS(phoneNumber, message, 'Tour End');
  }
  
  // Bulk SMS for multiple contacts
  async sendBulkSMS(contacts, message) {
    const results = [];
    
    for (const contact of contacts) {
      try {
        const result = await this.sendEmergencySMS(contact.phone, message, contact.name);
        results.push({ contact, result, status: 'success' });
      } catch (error) {
        results.push({ contact, error: error.message, status: 'failed' });
      }
    }
    
    return results;
  }
}

module.exports = new SMSService();