import React, { useState, useEffect } from 'react'
import { useSocket } from '../context/SocketContext'
import { format } from 'date-fns'
import appwriteService from '../lib/appwrite'

export default function Dashboard() {
  const { liveTours, emergencyAlerts, connected, loading } = useSocket()
  const [stats, setStats] = useState({
    activeTours: 0,
    activeEmergencies: 0,
    totalUsers: 0,
    averageResponseTime: '2.5 min'
  })
  const [appwriteStats, setAppwriteStats] = useState({
    total: 0,
    active: 0,
    completed: 0,
    cancelled: 0,
    todayTours: 0
  })

  // Fetch Appwrite statistics
  useEffect(() => {
    const fetchAppwriteStats = async () => {
      try {
        const statistics = await appwriteService.getTourStatistics()
        setAppwriteStats(statistics)
      } catch (error) {
        console.error('Failed to fetch Appwrite statistics:', error)
      }
    }

    fetchAppwriteStats()
    // Refresh stats every minute
    const interval = setInterval(fetchAppwriteStats, 60000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    setStats({
      activeTours: liveTours.filter(tour => tour.status === 'ongoing' || tour.status === 'active').length,
      activeEmergencies: emergencyAlerts.filter(alert => alert.status === 'active').length,
      totalUsers: liveTours.length,
      averageResponseTime: '2.5 min'
    })
  }, [liveTours, emergencyAlerts])

  const recentAlerts = emergencyAlerts.slice(0, 5)
  const activeTours = liveTours.filter(tour => 
    tour.status === 'ongoing' || tour.status === 'active'
  ).slice(0, 8)

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading tour data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-slate-900">Police Dashboard</h1>
        <div className="flex items-center space-x-3">
          <div className={`w-3 h-3 rounded-full ${connected ? 'bg-green-500' : 'bg-red-500'}`}></div>
          <span className="text-sm font-medium text-slate-600">
            {connected ? 'Connected' : 'Disconnected'}
          </span>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl border border-slate-200 p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                </svg>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-slate-600">Active Tours</p>
              <p className="text-3xl font-bold text-slate-900">{stats.activeTours}</p>
              <p className="text-xs text-slate-500">Live tracking</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-red-600 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-slate-600">Active Emergencies</p>
              <p className="text-3xl font-bold text-red-600">{stats.activeEmergencies}</p>
              <p className="text-xs text-slate-500">Pending response</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-slate-600">Total Tours</p>
              <p className="text-3xl font-bold text-slate-900">{appwriteStats.total}</p>
              <p className="text-xs text-slate-500">All time</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-slate-600">Today's Tours</p>
              <p className="text-3xl font-bold text-slate-900">{appwriteStats.todayTours}</p>
              <p className="text-xs text-slate-500">Started today</p>
            </div>
          </div>
        </div>
      </div>

      {/* Additional Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl border border-slate-200 p-6 text-center hover:shadow-lg transition-shadow">
          <p className="text-sm font-medium text-slate-600 mb-2">Completed Tours</p>
          <p className="text-4xl font-bold text-green-600">{appwriteStats.completed}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-6 text-center hover:shadow-lg transition-shadow">
          <p className="text-sm font-medium text-slate-600 mb-2">Cancelled Tours</p>
          <p className="text-4xl font-bold text-red-600">{appwriteStats.cancelled}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-6 text-center hover:shadow-lg transition-shadow">
          <p className="text-sm font-medium text-slate-600 mb-2">Avg Response Time</p>
          <p className="text-4xl font-bold text-blue-600">{stats.averageResponseTime}</p>
        </div>
      </div>

      {/* Recent Emergency Alerts */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-slate-900">Recent Emergency Alerts</h2>
          <a href="/emergency-alerts" className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center">
            View All
            <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </a>
        </div>
        {recentAlerts.length === 0 ? (
          <div className="text-center py-8">
            <svg className="w-12 h-12 text-slate-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-slate-500">No recent emergency alerts</p>
          </div>
        ) : (
          <div className="space-y-4">
            {recentAlerts.map((alert) => (
              <div key={alert.id} className={`p-4 rounded-lg border-l-4 ${
                alert.status === 'active' 
                  ? 'bg-red-50 border-red-400' 
                  : 'bg-slate-50 border-slate-300'
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`w-3 h-3 rounded-full ${
                      alert.status === 'active' ? 'bg-red-500' : 'bg-slate-400'
                    }`}></div>
                    <div>
                      <p className="font-semibold text-slate-900">{alert.userName}</p>
                      {alert.touristId && (
                        <p className="text-xs font-mono bg-blue-100 text-blue-800 px-2 py-1 rounded mt-1 inline-block">
                          Tourist ID: {alert.touristId}
                        </p>
                      )}
                      <p className="text-sm text-slate-600 mt-1">{alert.message}</p>
                    </div>
                  </div>
                  <span className="text-sm font-medium text-slate-500">
                    {format(new Date(alert.timestamp), 'HH:mm')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Active Tours Overview */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-slate-900">Active Tours</h2>
          <a href="/live-tours" className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center">
            View All
            <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </a>
        </div>
        {activeTours.length === 0 ? (
          <div className="text-center py-8">
            <svg className="w-12 h-12 text-slate-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
            </svg>
            <p className="text-slate-500">No active tours</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {activeTours.map((tour) => (
              <div key={tour.id || tour.userId} className="bg-slate-50 rounded-lg p-4 border border-slate-200 hover:border-blue-300 transition-colors">
                <div className="flex items-center justify-between mb-3">
                  <span className="font-semibold text-slate-900">{tour.userName}</span>
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                </div>
                <div className="text-sm text-slate-600 space-y-2">
                  <div className="flex justify-between">
                    <span>Status:</span>
                    <span className="font-medium capitalize">{tour.status}</span>
                  </div>
                  {tour.lastUpdate && (
                    <div className="flex justify-between">
                      <span>Last Update:</span>
                      <span className="font-medium">{format(new Date(tour.lastUpdate), 'HH:mm')}</span>
                    </div>
                  )}
                  {tour.startDate && (
                    <div className="flex justify-between">
                      <span>Started:</span>
                      <span className="font-medium">{format(new Date(tour.startDate), 'dd/MM HH:mm')}</span>
                    </div>
                  )}
                  {tour.locationsCount > 0 && (
                    <div className="flex justify-between">
                      <span>Locations:</span>
                      <span className="font-medium">{tour.locationsCount} planned</span>
                    </div>
                  )}
                  {tour.currentLocation && (
                    <div className="pt-2 border-t border-slate-200">
                      <p className="text-xs text-slate-500 mb-1">Current Location:</p>
                      <p className="text-xs font-mono bg-slate-100 px-2 py-1 rounded">
                        {tour.currentLocation.lat.toFixed(4)}, {tour.currentLocation.lng.toFixed(4)}
                      </p>
                    </div>
                  )}
                  {tour.currentLocation && tour.lastUpdate && (
                    <div className={`text-xs px-3 py-1 rounded-full text-center mt-2 ${
                      Date.now() - new Date(tour.lastUpdate).getTime() < 60000 
                        ? 'bg-green-100 text-green-700' 
                        : Date.now() - new Date(tour.lastUpdate).getTime() < 300000
                        ? 'bg-amber-100 text-amber-700'
                        : 'bg-red-100 text-red-700'
                    }`}>
                      {Date.now() - new Date(tour.lastUpdate).getTime() < 60000 
                        ? 'Live tracking'
                        : Date.now() - new Date(tour.lastUpdate).getTime() < 300000
                        ? 'Recent update'
                        : 'No recent updates'
                      }
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}