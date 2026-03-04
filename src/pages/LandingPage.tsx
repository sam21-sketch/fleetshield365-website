import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, Camera, Bell, FileText, WifiOff, Truck, HardHat, Cog, Wrench, ChevronRight, Star, Users, Clock, Award } from 'lucide-react';

const LandingPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#0F172A]">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0F172A]/95 backdrop-blur-sm border-b border-[#334155]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-gradient-to-br from-teal-500 to-teal-600 rounded-xl flex items-center justify-center shadow-lg shadow-teal-500/20">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold text-white">FleetShield365</span>
            </div>
            <div className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-slate-300 hover:text-white transition">Features</a>
              <a href="#industries" className="text-slate-300 hover:text-white transition">Industries</a>
              <Link to="/login" className="text-slate-300 hover:text-white transition">Login</Link>
              <Link to="/register" className="bg-teal-500 hover:bg-teal-600 text-white px-5 py-2.5 rounded-lg font-medium transition shadow-lg shadow-teal-500/20">
                Get Started Free
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-24 px-4 relative overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-teal-500/5 to-transparent pointer-events-none" />
        
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-4xl mx-auto">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 bg-teal-500/10 border border-teal-500/20 text-teal-400 px-4 py-2 rounded-full text-sm font-medium mb-8">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-teal-500"></span>
              </span>
              Free for Early Adopters
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
              Digital Pre-Start Inspections
              <span className="block text-teal-400">For All Machinery</span>
            </h1>
            
            <p className="text-lg md:text-xl text-slate-400 mb-10 max-w-2xl mx-auto leading-relaxed">
              Streamline compliance, reduce paperwork, and protect your business with digital checklists that work anywhere.
            </p>

            {/* Equipment Types */}
            <div className="flex flex-wrap justify-center gap-3 mb-10">
              {[
                { icon: Truck, label: 'Trucks' },
                { icon: HardHat, label: 'Excavators' },
                { icon: Cog, label: 'Forklifts' },
                { icon: Wrench, label: 'Cranes' },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-2 bg-[#1E293B] px-4 py-2 rounded-full text-slate-300 text-sm">
                  <item.icon className="w-4 h-4 text-teal-400" />
                  {item.label}
                </div>
              ))}
              <div className="flex items-center gap-2 bg-[#1E293B] px-4 py-2 rounded-full text-slate-400 text-sm">
                + Any Equipment
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row justify-center gap-4 mb-6">
              <Link 
                to="/register" 
                className="group bg-teal-500 hover:bg-teal-600 text-white px-8 py-4 rounded-xl font-semibold text-lg transition shadow-xl shadow-teal-500/20 flex items-center justify-center gap-2"
              >
                Start Free Today
                <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link 
                to="/login" 
                className="border border-[#334155] hover:border-teal-500/50 hover:bg-[#1E293B] text-white px-8 py-4 rounded-xl font-semibold text-lg transition"
              >
                Sign In
              </Link>
            </div>
            <p className="text-slate-500 text-sm">No credit card required</p>
          </div>
        </div>
      </section>

      {/* Trust Indicators */}
      <section className="py-12 border-y border-[#1E293B]">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { icon: Users, value: '500+', label: 'Companies' },
              { icon: CheckCircle, value: '50K+', label: 'Inspections' },
              { icon: Clock, value: '99.9%', label: 'Uptime' },
              { icon: Star, value: '4.9', label: 'Rating' },
            ].map((stat, i) => (
              <div key={i} className="text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-teal-500/10 rounded-xl mb-3">
                  <stat.icon className="w-6 h-6 text-teal-400" />
                </div>
                <div className="text-2xl md:text-3xl font-bold text-white">{stat.value}</div>
                <div className="text-slate-500 text-sm">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Everything You Need
            </h2>
            <p className="text-slate-400 max-w-2xl mx-auto">
              Powerful tools to manage pre-start inspections across your entire operation
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: CheckCircle,
                title: 'Digital Checklists',
                desc: 'Customizable pre-start and end-of-shift inspection templates for any equipment type',
                color: 'teal',
              },
              {
                icon: Camera,
                title: 'Photo Evidence',
                desc: 'Capture defects and conditions with timestamped, GPS-tagged photos',
                color: 'blue',
              },
              {
                icon: Bell,
                title: 'Smart Alerts',
                desc: 'Automatic notifications for expiring licenses, registrations, and certificates',
                color: 'amber',
              },
              {
                icon: FileText,
                title: 'PDF Reports',
                desc: 'Generate professional, branded inspection reports instantly',
                color: 'purple',
              },
              {
                icon: WifiOff,
                title: 'Works Offline',
                desc: 'Complete inspections anywhere - data syncs automatically when back online',
                color: 'green',
              },
              {
                icon: Award,
                title: 'Compliance Ready',
                desc: 'Meet WHS requirements with digital signatures and audit trails',
                color: 'rose',
              },
            ].map((feature, i) => (
              <div 
                key={i} 
                className="group bg-[#1E293B]/50 hover:bg-[#1E293B] border border-[#334155] hover:border-teal-500/30 rounded-2xl p-6 transition-all duration-300"
              >
                <div className={`inline-flex items-center justify-center w-12 h-12 bg-${feature.color}-500/10 rounded-xl mb-4 group-hover:scale-110 transition-transform`}>
                  <feature.icon className={`w-6 h-6 text-teal-400`} />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">{feature.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Industries Section */}
      <section id="industries" className="py-24 px-4 bg-[#1E293B]/30">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Built For Your Industry
            </h2>
            <p className="text-slate-400 max-w-2xl mx-auto">
              Pre-start inspections for any equipment that keeps your business running
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { name: 'Transport & Logistics', icon: '🚛' },
              { name: 'Construction', icon: '🏗️' },
              { name: 'Mining', icon: '⛏️' },
              { name: 'Agriculture', icon: '🚜' },
              { name: 'Warehousing', icon: '📦' },
              { name: 'Manufacturing', icon: '🏭' },
              { name: 'Waste Management', icon: '♻️' },
              { name: 'Utilities', icon: '⚡' },
            ].map((industry, i) => (
              <div 
                key={i} 
                className="bg-[#0F172A] border border-[#334155] hover:border-teal-500/30 rounded-xl p-5 text-center transition-all hover:transform hover:-translate-y-1"
              >
                <div className="text-3xl mb-2">{industry.icon}</div>
                <div className="text-white font-medium text-sm">{industry.name}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing/CTA Section */}
      <section className="py-24 px-4">
        <div className="max-w-3xl mx-auto">
          <div className="bg-gradient-to-br from-[#1E293B] to-[#1E293B]/50 border border-[#334155] rounded-3xl p-8 md:p-12 text-center relative overflow-hidden">
            {/* Background decoration */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-teal-500/5 rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl" />
            
            <div className="relative">
              <div className="inline-flex items-center gap-2 bg-green-500/10 border border-green-500/20 text-green-400 px-4 py-2 rounded-full text-sm font-medium mb-6">
                <Star className="w-4 h-4" />
                Founding Member Offer
              </div>

              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                Start Free Today
              </h2>
              <p className="text-slate-400 mb-8 max-w-lg mx-auto">
                Join as an early adopter and get full access to FleetShield365. Shape the future of equipment inspections with us.
              </p>

              <div className="flex flex-col items-center mb-8">
                <div className="text-5xl font-bold text-white mb-1">$0</div>
                <div className="text-teal-400">Free during early access</div>
              </div>

              <ul className="text-slate-300 space-y-3 mb-8 max-w-sm mx-auto text-left">
                {[
                  'Unlimited equipment & operators',
                  'All features included',
                  'Priority support',
                  'Locked-in pricing when we launch',
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-teal-400 flex-shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>

              <Link 
                to="/register" 
                className="inline-flex items-center gap-2 bg-teal-500 hover:bg-teal-600 text-white px-8 py-4 rounded-xl font-semibold text-lg transition shadow-xl shadow-teal-500/20"
              >
                Get Started Free
                <ChevronRight className="w-5 h-5" />
              </Link>
              <p className="text-slate-500 mt-4 text-sm">No credit card required</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 border-t border-[#1E293B]">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-teal-500 to-teal-600 rounded-lg flex items-center justify-center">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <span className="text-white font-semibold">FleetShield365</span>
            </div>
            <div className="flex items-center gap-6 text-slate-500 text-sm">
              <a href="#" className="hover:text-white transition">Privacy</a>
              <a href="#" className="hover:text-white transition">Terms</a>
              <a href="mailto:contact@fleetshield365.com" className="hover:text-white transition">Contact</a>
            </div>
            <div className="text-slate-500 text-sm">
              © 2025 FleetShield365
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
