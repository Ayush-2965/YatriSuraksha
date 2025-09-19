import React from 'react'
import { useParams } from 'react-router-dom'
import { useSocket } from '../context/SocketContext'
import { format } from 'date-fns'
import TourMap from './TourMap'

export default function TourDetails() {
  const { tourId } = useParams()
  const { liveTours, emergencyAlerts } = useSocket()
  
  const tour = liveTours.find(t => t.userId === tourId)
  const tourEmergencies = emergencyAlerts.filter(a => a.userId === tourId)

  if (!tour) {
    return (
      <div className="text-center py-12">
        <div className="max-w-md mx-auto">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Tour Not Found</h1>
          <p className="text-slate-600 mb-6">The requested tour could not be found.</p>
          <a 
            href="/live-tours" 
            className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span>Back to Live Tours</span>
          </a>
        </div>
      </div>
    )
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'text-emerald-700 bg-emerald-100 border-emerald-200'
      case 'completed': return 'text-blue-700 bg-blue-100 border-blue-200'
      case 'cancelled': return 'text-red-700 bg-red-100 border-red-200'
      default: return 'text-slate-700 bg-slate-100 border-slate-200'
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">{tour.userName}</h1>
            <p className="text-slate-600 mt-1">Tour Details - User ID: <span className="font-mono">{tour.userId}</span></p>
          </div>
          <span className={`px-4 py-2 rounded-full text-sm font-semibold border ${getStatusColor(tour.status)}`}>
            {tour.status.toUpperCase()}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Tour Information */}
        <div className="lg:col-span-1 space-y-6">
          {/* Basic Info */}
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h2 className="text-xl font-bold text-slate-900 mb-6">Tour Information</h2>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-slate-500 mb-1">User Name</p>
                <p className="font-semibold text-slate-900">{tour.userName}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500 mb-1">User ID</p>
                <p className="font-mono text-slate-900">{tour.userId}</p>
              </div>
              {tour.touristId && (
                <div>
                  <p className="text-sm text-slate-500 mb-1">Tourist ID</p>
                  <p className="font-mono bg-blue-50 text-blue-700 px-3 py-2 rounded-lg border border-blue-200">
                    {tour.touristId}
                  </p>
                </div>
              )}
              <div>
                <p className="text-sm text-slate-500 mb-1">Status</p>
                <span className={`px-3 py-2 rounded-full text-sm font-semibold border ${getStatusColor(tour.status)}`}>
                  {tour.status.toUpperCase()}
                </span>
              </div>
              <div>
                <p className="text-sm text-slate-500 mb-1">Last Update</p>
                <p className="font-semibold text-slate-900">
                  {tour.lastUpdate ? format(new Date(tour.lastUpdate), 'dd/MM/yyyy HH:mm:ss') : 'Never'}
                </p>
              </div>
              {tour.currentLocation && (
                <div>
                  <p className="text-sm text-slate-500 mb-1">Current Location</p>
                  <div className="flex items-center space-x-2">
                    <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <p className="font-mono text-sm text-slate-700">
                      {tour.currentLocation.lat.toFixed(6)}, {tour.currentLocation.lng.toFixed(6)}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Location Tracking Status */}
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h2 className="text-xl font-bold text-slate-900 mb-6">Tracking Status</h2>
            <div className="space-y-4">
              {tour.status === 'active' && tour.lastUpdate && (
                <div className={`p-4 rounded-xl border-2 ${
                  Date.now() - new Date(tour.lastUpdate).getTime() < 60000 
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
                    : Date.now() - new Date(tour.lastUpdate).getTime() < 300000
                    ? 'bg-amber-50 text-amber-800 border-amber-200'
                    : 'bg-red-50 text-red-800 border-red-200'
                }`}>
                  <div className="flex items-center space-x-3">
                    <div className={`w-3 h-3 rounded-full ${
                      Date.now() - new Date(tour.lastUpdate).getTime() < 60000 
                        ? 'bg-emerald-500 animate-pulse' 
                        : Date.now() - new Date(tour.lastUpdate).getTime() < 300000
                        ? 'bg-amber-500'
                        : 'bg-red-500'
                    }`}></div>
                    <div>
                      <p className="font-semibold">
                        {Date.now() - new Date(tour.lastUpdate).getTime() < 60000 
                          ? 'Live Tracking Active'
                          : Date.now() - new Date(tour.lastUpdate).getTime() < 300000
                          ? 'Recent Update Received'
                          : 'No Recent Updates'
                        }
                      </p>
                      <p className="text-sm opacity-75">
                        Last seen: {format(new Date(tour.lastUpdate), 'HH:mm:ss')}
                      </p>
                    </div>
                  </div>
                </div>
              )}
              
              {tour.status !== 'active' && (
                <div className="p-4 rounded-xl bg-slate-50 text-slate-700 border-2 border-slate-200">
                  <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 rounded-full bg-slate-400"></div>
                    <div>
                      <p className="font-semibold">Tracking Inactive</p>
                      <p className="text-sm opacity-75">Tour is not currently active</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Emergency History */}
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h2 className="text-xl font-bold text-slate-900 mb-6">Emergency History</h2>
            {tourEmergencies.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p className="text-slate-500 font-medium">No emergency alerts for this tour</p>
              </div>
            ) : (
              <div className="space-y-3">
                {tourEmergencies.map((alert) => (
                  <div key={alert.id} className={`p-4 rounded-xl border-2 ${
                    alert.status === 'active' 
                      ? 'bg-red-50 border-red-200 text-red-800' 
                      : 'bg-slate-50 border-slate-200 text-slate-700'
                  }`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <svg className={`w-5 h-5 ${alert.status === 'active' ? 'text-red-600' : 'text-slate-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                        </svg>
                        <div>
                          <p className="font-semibold">{alert.message}</p>
                          <p className="text-sm opacity-75">
                            {format(new Date(alert.timestamp), 'dd/MM HH:mm')}
                          </p>
                        </div>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        alert.status === 'active' ? 'bg-red-600 text-white' : 'bg-slate-600 text-white'
                      }`}>
                        {alert.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Map View */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h2 className="text-xl font-bold text-slate-900 mb-6">Live Location Map</h2>
            {tour.currentLocation ? (
              <TourMap 
                tour={tour}
                emergencyAlerts={tourEmergencies.filter(a => a.location)}
                showTrackingHistory={true}
              />
            ) : (
              <div className="h-96 bg-slate-50 rounded-xl flex items-center justify-center border-2 border-dashed border-slate-300">
                <div className="text-center text-slate-500">
                  <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <p className="text-lg font-medium text-slate-600">No location data available</p>
                  <p className="text-sm mt-1">Location tracking has not been initiated for this tour</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}