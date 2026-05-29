import { useEffect, useRef, useState } from 'react';
import { Heart, MapPin, Bell, Shield, ChevronRight, Droplets, Clock, Zap, Lock, Eye, Award, TrendingUp, Building2, CheckCircle } from 'lucide-react';

interface LandingProps { onGetStarted: () => void; }

function AnimatedCounter({ end, suffix = '' }: { end: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        let start = 0;
        const step = Math.max(1, Math.floor(end / 40));
        const timer = setInterval(() => {
          start += step;
          if (start >= end) { setCount(end); clearInterval(timer); }
          else setCount(start);
        }, 30);
        observer.disconnect();
      }
    }, { threshold: 0.5 });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [end]);
  return <div ref={ref} className="text-4xl md:text-5xl font-bold">{count.toLocaleString('en-IN')}{suffix}</div>;
}

function useScrollReveal() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { el.classList.add('visible'); obs.disconnect(); } }, { threshold: 0.15 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return ref;
}

function RevealSection({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  const ref = useScrollReveal();
  return <div ref={ref} className={`reveal ${className}`}>{children}</div>;
}

export default function Landing({ onGetStarted }: LandingProps) {
  return (
    <div className="min-h-screen bg-white overflow-hidden">
      {/* ── Hero ── */}
      <section className="relative pt-24 pb-24 px-4 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-red-50 via-white to-rose-50" />
        <div className="absolute top-20 right-10 w-72 h-72 bg-red-100 rounded-full opacity-30 animate-float" />
        <div className="absolute bottom-10 left-10 w-48 h-48 bg-rose-100 rounded-full opacity-30 animate-float-delayed" />
        {/* Particles */}
        <div className="particles">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="particle" style={{ left: `${10 + i * 12}%`, top: `${20 + (i % 3) * 25}%`, animationDelay: `${i * 0.8}s`, width: `${4 + i % 3 * 3}px`, height: `${4 + i % 3 * 3}px` }} />
          ))}
        </div>

        <div className="relative max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-red-100/80 text-red-700 px-5 py-2.5 rounded-full text-sm font-medium mb-8 animate-slide-down backdrop-blur-sm">
            <Droplets size={14} className="animate-heartbeat" />
            Real-time Emergency Blood Coordination
          </div>

          <h1 className="text-5xl md:text-7xl font-black text-gray-900 leading-[1.1] mb-6 animate-slide-up">
            Life Map
            <span className="block bg-gradient-to-r from-red-600 via-rose-500 to-red-700 bg-clip-text text-transparent mt-2 animate-gradient">
              Bridge of Life
            </span>
          </h1>

          <p className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed mb-10 animate-slide-up stagger-2">
            A real-time, map-based network that instantly connects patients in need of blood with nearby willing donors.
            Privacy-first. Identity-verified. Life-saving.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center animate-slide-up stagger-3">
            <button onClick={onGetStarted} className="inline-flex items-center gap-2 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white px-8 py-4 rounded-2xl font-semibold text-lg transition-all duration-300 shadow-lg hover:shadow-2xl hover:-translate-y-1 animate-pulse-glow">
              Get Started <ChevronRight size={20} />
            </button>
            <a href="#how-it-works" className="inline-flex items-center gap-2 bg-white/80 hover:bg-white text-gray-700 px-8 py-4 rounded-2xl font-semibold text-lg border border-gray-200 transition-all duration-300 backdrop-blur-sm hover:-translate-y-0.5">
              How It Works
            </a>
          </div>
        </div>
      </section>

      {/* ── Stats ── */}
      <section className="bg-gradient-to-r from-red-600 via-rose-600 to-red-700 py-14 px-4">
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 text-center text-white">
          <div><AnimatedCounter end={12500} suffix="+" /><div className="text-red-200 text-sm mt-1">Units needed daily across India</div></div>
          <div><AnimatedCounter end={1500000} /><div className="text-red-200 text-sm mt-1">Lives lost yearly due to blood shortage</div></div>
          <div><div className="text-4xl md:text-5xl font-bold">&lt;5 min</div><div className="text-red-200 text-sm mt-1">Average donor match time</div></div>
        </div>
      </section>

      {/* ── Origin Story ── */}
      <RevealSection>
        <section className="py-20 px-4 bg-white">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-amber-100 text-amber-700 px-4 py-2 rounded-full text-sm font-medium mb-6">
              <Heart size={14} /> Our Story
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">Born from a WhatsApp group</h2>
            <p className="text-gray-600 leading-relaxed text-lg mb-4">
              One of our team members watched his father run a blood donor coordination group since 2021 — manually
              matching donors to patients through calls and messages. It worked within its limits, but was confined to a
              small area and depended entirely on one person.
            </p>
            <p className="text-gray-600 leading-relaxed text-lg">
              We asked a simple question — <strong className="text-gray-900">why does someone in a medical emergency still have
              to rely on a WhatsApp group to find blood in 2025?</strong> We looked for better solutions. We found nothing
              that genuinely solved it. So we decided to build it ourselves.
            </p>
          </div>
        </section>
      </RevealSection>

      {/* ── How It Works ── */}
      <section id="how-it-works" className="py-20 px-4 bg-gray-50">
        <div className="max-w-5xl mx-auto">
          <RevealSection>
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">How It Works</h2>
              <p className="text-gray-500 max-w-xl mx-auto">A privacy-first system designed for emergencies</p>
            </div>
          </RevealSection>
          <div className="grid md:grid-cols-2 gap-12">
            <RevealSection>
              <div>
                <div className="inline-flex items-center gap-2 bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-sm font-medium mb-6"><Heart size={14} /> For Donors</div>
                <div className="space-y-5">
                  {[
                    { step: '1', title: 'Register & Set Blood Group', desc: 'Sign up with your blood group and approximate location.' },
                    { step: '2', title: 'Toggle Availability', desc: 'One switch makes you visible on the live map. Flip it off anytime.' },
                    { step: '3', title: 'Receive Smart Alerts', desc: 'Get notified with urgency level and distance — no spam, only nearby matches.' },
                    { step: '4', title: 'Accept & Reveal Contact', desc: 'Only when you accept does your contact become visible — mutual consent always.' },
                  ].map(item => (
                    <div key={item.step} className="flex gap-4">
                      <div className="flex-shrink-0 w-8 h-8 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center text-sm font-bold">{item.step}</div>
                      <div><h4 className="font-semibold text-gray-900">{item.title}</h4><p className="text-gray-500 text-sm mt-0.5">{item.desc}</p></div>
                    </div>
                  ))}
                </div>
              </div>
            </RevealSection>
            <RevealSection>
              <div>
                <div className="inline-flex items-center gap-2 bg-red-100 text-red-700 px-3 py-1 rounded-full text-sm font-medium mb-6"><Droplets size={14} /> For Patients / Families</div>
                <div className="space-y-5">
                  {[
                    { step: '1', title: 'Select Blood Group & Urgency', desc: 'Choose the blood group needed and set Critical, Urgent, or Planned.' },
                    { step: '2', title: 'Set Notification Radius', desc: 'Choose 2km, 5km, or 10km to control how wide the alert goes.' },
                    { step: '3', title: 'Auto-Escalation', desc: 'For critical requests, privacy mode auto-escalates to ensure fastest response.' },
                    { step: '4', title: 'Hospital Fallback', desc: 'If no donors respond, see live blood bank stock from eRaktKosh.' },
                  ].map(item => (
                    <div key={item.step} className="flex gap-4">
                      <div className="flex-shrink-0 w-8 h-8 bg-red-100 text-red-700 rounded-full flex items-center justify-center text-sm font-bold">{item.step}</div>
                      <div><h4 className="font-semibold text-gray-900">{item.title}</h4><p className="text-gray-500 text-sm mt-0.5">{item.desc}</p></div>
                    </div>
                  ))}
                </div>
              </div>
            </RevealSection>
          </div>
        </div>
      </section>

      {/* ── Privacy Modes ── */}
      <RevealSection>
        <section className="py-20 px-4 bg-white">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-14">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">Graduated Privacy System</h2>
              <p className="text-gray-500 max-w-2xl mx-auto">Three modes named in Sanskrit, each unlocking more contact sharing based on urgency and trust</p>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="mode-card bg-emerald-50 rounded-2xl p-6 border border-emerald-100">
                <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center mb-4">
                  <Shield size={22} className="text-emerald-600" />
                </div>
                <div className="flex items-baseline gap-2 mb-1">
                  <h3 className="text-xl font-bold text-gray-900">Raksha</h3>
                  <span className="text-sm text-gray-500">रक्षा</span>
                </div>
                <div className="text-xs font-semibold text-emerald-700 mb-3">Protection</div>
                <p className="text-sm text-gray-600 leading-relaxed mb-4">Default mode. Donor must accept before any contact is revealed. Both parties consent first.</p>
                <div className="text-xs text-gray-400 flex items-center gap-1"><Lock size={11} /> All accounts</div>
              </div>
              <div className="mode-card bg-amber-50 rounded-2xl p-6 border border-amber-100">
                <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center mb-4">
                  <Zap size={22} className="text-amber-600" />
                </div>
                <div className="flex items-baseline gap-2 mb-1">
                  <h3 className="text-xl font-bold text-gray-900">Setu</h3>
                  <span className="text-sm text-gray-500">सेतु</span>
                </div>
                <div className="text-xs font-semibold text-amber-700 mb-3">Bridge</div>
                <p className="text-sm text-gray-600 leading-relaxed mb-4">Patient's number is pushed to donor immediately. Donor can call without accepting. Faster path.</p>
                <div className="text-xs text-gray-400 flex items-center gap-1"><Lock size={11} /> NGO+ or auto-escalated</div>
              </div>
              <div className="mode-card bg-red-50 rounded-2xl p-6 border border-red-100">
                <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center mb-4">
                  <Heart size={22} className="text-red-600" />
                </div>
                <div className="flex items-baseline gap-2 mb-1">
                  <h3 className="text-xl font-bold text-gray-900">Praana</h3>
                  <span className="text-sm text-gray-500">प्राण</span>
                </div>
                <div className="text-xs font-semibold text-red-700 mb-3">Life Force</div>
                <p className="text-sm text-gray-600 leading-relaxed mb-4">Full mutual reveal. Both see each other instantly. For life-or-death situations only.</p>
                <div className="text-xs text-gray-400 flex items-center gap-1"><Lock size={11} /> Hospital or auto-escalated</div>
              </div>
            </div>
            <div className="mt-8 text-center">
              <div className="inline-flex items-center gap-4 bg-gray-900 text-white px-6 py-3 rounded-xl text-sm">
                <Clock size={16} className="text-amber-400" />
                <span>Critical requests auto-escalate: <strong>Raksha → Setu → Praana</strong> in 3 minutes</span>
              </div>
            </div>
          </div>
        </section>
      </RevealSection>

      {/* ── Trust & Gamification ── */}
      <RevealSection>
        <section className="py-20 px-4 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-14">
              <h2 className="text-3xl md:text-4xl font-bold mb-3">Trust Score System</h2>
              <p className="text-gray-400 max-w-xl mx-auto">Every action builds or erodes trust. Your score determines what you can do.</p>
            </div>
            <div className="grid md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-emerald-400 flex items-center gap-2"><TrendingUp size={18} /> Earn Points</h3>
                {[
                  { action: 'Confirmed donation', pts: '+5' },
                  { action: 'Fast response (under 2 min)', pts: '+2' },
                  { action: 'Aadhaar verification', pts: '+5' },
                ].map(r => (
                  <div key={r.action} className="flex items-center justify-between bg-white/5 rounded-xl px-4 py-3 border border-white/10">
                    <span className="text-sm text-gray-300">{r.action}</span>
                    <span className="text-emerald-400 font-bold">{r.pts}</span>
                  </div>
                ))}
                <h3 className="text-lg font-semibold text-red-400 flex items-center gap-2 pt-2"><TrendingUp size={18} className="rotate-180" /> Lose Points</h3>
                {[
                  { action: 'Declined request', pts: '-3' },
                  { action: 'Unconfirmed critical request', pts: '-10' },
                ].map(r => (
                  <div key={r.action} className="flex items-center justify-between bg-white/5 rounded-xl px-4 py-3 border border-white/10">
                    <span className="text-sm text-gray-300">{r.action}</span>
                    <span className="text-red-400 font-bold">{r.pts}</span>
                  </div>
                ))}
              </div>
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-blue-400 flex items-center gap-2"><Award size={18} /> Tier Unlocks</h3>
                <div className="flex items-center justify-between bg-white/5 rounded-xl px-4 py-3 border border-gray-500/30">
                    <div><span className="text-sm font-semibold text-white">Standard</span><span className="text-xs text-gray-500 ml-2">(0 – 59)</span></div>
                    <span className="text-xs text-gray-400">Raksha only</span>
                  </div>
                  <div className="flex items-center justify-between bg-white/5 rounded-xl px-4 py-3 border border-blue-500/30">
                    <div><span className="text-sm font-semibold text-white">Verified</span><span className="text-xs text-gray-500 ml-2">(60 – 84)</span></div>
                    <span className="text-xs text-blue-400">Raksha + Setu</span>
                  </div>
                  <div className="flex items-center justify-between bg-white/5 rounded-xl px-4 py-3 border border-emerald-500/30">
                    <div><span className="text-sm font-semibold text-white">Trusted</span><span className="text-xs text-gray-500 ml-2">(85 – 100)</span></div>
                    <span className="text-xs text-emerald-400">All modes</span>
                  </div>
                  <div className="flex items-center justify-between bg-white/5 rounded-xl px-4 py-3 border border-red-500/30">
                    <div><span className="text-sm font-semibold text-white">Under Review</span><span className="text-xs text-gray-500 ml-2">(Below 20)</span></div>
                    <span className="text-xs text-red-400">Account suspended</span>
                  </div>
              </div>
            </div>
          </div>
        </section>
      </RevealSection>

      {/* ── Features Grid ── */}
      <RevealSection>
        <section className="py-20 px-4 bg-gray-50">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-14">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">Built for Emergencies</h2>
              <p className="text-gray-500">Every feature designed to save time when seconds count</p>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                { icon: MapPin, title: 'Live Map View', desc: 'Real-time map with ±500m location blur for donor privacy.', bg: 'bg-red-100', text: 'text-red-600' },
                { icon: Bell, title: 'Smart Alerts', desc: 'Radius-based notifications. Critical alerts bypass Do Not Disturb.', bg: 'bg-amber-100', text: 'text-amber-600' },
                { icon: Shield, title: 'Privacy First', desc: 'Consent-gated contact reveal. No public phone numbers ever.', bg: 'bg-blue-100', text: 'text-blue-600' },
                { icon: Clock, title: 'Auto-Escalation', desc: '90-second timer automatically upgrades privacy mode for critical cases.', bg: 'bg-emerald-100', text: 'text-emerald-600' },
                { icon: Building2, title: 'eRaktKosh Fallback', desc: 'If no donors respond, see real-time blood bank stock nearby.', bg: 'bg-purple-100', text: 'text-purple-600' },
                { icon: Eye, title: 'Abuse Prevention', desc: 'GPS verification, identity logging, and trust score penalties.', bg: 'bg-rose-100', text: 'text-rose-600' },
              ].map(({ icon: Icon, title, desc, bg, text }) => (
                <div key={title} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
                  <div className={`w-12 h-12 ${bg} ${text} rounded-xl flex items-center justify-center mb-4`}>
                    <Icon size={22} />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">{title}</h3>
                  <p className="text-gray-500 text-sm leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </RevealSection>

      {/* ── Abuse Prevention ── */}
      <RevealSection>
        <section className="py-20 px-4 bg-white">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-14">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">Four Layers of Protection</h2>
              <p className="text-gray-500">Powerful features need powerful safeguards</p>
            </div>
            <div className="grid sm:grid-cols-2 gap-5">
              {[
                { icon: Lock, title: 'Identity Logging', desc: 'Every critical request logged with Aadhaar ID, GPS, and timestamp. Format: PS-YYYYMMDD-XXXX.' },
                { icon: CheckCircle, title: 'Post-Event Confirmation', desc: 'Both donor and patient confirm if donation happened. Unconfirmed requests are auto-flagged.' },
                { icon: TrendingUp, title: 'Trust Score Penalties', desc: '-10 points for unconfirmed critical requests. 3 strikes in 30 days = account suspension.' },
                { icon: MapPin, title: 'GPS Verification', desc: "System checks if requester's GPS matches the named hospital. Mismatches trigger review." },
              ].map(({ icon: Icon, title, desc }) => (
                <div key={title} className="flex gap-4 p-5 bg-gray-50 rounded-xl border border-gray-100">
                  <div className="flex-shrink-0 w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center"><Icon size={18} className="text-red-600" /></div>
                  <div><h4 className="font-semibold text-gray-900 mb-1">{title}</h4><p className="text-sm text-gray-500 leading-relaxed">{desc}</p></div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </RevealSection>

      {/* ── CTA ── */}
      <section className="py-24 px-4 bg-gradient-to-br from-red-600 via-rose-600 to-red-700 text-white text-center relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="absolute rounded-full bg-white" style={{ width: `${60 + i * 40}px`, height: `${60 + i * 40}px`, left: `${10 + i * 20}%`, top: `${20 + (i % 2) * 40}%`, animationDelay: `${i * 1.5}s` }} />
          ))}
        </div>
        <div className="relative max-w-2xl mx-auto">
          <div className="animate-heartbeat inline-block mb-6"><Heart size={48} className="text-red-200" /></div>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Join the Life Map Network</h2>
          <p className="text-red-100 mb-10 text-lg">Register as a donor and be ready to save a life at a moment's notice. Your blood group could be the one someone desperately needs right now.</p>
          <button onClick={onGetStarted} className="inline-flex items-center gap-2 bg-white text-red-600 hover:bg-red-50 px-10 py-4 rounded-2xl font-semibold text-lg transition-all duration-300 shadow-xl hover:shadow-2xl hover:-translate-y-1">
            Register as a Donor <ChevronRight size={20} />
          </button>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="bg-gray-900 text-gray-400 py-10 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-2 text-white font-bold"><Droplets size={20} className="text-red-500" /> Life Map</div>
            <div className="flex items-center gap-4 text-xs">
              <span>Built By GKCIET, Malda</span>
              <span>~</span>
              <span>For The Humanity</span>
            </div>
          </div>
          <div className="text-center text-xs text-gray-600">
            Real-time emergency blood donation network. Privacy-first. Identity-verified. Life-saving.
          </div>
        </div>
      </footer>
    </div>
  );
}
