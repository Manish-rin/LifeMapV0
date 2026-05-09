import { useState, useEffect } from 'react';
import { Heart, MapPin, Phone, User, Droplets, Loader2, CheckCircle, ToggleLeft, ToggleRight, AlertTriangle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { BLOOD_GROUPS } from '../lib/database.types';
import { useAuth } from '../context/AuthContext';

export default function Donate() {
  const { user, profile, refreshProfile } = useAuth();
  const [saving, setSaving] = useState(false);
  const [locating, setLocating] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    full_name: '',
    phone: '',
    blood_group: '',
    latitude: null as number | null,
    longitude: null as number | null,
    is_available: false,
  });

  useEffect(() => {
    if (profile) {
      setForm({
        full_name: profile.full_name,
        phone: profile.phone,
        blood_group: profile.blood_group,
        latitude: profile.latitude,
        longitude: profile.longitude,
        is_available: profile.is_available,
      });
    }
  }, [profile]);

  function set(field: string, value: unknown) {
    setForm((f) => ({ ...f, [field]: value }));
    setSaved(false);
    setError('');
  }

  function getLocation() {
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        set('latitude', pos.coords.latitude);
        set('longitude', pos.coords.longitude);
        setLocating(false);
      },
      () => {
        setError('Could not get location. Please allow location access.');
        setLocating(false);
      }
    );
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    if (!form.blood_group) { setError('Please select your blood group.'); return; }
    if (form.is_available && (!form.latitude || !form.longitude)) {
      setError('Location is required to mark yourself as available. Click "Detect Location" first.');
      return;
    }
    setSaving(true);
    setError('');
    const { error: dbErr } = await supabase.from('profiles').update({
      full_name: form.full_name,
      phone: form.phone,
      blood_group: form.blood_group,
      latitude: form.latitude,
      longitude: form.longitude,
      is_available: form.is_available,
      updated_at: new Date().toISOString(),
    }).eq('id', user.id);
    if (dbErr) { setError(dbErr.message); setSaving(false); return; }
    await refreshProfile();
    setSaved(true);
    setSaving(false);
  }

  async function toggleAvailability() {
    if (!user) return;
    if (!form.is_available && (!form.latitude || !form.longitude)) {
      setError('Please detect your location before marking yourself as available.');
      return;
    }
    const newVal = !form.is_available;
    set('is_available', newVal);
    await supabase.from('profiles').update({ is_available: newVal, updated_at: new Date().toISOString() }).eq('id', user.id);
    await refreshProfile();
  }

  return (
    <div className="pt-20 min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Header card */}
        <div className="bg-gradient-to-r from-red-600 to-rose-600 rounded-2xl p-6 text-white mb-8">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold mb-1">Donor Profile</h1>
              <p className="text-red-100 text-sm">Keep your profile up to date and toggle availability when you're ready to help.</p>
            </div>
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <Heart size={22} className="text-white" />
            </div>
          </div>

          {/* Availability toggle */}
          <div className="mt-5 flex items-center justify-between bg-white/10 rounded-xl p-4">
            <div>
              <div className="font-semibold">Availability Status</div>
              <div className="text-sm text-red-100">
                {form.is_available
                  ? 'You are visible on the Life Map as an available donor'
                  : 'You are currently not visible on the Life Map'}
              </div>
            </div>
            <button
              onClick={toggleAvailability}
              className="text-white hover:opacity-80 transition-opacity"
            >
              {form.is_available
                ? <ToggleRight size={40} className="text-emerald-300" />
                : <ToggleLeft size={40} className="text-white/50" />}
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSave} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">Personal Information</h2>
            <p className="text-xs text-gray-500 mt-0.5">This information is kept private. Only blood group is shown on the map.</p>
          </div>

          <div className="p-6 space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-1.5">
                <User size={14} /> Full Name
              </label>
              <input
                type="text"
                value={form.full_name}
                onChange={(e) => set('full_name', e.target.value)}
                placeholder="Your full name"
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-1.5">
                <Phone size={14} /> Phone Number
              </label>
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => set('phone', e.target.value)}
                placeholder="+91 9876543210"
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-400 mt-1">Only shared with patients after you accept a request.</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-1.5">
                <Droplets size={14} /> Blood Group
              </label>
              <select
                value={form.blood_group}
                onChange={(e) => set('blood_group', e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500 bg-white"
              >
                <option value="">Select blood group</option>
                {BLOOD_GROUPS.map((g) => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-1.5">
                <MapPin size={14} /> Your Location
              </label>
              <div className="flex gap-2">
                <div className="flex-1 px-3 py-2.5 border border-gray-200 rounded-lg bg-gray-50 text-sm text-gray-600">
                  {form.latitude && form.longitude
                    ? `${form.latitude.toFixed(4)}, ${form.longitude.toFixed(4)}`
                    : 'No location set'}
                </div>
                <button
                  type="button"
                  onClick={getLocation}
                  disabled={locating}
                  className="flex items-center gap-1.5 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-colors"
                >
                  {locating ? <Loader2 size={14} className="animate-spin" /> : <MapPin size={14} />}
                  Detect
                </button>
              </div>
              <p className="text-xs text-gray-400 mt-1">Used to show your approximate location on the Life Map.</p>
            </div>

            {error && (
              <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 text-amber-800 text-sm px-3 py-2.5 rounded-lg">
                <AlertTriangle size={14} className="mt-0.5 flex-shrink-0" />
                {error}
              </div>
            )}

            <div className="pt-2">
              <button
                type="submit"
                disabled={saving}
                className="w-full bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white py-3 rounded-xl font-semibold text-sm transition-colors flex items-center justify-center gap-2"
              >
                {saving ? <Loader2 size={16} className="animate-spin" /> : null}
                Save Profile
              </button>
            </div>

            {saved && (
              <div className="flex items-center gap-2 text-emerald-700 text-sm font-medium justify-center">
                <CheckCircle size={16} /> Profile saved successfully
              </div>
            )}
          </div>
        </form>

        {/* Info cards */}
        <div className="mt-6 grid sm:grid-cols-2 gap-4">
          <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-100">
            <div className="font-semibold text-emerald-800 text-sm mb-1">What donors see</div>
            <p className="text-emerald-700 text-xs leading-relaxed">
              When you're available, other users see only your blood group and approximate distance — never your name, phone, or exact location.
            </p>
          </div>
          <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
            <div className="font-semibold text-blue-800 text-sm mb-1">When you accept a request</div>
            <p className="text-blue-700 text-xs leading-relaxed">
              Only after you choose to accept a blood request will your phone number be shared with the patient's family to coordinate donation.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
