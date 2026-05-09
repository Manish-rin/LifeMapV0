import { Heart, MapPin, Bell, Shield, ChevronRight, Droplets, Clock, Users } from 'lucide-react';

interface LandingProps {
  onGetStarted: () => void;
}

export default function Landing({ onGetStarted }: LandingProps) {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-red-50 via-white to-rose-50 pt-24 pb-20 px-4">
        <div className="absolute top-0 right-0 w-96 h-96 bg-red-100 rounded-full -translate-y-1/2 translate-x-1/2 opacity-40" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-rose-100 rounded-full translate-y-1/2 -translate-x-1/2 opacity-40" />
        <div className="relative max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-red-100 text-red-700 px-4 py-2 rounded-full text-sm font-medium mb-6">
            <Droplets size={14} />
            Real-time Emergency Blood Network
          </div>
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 leading-tight mb-6">
            Life Map
            <span className="block text-red-600 mt-1">Connecting Lives</span>
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed mb-10">
            A real-time, map-based network that instantly connects patients in need of blood with nearby willing donors. No delays. No chaos. Just help, exactly when it matters.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={onGetStarted}
              className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-200 shadow-lg hover:shadow-xl hover:-translate-y-0.5"
            >
              Get Started
              <ChevronRight size={20} />
            </button>
            <a
              href="#how-it-works"
              className="inline-flex items-center gap-2 bg-white hover:bg-gray-50 text-gray-700 px-8 py-4 rounded-xl font-semibold text-lg border border-gray-200 transition-all duration-200"
            >
              How It Works
            </a>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="bg-red-600 py-12 px-4">
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 text-center text-white">
          {[
            { value: '4.5M', label: 'Units of blood needed daily in India' },
            { value: '1.5M', label: 'Lives lost yearly due to blood shortage' },
            { value: '<5min', label: 'Average donor match time with Life Map' },
          ].map((s) => (
            <div key={s.label}>
              <div className="text-4xl font-bold mb-1">{s.value}</div>
              <div className="text-red-200 text-sm">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 px-4 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-3">How Life Map Works</h2>
            <p className="text-gray-500 max-w-xl mx-auto">A simple, privacy-first system designed for emergencies</p>
          </div>
          <div className="grid md:grid-cols-2 gap-12">
            {/* Donor flow */}
            <div>
              <div className="inline-flex items-center gap-2 bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-sm font-medium mb-6">
                <Heart size={14} /> For Donors
              </div>
              <div className="space-y-6">
                {[
                  { step: '1', title: 'Register & Set Blood Group', desc: 'Sign up with your blood group and approximate location to join the network.' },
                  { step: '2', title: 'Toggle Availability', desc: 'Mark yourself as available whenever you\'re ready to donate. You appear on the Life Map instantly.' },
                  { step: '3', title: 'Receive Alerts', desc: 'Get notified when someone nearby needs your blood group urgently.' },
                  { step: '4', title: 'Accept & Connect', desc: 'Accept the request to share contact details with the patient and coordinate the donation.' },
                ].map((item) => (
                  <div key={item.step} className="flex gap-4">
                    <div className="flex-shrink-0 w-8 h-8 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center text-sm font-bold">
                      {item.step}
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">{item.title}</h4>
                      <p className="text-gray-500 text-sm mt-0.5">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            {/* Requester flow */}
            <div>
              <div className="inline-flex items-center gap-2 bg-red-100 text-red-700 px-3 py-1 rounded-full text-sm font-medium mb-6">
                <Droplets size={14} /> For Patients / Families
              </div>
              <div className="space-y-6">
                {[
                  { step: '1', title: 'Describe Your Need', desc: 'Enter the required blood group and your location with any urgent notes.' },
                  { step: '2', title: 'View the Life Map', desc: 'See all available nearby donors on a live map. Privacy-protected — only blood group & distance shown.' },
                  { step: '3', title: 'Send a Request', desc: 'Broadcast your emergency request to the nearest compatible donors instantly.' },
                  { step: '4', title: 'Receive Confirmation', desc: 'Once a donor accepts, their contact info is shared so you can coordinate directly.' },
                ].map((item) => (
                  <div key={item.step} className="flex gap-4">
                    <div className="flex-shrink-0 w-8 h-8 bg-red-100 text-red-700 rounded-full flex items-center justify-center text-sm font-bold">
                      {item.step}
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">{item.title}</h4>
                      <p className="text-gray-500 text-sm mt-0.5">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-4 bg-gray-50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-3">Built for Emergencies</h2>
            <p className="text-gray-500">Every feature designed to save time when seconds count</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: MapPin, color: 'red', title: 'Live Map View', desc: 'Real-time map showing nearby donors with blood group and approximate distance.' },
              { icon: Bell, color: 'amber', title: 'Instant Alerts', desc: 'Push notifications delivered to donors the moment a matching request is created.' },
              { icon: Shield, color: 'blue', title: 'Privacy First', desc: 'Contact info is only revealed after both parties consent. Zero data exposed by default.' },
              { icon: Clock, color: 'emerald', title: 'Always Available', desc: '24/7 network that responds in real time, even at 3am during critical situations.' },
              { icon: Users, color: 'rose', title: 'Community Driven', desc: 'A growing network of volunteers who show up when needed most.' },
              { icon: Heart, color: 'red', title: 'Hospital Fallback', desc: 'If no donors respond, the system guides you to the nearest blood banks immediately.' },
            ].map(({ icon: Icon, color, title, desc }) => (
              <div key={title} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                <div className={`w-12 h-12 bg-${color}-100 text-${color}-600 rounded-xl flex items-center justify-center mb-4`}>
                  <Icon size={22} />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 bg-gradient-to-r from-red-600 to-rose-600 text-white text-center">
        <div className="max-w-2xl mx-auto">
          <Heart size={40} className="mx-auto mb-4 text-red-200" />
          <h2 className="text-3xl font-bold mb-4">Join the Life Map Network Today</h2>
          <p className="text-red-100 mb-8 text-lg">Register as a donor and be ready to save a life at a moment's notice.</p>
          <button
            onClick={onGetStarted}
            className="inline-flex items-center gap-2 bg-white text-red-600 hover:bg-red-50 px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-200 shadow-lg hover:shadow-xl hover:-translate-y-0.5"
          >
            Register as a Donor
            <ChevronRight size={20} />
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-8 px-4 text-center text-sm">
        <div className="flex items-center justify-center gap-2 text-white font-semibold mb-2">
          <Droplets size={18} className="text-red-500" />
          Life Map
        </div>
        <p>Real-time emergency blood donation network. Built to save lives.</p>
      </footer>
    </div>
  );
}
