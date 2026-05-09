import { useState } from 'react';
import { Droplets, Menu, X, Bell, LogOut, User, MapPin, Heart, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

type Page = 'landing' | 'map' | 'donate' | 'request' | 'notifications';

interface HeaderProps {
  currentPage: Page;
  onNavigate: (page: Page) => void;
  onAuthClick: () => void;
  notifCount?: number;
}

export default function Header({ currentPage, onNavigate, onAuthClick, notifCount = 0 }: HeaderProps) {
  const { user, profile, signOut } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const navLinks: { page: Page; label: string; icon: typeof MapPin }[] = [
    { page: 'map', label: 'Life Map', icon: MapPin },
    { page: 'donate', label: 'Donate', icon: Heart },
    { page: 'request', label: 'Request Blood', icon: AlertCircle },
  ];

  async function handleSignOut() {
    await signOut();
    setUserMenuOpen(false);
    onNavigate('landing');
  }

  return (
    <header className="fixed top-0 left-0 right-0 z-40 bg-white/95 backdrop-blur border-b border-gray-100">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <button
          onClick={() => onNavigate('landing')}
          className="flex items-center gap-2 font-bold text-gray-900 hover:opacity-80 transition-opacity"
        >
          <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center">
            <Droplets size={16} className="text-white" />
          </div>
          <span>Life Map</span>
        </button>

        {/* Desktop nav */}
        {user && (
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map(({ page, label, icon: Icon }) => (
              <button
                key={page}
                onClick={() => onNavigate(page)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  currentPage === page
                    ? 'bg-red-50 text-red-600'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <Icon size={15} />
                {label}
              </button>
            ))}
          </nav>
        )}

        {/* Right side */}
        <div className="flex items-center gap-2">
          {user ? (
            <>
              <button
                onClick={() => onNavigate('notifications')}
                className="relative p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <Bell size={18} />
                {notifCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-600 text-white text-xs rounded-full flex items-center justify-center font-bold">
                    {notifCount > 9 ? '9+' : notifCount}
                  </span>
                )}
              </button>

              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 pl-2 pr-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  <div className="w-6 h-6 bg-red-100 rounded-full flex items-center justify-center">
                    <User size={13} className="text-red-600" />
                  </div>
                  <span className="text-sm font-medium text-gray-700 hidden sm:block">
                    {profile?.full_name?.split(' ')[0] || 'Account'}
                  </span>
                </button>

                {userMenuOpen && (
                  <div className="absolute right-0 top-full mt-1 w-56 bg-white rounded-xl shadow-lg border border-gray-100 py-1.5 z-50">
                    <div className="px-3 py-2 border-b border-gray-100">
                      <div className="text-sm font-semibold text-gray-900">{profile?.full_name || 'User'}</div>
                      <div className="text-xs text-gray-500 mt-0.5 flex items-center gap-1">
                        <span className="inline-flex items-center bg-red-100 text-red-700 px-1.5 py-0.5 rounded text-xs font-medium">
                          {profile?.blood_group || '—'}
                        </span>
                        <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium ${
                          profile?.is_available ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'
                        }`}>
                          {profile?.is_available ? 'Available' : 'Unavailable'}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => { onNavigate('donate'); setUserMenuOpen(false); }}
                      className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                    >
                      <Heart size={14} /> Donor Profile
                    </button>
                    <button
                      onClick={handleSignOut}
                      className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                    >
                      <LogOut size={14} /> Sign Out
                    </button>
                  </div>
                )}
              </div>

              {/* Mobile menu toggle */}
              <button
                onClick={() => setMobileOpen(!mobileOpen)}
                className="md:hidden p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg"
              >
                {mobileOpen ? <X size={18} /> : <Menu size={18} />}
              </button>
            </>
          ) : (
            <button
              onClick={onAuthClick}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
            >
              Sign In
            </button>
          )}
        </div>
      </div>

      {/* Mobile nav */}
      {user && mobileOpen && (
        <div className="md:hidden border-t border-gray-100 bg-white px-4 py-3 space-y-1">
          {navLinks.map(({ page, label, icon: Icon }) => (
            <button
              key={page}
              onClick={() => { onNavigate(page); setMobileOpen(false); }}
              className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                currentPage === page ? 'bg-red-50 text-red-600' : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <Icon size={16} />
              {label}
            </button>
          ))}
        </div>
      )}

      {/* Backdrop for user menu */}
      {userMenuOpen && (
        <div className="fixed inset-0 z-40" onClick={() => setUserMenuOpen(false)} />
      )}
    </header>
  );
}
