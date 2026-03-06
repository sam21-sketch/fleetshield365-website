import React, { useEffect, useState } from 'react';
import { driverAPI } from '../utils/api';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import SlidePanel from '../components/SlidePanel';
import EmptyState from '../components/EmptyState';
import { showToast } from '../components/Toast';
import { useKeyboardShortcut, SHORTCUTS } from '../hooks/useKeyboardShortcut';
import { SkeletonTable } from '../components/Skeleton';

interface Driver {
  id: string;
  name: string;
  email?: string;
  username?: string;
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
  const { user } = useAuth();
  const isOwner = user?.role === 'super_admin';
  
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
    auto_generate_username: true,
  });
  const [sendingCredentials, setSendingCredentials] = useState<string | null>(null);
  
  // License photo states
  const [licensePhotoFront, setLicensePhotoFront] = useState<string | null>(null);
  const [licensePhotoBack, setLicensePhotoBack] = useState<string | null>(null);
  const [hasExistingPhotos, setHasExistingPhotos] = useState({ front: false, back: false });
  const [uploadingPhotos, setUploadingPhotos] = useState(false);
  
  // Password verification modal for viewing photos
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [verifyingPassword, setVerifyingPassword] = useState(false);
  const [viewingPhotos, setViewingPhotos] = useState<{ front: string | null; back: string | null } | null>(null);
  const [showPhotoViewer, setShowPhotoViewer] = useState(false);

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
      auto_generate_username: true,
    });
    // Reset license photo states
    setLicensePhotoFront(null);
    setLicensePhotoBack(null);
    setHasExistingPhotos({ front: false, back: false });
  };

  const openAddPanel = () => {
    resetForm();
    setShowPanel(true);
  };

  const openEditPanel = async (driver: Driver) => {
    setEditingDriver(driver);
    setFormData({
      name: driver.name,
      email: driver.email || '',
      phone: driver.phone || '',
      license_number: driver.license_number || '',
      license_class: driver.license_class || '',
      license_expiry: driver.license_expiry || '',
      medical_certificate_expiry: driver.medical_certificate_expiry || '',
      first_aid_expiry: driver.first_aid_expiry || '',
      forklift_license_expiry: driver.forklift_license_expiry || '',
      dangerous_goods_expiry: driver.dangerous_goods_expiry || '',
      password: '',
      auto_generate_username: false, // Don't show for editing
    });
    setShowPanel(true);
    
    // Check for existing license photos (Owner only)
    if (isOwner) {
      try {
        const response = await driverAPI.hasLicensePhotos(driver.id);
        setHasExistingPhotos({
          front: response.data.has_front_photo,
          back: response.data.has_back_photo,
        });
      } catch {
        setHasExistingPhotos({ front: false, back: false });
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingDriver) {
        await driverAPI.update(editingDriver.id, formData);
        showToast.success(`Driver "${formData.name}" updated successfully`);
      } else {
        const payload = {
          ...formData,
          role: 'driver',
          email: formData.email || undefined, // Don't send empty string
        };
        const response = await driverAPI.create(payload);
        const username = response.data?.username;
        if (username) {
          showToast.success(`Driver "${formData.name}" added! Username: ${username}`);
        } else {
          showToast.success(`Driver "${formData.name}" added successfully`);
        }
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

  // License photo handling functions
  const handlePhotoSelect = (type: 'front' | 'back') => (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        showToast.error('Photo must be less than 5MB');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        if (type === 'front') {
          setLicensePhotoFront(reader.result as string);
        } else {
          setLicensePhotoBack(reader.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUploadLicensePhotos = async () => {
    if (!editingDriver || (!licensePhotoFront && !licensePhotoBack)) return;
    
    setUploadingPhotos(true);
    try {
      await driverAPI.uploadLicensePhotos(editingDriver.id, {
        front_photo_base64: licensePhotoFront || undefined,
        back_photo_base64: licensePhotoBack || undefined,
      });
      showToast.success('License photos uploaded successfully');
      setHasExistingPhotos({
        front: hasExistingPhotos.front || !!licensePhotoFront,
        back: hasExistingPhotos.back || !!licensePhotoBack,
      });
      setLicensePhotoFront(null);
      setLicensePhotoBack(null);
    } catch (error: any) {
      showToast.error(error.response?.data?.detail || 'Failed to upload photos');
    } finally {
      setUploadingPhotos(false);
    }
  };

  const handleViewLicensePhotos = () => {
    setPasswordInput('');
    setShowPasswordModal(true);
  };

  const handleVerifyPasswordAndView = async () => {
    if (!editingDriver || !passwordInput) return;
    
    setVerifyingPassword(true);
    try {
      const response = await driverAPI.viewLicensePhotos(editingDriver.id, passwordInput);
      setViewingPhotos({
        front: response.data.front_photo,
        back: response.data.back_photo,
      });
      setShowPasswordModal(false);
      setShowPhotoViewer(true);
      setPasswordInput('');
    } catch (error: any) {
      showToast.error(error.response?.data?.detail || 'Invalid password');
    } finally {
      setVerifyingPassword(false);
    }
  };

  const handleDeleteLicensePhotos = async () => {
    if (!editingDriver) return;
    if (!window.confirm('Are you sure you want to delete all license photos for this operator?')) return;
    
    try {
      await driverAPI.deleteLicensePhotos(editingDriver.id);
      showToast.success('License photos deleted');
      setHasExistingPhotos({ front: false, back: false });
      setViewingPhotos(null);
      setShowPhotoViewer(false);
    } catch (error: any) {
      showToast.error(error.response?.data?.detail || 'Failed to delete photos');
    }
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
                <th className={`text-left ${textSecondary} font-medium px-6 py-4`}>Email / Username</th>
                <th className={`text-left ${textSecondary} font-medium px-6 py-4`}>License #</th>
                <th className={`text-left ${textSecondary} font-medium px-6 py-4`}>License Expiry</th>
                <th className={`text-left ${textSecondary} font-medium px-6 py-4`}>Actions</th>
              </tr>
            </thead>
            <tbody className={dividerColor}>
              {drivers.map((driver) => (
                <tr key={driver.id} className={hoverBg}>
                  <td className={`px-6 py-4 ${textPrimary} font-medium`}>{driver.name}</td>
                  <td className={`px-6 py-4 ${textPrimary}`}>{driver.email || <span className="text-cyan-400 text-sm">@{driver.username}</span>}</td>
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
                  <div className={`${textSecondary} text-sm`}>
                    {driver.email || <span className="text-cyan-400">@{driver.username}</span>}
                  </div>
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
              <label className={`block text-sm font-medium ${textSecondary} mb-1.5`}>
                Email {!formData.auto_generate_username && '*'}
                {formData.auto_generate_username && <span className="text-gray-400 font-normal">(Optional)</span>}
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className={`w-full ${inputBg} border rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none transition`}
                placeholder="driver@company.com"
                data-testid="driver-email-input"
                required={!formData.auto_generate_username}
              />
            </div>
          </div>

          {/* Auto-generate username toggle */}
          {!editingDriver && (
            <div className={`p-4 rounded-lg ${darkMode ? 'bg-[#0F172A]' : 'bg-gray-50'} border ${darkMode ? 'border-[#334155]' : 'border-gray-200'}`}>
              <div className="flex items-center mb-2">
                <input
                  type="checkbox"
                  id="auto_generate_username"
                  checked={formData.auto_generate_username}
                  onChange={(e) => setFormData({ ...formData, auto_generate_username: e.target.checked })}
                  className="w-4 h-4 text-cyan-600 border-gray-300 rounded focus:ring-cyan-500"
                />
                <label htmlFor="auto_generate_username" className={`ml-2 ${textPrimary} text-sm font-medium`}>
                  Auto-generate username
                </label>
              </div>
              {formData.auto_generate_username && formData.name && (
                <div className={`mt-2 p-3 rounded-lg ${darkMode ? 'bg-cyan-500/10 border-cyan-500/30' : 'bg-cyan-50 border-cyan-200'} border`}>
                  <div className={`${textSecondary} text-xs mb-1`}>Generated Username</div>
                  <div className="text-cyan-500 font-bold text-lg">
                    @{formData.name.toLowerCase().replace(/[^a-z0-9]/g, '.').replace(/\.+/g, '.').replace(/^\.+|\.+$/g, '')}
                  </div>
                </div>
              )}
              {!formData.name && formData.auto_generate_username && (
                <p className={`${textSecondary} text-xs mt-1 ml-6`}>Enter name to see generated username</p>
              )}
            </div>
          )}

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
            
            {/* License Photos - Owner Only */}
            {isOwner && editingDriver && (
              <div className="mt-5 pt-4 border-t border-dashed border-[#334155]">
                <div className="flex items-center justify-between mb-3">
                  <h4 className={`${textPrimary} font-medium text-sm`}>License Photos (Secure)</h4>
                  {(hasExistingPhotos.front || hasExistingPhotos.back) && (
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={handleViewLicensePhotos}
                        className="text-xs px-3 py-1.5 rounded-lg bg-teal-500/20 text-teal-400 hover:bg-teal-500/30 transition"
                        data-testid="view-license-photos-btn"
                      >
                        View Photos
                      </button>
                      <button
                        type="button"
                        onClick={handleDeleteLicensePhotos}
                        className="text-xs px-3 py-1.5 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition"
                        data-testid="delete-license-photos-btn"
                      >
                        Delete All
                      </button>
                    </div>
                  )}
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  {/* Front Photo */}
                  <div>
                    <label className={`block text-xs ${textSecondary} mb-2`}>
                      Front {hasExistingPhotos.front && <span className="text-green-400">(Uploaded)</span>}
                    </label>
                    <label className={`flex flex-col items-center justify-center w-full h-28 border-2 border-dashed rounded-lg cursor-pointer transition ${
                      licensePhotoFront 
                        ? 'border-teal-500 bg-teal-500/10' 
                        : darkMode ? 'border-[#334155] hover:border-[#475569] bg-[#0F172A]' : 'border-gray-300 hover:border-gray-400 bg-gray-50'
                    }`}>
                      {licensePhotoFront ? (
                        <div className="text-center">
                          <svg className="w-8 h-8 mx-auto text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          <span className="text-xs text-teal-400 mt-1">Photo selected</span>
                        </div>
                      ) : (
                        <div className="text-center">
                          <svg className={`w-8 h-8 mx-auto ${textSecondary}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <span className={`text-xs ${textSecondary} mt-1`}>Click to upload</span>
                        </div>
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handlePhotoSelect('front')}
                        className="hidden"
                        data-testid="license-photo-front-input"
                      />
                    </label>
                  </div>
                  
                  {/* Back Photo */}
                  <div>
                    <label className={`block text-xs ${textSecondary} mb-2`}>
                      Back {hasExistingPhotos.back && <span className="text-green-400">(Uploaded)</span>}
                    </label>
                    <label className={`flex flex-col items-center justify-center w-full h-28 border-2 border-dashed rounded-lg cursor-pointer transition ${
                      licensePhotoBack 
                        ? 'border-teal-500 bg-teal-500/10' 
                        : darkMode ? 'border-[#334155] hover:border-[#475569] bg-[#0F172A]' : 'border-gray-300 hover:border-gray-400 bg-gray-50'
                    }`}>
                      {licensePhotoBack ? (
                        <div className="text-center">
                          <svg className="w-8 h-8 mx-auto text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          <span className="text-xs text-teal-400 mt-1">Photo selected</span>
                        </div>
                      ) : (
                        <div className="text-center">
                          <svg className={`w-8 h-8 mx-auto ${textSecondary}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <span className={`text-xs ${textSecondary} mt-1`}>Click to upload</span>
                        </div>
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handlePhotoSelect('back')}
                        className="hidden"
                        data-testid="license-photo-back-input"
                      />
                    </label>
                  </div>
                </div>
                
                {(licensePhotoFront || licensePhotoBack) && (
                  <button
                    type="button"
                    onClick={handleUploadLicensePhotos}
                    disabled={uploadingPhotos}
                    className="mt-3 w-full py-2 bg-teal-500 hover:bg-teal-600 disabled:bg-teal-500/50 text-white text-sm font-medium rounded-lg transition"
                    data-testid="upload-license-photos-btn"
                  >
                    {uploadingPhotos ? 'Uploading...' : 'Upload License Photos'}
                  </button>
                )}
                
                <p className={`text-xs ${textSecondary} mt-2`}>
                  Only you (Company Owner) can view these photos. Password required to access.
                </p>
              </div>
            )}
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

      {/* Password Verification Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className={`${darkMode ? 'bg-[#1E293B] border-[#334155]' : 'bg-white border-gray-200'} border rounded-xl p-6 w-full max-w-sm mx-4 shadow-2xl`}>
            <h3 className={`${textPrimary} font-semibold text-lg mb-2`}>Verify Password</h3>
            <p className={`${textSecondary} text-sm mb-4`}>Enter your password to view license photos</p>
            
            <input
              type="password"
              value={passwordInput}
              onChange={(e) => setPasswordInput(e.target.value)}
              placeholder="Enter your password"
              className={`w-full ${inputBg} border rounded-lg px-4 py-2.5 mb-4 focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none`}
              data-testid="password-verify-input"
              autoFocus
              onKeyDown={(e) => e.key === 'Enter' && handleVerifyPasswordAndView()}
            />
            
            <div className="flex gap-3">
              <button
                onClick={() => { setShowPasswordModal(false); setPasswordInput(''); }}
                className={`flex-1 py-2.5 rounded-lg font-medium ${darkMode ? 'bg-[#334155] hover:bg-[#475569] text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'}`}
              >
                Cancel
              </button>
              <button
                onClick={handleVerifyPasswordAndView}
                disabled={verifyingPassword || !passwordInput}
                className="flex-1 py-2.5 bg-teal-500 hover:bg-teal-600 disabled:bg-teal-500/50 text-white rounded-lg font-medium"
                data-testid="password-verify-btn"
              >
                {verifyingPassword ? 'Verifying...' : 'View Photos'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Photo Viewer Modal */}
      {showPhotoViewer && viewingPhotos && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <div className={`${darkMode ? 'bg-[#1E293B] border-[#334155]' : 'bg-white border-gray-200'} border rounded-xl p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-auto shadow-2xl`}>
            <div className="flex justify-between items-center mb-4">
              <h3 className={`${textPrimary} font-semibold text-lg`}>
                License Photos - {editingDriver?.name}
              </h3>
              <button
                onClick={() => { setShowPhotoViewer(false); setViewingPhotos(null); }}
                className={`p-2 rounded-lg ${darkMode ? 'hover:bg-[#334155]' : 'hover:bg-gray-100'}`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Front Photo */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className={`${textSecondary} text-sm`}>Front</p>
                  {viewingPhotos.front && (
                    <a
                      href={viewingPhotos.front}
                      download={`${editingDriver?.name || 'license'}_front.png`}
                      className="text-xs px-2 py-1 rounded bg-teal-500/20 text-teal-400 hover:bg-teal-500/30 transition flex items-center gap-1"
                      data-testid="download-front-photo-btn"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                      Download
                    </a>
                  )}
                </div>
                {viewingPhotos.front ? (
                  <img
                    src={viewingPhotos.front}
                    alt="License Front"
                    className="w-full rounded-lg border border-[#334155]"
                    data-testid="license-photo-front-view"
                  />
                ) : (
                  <div className={`w-full h-48 flex items-center justify-center rounded-lg ${darkMode ? 'bg-[#0F172A] border-[#334155]' : 'bg-gray-50 border-gray-200'} border`}>
                    <p className={textSecondary}>No front photo</p>
                  </div>
                )}
              </div>
              
              {/* Back Photo */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className={`${textSecondary} text-sm`}>Back</p>
                  {viewingPhotos.back && (
                    <a
                      href={viewingPhotos.back}
                      download={`${editingDriver?.name || 'license'}_back.png`}
                      className="text-xs px-2 py-1 rounded bg-teal-500/20 text-teal-400 hover:bg-teal-500/30 transition flex items-center gap-1"
                      data-testid="download-back-photo-btn"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                      Download
                    </a>
                  )}
                </div>
                {viewingPhotos.back ? (
                  <img
                    src={viewingPhotos.back}
                    alt="License Back"
                    className="w-full rounded-lg border border-[#334155]"
                    data-testid="license-photo-back-view"
                  />
                ) : (
                  <div className={`w-full h-48 flex items-center justify-center rounded-lg ${darkMode ? 'bg-[#0F172A] border-[#334155]' : 'bg-gray-50 border-gray-200'} border`}>
                    <p className={textSecondary}>No back photo</p>
                  </div>
                )}
              </div>
            </div>
            
            <div className="mt-4 pt-4 border-t border-[#334155] flex justify-end gap-3">
              <button
                onClick={handleDeleteLicensePhotos}
                className="px-4 py-2 bg-red-500/20 text-red-400 hover:bg-red-500/30 rounded-lg text-sm font-medium"
              >
                Delete Photos
              </button>
              <button
                onClick={() => { setShowPhotoViewer(false); setViewingPhotos(null); }}
                className="px-4 py-2 bg-[#334155] hover:bg-[#475569] text-white rounded-lg text-sm font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DriversPage;
