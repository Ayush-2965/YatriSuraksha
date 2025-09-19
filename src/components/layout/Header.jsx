import React from "react";
import { useNavigate } from "react-router-dom";
import { FaCog, FaBatteryThreeQuarters, FaNewspaper } from "react-icons/fa";
import logo from "../../assets/images/logo.png";

const Header = ({ user, onLogout }) => {
  const navigate = useNavigate();

  return (
    <nav className="bg-white shadow-md sticky top-0 z-10 w-full">
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center w-full">
          <div className="flex items-center gap-2">
            <img src={logo} alt="Yatri Suraksha Logo" className="h-20 w-auto" />
            <span className="text-2xl font-bold text-indigo-700">Yatri Suraksha</span>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-gray-700 font-medium">Welcome, {user?.name || 'User'}</span>
            
            {/* Local News */}
            <button
              onClick={() => navigate('/local-news')}
              className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded-md text-sm font-medium shadow flex items-center gap-2"
              title="Local News & Alerts"
            >
              <FaNewspaper className="text-sm" />
              <span className="hidden sm:inline">News</span>
            </button>
            
            {/* Battery Optimization Quick Access */}
            <button
              onClick={() => navigate('/battery-optimization')}
              className="bg-orange-500 hover:bg-orange-600 text-white px-3 py-2 rounded-md text-sm font-medium shadow flex items-center gap-2"
              title="Battery Optimization Settings"
            >
              <FaBatteryThreeQuarters className="text-sm" />
              <span className="hidden sm:inline">Battery</span>
            </button>
            
            {/* Settings */}
            <button
              onClick={() => navigate('/permissions-setup')}
              className="bg-gray-500 hover:bg-gray-600 text-white px-3 py-2 rounded-md text-sm font-medium shadow flex items-center gap-2"
              title="App Settings & Permissions"
            >
              <FaCog className="text-sm" />
              <span className="hidden sm:inline">Settings</span>
            </button>
            
            <button
              onClick={onLogout}
              className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-md text-sm font-medium shadow"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Header;