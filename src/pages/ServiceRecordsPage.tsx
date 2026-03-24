// Force rebuild: 2026-03-13T04:45:00
import React, { useEffect, useState } from 'react';
import { serviceRecordAPI, vehicleAPI } from '../utils/api';
import { useTheme } from '../contexts/ThemeContext';
import EmptyState from '../components/EmptyState';
import { SkeletonTable, SkeletonCard } from '../components/Skeleton';
import SlidePanel from '../components/SlidePanel';
import { compressImage, CompressionPresets } from '../utils/imageCompression';
import { downloadFile, downloadPdf, downloadCsv } from '../utils/mobileDownload';
import { formatDateTimeAU, formatDateShortAU } from '../utils/dateUtils';

interface ServiceRecord {
  id: string;
  vehicle_id: string;
  service_date: string;
  service_type: 'small' | 'medium' | 'large' | 'warranty' | 'other';
  service_type_other?: string;
  description: string;
  cost?: number;
  odometer_reading?: number;
  technician_name?: string;
  workshop_name?: string;
  next_service_date?: string;
  next_service_odometer?: number;
  attachments?: string[];
  warranty_until?: string;
  warranty_notes?: string;
  created_at: string;
}

interface Vehicle {
  id: string;
  name: string;
  registration_number: string;
}

interface Summary {
  total_records: number;
  total_cost: number;
  this_month_records: number;
  this_month_cost: number;
  by_type: Record<string, number>;
}

