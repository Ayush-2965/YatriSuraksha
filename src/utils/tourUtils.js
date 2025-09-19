import { ID, databases, Query } from '../lib/appwrite';
import blockchainService from '../services/blockchainService';
import CryptoJS from 'crypto-js';

// Enhanced hash function for creating touristId using blockchain-compatible method
export const hashAadhaarData = (aadhaarData) => {
  // Handle both nested and flat structures
  const name = aadhaarData.data?.name || aadhaarData.name || '';
  
  // Handle different mobile number formats
  let mobile = '';
  if (aadhaarData.data?.mobile === true || aadhaarData.data?.mobile === false) {
    // For secure QR, mobile is a boolean, use last_4_digits_mobile_no
    mobile = aadhaarData.data?.last_4_digits_mobile_no || '';
  } else {
    // For old QR format, mobile is the actual number
    mobile = aadhaarData.data?.mobile || aadhaarData.mobile || '';
  }
  
  const uid = aadhaarData.data?.uid || aadhaarData.data?.aadhaar_last_4_digit || aadhaarData.uid || aadhaarData.aadhaar || '';
  
  // Use crypto-js for proper hashing (same as blockchain)
  const aadhaarHash = CryptoJS.SHA256(uid).toString();
  const combinedData = `${aadhaarHash}${name}${mobile}`;
  const finalHash = CryptoJS.SHA256(combinedData).toString();
  
  return `TID-${finalHash.substring(0, 12).toUpperCase()}`;
};

// Generate blockchain-compatible tourist ID
export const generateBlockchainTouristId = (aadhaarNumber, userName, userMobile) => {
  const aadhaarHash = CryptoJS.SHA256(aadhaarNumber).toString();
  const combinedData = `${aadhaarHash}${userName}${userMobile}`;
  const finalHash = CryptoJS.SHA256(combinedData).toString();
  return `TID-${finalHash.substring(0, 12).toUpperCase()}`;
};

