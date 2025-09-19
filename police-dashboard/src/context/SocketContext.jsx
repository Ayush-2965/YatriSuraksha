import React, { createContext, useContext, useEffect, useState } from 'react'
import { io } from 'socket.io-client'
import appwriteService from '../lib/appwrite'

const SocketContext = createContext()

export const useSocket = () => {
  const context = useContext(SocketContext)
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider')
  }
  return context
}

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null)
  const [connected, setConnected] = useState(false)
  const [liveTours, setLiveTours] = useState([])
  const [emergencyAlerts, setEmergencyAlerts] = useState([])
  const [appwriteTours, setAppwriteTours] = useState([])
  const [loading, setLoading] = useState(true)

  // Fetch tours from Appwrite on component mount
  useEffect(() => {
    const fetchToursFromAppwrite = async () => {
      try {
        setLoading(true)
        const tours = await appwriteService.getActiveTours()
        setAppwriteTours(tours)
        console.log('Fetched active tours from Appwrite:', tours)
      } catch (error) {
        console.error('Failed to fetch tours from Appwrite:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchToursFromAppwrite()
    
    // Refresh tours every 30 seconds
    const interval = setInterval(fetchToursFromAppwrite, 30000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    // Connect to backend socket
    const newSocket = io(import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001', {
      transports: ['websocket'],
      upgrade: false
    })

    newSocket.on('connect', () => {
      console.log('Connected to police dashboard socket')
      setConnected(true)
      
      // Join the police dashboard room to receive broadcasts
      newSocket.emit('join-police-dashboard', { 
        type: 'police-dashboard',
        timestamp: new Date().toISOString()
      })
      console.log('👮 Joined police dashboard room')
    })

    newSocket.on('disconnect', () => {
      console.log('Disconnected from police dashboard socket')
      setConnected(false)
    })

    // Listen for location updates
    newSocket.on('location-update', (data) => {
      console.log('📍 Location update received:', data)
      
      // Transform location data to match expected format
      const currentLocation = data.location ? {
        lat: data.location.latitude,
        lng: data.location.longitude
      } : null
      
      console.log('📍 Transformed location:', currentLocation)
      
      // Update live tours with real-time location data
      setLiveTours(prev => {
        console.log('📍 Previous liveTours:', prev.length, 'tours')
        
        const updated = prev.map(tour => 
          tour.userId === data.userId 
            ? { 
                ...tour, 
                currentLocation, 
                lastUpdate: data.timestamp,
                status: 'active' // Ensure active status for location updates
              }
            : tour
        )
        
        // If tour not found in live tours, check if it exists in Appwrite tours
        if (!updated.find(tour => tour.userId === data.userId)) {
          // Find the tour in Appwrite data
          const appwriteTour = appwriteTours.find(tour => tour.userId === data.userId)
          if (appwriteTour) {
            const currentLocation = data.location.latitude !== undefined 
              ? { lat: data.location.latitude, lng: data.location.longitude }
              : data.location
              
            updated.push({
              ...appwriteTour,
              currentLocation,
              lastUpdate: data.timestamp,
              status: 'active'
            })
          } else {
            // Fallback: create basic tour entry
            const currentLocation = data.location.latitude !== undefined 
              ? { lat: data.location.latitude, lng: data.location.longitude }
              : data.location
            
            updated.push({
              id: data.tourId || `temp-${data.userId}`,
              userId: data.userId,
              userName: data.userName || `User ${data.userId}`,
              touristId: data.touristId, // Include Tourist ID if available
              currentLocation,
              lastUpdate: data.timestamp,
              status: 'active',
              isActive: true
            })
          }
        }
        
        console.log('📍 Updated liveTours:', updated.length, 'tours', 
          updated.map(t => ({ userId: t.userId, location: t.currentLocation })))
        
        return updated
      })
    })

    // Listen for emergency alerts
    newSocket.on('emergency-alert', (data) => {
      console.log('Emergency alert received:', data)
      
      const alertLocation = data.location.latitude !== undefined 
        ? { lat: data.location.latitude, lng: data.location.longitude }
        : data.location
      
      setEmergencyAlerts(prev => [{
        id: Date.now(),
        userId: data.userId,
        userName: data.userName || `User ${data.userId}`,
        touristId: data.touristId, // Include Tourist ID for verification
        location: alertLocation,
        timestamp: data.timestamp,
        message: data.message || 'Emergency assistance required',
        status: 'active',
        priority: 'high'
      }, ...prev])
      
      // Play alert sound
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('🚨 Emergency Alert', {
          body: `Emergency from ${data.userName || `User ${data.userId}`}`,
          icon: '/police-badge.svg'
        })
      }
    })

    // Listen for tour status updates
    newSocket.on('tour_status_update', (data) => {
      setLiveTours(prev => prev.map(tour => 
        tour.userId === data.userId 
          ? { ...tour, status: data.status }
          : tour
      ))
    })

    setSocket(newSocket)

    return () => {
      newSocket.close()
    }
  }, [appwriteTours]) // Add appwriteTours as dependency

  // Request notification permission
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission()
    }
  }, [])

  const markAlertAsResolved = (alertId) => {
    setEmergencyAlerts(prev => prev.map(alert => 
      alert.id === alertId 
        ? { ...alert, status: 'resolved' }
        : alert
    ))
  }

  // Merge Appwrite tours with live location data
  const mergedTours = React.useMemo(() => {
    const merged = [...appwriteTours]
    
    // Update with live location data
    liveTours.forEach(liveTour => {
      const index = merged.findIndex(tour => tour.userId === liveTour.userId)
      if (index >= 0) {
        // Update existing tour with live data
        merged[index] = {
          ...merged[index],
          currentLocation: liveTour.currentLocation,
          lastUpdate: liveTour.lastUpdate,
          status: liveTour.status || merged[index].status
        }
      } else {
        // Add live tour that's not in Appwrite (temporary tours)
        merged.push(liveTour)
      }
    })
    
    return merged
  }, [appwriteTours, liveTours])

  const value = {
    socket,
    connected,
    liveTours: mergedTours,
    emergencyAlerts,
    appwriteTours,
    loading,
    markAlertAsResolved,
    refreshTours: async () => {
      try {
        const tours = await appwriteService.getActiveTours()
        setAppwriteTours(tours)
      } catch (error) {
        console.error('Failed to refresh tours:', error)
      }
    }
  }

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  )
}