import React, { useEffect, useState } from 'react';
import { fuelAPI, vehicleAPI } from '../utils/api';
import { useTheme } from '../contexts/ThemeContext';
import EmptyState from '../components/EmptyState';
import { SkeletonTable, SkeletonCard } from '../components/Skeleton';

interface FuelLog {
  id: string;
  vehicle_id: string;
  driver_id: string;
  amount: number;
  liters: number;
  timestamp: string;
  fuel_station?: string;
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

  // Theme styles - Professional Dark Mode
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

  const filteredLogs = filterVehicle
    ? fuelLogs.filter((log) => log.vehicle_id === filterVehicle)
    : fuelLogs;

  const totalSpend = filteredLogs.reduce((sum, log) => sum + log.amount, 0);
  const totalLiters = filteredLogs.reduce((sum, log) => sum + log.liters, 0);

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
        <SkeletonTable rows={5} columns={5} />
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
        <div className="flex items-center gap-4">
          <div>
            <label className={`block ${textSecondary} text-sm mb-1`}>Filter by Vehicle</label>
            <select
              value={filterVehicle}
              onChange={(e) => setFilterVehicle(e.target.value)}
              className={`${inputBg} border rounded-lg px-3 py-2.5 text-sm min-w-[200px] focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none transition`}
            >
              <option value="">All Vehicles</option>
              {vehicles.map(v => (
                <option key={v.id} value={v.id}>{v.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Fuel Logs Table */}
      <div className={`${cardBg} border rounded-xl overflow-hidden shadow-sm`}>
        <table className="w-full">
          <thead className={tableBg}>
            <tr>
              <th className={`text-left ${textSecondary} font-medium px-6 py-4`}>Date</th>
              <th className={`text-left ${textSecondary} font-medium px-6 py-4`}>Vehicle</th>
              <th className={`text-left ${textSecondary} font-medium px-6 py-4`}>Liters</th>
              <th className={`text-left ${textSecondary} font-medium px-6 py-4`}>Cost</th>
              <th className={`text-left ${textSecondary} font-medium px-6 py-4`}>Station</th>
            </tr>
          </thead>
          <tbody className={dividerColor}>
            {filteredLogs.map((log) => (
              <tr key={log.id} className={hoverBg}>
                <td className={`px-6 py-4 ${textPrimary}`}>
                  {new Date(log.timestamp).toLocaleDateString('en-AU', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                  })}
                </td>
                <td className={`px-6 py-4 ${textPrimary}`}>{getVehicleName(log.vehicle_id)}</td>
                <td className={`px-6 py-4 ${textPrimary}`}>{log.liters}L</td>
                <td className={`px-6 py-4 font-medium ${darkMode ? 'text-green-400' : 'text-green-600'}`}>${log.amount}</td>
                <td className={`px-6 py-4 ${log.fuel_station ? textPrimary : (darkMode ? 'text-gray-400 italic' : 'text-gray-400 italic')}`}>
                  {log.fuel_station || 'Not recorded'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredLogs.length === 0 && (
          <EmptyState type="fuel" />
        )}
      </div>
    </div>
  );
};

export default FuelLogsPage;