// Create tour in Appwrite database with blockchain integration
export const createTour = async (tourData, user, aadhaarData) => {
  try {
    const databaseId = import.meta.env.VITE_APPWRITE_DATABASE_ID;
    const toursCollectionId = import.meta.env.VITE_APPWRITE_TOURS_COLLECTION_ID;
    
    // Check if user already has an ongoing tour
    const existingTours = await databases.listDocuments(databaseId, toursCollectionId, [
      Query.and([
        Query.equal('userId', user.$id),
        Query.equal('status', 'ongoing')
      ])
    ]);
    
    if (existingTours.documents.length > 0) {
      throw new Error('You already have an ongoing tour. Please complete or cancel it before creating a new one.');
    }
    
    // Extract user and Aadhaar data from multiple sources including parsed data
    const userName = aadhaarData.data?.name || aadhaarData.data_parsed?.name || aadhaarData.name || user?.name || '';
    const aadhaarNumber = aadhaarData.data?.uid || aadhaarData.data_parsed?.reference_id || aadhaarData.data?.aadhaar_last_4_digit || aadhaarData.uid || aadhaarData.aadhaar || '';
    
    // Extract last 4 digits for aadhaar verification - try multiple sources
    let aadhaarLast4 = '';
    if (aadhaarData.data?.aadhaar_last_4_digit) {
      aadhaarLast4 = aadhaarData.data.aadhaar_last_4_digit;
    } else if (aadhaarData.data_parsed?.reference_id && aadhaarData.data_parsed.reference_id.length >= 4) {
      // For secure QR reference_id, use FIRST 4 digits (9512 from 951220250910180142115)
      aadhaarLast4 = aadhaarData.data_parsed.reference_id.substring(0, 4);
    } else if (aadhaarNumber && aadhaarNumber.length >= 4) {
      // For UID, use LAST 4 digits
      aadhaarLast4 = aadhaarNumber.slice(-4);
    } else if (aadhaarData.referenceId && aadhaarData.referenceId.length >= 4) {
      aadhaarLast4 = aadhaarData.referenceId.substring(0, 4); // First 4 of reference ID as fallback
    }
    
    // Handle mobile number extraction properly - support multiple field variations
    let userMobile = '';
    if (aadhaarData.data?.mobile === true || aadhaarData.data?.mobile === false) {
      // For secure QR, mobile is a boolean, use last_4_digits_mobile_no
      userMobile = aadhaarData.data?.last_4_digits_mobile_no || user?.phone || '';
    } else if (aadhaarData.data?.mobile_masked) {
      // Handle mobile_masked field
      userMobile = aadhaarData.data.mobile_masked || user?.phone || '';
    } else if (aadhaarData.data_parsed?.mobile) {
      // For secure QR parsed data, check if mobile is masked (XXXXXX pattern)
      const mobileFromParsed = aadhaarData.data_parsed.mobile;
      if (mobileFromParsed && mobileFromParsed.includes('XXXXXX')) {
        // Extract last 4 digits from masked mobile (XXXXXX4628 -> 4628)
        userMobile = mobileFromParsed.replace('XXXXXX', '');
      } else {
        userMobile = mobileFromParsed || user?.phone || '';
      }
    } else {
      // For old QR format, mobile is the actual number, also check mobile_masked as fallback
      userMobile = aadhaarData.data?.mobile || aadhaarData.mobile || aadhaarData.data?.mobile_masked || user?.phone || '';
    }
    
    // Generate unique tourist ID for this specific tour (not per user)
    const timestamp = Date.now();
    const randomSuffix = Math.random().toString(36).substring(2, 8).toUpperCase();
    const touristId = `TID-${timestamp.toString().slice(-8)}${randomSuffix}`;
    
    console.log('🔗 Generated unique Tourist ID for this tour:', touristId);
    console.log('👤 User details:', { userName, userMobile, aadhaarLast4 });
    
    // Try to register tourist on blockchain first
    let blockchainResult = null;
    try {
      console.log('🔗 Attempting blockchain registration...');
      blockchainResult = await blockchainService.registerTourist(aadhaarNumber, userName, userMobile);
      if (!blockchainResult?.success) {
        console.warn('⚠️ Blockchain registration failed, continuing with database only:', blockchainResult?.error || 'Unknown error');
        blockchainResult = { success: false, error: blockchainResult?.error || 'Registration failed' };
      } else {
        console.log('✅ Tourist registered on blockchain:', blockchainResult.transactionHash);
      }
    } catch (blockchainError) {
      console.warn('⚠️ Blockchain service error, continuing with database only:', blockchainError.message);
      blockchainResult = { success: false, error: blockchainError.message };
      // Don't rethrow - continue with database creation
    }
    
    // NOTE: User collection will be updated with active touristId when tour STARTS
    // This ensures only active tours have tourist IDs visible to police
    console.log('ℹ️ Tourist ID will be activated when tour starts');
    
    // Ensure locations have all required properties
    const sanitizedLocations = (tourData.locations || []).map((loc, index) => {
      const sanitized = {
        lat: Number(loc.lat) || 0,
        lng: Number(loc.lng) || 0,
        name: String(loc.name || `Location ${index + 1}`),
        order: Number(loc.order) || index + 1
      };
      return JSON.stringify(sanitized);
    });
    
    console.log('Creating tour with locations:', sanitizedLocations);
    
    // Create tour object with all required and optional fields
    const tour = {
      userId: user?.$id || 'anonymous', // Required by Appwrite schema
      touristId,
      status: 'upcoming',
      startDate: tourData.startDate, // Required by Appwrite schema
      endDate: tourData.endDate, // Likely also required
      locations: sanitizedLocations, // Array of location objects
      touristName: userName || 'Unknown',
      touristMobile: userMobile || '',
      aadhaarLastFour: aadhaarLast4 || (aadhaarNumber ? aadhaarNumber.slice(-4) : '') // Use extracted last 4 digits
    };
    
    console.log('Minimal tour object to create:', tour);

    // Create tour in database
    try {
      const response = await databases.createDocument(databaseId, toursCollectionId, ID.unique(), tour);
      console.log('✅ Tour created successfully with Tourist ID:', touristId);
      
      return {
        ...response,
        touristId,
        blockchainResult
      };
    } catch (dbError) {
      console.error('❌ Database error creating tour:', dbError);
      console.error('❌ Error message:', dbError.message);
      console.error('❌ Error type:', dbError.type);
      console.error('❌ Tour object that failed:', tour);
      throw new Error(`Failed to create tour: ${dbError.message}`);
    }
  } catch (error) {
    console.error('Error creating tour:', error);
    throw error;
  }
};

