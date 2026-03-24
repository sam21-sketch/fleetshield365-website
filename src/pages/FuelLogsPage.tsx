import React, { useEffect, useState } from 'react';
import { fuelAPI, vehicleAPI, api } from '../utils/api';
import { useTheme } from '../contexts/ThemeContext';
import SlidePanel from '../components/SlidePanel';
import EmptyState from '../components/EmptyState';
import { SkeletonTable, SkeletonCard } from '../components/Skeleton';
import { Download, X, Eye, Fuel, MapPin, Clock, User, Car, FileText, Receipt } from 'lucide-react';
import { formatDateTimeAU } from '../utils/dateUtils';

interface FuelLog {
  id: string;
  vehicle_id: string;
  driver_id: string;
  driver_name?: string;
  amount: number;
  liters: number;
  timestamp: string;
  fuel_station?: string;
  odometer?: number;
  notes?: string;
  receipt_photo_base64?: string;
  gps_latitude?: number;
  gps_longitude?: number;
}

interface Vehicle {
  id: string;
  name: string;
  registration_number: string;
}

const FuelLogsPage: React.FC = () => {
  const { darkMode } = useTheme();
  const [fuelLogs, setFuelLogs] = useState<FuelLog[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterVehicle, setFilterVehicle] = useState<string>('');
  
  // View details state
  const [selectedLog, setSelectedLog] = useState<FuelLog | null>(null);
  const [showDetailsPanel, setShowDetailsPanel] = useState(false);
  
  // Export modal state
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportDateFrom, setExportDateFrom] = useState('');
  const [exportDateTo, setExportDateTo] = useState('');

  // Theme styles
  const cardBg = darkMode ? 'bg-[#1E293B] border-[#334155]' : 'bg-white border-gray-100';
  const textPrimary = darkMode ? 'text-gray-100' : 'text-gray-900';
  const textSecondary = darkMode ? 'text-gray-300' : 'text-gray-500';
  const inputBg = darkMode ? 'bg-[#0F172A] border-[#334155] text-gray-100' : 'bg-gray-50 border-gray-200 text-gray-900';
  const tableBg = darkMode ? 'bg-[#0F172A]' : 'bg-gray-50';
  const dividerColor = darkMode ? 'divide-[#334155]' : 'divide-gray-100';
  const hoverBg = darkMode ? 'hover:bg-[#334155]/50' : 'hover:bg-gray-50';
  const sectionBg = darkMode ? 'bg-[#0F172A]' : 'bg-gray-50';

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [fuelRes, vehiclesRes] = await Promise.all([
        fuelAPI.getAll({ limit: 50 }),
        vehicleAPI.getAll(),
      ]);
      setFuelLogs(fuelRes.data || []);
      setVehicles(vehiclesRes.data || []);
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

  const getVehicleInfo = (id: string) => {
    return vehicles.find((v) => v.id === id);
  };

  const filteredLogs = filterVehicle
    ? fuelLogs.filter((log) => log.vehicle_id === filterVehicle)
    : fuelLogs;

  const totalSpend = filteredLogs.reduce((sum, log) => sum + log.amount, 0);
  const totalLiters = filteredLogs.reduce((sum, log) => sum + log.liters, 0);

  const openDetails = (log: FuelLog) => {
    setSelectedLog(log);
    setShowDetailsPanel(true);
  };

  const handleExport = async () => {
    try {
      const params: any = {};
      if (filterVehicle) params.vehicle_id = filterVehicle;
      if (exportDateFrom) params.date_from = exportDateFrom;
      if (exportDateTo) params.date_to = exportDateTo;
      
      const response = await fuelAPI.exportCsv(filterVehicle || undefined);
      const blob = new Blob([response.data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `fuel_logs_${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
      setShowExportModal(false);
    } catch (error) {
      console.error('Failed to export:', error);
    }
  };

  const formatDate = (dateString: string) => {
    return formatDateTimeAU(dateString);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD' }).format(amount);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <div className={`h-8 w-32 rounded ${darkMode ? 'bg-[#334155]' : 'bg-gray-200'} animate-pulse mb-2`}></div>
          <div className={`h-4 w-48 rounded ${darkMode ? 'bg-[#334155]' : 'bg-gray-200'} animate-pulse`}></div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => <SkeletonCard key={i} />)}
        </div>
        <SkeletonTable rows={5} columns={6} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className={`text-2xl font-bold ${textPrimary}`}>Fuel Logs</h1>
        <p className={textSecondary}>Track fuel consumption and costs</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className={`${cardBg} border rounded-xl p-5 shadow-sm`}>
          <div className={`${textSecondary} text-sm`}>Total Spend</div>
          <div className={`text-2xl font-bold ${textPrimary}`}>${totalSpend.toLocaleString()}</div>
        </div>
        <div className={`${cardBg} border rounded-xl p-5 shadow-sm`}>
          <div className={`${textSecondary} text-sm`}>Total Liters</div>
          <div className={`text-2xl font-bold ${textPrimary}`}>{totalLiters.toLocaleString()}L</div>
        </div>
        <div className={`${cardBg} border rounded-xl p-5 shadow-sm`}>
          <div className={`${textSecondary} text-sm`}>Fill-ups</div>
          <div className={`text-2xl font-bold ${textPrimary}`}>{filteredLogs.length}</div>
        </div>
        <div className={`${cardBg} border rounded-xl p-5 shadow-sm`}>
          <div className={`${textSecondary} text-sm`}>Avg per Fill</div>
          <div className={`text-2xl font-bold ${textPrimary}`}>
            ${filteredLogs.length ? Math.round(totalSpend / filteredLogs.length) : 0}
          </div>
        </div>
      </div>

      {/* Filter */}
      <div className={`${cardBg} border rounded-xl p-4 shadow-sm`}>
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <label className={`block ${textSecondary} text-sm mb-1`}>Filter by Vehicle</label>
            <select
              value={filterVehicle}
              onChange={(e) => setFilterVehicle(e.target.value)}
              className={`${inputBg} border rounded-lg px-3 py-2.5 text-sm min-w-[200px] focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none transition`}
              data-testid="vehicle-filter"
            >
              <option value="">All Vehicles</option>
              {vehicles.map(v => (
                <option key={v.id} value={v.id}>{v.name}</option>
              ))}
            </select>
          </div>
          <button
            onClick={() => setShowExportModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg text-sm font-medium transition"
            data-testid="export-btn"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Export Modal */}
      {showExportModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className={`${cardBg} border rounded-xl p-6 w-full max-w-md shadow-xl`}>
            <div className="flex items-center justify-between mb-4">
              <h3 className={`text-lg font-semibold ${textPrimary}`}>Export Fuel Logs</h3>
              <button onClick={() => setShowExportModal(false)} className={`p-1 rounded ${hoverBg}`}>
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className={`block ${textSecondary} text-sm mb-1`}>Date From (Optional)</label>
                <input
                  type="date"
                  value={exportDateFrom}
                  onChange={(e) => setExportDateFrom(e.target.value)}
                  className={`w-full ${inputBg} border rounded-lg px-3 py-2 text-sm`}
                />
              </div>
              <div>
                <label className={`block ${textSecondary} text-sm mb-1`}>Date To (Optional)</label>
                <input
                  type="date"
                  value={exportDateTo}
                  onChange={(e) => setExportDateTo(e.target.value)}
                  className={`w-full ${inputBg} border rounded-lg px-3 py-2 text-sm`}
                />
              </div>
              <p className={`text-xs ${textSecondary}`}>
                Vehicle filter ({filterVehicle ? vehicles.find(v => v.id === filterVehicle)?.name : 'All'}) will also be applied.
              </p>
            </div>
            
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowExportModal(false)}
                className={`flex-1 px-4 py-2 border rounded-lg font-medium ${darkMode ? 'border-[#334155] text-gray-300 hover:bg-[#334155]' : 'border-gray-200 hover:bg-gray-100'}`}
              >
                Cancel
              </button>
              <button
                onClick={handleExport}
                className="flex-1 px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg font-medium"
              >
                Download CSV
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Fuel Logs Table */}
      <div className={`${cardBg} border rounded-xl overflow-hidden shadow-sm`}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px]">
            <thead className={tableBg}>
              <tr>
                <th className={`text-left ${textSecondary} font-medium px-6 py-4`}>Date</th>
                <th className={`text-left ${textSecondary} font-medium px-6 py-4`}>Vehicle</th>
                <th className={`text-left ${textSecondary} font-medium px-6 py-4`}>Liters</th>
                <th className={`text-left ${textSecondary} font-medium px-6 py-4`}>Cost</th>
                <th className={`text-left ${textSecondary} font-medium px-6 py-4`}>Station</th>
                <th className={`text-left ${textSecondary} font-medium px-6 py-4`}>Actions</th>
              </tr>
            </thead>
          <tbody className={dividerColor}>
            {filteredLogs.map((log) => (
              <tr key={log.id} className={hoverBg} data-testid={`fuel-row-${log.id}`}>
                <td className={`px-6 py-4 ${textPrimary}`}>
                  {formatDateTimeAU(log.timestamp)}
                </td>
                <td className={`px-6 py-4 ${textPrimary}`}>{getVehicleName(log.vehicle_id)}</td>
                <td className={`px-6 py-4 ${textPrimary}`}>{log.liters}L</td>
                <td className={`px-6 py-4 font-medium ${darkMode ? 'text-green-400' : 'text-green-600'}`}>${log.amount}</td>
                <td className={`px-6 py-4 ${log.fuel_station ? textPrimary : (darkMode ? 'text-gray-400 italic' : 'text-gray-400 italic')}`}>
                  {log.fuel_station || 'Not recorded'}
                </td>
                <td className="px-6 py-4">
                  <button
                    onClick={() => openDetails(log)}
                    className={`flex items-center gap-1 font-medium text-sm ${darkMode ? 'text-cyan-400 hover:text-cyan-300' : 'text-cyan-600 hover:text-cyan-700'}`}
                    data-testid={`view-btn-${log.id}`}
                  >
                    <Eye className="w-4 h-4" />
                    View
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>

        {filteredLogs.length === 0 && (
          <EmptyState type="fuel" />
        )}
      </div>

      {/* Fuel Log Details Panel */}
      <SlidePanel
        isOpen={showDetailsPanel}
        onClose={() => setShowDetailsPanel(false)}
        title="Fuel Log Details"
        subtitle={selectedLog ? formatDate(selectedLog.timestamp) : ''}
        width="md"
      >
        {selectedLog && (
          <div className="space-y-6">
            {/* Main Stats */}
            <div className="grid grid-cols-2 gap-4">
              <div className={`${sectionBg} rounded-lg p-4 text-center`}>
                <Fuel className={`w-6 h-6 mx-auto mb-2 ${darkMode ? 'text-cyan-400' : 'text-cyan-600'}`} />
                <p className={`text-2xl font-bold ${textPrimary}`}>{selectedLog.liters}L</p>
                <p className={`text-sm ${textSecondary}`}>Liters</p>
              </div>
              <div className={`${sectionBg} rounded-lg p-4 text-center`}>
                <Receipt className={`w-6 h-6 mx-auto mb-2 ${darkMode ? 'text-green-400' : 'text-green-600'}`} />
                <p className={`text-2xl font-bold ${darkMode ? 'text-green-400' : 'text-green-600'}`}>{formatCurrency(selectedLog.amount)}</p>
                <p className={`text-sm ${textSecondary}`}>Cost</p>
              </div>
            </div>

            {/* Price per liter */}
            <div className={`${sectionBg} rounded-lg p-4`}>
              <p className={`text-sm ${textSecondary}`}>Price per Liter</p>
              <p className={`text-xl font-bold ${textPrimary}`}>
                {formatCurrency(selectedLog.amount / selectedLog.liters)}/L
              </p>
            </div>

            {/* Vehicle Info */}
            <div className={`${sectionBg} rounded-lg p-4`}>
              <div className="flex items-center gap-2 mb-2">
                <Car className={`w-4 h-4 ${textSecondary}`} />
                <span className={textSecondary}>Vehicle</span>
              </div>
              {(() => {
                const vehicle = getVehicleInfo(selectedLog.vehicle_id);
                return vehicle ? (
                  <>
                    <p className={`${textPrimary} font-medium`}>{vehicle.name}</p>
                    <p className={textSecondary}>{vehicle.registration_number}</p>
                  </>
                ) : (
                  <p className={textPrimary}>Unknown Vehicle</p>
                );
              })()}
            </div>

            {/* Driver Info */}
            {selectedLog.driver_name && (
              <div className={`${sectionBg} rounded-lg p-4`}>
                <div className="flex items-center gap-2 mb-2">
                  <User className={`w-4 h-4 ${textSecondary}`} />
                  <span className={textSecondary}>Driver</span>
                </div>
                <p className={`${textPrimary} font-medium`}>{selectedLog.driver_name}</p>
              </div>
            )}

            {/* Station */}
            <div className={`${sectionBg} rounded-lg p-4`}>
              <div className="flex items-center gap-2 mb-2">
                <MapPin className={`w-4 h-4 ${textSecondary}`} />
                <span className={textSecondary}>Fuel Station</span>
              </div>
              <p className={`${textPrimary} font-medium`}>
                {selectedLog.fuel_station || 'Not recorded'}
              </p>
              {selectedLog.gps_latitude && selectedLog.gps_longitude && (
                <a 
                  href={`https://www.google.com/maps?q=${selectedLog.gps_latitude},${selectedLog.gps_longitude}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`text-sm ${darkMode ? 'text-cyan-400' : 'text-cyan-600'} hover:underline mt-1 inline-block`}
                >
                  View on Map →
                </a>
              )}
            </div>

            {/* Odometer */}
            {selectedLog.odometer && (
              <div className={`${sectionBg} rounded-lg p-4`}>
                <div className="flex items-center gap-2 mb-2">
                  <Clock className={`w-4 h-4 ${textSecondary}`} />
                  <span className={textSecondary}>Odometer Reading</span>
                </div>
                <p className={`${textPrimary} font-medium`}>{selectedLog.odometer.toLocaleString()} km</p>
              </div>
            )}

            {/* Notes */}
            {selectedLog.notes && (
              <div className={`${sectionBg} rounded-lg p-4`}>
                <div className="flex items-center gap-2 mb-2">
                  <FileText className={`w-4 h-4 ${textSecondary}`} />
                  <span className={textSecondary}>Notes</span>
                </div>
                <p className={textPrimary}>{selectedLog.notes}</p>
              </div>
            )}

            {/* Receipt Photo */}
            {selectedLog.receipt_photo_base64 && (
              <div>
                <h3 className={`${textPrimary} font-medium mb-2 flex items-center gap-2`}>
                  <Receipt className="w-4 h-4" />
                  Receipt Photo
                </h3>
                <img 
                  src={selectedLog.receipt_photo_base64} 
                  alt="Fuel receipt" 
                  className="w-full rounded-lg cursor-pointer hover:opacity-90 transition"
                  onClick={() => window.open(selectedLog.receipt_photo_base64, '_blank')}
                />
              </div>
            )}

            {/* Timestamp */}
            <div className={`${sectionBg} rounded-lg p-4 flex items-center gap-4`}>
              <Clock className={`w-4 h-4 ${textSecondary}`} />
              <div>
                <p className={textSecondary}>Submitted: {formatDate(selectedLog.timestamp)}</p>
              </div>
            </div>
          </div>
        )}
      </SlidePanel>
    </div>
  );
};

export default FuelLogsPage;
