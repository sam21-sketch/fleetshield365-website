import React, { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { dashboardAPI, incidentAPI } from '../utils/api';
import { useTheme } from '../contexts/ThemeContext';
import { DashboardSkeleton } from '../components/Skeleton';
import { formatDateTimeAU, formatDateShortAU } from '../utils/dateUtils';
import { AlertTriangle, Shield, Clock, ChevronRight } from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Filler,
  Legend,
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Filler,
  Legend
);

interface ExpiringVehicle {
  name: string;
  rego_expiry?: string;
  insurance_expiry?: string;
  coi_expiry?: string;
}

interface Stats {
  total_vehicles: number;
  total_drivers: number;
  active_today: number;
  inspections_today: number;
  inspections_missed: number;
  issues_today: number;
  fuel_this_month: number;
  expiring_soon: number;
  upcoming_rego_expiry?: number;
  upcoming_insurance_expiry?: number;
  upcoming_safety_cert_expiry?: number;
  upcoming_coi_expiry?: number;
  drivers_license_expiring?: number;
  drivers_license_expired?: number;
  drivers_training_expiring?: number;
  drivers_training_expired?: number;
  vehicles_needing_attention?: number;
  rego_expiring_vehicles?: ExpiringVehicle[];
  insurance_expiring_vehicles?: ExpiringVehicle[];
  coi_expiring_vehicles?: ExpiringVehicle[];
}

interface Alert {
  id: string;
  type: string;
  message: string;
  severity: 'critical' | 'warning' | 'info';
  created_at: string;
}

interface Incident {
  id: string;
  incident_type: string;
  description: string;
  vehicle_id: string;
  vehicle_name?: string;
  driver_name?: string;
  severity: string;
  status: string;
  timestamp: string;
}

interface ChartDataPoint {
  day: string;
  date: string;
  inspections: number;
  issues: number;
  fuel: number;
}

