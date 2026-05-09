import { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import Header from './components/Header';
import AuthModal from './components/AuthModal';
import Landing from './pages/Landing';
import LifeMap from './pages/LifeMap';
import Donate from './pages/Donate';
import RequestBlood from './pages/RequestBlood';
import Notifications from './pages/Notifications';
import { supabase } from './lib/supabase';

type Page = 'landing' | 'map' | 'donate' | 'request' | 'notifications';

function AppContent() {
  const { user } = useAuth();
  const [page, setPage] = useState<Page>('landing');
  const [showAuth, setShowAuth] = useState(false);
  const [notifCount, setNotifCount] = useState(0);

  useEffect(() => {
    if (user) {
      loadNotifCount();
      const channel = supabase
        .channel('notif-count')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'request_responses', filter: `donor_id=eq.${user.id}` }, () => {
          loadNotifCount();
        })
        .subscribe();
      return () => { supabase.removeChannel(channel); };
    } else {
      setNotifCount(0);
    }
  }, [user]);

  async function loadNotifCount() {
    if (!user) return;
    const { count } = await supabase
      .from('request_responses')
      .select('*', { count: 'exact', head: true })
      .eq('donor_id', user.id)
      .eq('status', 'pending');
    setNotifCount(count ?? 0);
  }

  function navigate(p: Page) {
    if (p !== 'landing' && !user) {
      setShowAuth(true);
      return;
    }
    setPage(p);
    if (p === 'notifications') setNotifCount(0);
  }

  function handleGetStarted() {
    if (user) setPage('map');
    else setShowAuth(true);
  }

  return (
    <div className="font-sans antialiased">
      <Header
        currentPage={page}
        onNavigate={navigate}
        onAuthClick={() => setShowAuth(true)}
        notifCount={notifCount}
      />

      {showAuth && (
        <AuthModal
          onClose={() => {
            setShowAuth(false);
            if (user) setPage('map');
          }}
        />
      )}

      {page === 'landing' && <Landing onGetStarted={handleGetStarted} />}
      {page === 'map' && user && <LifeMap />}
      {page === 'donate' && user && <Donate />}
      {page === 'request' && user && <RequestBlood />}
      {page === 'notifications' && user && <Notifications />}

      {page !== 'landing' && !user && (
        <div className="pt-24 flex items-center justify-center min-h-screen bg-gray-50">
          <div className="text-center">
            <div className="text-gray-400 mb-4">Please sign in to continue</div>
            <button
              onClick={() => setShowAuth(true)}
              className="bg-red-600 text-white px-6 py-2.5 rounded-xl font-semibold hover:bg-red-700 transition-colors"
            >
              Sign In
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
