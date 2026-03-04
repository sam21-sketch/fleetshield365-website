import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { inspectionAPI, vehicleAPI, driverAPI } from '../utils/api';
import { useTheme } from '../contexts/ThemeContext';
import InspectionDetails from '../components/InspectionDetails';
import EmptyState from '../components/EmptyState';
import { showToast } from '../components/Toast';
import { SkeletonTable } from '../components/Skeleton';

interface Inspection {
  id: string;
  vehicle_id: string;
  driver_id: string;
  inspection_type: string;
  timestamp: string;
  is_safe: boolean;
  checklist_items?: any[];
  has_issues?: boolean;
  notes?: string;
  odometer?: number;
  photos?: string[];
}

interface Vehicle {
  id: string;
  name: string;
  registration_number: string;
}

interface Driver {
  id: string;
  full_name: string;
}

const ReportsPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const { darkMode } = useTheme();
  const [inspections, setInspections] = useState<Inspection[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState<string | null>(null);
  const [selectedInspection, setSelectedInspection] = useState<any>(null);
  const [showDetailsPanel, setShowDetailsPanel] = useState(false);

  // Filters
  const [filterType, setFilterType] = useState<string>('');
  const [filterVehicle, setFilterVehicle] = useState<string>('');
  const [filterDateRange, setFilterDateRange] = useState<'today' | '7days' | '30days' | 'all'>('7days');
  const [filterIssues, setFilterIssues] = useState<boolean>(searchParams.get('filter') === 'issues');

  // Theme styles - Professional Dark Mode
  const cardBg = darkMode ? 'bg-[#1E293B] border-[#334155]' : 'bg-white border-gray-100';
  const textPrimary = darkMode ? 'text-gray-100' : 'text-gray-900';
  const textSecondary = darkMode ? 'text-gray-300' : 'text-gray-500';
  const inputBg = darkMode ? 'bg-[#0F172A] border-[#334155] text-gray-100' : 'bg-gray-50 border-gray-200 text-gray-900';
  const tableBg = darkMode ? 'bg-[#0F172A]' : 'bg-gray-50';
  const dividerColor = darkMode ? 'divide-[#334155]' : 'divide-gray-100';

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [inspRes, vehiclesRes, driversRes] = await Promise.all([
        inspectionAPI.getAll({ limit: 50 }),
        vehicleAPI.getAll(),
        driverAPI.getAll(),
      ]);
      setInspections(inspRes.data || []);
      setVehicles(vehiclesRes.data || []);
      setDrivers(driversRes.data || []);
    } catch (error) {
      console.error('Failed to fetch data:', error);
      showToast.error('Failed to load inspections');
    } finally {
      setLoading(false);
    }
  };

  const openInspectionDetails = (inspection: Inspection) => {
    const vehicle = vehicles.find(v => v.id === inspection.vehicle_id);
    const driver = drivers.find(d => d.id === inspection.driver_id);
    setSelectedInspection({
      ...inspection,
      vehicle_name: vehicle?.name || 'Unknown Vehicle',
      vehicle_rego: vehicle?.registration_number,
      driver_name: driver?.full_name || 'Unknown Driver',
      has_issues: !inspection.is_safe,
      created_at: inspection.timestamp,
    });
    setShowDetailsPanel(true);
  };

  const filteredInspections = inspections.filter((insp) => {
    if (filterType && insp.inspection_type !== filterType) return false;
    if (filterVehicle && insp.vehicle_id !== filterVehicle) return false;
    if (filterIssues && insp.is_safe) return false;
    
    // Date range filter
    const inspDate = new Date(insp.timestamp);
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    if (filterDateRange === 'today') {
      const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);
      if (inspDate < todayStart || inspDate >= todayEnd) return false;
    } else if (filterDateRange === '7days') {
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      if (inspDate < sevenDaysAgo) return false;
    } else if (filterDateRange === '30days') {
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      if (inspDate < thirtyDaysAgo) return false;
    }
    
    return true;
  });

  const getVehicleName = (id: string) => {
    const vehicle = vehicles.find(v => v.id === id);
    return vehicle ? `${vehicle.name} (${vehicle.registration_number})` : 'Unknown';
  };

  const getDriverName = (id: string) => {
    const driver = drivers.find(d => d.id === id);
    return driver?.full_name || 'Unknown';
  };

  const handleDownloadPdf = async (id: string) => {
    setDownloading(id);
    try {
      const response = await inspectionAPI.getPdf(id);
      const pdfData = response.data.pdf_base64;
      
      // Create blob and download
      const byteCharacters = atob(pdfData);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: 'application/pdf' });
      
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `inspection_${id}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to download PDF:', error);
      alert('Failed to download PDF');
    } finally {
      setDownloading(null);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <div className={`h-8 w-48 rounded ${darkMode ? 'bg-[#334155]' : 'bg-gray-200'} animate-pulse mb-2`}></div>
          <div className={`h-4 w-64 rounded ${darkMode ? 'bg-[#334155]' : 'bg-gray-200'} animate-pulse`}></div>
        </div>
        <div className={`${cardBg} border rounded-xl p-4`}>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1,2,3,4].map(i => (
              <div key={i} className={`h-16 rounded ${darkMode ? 'bg-[#334155]' : 'bg-gray-200'} animate-pulse`}></div>
            ))}
          </div>
        </div>
        <SkeletonTable rows={6} columns={6} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className={`text-2xl font-bold ${textPrimary}`}>Inspection Reports</h1>
        <p className={textSecondary}>View and download inspection reports</p>
      </div>

      {/* Filters */}
      <div className={`${cardBg} border rounded-xl p-4`}>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <label className={`block ${textSecondary} text-sm mb-1`}>Date Range</label>
            <select
              value={filterDateRange}
              onChange={(e) => setFilterDateRange(e.target.value as any)}
              className={`w-full ${inputBg} border rounded-lg px-3 py-2 text-sm`}
            >
              <option value="today">Today</option>
              <option value="7days">Last 7 Days</option>
              <option value="30days">Last 30 Days</option>
              <option value="all">All Time</option>
            </select>
          </div>
          <div>
            <label className={`block ${textSecondary} text-sm mb-1`}>Type</label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className={`w-full ${inputBg} border rounded-lg px-3 py-2 text-sm`}
            >
              <option value="">All Types</option>
              <option value="prestart">Pre-Start</option>
              <option value="end_shift">End Shift</option>
            </select>
          </div>
          <div>
            <label className={`block ${textSecondary} text-sm mb-1`}>Vehicle</label>
            <select
              value={filterVehicle}
              onChange={(e) => setFilterVehicle(e.target.value)}
              className={`w-full ${inputBg} border rounded-lg px-3 py-2 text-sm`}
            >
              <option value="">All Vehicles</option>
              {vehicles.map(v => (
                <option key={v.id} value={v.id}>{v.name}</option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <label className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={filterIssues}
                onChange={(e) => setFilterIssues(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-cyan-500 focus:ring-cyan-500"
              />
              <span className={`ml-2 text-sm ${textPrimary}`}>Issues Only</span>
            </label>
          </div>
        </div>
      </div>

      {/* Results Count */}
      <div className={`flex justify-between items-center ${textSecondary} text-sm`}>
        <span>Showing {filteredInspections.length} reports</span>
      </div>

      {/* Reports Table */}
      <div className={`${cardBg} border rounded-xl overflow-hidden shadow-sm`}>
        <table className="w-full">
          <thead className={tableBg}>
            <tr>
              <th className={`text-left ${textSecondary} font-medium px-6 py-4`}>Date</th>
              <th className={`text-left ${textSecondary} font-medium px-6 py-4`}>Vehicle</th>
              <th className={`text-left ${textSecondary} font-medium px-6 py-4`}>Driver</th>
              <th className={`text-left ${textSecondary} font-medium px-6 py-4`}>Type</th>
              <th className={`text-left ${textSecondary} font-medium px-6 py-4`}>Status</th>
              <th className={`text-left ${textSecondary} font-medium px-6 py-4`}>Actions</th>
            </tr>
          </thead>
          <tbody className={dividerColor}>
            {filteredInspections.map((insp) => (
              <tr key={insp.id} className={darkMode ? 'hover:bg-[#334155]/50' : 'hover:bg-gray-50'}>
                <td className={`px-6 py-4 ${textPrimary}`}>
                  {new Date(insp.timestamp).toLocaleDateString('en-AU', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </td>
                <td className={`px-6 py-4 ${textPrimary}`}>{getVehicleName(insp.vehicle_id)}</td>
                <td className={`px-6 py-4 ${textPrimary}`}>{getDriverName(insp.driver_id)}</td>
                <td className={`px-6 py-4`}>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    insp.inspection_type === 'prestart' 
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-purple-100 text-purple-700'
                  }`}>
                    {insp.inspection_type === 'prestart' ? 'Pre-Start' : 'End Shift'}
                  </span>
                </td>
                <td className={`px-6 py-4`}>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    insp.is_safe 
                      ? 'bg-green-100 text-green-700'
                      : 'bg-red-100 text-red-700'
                  }`}>
                    {insp.is_safe ? 'Safe' : 'Issues'}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => openInspectionDetails(insp)}
                      className={`font-medium text-sm ${darkMode ? 'text-cyan-400 hover:text-cyan-300' : 'text-cyan-600 hover:text-cyan-700'}`}
                      data-testid={`view-inspection-${insp.id}`}
                    >
                      View Details
                    </button>
                    <button
                      onClick={() => handleDownloadPdf(insp.id)}
                      disabled={downloading === insp.id}
                      className={`font-medium text-sm disabled:opacity-50 ${darkMode ? 'text-gray-400 hover:text-cyan-400' : 'text-gray-500 hover:text-cyan-600'}`}
                    >
                      {downloading === insp.id ? 'Downloading...' : 'PDF'}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredInspections.length === 0 && (
          <EmptyState type="inspections" />
        )}
      </div>

      {/* Inspection Details Panel */}
      <InspectionDetails
        isOpen={showDetailsPanel}
        onClose={() => setShowDetailsPanel(false)}
        inspection={selectedInspection}
      />
    </div>
  );
};

export default ReportsPage;
