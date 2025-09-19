import React, { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { FaPlus } from "react-icons/fa";

// Components
import Header from "../components/layout/Header";
import Modal from "../components/ui/Modal";
import AadhaarVerificationModal from "../components/aadhaar/AadhaarVerificationModal";
import TourForm from "../components/tour/TourForm";
import TourCard from "../components/tour/TourCard";

// Hooks
import { useAuth } from "../context/useAuth";

// Utils
import { createTour, getUserTours, checkAndUpdateTourStatus, saveTourToIndexedDB, cancelTour, checkOngoingTours, getToursFromIndexedDB, getOngoingTourFromStorage, saveOngoingTourToStorage, startTour } from "../utils/tourUtils";

// Constants
import { BUTTON_LABELS, MODAL_TITLES } from "../constants";

export default function Home() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  
  const [tours, setTours] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tourForm, setTourForm] = useState({ locations: [], startDate: '', endDate: '' });
  const [aadhaarModalOpen, setAadhaarModalOpen] = useState(false);
  const [aadhaarStep, setAadhaarStep] = useState(0); // 0: scan, 1: tour
  const [aadhaarData, setAadhaarData] = useState(null);
  const [checkingOngoingTour, setCheckingOngoingTour] = useState(false);
  const isLoadingRef = useRef(false); // Track loading state to prevent concurrent calls

  // Load tours on component mount
  const loadTours = useCallback(async () => {
    console.log('[LoadTours] Starting loadTours function');
    
    // Prevent multiple simultaneous calls
    if (isLoadingRef.current) {
      console.log('[LoadTours] Already loading tours, skipping...');
      return;
    }
    
    try {
      isLoadingRef.current = true;
      setLoading(true);
      let userTours = [];
      
      console.log('[LoadTours] Loading tours for user:', user?.$id);
      
      // Try to load from Appwrite first
      try {
        console.log('[LoadTours] Calling getUserTours...');
        userTours = await getUserTours(user.$id);
        console.log('[LoadTours] getUserTours returned:', userTours);
        console.log('[LoadTours] Raw tours count:', userTours?.length);
        
        if (Array.isArray(userTours) && userTours.length > 0) {
          console.log('[LoadTours] First tour sample:', userTours[0]);
          console.log('[LoadTours] All tour IDs:', userTours.map(t => t.$id));
          console.log('[LoadTours] First tour locations:', userTours[0].locations);
          console.log('[LoadTours] First tour dates:', { start: userTours[0].startDate, end: userTours[0].endDate });
        }
        
        // Save tours to IndexedDB for offline access (Skip for now to test)
        console.log('[LoadTours] Skipping IndexedDB save for testing...');
        console.log('[LoadTours] IndexedDB save skipped - continuing to processing');
      } catch (onlineError) {
        console.log('[LoadTours] Failed to load tours online, trying offline storage:', onlineError);
        
        // Fallback to IndexedDB for offline access
        const offlineTours = await getToursFromIndexedDB();
        userTours = offlineTours.filter(tour => tour.userId === user.$id);
        console.log('[LoadTours] Loaded tours from offline storage:', userTours);
        
        // If IndexedDB is empty, check localStorage for ongoing tour
        if (userTours.length === 0) {
          const ongoingTour = getOngoingTourFromStorage();
          if (ongoingTour) {
            userTours = [ongoingTour];
            console.log('[LoadTours] Loaded ongoing tour from localStorage:', userTours);
          }
        }
      }
      
      console.log('[LoadTours] Processing tours, count:', userTours.length);
      
      // Add a checkpoint here
      console.log('[LoadTours] About to start processing tours...');
      
      // Check and update tour statuses based on current date
      const updatedTours = userTours.map((tour, index) => {
        try {
          console.log(`🔄 Processing tour ${index + 1}/${userTours.length}:`, tour);
          console.log('📍 Tour locations count:', tour.locations?.length);
          console.log('� Tour dates:', { start: tour.startDate, end: tour.endDate });
          console.log('🏷️ Tour status:', tour.status);
          
          // Basic validation - ensure tour has required properties
          if (!tour.$id) {
            console.error('Tour missing $id:', tour);
            return null;
          }
          
          // Ensure locations is an array
          if (!Array.isArray(tour.locations)) {
            console.warn('Tour locations is not an array, converting:', tour.locations);
            tour.locations = [];
          }
          
          // Do basic date-based status check without database calls for faster loading
          const currentDate = new Date();
          const endDate = new Date(tour.endDate);
          
          let updatedStatus = tour.status;
          if (tour.status === 'ongoing' && endDate < currentDate) {
            updatedStatus = 'completed';
            console.log('[LoadTours] Updating tour status from ongoing to completed');
            
            // Update in background without blocking UI
            checkAndUpdateTourStatus(tour).catch(error => {
              console.warn('[LoadTours] Background status update failed:', error);
            });
          }
          
          const processedTour = { ...tour, status: updatedStatus };
          console.log('[LoadTours] Successfully processed tour:', processedTour.$id);
          return processedTour;
        } catch (error) {
          console.error('[LoadTours] Error processing individual tour:', tour, error);
          return tour; // Return original tour if processing fails
        }
      }).filter(tour => tour !== null); // Remove any null tours from validation errors
      
      console.log('[LoadTours] Tours after processing:', updatedTours);
      
      // Sort tours: ongoing first, then by creation date (newest first)
      const sortedTours = updatedTours.sort((a, b) => {
        // Ongoing tours at the top
        if (a.status === 'ongoing' && b.status !== 'ongoing') return -1;
        if (b.status === 'ongoing' && a.status !== 'ongoing') return 1;
        
        // Within same status, sort by creation date (newest first)
        return new Date(b.createdAt || b.$createdAt) - new Date(a.createdAt || a.$createdAt);
      });
      
      console.log('[LoadTours] Final tours after status update and sorting:', sortedTours);
      setTours(sortedTours);
      console.log('[LoadTours] Tours state set successfully, count:', sortedTours.length);
    } catch (error) {
      console.error('[LoadTours] Error loading tours:', error);
    } finally {
      isLoadingRef.current = false;
      setLoading(false);
      console.log('[LoadTours] loadTours completed, loading set to false');
    }
  }, [user?.$id]); // Only depend on user ID

  useEffect(() => {
    if (user?.$id) {
      console.log('[Home] User found, loading tours for:', user.$id);
      loadTours();
    } else {
      console.log('[Home] No user found, cannot load tours');
    }
  }, [user?.$id, loadTours]); // Only depend on user ID, not the entire user object

  useEffect(() => {
    console.log('[Home] Tours state updated:', {
      toursCount: tours.length,
      loading,
      tours: tours.map(t => ({ id: t.$id, status: t.status, locations: t.locations?.length }))
    });
  }, [tours, loading]);

  const handleAddTour = async () => {
    try {
      setCheckingOngoingTour(true);
      
      // Check if user already has an ongoing tour
      const hasOngoingTour = await checkOngoingTours(user.$id);
      
      if (hasOngoingTour) {
        alert('You already have an ongoing tour. Please complete or cancel it before creating a new one.');
        return;
      }
      
      // If no ongoing tour, proceed with adding new tour
      setAadhaarStep(0);
      setAadhaarModalOpen(true);
    } catch (error) {
      console.error('Error checking ongoing tours:', error);
      alert('Failed to check tour status. Please try again.');
    } finally {
      setCheckingOngoingTour(false);
    }
  };

  const handleAadhaarVerified = (data) => {
    setAadhaarData(data);
    setAadhaarStep(1);
  };

  const handleTourFormChange = (e) => {
    const { name, value } = e.target;
    setTourForm(prev => ({ ...prev, [name]: value }));
  };

  const handleTourSubmit = async (e) => {
    e.preventDefault();
    console.log('🔥 handleTourSubmit called - starting tour creation process');
    
    let newTour = null;
    
    try {
      console.log('🚀 Starting tour creation...');
      newTour = await createTour(tourForm, user, aadhaarData);
      console.log('✅ Tour created successfully:', newTour);
      
      // Save to IndexedDB for offline support
      try {
        await saveTourToIndexedDB(newTour);
        console.log('✅ Tour saved to IndexedDB');
      } catch (indexedDbError) {
        console.warn('⚠️ IndexedDB save failed:', indexedDbError);
        // Don't fail the entire flow for IndexedDB issues
      }
      
      // Update local state with proper sorting
      setTours(prev => {
        const updatedTours = [...prev, newTour];
        
        // Sort tours: ongoing first, then by creation date (newest first)
        return updatedTours.sort((a, b) => {
          // Ongoing tours at the top
          if (a.status === 'ongoing' && b.status !== 'ongoing') return -1;
          if (b.status === 'ongoing' && a.status !== 'ongoing') return 1;
          
          // Within same status, sort by creation date (newest first)
          return new Date(b.createdAt || b.$createdAt) - new Date(a.createdAt || a.$createdAt);
        });
      });
      
      console.log('✅ Tour creation completed successfully, closing modal immediately...');
      
      // Close modal immediately on success
      setAadhaarModalOpen(false);
      setAadhaarStep(0);
      setAadhaarData(null);
      setTourForm({ locations: [], startDate: '', endDate: '' });
      
      // Scroll to show updated tour list
      setTimeout(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        console.log('🎉 Tour created successfully! Showing updated tour list.');
      }, 200);
      
      return; // Exit successful flow
      
    } catch (error) {
      console.error('❌ Error creating tour:', error);
      
      // If we have a newTour object (database succeeded but something else failed)
      // still consider it a success and close the form
      if (newTour && newTour.$id) {
        console.log('ℹ️ Tour was created in database despite error, proceeding with success flow');
        
        // Update local state anyway
        setTours(prev => {
          const updatedTours = [...prev, newTour];
          return updatedTours.sort((a, b) => {
            if (a.status === 'ongoing' && b.status !== 'ongoing') return -1;
            if (b.status === 'ongoing' && a.status !== 'ongoing') return 1;
            return new Date(b.createdAt || b.$createdAt) - new Date(a.createdAt || a.$createdAt);
          });
        });
        
        // Close modal since tour was created successfully
        setAadhaarModalOpen(false);
        setAadhaarStep(0);
        setAadhaarData(null);
        setTourForm({ locations: [], startDate: '', endDate: '' });
        
        setTimeout(() => {
          window.scrollTo({ top: 0, behavior: 'smooth' });
          console.log('🎉 Tour created successfully despite error! Showing updated tour list.');
        }, 200);
        
        return;
      } else {
        // Real error - show alert and keep modal open
        alert('Failed to create tour. Please try again.');
        console.log('❌ Tour creation failed, keeping modal open');
        return;
      }
    }
  };

  const handleStartTour = async (tour) => {
    try {
      // Use the proper startTour function which activates Tourist ID
      await startTour(tour.$id);
      
      // Update session storage to track ongoing tour AND save full tour data
      const updatedTour = { ...tour, status: 'ongoing' };
      saveOngoingTourToStorage(updatedTour);
      
      // Update local state with proper sorting
      setTours(prev => {
        const updatedTours = prev.map(t => 
          t.$id === tour.$id ? { ...t, status: 'ongoing' } : t
        );
        
        // Sort tours: ongoing first, then by creation date (newest first)
        return updatedTours.sort((a, b) => {
          // Ongoing tours at the top
          if (a.status === 'ongoing' && b.status !== 'ongoing') return -1;
          if (b.status === 'ongoing' && a.status !== 'ongoing') return 1;
          
          // Within same status, sort by creation date (newest first)
          return new Date(b.createdAt || b.$createdAt) - new Date(a.createdAt || a.$createdAt);
        });
      });
      
      navigate('/tour-view', { state: { tour: { ...tour, status: 'ongoing' } } });
    } catch (error) {
      console.error('Error starting tour:', error);
      alert('Failed to start tour. Please try again.');
    }
  };

  const handleCancelTour = async (tour) => {
    try {
      // Cancel the tour
      await cancelTour(tour.$id);
      
      // Clear ongoing tour from localStorage if this was the ongoing tour
      const userSession = localStorage.getItem('userSession');
      if (userSession) {
        const sessionData = JSON.parse(userSession);
        if (sessionData.ongoingTourId === tour.$id) {
          sessionData.ongoingTourId = null;
          sessionData.tourStatus = null;
          sessionData.ongoingTourData = null;
          localStorage.setItem('userSession', JSON.stringify(sessionData));
        }
      }
      
      // Update local state with proper sorting
      setTours(prev => {
        const updatedTours = prev.map(t => 
          t.$id === tour.$id ? { ...t, status: 'cancelled' } : t
        );
        
        // Sort tours: ongoing first, then by creation date (newest first)
        return updatedTours.sort((a, b) => {
          // Ongoing tours at the top
          if (a.status === 'ongoing' && b.status !== 'ongoing') return -1;
          if (b.status === 'ongoing' && a.status !== 'ongoing') return 1;
          
          // Within same status, sort by creation date (newest first)
          return new Date(b.createdAt || b.$createdAt) - new Date(a.createdAt || a.$createdAt);
        });
      });
      
      alert('Tour cancelled successfully.');
    } catch (error) {
      console.error('Error cancelling tour:', error);
      alert('Failed to cancel tour. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <Header user={user} onLogout={logout} />
      
      <main className="w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="bg-white shadow-md rounded-2xl p-6 md:p-8 mb-8">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-2">
                Welcome back,{" "}
                <span className="text-purple-600">{user?.name || "Traveler"}</span>
              </h1>
              <p className="text-gray-600 text-lg">
                Your journey, secured and simplified.
              </p>
            </div>
            <button
              onClick={handleAddTour}
              disabled={checkingOngoingTour}
              className="mt-6 md:mt-0 bg-purple-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-purple-700 transition-colors duration-300 flex items-center justify-center"
            >
              <FaPlus className="mr-2" />
              {checkingOngoingTour ? "Checking..." : "Create New Tour"}
            </button>
          </div>
        </div>

        {/* Tours Section */}
        <div className="space-y-6">
          {loading ? (
            <div className="text-center py-16">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading your tours...</p>
            </div>
          ) : error ? (
            <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-md">
              <p className="font-bold">Error</p>
              <p>{error}</p>
            </div>
          ) : tours.length === 0 ? (
            <div className="text-center py-16">
              <h3 className="text-2xl font-bold text-gray-800 mb-2">
                No tours yet
              </h3>
              <p className="text-gray-600 mb-6">
                Create your first tour to get started.
              </p>
              <button
                onClick={handleAddTour}
                className="bg-purple-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-purple-700 transition-colors duration-300 flex items-center justify-center mx-auto"
              >
                <FaPlus className="mr-2" />
                Create Your First Tour
              </button>
            </div>
          ) : (
            tours.map((tour) => (
              <TourCard
                key={tour.$id}
                tour={tour}
                onStartTour={handleStartTour}
                onCancelTour={handleCancelTour}
              />
            ))
          )}
        </div>

        {/* Modal */}
        <Modal open={aadhaarModalOpen} onClose={() => setAadhaarModalOpen(false)}>
          <div className="w-full max-w-2xl mx-auto">
            {aadhaarStep === 0 ? (
              <div className="text-center">
                <h2 className="text-xl font-semibold mb-4 text-gray-900">{MODAL_TITLES.AADHAAR_VERIFICATION}</h2>
                <p className="mb-6 text-gray-600">
                  Please scan your Aadhaar QR to verify your identity before adding a tour.
                </p>
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <AadhaarVerificationModal onVerified={handleAadhaarVerified} dbUser={user} />
                </div>
              </div>
            ) : (
              <div>
                <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center text-white text-sm">✓</div>
                    <div>
                      <p className="text-green-800 font-medium">Aadhaar Verified</p>
                      <p className="text-green-700 text-sm">Identity: <b>{aadhaarData?.name}</b></p>
                    </div>
                  </div>
                </div>
                <TourForm
                  tourForm={tourForm}
                  onChange={handleTourFormChange}
                  onSubmit={handleTourSubmit}
                  onCancel={() => setAadhaarModalOpen(false)}
                />
              </div>
            )}
          </div>
        </Modal>
      </main>
    </div>
  );
}