// Update tour status
export const updateTourStatus = async (tourId, status) => {
  try {
    console.log('🔄 Updating tour status:', { tourId, status });
    
    const databaseId = import.meta.env.VITE_APPWRITE_DATABASE_ID;
    const toursCollectionId = import.meta.env.VITE_APPWRITE_TOURS_COLLECTION_ID;
    
    const response = await databases.updateDocument(databaseId, toursCollectionId, tourId, {
      status
    });
    
    console.log('✅ Tour status updated successfully');
    
    // If tour is starting (active OR ongoing), activate the tourist ID in user collection
    if (status === 'active' || status === 'ongoing') {
      console.log('🎫 Tour is starting, activating Tourist ID...');
      await activateTouristId(tourId);
    }
    
    // If tour is completed or cancelled, deactivate the tourist ID
    if (status === 'completed' || status === 'cancelled') {
      console.log('🏁 Tour is ending, deactivating Tourist ID...');
      await deactivateTouristId(tourId);
    }
    
    return response;
  } catch (error) {
    console.error('❌ Error updating tour status:', error);
    throw error;
  }
};

// Activate tourist ID in user collection when tour starts
export const activateTouristId = async (tourId) => {
  try {
    console.log('🔄 Starting Tourist ID activation for tour:', tourId);
    
    const databaseId = import.meta.env.VITE_APPWRITE_DATABASE_ID;
    const toursCollectionId = import.meta.env.VITE_APPWRITE_TOURS_COLLECTION_ID;
    const usersCollectionId = import.meta.env.VITE_APPWRITE_USERS_COLLECTION_ID;
    
    console.log('📊 Database config:', { databaseId, toursCollectionId, usersCollectionId });
    
    // Get tour details to find tourist ID and user ID
    const tour = await databases.getDocument(databaseId, toursCollectionId, tourId);
    console.log('🗺️ Tour data retrieved:', {
      id: tour.$id,
      userId: tour.userId,
      touristId: tour.touristId,
      status: tour.status,
      touristName: tour.touristName
    });
    
    if (tour.userId && tour.touristId) {
      console.log('👤 Ensuring user document exists for userId:', tour.userId);
      
      // Ensure user document exists first
      const userDocumentCreated = await ensureUserDocument(tour.userId, tour.touristName || tour.userName);
      
      if (!userDocumentCreated) {
        console.error('❌ Failed to create/verify user document. Cannot activate Tourist ID.');
        return;
      }
      
      console.log('🔄 Updating user document with Tourist ID...');
      
      // Update user with active tourist ID
      const updateResult = await databases.updateDocument(databaseId, usersCollectionId, tour.userId, {
        touristId: tour.touristId,
        aadhaarVerified: true,
        activeTourId: tourId
      });
      
      console.log('✅ Tourist ID activated successfully!', {
        userId: tour.userId,
        touristId: tour.touristId,
        updateResult: updateResult
      });
    } else {
      console.warn('⚠️ Missing required data:', {
        userId: tour.userId,
        touristId: tour.touristId
      });
    }
  } catch (error) {
    console.error('❌ Failed to activate tourist ID:', error);
    console.error('❌ Error details:', {
      message: error.message,
      code: error.code,
      type: error.type
    });
    // Don't throw - this shouldn't break tour status update
  }
};

