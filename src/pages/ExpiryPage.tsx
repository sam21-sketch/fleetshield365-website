import React, { useState, useEffect } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { api } from '../utils/api';

interface ExpiringItem {
  name: string;
  type: string;
  expiry_date: string;
  status: 'expired' | 'expiring';
}

interface ExpiryData {
  equipment: ExpiringItem[];
  operators: ExpiringItem[];
}

const ExpiryPage: React.FC = () => {
  const { darkMode } = useTheme();
  const [loading, setLoading] = useState(true);
  const [expiryData, setExpiryData] = useState<ExpiryData>({ equipment: [], operators: [] });

  // Theme classes
  const bgColor = darkMode ? 'bg-[#0B1121]' : 'bg-gray-50';
  const cardBg = darkMode ? 'bg-[#1E293B] border-[#334155]' : 'bg-white border-gray-200';
  const textPrimary = darkMode ? 'text-white' : 'text-gray-900';
  const textSecondary = darkMode ? 'text-gray-400' : 'text-gray-500';

  useEffect(() => {
    fetchExpiryData();
  }, []);

  const fetchExpiryData = async () => {
    try {
      setLoading(true);
      
      // Fetch vehicles and drivers
      const [vehiclesRes, driversRes] = await Promise.all([
        api.get('/vehicles'),
        api.get('/drivers')
      ]);

      const today = new Date().toISOString().split('T')[0];
      const thirtyDays = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      // Process equipment expiries
      const equipment: ExpiringItem[] = [];
      const expiryFields = [
        { field: 'rego_expiry', label: 'Rego' },
        { field: 'insurance_expiry', label: 'Insurance' },
        { field: 'coi_expiry', label: 'COI' },
        { field: 'safety_certificate_expiry', label: 'Safety Cert' }
      ];

      vehiclesRes.data.forEach((vehicle: any) => {
        expiryFields.forEach(({ field, label }) => {
          const expiry = vehicle[field];
          if (expiry && expiry.toUpperCase() !== 'NA') {
            if (expiry < today) {
              equipment.push({
                name: vehicle.name,
                type: label,
                expiry_date: expiry,
                status: 'expired'
              });
            } else if (expiry <= thirtyDays) {
              equipment.push({
                name: vehicle.name,
                type: label,
                expiry_date: expiry,
                status: 'expiring'
              });
            }
          }
        });
      });

      // Process operator expiries
      const operators: ExpiringItem[] = [];
      const operatorFields = [
        { field: 'license_expiry', label: 'License' },
        { field: 'medical_certificate_expiry', label: 'Medical Cert' },
        { field: 'first_aid_expiry', label: 'First Aid' },
        { field: 'forklift_license_expiry', label: 'Forklift' },
        { field: 'dangerous_goods_expiry', label: 'Dangerous Goods' }
      ];

      driversRes.data.forEach((driver: any) => {
        operatorFields.forEach(({ field, label }) => {
          const expiry = driver[field];
          if (expiry && expiry.toUpperCase() !== 'NA') {
            if (expiry < today) {
              operators.push({
                name: driver.name,
                type: label,
                expiry_date: expiry,
                status: 'expired'
              });
            } else if (expiry <= thirtyDays) {
              operators.push({
                name: driver.name,
                type: label,
                expiry_date: expiry,
                status: 'expiring'
              });
            }
          }
        });
      });

      // Sort by status (expired first) then by date
      const sortItems = (items: ExpiringItem[]) => {
        return items.sort((a, b) => {
          if (a.status === 'expired' && b.status !== 'expired') return -1;
          if (a.status !== 'expired' && b.status === 'expired') return 1;
          return a.expiry_date.localeCompare(b.expiry_date);
        });
      };

      setExpiryData({
        equipment: sortItems(equipment),
        operators: sortItems(operators)
      });
    } catch (error) {
      console.error('Failed to fetch expiry data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const getStatusBadge = (status: 'expired' | 'expiring') => {
    if (status === 'expired') {
      return (
        <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-500/20 text-red-500">
          EXPIRED
        </span>
      );
    }
    return (
      <span className="px-2 py-1 text-xs font-medium rounded-full bg-orange-500/20 text-orange-500">
        Expiring Soon
      </span>
    );
  };

  const ExpiryCard = ({ title, icon, items, emptyMessage }: { 
    title: string; 
    icon: React.ReactNode;
    items: ExpiringItem[]; 
    emptyMessage: string;
  }) => (
    <div className={`${cardBg} rounded-xl border p-5 h-full`}>
      <div className="flex items-center gap-3 mb-4">
        {icon}
        <h2 className={`text-lg font-semibold ${textPrimary}`}>{title}</h2>
        {items.length > 0 && (
          <span className={`ml-auto px-2 py-1 text-xs rounded-full ${
            items.some(i => i.status === 'expired') 
              ? 'bg-red-500/20 text-red-500' 
              : 'bg-orange-500/20 text-orange-500'
          }`}>
            {items.length} items
          </span>
        )}
      </div>

      {items.length === 0 ? (
        <div className={`text-center py-8 ${textSecondary}`}>
          <svg className="w-12 h-12 mx-auto mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p>{emptyMessage}</p>
        </div>
      ) : (
        <div className="space-y-2 max-h-[500px] overflow-y-auto">
          {items.map((item, index) => (
            <div 
              key={index} 
              className={`p-3 rounded-lg ${
                item.status === 'expired' 
                  ? (darkMode ? 'bg-red-500/10 border border-red-500/20' : 'bg-red-50 border border-red-100')
                  : (darkMode ? 'bg-orange-500/10 border border-orange-500/20' : 'bg-orange-50 border border-orange-100')
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className={`font-medium ${textPrimary}`}>{item.name}</div>
                  <div className={`text-sm ${textSecondary}`}>
                    {item.type} • {formatDate(item.expiry_date)}
                  </div>
                </div>
                {getStatusBadge(item.status)}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  if (loading) {
    return (
      <div className={`min-h-screen ${bgColor} p-6 flex items-center justify-center`}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-500"></div>
      </div>
    );
  }

  const expiredEquipment = expiryData.equipment.filter(i => i.status === 'expired').length;
  const expiredOperators = expiryData.operators.filter(i => i.status === 'expired').length;
  const totalExpired = expiredEquipment + expiredOperators;
  const totalExpiring = expiryData.equipment.length + expiryData.operators.length - totalExpired;

  return (
    <div className={`min-h-screen ${bgColor} p-6`}>
      {/* Header */}
      <div className="mb-6">
        <h1 className={`text-2xl font-bold ${textPrimary}`}>Expiry Management</h1>
        <p className={`${textSecondary} mt-1`}>Track and manage all expiring documents and certifications</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className={`${cardBg} rounded-xl border p-4`}>
          <div className="text-red-500 text-2xl font-bold">{totalExpired}</div>
          <div className={`${textSecondary} text-sm`}>Total Expired</div>
        </div>
        <div className={`${cardBg} rounded-xl border p-4`}>
          <div className="text-orange-500 text-2xl font-bold">{totalExpiring}</div>
          <div className={`${textSecondary} text-sm`}>Expiring Soon</div>
        </div>
        <div className={`${cardBg} rounded-xl border p-4`}>
          <div className={`text-2xl font-bold ${textPrimary}`}>{expiryData.equipment.length}</div>
          <div className={`${textSecondary} text-sm`}>Equipment Items</div>
        </div>
        <div className={`${cardBg} rounded-xl border p-4`}>
          <div className={`text-2xl font-bold ${textPrimary}`}>{expiryData.operators.length}</div>
          <div className={`${textSecondary} text-sm`}>Operator Items</div>
        </div>
      </div>

      {/* Split View - Equipment & Operators */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Equipment Expiry - Left */}
        <ExpiryCard
          title="Equipment Expiry"
          icon={
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${darkMode ? 'bg-cyan-500/20' : 'bg-cyan-50'}`}>
              <svg className="w-5 h-5 text-cyan-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
              </svg>
            </div>
          }
          items={expiryData.equipment}
          emptyMessage="No equipment expiring soon"
        />

        {/* Operator License - Right */}
        <ExpiryCard
          title="Operator License & Training"
          icon={
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${darkMode ? 'bg-purple-500/20' : 'bg-purple-50'}`}>
              <svg className="w-5 h-5 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
          }
          items={expiryData.operators}
          emptyMessage="No operator licenses expiring soon"
        />
      </div>
    </div>
  );
};

export default ExpiryPage;
