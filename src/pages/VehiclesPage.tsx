import React, { useEffect, useState } from 'react';
import { vehicleAPI, driverAPI } from '../utils/api';
import { useTheme } from '../contexts/ThemeContext';
import SlidePanel from '../components/SlidePanel';
import EmptyState from '../components/EmptyState';
import { showToast } from '../components/Toast';
import { useKeyboardShortcut, SHORTCUTS } from '../hooks/useKeyboardShortcut';
import { SkeletonTable } from '../components/Skeleton';

interface Vehicle {
  id: string;
  name: string;
  registration_number: string;
  type: string;
  status: string;
  trailer_attached?: string;
  rego_expiry?: string;
  insurance_expiry?: string;
  safety_certificate_expiry?: string;
  coi_expiry?: string;
  service_due_km?: number;
  assigned_driver_ids?: string[];
}

interface Driver {
  id: string;
  name?: string;
  full_name?: string;
  email: string;
}

const VehiclesPage: React.FC = () => {
  const { darkMode } = useTheme();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPanel, setShowPanel] = useState(false);
  const [showAssignPanel, setShowAssignPanel] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [selectedDrivers, setSelectedDrivers] = useState<string[]>([]);
  const [driverSearch, setDriverSearch] = useState('');
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    registration_number: '',
    type: 'truck',
    trailer_attached: '',
    rego_expiry: '',
    insurance_expiry: '',
    safety_certificate_expiry: '',
    coi_expiry: '',
    service_due_km: '',
  });

  // Theme styles - Professional Dark Mode with better contrast
  const cardBg = darkMode ? 'bg-[#1E293B] border-[#334155]' : 'bg-white border-gray-100';
  const textPrimary = darkMode ? 'text-gray-100' : 'text-gray-900';
  const textSecondary = darkMode ? 'text-gray-300' : 'text-gray-500';
  const inputBg = darkMode ? 'bg-[#0F172A] border-[#334155] text-gray-100 placeholder:text-gray-500' : 'bg-white border-gray-200 text-gray-900';
  const hoverBg = darkMode ? 'hover:bg-[#334155]/50' : 'hover:bg-gray-50';
  const dividerColor = darkMode ? 'divide-[#334155]' : 'divide-gray-100';

  // Keyboard shortcuts
  useKeyboardShortcut(SHORTCUTS.NEW, () => openAddPanel());

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [vehiclesRes, driversRes] = await Promise.all([
        vehicleAPI.getAll(),
        driverAPI.getAll(),
      ]);
      setVehicles(vehiclesRes.data);
      setDrivers(driversRes.data);
    } catch (error) {
      console.error('Failed to fetch data:', error);
      showToast.error('Failed to load vehicles');
    } finally {
      setLoading(false);
    }
  };

  const openAddPanel = () => {
    setEditingVehicle(null);
    setFormData({
      name: '',
      registration_number: '',
      type: 'truck',
      trailer_attached: '',
      rego_expiry: '',
      insurance_expiry: '',
      safety_certificate_expiry: '',
      coi_expiry: '',
      service_due_km: '',
    });
    setShowPanel(true);
  };

  const openEditPanel = (vehicle: Vehicle) => {
    setEditingVehicle(vehicle);
    setFormData({
      name: vehicle.name,
      registration_number: vehicle.registration_number,
      type: vehicle.type || 'truck',
      trailer_attached: vehicle.trailer_attached || '',
      rego_expiry: vehicle.rego_expiry || '',
      insurance_expiry: vehicle.insurance_expiry || '',
      safety_certificate_expiry: vehicle.safety_certificate_expiry || '',
      coi_expiry: vehicle.coi_expiry || '',
      service_due_km: vehicle.service_due_km?.toString() || '',
    });
    setShowPanel(true);
  };

  const openAssignPanel = (vehicle: Vehicle) => {
    setSelectedVehicle(vehicle);
    setSelectedDrivers(vehicle.assigned_driver_ids || []);
    setDriverSearch('');
    setShowAssignPanel(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...formData,
        service_due_km: formData.service_due_km ? parseInt(formData.service_due_km) : undefined,
      };
      if (editingVehicle) {
        await vehicleAPI.update(editingVehicle.id, payload);
        showToast.success(`Vehicle "${formData.name}" updated successfully`);
      } else {
        await vehicleAPI.create(payload);
        showToast.success(`Vehicle "${formData.name}" added successfully`);
      }
      setShowPanel(false);
      fetchData();
    } catch (error: any) {
      showToast.error(error.response?.data?.detail || 'Failed to save vehicle');
    } finally {
      setSaving(false);
    }
  };

  const handleAssignDrivers = async () => {
    if (!selectedVehicle) return;
    setSaving(true);
    try {
      await vehicleAPI.assignDrivers(selectedVehicle.id, selectedDrivers);
      showToast.success('Drivers assigned successfully');
      setShowAssignPanel(false);
      fetchData();
    } catch (error: any) {
      showToast.error(error.response?.data?.detail || 'Failed to assign drivers');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this vehicle?')) {
      try {
        await vehicleAPI.delete(id);
        showToast.success('Vehicle deleted successfully');
        fetchData();
      } catch (error: any) {
        showToast.error(error.response?.data?.detail || 'Failed to delete vehicle');
      }
    }
  };

  const getDriverName = (id: string) => {
    const driver = drivers.find(d => d.id === id);
    return driver?.full_name || driver?.name || 'Unknown';
  };

  const filteredDrivers = drivers.filter(d => 
    (d.full_name || d.name || '')?.toLowerCase().includes(driverSearch.toLowerCase()) ||
    d.email?.toLowerCase().includes(driverSearch.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      active: 'bg-green-100 text-green-700',
      inactive: 'bg-gray-100 text-gray-600',
      maintenance: 'bg-yellow-100 text-yellow-700',
    };
    return styles[status] || styles.active;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <div className={`h-8 w-32 rounded ${darkMode ? 'bg-[#334155]' : 'bg-gray-200'} animate-pulse mb-2`}></div>
            <div className={`h-4 w-48 rounded ${darkMode ? 'bg-[#334155]' : 'bg-gray-200'} animate-pulse`}></div>
          </div>
          <div className={`h-10 w-32 rounded-lg ${darkMode ? 'bg-[#334155]' : 'bg-gray-200'} animate-pulse`}></div>
        </div>
        <SkeletonTable rows={6} columns={6} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className={`text-2xl font-bold ${textPrimary}`}>Equipment</h1>
          <p className={textSecondary}>{vehicles.length} equipment in your fleet</p>
        </div>
        <button
          onClick={openAddPanel}
          data-testid="add-vehicle-btn"
          className="bg-[#0A1628] hover:bg-[#132337] text-white px-4 py-2.5 rounded-lg font-medium transition flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Equipment
        </button>
      </div>

      {/* Equipment Table */}
      <div className={`${cardBg} border rounded-xl overflow-hidden shadow-sm`}>
        <table className="w-full">
          <thead className={darkMode ? 'bg-[#0F172A]' : 'bg-gray-50'}>
            <tr>
              <th className={`text-left ${textSecondary} font-medium px-6 py-4`}>Equipment</th>
              <th className={`text-left ${textSecondary} font-medium px-6 py-4`}>Registration</th>
              <th className={`text-left ${textSecondary} font-medium px-6 py-4`}>Type</th>
              <th className={`text-left ${textSecondary} font-medium px-6 py-4`}>Status</th>
              <th className={`text-left ${textSecondary} font-medium px-6 py-4`}>Assigned Operators</th>
              <th className={`text-left ${textSecondary} font-medium px-6 py-4`}>Actions</th>
            </tr>
          </thead>
          <tbody className={dividerColor}>
            {vehicles.map((vehicle) => (
              <tr key={vehicle.id} className={hoverBg}>
                <td className={`px-6 py-4 ${textPrimary} font-medium`}>{vehicle.name}</td>
                <td className={`px-6 py-4 ${textPrimary}`}>{vehicle.registration_number}</td>
                <td className={`px-6 py-4`}>
                  <span className={`px-2 py-1 rounded text-xs font-medium capitalize ${darkMode ? 'bg-[#0F172A] text-gray-300' : 'bg-gray-100 text-gray-600'}`}>
                    {vehicle.type || 'truck'}
                  </span>
                </td>
                <td className={`px-6 py-4`}>
                  <span className={`px-2 py-1 rounded text-xs font-medium capitalize ${getStatusBadge(vehicle.status)}`}>
                    {vehicle.status || 'active'}
                  </span>
                </td>
                <td className={`px-6 py-4`}>
                  {vehicle.assigned_driver_ids?.length ? (
                    <div className="flex flex-wrap gap-1">
                      {vehicle.assigned_driver_ids.slice(0, 2).map(id => (
                        <span key={id} className={`px-2 py-0.5 rounded text-xs ${darkMode ? 'bg-cyan-500/20 text-cyan-300' : 'bg-cyan-100 text-cyan-700'}`}>
                          {getDriverName(id)}
                        </span>
                      ))}
                      {vehicle.assigned_driver_ids.length > 2 && (
                        <span className={`text-xs ${textSecondary}`}>+{vehicle.assigned_driver_ids.length - 2}</span>
                      )}
                    </div>
                  ) : (
                    <span className={`${darkMode ? 'text-gray-400' : 'text-gray-400'} italic`}>Not assigned</span>
                  )}
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => openAssignPanel(vehicle)}
                      data-testid={`assign-vehicle-${vehicle.id}`}
                      className={`font-medium text-sm ${darkMode ? 'text-cyan-400 hover:text-cyan-300' : 'text-cyan-600 hover:text-cyan-700'}`}
                    >
                      Assign
                    </button>
                    <button
                      onClick={() => openEditPanel(vehicle)}
                      data-testid={`edit-vehicle-${vehicle.id}`}
                      className={`font-medium text-sm ${darkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-700'}`}
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(vehicle.id)}
                      data-testid={`delete-vehicle-${vehicle.id}`}
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

        {vehicles.length === 0 && (
          <div className={`text-center py-12 ${textSecondary}`}>
            No equipment yet. Add your first equipment to get started.
          </div>
        )}
      </div>

      {/* Add/Edit Equipment Panel */}
      <SlidePanel
        isOpen={showPanel}
        onClose={() => setShowPanel(false)}
        title={editingVehicle ? 'Edit Equipment' : 'Add New Equipment'}
        subtitle={editingVehicle ? `Editing ${editingVehicle.name}` : 'Add new equipment to your fleet'}
        width="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className={`block text-sm font-medium ${textSecondary} mb-1.5`}>Equipment Name *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className={`w-full ${inputBg} border rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none transition`}
                placeholder="e.g., Forklift 01, Excavator A"
                data-testid="vehicle-name-input"
                required
              />
            </div>
            <div>
              <label className={`block text-sm font-medium ${textSecondary} mb-1.5`}>Registration *</label>
              <input
                type="text"
                value={formData.registration_number}
                onChange={(e) => setFormData({ ...formData, registration_number: e.target.value })}
                className={`w-full ${inputBg} border rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none transition`}
                placeholder="ABC-123"
                data-testid="vehicle-registration-input"
                required
              />
            </div>
            <div>
              <label className={`block text-sm font-medium ${textSecondary} mb-1.5`}>Equipment Type</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className={`w-full ${inputBg} border rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none transition`}
                data-testid="vehicle-type-select"
              >
                <optgroup label="Transport">
                  <option value="truck">Truck</option>
                  <option value="trailer">Trailer</option>
                  <option value="van">Van</option>
                  <option value="ute">Ute</option>
                  <option value="bus">Bus</option>
                </optgroup>
                <optgroup label="Construction">
                  <option value="excavator">Excavator</option>
                  <option value="loader">Loader</option>
                  <option value="bulldozer">Bulldozer</option>
                  <option value="crane">Crane</option>
                  <option value="grader">Grader</option>
                  <option value="roller">Roller</option>
                </optgroup>
                <optgroup label="Warehouse">
                  <option value="forklift">Forklift</option>
                  <option value="reach-truck">Reach Truck</option>
                  <option value="pallet-jack">Electric Pallet Jack</option>
                  <option value="order-picker">Order Picker</option>
                </optgroup>
                <optgroup label="Agriculture">
                  <option value="tractor">Tractor</option>
                  <option value="harvester">Harvester</option>
                  <option value="sprayer">Sprayer</option>
                </optgroup>
                <optgroup label="Other Equipment">
                  <option value="generator">Generator</option>
                  <option value="compressor">Compressor</option>
                  <option value="pump">Pump</option>
                  <option value="welder">Welder</option>
                  <option value="other">Other</option>
                </optgroup>
              </select>
            </div>
          </div>

          <div className={`border-t ${darkMode ? 'border-[#334155]' : 'border-gray-200'} pt-5`}>
            <h3 className={`text-sm font-semibold ${textPrimary} mb-4`}>Expiry Dates</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={`block text-sm ${textSecondary} mb-1.5`}>Rego Expiry</label>
                <input
                  type="date"
                  value={formData.rego_expiry}
                  onChange={(e) => setFormData({ ...formData, rego_expiry: e.target.value })}
                  className={`w-full ${inputBg} border rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none transition`}
                />
              </div>
              <div>
                <label className={`block text-sm ${textSecondary} mb-1.5`}>Insurance Expiry</label>
                <input
                  type="date"
                  value={formData.insurance_expiry}
                  onChange={(e) => setFormData({ ...formData, insurance_expiry: e.target.value })}
                  className={`w-full ${inputBg} border rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none transition`}
                />
              </div>
              <div>
                <label className={`block text-sm ${textSecondary} mb-1.5`}>Safety Certificate</label>
                <input
                  type="date"
                  value={formData.safety_certificate_expiry}
                  onChange={(e) => setFormData({ ...formData, safety_certificate_expiry: e.target.value })}
                  className={`w-full ${inputBg} border rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none transition`}
                />
              </div>
              <div>
                <label className={`block text-sm ${textSecondary} mb-1.5`}>COI Expiry</label>
                <input
                  type="date"
                  value={formData.coi_expiry}
                  onChange={(e) => setFormData({ ...formData, coi_expiry: e.target.value })}
                  className={`w-full ${inputBg} border rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none transition`}
                />
              </div>
            </div>
          </div>

          <div className={`border-t ${darkMode ? 'border-[#334155]' : 'border-gray-200'} pt-5`}>
            <h3 className={`text-sm font-semibold ${textPrimary} mb-4`}>Additional Info</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={`block text-sm ${textSecondary} mb-1.5`}>Trailer Attached</label>
                <input
                  type="text"
                  value={formData.trailer_attached}
                  onChange={(e) => setFormData({ ...formData, trailer_attached: e.target.value })}
                  className={`w-full ${inputBg} border rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none transition`}
                  placeholder="Trailer rego if attached"
                />
              </div>
              <div>
                <label className={`block text-sm ${textSecondary} mb-1.5`}>Service Due (km)</label>
                <input
                  type="number"
                  value={formData.service_due_km}
                  onChange={(e) => setFormData({ ...formData, service_due_km: e.target.value })}
                  className={`w-full ${inputBg} border rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none transition`}
                  placeholder="e.g., 150000"
                />
              </div>
            </div>
          </div>

          <div className={`flex gap-3 pt-4 border-t ${darkMode ? 'border-[#334155]' : 'border-gray-200'}`}>
            <button
              type="button"
              onClick={() => setShowPanel(false)}
              data-testid="vehicle-cancel-btn"
              className={`flex-1 py-2.5 rounded-lg font-medium transition ${darkMode ? 'bg-[#334155] hover:bg-[#475569] text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'}`}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              data-testid="vehicle-submit-btn"
              className="flex-1 bg-[#0A1628] hover:bg-[#132337] disabled:opacity-50 text-white py-2.5 rounded-lg font-medium transition"
            >
              {saving ? 'Saving...' : editingVehicle ? 'Update Equipment' : 'Add Equipment'}
            </button>
          </div>
        </form>
      </SlidePanel>

      {/* Assign Drivers Panel */}
      <SlidePanel
        isOpen={showAssignPanel}
        onClose={() => setShowAssignPanel(false)}
        title="Assign Drivers"
        subtitle={selectedVehicle ? `Select drivers for ${selectedVehicle.name}` : ''}
        width="md"
      >
        <div className="space-y-4">
          {/* Search */}
          <div className="relative">
            <svg className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 ${textSecondary}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={driverSearch}
              onChange={(e) => setDriverSearch(e.target.value)}
              placeholder="Search drivers..."
              className={`w-full pl-10 pr-4 py-2.5 ${inputBg} border rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none transition`}
            />
          </div>

          {/* Driver List */}
          <div className={`border ${darkMode ? 'border-[#334155]' : 'border-gray-200'} rounded-lg divide-y ${darkMode ? 'divide-[#334155]' : 'divide-gray-100'} max-h-80 overflow-y-auto`}>
            {filteredDrivers.map((driver) => (
              <label
                key={driver.id}
                className={`flex items-center gap-3 p-3 cursor-pointer ${hoverBg} transition`}
              >
                <input
                  type="checkbox"
                  checked={selectedDrivers.includes(driver.id)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedDrivers([...selectedDrivers, driver.id]);
                    } else {
                      setSelectedDrivers(selectedDrivers.filter(id => id !== driver.id));
                    }
                  }}
                  className="w-4 h-4 rounded border-gray-300 text-cyan-500 focus:ring-cyan-500"
                />
                <div>
                  <div className={textPrimary}>{driver.full_name || driver.name}</div>
                  <div className={`text-sm ${textSecondary}`}>{driver.email}</div>
                </div>
              </label>
            ))}
            {filteredDrivers.length === 0 && (
              <div className={`p-4 text-center ${textSecondary}`}>No drivers found</div>
            )}
          </div>

          {/* Selected count */}
          <div className={`text-sm ${textSecondary}`}>
            {selectedDrivers.length} driver{selectedDrivers.length !== 1 ? 's' : ''} selected
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={() => setShowAssignPanel(false)}
              className={`flex-1 py-2.5 rounded-lg font-medium transition ${darkMode ? 'bg-[#334155] hover:bg-[#475569] text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'}`}
            >
              Cancel
            </button>
            <button
              onClick={handleAssignDrivers}
              disabled={saving}
              className="flex-1 bg-[#0A1628] hover:bg-[#132337] disabled:opacity-50 text-white py-2.5 rounded-lg font-medium transition"
            >
              {saving ? 'Saving...' : 'Save Assignment'}
            </button>
          </div>
        </div>
      </SlidePanel>
    </div>
  );
};

export default VehiclesPage;
