import { useEffect, useState } from 'react';
import { Bell, CheckCircle, XCircle, Clock, Phone, MapPin, Loader2, Droplets, Shield, Zap, Heart, AlertTriangle, Building2, ThumbsUp, ThumbsDown } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { BloodRequest, RequestResponse, Profile, PrivacyMode, Urgency } from '../lib/database.types';
import { PRIVACY_MODE_CONFIG, URGENCY_CONFIG } from '../lib/database.types';
import { useAuth } from '../context/AuthContext';

interface PendingAlert { response: RequestResponse; request: BloodRequest; }
interface AcceptedDonation { response: RequestResponse; request: BloodRequest; requester?: Partial<Profile>; donor?: Partial<Profile>; }

const modeIcons: Record<PrivacyMode, typeof Shield> = { raksha: Shield, setu: Zap, praana: Heart };

export default function Notifications() {
  const { user } = useAuth();
  const [tab, setTab] = useState<'incoming' | 'outgoing'>('incoming');
  const [loading, setLoading] = useState(true);
  const [pendingAlerts, setPendingAlerts] = useState<PendingAlert[]>([]);
  const [accepted, setAccepted] = useState<AcceptedDonation[]>([]);
  const [myOutgoing, setMyOutgoing] = useState<AcceptedDonation[]>([]);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);

  async function loadIncoming() {
    if (!user) return;
    setLoading(true);
    const { data: myResponses } = await supabase.from('request_responses').select('*').eq('donor_id', user.id).order('created_at', { ascending: false });
    if (!myResponses) { setLoading(false); return; }
    const pending: PendingAlert[] = []; const acc: AcceptedDonation[] = [];
    for (const resp of myResponses) {
      const { data: req } = await supabase.from('blood_requests').select('*').eq('id', resp.request_id).maybeSingle();
      if (!req) continue;
      if (resp.status === 'pending') {
        pending.push({ response: resp as RequestResponse, request: req as BloodRequest });
      } else if (resp.status === 'accepted') {
        const { data: rp } = await supabase.from('profiles').select('full_name, phone').eq('id', req.user_id).maybeSingle();
        acc.push({ response: resp as RequestResponse, request: req as BloodRequest, requester: rp ?? {} });
      }
    }
    setPendingAlerts(pending); setAccepted(acc); setLoading(false);
  }

  async function loadOutgoing() {
    if (!user) return;
    setLoading(true);
    const { data: myReqs } = await supabase.from('blood_requests').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
    if (!myReqs) { setLoading(false); return; }
    const results: AcceptedDonation[] = [];
    for (const req of myReqs) {
      const { data: responses } = await supabase.from('request_responses').select('*').eq('request_id', req.id).eq('status', 'accepted');
      for (const resp of responses ?? []) {
        const { data: dp } = await supabase.from('profiles').select('full_name, phone, blood_group').eq('id', resp.donor_id).maybeSingle();
        results.push({ response: resp as RequestResponse, request: req as BloodRequest, donor: dp ?? {} });
      }
    }
    setMyOutgoing(results); setLoading(false);
  }

  useEffect(() => { if (tab === 'incoming') loadIncoming(); else loadOutgoing(); }, [tab, user]);

  async function respondToRequest(responseId: string, status: 'accepted' | 'declined') {
    setActionLoading(responseId);
    await supabase.from('request_responses').update({ status, updated_at: new Date().toISOString() }).eq('id', responseId);
    await loadIncoming();
    setActionLoading(null);
  }

  async function confirmDonation(responseId: string, _confirmed: boolean) {
    setConfirmingId(responseId);
    // In production this would update donation_confirmations table
    await new Promise(r => setTimeout(r, 800));
    setConfirmingId(null);
    // Reload to reflect changes
    if (tab === 'incoming') await loadIncoming();
    else await loadOutgoing();
  }

  function getRevealInfo(request: BloodRequest) {
    const mode = (request.privacy_mode || 'raksha') as PrivacyMode;
    const urgency = (request.urgency || 'urgent') as Urgency;
    const ModeIcon = modeIcons[mode] || Shield;
    const modeConfig = PRIVACY_MODE_CONFIG[mode];
    const urgencyConfig = URGENCY_CONFIG[urgency];
    return { mode, urgency, ModeIcon, modeConfig, urgencyConfig };
  }

  return (
    <div className="pt-20 min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-700 to-slate-800 rounded-2xl p-6 text-white mb-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="relative flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold mb-1">Notifications</h1>
              <p className="text-slate-300 text-sm">Manage requests with privacy-aware contact reveal</p>
            </div>
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center"><Bell size={22} /></div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex bg-white border border-gray-200 rounded-xl overflow-hidden mb-6">
          <button onClick={() => setTab('incoming')}
            className={`flex-1 py-3 text-sm font-medium transition-colors ${
              tab === 'incoming' ? 'bg-slate-50 text-slate-700 border-b-2 border-slate-600' : 'text-gray-500 hover:text-gray-700'
            }`}>
            Donation Requests
            {pendingAlerts.length > 0 && (
              <span className="ml-2 inline-flex items-center justify-center w-5 h-5 bg-red-600 text-white text-xs rounded-full font-bold">{pendingAlerts.length}</span>
            )}
          </button>
          <button onClick={() => setTab('outgoing')}
            className={`flex-1 py-3 text-sm font-medium transition-colors ${
              tab === 'outgoing' ? 'bg-slate-50 text-slate-700 border-b-2 border-slate-600' : 'text-gray-500 hover:text-gray-700'
            }`}>Donor Matches</button>
        </div>

        {loading ? (
          <div className="flex justify-center py-16"><Loader2 size={28} className="animate-spin text-slate-400" /></div>
        ) : tab === 'incoming' ? (
          <div className="space-y-4">
            {pendingAlerts.length > 0 && (
              <>
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Awaiting Your Response</h3>
                {pendingAlerts.map(({ response, request }) => {
                  const { mode, urgency, ModeIcon, modeConfig, urgencyConfig } = getRevealInfo(request);
                  return (
                    <div key={response.id} className="bg-white rounded-xl shadow-sm border-2 border-amber-200 overflow-hidden animate-in">
                      <div className="flex items-center justify-between px-4 py-3 bg-amber-50 border-b border-amber-100">
                        <div className="flex items-center gap-2">
                          <Clock size={14} className="text-amber-600" />
                          <span className="text-sm font-semibold text-amber-800">Donation Request</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {/* Urgency Badge */}
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium bg-${urgencyConfig?.color || 'gray'}-100 text-${urgencyConfig?.color || 'gray'}-700`}>
                            {urgencyConfig?.label || urgency}
                          </span>
                          {/* Mode Badge */}
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium bg-${modeConfig?.color || 'gray'}-100 text-${modeConfig?.color || 'gray'}-700 flex items-center gap-1`}>
                            <ModeIcon size={10} /> {mode}
                          </span>
                        </div>
                      </div>
                      <div className="p-4">
                        <div className="flex items-start justify-between gap-3 mb-3">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="bg-red-100 text-red-700 px-2.5 py-1 rounded-lg font-bold text-sm">{request.blood_group}</span>
                              <span className="text-xs text-gray-500">needed urgently</span>
                            </div>
                            {request.hospital_name && (
                              <div className="flex items-center gap-1 text-xs text-gray-600 font-medium"><Building2 size={11} /> {request.hospital_name}</div>
                            )}
                            {request.address && (
                              <div className="flex items-center gap-1 text-xs text-gray-500 mt-0.5"><MapPin size={11} /> {request.address}</div>
                            )}
                            {request.notes && <p className="text-xs text-gray-600 mt-1">{request.notes}</p>}
                          </div>
                          <div className="text-xs text-gray-400 whitespace-nowrap">{new Date(request.created_at).toLocaleDateString('en-IN')}</div>
                        </div>

                        {/* Privacy Mode Info */}
                        <div className={`bg-${modeConfig?.color || 'gray'}-50 rounded-lg p-3 text-xs text-${modeConfig?.color || 'gray'}-800 mb-4`}>
                          <div className="flex items-center gap-1.5 mb-1 font-semibold">
                            <ModeIcon size={12} />
                            {mode.charAt(0).toUpperCase() + mode.slice(1)} Mode — {modeConfig?.label}
                          </div>
                          {mode === 'raksha' && 'Your contact will only be shared after you accept.'}
                          {mode === 'setu' && "The patient's number has been shared with you. You can call directly."}
                          {mode === 'praana' && 'Full mutual reveal — both contacts are visible immediately.'}
                        </div>

                        <div className="flex gap-2">
                          <button onClick={() => respondToRequest(response.id, 'accepted')} disabled={actionLoading === response.id}
                            className="flex-1 flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 rounded-lg text-sm font-semibold transition-colors">
                            {actionLoading === response.id ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle size={14} />}
                            Accept & Reveal Contact
                          </button>
                          <button onClick={() => respondToRequest(response.id, 'declined')} disabled={actionLoading === response.id}
                            className="flex-1 flex items-center justify-center gap-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2.5 rounded-lg text-sm font-semibold transition-colors">
                            <XCircle size={14} /> Decline
                          </button>
                        </div>

                        {urgency === 'critical' && (
                          <div className="mt-3 flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 text-xs px-3 py-2 rounded-lg">
                            <AlertTriangle size={12} className="mt-0.5 flex-shrink-0" />
                            This is a <strong>critical</strong> request. Declining will reduce your trust score by 3 points.
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </>
            )}

            {/* Accepted - with donation confirmation */}
            {accepted.length > 0 && (
              <>
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mt-2">Accepted — Contact Info</h3>
                {accepted.map(({ response, request, requester }) => (
                  <div key={response.id} className="bg-white rounded-xl shadow-sm border border-emerald-200 overflow-hidden">
                    <div className="flex items-center gap-2 px-4 py-3 bg-emerald-50 border-b border-emerald-100">
                      <CheckCircle size={14} className="text-emerald-600" />
                      <span className="text-sm font-semibold text-emerald-800">You accepted this request</span>
                    </div>
                    <div className="p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <span className="bg-red-100 text-red-700 px-2.5 py-1 rounded-lg font-bold text-sm">{request.blood_group}</span>
                        {request.hospital_name && <span className="text-xs text-gray-500 flex items-center gap-1"><Building2 size={11} />{request.hospital_name}</span>}
                      </div>
                      <div className="bg-emerald-50 rounded-lg p-3 space-y-1.5 mb-4">
                        <div className="text-xs font-semibold text-emerald-800 mb-2">Patient Contact</div>
                        {requester?.full_name && (
                          <div className="flex items-center gap-2 text-sm text-gray-700">
                            <span className="text-xs text-gray-500 w-16">Name</span> {requester.full_name}
                          </div>
                        )}
                        {requester?.phone && (
                          <a href={`tel:${requester.phone}`} className="flex items-center gap-2 text-sm text-emerald-700 font-medium">
                            <Phone size={14} /> {requester.phone}
                          </a>
                        )}
                      </div>

                      {/* Donation Confirmation */}
                      <div className="bg-blue-50 rounded-lg p-3 border border-blue-100">
                        <div className="text-xs font-semibold text-blue-800 mb-2">Did the donation happen?</div>
                        <div className="flex gap-2">
                          <button onClick={() => confirmDonation(response.id, true)} disabled={confirmingId === response.id}
                            className="flex-1 flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white py-2 rounded-lg text-xs font-semibold transition-colors">
                            {confirmingId === response.id ? <Loader2 size={12} className="animate-spin" /> : <ThumbsUp size={12} />} Yes, donated
                          </button>
                          <button onClick={() => confirmDonation(response.id, false)} disabled={confirmingId === response.id}
                            className="flex-1 flex items-center justify-center gap-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 rounded-lg text-xs font-semibold transition-colors">
                            <ThumbsDown size={12} /> No, cancelled
                          </button>
                        </div>
                        <p className="text-xs text-blue-600 mt-2">Both parties must confirm. Unconfirmed critical requests affect trust score.</p>
                      </div>
                    </div>
                  </div>
                ))}
              </>
            )}

            {pendingAlerts.length === 0 && accepted.length === 0 && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-10 text-center text-gray-400">
                <Bell size={32} className="mx-auto mb-3 opacity-30" />
                <div className="text-sm">No donation requests yet</div>
                <div className="text-xs mt-1">Make sure your donor profile is marked as available</div>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {myOutgoing.length === 0 ? (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-10 text-center text-gray-400">
                <Droplets size={32} className="mx-auto mb-3 opacity-30" />
                <div className="text-sm">No donors have accepted your requests yet</div>
              </div>
            ) : (
              myOutgoing.map(({ response, request, donor }) => (
                <div key={response.id} className="bg-white rounded-xl shadow-sm border border-emerald-200 overflow-hidden">
                  <div className="flex items-center gap-2 px-4 py-3 bg-emerald-50 border-b border-emerald-100">
                    <CheckCircle size={14} className="text-emerald-600" />
                    <span className="text-sm font-semibold text-emerald-800">Donor Found!</span>
                  </div>
                  <div className="p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="bg-red-100 text-red-700 px-2.5 py-1 rounded-lg font-bold text-sm">{request.blood_group}</span>
                      {request.hospital_name && <span className="text-xs text-gray-500 flex items-center gap-1"><Building2 size={11} />{request.hospital_name}</span>}
                    </div>
                    <div className="bg-emerald-50 rounded-lg p-3 space-y-1.5 mb-4">
                      <div className="text-xs font-semibold text-emerald-800 mb-2">Donor Contact</div>
                      {donor?.full_name && <div className="flex items-center gap-2 text-sm text-gray-700"><span className="text-xs text-gray-500 w-16">Name</span> {donor.full_name}</div>}
                      {donor?.blood_group && <div className="flex items-center gap-2 text-sm text-gray-700"><span className="text-xs text-gray-500 w-16">Blood</span> <span className="bg-red-100 text-red-700 px-1.5 py-0.5 rounded text-xs font-bold">{donor.blood_group}</span></div>}
                      {donor?.phone && <a href={`tel:${donor.phone}`} className="flex items-center gap-2 text-sm text-emerald-700 font-medium"><Phone size={14} /> {donor.phone}</a>}
                    </div>

                    {/* Donation Confirmation for requester */}
                    <div className="bg-blue-50 rounded-lg p-3 border border-blue-100">
                      <div className="text-xs font-semibold text-blue-800 mb-2">Confirm donation</div>
                      <div className="flex gap-2">
                        <button onClick={() => confirmDonation(response.id, true)} disabled={confirmingId === response.id}
                          className="flex-1 flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white py-2 rounded-lg text-xs font-semibold transition-colors">
                          {confirmingId === response.id ? <Loader2 size={12} className="animate-spin" /> : <ThumbsUp size={12} />} Yes, received
                        </button>
                        <button onClick={() => confirmDonation(response.id, false)} disabled={confirmingId === response.id}
                          className="flex-1 flex items-center justify-center gap-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 rounded-lg text-xs font-semibold transition-colors">
                          <ThumbsDown size={12} /> No
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
