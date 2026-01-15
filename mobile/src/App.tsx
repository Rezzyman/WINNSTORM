import { Route, Switch } from 'wouter';
import { useState, useEffect } from 'react';
import HomePage from './pages/HomePage';
import CameraPage from './pages/CameraPage';
import StormyPage from './pages/StormyPage';
import InspectionsPage from './pages/InspectionsPage';
import PropertyPage from './pages/PropertyPage';
import BottomNav from './components/BottomNav';
import { AuthProvider } from './lib/auth-context';

export default function App() {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Initialize Capacitor plugins
    const init = async () => {
      try {
        // Small delay for splash screen
        await new Promise(resolve => setTimeout(resolve, 500));
        setIsReady(true);
      } catch (err) {
        console.error('Init error:', err);
        setIsReady(true);
      }
    };
    init();
  }, []);

  if (!isReady) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-slate-900">
        <div className="text-center">
          <img src="/logo.png" alt="WinnStorm" className="w-24 h-24 mx-auto mb-4" />
          <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto" />
        </div>
      </div>
    );
  }

  return (
    <AuthProvider>
      <div className="h-full w-full flex flex-col bg-slate-900">
        <main className="flex-1 overflow-hidden">
          <Switch>
            <Route path="/" component={HomePage} />
            <Route path="/camera" component={CameraPage} />
            <Route path="/camera/:inspectionId" component={CameraPage} />
            <Route path="/stormy" component={StormyPage} />
            <Route path="/inspections" component={InspectionsPage} />
            <Route path="/property/:id" component={PropertyPage} />
            <Route>
              <div className="h-full flex items-center justify-center">
                <p className="text-slate-400">Page not found</p>
              </div>
            </Route>
          </Switch>
        </main>
        <BottomNav />
      </div>
    </AuthProvider>
  );
}
