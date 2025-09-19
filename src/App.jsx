import { useEffect } from "react";
import AppRouter from "./routes/router";
import PWAInstallPrompt from "./components/PWAInstallPrompt";
import PWAStatus from "./components/PWAStatus";
import './lib/androidBridge'; // Initialize Android bridge

function App() {
  useEffect(() => {
    // Check if this is the first launch and show permissions setup
    const hasCompletedSetup = localStorage.getItem('yatri-permissions-setup-completed');
    
    if (!hasCompletedSetup && window.location.pathname === '/') {
      // Redirect to permissions setup on first launch
      setTimeout(() => {
        window.location.href = '/permissions-setup';
      }, 2000); // Give time for the app to load
    }
  }, []);

  return (
    <div className="app">
      <AppRouter />
      <PWAInstallPrompt />
      <PWAStatus />
    </div>
  );
}

export default App;
