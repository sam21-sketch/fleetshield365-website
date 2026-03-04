import React, { useEffect, useState } from 'react';
import { driverAPI } from '../utils/api';
import { useTheme } from '../contexts/ThemeContext';
import SlidePanel from '../components/SlidePanel';
import EmptyState from '../components/EmptyState';
import { showToast } from '../components/Toast';
import { useKeyboardShortcut, SHORTCUTS } from '../hooks/useKeyboardShortcut';
import { SkeletonTable } from '../components/Skeleton';

interface Driver {
  id: string;
  name: string;
  email: string;
  phone?: string;
  license_number?: string;
  license_class?: string;
  license_expiry?: string;
  medical_certificate_expiry?: string;
  first_aid_expiry?: string;
  forklift_license_expiry?: string;
  dangerous_goods_expiry?: string;
  status: string;
}

const DriversPage: React.FC = () => {
  const { darkMode } = useTheme();
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPanel, setShowPanel] = useState(false);
  const [editingDriver, setEditingDriver] = useState<Driver | null>(null);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    license_number: '',
    license_class: '',
    license_expiry: '',
    medical_certificate_expiry: '',
    first_aid_expiry: '',
    forklift_license_expiry: '',
    dangerous_goods_expiry: '',
    password: '',
  });
  const [sendingCredentials, setSendingCredentials] = useState<string | null>(null);

  // Theme styles - Professional Dark Mode
  const cardBg = darkMode ? 'bg-[#1E293B] border-[#334155]' : 'bg-white border-gray-100';
  const textPrimary = darkMode ? 'text-gray-100' : 'text-gray-900';
  const textSecondary = darkMode ? 'text-gray-300' : 'text-gray-500';
  const inputBg = darkMode ? 'bg-[#0F172A] border-[#334155] text-gray-100 placeholder:text-gray-500' : 'bg-gray-50 border-gray-200 text-gray-900';
  const hoverBg = darkMode ? 'hover:bg-[#334155]/50' : 'hover:bg-gray-50';
  const tableBg = darkMode ? 'bg-[#0F172A]' : 'bg-gray-50';
  const dividerColor = darkMode ? 'divide-[#334155]' : 'divide-gray-100';

  // Keyboard shortcuts
  useKeyboardShortcut(SHORTCUTS.NEW, () => openAddPanel());

  useEffect(() => {
    fetchDrivers();
  }, []);

  const fetchDrivers = async () => {
    try {
      const response = await driverAPI.getAll();
      setDrivers(response.data);
    } catch (error) {
      console.error('Failed to fetch drivers:', error);
      showToast.error('Failed to load drivers');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setEditingDriver(null);
    setFormData({
      name: '',
      email: '',
      phone: '',
      license_number: '',
      license_class: '',
      license_expiry: '',
      medical_certificate_expiry: '',
      first_aid_expiry: '',
      forklift_license_expiry: '',
      dangerous_goods_expiry: '',
      password: '',
    });
  };

  const openAddPanel = () => {
    resetForm();
    setShowPanel(true);
  };

  const openEditPanel = (driver: Driver) => {
    setEditingDriver(driver);
    setFormData({
      name: driver.name,
      email: driver.email,
      phone: driver.phone || '',
      license_number: driver.license_number || '',
      license_class: driver.license_class || '',
      license_expiry: driver.license_expiry || '',
      medical_certificate_expiry: driver.medical_certificate_expiry || '',
      first_aid_expiry: driver.first_aid_expiry || '',
      forklift_license_expiry: driver.forklift_license_expiry || '',
      dangerous_goods_expiry: driver.dangerous_goods_expiry || '',
      password: '',
    });
    setShowPanel(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingDriver) {
        await driverAPI.update(editingDriver.id, formData);
        showToast.success(`Driver "${formData.name}" updated successfully`);
      } else {
        await driverAPI.create({ ...formData, role: 'driver' });
        showToast.success(`Driver "${formData.name}" added successfully`);
      }
      fetchDrivers();
      setShowPanel(false);
      resetForm();
    } catch (error: any) {
      showToast.error(error.response?.data?.detail || 'Failed to save driver');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this driver?')) {
      try {
        await driverAPI.delete(id);
        showToast.success('Driver deleted successfully');
        fetchDrivers();
      } catch (error) {
        console.error('Failed to delete driver:', error);
        showToast.error('Failed to delete driver');
      }
    }
  };

  const handleSendCredentials = async (id: string) => {
    setSendingCredentials(id);
    try {
      await driverAPI.sendCredentials(id);
      showToast.success('Login credentials sent to driver\'s email');
    } catch (error) {
      showToast.error('Failed to send credentials');
    } finally {
      setSendingCredentials(null);
    }
  };

  const isExpiringSoon = (date?: string) => {
    if (!date) return false;
    const expiry = new Date(date);
    const daysUntil = Math.ceil((expiry.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    return daysUntil <= 30 && daysUntil > 0;
  };

  const isExpired = (date?: string) => {
    if (!date) return false;
    return new Date(date) < new Date();
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <div className={`h-8 w-24 rounded ${darkMode ? 'bg-[#334155]' : 'bg-gray-200'} animate-pulse mb-2`}></div>
            <div className={`h-4 w-64 rounded ${darkMode ? 'bg-[#334155]' : 'bg-gray-200'} animate-pulse`}></div>
          </div>
          <div className={`h-10 w-32 rounded-lg ${darkMode ? 'bg-[#334155]' : 'bg-gray-200'} animate-pulse`}></div>
        </div>
        <SkeletonTable rows={5} columns={5} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className={`text-2xl font-bold ${textPrimary}`}>Operators</h1>
          <p className={textSecondary}>Manage your operators and send login credentials</p>
        </div>
        <button
          onClick={openAddPanel}
          data-testid="add-driver-btn"
          className="bg-[#0A1628] hover:bg-[#132337] text-white px-4 py-2.5 rounded-lg font-medium transition flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Operator
        </button>
      </div>

      {/* Operator List */}
      <div className={`${cardBg} border rounded-xl overflow-hidden shadow-sm`}>
        {/* Desktop Table */}
        <div className="hidden lg:block overflow-x-auto">
          <table className="w-full">
            <thead className={tableBg}>
              <tr>
                <th className={`text-left ${textSecondary} font-medium px-6 py-4`}>Name</th>
                <th className={`text-left ${textSecondary} font-medium px-6 py-4`}>Email</th>
                <th className={`text-left ${textSecondary} font-medium px-6 py-4`}>License #</th>
                <th className={`text-left ${textSecondary} font-medium px-6 py-4`}>License Expiry</th>
                <th className={`text-left ${textSecondary} font-medium px-6 py-4`}>Actions</th>
              </tr>
            </thead>
            <tbody className={dividerColor}>
              {drivers.map((driver) => (
                <tr key={driver.id} className={hoverBg}>
                  <td className={`px-6 py-4 ${textPrimary} font-medium`}>{driver.name}</td>
                  <td className={`px-6 py-4 ${textPrimary}`}>{driver.email}</td>
                  <td className={`px-6 py-4 ${textPrimary}`}>{driver.license_number || <span className={`${darkMode ? 'text-gray-400' : 'text-gray-400'} italic`}>Not set</span>}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded text-sm ${
                      isExpired(driver.license_expiry) ? 'bg-red-500/20 text-red-400' :
                      isExpiringSoon(driver.license_expiry) ? 'bg-yellow-500/20 text-yellow-400' :
                      driver.license_expiry ? textPrimary : `${darkMode ? 'text-gray-400' : 'text-gray-400'} italic`
                    }`}>
                      {driver.license_expiry || 'Not set'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => handleSendCredentials(driver.id)}
                        disabled={sendingCredentials === driver.id}
                        data-testid={`send-login-${driver.id}`}
                        className={`font-medium text-sm disabled:opacity-50 ${darkMode ? 'text-green-400 hover:text-green-300' : 'text-green-600 hover:text-green-700'}`}
                      >
                        {sendingCredentials === driver.id ? 'Sending...' : 'Send Login'}
                      </button>
                      <button
                        onClick={() => openEditPanel(driver)}
                        data-testid={`edit-driver-${driver.id}`}
                        className={`font-medium text-sm ${darkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-700'}`}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(driver.id)}
                        data-testid={`delete-driver-${driver.id}`}
                        className={`font-medium text-sm ${darkMode ? 'text-red-400 hover:text-red-300' : 'text-red-500 hover:text-red-600'}`}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards */}
        <div className={`lg:hidden ${dividerColor}`}>
          {drivers.map((driver) => (
            <div key={driver.id} className={`p-4 space-y-3 ${hoverBg}`}>
              <div className="flex justify-between items-start">
                <div>
                  <div className={`${textPrimary} font-medium`}>{driver.name}</div>
                  <div className={`${textSecondary} text-sm`}>{driver.email}</div>
                </div>
                <span className={`px-2 py-1 rounded text-xs ${
                  isExpired(driver.license_expiry) ? 'bg-red-500/20 text-red-400' :
                  isExpiringSoon(driver.license_expiry) ? 'bg-yellow-500/20 text-yellow-400' :
                  darkMode ? 'bg-[#0F172A] text-gray-300' : 'bg-gray-50 text-gray-600'
                }`}>
                  {driver.license_expiry || 'No expiry'}
                </span>
              </div>
              <div className={`text-sm ${textSecondary}`}>
                License: {driver.license_number || 'Not set'}
              </div>
              <div className="flex space-x-4 pt-2">
                <button
                  onClick={() => handleSendCredentials(driver.id)}
                  disabled={sendingCredentials === driver.id}
                  className={`text-sm ${darkMode ? 'text-green-400' : 'text-green-600'}`}
                >
                  {sendingCredentials === driver.id ? 'Sending...' : 'Send Login'}
                </button>
                <button onClick={() => openEditPanel(driver)} className={`text-sm ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>Edit</button>
                <button onClick={() => handleDelete(driver.id)} className={`text-sm ${darkMode ? 'text-red-400' : 'text-red-500'}`}>Delete</button>
              </div>
            </div>
          ))}
        </div>

        {drivers.length === 0 && (
          <EmptyState type="drivers" onAction={openAddPanel} />
        )}
      </div>

      {/* Add/Edit Operator Slide Panel */}
      <SlidePanel
        isOpen={showPanel}
        onClose={() => { setShowPanel(false); resetForm(); }}
        title={editingDriver ? 'Edit Operator' : 'Add New Operator'}
        subtitle={editingDriver ? `Editing ${editingDriver.name}` : 'Add a new operator to your fleet'}
        width="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Basic Info */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={`block text-sm font-medium ${textSecondary} mb-1.5`}>Full Name *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className={`w-full ${inputBg} border rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none transition`}
                placeholder="John Smith"
                data-testid="driver-name-input"
                required
              />
            </div>
            <div>
              <label className={`block text-sm font-medium ${textSecondary} mb-1.5`}>Email *</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className={`w-full ${inputBg} border rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none transition`}
                placeholder="driver@company.com"
                data-testid="driver-email-input"
                required
              />
            </div>
          </div>

          {!editingDriver && (
            <div>
              <label className={`block text-sm font-medium ${textSecondary} mb-1.5`}>Password *</label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className={`w-full ${inputBg} border rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none transition`}
                placeholder="Temporary password for driver"
                data-testid="driver-password-input"
                required={!editingDriver}
                minLength={6}
              />
            </div>
          )}

          <div>
            <label className={`block text-sm font-medium ${textSecondary} mb-1.5`}>Phone</label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className={`w-full ${inputBg} border rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none transition`}
              placeholder="0400 000 000"
              data-testid="driver-phone-input"
            />
          </div>

          {/* License Details Section */}
          <div className={`border-t ${darkMode ? 'border-[#334155]' : 'border-gray-200'} pt-5`}>
            <h3 className={`${textPrimary} font-medium mb-4`}>License Details</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={`block text-sm font-medium ${textSecondary} mb-1.5`}>License Number</label>
                <input
                  type="text"
                  value={formData.license_number}
                  onChange={(e) => setFormData({ ...formData, license_number: e.target.value })}
                  className={`w-full ${inputBg} border rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none transition`}
                  placeholder="12345678"
                  data-testid="driver-license-input"
                />
              </div>
              <div>
                <label className={`block text-sm font-medium ${textSecondary} mb-1.5`}>License Class</label>
                <select
                  value={formData.license_class}
                  onChange={(e) => setFormData({ ...formData, license_class: e.target.value })}
                  className={`w-full ${inputBg} border rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none transition`}
                  data-testid="driver-class-select"
                >
                  <option value="">Select Class</option>
                  <option value="C">C - Car</option>
                  <option value="LR">LR - Light Rigid</option>
                  <option value="MR">MR - Medium Rigid</option>
                  <option value="HR">HR - Heavy Rigid</option>
                  <option value="HC">HC - Heavy Combination</option>
                  <option value="MC">MC - Multi Combination</option>
                </select>
              </div>
              <div className="col-span-2">
                <label className={`block text-sm font-medium ${textSecondary} mb-1.5`}>License Expiry</label>
                <input
                  type="date"
                  value={formData.license_expiry}
                  onChange={(e) => setFormData({ ...formData, license_expiry: e.target.value })}
                  className={`w-full ${inputBg} border rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none transition`}
                  data-testid="driver-license-expiry-input"
                />
              </div>
            </div>
          </div>

          {/* Certifications Section */}
          <div className={`border-t ${darkMode ? 'border-[#334155]' : 'border-gray-200'} pt-5`}>
            <h3 className={`${textPrimary} font-medium mb-4`}>Certifications & Training</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={`block text-sm font-medium ${textSecondary} mb-1.5`}>Medical Certificate Expiry</label>
                <input
                  type="date"
                  value={formData.medical_certificate_expiry}
                  onChange={(e) => setFormData({ ...formData, medical_certificate_expiry: e.target.value })}
                  className={`w-full ${inputBg} border rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none transition`}
                />
              </div>
              <div>
                <label className={`block text-sm font-medium ${textSecondary} mb-1.5`}>First Aid Expiry</label>
                <input
                  type="date"
                  value={formData.first_aid_expiry}
                  onChange={(e) => setFormData({ ...formData, first_aid_expiry: e.target.value })}
                  className={`w-full ${inputBg} border rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none transition`}
                />
              </div>
              <div>
                <label className={`block text-sm font-medium ${textSecondary} mb-1.5`}>Forklift License Expiry</label>
                <input
                  type="date"
                  value={formData.forklift_license_expiry}
                  onChange={(e) => setFormData({ ...formData, forklift_license_expiry: e.target.value })}
                  className={`w-full ${inputBg} border rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none transition`}
                />
              </div>
              <div>
                <label className={`block text-sm font-medium ${textSecondary} mb-1.5`}>Dangerous Goods Expiry</label>
                <input
                  type="date"
                  value={formData.dangerous_goods_expiry}
                  onChange={(e) => setFormData({ ...formData, dangerous_goods_expiry: e.target.value })}
                  className={`w-full ${inputBg} border rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none transition`}
                />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className={`flex gap-3 pt-4 border-t ${darkMode ? 'border-[#334155]' : 'border-gray-200'}`}>
            <button
              type="button"
              onClick={() => { setShowPanel(false); resetForm(); }}
              className={`flex-1 py-2.5 rounded-lg font-medium transition ${darkMode ? 'bg-[#334155] hover:bg-[#475569] text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'}`}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              data-testid="driver-submit-btn"
              className="flex-1 bg-[#0A1628] hover:bg-[#132337] disabled:opacity-50 text-white py-2.5 rounded-lg font-medium transition"
            >
              {saving ? 'Saving...' : editingDriver ? 'Update Driver' : 'Add Driver'}
            </button>
          </div>
        </form>
      </SlidePanel>
    </div>
  );
};

export default DriversPage;
