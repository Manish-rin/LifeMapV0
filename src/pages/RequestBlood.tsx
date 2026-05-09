import { useState, useEffect } from 'react';
import {
  AlertCircle, MapPin, Loader2, CheckCircle, Clock, XCircle,
  Building2, Phone, ChevronDown, ChevronUp, Droplets, AlertTriangle
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { BLOOD_GROUPS } from '../lib/database.types';
import type { BloodRequest, Hospital } from '../lib/database.types';
import { useAuth } from '../context/AuthContext';

interface RequestWithResponses extends BloodRequest {
  donor_count: number;
  accepted_count: number;
}

export default function RequestBlood() {
  const { user } = useAuth();
  const [tab, setTab] = useState<'new' | 'history'>('new');
  const [saving, setSaving] = useState(false);
  const [locating, setLocating] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [myRequests, setMyRequests] = useState<RequestWithResponses[]>([]);
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [expandedHospitals, setExpandedHospitals] = useState(false);

  const [form, setForm] = useState({
    blood_group: '',
    address: '',
    notes: '',
    latitude: null as number | null,
    longitude: null as number | null,
  });

  function set(field: string, value: unknown) {
    setForm((f) => ({ ...f, [field]: value }));
    setError('');
    setSubmitted(false);
  }

  function getLocation() {
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        set('latitude', pos.coords.latitude);
        set('longitude', pos.coords.longitude);
        setLocating(false);
      },
      () => { setError('Could not detect location. Please allow location access.'); setLocating(false); }
    );
  }

  async function loadMyRequests() {
    if (!user) return;
    const { data: requests } = await supabase
      .from('blood_requests')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (!requests) return;

    const withCounts = await Promise.all(
      requests.map(async (r) => {
        const { data: responses } = await supabase
          .from('request_responses')
          .select('status')
          .eq('request_id', r.id);
        return {
          ...r,
          donor_count: responses?.length ?? 0,
          accepted_count: responses?.filter((x) => x.status === 'accepted').length ?? 0,
        } as RequestWithResponses;
      })
    );
    setMyRequests(withCounts);
  }

  useEffect(() => {
    if (tab === 'history') loadMyRequests();
  }, [tab, user]);

  useEffect(() => {
    supabase.from('hospitals').select('*').then(({ data }) => setHospitals(data ?? []));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    if (!form.blood_group) { setError('Please select the required blood group.'); return; }
    if (!form.latitude || !form.longitude) { setError('Please detect your location so donors can find you.'); return; }

    setSaving(true);
    setError('');

    const { error: dbErr } = await supabase.from('blood_requests').insert({
      user_id: user.id,
      blood_group: form.blood_group,
      latitude: form.latitude,
      longitude: form.longitude,
      address: form.address,
      notes: form.notes,
      status: 'pending',
    });

    if (dbErr) { setError(dbErr.message); setSaving(false); return; }
    setSubmitted(true);
    setSaving(false);
    setForm({ blood_group: '', address: '', notes: '', latitude: null, longitude: null });
  }

  async function cancelRequest(id: string) {
    await supabase.from('blood_requests').update({ status: 'cancelled' }).eq('id', id);
    loadMyRequests();
  }

  const statusConfig: Record<string, { label: string; color: string; icon: typeof Clock }> = {
    pending: { label: 'Active', color: 'amber', icon: Clock },
    fulfilled: { label: 'Fulfilled', color: 'emerald', icon: CheckCircle },
    cancelled: { label: 'Cancelled', color: 'gray', icon: XCircle },
  };

  return (
    <div className="pt-20 min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-500 to-orange-500 rounded-2xl p-6 text-white mb-8">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold mb-1">Request Blood</h1>
              <p className="text-amber-100 text-sm">Send an emergency alert to nearby compatible donors instantly.</p>
            </div>
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <AlertCircle size={22} />
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex bg-white border border-gray-200 rounded-xl overflow-hidden mb-6">
          {(['new', 'history'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-3 text-sm font-medium transition-colors ${
                tab === t ? 'bg-amber-50 text-amber-700 border-b-2 border-amber-500' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {t === 'new' ? 'New Request' : 'My Requests'}
            </button>
          ))}
        </div>

        {tab === 'new' && (
          <>
            {submitted ? (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
                <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle size={32} className="text-emerald-600" />
                </div>
                <h2 className="text-xl font-bold text-gray-900 mb-2">Request Sent!</h2>
                <p className="text-gray-500 text-sm mb-6">
                  Nearby donors with matching blood group have been notified. You'll be alerted when someone accepts.
                </p>
                <button
                  onClick={() => setSubmitted(false)}
                  className="bg-amber-500 hover:bg-amber-600 text-white px-6 py-2.5 rounded-xl font-semibold text-sm transition-colors"
                >
                  Send Another Request
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100">
                  <h2 className="font-semibold text-gray-900">Emergency Blood Request</h2>
                  <p className="text-xs text-gray-500 mt-0.5">Fill in the details below to notify nearby donors.</p>
                </div>
                <div className="p-6 space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-1.5">
                      <Droplets size={14} /> Required Blood Group <span className="text-red-500">*</span>
                    </label>
                    <div className="grid grid-cols-4 gap-2">
                      {BLOOD_GROUPS.map((g) => (
                        <button
                          type="button"
                          key={g}
                          onClick={() => set('blood_group', g)}
                          className={`py-2.5 rounded-lg text-sm font-semibold border-2 transition-all ${
                            form.blood_group === g
                              ? 'bg-red-600 text-white border-red-600 shadow-sm'
                              : 'bg-white text-gray-700 border-gray-200 hover:border-red-300'
                          }`}
                        >
                          {g}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-1.5">
                      <MapPin size={14} /> Location <span className="text-red-500">*</span>
                    </label>
                    <div className="flex gap-2 mb-2">
                      <div className="flex-1 px-3 py-2.5 border border-gray-200 rounded-lg bg-gray-50 text-sm text-gray-600">
                        {form.latitude
                          ? `${form.latitude.toFixed(4)}, ${form.longitude?.toFixed(4)}`
                          : 'No location detected'}
                      </div>
                      <button
                        type="button"
                        onClick={getLocation}
                        disabled={locating}
                        className="flex items-center gap-1.5 px-4 py-2.5 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-lg text-sm font-medium transition-colors border border-amber-200"
                      >
                        {locating ? <Loader2 size={14} className="animate-spin" /> : <MapPin size={14} />}
                        Detect
                      </button>
                    </div>
                    <input
                      type="text"
                      value={form.address}
                      onChange={(e) => set('address', e.target.value)}
                      placeholder="Hospital name or address (optional)"
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Additional Notes
                    </label>
                    <textarea
                      value={form.notes}
                      onChange={(e) => set('notes', e.target.value)}
                      placeholder="E.g. Patient name, hospital ward, urgency details..."
                      rows={3}
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent resize-none"
                    />
                  </div>

                  {error && (
                    <div className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2.5 rounded-lg">
                      <AlertTriangle size={14} className="mt-0.5 flex-shrink-0" />
                      {error}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={saving}
                    className="w-full bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white py-3 rounded-xl font-semibold text-sm transition-colors flex items-center justify-center gap-2"
                  >
                    {saving ? <Loader2 size={16} className="animate-spin" /> : <AlertCircle size={16} />}
                    Send Emergency Request
                  </button>
                </div>
              </form>
            )}

            {/* Nearby hospitals fallback */}
            <div className="mt-6 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <button
                onClick={() => setExpandedHospitals(!expandedHospitals)}
                className="w-full flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Building2 size={16} className="text-blue-600" />
                  <span className="font-semibold text-gray-900 text-sm">Nearby Blood Banks & Hospitals</span>
                  <span className="bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded-full">{hospitals.length}</span>
                </div>
                {expandedHospitals ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
              </button>
              {expandedHospitals && (
                <div className="divide-y divide-gray-100">
                  {hospitals.map((h) => (
                    <div key={h.id} className="px-6 py-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="font-medium text-gray-900 text-sm">{h.name}</div>
                          <div className="text-xs text-gray-500 mt-0.5">{h.address}</div>
                          {h.blood_groups_available.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {h.blood_groups_available.map((g) => (
                                <span key={g} className="text-xs bg-red-100 text-red-700 px-1.5 py-0.5 rounded font-medium">{g}</span>
                              ))}
                            </div>
                          )}
                        </div>
                        {h.phone && (
                          <a
                            href={`tel:${h.phone}`}
                            className="flex items-center gap-1 text-xs bg-emerald-100 text-emerald-700 px-2.5 py-1.5 rounded-lg font-medium whitespace-nowrap hover:bg-emerald-200 transition-colors"
                          >
                            <Phone size={12} /> Call
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        {tab === 'history' && (
          <div className="space-y-4">
            {myRequests.length === 0 ? (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-10 text-center text-gray-400">
                <AlertCircle size={32} className="mx-auto mb-3 opacity-30" />
                <div className="text-sm">No blood requests yet</div>
              </div>
            ) : (
              myRequests.map((req) => {
                const sc = statusConfig[req.status] ?? statusConfig.pending;
                const StatusIcon = sc.icon;
                return (
                  <div key={req.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center bg-red-100 text-red-700 px-2.5 py-1 rounded-lg font-bold text-sm">
                          {req.blood_group}
                        </span>
                        <span className={`inline-flex items-center gap-1 bg-${sc.color}-100 text-${sc.color}-700 text-xs px-2 py-1 rounded-full font-medium`}>
                          <StatusIcon size={11} />
                          {sc.label}
                        </span>
                      </div>
                      <div className="text-xs text-gray-400">
                        {new Date(req.created_at).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="px-4 py-3">
                      {req.address && <div className="text-sm text-gray-700 mb-1">{req.address}</div>}
                      {req.notes && <div className="text-xs text-gray-500 mb-2">{req.notes}</div>}
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span>{req.donor_count} donor{req.donor_count !== 1 ? 's' : ''} notified</span>
                        {req.accepted_count > 0 && (
                          <span className="text-emerald-600 font-medium">{req.accepted_count} accepted</span>
                        )}
                      </div>
                    </div>
                    {req.status === 'pending' && (
                      <div className="px-4 pb-3">
                        <button
                          onClick={() => cancelRequest(req.id)}
                          className="text-xs text-gray-400 hover:text-red-600 transition-colors"
                        >
                          Cancel request
                        </button>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>
    </div>
  );
}
