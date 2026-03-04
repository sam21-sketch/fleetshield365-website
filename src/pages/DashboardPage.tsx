import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { dashboardAPI } from '../utils/api';
import { useTheme } from '../contexts/ThemeContext';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { DashboardSkeleton } from '../components/Skeleton';

interface Stats {
  total_vehicles: number;
  total_drivers: number;
  inspections_today: number;
  inspections_missed: number;
  issues_today: number;
  fuel_this_month: number;
  expiring_soon: number;
}

interface Alert {
  id: string;
  type: string;
  message: string;
  severity: 'critical' | 'warning' | 'info';
  created_at: string;
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
  const [weeklyData, setWeeklyData] = useState<ChartDataPoint[]>([]);
  const [loading, setLoading] = useState(true);

  // Theme styles - Professional Dark Mode
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
      const [statsRes, alertsRes, chartRes] = await Promise.all([
        dashboardAPI.getStats(),
        dashboardAPI.getAlerts(),
        dashboardAPI.getChartData(7),
      ]);
      setStats(statsRes.data);
      setAlerts(alertsRes.data || []);
      setWeeklyData(chartRes.data || []);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
      setStats({
        total_vehicles: 0,
        total_drivers: 0,
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

  // Pie chart data for fleet status
  const fleetStatusData = [
    { name: 'Active', value: stats?.total_vehicles || 0, color: '#06b6d4' },
    { name: 'Expiring Soon', value: stats?.expiring_soon || 0, color: '#f97316' },
    { name: 'Issues', value: stats?.issues_today || 0, color: '#ef4444' },
  ].filter(d => d.value > 0);

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
        <Link to="/reports?filter=today" className={`${cardBg} rounded-xl p-5 hover:shadow-md transition-all group border`}>
          <div className="flex items-center justify-between mb-3">
            <div className={`w-10 h-10 ${darkMode ? 'bg-blue-500/20' : 'bg-blue-50'} rounded-lg flex items-center justify-center`}>
              <svg className={`w-5 h-5 ${darkMode ? 'text-blue-400' : 'text-blue-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
            </div>
            <svg className={`w-4 h-4 ${textSecondary} group-hover:translate-x-1 transition-all`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
          <div className={`text-2xl font-bold ${textPrimary}`}>{stats?.inspections_today || 0}</div>
          <div className={`${textSecondary} text-sm`}>Inspections Today</div>
          {(stats?.inspections_missed || 0) > 0 && (
            <div className="text-red-500 text-xs mt-1">{stats?.inspections_missed} missed</div>
          )}
        </Link>

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

        <Link to="/fuel-logs" className={`${cardBg} rounded-xl p-5 hover:shadow-md transition-all group border`}>
          <div className="flex items-center justify-between mb-3">
            <div className={`w-10 h-10 ${darkMode ? 'bg-green-500/20' : 'bg-green-50'} rounded-lg flex items-center justify-center`}>
              <svg className={`w-5 h-5 ${darkMode ? 'text-green-400' : 'text-green-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <svg className={`w-4 h-4 ${textSecondary} group-hover:translate-x-1 transition-all`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
          <div className={`text-2xl font-bold ${textPrimary}`}>${(stats?.fuel_this_month || 0).toLocaleString()}</div>
          <div className={`${textSecondary} text-sm`}>Fuel This Month</div>
        </Link>

        <Link to="/vehicles" className={`${cardBg} rounded-xl p-5 hover:shadow-md transition-all group border`}>
          <div className="flex items-center justify-between mb-3">
            <div className={`w-10 h-10 ${(stats?.expiring_soon || 0) > 0 
              ? (darkMode ? 'bg-orange-500/20' : 'bg-orange-50') 
              : (darkMode ? 'bg-[#334155]' : 'bg-gray-50')} rounded-lg flex items-center justify-center`}>
              <svg className={`w-5 h-5 ${(stats?.expiring_soon || 0) > 0 
                ? (darkMode ? 'text-orange-400' : 'text-orange-500') 
                : textSecondary}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <svg className={`w-4 h-4 ${textSecondary} group-hover:translate-x-1 transition-all`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
          <div className={`text-2xl font-bold ${textPrimary}`}>{stats?.expiring_soon || 0}</div>
          <div className={`${textSecondary} text-sm`}>Expiring Soon</div>
        </Link>
      </div>

      {/* Charts Section */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Weekly Inspections Chart */}
        <div className={`${cardBg} rounded-xl border p-5`}>
          <h2 className={`text-lg font-semibold ${textPrimary} mb-4`}>Weekly Inspections</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={weeklyData}>
                <defs>
                  <linearGradient id="inspectionGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={chartGridColor} />
                <XAxis dataKey="day" tick={{ fill: chartTextColor, fontSize: 12 }} axisLine={{ stroke: chartGridColor }} />
                <YAxis tick={{ fill: chartTextColor, fontSize: 12 }} axisLine={{ stroke: chartGridColor }} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: darkMode ? '#1e293b' : '#fff', 
                    border: `1px solid ${darkMode ? '#334155' : '#e5e7eb'}`,
                    borderRadius: '8px',
                    color: darkMode ? '#f1f5f9' : '#1f2937'
                  }} 
                />
                <Area type="monotone" dataKey="inspections" stroke="#06b6d4" fill="url(#inspectionGradient)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Issues vs Inspections Chart */}
        <div className={`${cardBg} rounded-xl border p-5`}>
          <h2 className={`text-lg font-semibold ${textPrimary} mb-4`}>Daily Overview</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyData}>
                <CartesianGrid strokeDasharray="3 3" stroke={chartGridColor} />
                <XAxis dataKey="day" tick={{ fill: chartTextColor, fontSize: 12 }} axisLine={{ stroke: chartGridColor }} />
                <YAxis tick={{ fill: chartTextColor, fontSize: 12 }} axisLine={{ stroke: chartGridColor }} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: darkMode ? '#1e293b' : '#fff', 
                    border: `1px solid ${darkMode ? '#334155' : '#e5e7eb'}`,
                    borderRadius: '8px',
                    color: darkMode ? '#f1f5f9' : '#1f2937'
                  }} 
                />
                <Bar dataKey="inspections" fill="#06b6d4" radius={[4, 4, 0, 0]} name="Inspections" />
                <Bar dataKey="issues" fill="#ef4444" radius={[4, 4, 0, 0]} name="Issues" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Recent Alerts */}
        <div className={`lg:col-span-2 ${cardBg} rounded-xl border`}>
          <div className={`p-5 border-b ${darkMode ? 'border-[#334155]' : 'border-gray-100'} flex items-center justify-between`}>
            <h2 className={`text-lg font-semibold ${textPrimary}`}>Recent Alerts</h2>
            <span className="bg-red-50 text-red-600 text-xs font-medium px-2 py-1 rounded-full">
              {alerts.filter(a => !a.message.includes('read')).length} active
            </span>
          </div>
          <div className={`divide-y ${darkMode ? 'divide-[#334155]' : 'divide-gray-50'}`}>
            {alerts.slice(0, 5).map((alert) => (
              <div key={alert.id} className={`p-4 ${darkMode ? 'hover:bg-[#334155]/50' : 'hover:bg-gray-50'} transition-colors`}>
                <div className="flex items-start gap-3">
                  <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${
                    alert.type === 'unsafe_vehicle' ? 'bg-red-500' :
                    alert.type === 'expiry_warning' ? 'bg-orange-500' : 'bg-blue-500'
                  }`}></div>
                  <div className="flex-1 min-w-0">
                    <p className={`${darkMode ? 'text-gray-300' : 'text-gray-700'} text-sm`}>{alert.message}</p>
                    <p className={textSecondary + ' text-xs mt-1'}>
                      {new Date(alert.created_at).toLocaleDateString('en-AU', { 
                        day: '2-digit', 
                        month: '2-digit', 
                        year: 'numeric' 
                      })}
                    </p>
                  </div>
                </div>
              </div>
            ))}
            {alerts.length === 0 && (
              <div className={`p-8 text-center ${textSecondary}`}>
                No recent alerts
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