// Deactivate tourist ID in user collection when tour ends
export const deactivateTouristId = async (tourId) => {
  try {
    const databaseId = import.meta.env.VITE_APPWRITE_DATABASE_ID;
    const toursCollectionId = import.meta.env.VITE_APPWRITE_TOURS_COLLECTION_ID;
    const usersCollectionId = import.meta.env.VITE_APPWRITE_USERS_COLLECTION_ID;
    
    // Get tour details to find user ID
    const tour = await databases.getDocument(databaseId, toursCollectionId, tourId);
    
    if (tour.userId) {
      // Ensure user document exists before trying to update it
      const userExists = await ensureUserDocument(tour.userId, tour.userName);
      
      if (userExists) {
        // Clear tourist ID from user
        await databases.updateDocument(databaseId, usersCollectionId, tour.userId, {
          touristId: null,
          activeTourId: null
        });
        
        console.log('✅ Tourist ID deactivated for tour:', tourId);
      }
    }
  } catch (error) {
    console.error('❌ Failed to deactivate tourist ID:', error);
    // Don't throw - this shouldn't break tour status update
  }
};

// Ensure user document exists in Users collection
export const ensureUserDocument = async (userId, userName = null) => {
  try {
    console.log('🔍 Checking if user document exists for:', userId);
    
    const databaseId = import.meta.env.VITE_APPWRITE_DATABASE_ID;
    const usersCollectionId = import.meta.env.VITE_APPWRITE_USERS_COLLECTION_ID;
    
    console.log('📊 Using database config:', { databaseId, usersCollectionId });
    
    // Check if user document already exists
    try {
      const existingUser = await databases.getDocument(databaseId, usersCollectionId, userId);
      console.log('✅ User document already exists:', {
        userId: existingUser.$id,
        name: existingUser.name,
        touristId: existingUser.touristId
      });
      return true;
    } catch (checkError) {
      // User document doesn't exist, create it
      console.log('📝 User document not found, creating new one for:', userId);
      console.log('📝 Using userName:', userName);
      console.log('📝 Check error (expected):', checkError.message);
      
      const newUserDoc = await databases.createDocument(databaseId, usersCollectionId, userId, {
        userId: userId,
        name: userName || 'Unknown User',
        email: '', // Use empty string instead of null
        gender: 'Not Specified', // Required field
        age: 0, // Use 0 instead of null
        dob: '', // Use empty string instead of null
        phone: '', // Use empty string instead of null
        touristId: null,
        aadhaarVerified: false,
        activeTourId: null,
        emergencyContacts: [],
        createdAt: new Date().toISOString()
      });
      
      console.log('✅ User document created successfully:', {
        userId: newUserDoc.$id,
        name: newUserDoc.name
      });
      return true;
    }
  } catch (error) {
    console.error('❌ Failed to ensure user document:', error);
    console.error('❌ Error details:', {
      message: error.message,
      code: error.code,
      type: error.type
    });
    return false;
  }
};

// Start a tour (activate tourist ID)
export const startTour = async (tourId) => {
  console.log('🚀 Starting tour:', tourId);
  return await updateTourStatus(tourId, 'ongoing');
};

// Complete a tour (deactivate tourist ID)
export const completeTour = async (tourId) => {
  return await updateTourStatus(tourId, 'completed');
};

// Cancel tour
export const cancelTour = async (tourId) => {
  try {
    const response = await updateTourStatus(tourId, 'cancelled');
    
    // Clear session storage if this was an ongoing tour
    const userSession = localStorage.getItem('userSession');
    if (userSession) {
      const sessionData = JSON.parse(userSession);
      if (sessionData.ongoingTourId === tourId) {
        sessionData.ongoingTourId = null;
        sessionData.tourStatus = null;
        localStorage.setItem('userSession', JSON.stringify(sessionData));
      }
    }
    
    return response;
  } catch (error) {
    console.error('Error cancelling tour:', error);
    throw error;
  }
};

// Check if user has any ongoing tours
export const checkOngoingTours = async (userId) => {
  try {
    const databaseId = import.meta.env.VITE_APPWRITE_DATABASE_ID;
    const toursCollectionId = import.meta.env.VITE_APPWRITE_TOURS_COLLECTION_ID;
    
    const response = await databases.listDocuments(databaseId, toursCollectionId, [
      Query.and([
        Query.equal('userId', userId),
        Query.equal('status', 'ongoing')
      ])
    ]);
    
    return response.documents.length > 0;
  } catch (error) {
    console.error('Error checking ongoing tours:', error);
    throw error;
  }
};

