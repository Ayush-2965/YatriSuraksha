import React, { useState, useEffect } from 'react';
import { FaMapMarkerAlt, FaBatteryHalf, FaAndroid, FaExclamationTriangle } from 'react-icons/fa';
import nativeLocationService from '../services/nativeLocationService';

const PermissionManager = ({ onPermissionsGranted, onPermissionsDenied }) => {
  const [permissionStatus, setPermissionStatus] = useState({
    location: 'unknown',
    backgroundLocation: 'unknown',
    batteryOptimization: 'unknown'
  });
  const [showInstructions, setShowInstructions] = useState(false);
  const [deviceInfo, setDeviceInfo] = useState(null);
  const [isNative, setIsNative] = useState(false);

  useEffect(() => {
    checkInitialStatus();
  }, []);

  const checkInitialStatus = async () => {
    try {
      const native = nativeLocationService.isNativePlatform();
      setIsNative(native);
      
      if (native) {
        const info = await nativeLocationService.getDeviceInfo();
        setDeviceInfo(info);
        
        const hasLocationPermission = await nativeLocationService.checkPermissions();
        setPermissionStatus(prev => ({
          ...prev,
          location: hasLocationPermission ? 'granted' : 'denied'
        }));
      }
    } catch (error) {
      console.error('Error checking initial status:', error);
    }
  };

  const requestLocationPermission = async () => {
    try {
      await nativeLocationService.requestAllPermissions();
      setPermissionStatus(prev => ({ ...prev, location: 'granted' }));
      
      if (onPermissionsGranted) {
        onPermissionsGranted('location');
      }
    } catch (error) {
      console.error('Location permission denied:', error);
      setPermissionStatus(prev => ({ ...prev, location: 'denied' }));
      
      if (onPermissionsDenied) {
        onPermissionsDenied('location', error);
      }
    }
  };

  const showBatteryOptimizationInstructions = async () => {
    try {
      const instructions = await nativeLocationService.requestBatteryOptimizationExemption();
      setShowInstructions(true);
      return instructions;
    } catch (error) {
      console.error('Error showing battery instructions:', error);
    }
  };

  const PermissionCard = ({ icon, title, description, status, onAction, actionText }) => (
    <div className="bg-white rounded-lg shadow-md p-6 mb-4">
      <div className="flex items-start space-x-4">
        <div className={`p-3 rounded-full ${status === 'granted' ? 'bg-green-100' : 'bg-red-100'}`}>
          {icon}
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          <p className="text-gray-600 mt-1">{description}</p>
          <div className="mt-3 flex items-center space-x-3">
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
              status === 'granted' 
                ? 'bg-green-100 text-green-800' 
                : status === 'denied'
                ? 'bg-red-100 text-red-800'
                : 'bg-yellow-100 text-yellow-800'
            }`}>
              {status === 'granted' ? 'Granted' : status === 'denied' ? 'Denied' : 'Required'}
            </span>
            {status !== 'granted' && onAction && (
              <button
                onClick={onAction}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                {actionText}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  const BatteryOptimizationInstructions = () => (
    <div className="bg-orange-50 border border-orange-200 rounded-lg p-6 mt-4">
      <div className="flex items-start space-x-3">
        <FaExclamationTriangle className="text-orange-600 mt-1" />
        <div>
          <h4 className="text-lg font-semibold text-orange-900">Battery Optimization Settings</h4>
          <p className="text-orange-800 mt-2">
            For reliable background location tracking, please disable battery optimization:
          </p>
          <ol className="list-decimal list-inside mt-3 space-y-2 text-orange-800">
            <li>Go to <strong>Settings → Apps → YatriSuraksha</strong></li>
            <li>Tap on <strong>Battery</strong> or <strong>Battery optimization</strong></li>
            <li>Select <strong>"Don't optimize"</strong> or <strong>"Allow background activity"</strong></li>
            <li>Return to the app and start location tracking</li>
          </ol>
          <div className="mt-4">
            <button
              onClick={() => setShowInstructions(false)}
              className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700"
            >
              I've Done This
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  if (!isNative) {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <div className="flex items-center space-x-3">
          <FaMapMarkerAlt className="text-blue-600" />
          <div>
            <h3 className="text-lg font-semibold text-blue-900">Web Mode</h3>
            <p className="text-blue-800">
              Running in web mode. For full background location tracking, please use the Android app.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="text-center mb-8">
        <FaAndroid className="text-6xl text-green-600 mx-auto mb-4" />
        <h2 className="text-3xl font-bold text-gray-900">App Permissions</h2>
        <p className="text-gray-600 mt-2">
          YatriSuraksha needs these permissions to keep you safe during your tours
        </p>
      </div>

      {deviceInfo && (
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-gray-900">Device Information</h3>
          <p className="text-sm text-gray-600">
            Platform: {deviceInfo.platform} | Version: {deviceInfo.osVersion}
          </p>
        </div>
      )}

      <PermissionCard
        icon={<FaMapMarkerAlt className="text-xl text-blue-600" />}
        title="Location Access"
        description="Required for tracking your location during tours and emergency situations"
        status={permissionStatus.location}
        onAction={requestLocationPermission}
        actionText="Grant Permission"
      />

      <PermissionCard
        icon={<FaBatteryHalf className="text-xl text-orange-600" />}
        title="Battery Optimization"
        description="Disable battery optimization to ensure continuous location tracking in background"
        status={permissionStatus.batteryOptimization}
        onAction={showBatteryOptimizationInstructions}
        actionText="Configure"
      />

      {showInstructions && <BatteryOptimizationInstructions />}

      {permissionStatus.location === 'granted' && (
        <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center space-x-3">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span className="text-green-800 font-medium">
              Ready for location tracking! Your tours will be monitored even when the app is in background.
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default PermissionManager;