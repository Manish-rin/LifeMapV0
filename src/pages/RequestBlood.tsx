import { useState, useEffect } from 'react';
import {
  AlertCircle, MapPin, Loader2, CheckCircle, Clock, XCircle,
  Building2, Phone, ChevronDown, ChevronUp, Droplets, AlertTriangle,
  Shield, Zap, Heart, Radio, Search
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { BLOOD_GROUPS, URGENCY_CONFIG, RADIUS_OPTIONS, PRIVACY_MODE_CONFIG } from '../lib/database.types';
import type { BloodRequest, Hospital, Urgency, PrivacyMode } from '../lib/database.types';
import { useAuth } from '../context/AuthContext';
import { generateLogId } from '../lib/trustScore';
import { getInitialMode } from '../lib/privacyModes';
import { getSimulatedBloodStock } from '../lib/indianData';
import EscalationTimer from '../components/EscalationTimer';

interface RequestWithResponses extends BloodRequest {
  donor_count: number;
  accepted_count: number;
}

export default function RequestBlood() {
  const { user, profile } = useAuth();
  const [tab, setTab] = useState<'new' | 'history'>('new');
  const [saving, setSaving] = useState(false);
  const [locating, setLocating] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [myRequests, setMyRequests] = useState<RequestWithResponses[]>([]);
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [expandedHospitals, setExpandedHospitals] = useState(false);
  const [searchRadius, setSearchRadius] = useState(10);
  const [escalationActive, setEscalationActive] = useState(false);
  const [currentMode, setCurrentMode] = useState<PrivacyMode>('raksha');

  const [form, setForm] = useState({
    blood_group: '',
    hospital_name: '',
    address: '',
    notes: '',
    urgency: 'urgent' as Urgency,
    notification_radius: 5,
    latitude: null as number | null,
    longitude: null as number | null,
  });

  function set(field: string, value: unknown) { setForm(f => ({ ...f, [field]: value })); setError(''); setSubmitted(false); }

  function getLocation() {
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      pos => { set('latitude', pos.coords.latitude); set('longitude', pos.coords.longitude); setLocating(false); },
      () => { setError('Could not detect location.'); setLocating(false); }
    );
  }

  async function loadMyRequests() {
    if (!user) return;
    const { data: requests } = await supabase.from('blood_requests').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
    if (!requests) return;
    const withCounts = await Promise.all(requests.map(async r => {
      const { data: responses } = await supabase.from('request_responses').select('status').eq('request_id', r.id);
      return { ...r, donor_count: responses?.length ?? 0, accepted_count: responses?.filter(x => x.status === 'accepted').length ?? 0 } as RequestWithResponses;
    }));
    setMyRequests(withCounts);
  }

  useEffect(() => { if (tab === 'history') loadMyRequests(); }, [tab, user]);
  useEffect(() => { supabase.from('hospitals').select('*').then(({ data }) => setHospitals(data ?? [])); }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    if (!form.blood_group) { setError('Select the required blood group.'); return; }
    if (!form.latitude || !form.longitude) { setError('Detect your location.'); return; }

    const logId = generateLogId();
    const initialMode = getInitialMode(profile?.account_tier || 'public');

    setSaving(true); setError('');
    const { error: dbErr } = await supabase.from('blood_requests').insert({
      user_id: user.id, blood_group: form.blood_group,
      latitude: form.latitude, longitude: form.longitude,
      address: form.address, notes: form.notes,
      hospital_name: form.hospital_name,
      urgency: form.urgency, notification_radius: form.notification_radius,
      privacy_mode: initialMode, log_id: logId, status: 'pending',
    });

    if (dbErr) { setError(dbErr.message); setSaving(false); return; }

    setSubmitted(true); setSaving(false);
    setCurrentMode(initialMode);
    if (form.urgency === 'critical') setEscalationActive(true);
    setForm({ blood_group: '', hospital_name: '', address: '', notes: '', urgency: 'urgent', notification_radius: 5, latitude: null, longitude: null });
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

  const modeIcons: Record<PrivacyMode, typeof Shield> = { raksha: Shield, setu: Zap, praana: Heart };
  const ModeIcon = modeIcons[currentMode];

  return (
    <div className="pt-20 min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 rounded-2xl p-6 text-white mb-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="relative flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold mb-1">Request Blood</h1>
              <p className="text-amber-100 text-sm">Send emergency alerts with privacy-aware escalation</p>
            </div>
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center"><AlertCircle size={22} /></div>
          </div>
          {/* Current Privacy Mode */}
          <div className="mt-4 flex items-center gap-2 bg-white/10 rounded-lg px-3 py-2 backdrop-blur-sm">
            <ModeIcon size={14} />
            <span className="text-xs font-medium">Current Mode: {currentMode.charAt(0).toUpperCase() + currentMode.slice(1)}</span>
            <span className="text-xs text-amber-200 ml-auto">{PRIVACY_MODE_CONFIG[currentMode].sanskrit}</span>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex bg-white border border-gray-200 rounded-xl overflow-hidden mb-6">
          {(['new', 'history'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`flex-1 py-3 text-sm font-medium transition-colors ${
                tab === t ? 'bg-amber-50 text-amber-700 border-b-2 border-amber-500' : 'text-gray-500 hover:text-gray-700'
              }`}>
              {t === 'new' ? 'New Request' : 'My Requests'}
            </button>
          ))}
        </div>

        {tab === 'new' && (
          <>
            {submitted ? (
              <div className="space-y-4">
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
                  <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-scale-in">
                    <CheckCircle size={32} className="text-emerald-600" />
                  </div>
                  <h2 className="text-xl font-bold text-gray-900 mb-2">Request Sent!</h2>
                  <p className="text-gray-500 text-sm mb-4">
                    Nearby donors with matching blood group have been notified.
                  </p>

                  {/* Mode badge */}
                  <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold mb-4
                    bg-${PRIVACY_MODE_CONFIG[currentMode].color}-100 text-${PRIVACY_MODE_CONFIG[currentMode].color}-700`}>
                    <ModeIcon size={14} />
                    {currentMode.charAt(0).toUpperCase() + currentMode.slice(1)} Mode Active
                  </div>

                  <button onClick={() => { setSubmitted(false); setEscalationActive(false); }}
                    className="block w-full mt-4 bg-amber-500 hover:bg-amber-600 text-white px-6 py-2.5 rounded-xl font-semibold text-sm transition-colors">
                    Send Another Request
                  </button>
                </div>

                {/* Escalation Timer */}
                {escalationActive && (
                  <EscalationTimer
                    urgency="critical"
                    accountTier={profile?.account_tier || 'public'}
                    isActive={escalationActive}
                    onModeChange={mode => setCurrentMode(mode)}
                    onComplete={() => setEscalationActive(false)}
                  />
                )}
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100">
                  <h2 className="font-semibold text-gray-900">Emergency Blood Request</h2>
                  <p className="text-xs text-gray-500 mt-0.5">All critical requests are identity-logged for safety.</p>
                </div>
                <div className="p-6 space-y-5">
                  {/* Blood Group */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-1.5">
                      <Droplets size={14} /> Required Blood Group <span className="text-red-500">*</span>
                    </label>
                    <div className="grid grid-cols-4 gap-2">
                      {BLOOD_GROUPS.map(g => (
                        <button type="button" key={g} onClick={() => set('blood_group', g)}
                          className={`py-2.5 rounded-lg text-sm font-semibold border-2 transition-all ${
                            form.blood_group === g ? 'bg-red-600 text-white border-red-600 shadow-sm' : 'bg-white text-gray-700 border-gray-200 hover:border-red-300'
                          }`}>{g}</button>
                      ))}
                    </div>
                  </div>

                  {/* Urgency Level */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-1.5">
                      <AlertCircle size={14} /> Urgency Level <span className="text-red-500">*</span>
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {(Object.entries(URGENCY_CONFIG) as [Urgency, typeof URGENCY_CONFIG['critical']][]).map(([key, cfg]) => (
                        <button type="button" key={key} onClick={() => set('urgency', key)}
                          className={`py-3 rounded-lg text-sm font-semibold border-2 transition-all text-center ${
                            form.urgency === key
                              ? `bg-${cfg.color}-600 text-white border-${cfg.color}-600 shadow-sm`
                              : `bg-white text-gray-700 border-gray-200 hover:border-${cfg.color}-300`
                          }`}>
                          <div>{cfg.label}</div>
                          <div className={`text-xs mt-0.5 ${form.urgency === key ? 'text-white/70' : 'text-gray-400'}`}>
                            {cfg.description}
                          </div>
                        </button>
                      ))}
                    </div>
                    {form.urgency === 'critical' && (
                      <div className="mt-2 flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 text-xs px-3 py-2 rounded-lg">
                        <AlertTriangle size={12} className="mt-0.5 flex-shrink-0" />
                        Critical requests trigger auto-escalation: Raksha → Setu → Praana in 3 min. All actions are identity-logged.
                      </div>
                    )}
                  </div>

                  {/* Notification Radius */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-1.5">
                      <Radio size={14} /> Notification Radius
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {RADIUS_OPTIONS.map(opt => (
                        <button type="button" key={opt.value} onClick={() => set('notification_radius', opt.value)}
                          className={`py-2.5 rounded-lg text-sm font-medium border-2 transition-all ${
                            form.notification_radius === opt.value
                              ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-200 hover:border-blue-300'
                          }`}>
                          <div>{opt.label}</div>
                          <div className={`text-xs mt-0.5 ${form.notification_radius === opt.value ? 'text-white/70' : 'text-gray-400'}`}>{opt.description}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Location */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-1.5">
                      <MapPin size={14} /> Location <span className="text-red-500">*</span>
                    </label>
                    <div className="flex gap-2 mb-2">
                      <div className="flex-1 px-3 py-2.5 border border-gray-200 rounded-lg bg-gray-50 text-sm text-gray-600">
                        {form.latitude ? `${form.latitude.toFixed(4)}, ${form.longitude?.toFixed(4)}` : 'No location detected'}
                      </div>
                      <button type="button" onClick={getLocation} disabled={locating}
                        className="flex items-center gap-1.5 px-4 py-2.5 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-lg text-sm font-medium transition-colors border border-amber-200">
                        {locating ? <Loader2 size={14} className="animate-spin" /> : <MapPin size={14} />} Detect
                      </button>
                    </div>
                    <input type="text" value={form.hospital_name} onChange={e => set('hospital_name', e.target.value)}
                      placeholder="Hospital name (helps donors know where to go)"
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 mb-2" />
                    <input type="text" value={form.address} onChange={e => set('address', e.target.value)}
                      placeholder="Address (optional)"
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500" />
                  </div>

                  {/* Notes */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Additional Notes</label>
                    <textarea value={form.notes} onChange={e => set('notes', e.target.value)}
                      placeholder="Patient name, ward, urgency details..."
                      rows={2} className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none" />
                  </div>

                  {error && (
                    <div className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2.5 rounded-lg">
                      <AlertTriangle size={14} className="mt-0.5 flex-shrink-0" /> {error}
                    </div>
                  )}

                  <button type="submit" disabled={saving}
                    className="w-full bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white py-3.5 rounded-xl font-semibold text-sm transition-colors flex items-center justify-center gap-2">
                    {saving ? <Loader2 size={16} className="animate-spin" /> : <AlertCircle size={16} />}
                    Send Emergency Request
                  </button>
                </div>
              </form>
            )}

            {/* ── Enhanced Hospital Fallback ── */}
            <div className="mt-6 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <button onClick={() => setExpandedHospitals(!expandedHospitals)}
                className="w-full flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-2">
                  <Building2 size={16} className="text-blue-600" />
                  <span className="font-semibold text-gray-900 text-sm">Blood Banks & eRaktKosh Data</span>
                  <span className="bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded-full">{hospitals.length}</span>
                </div>
                {expandedHospitals ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
              </button>
              {expandedHospitals && (
                <div>
                  {/* Radius Expander */}
                  <div className="px-6 py-3 bg-blue-50 border-t border-blue-100 flex items-center gap-3">
                    <Search size={14} className="text-blue-600" />
                    <span className="text-xs text-blue-800">Search radius:</span>
                    {[10, 15, 30].map(r => (
                      <button key={r} onClick={() => setSearchRadius(r)}
                        className={`text-xs px-2.5 py-1 rounded-full font-medium transition-colors ${
                          searchRadius === r ? 'bg-blue-600 text-white' : 'bg-white text-blue-600 border border-blue-200'
                        }`}>{r} km</button>
                    ))}
                  </div>
                  <div className="divide-y divide-gray-100">
                    {hospitals.map(h => {
                      const stock = getSimulatedBloodStock(h.name);
                      return (
                        <div key={h.id} className="px-6 py-4">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <div className="font-medium text-gray-900 text-sm">{h.name}</div>
                              <div className="text-xs text-gray-500 mt-0.5">{h.address}</div>
                              {/* Blood Stock */}
                              <div className="mt-2">
                                <div className="text-xs font-medium text-gray-600 mb-1">Blood Stock (eRaktKosh)</div>
                                <div className="flex flex-wrap gap-1">
                                  {stock.map(s => (
                                    <span key={s.bloodGroup} className={`text-xs px-1.5 py-0.5 rounded font-medium ${
                                      s.units > 5 ? 'bg-emerald-100 text-emerald-700' :
                                      s.units > 0 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'
                                    }`}>{s.bloodGroup}: {s.units}u</span>
                                  ))}
                                </div>
                              </div>
                            </div>
                            <div className="flex flex-col items-end gap-1.5">
                              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                                h.is_open ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'
                              }`}>{h.is_open ? 'Open' : 'Closed'}</span>
                              {h.phone && (
                                <a href={`tel:${h.phone}`}
                                  className="flex items-center gap-1 text-xs bg-emerald-100 text-emerald-700 px-2.5 py-1.5 rounded-lg font-medium hover:bg-emerald-200 transition-colors">
                                  <Phone size={12} /> Call
                                </a>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
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
              myRequests.map(req => {
                const sc = statusConfig[req.status] ?? statusConfig.pending;
                const StatusIcon = sc.icon;
                return (
                  <div key={req.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="bg-red-100 text-red-700 px-2.5 py-1 rounded-lg font-bold text-sm">{req.blood_group}</span>
                        <span className={`inline-flex items-center gap-1 bg-${sc.color}-100 text-${sc.color}-700 text-xs px-2 py-1 rounded-full font-medium`}>
                          <StatusIcon size={11} /> {sc.label}
                        </span>
                        <span className={`text-xs px-1.5 py-0.5 rounded bg-${URGENCY_CONFIG[req.urgency]?.color || 'gray'}-100 text-${URGENCY_CONFIG[req.urgency]?.color || 'gray'}-700 font-medium`}>
                          {req.urgency}
                        </span>
                        <span className="text-xs text-gray-400 font-mono">{req.log_id}</span>
                      </div>
                      <div className="text-xs text-gray-400">{new Date(req.created_at).toLocaleDateString('en-IN')}</div>
                    </div>
                    <div className="px-4 py-3">
                      {req.hospital_name && <div className="text-sm text-gray-700 mb-1 flex items-center gap-1"><Building2 size={12} /> {req.hospital_name}</div>}
                      {req.address && <div className="text-xs text-gray-500 mb-1">{req.address}</div>}
                      {req.notes && <div className="text-xs text-gray-500 mb-2">{req.notes}</div>}
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span>{req.donor_count} notified</span>
                        {req.accepted_count > 0 && <span className="text-emerald-600 font-medium">{req.accepted_count} accepted</span>}
                        <span className="text-gray-400">{req.notification_radius}km radius</span>
                      </div>
                    </div>
                    {req.status === 'pending' && (
                      <div className="px-4 pb-3">
                        <button onClick={() => cancelRequest(req.id)} className="text-xs text-gray-400 hover:text-red-600 transition-colors">Cancel request</button>
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
