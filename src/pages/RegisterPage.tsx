import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Shield, CheckCircle, Star, Eye, EyeOff, Building2, Crown } from 'lucide-react';

const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { register } = useAuth();

  const [selectedRole, setSelectedRole] = useState<'admin' | 'owner'>('owner');
  const [formData, setFormData] = useState({
    company_name: '',
    name: '',
    email: '',
    password: '',
    confirm_password: '',
    vehicle_count: 5,
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirm_password) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      await register({
        company_name: formData.company_name,
        name: formData.name,
        email: formData.email,
        password: formData.password,
        vehicle_count: formData.vehicle_count,
        role: selectedRole === 'owner' ? 'super_admin' : 'admin',
      });
      
      // Free model - go straight to dashboard
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0F172A] py-12 px-4">
      <div className="max-w-lg mx-auto">
        {/* Logo */}
        <Link to="/" className="flex items-center justify-center space-x-2 mb-8">
          <div className="w-12 h-12 bg-gradient-to-br from-teal-500 to-teal-600 rounded-xl flex items-center justify-center shadow-lg shadow-teal-500/20">
            <Shield className="w-7 h-7 text-white" />
          </div>
          <span className="text-2xl font-bold text-white">FleetShield365</span>
        </Link>

        {/* Register Form */}
        <div className="bg-[#1E293B] rounded-2xl p-8 border border-[#334155]">
          {/* Early Adopter Badge */}
          <div className="flex justify-center mb-6">
            <div className="inline-flex items-center gap-2 bg-teal-500/10 border border-teal-500/20 text-teal-400 px-4 py-2 rounded-full text-sm font-medium">
              <Star className="w-4 h-4" />
              Founding Member Access
            </div>
          </div>

          <h1 className="text-2xl font-bold text-white text-center mb-2">Get Started Free</h1>
          <p className="text-slate-400 text-center mb-6">Join as an early adopter - no credit card required</p>

          {error && (
            <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-lg mb-6">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Role Selection */}
            <div>
              <label className="block text-slate-300 text-sm mb-3">I am registering as:</label>
              <div className="grid grid-cols-2 gap-3">
                {/* Company Owner Option */}
                <button
                  type="button"
                  onClick={() => setSelectedRole('owner')}
                  data-testid="role-owner-btn"
                  className={`relative p-4 rounded-xl border-2 transition-all text-left ${
                    selectedRole === 'owner'
                      ? 'border-teal-500 bg-teal-500/10'
                      : 'border-[#334155] bg-[#0F172A] hover:border-[#475569]'
                  }`}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className={`p-2 rounded-lg ${selectedRole === 'owner' ? 'bg-teal-500/20' : 'bg-[#334155]'}`}>
                      <Crown className={`w-5 h-5 ${selectedRole === 'owner' ? 'text-teal-400' : 'text-slate-400'}`} />
                    </div>
                    <span className={`font-semibold ${selectedRole === 'owner' ? 'text-white' : 'text-slate-300'}`}>
                      Company Owner
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">Full access including billing & sensitive documents</p>
                  {selectedRole === 'owner' && (
                    <div className="absolute top-2 right-2">
                      <CheckCircle className="w-5 h-5 text-teal-400" />
                    </div>
                  )}
                </button>

                {/* Admin Option */}
                <button
                  type="button"
                  onClick={() => setSelectedRole('admin')}
                  data-testid="role-admin-btn"
                  className={`relative p-4 rounded-xl border-2 transition-all text-left ${
                    selectedRole === 'admin'
                      ? 'border-teal-500 bg-teal-500/10'
                      : 'border-[#334155] bg-[#0F172A] hover:border-[#475569]'
                  }`}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className={`p-2 rounded-lg ${selectedRole === 'admin' ? 'bg-teal-500/20' : 'bg-[#334155]'}`}>
                      <Building2 className={`w-5 h-5 ${selectedRole === 'admin' ? 'text-teal-400' : 'text-slate-400'}`} />
                    </div>
                    <span className={`font-semibold ${selectedRole === 'admin' ? 'text-white' : 'text-slate-300'}`}>
                      Admin
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">Manage fleet, operators & reports</p>
                  {selectedRole === 'admin' && (
                    <div className="absolute top-2 right-2">
                      <CheckCircle className="w-5 h-5 text-teal-400" />
                    </div>
                  )}
                </button>
              </div>
            </div>

            {/* Company Info */}
            <div>
              <label className="block text-slate-300 text-sm mb-2" htmlFor="company_name">Company Name</label>
              <input
                type="text"
                id="company_name"
                name="company_name"
                value={formData.company_name}
                onChange={handleChange}
                className="w-full bg-[#0F172A] border border-[#334155] rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-teal-500 transition"
                placeholder="Your company name"
                required
              />
            </div>

            {/* Admin Info */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-300 text-sm mb-2" htmlFor="name">Your Name</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full bg-[#0F172A] border border-[#334155] rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-teal-500 transition"
                  placeholder="John Smith"
                  required
                />
              </div>
              <div>
                <label className="block text-slate-300 text-sm mb-2" htmlFor="email">Email</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full bg-[#0F172A] border border-[#334155] rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-teal-500 transition"
                  placeholder="john@company.com"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-300 text-sm mb-2" htmlFor="password">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    className="w-full bg-[#0F172A] border border-[#334155] rounded-lg px-4 py-3 pr-12 text-white placeholder-slate-500 focus:outline-none focus:border-teal-500 transition"
                    placeholder="••••••••"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-slate-300 text-sm mb-2" htmlFor="confirm_password">Confirm Password</label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    id="confirm_password"
                    name="confirm_password"
                    value={formData.confirm_password}
                    onChange={handleChange}
                    className="w-full bg-[#0F172A] border border-[#334155] rounded-lg px-4 py-3 pr-12 text-white placeholder-slate-500 focus:outline-none focus:border-teal-500 transition"
                    placeholder="••••••••"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                  >
                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>
            </div>

            {/* What's Included */}
            <div className="bg-[#0F172A] rounded-xl p-4 border border-[#334155]">
              <p className="text-slate-400 text-sm mb-3">What's included:</p>
              <ul className="space-y-2">
                {[
                  'Unlimited equipment & operators',
                  'All features included',
                  'Priority support',
                  'Shape product development',
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-2 text-slate-300 text-sm">
                    <CheckCircle className="w-4 h-4 text-teal-400 flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-teal-500 hover:bg-teal-600 disabled:bg-teal-500/50 text-white py-4 rounded-xl font-semibold text-lg transition shadow-lg shadow-teal-500/20"
            >
              {loading ? 'Creating account...' : 'Create Free Account'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <span className="text-slate-400">Already have an account? </span>
            <Link to="/login" className="text-teal-400 hover:text-teal-300 font-medium">
              Sign in
            </Link>
          </div>
        </div>

        <p className="text-center text-slate-500 text-sm mt-4">
          By signing up, you agree to our Terms of Service and Privacy Policy
        </p>
      </div>
    </div>
  );
};

export default RegisterPage;
