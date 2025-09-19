import React, { useState } from 'react'
import { useSocket } from '../context/SocketContext'
import { format } from 'date-fns'
import TourMap from './TourMap'

export default function LiveTours() {
  const { liveTours, connected, loading, refreshTours } = useSocket()
  const [selectedTour, setSelectedTour] = useState(null)
  const [filter, setFilter] = useState('all') // all, active, inactive

  const filteredTours = liveTours.filter(tour => {
    if (filter === 'active') return tour.status === 'ongoing' || tour.status === 'active'
    if (filter === 'inactive') return tour.status !== 'ongoing' && tour.status !== 'active'
    return true
  })

  const getStatusColor = (status) => {
    switch (status) {
      case 'ongoing':
      case 'active': return 'text-green-600 bg-green-100'
      case 'completed': return 'text-blue-600 bg-blue-100'
      case 'cancelled': return 'text-red-600 bg-red-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'ongoing':
      case 'active': 
        return (
          <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
        )
      case 'completed': 
        return (
          <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
        )
      case 'cancelled': 
        return (
          <div className="w-3 h-3 bg-red-500 rounded-full"></div>
        )
      default: 
        return (
          <div className="w-3 h-3 bg-slate-400 rounded-full"></div>
        )
    }
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-slate-900">Live Tours Monitoring</h1>
        <div className="flex items-center space-x-6">
          <div className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full ${connected ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span className="text-sm font-medium text-slate-600">
              {connected ? 'Real-time Connected' : 'Disconnected'}
            </span>
          </div>
          <div className="text-sm text-slate-500">
            {filteredTours.length} {filter} tours
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex space-x-2">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            filter === 'all' 
              ? 'bg-blue-600 text-white shadow-sm' 
              : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          All Tours ({liveTours.length})
        </button>
        <button
          onClick={() => setFilter('active')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            filter === 'active' 
              ? 'bg-green-600 text-white shadow-sm' 
              : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          Active ({liveTours.filter(t => t.status === 'ongoing' || t.status === 'active').length})
        </button>
        <button
          onClick={() => setFilter('inactive')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            filter === 'inactive' 
              ? 'bg-slate-600 text-white shadow-sm' 
              : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          Inactive ({liveTours.filter(t => t.status !== 'ongoing' && t.status !== 'active').length})
        </button>
        <button
          onClick={refreshTours}
          className="px-4 py-2 rounded-lg text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 transition-colors flex items-center space-x-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          <span>Refresh</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tours List */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h2 className="text-xl font-bold text-slate-900 mb-6">Tour List</h2>
          {filteredTours.length === 0 ? (
            <div className="text-center py-12">
              <svg className="w-12 h-12 text-slate-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
              </svg>
              <p className="text-slate-500 font-medium">No tours found</p>
              <p className="text-sm text-slate-400 mt-1">
                {filter === 'all' ? 'No tours are currently being tracked' : `No ${filter} tours`}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredTours.map((tour) => (
                <div 
                  key={tour.id || tour.userId}
                  className={`p-5 rounded-xl border-2 cursor-pointer transition-all hover:shadow-md ${
                    selectedTour?.userId === tour.userId
                      ? 'border-blue-300 bg-blue-50 shadow-sm'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                  onClick={() => setSelectedTour(tour)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      {getStatusIcon(tour.status)}
                      <div>
                        <h3 className="font-semibold text-slate-900">{tour.userName}</h3>
                        <p className="text-sm text-slate-600">User ID: <span className="font-mono">{tour.userId}</span></p>
                        {tour.touristId && (
                          <p className="text-xs text-blue-700 font-mono bg-blue-50 px-2 py-1 rounded mt-1 inline-block">
                            Tourist ID: {tour.touristId}
                          </p>
                        )}
                        {tour.id && tour.id !== tour.userId && (
                          <p className="text-xs text-slate-500">Tour ID: <span className="font-mono">{tour.id}</span></p>
                        )}
                      </div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(tour.status)}`}>
                      {tour.status}
                    </span>
                  </div>
                  
                  <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-slate-500 mb-1">Last Update:</p>
                      <p className="font-medium text-slate-900">
                        {tour.lastUpdate ? format(new Date(tour.lastUpdate), 'dd/MM HH:mm') : 'Never'}
                      </p>
                    </div>
                    {tour.startDate && (
                      <div>
                        <p className="text-slate-500 mb-1">Started:</p>
                        <p className="font-medium text-slate-900">
                          {format(new Date(tour.startDate), 'dd/MM HH:mm')}
                        </p>
                      </div>
                    )}
                    {tour.currentLocation && (
                      <div className="col-span-2">
                        <p className="text-slate-500 mb-1">Current Location:</p>
                        <div className="flex items-center space-x-2">
                          <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          <span className="font-mono text-slate-700">
                            {tour.currentLocation.lat.toFixed(4)}, {tour.currentLocation.lng.toFixed(4)}
                          </span>
                        </div>
                      </div>
                    )}
                    {tour.locationsCount > 0 && (
                      <div>
                        <p className="text-slate-500 mb-1">Planned Locations:</p>
                        <p className="font-medium text-slate-900">{tour.locationsCount}</p>
                      </div>
                    )}
                  </div>
                  
                  {(tour.status === 'ongoing' || tour.status === 'active') && tour.lastUpdate && (
                    <div className="mt-4 pt-4 border-t border-slate-200">
                      <div className={`text-xs px-3 py-1 rounded-full font-medium text-center ${
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
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Map View */}
        <div className="dashboard-card">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Live Location Map
            {selectedTour && (
              <span className="text-base font-normal text-gray-600 ml-2">
                - {selectedTour.userName}
              </span>
            )}
          </h2>
          
          {selectedTour ? (
            <TourMap 
              tour={selectedTour}
              allTours={filteredTours}
            />
          ) : (
            <div className="h-96 bg-gray-100 rounded-lg flex items-center justify-center">
              <div className="text-center text-gray-500">
                <p className="text-lg">📍 Select a tour to view on map</p>
                <p className="text-sm mt-1">Click on any tour from the list to see their location</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}