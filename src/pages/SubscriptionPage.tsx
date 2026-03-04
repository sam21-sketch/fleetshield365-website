import React from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { CheckCircle, Star, Zap, Users, Truck, FileText } from 'lucide-react';

const SubscriptionPage: React.FC = () => {
  const { darkMode } = useTheme();
  const { company } = useAuth();
  
  const vehicleCount = company?.vehicle_count || 0;

  return (
    <div className={`space-y-6 max-w-3xl ${darkMode ? 'text-white' : ''}`}>
      {/* Header */}
      <div>
        <h1 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Subscription</h1>
        <p className={darkMode ? 'text-gray-400' : 'text-gray-500'}>Your plan and benefits</p>
      </div>

      {/* Current Plan - Early Adopter */}
      <div className={`rounded-xl border-2 border-orange-500 overflow-hidden ${
        darkMode ? 'bg-gray-800' : 'bg-white'
      }`}>
        {/* Badge Header */}
        <div className="bg-gradient-to-r from-orange-500 to-orange-600 px-6 py-3 flex items-center gap-2">
          <Star className="w-5 h-5 text-white fill-white" />
          <span className="text-white font-semibold">Founding Member</span>
          <span className="ml-auto bg-white/20 text-white px-3 py-1 rounded-full text-sm">
            Early Adopter
          </span>
        </div>
        
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Current Plan</div>
              <div className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                FleetShield365 Early Access
              </div>
            </div>
            <div className="bg-green-500/20 text-green-500 px-4 py-2 rounded-full text-sm font-medium flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              Active
            </div>
          </div>

          {/* Price */}
          <div className={`p-4 rounded-lg mb-6 ${darkMode ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
            <div className="flex items-baseline gap-2">
              <span className={`text-4xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>$0</span>
              <span className={darkMode ? 'text-gray-400' : 'text-gray-500'}>/month</span>
            </div>
            <p className={`text-sm mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              Free during early access period
            </p>
          </div>

          {/* Benefits */}
          <div className="space-y-3">
            <h3 className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              Your Founding Member Benefits:
            </h3>
            <div className="grid gap-3">
              {[
                { icon: CheckCircle, text: 'Full access to all features', color: 'text-green-500' },
                { icon: Truck, text: 'Unlimited vehicles', color: 'text-cyan-500' },
                { icon: Users, text: 'Unlimited drivers', color: 'text-blue-500' },
                { icon: FileText, text: 'Unlimited inspections & reports', color: 'text-purple-500' },
                { icon: Zap, text: 'Priority feature requests', color: 'text-orange-500' },
                { icon: Star, text: 'Locked-in discount when paid plans launch', color: 'text-yellow-500' },
              ].map((benefit, i) => (
                <div key={i} className="flex items-center gap-3">
                  <benefit.icon className={`w-5 h-5 ${benefit.color}`} />
                  <span className={darkMode ? 'text-gray-300' : 'text-gray-700'}>{benefit.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Usage Stats */}
      <div className={`rounded-xl border p-6 ${
        darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'
      }`}>
        <h2 className={`text-lg font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
          Current Usage
        </h2>
        <div className="grid grid-cols-2 gap-4">
          <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
            <div className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              {vehicleCount}
            </div>
            <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              Active Vehicles
            </div>
          </div>
          <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
            <div className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              Unlimited
            </div>
            <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              Drivers & Inspections
            </div>
          </div>
        </div>
      </div>

      {/* Future Pricing Notice */}
      <div className={`rounded-xl border p-6 ${
        darkMode ? 'bg-gray-800/50 border-gray-700' : 'bg-gray-50 border-gray-200'
      }`}>
        <div className="flex items-start gap-4">
          <div className={`p-2 rounded-lg ${darkMode ? 'bg-orange-500/20' : 'bg-orange-100'}`}>
            <Star className="w-6 h-6 text-orange-500" />
          </div>
          <div>
            <h3 className={`font-semibold mb-1 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              Thanks for being a Founding Member!
            </h3>
            <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              When we launch paid plans in the future, you'll receive an exclusive discount 
              as a thank you for helping us build FleetShield365. We'll notify you well in advance 
              of any changes.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionPage;
