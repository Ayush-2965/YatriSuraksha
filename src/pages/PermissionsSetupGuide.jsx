import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const PermissionsSetupGuide = () => {
  const navigate = useNavigate();
  const [completedSteps, setCompletedSteps] = useState(new Set());

  const steps = [
    {
      id: 'location',
      title: 'Location Permission',
      icon: '📍',
      description: 'Enable location access for emergency tracking',
      action: 'Grant Location Access',
      details: [
        'Tap "Allow" when prompted for location permission',
        'Select "Allow all the time" for background tracking',
        'This enables emergency location sharing'
      ]
    },
    {
      id: 'battery',
      title: 'Battery Optimization',
      icon: '🔋',
      description: 'Disable battery optimization for reliable background operation',
      action: 'Disable Battery Optimization',
      details: [
        'Allow the app to run in background without restrictions',
        'Prevents Android from stopping location tracking',
        'Essential for emergency response functionality'
      ]
    },
    {
      id: 'notifications',
      title: 'Notifications',
      icon: '🔔',
      description: 'Enable notifications for emergency alerts',
      action: 'Enable Notifications',
      details: [
        'Receive emergency alerts and safety notifications',
        'Get updates about nearby incidents',
        'Critical for emergency communication'
      ]
    },
    {
      id: 'camera',
      title: 'Camera Access',
      icon: '📷',
      description: 'Enable camera for QR code scanning and emergency photos',
      action: 'Grant Camera Access',
      details: [
        'Scan QR codes for quick emergency reporting',
        'Take photos during emergency situations',
        'Share visual evidence with authorities'
      ]
    }
  ];

  const handleStepAction = async (step) => {
    try {
      switch (step.id) {
        case 'location':
          await requestLocationPermission();
          break;
        case 'battery':
          await openBatteryOptimizationSettings();
          break;
        case 'notifications':
          await requestNotificationPermission();
          break;
        case 'camera':
          await requestCameraPermission();
          break;
      }
      setCompletedSteps(prev => new Set([...prev, step.id]));
    } catch (error) {
      console.error(`Error handling ${step.id} permission:`, error);
    }
  };

  const requestLocationPermission = async () => {
    try {
      const { Geolocation } = await import('@capacitor/geolocation');
      const permission = await Geolocation.requestPermissions();
      console.log('Location permission:', permission);
      
      // Also request background location if supported
      if (window.AndroidBridge) {
        await window.AndroidBridge.requestBackgroundLocationPermission();
      }
    } catch (error) {
      console.error('Location permission error:', error);
    }
  };

  const openBatteryOptimizationSettings = async () => {
    try {
      if (window.AndroidBridge) {
        await window.AndroidBridge.requestBatteryOptimizationExemption();
      } else {
        // Fallback: Navigate to battery optimization page
        navigate('/battery-optimization');
      }
    } catch (error) {
      console.error('Battery optimization error:', error);
    }
  };

  const requestNotificationPermission = async () => {
    try {
      const { PushNotifications } = await import('@capacitor/push-notifications');
      const permission = await PushNotifications.requestPermissions();
      console.log('Notification permission:', permission);
    } catch (error) {
      console.error('Notification permission error:', error);
    }
  };

  const requestCameraPermission = async () => {
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        await navigator.mediaDevices.getUserMedia({ video: true });
      }
    } catch (error) {
      console.error('Camera permission error:', error);
    }
  };

  const isStepCompleted = (stepId) => completedSteps.has(stepId);
  const allStepsCompleted = steps.every(step => isStepCompleted(step.id));

  const handleSkip = () => {
    navigate('/');
  };

  const handleComplete = () => {
    // Store that setup was completed
    localStorage.setItem('yatri-permissions-setup-completed', 'true');
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-md mx-auto px-4 py-6">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-800 mb-2">Setup Permissions</h1>
            <p className="text-gray-600">Configure your device for optimal safety features</p>
            <div className="mt-4 flex justify-between items-center">
              <div className="text-sm text-gray-500">
                {completedSteps.size} of {steps.length} completed
              </div>
              <div className="flex space-x-1">
                {steps.map((_, index) => (
                  <div
                    key={index}
                    className={`w-2 h-2 rounded-full ${
                      completedSteps.size > index ? 'bg-green-500' : 'bg-gray-300'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-md mx-auto p-4">
        {/* Steps */}
        <div className="space-y-4 mb-8">
          {steps.map((step) => (
            <div
              key={step.id}
              className={`bg-white rounded-2xl shadow-lg p-6 transition-all ${
                isStepCompleted(step.id) ? 'border-2 border-green-200' : ''
              }`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center text-xl mr-4 ${
                    isStepCompleted(step.id) 
                      ? 'bg-green-100 text-green-600' 
                      : 'bg-blue-100 text-blue-600'
                  }`}>
                    {isStepCompleted(step.id) ? '✓' : step.icon}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800">{step.title}</h3>
                    <p className="text-sm text-gray-600">{step.description}</p>
                  </div>
                </div>
              </div>

              {/* Details */}
              <div className="mb-4">
                <ul className="space-y-1">
                  {step.details.map((detail, idx) => (
                    <li key={idx} className="text-sm text-gray-600 flex items-start">
                      <span className="text-blue-500 mr-2">•</span>
                      {detail}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Action Button */}
              <button
                onClick={() => handleStepAction(step)}
                disabled={isStepCompleted(step.id)}
                className={`w-full py-3 rounded-lg font-semibold transition-all ${
                  isStepCompleted(step.id)
                    ? 'bg-green-100 text-green-700 cursor-not-allowed'
                    : 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white hover:from-blue-600 hover:to-indigo-700'
                }`}
              >
                {isStepCompleted(step.id) ? '✓ Completed' : step.action}
              </button>
            </div>
          ))}
        </div>

        {/* Important Notice */}
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 mb-6">
          <div className="flex items-start">
            <div className="w-6 h-6 bg-amber-100 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
              <svg className="w-4 h-4 text-amber-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-amber-800 mb-2">Important</h3>
              <p className="text-sm text-amber-700">
                These permissions are essential for YatriSuraksha to provide reliable emergency services. 
                Without them, some safety features may not work properly during critical situations.
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          {allStepsCompleted ? (
            <button
              onClick={handleComplete}
              className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white py-4 rounded-lg font-semibold text-lg hover:from-green-600 hover:to-emerald-700 transition-all"
            >
              Complete Setup 🎉
            </button>
          ) : (
            <button
              onClick={() => navigate('/battery-optimization')}
              className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white py-4 rounded-lg font-semibold hover:from-blue-600 hover:to-indigo-700 transition-all"
            >
              Advanced Settings
            </button>
          )}
          
          <button
            onClick={handleSkip}
            className="w-full bg-gray-100 text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-200 transition-colors"
          >
            Skip for Now
          </button>
        </div>

        {/* Help Text */}
        <div className="text-center mt-6">
          <p className="text-xs text-gray-500">
            Need help? Contact support or check our 
            <span className="text-blue-600 cursor-pointer"> setup guide</span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default PermissionsSetupGuide;