import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { inspectionAPI, vehicleAPI, driverAPI } from '../utils/api';
import { useTheme } from '../contexts/ThemeContext';
import InspectionDetails from '../components/InspectionDetails';
import EmptyState from '../components/EmptyState';
import { showToast } from '../components/Toast';
import { SkeletonTable } from '../components/Skeleton';
import { downloadFile } from '../utils/mobileDownload';
import { formatDateTimeAU } from '../utils/dateUtils';

interface Inspection {
  id: string;
  vehicle_id: string;
  driver_id: string;
  type?: string;  // Database field: 'prestart' or 'end_shift'
  inspection_type?: string;  // Legacy field
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
  name?: string;  // Database field
  full_name?: string;  // Legacy field
}

const ReportsPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const { darkMode } = useTheme();
  const [inspections, setInspections] = useState<Inspection[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState<string | null>(null);
  const [loadingDetails, setLoadingDetails] = useState<string | null>(null);
  const [selectedInspection, setSelectedInspection] = useState<any>(null);
  const [showDetailsPanel, setShowDetailsPanel] = useState(false);
  const [referenceDataLoaded, setReferenceDataLoaded] = useState(false);
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 25;

  // Filters
  const [filterType, setFilterType] = useState<string>('');
  const [filterVehicle, setFilterVehicle] = useState<string>('');
  const [filterDriver, setFilterDriver] = useState<string>('');
  const [filterDateRange, setFilterDateRange] = useState<'today' | '7days' | '30days' | 'all'>('7days');
  const [filterIssues, setFilterIssues] = useState<boolean>(searchParams.get('filter') === 'issues');

  // Theme styles - Professional Dark Mode
  const cardBg = darkMode ? 'bg-[#1E293B] border-[#334155]' : 'bg-white border-gray-100';
  const textPrimary = darkMode ? 'text-gray-100' : 'text-gray-900';
  const textSecondary = darkMode ? 'text-gray-300' : 'text-gray-500';
  const inputBg = darkMode ? 'bg-[#0F172A] border-[#334155] text-gray-100' : 'bg-gray-50 border-gray-200 text-gray-900';
  const tableBg = darkMode ? 'bg-[#0F172A]' : 'bg-gray-50';
  const dividerColor = darkMode ? 'divide-[#334155]' : 'divide-gray-100';

  // Load reference data (vehicles/drivers) only once
  useEffect(() => {
    const loadReferenceData = async () => {
      try {
        const [vehiclesRes, driversRes] = await Promise.all([
          vehicleAPI.getAll(),
          driverAPI.getAll(),
        ]);
        setVehicles(vehiclesRes.data || []);
        setDrivers(driversRes.data || []);
        setReferenceDataLoaded(true);
      } catch (error) {
        console.error('Failed to load reference data:', error);
        setReferenceDataLoaded(true);
      }
    };
    loadReferenceData();
  }, []);

  // Load inspections separately (can be filtered server-side later)
  const fetchInspections = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = { limit: 200 };
      if (filterType) params.inspection_type = filterType;
      if (filterVehicle) params.vehicle_id = filterVehicle;
      if (filterDriver) params.driver_id = filterDriver;
      if (filterIssues) params.has_issues = true;
      
      const inspRes = await inspectionAPI.getAll(params);
      setInspections(inspRes.data || []);
    } catch (error) {
      console.error('Failed to fetch inspections:', error);
      showToast.error('Failed to load inspections');
    } finally {
      setLoading(false);
    }
  }, [filterType, filterVehicle, filterDriver, filterIssues]);

  // Fetch inspections when filters change
  useEffect(() => {
    if (referenceDataLoaded) {
      fetchInspections();
    }
  }, [referenceDataLoaded, fetchInspections]);

  const openInspectionDetails = async (inspection: Inspection) => {
    setLoadingDetails(inspection.id);
    try {
      // Fetch full inspection details including photos
      const response = await inspectionAPI.getOne(inspection.id);
      const fullInspection = response.data;
      
      setSelectedInspection({
        ...fullInspection,
        has_issues: !fullInspection.is_safe,
        created_at: fullInspection.timestamp,
      });
      setShowDetailsPanel(true);
    } catch (error) {
      console.error('Failed to fetch inspection details:', error);
      // Fallback to local data without photos
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
    } finally {
      setLoadingDetails(null);
    }
  };

  // Memoized filtering - only recalculates when dependencies change
  const filteredInspections = useMemo(() => {
    return inspections.filter((insp) => {
      const inspType = insp.type || insp.inspection_type;
      if (filterType && inspType !== filterType) return false;
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
  }, [inspections, filterType, filterVehicle, filterIssues, filterDateRange]);

  // Pagination calculations
  const totalPages = Math.ceil(filteredInspections.length / pageSize);
  const paginatedInspections = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredInspections.slice(startIndex, startIndex + pageSize);
  }, [filteredInspections, currentPage, pageSize]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filterType, filterVehicle, filterIssues, filterDateRange]);

  // Memoized vehicle/driver name lookup maps for O(1) access
  const vehicleMap = useMemo(() => {
    const map = new Map<string, Vehicle>();
    vehicles.forEach(v => map.set(v.id, v));
    return map;
  }, [vehicles]);

  const driverMap = useMemo(() => {
    const map = new Map<string, Driver>();
    drivers.forEach(d => map.set(d.id, d));
    return map;
  }, [drivers]);

  const getVehicleName = useCallback((id: string) => {
    const vehicle = vehicleMap.get(id);
    return vehicle ? `${vehicle.name} (${vehicle.registration_number})` : 'Unknown';
  }, [vehicleMap]);

  const getDriverName = useCallback((id: string) => {
    const driver = driverMap.get(id);
    return driver?.name || driver?.full_name || 'Unknown';
  }, [driverMap]);

  // Check if viewing issues filter with no issues today
  const isIssuesFilter = filterIssues || searchParams.get('filter') === 'issues';
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);
  
  const todayIssues = inspections.filter(insp => {
    const inspDate = new Date(insp.timestamp);
    return !insp.is_safe && inspDate >= todayStart && inspDate < todayEnd;
  });
  
  const pastIssues = inspections.filter(insp => {
    const inspDate = new Date(insp.timestamp);
    return !insp.is_safe && inspDate < todayStart;
  });
  
  const showNoIssuesTodayBanner = isIssuesFilter && todayIssues.length === 0;

  const handleDownloadPdf = async (id: string) => {
    setDownloading(id);
    try {
      const response = await inspectionAPI.getPdf(id);
      const pdfData = response.data.pdf_base64;
      
      // Create blob and download (mobile-friendly)
      const byteCharacters = atob(pdfData);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: 'application/pdf' });
      
      downloadFile(blob, `inspection_${id}.pdf`);
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
        <span>Showing {paginatedInspections.length} of {filteredInspections.length} reports</span>
        {totalPages > 1 && (
          <span>Page {currentPage} of {totalPages}</span>
        )}
      </div>

      {/* No Issues Today Banner */}
      {showNoIssuesTodayBanner && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
            <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div>
            <p className="font-semibold text-green-800">No issues reported today</p>
            <p className="text-sm text-green-600">Great job! All inspections today passed without issues.</p>
          </div>
        </div>
      )}

      {/* Past Issues Section Header */}
      {showNoIssuesTodayBanner && pastIssues.length > 0 && (
        <div className={`${textSecondary} text-sm font-medium mt-2`}>
          Past Issues ({pastIssues.length})
        </div>
      )}

      {/* Reports Table */}
      <div className={`${cardBg} border rounded-xl overflow-hidden shadow-sm`}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px]">
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
            {paginatedInspections.map((insp) => (
              <tr key={insp.id} className={darkMode ? 'hover:bg-[#334155]/50' : 'hover:bg-gray-50'}>
                <td className={`px-6 py-4 ${textPrimary}`}>
                  {formatDateTimeAU(insp.timestamp)}
                </td>
                <td className={`px-6 py-4 ${textPrimary}`}>{getVehicleName(insp.vehicle_id)}</td>
                <td className={`px-6 py-4 ${textPrimary}`}>{getDriverName(insp.driver_id)}</td>
                <td className={`px-6 py-4`}>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    (insp.type || insp.inspection_type) === 'prestart' 
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-purple-100 text-purple-700'
                  }`}>
                    {(insp.type || insp.inspection_type) === 'prestart' ? 'Pre-Start' : 'End Shift'}
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
                      disabled={loadingDetails === insp.id}
                      className={`font-medium text-sm disabled:opacity-50 ${darkMode ? 'text-cyan-400 hover:text-cyan-300' : 'text-cyan-600 hover:text-cyan-700'}`}
                      data-testid={`view-inspection-${insp.id}`}
                    >
                      {loadingDetails === insp.id ? 'Loading...' : 'View Details'}
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
        </div>

        {filteredInspections.length === 0 && (
          <EmptyState type="inspections" />
        )}
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className={`flex justify-center items-center gap-2 ${textSecondary}`}>
          <button
            onClick={() => setCurrentPage(1)}
            disabled={currentPage === 1}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition disabled:opacity-40 disabled:cursor-not-allowed ${
              darkMode 
                ? 'bg-[#1E293B] hover:bg-[#334155] border border-[#334155]' 
                : 'bg-white hover:bg-gray-100 border border-gray-200'
            }`}
          >
            First
          </button>
          <button
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition disabled:opacity-40 disabled:cursor-not-allowed ${
              darkMode 
                ? 'bg-[#1E293B] hover:bg-[#334155] border border-[#334155]' 
                : 'bg-white hover:bg-gray-100 border border-gray-200'
            }`}
          >
            Previous
          </button>
          
          <div className="flex items-center gap-1 px-2">
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum: number;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (currentPage <= 3) {
                pageNum = i + 1;
              } else if (currentPage >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = currentPage - 2 + i;
              }
              return (
                <button
                  key={pageNum}
                  onClick={() => setCurrentPage(pageNum)}
                  className={`w-10 h-10 rounded-lg text-sm font-medium transition ${
                    currentPage === pageNum
                      ? 'bg-cyan-500 text-white'
                      : darkMode
                        ? 'bg-[#1E293B] hover:bg-[#334155] text-gray-300'
                        : 'bg-white hover:bg-gray-100 text-gray-700'
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}
          </div>
          
          <button
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition disabled:opacity-40 disabled:cursor-not-allowed ${
              darkMode 
                ? 'bg-[#1E293B] hover:bg-[#334155] border border-[#334155]' 
                : 'bg-white hover:bg-gray-100 border border-gray-200'
            }`}
          >
            Next
          </button>
          <button
            onClick={() => setCurrentPage(totalPages)}
            disabled={currentPage === totalPages}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition disabled:opacity-40 disabled:cursor-not-allowed ${
              darkMode 
                ? 'bg-[#1E293B] hover:bg-[#334155] border border-[#334155]' 
                : 'bg-white hover:bg-gray-100 border border-gray-200'
            }`}
          >
            Last
          </button>
        </div>
      )}

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
