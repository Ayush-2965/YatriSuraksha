import React, { useState } from 'react'
import { useSocket } from '../context/SocketContext'
import { format, formatDistanceToNow } from 'date-fns'
import TourMap from './TourMap'

export default function EmergencyAlerts() {
  const { emergencyAlerts, markAlertAsResolved } = useSocket()
  const [selectedAlert, setSelectedAlert] = useState(null)
  const [filter, setFilter] = useState('all') // all, active, resolved

  const filteredAlerts = emergencyAlerts.filter(alert => {
    if (filter === 'active') return alert.status === 'active'
    if (filter === 'resolved') return alert.status === 'resolved'
    return true
  })

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'bg-red-500 text-white'
      case 'medium': return 'bg-yellow-500 text-white'
      case 'low': return 'bg-blue-500 text-white'
      default: return 'bg-gray-500 text-white'
    }
  }

  const getPriorityIcon = (priority) => {
    switch (priority) {
      case 'high': 
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        )
      case 'medium': 
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )
      case 'low': 
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )
      default: 
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
          </svg>
        )
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'active': 
        return (
          <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
        )
      case 'resolved': 
        return (
          <div className="w-3 h-3 bg-green-500 rounded-full"></div>
        )
      default: 
        return (
          <div className="w-3 h-3 bg-slate-400 rounded-full"></div>
        )
    }
  }

  const handleResolveAlert = (alertId) => {
    markAlertAsResolved(alertId)
    if (selectedAlert && selectedAlert.id === alertId) {
      setSelectedAlert({ ...selectedAlert, status: 'resolved' })
    }
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-slate-900">Emergency Alerts</h1>
        <div className="flex items-center space-x-6">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
            <span className="text-sm font-medium text-slate-600">
              {emergencyAlerts.filter(a => a.status === 'active').length} active alerts
            </span>
          </div>
          <div className="text-sm text-slate-500">
            {filteredAlerts.length} total shown
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
          All Alerts ({emergencyAlerts.length})
        </button>
        <button
          onClick={() => setFilter('active')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            filter === 'active' 
              ? 'bg-red-600 text-white shadow-sm' 
              : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          Active ({emergencyAlerts.filter(a => a.status === 'active').length})
        </button>
        <button
          onClick={() => setFilter('resolved')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            filter === 'resolved' 
              ? 'bg-green-600 text-white shadow-sm' 
              : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          Resolved ({emergencyAlerts.filter(a => a.status === 'resolved').length})
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Alerts List */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h2 className="text-xl font-bold text-slate-900 mb-6">Alert List</h2>
          {filteredAlerts.length === 0 ? (
            <div className="text-center py-12">
              <svg className="w-12 h-12 text-slate-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <p className="text-slate-500 font-medium">No emergency alerts found</p>
              <p className="text-sm text-slate-400 mt-1">
                {filter === 'all' ? 'No emergency alerts have been received' : `No ${filter} alerts`}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredAlerts.map((alert) => (
                <div 
                  key={alert.id}
                  className={`p-5 rounded-xl border-2 cursor-pointer transition-all hover:shadow-md ${
                    selectedAlert?.id === alert.id
                      ? 'border-red-300 bg-red-50 shadow-sm'
                      : alert.status === 'active'
                      ? 'border-red-200 bg-red-25 hover:border-red-250'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                  onClick={() => setSelectedAlert(alert)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4">
                      <div className="flex flex-col items-center space-y-2">
                        {getStatusIcon(alert.status)}
                        <span className={`flex items-center space-x-1 text-xs px-3 py-1 rounded-full font-medium ${getPriorityColor(alert.priority)}`}>
                          {getPriorityIcon(alert.priority)}
                          <span>{alert.priority.toUpperCase()}</span>
                        </span>
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-slate-900">{alert.userName}</h3>
                        <p className="text-sm text-slate-600 mb-3">{alert.message}</p>
                        <div className="text-xs text-slate-500 space-y-1">
                          <p>User ID: <span className="font-mono">{alert.userId}</span></p>
                          {alert.touristId && (
                            <p className="inline-block font-mono text-blue-700 bg-blue-50 px-2 py-1 rounded">
                              Tourist ID: {alert.touristId}
                            </p>
                          )}
                          <p className="text-slate-400">{formatDistanceToNow(new Date(alert.timestamp), { addSuffix: true })}</p>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-slate-900">
                        {format(new Date(alert.timestamp), 'HH:mm')}
                      </p>
                      <p className="text-xs text-slate-500">
                        {format(new Date(alert.timestamp), 'dd/MM/yyyy')}
                      </p>
                    </div>
                  </div>
                  
                  {alert.location && (
                    <div className="mt-4 pt-4 border-t border-slate-200">
                      <p className="text-xs text-slate-500 mb-1">Emergency Location:</p>
                      <div className="flex items-center space-x-2">
                        <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <span className="text-sm font-mono text-slate-700">
                          {alert.location.lat.toFixed(6)}, {alert.location.lng.toFixed(6)}
                        </span>
                      </div>
                    </div>
                  )}
                  
                  {alert.status === 'active' && (
                    <div className="mt-4 pt-4 border-t border-slate-200">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleResolveAlert(alert.id)
                        }}
                        className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center space-x-2"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span>Mark as Resolved</span>
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Alert Details & Map */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h2 className="text-xl font-bold text-slate-900 mb-6">
            Alert Details & Location
            {selectedAlert && (
              <span className="text-base font-normal text-slate-600 ml-2">
                - {selectedAlert.userName}
              </span>
            )}
          </h2>
          
          {selectedAlert ? (
            <div className="space-y-6">
              {/* Alert Details */}
              <div className="bg-slate-50 rounded-xl p-5">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-slate-500 mb-1">Status:</p>
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(selectedAlert.status)}
                      <span className="font-semibold text-slate-900">{selectedAlert.status.toUpperCase()}</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-slate-500 mb-1">Priority:</p>
                    <div className="flex items-center space-x-2">
                      {getPriorityIcon(selectedAlert.priority)}
                      <span className="font-semibold text-slate-900">{selectedAlert.priority.toUpperCase()}</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-slate-500 mb-1">User:</p>
                    <p className="font-semibold text-slate-900">{selectedAlert.userName}</p>
                  </div>
                  {selectedAlert.touristId && (
                    <div>
                      <p className="text-slate-500 mb-1">Tourist ID:</p>
                      <p className="font-semibold font-mono bg-blue-50 text-blue-800 px-3 py-1 rounded-lg">
                        {selectedAlert.touristId}
                      </p>
                    </div>
                  )}
                  <div className="col-span-2">
                    <p className="text-slate-500 mb-1">Time:</p>
                    <p className="font-semibold text-slate-900">
                      {format(new Date(selectedAlert.timestamp), 'dd/MM/yyyy HH:mm:ss')}
                    </p>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-slate-200">
                  <p className="text-slate-500 mb-2">Message:</p>
                  <p className="font-medium text-slate-900 bg-white p-3 rounded-lg border border-slate-200">{selectedAlert.message}</p>
                </div>
              </div>
              
              {/* Map */}
              {selectedAlert.location ? (
                <TourMap 
                  tour={{
                    userId: selectedAlert.userId,
                    userName: selectedAlert.userName,
                    currentLocation: selectedAlert.location,
                    status: 'emergency'
                  }}
                  isEmergencyView={true}
                />
              ) : (
                <div className="h-64 bg-slate-50 rounded-xl flex items-center justify-center border border-slate-200">
                  <div className="text-center">
                    <svg className="w-12 h-12 text-slate-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <p className="text-slate-500 font-medium">No location data available</p>
                    <p className="text-slate-400 text-sm">Location data not provided for this alert</p>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="h-96 bg-slate-50 rounded-xl flex items-center justify-center border border-slate-200">
              <div className="text-center">
                <svg className="w-16 h-16 text-slate-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                <p className="text-lg font-medium text-slate-500 mb-2">Select an alert to view details</p>
                <p className="text-sm text-slate-400">Click on any emergency alert to see location and details</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}