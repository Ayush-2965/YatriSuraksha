import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Dashboard from './components/Dashboard'
import LiveTours from './components/LiveTours'
import EmergencyAlerts from './components/EmergencyAlerts'
import TourDetails from './components/TourDetails'
import PoliceDashboard from './pages/PoliceDashboard'
import Navbar from './components/Navbar'
import { SocketProvider } from './context/SocketContext'

function App() {
  return (
    <SocketProvider>
      <Router>
        <div className="min-h-screen bg-gray-50">
          <Navbar />
          <main className="container mx-auto px-4 py-8">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/live-tours" element={<LiveTours />} />
              <Route path="/emergency-alerts" element={<EmergencyAlerts />} />
              <Route path="/tour/:tourId" element={<TourDetails />} />
              <Route path="/verify-tourist" element={<PoliceDashboard />} />
            </Routes>
          </main>
        </div>
      </Router>
    </SocketProvider>
  )
}

export default App