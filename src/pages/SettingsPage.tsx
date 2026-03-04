import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { companyAPI, api } from '../utils/api';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';

interface NotificationPreferences {
  expiry_alerts: boolean;
  issue_alerts: boolean;
  missed_inspection_alerts: boolean;
  daily_summary: boolean;
  push_enabled: boolean;
  email_enabled: boolean;
}

interface Subscription {
  plan_name: string;
  status: string;
  base_price: number;
  vehicle_price: number;
  vehicle_count: number;
  next_billing_date: string;
}

const SettingsPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { company, refreshCompany } = useAuth();
  const { darkMode, setDarkMode } = useTheme();
  
  // Active tab from URL or default to 'general'
  const activeTab = searchParams.get('tab') || 'general';
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
  });
  const [loading, setLoading] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [notifPrefs, setNotifPrefs] = useState<NotificationPreferences>({
    expiry_alerts: true,
    issue_alerts: true,
    missed_inspection_alerts: true,
    daily_summary: false,
    push_enabled: true,
    email_enabled: true,
  });
  const [savingNotifs, setSavingNotifs] = useState(false);
  const [subscription, setSubscription] = useState<Subscription | null>(null);

  // Theme styles - Professional Dark Mode
  const cardBg = darkMode ? 'bg-[#1E293B] border-[#334155]' : 'bg-white border-gray-100';
  const textPrimary = darkMode ? 'text-gray-100' : 'text-gray-900';
  const textSecondary = darkMode ? 'text-gray-300' : 'text-gray-500';
  const textMuted = darkMode ? 'text-gray-400' : 'text-gray-400';
  const inputBg = darkMode ? 'bg-[#0F172A] border-[#334155] text-gray-100 placeholder-gray-500' : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400';
  const tabBg = darkMode ? 'bg-[#0F172A]' : 'bg-gray-100';
  const tabActive = darkMode ? 'bg-[#1E293B] text-gray-100 shadow-sm' : 'bg-white text-gray-900 shadow-sm';
  const tabInactive = darkMode ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-700';

  const tabs = [
    { id: 'general', label: 'General', icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4' },
    { id: 'notifications', label: 'Notifications', icon: 'M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9' },
    { id: 'appearance', label: 'Appearance', icon: 'M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z' },
    { id: 'billing', label: 'Billing', icon: 'M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z' },
  ];

  useEffect(() => {
    if (company) {
      setFormData({
        name: company.name || '',
        email: '',
        phone: '',
        address: '',
      });
    }
    fetchNotificationPreferences();
    fetchSubscription();
  }, [company]);

  const fetchNotificationPreferences = async () => {
    try {
      const response = await api.get('/notification-preferences');
      setNotifPrefs(response.data);
    } catch (error) {
      console.error('Failed to fetch notification preferences:', error);
    }
  };

  const fetchSubscription = async () => {
    try {
      const response = await api.get('/subscription');
      setSubscription(response.data);
    } catch (error) {
      console.error('Failed to fetch subscription:', error);
    }
  };

  const handleTabChange = (tabId: string) => {
    setSearchParams({ tab: tabId });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await companyAPI.updateSettings(formData);
      await refreshCompany();
      alert('Settings updated successfully');
    } catch (error) {
      alert('Failed to update settings');
    } finally {
      setLoading(false);
    }
  };

  const handleLogoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleLogoUpload = async () => {
    if (!logoFile) return;
    setUploading(true);
    try {
      await companyAPI.uploadLogo(logoFile);
      await refreshCompany();
      alert('Logo uploaded successfully');
      setLogoFile(null);
      setLogoPreview(null);
    } catch (error) {
      alert('Failed to upload logo');
    } finally {
      setUploading(false);
    }
  };

  const handleNotifChange = async (key: keyof NotificationPreferences, value: boolean) => {
    const newPrefs = { ...notifPrefs, [key]: value };
    setNotifPrefs(newPrefs);
    
    setSavingNotifs(true);
    try {
      await api.put('/notification-preferences', { [key]: value });
    } catch (error) {
      console.error('Failed to save notification preference:', error);
      setNotifPrefs(notifPrefs);
    } finally {
      setSavingNotifs(false);
    }
  };

  const ToggleSwitch = ({ checked, onChange, disabled = false }: { checked: boolean; onChange: (val: boolean) => void; disabled?: boolean }) => (
    <button
      type="button"
      onClick={() => !disabled && onChange(!checked)}
      disabled={disabled}
      className={`relative w-12 h-7 rounded-full transition-colors ${checked ? 'bg-cyan-500' : darkMode ? 'bg-[#475569]' : 'bg-gray-300'} ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
    >
      <span
        className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full shadow transition-transform ${checked ? 'translate-x-5' : ''}`}
      />
    </button>
  );

  const renderGeneralTab = () => (
    <div className="grid lg:grid-cols-2 gap-6">
      {/* Company Logo */}
      <div className={`${cardBg} border rounded-xl p-6`}>
        <div className="flex items-center gap-3 mb-4">
          <div className={`w-10 h-10 rounded-lg ${darkMode ? 'bg-cyan-500/20' : 'bg-cyan-50'} flex items-center justify-center`}>
            <svg className="w-5 h-5 text-cyan-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <div>
            <h3 className={`font-semibold ${textPrimary}`}>Company Logo</h3>
            <p className={`text-sm ${textSecondary}`}>Appears on PDF reports</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <div className={`w-24 h-24 rounded-xl ${darkMode ? 'bg-[#0F172A]' : 'bg-gray-50'} border-2 border-dashed ${darkMode ? 'border-[#334155]' : 'border-gray-200'} flex items-center justify-center overflow-hidden`}>
            {logoPreview ? (
              <img src={logoPreview} alt="Preview" className="w-full h-full object-contain" />
            ) : company?.logo_url ? (
              <img src={company.logo_url} alt="Company logo" className="w-full h-full object-contain" />
            ) : (
              <svg className={`w-8 h-8 ${textMuted}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            )}
          </div>
          <div className="flex-1">
            <input
              type="file"
              accept="image/*"
              onChange={handleLogoSelect}
              className="hidden"
              id="logo-upload"
            />
            <label
              htmlFor="logo-upload"
              className={`inline-flex items-center gap-2 cursor-pointer ${darkMode ? 'bg-[#334155] hover:bg-[#475569]' : 'bg-gray-100 hover:bg-gray-200'} ${textPrimary} px-4 py-2 rounded-lg transition font-medium text-sm`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              Choose File
            </label>
            {logoFile && (
              <div className="mt-3 flex items-center gap-2">
                <span className={`text-sm ${textSecondary} truncate max-w-[120px]`}>{logoFile.name}</span>
                <button
                  onClick={handleLogoUpload}
                  disabled={uploading}
                  className="bg-cyan-500 hover:bg-cyan-600 text-white px-3 py-1 rounded text-sm font-medium transition"
                >
                  {uploading ? 'Uploading...' : 'Upload'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Company Details */}
      <div className={`${cardBg} border rounded-xl p-6`}>
        <div className="flex items-center gap-3 mb-4">
          <div className={`w-10 h-10 rounded-lg ${darkMode ? 'bg-blue-500/20' : 'bg-blue-50'} flex items-center justify-center`}>
            <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <div>
            <h3 className={`font-semibold ${textPrimary}`}>Company Details</h3>
            <p className={`text-sm ${textSecondary}`}>Your business information</p>
          </div>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className={`block text-sm ${textSecondary} mb-1`}>Company Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className={`w-full ${inputBg} border rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none transition`}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={`block text-sm ${textSecondary} mb-1`}>Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className={`w-full ${inputBg} border rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none transition`}
                placeholder="accounts@company.com"
              />
            </div>
            <div>
              <label className={`block text-sm ${textSecondary} mb-1`}>Phone</label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className={`w-full ${inputBg} border rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none transition`}
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="bg-[#0A1628] hover:bg-[#132337] disabled:opacity-50 text-white px-5 py-2.5 rounded-lg font-medium transition"
          >
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
      </div>
    </div>
  );

  const renderNotificationsTab = () => (
    <div className={`${cardBg} border rounded-xl p-6 max-w-2xl`}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-lg ${darkMode ? 'bg-purple-500/20' : 'bg-purple-50'} flex items-center justify-center`}>
            <svg className="w-5 h-5 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
          </div>
          <div>
            <h3 className={`font-semibold ${textPrimary}`}>Notification Preferences</h3>
            <p className={`text-sm ${textSecondary}`}>Synced with mobile app</p>
          </div>
        </div>
        {savingNotifs && <span className="text-cyan-500 text-sm animate-pulse">Saving...</span>}
      </div>

      {/* Channels */}
      <div className="mb-8">
        <h4 className={`text-xs font-semibold ${textMuted} uppercase tracking-wider mb-4`}>Delivery Channels</h4>
        <div className="space-y-4">
          <div className={`flex items-center justify-between p-4 rounded-lg ${darkMode ? 'bg-[#334155]/50' : 'bg-gray-50'}`}>
            <div className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-lg ${darkMode ? 'bg-green-500/20' : 'bg-green-50'} flex items-center justify-center`}>
                <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <div className={textPrimary}>Push Notifications</div>
                <div className={`text-sm ${textSecondary}`}>Instant alerts on mobile</div>
              </div>
            </div>
            <ToggleSwitch checked={notifPrefs.push_enabled} onChange={(val) => handleNotifChange('push_enabled', val)} />
          </div>
          <div className={`flex items-center justify-between p-4 rounded-lg ${darkMode ? 'bg-[#334155]/50' : 'bg-gray-50'}`}>
            <div className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-lg ${darkMode ? 'bg-blue-500/20' : 'bg-blue-50'} flex items-center justify-center`}>
                <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <div className={textPrimary}>Email Notifications</div>
                <div className={`text-sm ${textSecondary}`}>Alerts to your inbox</div>
              </div>
            </div>
            <ToggleSwitch checked={notifPrefs.email_enabled} onChange={(val) => handleNotifChange('email_enabled', val)} />
          </div>
        </div>
      </div>

      {/* Alert Types */}
      <div>
        <h4 className={`text-xs font-semibold ${textMuted} uppercase tracking-wider mb-4`}>Alert Types</h4>
        <div className="space-y-3">
          {[
            { key: 'expiry_alerts', label: 'Expiry Alerts', desc: 'License, rego, certificates expiring', color: 'orange' },
            { key: 'issue_alerts', label: 'Issue Alerts', desc: 'When a driver reports an issue', color: 'red' },
            { key: 'missed_inspection_alerts', label: 'Missed Inspections', desc: 'When a vehicle misses daily prestart', color: 'yellow' },
            { key: 'daily_summary', label: 'Daily Summary', desc: 'End-of-day summary email', color: 'cyan' },
          ].map((item) => (
            <div key={item.key} className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-[#334155] last:border-0">
              <div>
                <div className={textPrimary}>{item.label}</div>
                <div className={`text-sm ${textSecondary}`}>{item.desc}</div>
              </div>
              <ToggleSwitch 
                checked={notifPrefs[item.key as keyof NotificationPreferences] as boolean} 
                onChange={(val) => handleNotifChange(item.key as keyof NotificationPreferences, val)} 
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderAppearanceTab = () => (
    <div className={`${cardBg} border rounded-xl p-6 max-w-md`}>
      <div className="flex items-center gap-3 mb-6">
        <div className={`w-10 h-10 rounded-lg ${darkMode ? 'bg-yellow-500/20' : 'bg-yellow-50'} flex items-center justify-center`}>
          <svg className="w-5 h-5 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
          </svg>
        </div>
        <div>
          <h3 className={`font-semibold ${textPrimary}`}>Appearance</h3>
          <p className={`text-sm ${textSecondary}`}>Customize your experience</p>
        </div>
      </div>

      <div className={`flex items-center justify-between p-4 rounded-lg ${darkMode ? 'bg-[#334155]/50' : 'bg-gray-50'}`}>
        <div className="flex items-center gap-3">
          {darkMode ? (
            <svg className="w-6 h-6 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
            </svg>
          ) : (
            <svg className="w-6 h-6 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          )}
          <div>
            <div className={textPrimary}>{darkMode ? 'Dark Mode' : 'Light Mode'}</div>
            <div className={`text-sm ${textSecondary}`}>Click to switch theme</div>
          </div>
        </div>
        <ToggleSwitch checked={darkMode} onChange={(val) => setDarkMode(val)} />
      </div>
    </div>
  );

  const renderBillingTab = () => (
    <div className="space-y-6 max-w-2xl">
      {/* Early Adopter Plan */}
      <div className={`${cardBg} border-2 border-orange-500 rounded-xl overflow-hidden`}>
        {/* Badge Header */}
        <div className="bg-gradient-to-r from-orange-500 to-orange-600 px-6 py-3 flex items-center gap-2">
          <svg className="w-5 h-5 text-white fill-white" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
          </svg>
          <span className="text-white font-semibold">Founding Member</span>
          <span className="ml-auto bg-white/20 text-white px-3 py-1 rounded-full text-sm">
            Early Adopter
          </span>
        </div>
        
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <div className={`text-sm ${textSecondary}`}>Current Plan</div>
              <div className={`text-2xl font-bold ${textPrimary}`}>FleetShield365 Early Access</div>
            </div>
            <div className="bg-green-500/20 text-green-500 px-4 py-2 rounded-full text-sm font-medium flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Active
            </div>
          </div>

          {/* Price */}
          <div className={`p-4 rounded-lg mb-6 ${darkMode ? 'bg-[#334155]/50' : 'bg-gray-50'}`}>
            <div className="flex items-baseline gap-2">
              <span className={`text-4xl font-bold ${textPrimary}`}>$0</span>
              <span className={textSecondary}>/month</span>
            </div>
            <p className={`text-sm mt-1 ${textSecondary}`}>Free during early access period</p>
          </div>

          {/* Benefits */}
          <div className="space-y-3">
            <h3 className={`font-semibold ${textPrimary}`}>Your Founding Member Benefits:</h3>
            <div className="grid gap-2">
              {[
                { text: 'Full access to all features', color: 'text-green-500' },
                { text: 'Unlimited vehicles', color: 'text-cyan-500' },
                { text: 'Unlimited drivers', color: 'text-blue-500' },
                { text: 'Unlimited inspections & reports', color: 'text-purple-500' },
                { text: 'Priority feature requests', color: 'text-orange-500' },
                { text: 'Locked-in discount when paid plans launch', color: 'text-yellow-500' },
              ].map((benefit, i) => (
                <div key={i} className="flex items-center gap-3">
                  <svg className={`w-5 h-5 ${benefit.color}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className={darkMode ? 'text-gray-300' : 'text-gray-700'}>{benefit.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Usage Stats */}
      <div className={`${cardBg} border rounded-xl p-6`}>
        <h2 className={`text-lg font-semibold mb-4 ${textPrimary}`}>Current Usage</h2>
        <div className="grid grid-cols-2 gap-4">
          <div className={`p-4 rounded-lg ${darkMode ? 'bg-[#334155]/50' : 'bg-gray-50'}`}>
            <div className={`text-2xl font-bold ${textPrimary}`}>{subscription?.vehicle_count || company?.vehicle_count || 0}</div>
            <div className={`text-sm ${textSecondary}`}>Active Vehicles</div>
          </div>
          <div className={`p-4 rounded-lg ${darkMode ? 'bg-[#334155]/50' : 'bg-gray-50'}`}>
            <div className={`text-2xl font-bold ${textPrimary}`}>Unlimited</div>
            <div className={`text-sm ${textSecondary}`}>Drivers & Inspections</div>
          </div>
        </div>
      </div>

      {/* Future Pricing Notice */}
      <div className={`${cardBg} border rounded-xl p-6`}>
        <div className="flex items-start gap-4">
          <div className={`p-2 rounded-lg ${darkMode ? 'bg-orange-500/20' : 'bg-orange-100'}`}>
            <svg className="w-6 h-6 text-orange-500" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
          </div>
          <div>
            <h3 className={`font-semibold mb-1 ${textPrimary}`}>Thanks for being a Founding Member!</h3>
            <p className={`text-sm ${textSecondary}`}>
              When we launch paid plans in the future, you'll receive an exclusive discount 
              as a thank you for helping us build FleetShield365. We'll notify you well in advance 
              of any changes.
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className={`text-2xl font-bold ${textPrimary}`}>Settings</h1>
        <p className={textSecondary}>Manage your account, notifications, and billing</p>
      </div>

      {/* Tabs */}
      <div className={`${tabBg} p-1 rounded-xl inline-flex gap-1`}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => handleTabChange(tab.id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm transition ${
              activeTab === tab.id ? tabActive : tabInactive
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={tab.icon} />
            </svg>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === 'general' && renderGeneralTab()}
        {activeTab === 'notifications' && renderNotificationsTab()}
        {activeTab === 'appearance' && renderAppearanceTab()}
        {activeTab === 'billing' && renderBillingTab()}
      </div>
    </div>
  );
};

export default SettingsPage;