const ServiceRecordsPage: React.FC = () => {
  const { darkMode } = useTheme();
  const [records, setRecords] = useState<ServiceRecord[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [filterVehicle, setFilterVehicle] = useState<string>('');
  const [filterType, setFilterType] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showPanel, setShowPanel] = useState(false);
  const [editingRecord, setEditingRecord] = useState<ServiceRecord | null>(null);
  const [saving, setSaving] = useState(false);
  const [isViewMode, setIsViewMode] = useState(true); // New: View mode first
  const [downloadingPdf, setDownloadingPdf] = useState(false); // Loading state for PDF download

  // Form state
  const [formData, setFormData] = useState({
    vehicle_id: '',
    service_date: new Date().toISOString().split('T')[0],
    service_type: 'small' as 'small' | 'medium' | 'large' | 'warranty' | 'other',
    service_type_other: '',
    description: '',
    cost: '',
    odometer_reading: '',
    technician_name: '',
    workshop_name: '',
    next_service_date: '',
    next_service_odometer: '',
    warranty_until: '',
    warranty_notes: '',
    attachments: [] as string[],
  });

  // Photo handling
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    
    // Compress each file immediately on upload
    for (const file of Array.from(files)) {
      if (file.size > 10 * 1024 * 1024) { // 10MB limit before compression
        alert('File too large. Max 10MB per photo.');
        continue;
      }
      
      try {
        // Compress immediately - this is the key optimization
        const compressed = await compressImage(file, CompressionPresets.inspection);
        setFormData(prev => ({
          ...prev,
          attachments: [...prev.attachments, compressed]
        }));
      } catch (error) {
        console.error('Failed to compress image:', error);
        // Fallback to original if compression fails
        const reader = new FileReader();
        reader.onloadend = () => {
          setFormData(prev => ({
            ...prev,
            attachments: [...prev.attachments, reader.result as string]
          }));
        };
        reader.readAsDataURL(file);
      }
    }
    
    // Reset input
    e.target.value = '';
  };

  const removePhoto = (index: number) => {
    setFormData(prev => ({
      ...prev,
      attachments: prev.attachments.filter((_, i) => i !== index)
    }));
  };

  // Theme styles
  const cardBg = darkMode ? 'bg-[#1E293B] border-[#334155]' : 'bg-white border-gray-100';
  const textPrimary = darkMode ? 'text-gray-100' : 'text-gray-900';
  const textSecondary = darkMode ? 'text-gray-300' : 'text-gray-500';
  const inputBg = darkMode ? 'bg-[#0F172A] border-[#334155] text-gray-100' : 'bg-gray-50 border-gray-200 text-gray-900';
  const tableBg = darkMode ? 'bg-[#0F172A]' : 'bg-gray-50';
  const dividerColor = darkMode ? 'divide-[#334155]' : 'divide-gray-100';
  const hoverBg = darkMode ? 'hover:bg-[#334155]/50' : 'hover:bg-gray-50';

  useEffect(() => {
    fetchData();
  }, []);

  // Client-side filtering for instant response
  const filteredRecords = records.filter(record => {
    if (filterVehicle && record.vehicle_id !== filterVehicle) return false;
    if (filterType && record.service_type !== filterType) return false;
    if (searchQuery) {
      const search = searchQuery.toLowerCase();
      const vehicleName = getVehicleName(record.vehicle_id).toLowerCase();
      const description = (record.description || '').toLowerCase();
      const workshop = (record.workshop_name || '').toLowerCase();
      if (!vehicleName.includes(search) && !description.includes(search) && !workshop.includes(search)) {
        return false;
      }
    }
    return true;
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch ALL records once (no filter params) for instant client-side filtering
      const [vehiclesRes, summaryRes, recordsRes] = await Promise.all([
        vehicleAPI.getAll(),
        serviceRecordAPI.getSummary(),
        serviceRecordAPI.getAll({ limit: 200 }),  // Get all records
      ]);
      setVehicles(Array.isArray(vehiclesRes.data) ? vehiclesRes.data : vehiclesRes.data || []);
      setSummary(summaryRes.data);
      setRecords(recordsRes.data.data || []);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getVehicleName = (id: string) => {
    const vehicle = vehicles.find((v) => v.id === id);
    return vehicle ? `${vehicle.name} (${vehicle.registration_number})` : 'Unknown';
  };

  const getServiceTypeLabel = (record: ServiceRecord) => {
    if (record.service_type === 'other' && record.service_type_other) {
      return `Other: ${record.service_type_other}`;
    }
    return record.service_type.charAt(0).toUpperCase() + record.service_type.slice(1);
  };

  const getServiceTypeBadgeColor = (type: string) => {
    const colors: Record<string, string> = {
      small: darkMode ? 'bg-green-500/20 text-green-400' : 'bg-green-100 text-green-700',
      medium: darkMode ? 'bg-yellow-500/20 text-yellow-400' : 'bg-yellow-100 text-yellow-700',
      large: darkMode ? 'bg-orange-500/20 text-orange-400' : 'bg-orange-100 text-orange-700',
      warranty: darkMode ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-100 text-blue-700',
      other: darkMode ? 'bg-purple-500/20 text-purple-400' : 'bg-purple-100 text-purple-700',
    };
    return colors[type] || colors.other;
  };

  const handleOpenPanel = (record?: ServiceRecord) => {
    if (record) {
      setEditingRecord(record);
      setIsViewMode(true); // Open in view mode first
      setFormData({
        vehicle_id: record.vehicle_id,
        service_date: record.service_date,
        service_type: record.service_type,
        service_type_other: record.service_type_other || '',
        description: record.description,
        cost: record.cost?.toString() || '',
        odometer_reading: record.odometer_reading?.toString() || '',
        technician_name: record.technician_name || '',
        workshop_name: record.workshop_name || '',
        next_service_date: record.next_service_date || '',
        next_service_odometer: record.next_service_odometer?.toString() || '',
        warranty_until: record.warranty_until || '',
        warranty_notes: record.warranty_notes || '',
        attachments: record.attachments || [],
      });
    } else {
      setEditingRecord(null);
      setIsViewMode(false); // New record opens in edit mode
      setFormData({
        vehicle_id: vehicles[0]?.id || '',
        service_date: new Date().toISOString().split('T')[0],
        service_type: 'small',
        service_type_other: '',
        description: '',
        cost: '',
        odometer_reading: '',
        technician_name: '',
        workshop_name: '',
        next_service_date: '',
        next_service_odometer: '',
        warranty_until: '',
        warranty_notes: '',
        attachments: [],
      });
    }
    setShowPanel(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const payload = {
        vehicle_id: formData.vehicle_id,
        service_date: formData.service_date,
        service_type: formData.service_type,
        service_type_other: formData.service_type === 'other' ? formData.service_type_other : undefined,
        description: formData.description,
        cost: formData.cost ? parseFloat(formData.cost) : undefined,
        odometer_reading: formData.odometer_reading ? parseInt(formData.odometer_reading) : undefined,
        technician_name: formData.technician_name || undefined,
        workshop_name: formData.workshop_name || undefined,
        next_service_date: formData.next_service_date || undefined,
        next_service_odometer: formData.next_service_odometer ? parseInt(formData.next_service_odometer) : undefined,
        warranty_until: formData.warranty_until || undefined,
        warranty_notes: formData.warranty_notes || undefined,
        attachments: formData.attachments.length > 0 ? formData.attachments : undefined,
      };

      if (editingRecord) {
        const updated = await serviceRecordAPI.update(editingRecord.id, payload);
        // Update local state without refetching
        setRecords(prev => prev.map(r => r.id === editingRecord.id ? updated.data : r));
      } else {
        const created = await serviceRecordAPI.create(payload);
        // Add to local state without refetching
        setRecords(prev => [created.data, ...prev]);
      }

      setShowPanel(false);
      // Refresh summary stats in background (no loading state)
      serviceRecordAPI.getSummary().then(res => setSummary(res.data)).catch(() => {});
    } catch (error) {
      console.error('Failed to save record:', error);
      alert('Failed to save record. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (record: ServiceRecord) => {
    if (!window.confirm(`Delete service record from ${record.service_date}?`)) return;

    try {
      await serviceRecordAPI.delete(record.id);
      fetchData();
    } catch (error) {
      console.error('Failed to delete record:', error);
      alert('Failed to delete record.');
    }
  };

  const handleExportCsv = async () => {
    try {
      const response = await serviceRecordAPI.exportCsv(filterVehicle || undefined);
      downloadCsv(response.data, `service_records_${new Date().toISOString().split('T')[0]}.csv`);
    } catch (error) {
      console.error('Failed to export CSV:', error);
      alert('Failed to export CSV.');
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <div className={`h-8 w-40 rounded ${darkMode ? 'bg-[#334155]' : 'bg-gray-200'} animate-pulse mb-2`}></div>
          <div className={`h-4 w-56 rounded ${darkMode ? 'bg-[#334155]' : 'bg-gray-200'} animate-pulse`}></div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => <SkeletonCard key={i} />)}
        </div>
        <SkeletonTable rows={5} columns={6} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className={`text-2xl font-bold ${textPrimary}`}>Service Records</h1>
          <p className={textSecondary}>Track maintenance and service history</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleExportCsv}
            className={`px-4 py-2 rounded-lg border ${darkMode ? 'border-[#334155] text-gray-300 hover:bg-[#334155]' : 'border-gray-200 text-gray-600 hover:bg-gray-100'} transition flex items-center gap-2`}
            data-testid="export-csv-btn"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Export CSV
          </button>
          <button
            onClick={() => handleOpenPanel()}
            className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg transition flex items-center gap-2"
            data-testid="add-record-btn"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Record
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className={`${cardBg} border rounded-xl p-5 shadow-sm`}>
          <div className={`${textSecondary} text-sm`}>Total Records</div>
          <div className={`text-2xl font-bold ${textPrimary}`}>{summary?.total_records || 0}</div>
        </div>
        <div className={`${cardBg} border rounded-xl p-5 shadow-sm`}>
          <div className={`${textSecondary} text-sm`}>Total Spend</div>
          <div className={`text-2xl font-bold ${textPrimary}`}>${(summary?.total_cost || 0).toLocaleString()}</div>
        </div>
        <div className={`${cardBg} border rounded-xl p-5 shadow-sm`}>
          <div className={`${textSecondary} text-sm`}>This Month</div>
          <div className={`text-2xl font-bold ${textPrimary}`}>{summary?.this_month_records || 0}</div>
        </div>
        <div className={`${cardBg} border rounded-xl p-5 shadow-sm`}>
          <div className={`${textSecondary} text-sm`}>Month Spend</div>
          <div className={`text-2xl font-bold ${textPrimary}`}>${(summary?.this_month_cost || 0).toLocaleString()}</div>
        </div>
      </div>

      {/* Filters */}
      <div className={`${cardBg} border rounded-xl p-4 shadow-sm`}>
        <div className="flex flex-wrap items-center gap-4">
          <div>
            <label className={`block ${textSecondary} text-sm mb-1`}>Search</label>
            <input
              type="text"
              placeholder="Search description, technician..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`${inputBg} border rounded-lg px-3 py-2.5 text-sm min-w-[200px] focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none transition`}
              data-testid="search-input"
            />
          </div>
          <div>
            <label className={`block ${textSecondary} text-sm mb-1`}>Equipment</label>
            <select
              value={filterVehicle}
              onChange={(e) => setFilterVehicle(e.target.value)}
              className={`${inputBg} border rounded-lg px-3 py-2.5 text-sm min-w-[180px] focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none transition`}
              data-testid="vehicle-filter"
            >
              <option value="">All Equipment</option>
              {vehicles.map((v) => (
                <option key={v.id} value={v.id}>{v.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={`block ${textSecondary} text-sm mb-1`}>Service Type</label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className={`${inputBg} border rounded-lg px-3 py-2.5 text-sm min-w-[140px] focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none transition`}
              data-testid="type-filter"
            >
              <option value="">All Types</option>
              <option value="small">Small</option>
              <option value="medium">Medium</option>
              <option value="large">Large</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div>
            <label className={`block ${textSecondary} text-sm mb-1`}>&nbsp;</label>
            <label className={`flex items-center gap-2 px-3 py-2.5 rounded-lg cursor-pointer ${filterType === 'warranty' ? 'bg-blue-100 text-blue-700' : `${inputBg}`} border transition`}>
              <input
                type="checkbox"
                checked={filterType === 'warranty'}
                onChange={(e) => setFilterType(e.target.checked ? 'warranty' : '')}
                className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                data-testid="warranty-toggle"
              />
              <span className="text-sm font-medium">Warranty Only</span>
            </label>
          </div>
        </div>
      </div>

      {/* Records Table */}
      <div className={`${cardBg} border rounded-xl overflow-hidden shadow-sm`}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className={tableBg}>
              <tr>
                <th className={`text-left ${textSecondary} font-medium px-6 py-4`}>Date</th>
                <th className={`text-left ${textSecondary} font-medium px-6 py-4`}>Equipment</th>
                <th className={`text-left ${textSecondary} font-medium px-6 py-4`}>Type</th>
                <th className={`text-left ${textSecondary} font-medium px-6 py-4`}>Description</th>
                <th className={`text-left ${textSecondary} font-medium px-6 py-4`}>Cost</th>
                <th className={`text-left ${textSecondary} font-medium px-6 py-4`}>Actions</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${dividerColor}`}>
              {filteredRecords.map((record) => (
                <tr key={record.id} className={hoverBg} data-testid={`record-row-${record.id}`}>
                  <td className={`px-6 py-4 ${textPrimary}`}>
                    {formatDateShortAU(record.service_date)}
                  </td>
                  <td className={`px-6 py-4 ${textPrimary}`}>{getVehicleName(record.vehicle_id)}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${getServiceTypeBadgeColor(record.service_type)}`}>
                      {getServiceTypeLabel(record)}
                    </span>
                  </td>
                  <td className={`px-6 py-4 ${textPrimary} max-w-xs truncate`}>{record.description}</td>
                  <td className={`px-6 py-4 font-medium ${darkMode ? 'text-green-400' : 'text-green-600'}`}>
                    {record.cost ? `$${record.cost.toLocaleString()}` : '-'}
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => handleOpenPanel(record)}
                      className={`font-medium text-sm ${darkMode ? 'text-cyan-400 hover:text-cyan-300' : 'text-cyan-600 hover:text-cyan-700'}`}
                      data-testid={`view-btn-${record.id}`}
                    >
                      View Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredRecords.length === 0 && (
          <div className="py-12 text-center">
            <svg className={`w-12 h-12 mx-auto ${textSecondary} mb-4`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <h3 className={`${textPrimary} font-medium mb-1`}>{filterVehicle || filterType || searchQuery ? 'No matching records' : 'No service records'}</h3>
            <p className={textSecondary}>{filterVehicle || filterType || searchQuery ? 'Try adjusting your filters.' : 'Add your first service record to track maintenance.'}</p>
            <button
              onClick={() => handleOpenPanel()}
              className="mt-4 px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg transition"
            >
              Add Service Record
            </button>
          </div>
        )}
      </div>

      {/* Slide Panel for View/Add/Edit */}
      <SlidePanel
        isOpen={showPanel}
        onClose={() => setShowPanel(false)}
        title={!editingRecord ? 'Add Service Record' : (isViewMode ? 'Service Record Details' : 'Edit Service Record')}
        subtitle={editingRecord ? `${getVehicleName(editingRecord.vehicle_id)} - ${new Date(editingRecord.service_date).toLocaleDateString('en-AU')}` : ''}
      >
        {/* VIEW MODE - Show details first */}
        {editingRecord && isViewMode ? (
          <div className="space-y-5">
            {/* Action Buttons Row */}
            <div className="flex items-center justify-between">
              <span className={`px-3 py-1.5 rounded-full text-sm font-medium ${getServiceTypeBadgeColor(editingRecord.service_type)}`}>
                {getServiceTypeLabel(editingRecord)}
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsViewMode(false)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                    darkMode ? 'bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30' : 'bg-cyan-100 text-cyan-700 hover:bg-cyan-200'
                  }`}
                  data-testid="edit-record-btn"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(editingRecord)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                    darkMode ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30' : 'bg-red-100 text-red-700 hover:bg-red-200'
                  }`}
                  data-testid="delete-record-btn"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Delete
                </button>
              </div>
            </div>

            {/* Description */}
            <div>
              <h3 className={`${textPrimary} font-medium mb-2 flex items-center gap-2`}>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Description
              </h3>
              <div className={`${darkMode ? 'bg-[#0F172A]' : 'bg-gray-50'} rounded-lg p-4`}>
                <p className={textPrimary}>{editingRecord.description}</p>
              </div>
            </div>

            {/* Cost & Odometer */}
            <div className="grid grid-cols-2 gap-4">
              <div className={`${darkMode ? 'bg-[#0F172A]' : 'bg-gray-50'} rounded-lg p-4`}>
                <div className={`${textSecondary} text-sm mb-1`}>Cost</div>
                <div className={`${textPrimary} font-semibold text-lg ${editingRecord.cost ? (darkMode ? 'text-green-400' : 'text-green-600') : ''}`}>
                  {editingRecord.cost ? `$${editingRecord.cost.toLocaleString()}` : 'Not recorded'}
                </div>
              </div>
              <div className={`${darkMode ? 'bg-[#0F172A]' : 'bg-gray-50'} rounded-lg p-4`}>
                <div className={`${textSecondary} text-sm mb-1`}>Odometer</div>
                <div className={`${textPrimary} font-semibold text-lg`}>
                  {editingRecord.odometer_reading ? `${editingRecord.odometer_reading.toLocaleString()} km` : 'Not recorded'}
                </div>
              </div>
            </div>

            {/* Technician & Workshop */}
            <div className="grid grid-cols-2 gap-4">
              <div className={`${darkMode ? 'bg-[#0F172A]' : 'bg-gray-50'} rounded-lg p-4`}>
                <div className={`${textSecondary} text-sm mb-1`}>Technician</div>
                <div className={`${textPrimary} font-medium`}>{editingRecord.technician_name || 'Not recorded'}</div>
              </div>
              <div className={`${darkMode ? 'bg-[#0F172A]' : 'bg-gray-50'} rounded-lg p-4`}>
                <div className={`${textSecondary} text-sm mb-1`}>Workshop</div>
                <div className={`${textPrimary} font-medium`}>{editingRecord.workshop_name || 'Not recorded'}</div>
              </div>
            </div>

            {/* Next Service Reminder */}
            {(editingRecord.next_service_date || editingRecord.next_service_odometer) && (
              <div className={`${darkMode ? 'bg-yellow-500/10 border-yellow-500/30' : 'bg-yellow-50 border-yellow-200'} border rounded-lg p-4`}>
                <h4 className={`font-medium mb-2 ${darkMode ? 'text-yellow-400' : 'text-yellow-700'}`}>Next Service Reminder</h4>
                <div className="flex flex-wrap gap-4">
                  {editingRecord.next_service_date && (
                    <div>
                      <span className={textSecondary}>Date: </span>
                      <span className={textPrimary}>{new Date(editingRecord.next_service_date).toLocaleDateString('en-AU')}</span>
                    </div>
                  )}
                  {editingRecord.next_service_odometer && (
                    <div>
                      <span className={textSecondary}>At: </span>
                      <span className={textPrimary}>{editingRecord.next_service_odometer.toLocaleString()} km</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Warranty Info */}
            {(editingRecord.warranty_until || editingRecord.warranty_notes) && (
              <div className={`${darkMode ? 'bg-purple-500/10 border-purple-500/30' : 'bg-purple-50 border-purple-200'} border rounded-lg p-4`}>
                <h4 className={`font-medium mb-2 ${darkMode ? 'text-purple-400' : 'text-purple-700'}`}>Warranty</h4>
                {editingRecord.warranty_until && (
                  <div className="mb-1">
                    <span className={textSecondary}>Valid Until: </span>
                    <span className={textPrimary}>{new Date(editingRecord.warranty_until).toLocaleDateString('en-AU')}</span>
                  </div>
                )}
                {editingRecord.warranty_notes && (
                  <div>
                    <span className={textSecondary}>Notes: </span>
                    <span className={textPrimary}>{editingRecord.warranty_notes}</span>
                  </div>
                )}
              </div>
            )}

            {/* Photos */}
            {editingRecord.attachments && editingRecord.attachments.length > 0 && (
              <div>
                <h3 className={`${textPrimary} font-medium mb-2 flex items-center gap-2`}>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  Photos ({editingRecord.attachments.length})
                </h3>
                <div className="grid grid-cols-3 gap-2">
                  {editingRecord.attachments.map((photo, index) => (
                    <img
                      key={index}
                      src={photo}
                      alt={`Attachment ${index + 1}`}
                      className="w-full h-24 object-cover rounded-lg cursor-pointer hover:opacity-80 transition"
                      onClick={() => window.open(photo, '_blank')}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Timestamp */}
            <div className={`${darkMode ? 'bg-[#0F172A]' : 'bg-gray-50'} rounded-lg p-4 flex items-center gap-2`}>
              <svg className={`w-4 h-4 ${textSecondary}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className={textSecondary}>
                Created: {new Date(editingRecord.created_at).toLocaleDateString('en-AU', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>

            {/* Download PDF Button */}
            <button
              onClick={async () => {
                setDownloadingPdf(true);
                try {
                  const response = await serviceRecordAPI.getPdf(editingRecord.id);
                  const pdfData = response.data.pdf_base64;
                  const byteCharacters = atob(pdfData);
                  const byteNumbers = new Array(byteCharacters.length);
                  for (let i = 0; i < byteCharacters.length; i++) {
                    byteNumbers[i] = byteCharacters.charCodeAt(i);
                  }
                  const byteArray = new Uint8Array(byteNumbers);
                  const blob = new Blob([byteArray], { type: 'application/pdf' });
                  const filename = response.data.filename || `service_record_${editingRecord.id}.pdf`;
                  downloadFile(blob, filename);
                } catch (error) {
                  console.error('Failed to download PDF:', error);
                  alert('Failed to download PDF. This feature may not be available yet.');
                } finally {
                  setDownloadingPdf(false);
                }
              }}
              disabled={downloadingPdf}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white rounded-lg font-medium transition"
              data-testid="download-pdf-btn"
            >
              {downloadingPdf ? (
                <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              )}
              {downloadingPdf ? 'Downloading...' : 'Download Service Record (PDF)'}
            </button>
          </div>
        ) : (
          /* EDIT/ADD MODE - Show form */
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Back to View button when editing existing record */}
            {editingRecord && (
              <button
                type="button"
                onClick={() => setIsViewMode(true)}
                className={`flex items-center gap-2 text-sm ${darkMode ? 'text-cyan-400 hover:text-cyan-300' : 'text-cyan-600 hover:text-cyan-700'}`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back to Details
              </button>
            )}

            {/* Equipment */}
            <div>
              <label className={`block text-sm font-medium ${textPrimary} mb-1.5`}>Equipment *</label>
              <select
                value={formData.vehicle_id}
                onChange={(e) => setFormData({ ...formData, vehicle_id: e.target.value })}
                className={`w-full ${inputBg} border rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none`}
                required
                data-testid="form-vehicle-select"
              >
                <option value="">Select Equipment</option>
                {vehicles.map((v) => (
                  <option key={v.id} value={v.id}>{v.name} ({v.registration_number})</option>
                ))}
              </select>
            </div>

            {/* Service Date */}
            <div>
              <label className={`block text-sm font-medium ${textPrimary} mb-1.5`}>Service Date *</label>
              <input
                type="date"
                value={formData.service_date}
                onChange={(e) => setFormData({ ...formData, service_date: e.target.value })}
                className={`w-full ${inputBg} border rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none`}
                required
                data-testid="form-date-input"
              />
            </div>

            {/* Service Type */}
            <div>
              <label className={`block text-sm font-medium ${textPrimary} mb-1.5`}>Service Type *</label>
              <div className="grid grid-cols-2 gap-2">
                {(['small', 'medium', 'large', 'warranty', 'other'] as const).map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setFormData({ ...formData, service_type: type })}
                    className={`px-4 py-2.5 rounded-lg border text-sm font-medium transition ${
                      formData.service_type === type
                        ? 'bg-cyan-600 border-cyan-600 text-white'
                        : `${darkMode ? 'border-[#334155] text-gray-300 hover:bg-[#334155]' : 'border-gray-200 text-gray-600 hover:bg-gray-100'}`
                    }`}
                    data-testid={`type-btn-${type}`}
                  >
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Other Type Description */}
            {formData.service_type === 'other' && (
              <div>
                <label className={`block text-sm font-medium ${textPrimary} mb-1.5`}>Specify Type *</label>
                <input
                  type="text"
                  value={formData.service_type_other}
                  onChange={(e) => setFormData({ ...formData, service_type_other: e.target.value })}
                  placeholder="e.g., Tire replacement, Battery check"
                  className={`w-full ${inputBg} border rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none`}
                  required={formData.service_type === 'other'}
                  data-testid="form-other-type-input"
                />
              </div>
            )}

            {/* Description */}
            <div>
              <label className={`block text-sm font-medium ${textPrimary} mb-1.5`}>Description *</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="What work was performed?"
                rows={3}
                className={`w-full ${inputBg} border rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none resize-none`}
                required
                data-testid="form-description-input"
              />
            </div>

            {/* Cost and Odometer */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={`block text-sm font-medium ${textPrimary} mb-1.5`}>Cost ($)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.cost}
                  onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
                  placeholder="0.00"
                  className={`w-full ${inputBg} border rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none`}
                  data-testid="form-cost-input"
                />
              </div>
              <div>
                <label className={`block text-sm font-medium ${textPrimary} mb-1.5`}>Odometer (km)</label>
                <input
                  type="number"
                  min="0"
                  value={formData.odometer_reading}
                  onChange={(e) => setFormData({ ...formData, odometer_reading: e.target.value })}
                  placeholder="Current reading"
                  className={`w-full ${inputBg} border rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none`}
                  data-testid="form-odometer-input"
                />
              </div>
            </div>

            {/* Technician and Workshop */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={`block text-sm font-medium ${textPrimary} mb-1.5`}>Technician</label>
                <input
                  type="text"
                  value={formData.technician_name}
                  onChange={(e) => setFormData({ ...formData, technician_name: e.target.value })}
                  placeholder="Name"
                  className={`w-full ${inputBg} border rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none`}
                  data-testid="form-technician-input"
                />
              </div>
              <div>
                <label className={`block text-sm font-medium ${textPrimary} mb-1.5`}>Workshop</label>
                <input
                  type="text"
                  value={formData.workshop_name}
                  onChange={(e) => setFormData({ ...formData, workshop_name: e.target.value })}
                  placeholder="Shop name"
                  className={`w-full ${inputBg} border rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none`}
                  data-testid="form-workshop-input"
                />
              </div>
            </div>

            {/* Next Service */}
            <div className={`p-4 rounded-lg ${darkMode ? 'bg-[#0F172A]' : 'bg-gray-50'}`}>
              <h4 className={`text-sm font-medium ${textPrimary} mb-3`}>Next Service Reminder (Optional)</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={`block text-xs ${textSecondary} mb-1`}>Date</label>
                  <input
                    type="date"
                    value={formData.next_service_date}
                    onChange={(e) => setFormData({ ...formData, next_service_date: e.target.value })}
                    className={`w-full ${inputBg} border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none`}
                    data-testid="form-next-date-input"
                  />
                </div>
                <div>
                  <label className={`block text-xs ${textSecondary} mb-1`}>Or at Odometer (km)</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.next_service_odometer}
                    onChange={(e) => setFormData({ ...formData, next_service_odometer: e.target.value })}
                    placeholder="e.g., 50000"
                    className={`w-full ${inputBg} border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none`}
                    data-testid="form-next-odometer-input"
                  />
                </div>
              </div>
            </div>

            {/* Warranty */}
            <div className={`p-4 rounded-lg ${darkMode ? 'bg-[#0F172A]' : 'bg-gray-50'}`}>
              <h4 className={`text-sm font-medium ${textPrimary} mb-3`}>Warranty (Optional)</h4>
              <div className="space-y-3">
                <div>
                  <label className={`block text-xs ${textSecondary} mb-1`}>Warranty Until</label>
                  <input
                    type="date"
                    value={formData.warranty_until}
                    onChange={(e) => setFormData({ ...formData, warranty_until: e.target.value })}
                    className={`w-full ${inputBg} border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none`}
                    data-testid="form-warranty-date-input"
                  />
                </div>
                <div>
                  <label className={`block text-xs ${textSecondary} mb-1`}>Warranty Notes</label>
                  <input
                    type="text"
                    value={formData.warranty_notes}
                    onChange={(e) => setFormData({ ...formData, warranty_notes: e.target.value })}
                    placeholder="e.g., 50,000km, parts only"
                    className={`w-full ${inputBg} border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none`}
                    data-testid="form-warranty-notes-input"
                  />
                </div>
              </div>
            </div>

            {/* Photos/Attachments - Compact Version */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className={`text-sm font-medium ${textPrimary}`}>Photos (Optional)</h4>
                <label className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg cursor-pointer transition text-sm ${
                  darkMode 
                    ? 'bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30' 
                    : 'bg-cyan-100 text-cyan-700 hover:bg-cyan-200'
                }`}>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Add
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handlePhotoUpload}
                    className="hidden"
                    data-testid="photo-upload-input"
                  />
                </label>
              </div>
              
              {/* Compact Photo Grid */}
              {formData.attachments.length > 0 ? (
                <div className="grid grid-cols-4 gap-2">
                  {formData.attachments.map((photo, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={photo}
                        alt={`Attachment ${index + 1}`}
                        className="w-full h-16 object-cover rounded-lg border border-[#334155]"
                      />
                      <button
                        type="button"
                        onClick={() => removePhoto(index)}
                        className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 text-white rounded-full flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className={`text-xs ${textSecondary}`}>Add receipts, invoices, or photos of work done</p>
              )}
              <p className={`text-xs ${textSecondary} mt-1`}>{formData.attachments.length}/10 photos</p>
            </div>

            {/* Submit Button */}
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowPanel(false)}
                className={`flex-1 px-4 py-2.5 border rounded-lg font-medium transition ${
                  darkMode ? 'border-[#334155] text-gray-300 hover:bg-[#334155]' : 'border-gray-200 text-gray-600 hover:bg-gray-100'
                }`}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex-1 px-4 py-2.5 bg-cyan-600 hover:bg-cyan-700 disabled:bg-cyan-800 text-white rounded-lg font-medium transition flex items-center justify-center gap-2"
                data-testid="form-submit-btn"
              >
                {saving && (
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                  </svg>
                )}
                {editingRecord ? 'Update Record' : 'Add Record'}
              </button>
            </div>
          </form>
        )}
      </SlidePanel>
    </div>
  );
};

export default ServiceRecordsPage;
