import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from '../pages/Login';
import Register from '../pages/Register';
import Home from '../pages/Home';
import ScanQR from '../pages/ScanQR';
import BatteryOptimizationPage from '../pages/BatteryOptimizationPage';
import PermissionsSetupGuide from '../pages/PermissionsSetupGuide';
import LocalNewsPage from '../pages/LocalNewsPage';
import { AuthProvider } from '../context/AuthContext';
import { LocationProvider } from '../context/LocationContext';
import MapPage from '../pages/Map';
import { useAuth } from '../context/useAuth';

import Landing from '../pages/Landing';
import TourView from '../pages/TourView';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <div>Loading...</div>;
  }
  
  if (!user) {
    return <Navigate to="/login" />;
  }
  
  return children;
};

const AppRouter = () => (
  <Router>
    <AuthProvider>
      <LocationProvider>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/scan" element={<ScanQR />} />
          <Route path="/battery-optimization" element={<BatteryOptimizationPage />} />
          <Route path="/permissions-setup" element={<PermissionsSetupGuide />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Home />
              </ProtectedRoute>
            }
          />
          <Route
            path="/map"
            element={
              <ProtectedRoute>
                <MapPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/tour-view"
            element={
              <ProtectedRoute>
                <TourView />
              </ProtectedRoute>
            }
          />
          <Route
            path="/local-news"
            element={
              <ProtectedRoute>
                <LocalNewsPage />
              </ProtectedRoute>
            }
          />
        </Routes>
      </LocationProvider>
    </AuthProvider>
  </Router>
);

export default AppRouter;