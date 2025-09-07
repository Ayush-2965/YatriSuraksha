
import { useAuth } from '../context/useAuth';
import LocationTracker from '../components/LocationTracker';
import { useState } from 'react';

export default function Home() {
  const { user, logout } = useAuth();
  const [showMap, setShowMap] = useState(false);

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="text-xl font-semibold">Yatri Suraksha</div>
            <div className="flex items-center space-x-4">
              <span>Welcome, {user?.name || 'User'}</span>
              <button
                onClick={logout}
                className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-md text-sm font-medium"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-2xl font-bold">Welcome to Yatri Suraksha</h1>
              <button
                onClick={() => setShowMap(!showMap)}
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium"
              >
                {showMap ? 'Hide Map' : 'Show Map'}
              </button>
            </div>
            
            <div className="space-y-6">
              <p className="text-gray-600">Your safety companion for travel.</p>
              
              {showMap && (
                <div className="h-96 bg-gray-100 rounded-lg">
                  {/* Add a map component here later */}
                  <div className="w-full h-full flex items-center justify-center">
                    <p className="text-gray-500">Map will be integrated here</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Location Tracker Component */}
      <LocationTracker />
    </div>
  );
}
