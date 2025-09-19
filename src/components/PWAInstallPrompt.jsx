import React from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';

const PWAInstallPrompt = () => {
  const { isInstallable, isInstalled, installPWA } = usePWAInstall();

  // Don't show if already installed or not installable
  if (isInstalled || !isInstallable) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 bg-blue-600 text-white p-4 rounded-lg shadow-lg z-50 md:left-auto md:right-4 md:max-w-sm">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <h3 className="font-semibold text-sm">Install Yatri Suraksha</h3>
          <p className="text-xs opacity-90 mt-1">
            Add to home screen for quick access and offline use
          </p>
        </div>
        <div className="ml-4 flex space-x-2">
          <button
            onClick={installPWA}
            className="bg-white text-blue-600 px-3 py-1 rounded text-sm font-semibold hover:bg-blue-50 transition-colors"
          >
            Install
          </button>
        </div>
      </div>
    </div>
  );
};

export default PWAInstallPrompt;