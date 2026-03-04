import React from 'react';
import { Link } from 'react-router-dom';
import { Star, CheckCircle, ArrowRight } from 'lucide-react';

const PricingPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#0F172A]">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0F172A]/95 backdrop-blur-sm border-b border-[#334155]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to="/" className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <span className="text-xl font-bold text-white">FleetShield365</span>
            </Link>
            <div className="flex items-center space-x-4">
              <Link to="/login" className="text-slate-300 hover:text-white transition">Login</Link>
              <Link to="/register" className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg font-medium transition">
                Get Started Free
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <section className="pt-32 pb-20 px-4">
        <div className="max-w-3xl mx-auto text-center">
          {/* Early Adopter Badge */}
          <div className="inline-flex items-center gap-2 bg-orange-500/20 text-orange-400 px-4 py-2 rounded-full text-sm font-medium mb-6">
            <Star className="w-4 h-4 fill-current" />
            Limited Time Offer
          </div>

          <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Free During Early Access
          </h1>
          <p className="text-xl text-slate-400 mb-12">
            We're launching FleetShield365 and want to give early adopters full access for free. 
            No credit card. No commitment. Just great fleet management software.
          </p>

          {/* Free Plan Card */}
          <div className="bg-[#1E293B] rounded-2xl p-8 md:p-12 border-2 border-orange-500 mb-12">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Star className="w-6 h-6 text-orange-500 fill-orange-500" />
              <span className="text-orange-500 font-semibold">Founding Member</span>
            </div>
            
            <div className="text-6xl font-bold text-white mb-2">$0</div>
            <div className="text-slate-400 mb-8">Free during early access</div>

            <ul className="text-slate-300 space-y-4 mb-8 max-w-md mx-auto text-left">
              {[
                'Full access to all features',
                'Unlimited vehicles',
                'Unlimited drivers',
                'Unlimited inspections',
                'Pre-start & end-shift checklists',
                'Photo evidence with GPS',
                'Digital signatures',
                'PDF & CSV reports',
                'Expiry alerts & notifications',
                'Fuel tracking',
                'Offline mode',
                'Mobile app for drivers',
                'Web dashboard for admins',
                'Priority feature requests',
                'Locked-in discount when we launch paid plans',
              ].map((feature, i) => (
                <li key={i} className="flex items-center">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                  {feature}
                </li>
              ))}
            </ul>

            <Link
              to="/register"
              className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-8 py-4 rounded-lg font-semibold text-lg transition"
            >
              Become a Founding Member
              <ArrowRight className="w-5 h-5" />
            </Link>
            <p className="text-slate-500 mt-4">No credit card required</p>
          </div>

          {/* Future Pricing Note */}
          <div className="bg-[#1E293B]/50 rounded-xl p-6 text-left">
            <h3 className="text-white font-semibold mb-2">When will you start charging?</h3>
            <p className="text-slate-400">
              We don't have a specific date yet. When we do introduce paid plans, founding members 
              will receive an exclusive discount as a thank you for helping us build FleetShield365. 
              We'll give you plenty of notice before any changes.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default PricingPage;
