const { Client, Databases, Query } = require('node-appwrite');

class AppwriteService {
  constructor() {
    this.client = null;
    this.databases = null;
    this.DATABASE_ID = null;
    this.TOURS_COLLECTION_ID = null;
    this.USERS_COLLECTION_ID = null;
    
    this.initializeAppwrite();
  }

  initializeAppwrite() {
    // Check if all required environment variables are present
    const requiredVars = [
      'APPWRITE_ENDPOINT',
      'APPWRITE_PROJECT_ID', 
      'APPWRITE_DATABASE_ID',
      'APPWRITE_TOURS_COLLECTION_ID',
      'APPWRITE_USERS_COLLECTION_ID'
    ];

    const missing = requiredVars.filter(varName => !process.env[varName]);
    
    if (missing.length > 0) {
      console.warn('⚠️ Appwrite not initialized. Missing environment variables:', missing);
      return;
    }

    try {
      // Initialize Appwrite client
      this.client = new Client()
        .setEndpoint(process.env.APPWRITE_ENDPOINT)
        .setProject(process.env.APPWRITE_PROJECT_ID);

      this.databases = new Databases(this.client);

      // Store collection IDs
      this.DATABASE_ID = process.env.APPWRITE_DATABASE_ID;
      this.TOURS_COLLECTION_ID = process.env.APPWRITE_TOURS_COLLECTION_ID;
      this.USERS_COLLECTION_ID = process.env.APPWRITE_USERS_COLLECTION_ID;

      console.log('✅ Appwrite service initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize Appwrite:', error);
    }
  }

  isInitialized() {
    return !!(this.client && this.databases && this.DATABASE_ID && this.TOURS_COLLECTION_ID && this.USERS_COLLECTION_ID);
  }

  async getUserById(userId) {
    if (!this.isInitialized()) {
      console.warn('Appwrite not initialized. Cannot fetch user.');
      return null;
    }

    try {
      console.log(`🔍 Fetching user data for userId: ${userId}`);
      
      // First try to get user by userId field
      const userResponse = await this.databases.listDocuments(
        this.DATABASE_ID,
        this.USERS_COLLECTION_ID,
        [Query.equal('userId', userId)]
      );

      if (userResponse.documents.length > 0) {
        const user = userResponse.documents[0];
        console.log(`✅ Found user: ${user.name} (${user.email})`);
        
        return {
          id: user.$id,
          userId: user.userId,
          name: user.name,
          email: user.email,
          phone: user.phone,
          emergencyContacts: user.emergencyContacts || [],
          createdAt: user.$createdAt,
          updatedAt: user.$updatedAt
        };
      }

      // If not found by userId, try by document ID
      const userDoc = await this.databases.getDocument(
        this.DATABASE_ID,
        this.USERS_COLLECTION_ID,
        userId
      );
      
      console.log(`✅ Found user by document ID: ${userDoc.name} (${userDoc.email})`);
      
      return {
        id: userDoc.$id,
        userId: userDoc.userId,
        name: userDoc.name,
        email: userDoc.email,
        phone: userDoc.phone,
        emergencyContacts: userDoc.emergencyContacts || [],
        createdAt: userDoc.$createdAt,
        updatedAt: userDoc.$updatedAt
      };
      
    } catch (error) {
      console.error(`❌ Error fetching user ${userId}:`, error.message);
      return null;
    }
  }

  async getEmergencyContacts(userId) {
    try {
      const user = await this.getUserById(userId);
      
      if (!user) {
        console.warn(`⚠️ User ${userId} not found for emergency contacts`);
        return [];
      }

      let emergencyContacts = [];

      console.log(`🔍 Debug - emergencyContacts type: ${typeof user.emergencyContacts}`);
      console.log(`🔍 Debug - emergencyContacts value:`, user.emergencyContacts);

      if (user.emergencyContacts) {
        // Handle different formats of emergency contacts
        if (typeof user.emergencyContacts === 'string') {
          console.log(`🔍 Processing as string: "${user.emergencyContacts}"`);
          try {
            // Try to parse as JSON first
            const parsed = JSON.parse(user.emergencyContacts);
            console.log(`🔍 JSON parsed result:`, parsed, `type: ${typeof parsed}`);
            if (Array.isArray(parsed)) {
              emergencyContacts = parsed;
            } else {
              console.warn(`⚠️ Parsed emergency contacts is not an array:`, typeof parsed);
              // If parsed result is a number, convert it to contact format
              if (typeof parsed === 'number') {
                emergencyContacts = [{
                  phone: parsed.toString(),
                  name: 'Emergency Contact'
                }];
              } else {
                emergencyContacts = [];
              }
            }
          } catch (parseError) {
            console.log(`🔍 JSON parsing failed, treating as comma-separated: ${parseError.message}`);
            // If JSON parsing fails, treat as comma-separated phone numbers
            emergencyContacts = user.emergencyContacts.split(',').map(contact => ({
              phone: contact.trim(),
              name: 'Emergency Contact'
            }));
          }
        } else if (Array.isArray(user.emergencyContacts)) {
          console.log(`🔍 Processing as array`);
          emergencyContacts = user.emergencyContacts;
        } else if (typeof user.emergencyContacts === 'number') {
          // Handle case where emergency contact is stored as a number
          console.log(`🔍 Emergency contact stored as number: ${user.emergencyContacts}`);
          emergencyContacts = [{
            phone: user.emergencyContacts.toString(),
            name: 'Emergency Contact'
          }];
        } else {
          console.warn(`⚠️ Emergency contacts is not a string, array, or number:`, typeof user.emergencyContacts, user.emergencyContacts);
          emergencyContacts = [];
        }
      }

      // Ensure emergencyContacts is an array before filtering
      if (!Array.isArray(emergencyContacts)) {
        console.warn(`⚠️ Emergency contacts is not an array after processing:`, typeof emergencyContacts);
        emergencyContacts = [];
      }

      // Filter out any invalid contacts and validate phone numbers
      emergencyContacts = emergencyContacts.filter(contact => {
        // Ensure contact is an object
        if (!contact || typeof contact !== 'object') {
          console.warn(`⚠️ Invalid contact format:`, contact);
          return false;
        }

        if (!contact.phone || contact.phone.trim().length === 0) {
          return false;
        }
        
        // Clean and validate phone number
        const cleanNumber = contact.phone.replace(/^\+91/, '').replace(/[^\d]/g, '');
        
        // Must be 10 digits
        if (cleanNumber.length !== 10) {
          console.warn(`⚠️ Invalid phone number format: ${contact.phone} (${cleanNumber.length} digits)`);
          return false;
        }
        
        return true;
      });

      console.log(`📱 Found ${emergencyContacts.length} valid emergency contacts for user ${userId}`);
      return emergencyContacts;
      
    } catch (error) {
      console.error(`❌ Error fetching emergency contacts for user ${userId}:`, error);
      return [];
    }
  }
}

module.exports = new AppwriteService();