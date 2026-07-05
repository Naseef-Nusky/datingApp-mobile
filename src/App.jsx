import { useEffect, useState } from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import axios from 'axios';
import MaintenanceScreen from './components/MaintenanceScreen';
import { AuthProvider } from './context/AuthContext';
import { CreditsModalsProvider } from './context/CreditsModalsProvider';
import CreditsAccessBridge from './components/CreditsAccessBridge';
import { LanguageProvider } from './context/LanguageContext';
import MobileAppShell from './app/MobileAppShell';

function App() {
  const [maintGate, setMaintGate] = useState({
    loading: true,
    blocked: false,
    siteName: 'Vantage Dating',
    message: '',
  });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const token = localStorage.getItem('token');
        const { data } = await axios.get('/api/auth/site-status', {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (cancelled) return;
        if (data.appInMaintenance) {
          setMaintGate({
            loading: false,
            blocked: true,
            siteName: data.siteName || 'Vantage Dating',
            message: data.maintenanceMessage || '',
          });
        } else {
          setMaintGate((s) => ({ ...s, loading: false, blocked: false }));
        }
      } catch {
        if (!cancelled) {
          setMaintGate((s) => ({ ...s, loading: false, blocked: false }));
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const onMaint = (e) => {
      const d = e.detail || {};
      setMaintGate({
        loading: false,
        blocked: true,
        siteName: d.siteName || 'Vantage Dating',
        message: d.message || d.maintenanceMessage || '',
      });
    };
    window.addEventListener('app-maintenance', onMaint);
    return () => window.removeEventListener('app-maintenance', onMaint);
  }, []);

  useEffect(() => {
    const setVh = () => {
      const vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty('--vh', `${vh}px`);
    };
    setVh();
    window.addEventListener('resize', setVh);
    return () => window.removeEventListener('resize', setVh);
  }, []);

  if (maintGate.loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 text-gray-600">
        Loading…
      </div>
    );
  }

  if (maintGate.blocked) {
    return <MaintenanceScreen siteName={maintGate.siteName} message={maintGate.message} />;
  }

  return (
    <AuthProvider>
      <CreditsModalsProvider>
        <LanguageProvider>
          <CreditsAccessBridge />
          <Router
            future={{
              v7_startTransition: true,
              v7_relativeSplatPath: true,
            }}
          >
            <MobileAppShell />
          </Router>
        </LanguageProvider>
      </CreditsModalsProvider>
    </AuthProvider>
  );
}

export default App;