// Get user tours
export const getUserTours = async (userId) => {
  try {
    const databaseId = import.meta.env.VITE_APPWRITE_DATABASE_ID;
    const toursCollectionId = import.meta.env.VITE_APPWRITE_TOURS_COLLECTION_ID;
    
    const response = await databases.listDocuments(databaseId, toursCollectionId, [
      Query.equal('userId', userId)
    ]);
    
    // Check if response and documents exist
    if (!response || !response.documents) {
      console.warn('No response or documents from database');
      return [];
    }
    
    // Parse location JSON strings back to objects
    const tours = response.documents.map(tour => ({
      ...tour,
      locations: (tour.locations || []).map((locStr, index) => {
        try {
          const parsed = JSON.parse(locStr);
          // Ensure all required properties exist with defaults
          return {
            lat: parsed.lat || 0,
            lng: parsed.lng || 0,
            name: parsed.name || 'Unknown Location',
            order: parsed.order || index + 1,
            // Add any other properties that might be expected
            ...parsed
          };
        } catch (e) {
          console.error('Error parsing location:', locStr, e);
          return { 
            name: 'Unknown Location', 
            lat: 0, 
            lng: 0, 
            order: index + 1 
          };
        }
      })
    }));
    
    return tours;
  } catch (error) {
    console.error('Error fetching tours:', error);
    // Return empty array for offline scenarios instead of throwing
    return [];
  }
};

// Check and update tour status based on current date
export const checkAndUpdateTourStatus = async (tour) => {
  const currentDate = new Date();
  const endDate = new Date(tour.endDate);
  
  if (tour.status === 'ongoing' && endDate < currentDate) {
    await updateTourStatus(tour.$id, 'completed');
    
    // Clear session storage if this tour was completed
    const userSession = localStorage.getItem('userSession');
    if (userSession) {
      const sessionData = JSON.parse(userSession);
      if (sessionData.ongoingTourId === tour.$id) {
        sessionData.ongoingTourId = null;
        sessionData.tourStatus = null;
        localStorage.setItem('userSession', JSON.stringify(sessionData));
      }
    }
    
    return 'completed';
  }
  return tour.status;
};

// IndexedDB utilities for offline support
export const openIndexedDB = () => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('YatriSurakshaDB', 3); // Increased version to avoid conflicts
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('tours')) {
        db.createObjectStore('tours', { keyPath: '$id' });
      }
    };
  });
};

export const saveTourToIndexedDB = async (tour) => {
  try {
    const db = await openIndexedDB();
    const transaction = db.transaction(['tours'], 'readwrite');
    const store = transaction.objectStore('tours');
    await store.put(tour);
    console.log('✅ Tour saved to IndexedDB for offline access');
  } catch (error) {
    console.warn('⚠️ Failed to save tour to IndexedDB (offline access unavailable):', error.message);
    // Don't throw - this is for offline support only
  }
};

export const getToursFromIndexedDB = async () => {
  try {
    const db = await openIndexedDB();
    const transaction = db.transaction(['tours'], 'readonly');
    const store = transaction.objectStore('tours');
    const request = store.getAll();
    
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('Error getting tours from IndexedDB:', error);
    return [];
  }
};

// Get ongoing tour from localStorage (guaranteed offline access)
export const getOngoingTourFromStorage = () => {
  try {
    const userSession = localStorage.getItem('userSession');
    if (userSession) {
      const sessionData = JSON.parse(userSession);
      if (sessionData.ongoingTourData && sessionData.tourStatus === 'ongoing') {
        return sessionData.ongoingTourData;
      }
    }
    return null;
  } catch (error) {
    console.error('Error getting ongoing tour from localStorage:', error);
    return null;
  }
};

// Save ongoing tour to localStorage (for guaranteed offline access)
export const saveOngoingTourToStorage = (tour) => {
  try {
    const userSession = localStorage.getItem('userSession');
    if (userSession) {
      const sessionData = JSON.parse(userSession);
      sessionData.ongoingTourId = tour.$id;
      sessionData.tourStatus = 'ongoing';
      sessionData.ongoingTourData = tour;
      localStorage.setItem('userSession', JSON.stringify(sessionData));
    }
  } catch (error) {
    console.error('Error saving ongoing tour to localStorage:', error);
  }
};