const DashboardPage: React.FC = () => {
  const { darkMode } = useTheme();
  const [stats, setStats] = useState<Stats | null>(null);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [weeklyData, setWeeklyData] = useState<ChartDataPoint[]>([]);
  const [loading, setLoading] = useState(true);

  const textPrimary = darkMode ? 'text-gray-100' : 'text-gray-900';
  const textSecondary = darkMode ? 'text-gray-300' : 'text-gray-500';
  const cardBg = darkMode ? 'bg-[#1E293B] border-[#334155]' : 'bg-white border-gray-100';
  const chartGridColor = darkMode ? '#475569' : '#e5e7eb';
  const chartTextColor = darkMode ? '#cbd5e1' : '#6b7280';

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [statsRes, alertsRes, chartRes, incidentsRes] = await Promise.all([
        dashboardAPI.getStats(),
        dashboardAPI.getAlerts(),
        dashboardAPI.getChartData(7),
        incidentAPI.getAll(),
      ]);
      setStats(statsRes.data);
      setAlerts(alertsRes.data || []);
      setWeeklyData(chartRes.data || []);
      
      // Get recent incidents (last 7 days)
      const recentIncidents = (incidentsRes.data || [])
        .sort((a: Incident, b: Incident) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, 5);
      setIncidents(recentIncidents);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
      setStats({
        total_vehicles: 0,
        total_drivers: 0,
        active_today: 0,
        inspections_today: 0,
        inspections_missed: 0,
        issues_today: 0,
        fuel_this_month: 0,
        expiring_soon: 0,
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <DashboardSkeleton />;
  }

  const completionRate = stats?.inspections_today 
    ? Math.max(0, Math.min(100, Math.round(((stats.inspections_today - (stats.inspections_missed || 0)) / stats.inspections_today) * 100)))
    : 100;

  // Chart.js configurations
  const areaChartData = {
    labels: weeklyData.map(d => d.day),
    datasets: [
      {
        label: 'Inspections',
        data: weeklyData.map(d => d.inspections),
        fill: true,
        borderColor: '#06b6d4',
        backgroundColor: 'rgba(6, 182, 212, 0.1)',
        tension: 0.4,
        pointRadius: 4,
        pointBackgroundColor: '#06b6d4',
      },
    ],
  };

  const barChartData = {
    labels: weeklyData.map(d => d.day),
    datasets: [
      {
        label: 'Inspections',
        data: weeklyData.map(d => d.inspections),
        backgroundColor: '#06b6d4',
        borderRadius: 4,
      },
      {
        label: 'Issues',
        data: weeklyData.map(d => d.issues),
        backgroundColor: '#ef4444',
        borderRadius: 4,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: darkMode ? '#1e293b' : '#fff',
        titleColor: darkMode ? '#f1f5f9' : '#1f2937',
        bodyColor: darkMode ? '#f1f5f9' : '#1f2937',
        borderColor: darkMode ? '#334155' : '#e5e7eb',
        borderWidth: 1,
        padding: 12,
        cornerRadius: 8,
      },
    },
    scales: {
      x: {
        grid: {
          color: chartGridColor,
          drawBorder: false,
        },
        ticks: {
          color: chartTextColor,
          font: { size: 12 },
        },
      },
      y: {
        grid: {
          color: chartGridColor,
          drawBorder: false,
        },
        ticks: {
          color: chartTextColor,
          font: { size: 12 },
        },
        beginAtZero: true,
      },
    },
  };

  const barChartOptions = {
    ...chartOptions,
    plugins: {
      ...chartOptions.plugins,
      legend: {
        display: true,
        position: 'top' as const,
        labels: {
          color: chartTextColor,
          usePointStyle: true,
          padding: 20,
        },
      },
    },
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className={`text-2xl font-bold ${textPrimary}`}>Dashboard</h1>
          <p className={`${textSecondary} text-sm`}>Overview of your fleet operations</p>
        </div>
        <div className="flex gap-2">
          <Link 
            to="/vehicles" 
            className="bg-[#0A1628] hover:bg-[#132337] text-white px-4 py-2 rounded-lg text-sm font-medium transition-all"
          >
            + Add Equipment
          </Link>
          <Link 
            to="/drivers" 
            className={`${darkMode ? 'bg-[#334155] hover:bg-[#475569] text-white border-[#334155]' : 'bg-gray-100 hover:bg-gray-200 text-gray-700 border-gray-200'} px-4 py-2 rounded-lg text-sm font-medium transition-all border`}
          >
            + Add Operator
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Equipment */}
        <Link to="/vehicles" className={`${cardBg} rounded-xl p-5 hover:shadow-md transition-all group border`}>
          <div className="flex items-center justify-between mb-3">
            <div className={`w-10 h-10 ${darkMode ? 'bg-blue-500/20' : 'bg-blue-50'} rounded-lg flex items-center justify-center`}>
              <svg className={`w-5 h-5 ${darkMode ? 'text-blue-400' : 'text-blue-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
              </svg>
            </div>
            <svg className={`w-4 h-4 ${textSecondary} group-hover:translate-x-1 transition-all`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
          <div className={`text-2xl font-bold ${textPrimary}`}>{stats?.total_vehicles || 0}</div>
          <div className={`${textSecondary} text-sm`}>Total Equipment</div>
        </Link>

        {/* Card 2: Active Today */}
        <Link to="/vehicles?filter=active_today" className={`${cardBg} rounded-xl p-5 hover:shadow-md transition-all group border`}>
          <div className="flex items-center justify-between mb-3">
            <div className={`w-10 h-10 ${darkMode ? 'bg-green-500/20' : 'bg-green-50'} rounded-lg flex items-center justify-center`}>
              <svg className={`w-5 h-5 ${darkMode ? 'text-green-400' : 'text-green-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <svg className={`w-4 h-4 ${textSecondary} group-hover:translate-x-1 transition-all`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
          <div className={`text-2xl font-bold ${textPrimary}`}>{stats?.active_today || 0}</div>
          <div className={`${textSecondary} text-sm`}>Active Today</div>
        </Link>

        {/* Card 3: Issues Today */}
        <Link to="/reports?filter=issues" className={`${cardBg} rounded-xl p-5 hover:shadow-md transition-all group border`}>
          <div className="flex items-center justify-between mb-3">
            <div className={`w-10 h-10 ${(stats?.issues_today || 0) > 0 
              ? (darkMode ? 'bg-red-500/20' : 'bg-red-50') 
              : (darkMode ? 'bg-green-500/20' : 'bg-green-50')} rounded-lg flex items-center justify-center`}>
              <svg className={`w-5 h-5 ${(stats?.issues_today || 0) > 0 
                ? (darkMode ? 'text-red-400' : 'text-red-500') 
                : (darkMode ? 'text-green-400' : 'text-green-500')}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <svg className={`w-4 h-4 ${textSecondary} group-hover:translate-x-1 transition-all`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
          <div className={`text-2xl font-bold ${textPrimary}`}>{stats?.issues_today || 0}</div>
          <div className={`${textSecondary} text-sm`}>Issues Today</div>
          {(stats?.issues_today || 0) === 0 && (
            <div className="text-green-500 text-xs mt-1">All clear</div>
          )}
        </Link>

        {/* Card 4: Expiring Soon */}
        <Link to="/expiry" className={`${cardBg} rounded-xl p-5 hover:shadow-md transition-all group border`}>
          <div className="flex items-center justify-between mb-3">
            <div className={`w-10 h-10 ${(stats?.expiring_soon || 0) > 0 || (stats?.drivers_license_expired || 0) > 0
              ? (darkMode ? 'bg-orange-500/20' : 'bg-orange-50') 
              : (darkMode ? 'bg-green-500/20' : 'bg-green-50')} rounded-lg flex items-center justify-center`}>
              <svg className={`w-5 h-5 ${(stats?.expiring_soon || 0) > 0 || (stats?.drivers_license_expired || 0) > 0
                ? (darkMode ? 'text-orange-400' : 'text-orange-500') 
                : (darkMode ? 'text-green-400' : 'text-green-500')}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <svg className={`w-4 h-4 ${textSecondary} group-hover:translate-x-1 transition-all`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
          <div className={`text-2xl font-bold ${textPrimary}`}>
            {(stats?.expiring_soon || 0) + (stats?.drivers_license_expiring || 0) + (stats?.drivers_license_expired || 0)}
          </div>
          <div className={`${textSecondary} text-sm`}>Expiring Soon</div>
          {(stats?.expiring_soon || 0) === 0 && (stats?.drivers_license_expiring || 0) === 0 && (stats?.drivers_license_expired || 0) === 0 && (
            <div className="text-green-500 text-xs mt-1">All clear</div>
          )}
        </Link>
      </div>

      {/* Expiry Details Section */}
      {((stats?.expiring_soon || 0) > 0 || (stats?.drivers_license_expiring || 0) > 0 || (stats?.drivers_license_expired || 0) > 0 || (stats?.drivers_training_expired || 0) > 0) && (
        <div className={`${cardBg} rounded-xl border p-5`}>
          <h2 className={`text-lg font-semibold ${textPrimary} mb-4 flex items-center gap-2`}>
            <svg className="w-5 h-5 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            Expiry Alerts
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {stats?.rego_expiring_vehicles && stats.rego_expiring_vehicles.length > 0 && (
              <div className={`p-4 rounded-lg ${darkMode ? 'bg-orange-500/10' : 'bg-orange-50'}`}>
                <div className="flex items-center justify-between mb-2">
                  <div className="text-orange-500 font-bold text-sm">Rego Expiring</div>
                  <span className="text-orange-500 text-xs">{stats.rego_expiring_vehicles.length} items</span>
                </div>
                {stats.rego_expiring_vehicles.map((v, i) => (
                  <div key={i} className={`${textPrimary} text-sm py-1 border-t ${darkMode ? 'border-orange-500/20' : 'border-orange-100'}`}>
                    {v.name} <span className={`${textSecondary} text-xs`}>({v.rego_expiry})</span>
                  </div>
                ))}
              </div>
            )}
            {stats?.insurance_expiring_vehicles && stats.insurance_expiring_vehicles.length > 0 && (
              <div className={`p-4 rounded-lg ${darkMode ? 'bg-orange-500/10' : 'bg-orange-50'}`}>
                <div className="flex items-center justify-between mb-2">
                  <div className="text-orange-500 font-bold text-sm">Insurance Expiring</div>
                  <span className="text-orange-500 text-xs">{stats.insurance_expiring_vehicles.length} items</span>
                </div>
                {stats.insurance_expiring_vehicles.map((v, i) => (
                  <div key={i} className={`${textPrimary} text-sm py-1 border-t ${darkMode ? 'border-orange-500/20' : 'border-orange-100'}`}>
                    {v.name} <span className={`${textSecondary} text-xs`}>({v.insurance_expiry})</span>
                  </div>
                ))}
              </div>
            )}
            {stats?.coi_expiring_vehicles && stats.coi_expiring_vehicles.length > 0 && (
              <div className={`p-4 rounded-lg ${darkMode ? 'bg-orange-500/10' : 'bg-orange-50'}`}>
                <div className="flex items-center justify-between mb-2">
                  <div className="text-orange-500 font-bold text-sm">COI Expiring</div>
                  <span className="text-orange-500 text-xs">{stats.coi_expiring_vehicles.length} items</span>
                </div>
                {stats.coi_expiring_vehicles.map((v, i) => (
                  <div key={i} className={`${textPrimary} text-sm py-1 border-t ${darkMode ? 'border-orange-500/20' : 'border-orange-100'}`}>
                    {v.name} <span className={`${textSecondary} text-xs`}>({v.coi_expiry})</span>
                  </div>
                ))}
              </div>
            )}
            {(stats?.drivers_license_expired || 0) > 0 && (
              <div className={`p-4 rounded-lg ${darkMode ? 'bg-red-500/10' : 'bg-red-50'}`}>
                <div className="text-red-500 font-bold text-xl">{stats?.drivers_license_expired}</div>
                <div className={`${textSecondary} text-sm`}>License EXPIRED</div>
              </div>
            )}
            {(stats?.drivers_license_expiring || 0) > 0 && (
              <div className={`p-4 rounded-lg ${darkMode ? 'bg-orange-500/10' : 'bg-orange-50'}`}>
                <div className="text-orange-500 font-bold text-xl">{stats?.drivers_license_expiring}</div>
                <div className={`${textSecondary} text-sm`}>License Expiring</div>
              </div>
            )}
            {(stats?.drivers_training_expired || 0) > 0 && (
              <div className={`p-4 rounded-lg ${darkMode ? 'bg-red-500/10' : 'bg-red-50'}`}>
                <div className="text-red-500 font-bold text-xl">{stats?.drivers_training_expired}</div>
                <div className={`${textSecondary} text-sm`}>Training EXPIRED</div>
              </div>
            )}
            {(stats?.drivers_training_expiring || 0) > 0 && (
              <div className={`p-4 rounded-lg ${darkMode ? 'bg-orange-500/10' : 'bg-orange-50'}`}>
                <div className="text-orange-500 font-bold text-xl">{stats?.drivers_training_expiring}</div>
                <div className={`${textSecondary} text-sm`}>Training Expiring</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Charts Section - Now using Chart.js */}
      <div className="grid lg:grid-cols-2 gap-6">
        <div className={`${cardBg} rounded-xl border p-5`}>
          <h2 className={`text-lg font-semibold ${textPrimary} mb-4`}>Weekly Inspections</h2>
          <div className="h-64">
            <Line data={areaChartData} options={chartOptions} />
          </div>
        </div>

        <div className={`${cardBg} rounded-xl border p-5`}>
          <h2 className={`text-lg font-semibold ${textPrimary} mb-4`}>Daily Overview</h2>
          <div className="h-64">
            <Bar data={barChartData} options={barChartOptions} />
          </div>
        </div>
      </div>

      {/* Two-Column Alert Section: Expiry Alerts + Incidents */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Left: Expiry Alerts */}
        <div className={`${cardBg} rounded-xl border`}>
          <div className={`p-5 border-b ${darkMode ? 'border-[#334155]' : 'border-gray-100'} flex items-center justify-between`}>
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-orange-500" />
              <h2 className={`text-lg font-semibold ${textPrimary}`}>Expiry Alerts</h2>
            </div>
            <span className="bg-orange-100 text-orange-600 text-xs font-medium px-2.5 py-1 rounded-full">
              {alerts.filter(a => a.type === 'expiry_warning').length} upcoming
            </span>
          </div>
          <div className={`divide-y ${darkMode ? 'divide-[#334155]' : 'divide-gray-50'} max-h-80 overflow-y-auto`}>
            {alerts.filter(a => a.type === 'expiry_warning').slice(0, 5).map((alert) => (
              <div key={alert.id} className={`p-4 ${darkMode ? 'hover:bg-[#334155]/50' : 'hover:bg-gray-50'} transition-colors`}>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0">
                    <Clock className="w-4 h-4 text-orange-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`${darkMode ? 'text-gray-300' : 'text-gray-700'} text-sm font-medium`}>{alert.message}</p>
                    <p className={textSecondary + ' text-xs mt-1'}>
                      {formatDateTimeAU(alert.created_at)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
            {alerts.filter(a => a.type === 'expiry_warning').length === 0 && (
              <div className={`p-8 text-center`}>
                <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-3">
                  <Shield className="w-6 h-6 text-green-600" />
                </div>
                <p className={`${textSecondary} font-medium`}>All Clear!</p>
                <p className={`${textSecondary} text-sm`}>No upcoming expiries</p>
              </div>
            )}
          </div>
          <Link 
            to="/vehicles" 
            className={`block p-3 text-center text-sm font-medium border-t ${darkMode ? 'border-[#334155] text-blue-400 hover:bg-[#334155]/50' : 'border-gray-100 text-blue-600 hover:bg-gray-50'} transition-colors`}
          >
            View All Vehicles <ChevronRight className="w-4 h-4 inline" />
          </Link>
        </div>

        {/* Right: Incidents - Eye-catching red styling */}
        <div className={`${cardBg} rounded-xl border ${incidents.length > 0 ? 'ring-2 ring-red-500/20' : ''}`}>
          <div className={`p-5 border-b ${darkMode ? 'border-[#334155]' : 'border-gray-100'} flex items-center justify-between ${incidents.length > 0 ? (darkMode ? 'bg-red-500/10' : 'bg-red-50') : ''}`}>
            <div className="flex items-center gap-2">
              <AlertTriangle className={`w-5 h-5 ${incidents.length > 0 ? 'text-red-500' : 'text-gray-400'}`} />
              <h2 className={`text-lg font-semibold ${textPrimary}`}>Incidents</h2>
            </div>
            <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
              incidents.length > 0 
                ? 'bg-red-100 text-red-600 animate-pulse' 
                : 'bg-green-100 text-green-600'
            }`}>
              {incidents.length > 0 ? `${incidents.length} reported` : 'None'}
            </span>
          </div>
          <div className={`divide-y ${darkMode ? 'divide-[#334155]' : 'divide-gray-50'} max-h-80 overflow-y-auto`}>
            {incidents.slice(0, 5).map((incident) => (
              <div key={incident.id} className={`p-4 ${darkMode ? 'hover:bg-red-500/5' : 'hover:bg-red-50/50'} transition-colors`}>
                <div className="flex items-start gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                    incident.severity === 'high' ? 'bg-red-100' : 
                    incident.severity === 'medium' ? 'bg-orange-100' : 'bg-yellow-100'
                  }`}>
                    <AlertTriangle className={`w-4 h-4 ${
                      incident.severity === 'high' ? 'text-red-600' : 
                      incident.severity === 'medium' ? 'text-orange-600' : 'text-yellow-600'
                    }`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded ${
                        incident.severity === 'high' ? 'bg-red-100 text-red-700' : 
                        incident.severity === 'medium' ? 'bg-orange-100 text-orange-700' : 'bg-yellow-100 text-yellow-700'
                      }`}>
                        {incident.severity?.toUpperCase()}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded ${darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'}`}>
                        {incident.incident_type?.replace(/_/g, ' ')}
                      </span>
                    </div>
                    <p className={`${darkMode ? 'text-gray-300' : 'text-gray-700'} text-sm font-medium`}>
                      {incident.description?.substring(0, 80)}{incident.description?.length > 80 ? '...' : ''}
                    </p>
                    <div className="flex items-center gap-3 mt-2">
                      <p className={textSecondary + ' text-xs'}>
                        {incident.vehicle_name || 'Unknown Vehicle'}
                      </p>
                      <p className={textSecondary + ' text-xs'}>
                        {formatDateTimeAU(incident.timestamp)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            {incidents.length === 0 && (
              <div className={`p-8 text-center`}>
                <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-3">
                  <Shield className="w-6 h-6 text-green-600" />
                </div>
                <p className={`${textSecondary} font-medium`}>No Incidents</p>
                <p className={`${textSecondary} text-sm`}>Your fleet is running smoothly</p>
              </div>
            )}
          </div>
          <Link 
            to="/incidents" 
            className={`block p-3 text-center text-sm font-medium border-t ${darkMode ? 'border-[#334155] text-red-400 hover:bg-red-500/10' : 'border-gray-100 text-red-600 hover:bg-red-50'} transition-colors`}
          >
            View All Incidents <ChevronRight className="w-4 h-4 inline" />
          </Link>
        </div>
      </div>

      {/* Main Grid - Other Alerts & Fleet Overview */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Other Alerts (non-expiry) */}
        <div className={`lg:col-span-2 ${cardBg} rounded-xl border`}>
          <div className={`p-5 border-b ${darkMode ? 'border-[#334155]' : 'border-gray-100'} flex items-center justify-between`}>
            <h2 className={`text-lg font-semibold ${textPrimary}`}>Recent Activity</h2>
            <span className="bg-blue-50 text-blue-600 text-xs font-medium px-2 py-1 rounded-full">
              {alerts.filter(a => a.type !== 'expiry_warning').length} alerts
            </span>
          </div>
          <div className={`divide-y ${darkMode ? 'divide-[#334155]' : 'divide-gray-50'}`}>
            {alerts.filter(a => a.type !== 'expiry_warning').slice(0, 5).map((alert) => (
              <div key={alert.id} className={`p-4 ${darkMode ? 'hover:bg-[#334155]/50' : 'hover:bg-gray-50'} transition-colors`}>
                <div className="flex items-start gap-3">
                  <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${
                    alert.type === 'unsafe_vehicle' ? 'bg-red-500' : 'bg-blue-500'
                  }`}></div>
                  <div className="flex-1 min-w-0">
                    <p className={`${darkMode ? 'text-gray-300' : 'text-gray-700'} text-sm`}>{alert.message}</p>
                    <p className={textSecondary + ' text-xs mt-1'}>
                      {formatDateTimeAU(alert.created_at)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
            {alerts.filter(a => a.type !== 'expiry_warning').length === 0 && (
              <div className={`p-8 text-center ${textSecondary}`}>
                No recent activity
              </div>
            )}
          </div>
        </div>

        {/* Fleet Overview */}
        <div className={`${cardBg} rounded-xl border`}>
          <div className={`p-5 border-b ${darkMode ? 'border-[#334155]' : 'border-gray-100'}`}>
            <h2 className={`text-lg font-semibold ${textPrimary}`}>Fleet Overview</h2>
          </div>
          <div className="p-5 space-y-4">
            <div className="flex items-center justify-between">
              <span className={textSecondary + ' text-sm'}>Total Equipment</span>
              <span className={`${textPrimary} font-semibold`}>{stats?.total_vehicles || 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className={textSecondary + ' text-sm'}>Total Operators</span>
              <span className={`${textPrimary} font-semibold`}>{stats?.total_drivers || 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className={textSecondary + ' text-sm'}>Completion Rate</span>
              <span className={`font-semibold ${completionRate >= 80 ? 'text-green-600' : completionRate >= 50 ? 'text-orange-600' : 'text-red-600'}`}>
                {completionRate}%
              </span>
            </div>
            <div className="pt-2">
              <div className={`h-2 ${darkMode ? 'bg-[#334155]' : 'bg-gray-100'} rounded-full overflow-hidden`}>
                <div 
                  className={`h-full rounded-full transition-all ${
                    completionRate >= 80 ? 'bg-green-500' : 
                    completionRate >= 50 ? 'bg-orange-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${completionRate}%` }}
                ></div>
              </div>
              <p className={textSecondary + ' text-xs mt-2'}>Inspection completion today</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className={`${cardBg} rounded-xl border p-5`}>
        <h2 className={`text-lg font-semibold ${textPrimary} mb-4`}>Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Link to="/vehicles" className={`p-4 ${darkMode ? 'bg-[#334155]/50 hover:bg-[#334155]' : 'bg-gray-50 hover:bg-gray-100'} rounded-lg transition-all text-center group`}>
            <svg className={`w-6 h-6 ${darkMode ? 'text-cyan-400' : 'text-cyan-600'} mx-auto mb-2`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
            </svg>
            <span className={`${darkMode ? 'text-gray-300' : 'text-gray-700'} text-sm font-medium`}>Manage Equipment</span>
          </Link>
          <Link to="/drivers" className={`p-4 ${darkMode ? 'bg-[#334155]/50 hover:bg-[#334155]' : 'bg-gray-50 hover:bg-gray-100'} rounded-lg transition-all text-center group`}>
            <svg className={`w-6 h-6 ${darkMode ? 'text-cyan-400' : 'text-cyan-600'} mx-auto mb-2`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <span className={`${darkMode ? 'text-gray-300' : 'text-gray-700'} text-sm font-medium`}>Manage Operators</span>
          </Link>
          <Link to="/reports" className={`p-4 ${darkMode ? 'bg-[#334155]/50 hover:bg-[#334155]' : 'bg-gray-50 hover:bg-gray-100'} rounded-lg transition-all text-center group`}>
            <svg className={`w-6 h-6 ${darkMode ? 'text-cyan-400' : 'text-cyan-600'} mx-auto mb-2`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span className={`${darkMode ? 'text-gray-300' : 'text-gray-700'} text-sm font-medium`}>View Reports</span>
          </Link>
          <Link to="/settings" className={`p-4 ${darkMode ? 'bg-[#334155]/50 hover:bg-[#334155]' : 'bg-gray-50 hover:bg-gray-100'} rounded-lg transition-all text-center group`}>
            <svg className={`w-6 h-6 ${darkMode ? 'text-cyan-400' : 'text-cyan-600'} mx-auto mb-2`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span className={`${darkMode ? 'text-gray-300' : 'text-gray-700'} text-sm font-medium`}>Settings</span>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
