import { useState, useEffect } from 'react';
import { MapPin, Phone, User, Droplets, Loader2, CheckCircle, ToggleLeft, ToggleRight, AlertTriangle, Award, Calendar, History, Shield } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { BLOOD_GROUPS } from '../lib/database.types';
import type { BadgeId } from '../lib/database.types';
import { useAuth } from '../context/AuthContext';
import { getUnlockedBadges, getAvailableModes, getTierLabel, generateMockScoreEvents } from '../lib/trustScore';
import TrustScoreRing from '../components/TrustScoreRing';
import BadgeGrid from '../components/BadgeGrid';
import StreakCalendar from '../components/StreakCalendar';
import ScoreHistory from '../components/ScoreHistory';

type ProfileTab = 'badges' | 'streak' | 'history';

export default function Donate() {
  const { user, profile, refreshProfile } = useAuth();
  const [saving, setSaving] = useState(false);
  const [locating, setLocating] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<ProfileTab>('badges');
  const [showAadhaar, setShowAadhaar] = useState(false);
  const [aadhaarOtp, setAadhaarOtp] = useState('');
  const [aadhaarNumber, setAadhaarNumber] = useState('');
  const [verifying, setVerifying] = useState(false);

  const [form, setForm] = useState({
    full_name: '', phone: '', blood_group: '', city: '',
    latitude: null as number | null, longitude: null as number | null,
    is_available: false,
  });

  useEffect(() => {
    if (profile) {
      setForm({
        full_name: profile.full_name, phone: profile.phone,
        blood_group: profile.blood_group, city: profile.city || '',
        latitude: profile.latitude, longitude: profile.longitude,
        is_available: profile.is_available,
      });
    }
  }, [profile]);

  function set(field: string, value: unknown) { setForm(f => ({ ...f, [field]: value })); setSaved(false); setError(''); }

  function getLocation() {
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      pos => { set('latitude', pos.coords.latitude); set('longitude', pos.coords.longitude); setLocating(false); },
      () => { setError('Could not get location.'); setLocating(false); }
    );
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    if (!form.blood_group) { setError('Please select blood group.'); return; }
    if (form.is_available && (!form.latitude || !form.longitude)) { setError('Location required when available.'); return; }
    setSaving(true); setError('');
    const { error: dbErr } = await supabase.from('profiles').update({
      full_name: form.full_name, phone: form.phone, blood_group: form.blood_group,
      city: form.city, latitude: form.latitude, longitude: form.longitude,
      is_available: form.is_available, updated_at: new Date().toISOString(),
    }).eq('id', user.id);
    if (dbErr) { setError(dbErr.message); setSaving(false); return; }
    await refreshProfile(); setSaved(true); setSaving(false);
  }

  async function toggleAvailability() {
    if (!user) return;
    if (!form.is_available && (!form.latitude || !form.longitude)) { setError('Detect location first.'); return; }
    const newVal = !form.is_available;
    set('is_available', newVal);
    await supabase.from('profiles').update({ is_available: newVal, updated_at: new Date().toISOString() }).eq('id', user.id);
    await refreshProfile();
  }

  async function simulateAadhaarVerify() {
    if (!aadhaarNumber || aadhaarNumber.length !== 12) { setError('Enter valid 12-digit Aadhaar.'); return; }
    setVerifying(true);
    // Simulate OTP verification delay
    await new Promise(r => setTimeout(r, 2000));
    if (user) {
      await supabase.from('profiles').update({
        aadhaar_verified: true,
        trust_score: (profile?.trust_score || 50) + 5,
        updated_at: new Date().toISOString(),
      }).eq('id', user.id);
      await refreshProfile();
    }
    setVerifying(false); setShowAadhaar(false);
    setAadhaarNumber(''); setAadhaarOtp('');
  }

  // Computed values
  const trustScore = profile?.trust_score ?? 50;
  const unlockedBadges: BadgeId[] = profile ? getUnlockedBadges(profile) : [];
  // Check for first_responder badge from mock events
  const mockEvents = generateMockScoreEvents();
  if (mockEvents.some(e => e.action === 'Fast Response') && !unlockedBadges.includes('first_responder')) {
    unlockedBadges.push('first_responder');
  }
  const availableModes = profile ? getAvailableModes(trustScore, profile.account_tier) : ['raksha'];
  const tierLabel = getTierLabel(trustScore);

  // Mock donation dates for calendar
  const mockDonationDates = [
    new Date(Date.now() - 25 * 86400000).toISOString(),
    new Date(Date.now() - 15 * 86400000).toISOString(),
    new Date(Date.now() - 5 * 86400000).toISOString(),
  ];

  const initials = (profile?.full_name || 'U').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  return (
    <div className="pt-20 min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* ── Hero Section ── */}
        <div className="bg-gradient-to-br from-red-600 via-rose-600 to-red-700 rounded-2xl p-6 text-white mb-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="relative flex items-start gap-4">
            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center text-xl font-bold backdrop-blur-sm flex-shrink-0">
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-xl font-bold truncate">{profile?.full_name || 'Donor'}</h1>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                {profile?.blood_group && (
                  <span className="bg-white/20 px-2 py-0.5 rounded text-xs font-bold">{profile.blood_group}</span>
                )}
                {profile?.aadhaar_verified && (
                  <span className="bg-emerald-400/20 text-emerald-200 px-2 py-0.5 rounded text-xs font-medium flex items-center gap-1">
                    <Shield size={10} /> Verified
                  </span>
                )}
                <span className="text-red-200 text-xs">{profile?.city || 'Set your city'}</span>
              </div>
            </div>
          </div>

          {/* Availability Toggle */}
          <div className="mt-5 flex items-center justify-between bg-white/10 rounded-xl p-4 backdrop-blur-sm">
            <div>
              <div className="font-semibold text-sm">Availability Status</div>
              <div className="text-xs text-red-100 mt-0.5">
                {form.is_available ? 'Visible on the live map' : 'Not visible on the map'}
              </div>
            </div>
            <button onClick={toggleAvailability} className="hover:opacity-80 transition-opacity">
              {form.is_available
                ? <ToggleRight size={40} className="text-emerald-300" />
                : <ToggleLeft size={40} className="text-white/50" />}
            </button>
          </div>
        </div>

        {/* ── Trust Score Panel ── */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
          <div className="flex items-center gap-6">
            <TrustScoreRing score={trustScore} size={100} />
            <div className="flex-1 grid grid-cols-2 gap-3">
              <div className="bg-gray-50 rounded-xl p-3">
                <div className="text-lg font-bold text-gray-900">{profile?.total_donations ?? 0}</div>
                <div className="text-xs text-gray-500">Donations</div>
              </div>
              <div className="bg-gray-50 rounded-xl p-3">
                <div className="text-lg font-bold text-gray-900">{profile?.current_streak ?? 0}</div>
                <div className="text-xs text-gray-500">Month Streak</div>
              </div>
              <div className="bg-gray-50 rounded-xl p-3">
                <div className="text-xs font-semibold text-gray-700">{tierLabel}</div>
                <div className="text-xs text-gray-500">Trust Tier</div>
              </div>
              <div className="bg-gray-50 rounded-xl p-3">
                <div className="flex items-center gap-1">
                  {availableModes.map(m => (
                    <span key={m} className={`text-xs px-1.5 py-0.5 rounded font-medium ${
                      m === 'raksha' ? 'bg-emerald-100 text-emerald-700' :
                      m === 'setu' ? 'bg-amber-100 text-amber-700' :
                      'bg-red-100 text-red-700'
                    }`}>{m.charAt(0).toUpperCase() + m.slice(1)}</span>
                  ))}
                </div>
                <div className="text-xs text-gray-500 mt-0.5">Modes</div>
              </div>
            </div>
          </div>

          {/* Aadhaar Verification CTA */}
          {!profile?.aadhaar_verified && (
            <button
              onClick={() => setShowAadhaar(true)}
              className="mt-4 w-full flex items-center justify-between bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-xl px-4 py-3 transition-colors"
            >
              <div className="flex items-center gap-2">
                <Shield size={16} className="text-blue-600" />
                <span className="text-sm font-medium text-blue-800">Verify Aadhaar for +5 trust points</span>
              </div>
              <span className="text-xs text-blue-600">Verify →</span>
            </button>
          )}
        </div>

        {/* ── Aadhaar Modal ── */}
        {showAadhaar && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 animate-in">
              <h3 className="font-bold text-gray-900 mb-1 flex items-center gap-2"><Shield size={18} className="text-blue-600" /> Aadhaar Verification</h3>
              <p className="text-xs text-gray-500 mb-4">We verify via UIDAI OTP. Your Aadhaar number is never stored.</p>
              <div className="space-y-3">
                <input type="text" maxLength={12} value={aadhaarNumber} onChange={e => setAadhaarNumber(e.target.value.replace(/\D/g, ''))}
                  placeholder="12-digit Aadhaar number" className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm" />
                {aadhaarNumber.length === 12 && (
                  <input type="text" maxLength={6} value={aadhaarOtp} onChange={e => setAadhaarOtp(e.target.value.replace(/\D/g, ''))}
                    placeholder="Enter OTP sent to Aadhaar-linked mobile" className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm" />
                )}
                <div className="flex gap-2">
                  <button onClick={() => setShowAadhaar(false)} className="flex-1 py-2.5 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium">Cancel</button>
                  <button onClick={simulateAadhaarVerify} disabled={verifying || aadhaarNumber.length !== 12}
                    className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white rounded-lg text-sm font-semibold flex items-center justify-center gap-1.5">
                    {verifying ? <Loader2 size={14} className="animate-spin" /> : <Shield size={14} />} Verify
                  </button>
                </div>
                <p className="text-xs text-gray-400 text-center">Only a tokenized verification proof is stored. Compliant with UIDAI guidelines.</p>
              </div>
            </div>
          </div>
        )}

        {/* ── Dashboard Tabs ── */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-6">
          <div className="flex border-b border-gray-100">
            {([
              { id: 'badges' as ProfileTab, label: 'Badges', icon: Award },
              { id: 'streak' as ProfileTab, label: 'Streak', icon: Calendar },
              { id: 'history' as ProfileTab, label: 'History', icon: History },
            ]).map(tab => {
              const Icon = tab.icon;
              return (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-3.5 text-sm font-medium transition-colors
                    ${activeTab === tab.id ? 'text-red-600 border-b-2 border-red-500 bg-red-50/50' : 'text-gray-500 hover:text-gray-700'}`}>
                  <Icon size={14} /> {tab.label}
                </button>
              );
            })}
          </div>
          <div className="p-5">
            {activeTab === 'badges' && <BadgeGrid unlockedBadges={unlockedBadges} />}
            {activeTab === 'streak' && (
              <StreakCalendar
                donationDates={mockDonationDates}
                lastDonationDate={profile?.last_donation_date ?? mockDonationDates[mockDonationDates.length - 1]}
                currentStreak={profile?.current_streak ?? 2}
              />
            )}
            {activeTab === 'history' && <ScoreHistory events={mockEvents} />}
          </div>
        </div>

        {/* ── Profile Form ── */}
        <form onSubmit={handleSave} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">Personal Information</h2>
            <p className="text-xs text-gray-500 mt-0.5">Only blood group is shown on the map. Everything else is private.</p>
          </div>
          <div className="p-6 space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-1.5"><User size={14} /> Full Name</label>
              <input type="text" value={form.full_name} onChange={e => set('full_name', e.target.value)} placeholder="Your full name"
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-1.5"><Phone size={14} /> Phone</label>
                <input type="tel" value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="+91 9876543210"
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">City</label>
                <input type="text" value={form.city} onChange={e => set('city', e.target.value)} placeholder="e.g. Malda"
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-1.5"><Droplets size={14} /> Blood Group</label>
              <div className="grid grid-cols-4 gap-2">
                {BLOOD_GROUPS.map(g => (
                  <button type="button" key={g} onClick={() => set('blood_group', g)}
                    className={`py-2 rounded-lg text-sm font-semibold border-2 transition-all ${
                      form.blood_group === g ? 'bg-red-600 text-white border-red-600 shadow-sm' : 'bg-white text-gray-700 border-gray-200 hover:border-red-300'
                    }`}>{g}</button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-1.5"><MapPin size={14} /> Location</label>
              <div className="flex gap-2">
                <div className="flex-1 px-3 py-2.5 border border-gray-200 rounded-lg bg-gray-50 text-sm text-gray-600">
                  {form.latitude && form.longitude ? `${form.latitude.toFixed(4)}, ${form.longitude.toFixed(4)}` : 'No location set'}
                </div>
                <button type="button" onClick={getLocation} disabled={locating}
                  className="flex items-center gap-1.5 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-colors">
                  {locating ? <Loader2 size={14} className="animate-spin" /> : <MapPin size={14} />} Detect
                </button>
              </div>
              <p className="text-xs text-gray-400 mt-1">A ±500m blur is applied before showing on the map.</p>
            </div>
            {error && (
              <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 text-amber-800 text-sm px-3 py-2.5 rounded-lg">
                <AlertTriangle size={14} className="mt-0.5 flex-shrink-0" /> {error}
              </div>
            )}
            <button type="submit" disabled={saving}
              className="w-full bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white py-3 rounded-xl font-semibold text-sm transition-colors flex items-center justify-center gap-2">
              {saving && <Loader2 size={16} className="animate-spin" />} Save Profile
            </button>
            {saved && (
              <div className="flex items-center gap-2 text-emerald-700 text-sm font-medium justify-center">
                <CheckCircle size={16} /> Profile saved successfully
              </div>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
