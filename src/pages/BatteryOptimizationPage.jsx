import React, { useState, useEffect } from 'react';
import { App } from '@capacitor/app';
import { Device } from '@capacitor/device';

const BatteryOptimizationPage = () => {
  const [deviceInfo, setDeviceInfo] = useState(null);
  const [permissionStatus, setPermissionStatus] = useState({
    batteryOptimization: 'unknown',
    backgroundLocation: 'unknown',
    notifications: 'unknown'
  });

  useEffect(() => {
    getDeviceInfo();
    checkPermissions();
  }, []);

  const getDeviceInfo = async () => {
    try {
      const info = await Device.getInfo();
      setDeviceInfo(info);
    } catch (error) {
      console.error('Error getting device info:', error);
    }
  };

  const checkPermissions = async () => {
    // This would typically check actual permission status
    // For now, we'll simulate the check
    setPermissionStatus({
      batteryOptimization: 'denied',
      backgroundLocation: 'granted',
      notifications: 'granted'
    });
  };

  const openBatteryOptimizationSettings = async () => {
    try {
      if (window.AndroidBridge) {
        // Custom Android bridge method to open battery optimization settings
        window.AndroidBridge.openBatteryOptimizationSettings();
      } else {
        // Fallback: Open app settings
        await App.openUrl({ url: 'package:com.yatrisuraksha.app' });
      }
    } catch (error) {
      console.error('Error opening battery settings:', error);
      alert('Please manually go to Settings > Apps > YatriSuraksha > Battery > Don\'t optimize');
    }
  };

  const openLocationSettings = async () => {
    try {
      if (window.AndroidBridge) {
        window.AndroidBridge.openLocationSettings();
      } else {
        alert('Please manually enable location permissions in Settings > Apps > YatriSuraksha > Permissions');
      }
    } catch (error) {
      console.error('Error opening location settings:', error);
    }
  };

  const openNotificationSettings = async () => {
    try {
      if (window.AndroidBridge) {
        window.AndroidBridge.openNotificationSettings();
      } else {
        alert('Please manually enable notifications in Settings > Apps > YatriSuraksha > Notifications');
      }
    } catch (error) {
      console.error('Error opening notification settings:', error);
    }
  };

  const requestAllPermissions = async () => {
    try {
      // Request battery optimization exemption
      if (window.AndroidBridge) {
        await window.AndroidBridge.requestBatteryOptimizationExemption();
      }
      
      // Request location permissions
      const { Geolocation } = await import('@capacitor/geolocation');
      await Geolocation.requestPermissions();
      
      // Request notification permissions
      const { PushNotifications } = await import('@capacitor/push-notifications');
      await PushNotifications.requestPermissions();
      
      // Recheck permissions
      setTimeout(() => {
        checkPermissions();
      }, 1000);
      
    } catch (error) {
      console.error('Error requesting permissions:', error);
    }
  };

  const getManufacturerSpecificInstructions = () => {
    const manufacturer = deviceInfo?.manufacturer?.toLowerCase() || '';
    
    if (manufacturer.includes('samsung')) {
      return {
        title: "Samsung Device Instructions",
        steps: [
          "Go to Settings > Device Care > Battery",
          "Tap 'App Power Management'",
          "Find 'YatriSuraksha' and tap it",
          "Select 'Unrestricted' or 'Optimized'",
          "Also check 'Auto-start manager' and enable YatriSuraksha"
        ]
      };
    } else if (manufacturer.includes('xiaomi') || manufacturer.includes('redmi')) {
      return {
        title: "Xiaomi/Redmi Device Instructions",
        steps: [
          "Go to Settings > Apps > Manage Apps",
          "Find 'YatriSuraksha' and tap it",
          "Tap 'Battery Saver' and select 'No restrictions'",
          "Go to 'Autostart' and enable YatriSuraksha",
          "Go to 'Other Permissions' and enable 'Display pop-up windows while running in background'"
        ]
      };
    } else if (manufacturer.includes('huawei') || manufacturer.includes('honor')) {
      return {
        title: "Huawei/Honor Device Instructions",
        steps: [
          "Go to Settings > Apps & Services > Apps",
          "Find 'YatriSuraksha' and tap it",
          "Tap 'Battery' and enable 'Allow background activity'",
          "Go to Settings > Battery > App Launch",
          "Find YatriSuraksha and enable 'Manage manually'",
          "Enable all three options: Auto-launch, Secondary launch, Run in background"
        ]
      };
    } else if (manufacturer.includes('oppo') || manufacturer.includes('oneplus')) {
      return {
        title: "OPPO/OnePlus Device Instructions",
        steps: [
          "Go to Settings > Battery > Battery Optimization",
          "Find 'YatriSuraksha' and select 'Don't optimize'",
          "Go to Settings > Apps > App Management",
          "Find YatriSuraksha > Battery Usage",
          "Enable 'Allow background activity'"
        ]
      };
    } else if (manufacturer.includes('vivo')) {
      return {
        title: "Vivo Device Instructions",
        steps: [
          "Go to Settings > Battery > Background App Refresh",
          "Find 'YatriSuraksha' and enable it",
          "Go to Settings > Apps & Permissions > Autostart Manager",
          "Enable YatriSuraksha",
          "Go to Settings > Apps & Permissions > Permissions",
          "Enable 'Display over other apps' for YatriSuraksha"
        ]
      };
    } else {
      return {
        title: "General Android Instructions",
        steps: [
          "Go to Settings > Apps > YatriSuraksha",
          "Tap 'Battery' and select 'Unrestricted'",
          "Enable 'Background activity'",
          "Go to Settings > Battery > Battery Optimization",
          "Find YatriSuraksha and select 'Don't optimize'"
        ]
      };
    }
  };

  const instructions = getManufacturerSpecificInstructions();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <div className="text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">Battery Optimization</h1>
            <p className="text-gray-600">Configure your device for reliable background location tracking</p>
          </div>
        </div>

        {/* Device Info */}
        {deviceInfo && (
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-3">Device Information</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Manufacturer:</span>
                <span className="font-medium">{deviceInfo.manufacturer}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Model:</span>
                <span className="font-medium">{deviceInfo.model}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Android Version:</span>
                <span className="font-medium">{deviceInfo.osVersion}</span>
              </div>
            </div>
          </div>
        )}

        {/* Permission Status */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Permission Status</h2>
          
          <div className="space-y-4">
            {/* Battery Optimization */}
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center">
                <div className={`w-3 h-3 rounded-full mr-3 ${
                  permissionStatus.batteryOptimization === 'granted' ? 'bg-green-500' : 'bg-red-500'
                }`}></div>
                <span className="text-sm font-medium">Battery Optimization</span>
              </div>
              <button
                onClick={openBatteryOptimizationSettings}
                className="px-3 py-1 bg-blue-500 text-white text-xs rounded-full hover:bg-blue-600"
              >
                Configure
              </button>
            </div>

            {/* Background Location */}
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center">
                <div className={`w-3 h-3 rounded-full mr-3 ${
                  permissionStatus.backgroundLocation === 'granted' ? 'bg-green-500' : 'bg-red-500'
                }`}></div>
                <span className="text-sm font-medium">Background Location</span>
              </div>
              <button
                onClick={openLocationSettings}
                className="px-3 py-1 bg-blue-500 text-white text-xs rounded-full hover:bg-blue-600"
              >
                Configure
              </button>
            </div>

            {/* Notifications */}
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center">
                <div className={`w-3 h-3 rounded-full mr-3 ${
                  permissionStatus.notifications === 'granted' ? 'bg-green-500' : 'bg-red-500'
                }`}></div>
                <span className="text-sm font-medium">Notifications</span>
              </div>
              <button
                onClick={openNotificationSettings}
                className="px-3 py-1 bg-blue-500 text-white text-xs rounded-full hover:bg-blue-600"
              >
                Configure
              </button>
            </div>
          </div>

          <button
            onClick={requestAllPermissions}
            className="w-full mt-6 bg-gradient-to-r from-blue-500 to-indigo-600 text-white py-3 rounded-lg font-semibold hover:from-blue-600 hover:to-indigo-700 transition-all"
          >
            Grant All Permissions
          </button>
        </div>

        {/* Device-Specific Instructions */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">{instructions.title}</h2>
          <div className="space-y-3">
            {instructions.steps.map((step, index) => (
              <div key={index} className="flex items-start">
                <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-semibold mr-3 mt-0.5 flex-shrink-0">
                  {index + 1}
                </div>
                <p className="text-sm text-gray-700 leading-relaxed">{step}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Why This Matters */}
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 mb-6">
          <div className="flex items-start">
            <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
              <svg className="w-4 h-4 text-amber-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-amber-800 mb-2">Why These Settings Matter</h3>
              <ul className="text-sm text-amber-700 space-y-1">
                <li>• Ensures emergency location tracking works reliably</li>
                <li>• Prevents Android from killing the app in background</li>
                <li>• Enables real-time safety notifications</li>
                <li>• Maintains continuous location updates for safety</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 gap-3">
            <button 
              onClick={() => window.history.back()}
              className="p-3 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
            >
              ← Back to App
            </button>
            <button 
              onClick={checkPermissions}
              className="p-3 bg-blue-100 text-blue-700 rounded-lg text-sm font-medium hover:bg-blue-200 transition-colors"
            >
              ↻ Refresh Status
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BatteryOptimizationPage;