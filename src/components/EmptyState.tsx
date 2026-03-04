import React from 'react';
import { useTheme } from '../contexts/ThemeContext';

type EmptyStateType = 'vehicles' | 'drivers' | 'inspections' | 'fuel' | 'reports' | 'users' | 'alerts';

interface EmptyStateProps {
  type: EmptyStateType;
  onAction?: () => void;
  actionLabel?: string;
  title?: string;
  description?: string;
}

// SVG Illustrations for each type
const illustrations: Record<EmptyStateType, React.FC<{ className?: string; darkMode?: boolean }>> = {
  vehicles: ({ className, darkMode }) => (
    <svg className={className} viewBox="0 0 200 160" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Road */}
      <rect x="0" y="120" width="200" height="40" fill={darkMode ? '#334155' : '#E5E7EB'} rx="4"/>
      <rect x="20" y="136" width="30" height="4" fill={darkMode ? '#475569' : '#D1D5DB'} rx="2"/>
      <rect x="70" y="136" width="30" height="4" fill={darkMode ? '#475569' : '#D1D5DB'} rx="2"/>
      <rect x="120" y="136" width="30" height="4" fill={darkMode ? '#475569' : '#D1D5DB'} rx="2"/>
      <rect x="170" y="136" width="20" height="4" fill={darkMode ? '#475569' : '#D1D5DB'} rx="2"/>
      {/* Truck Body */}
      <rect x="40" y="70" width="80" height="50" rx="8" fill={darkMode ? '#0EA5E9' : '#06B6D4'} opacity="0.2"/>
      <rect x="45" y="75" width="70" height="40" rx="6" fill={darkMode ? '#0EA5E9' : '#06B6D4'} opacity="0.4"/>
      {/* Truck Cab */}
      <rect x="120" y="85" width="35" height="35" rx="6" fill={darkMode ? '#0EA5E9' : '#06B6D4'} opacity="0.3"/>
      <rect x="130" y="92" width="20" height="15" rx="3" fill={darkMode ? '#1E293B' : '#FFFFFF'} opacity="0.8"/>
      {/* Wheels */}
      <circle cx="70" cy="120" r="12" fill={darkMode ? '#1E293B' : '#374151'}/>
      <circle cx="70" cy="120" r="6" fill={darkMode ? '#475569' : '#6B7280'}/>
      <circle cx="130" cy="120" r="12" fill={darkMode ? '#1E293B' : '#374151'}/>
      <circle cx="130" cy="120" r="6" fill={darkMode ? '#475569' : '#6B7280'}/>
      {/* Plus icon */}
      <circle cx="160" cy="50" r="20" fill={darkMode ? '#0EA5E9' : '#06B6D4'} opacity="0.2"/>
      <rect x="155" y="42" width="10" height="16" rx="2" fill={darkMode ? '#0EA5E9' : '#06B6D4'}/>
      <rect x="152" y="47" width="16" height="6" rx="2" fill={darkMode ? '#0EA5E9' : '#06B6D4'}/>
    </svg>
  ),
  
  drivers: ({ className, darkMode }) => (
    <svg className={className} viewBox="0 0 200 160" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Background circles */}
      <circle cx="100" cy="80" r="60" fill={darkMode ? '#0EA5E9' : '#06B6D4'} opacity="0.1"/>
      <circle cx="100" cy="80" r="45" fill={darkMode ? '#0EA5E9' : '#06B6D4'} opacity="0.1"/>
      {/* Person 1 */}
      <circle cx="70" cy="60" r="18" fill={darkMode ? '#0EA5E9' : '#06B6D4'} opacity="0.3"/>
      <circle cx="70" cy="55" r="10" fill={darkMode ? '#0EA5E9' : '#06B6D4'} opacity="0.5"/>
      <rect x="55" y="75" width="30" height="35" rx="10" fill={darkMode ? '#0EA5E9' : '#06B6D4'} opacity="0.3"/>
      {/* Person 2 (center, larger) */}
      <circle cx="100" cy="50" r="22" fill={darkMode ? '#0EA5E9' : '#06B6D4'} opacity="0.4"/>
      <circle cx="100" cy="44" r="12" fill={darkMode ? '#0EA5E9' : '#06B6D4'} opacity="0.6"/>
      <rect x="82" y="68" width="36" height="45" rx="12" fill={darkMode ? '#0EA5E9' : '#06B6D4'} opacity="0.4"/>
      {/* Person 3 */}
      <circle cx="130" cy="60" r="18" fill={darkMode ? '#0EA5E9' : '#06B6D4'} opacity="0.3"/>
      <circle cx="130" cy="55" r="10" fill={darkMode ? '#0EA5E9' : '#06B6D4'} opacity="0.5"/>
      <rect x="115" y="75" width="30" height="35" rx="10" fill={darkMode ? '#0EA5E9' : '#06B6D4'} opacity="0.3"/>
      {/* Plus badge */}
      <circle cx="155" cy="35" r="16" fill={darkMode ? '#10B981' : '#10B981'} opacity="0.8"/>
      <rect x="151" y="29" width="8" height="12" rx="2" fill="white"/>
      <rect x="149" y="33" width="12" height="4" rx="2" fill="white"/>
    </svg>
  ),
  
  inspections: ({ className, darkMode }) => (
    <svg className={className} viewBox="0 0 200 160" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Clipboard */}
      <rect x="50" y="20" width="100" height="130" rx="8" fill={darkMode ? '#334155' : '#E5E7EB'}/>
      <rect x="55" y="35" width="90" height="110" rx="6" fill={darkMode ? '#1E293B' : '#FFFFFF'}/>
      {/* Clip */}
      <rect x="75" y="15" width="50" height="15" rx="4" fill={darkMode ? '#475569' : '#9CA3AF'}/>
      <rect x="85" y="20" width="30" height="8" rx="2" fill={darkMode ? '#1E293B' : '#FFFFFF'}/>
      {/* Checklist items */}
      <rect x="65" y="50" width="12" height="12" rx="2" fill={darkMode ? '#10B981' : '#10B981'} opacity="0.8"/>
      <path d="M68 56L71 59L76 53" stroke="white" strokeWidth="2" strokeLinecap="round"/>
      <rect x="85" y="52" width="50" height="8" rx="2" fill={darkMode ? '#475569' : '#D1D5DB'}/>
      
      <rect x="65" y="72" width="12" height="12" rx="2" fill={darkMode ? '#10B981' : '#10B981'} opacity="0.8"/>
      <path d="M68 78L71 81L76 75" stroke="white" strokeWidth="2" strokeLinecap="round"/>
      <rect x="85" y="74" width="40" height="8" rx="2" fill={darkMode ? '#475569' : '#D1D5DB'}/>
      
      <rect x="65" y="94" width="12" height="12" rx="2" fill={darkMode ? '#10B981' : '#10B981'} opacity="0.8"/>
      <path d="M68 100L71 103L76 97" stroke="white" strokeWidth="2" strokeLinecap="round"/>
      <rect x="85" y="96" width="55" height="8" rx="2" fill={darkMode ? '#475569' : '#D1D5DB'}/>
      
      <rect x="65" y="116" width="12" height="12" rx="2" fill={darkMode ? '#334155' : '#E5E7EB'} stroke={darkMode ? '#475569' : '#D1D5DB'} strokeWidth="2"/>
      <rect x="85" y="118" width="35" height="8" rx="2" fill={darkMode ? '#475569' : '#D1D5DB'}/>
    </svg>
  ),
  
  fuel: ({ className, darkMode }) => (
    <svg className={className} viewBox="0 0 200 160" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Fuel pump base */}
      <rect x="60" y="100" width="80" height="50" rx="6" fill={darkMode ? '#334155' : '#E5E7EB'}/>
      {/* Fuel pump body */}
      <rect x="70" y="40" width="60" height="70" rx="8" fill={darkMode ? '#475569' : '#9CA3AF'}/>
      <rect x="80" y="50" width="40" height="30" rx="4" fill={darkMode ? '#1E293B' : '#1F2937'}/>
      {/* Fuel gauge */}
      <rect x="85" y="55" width="30" height="20" rx="2" fill={darkMode ? '#0EA5E9' : '#06B6D4'} opacity="0.3"/>
      <rect x="85" y="65" width="20" height="10" rx="1" fill={darkMode ? '#0EA5E9' : '#06B6D4'} opacity="0.8"/>
      {/* Nozzle */}
      <rect x="130" y="55" width="30" height="8" rx="2" fill={darkMode ? '#475569' : '#6B7280'}/>
      <rect x="155" y="50" width="12" height="18" rx="3" fill={darkMode ? '#475569' : '#6B7280'}/>
      {/* Hose */}
      <path d="M130 59 Q 145 80 155 59" stroke={darkMode ? '#475569' : '#6B7280'} strokeWidth="4" fill="none"/>
      {/* Dollar sign */}
      <circle cx="155" cy="110" r="18" fill={darkMode ? '#10B981' : '#10B981'} opacity="0.2"/>
      <text x="155" y="116" textAnchor="middle" fill={darkMode ? '#10B981' : '#10B981'} fontSize="18" fontWeight="bold">$</text>
    </svg>
  ),
  
  reports: ({ className, darkMode }) => (
    <svg className={className} viewBox="0 0 200 160" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Background chart */}
      <rect x="30" y="30" width="140" height="100" rx="8" fill={darkMode ? '#334155' : '#E5E7EB'}/>
      <rect x="40" y="40" width="120" height="80" rx="4" fill={darkMode ? '#1E293B' : '#FFFFFF'}/>
      {/* Bar chart */}
      <rect x="55" y="85" width="15" height="25" rx="2" fill={darkMode ? '#0EA5E9' : '#06B6D4'} opacity="0.4"/>
      <rect x="80" y="65" width="15" height="45" rx="2" fill={darkMode ? '#0EA5E9' : '#06B6D4'} opacity="0.6"/>
      <rect x="105" y="55" width="15" height="55" rx="2" fill={darkMode ? '#0EA5E9' : '#06B6D4'} opacity="0.8"/>
      <rect x="130" y="70" width="15" height="40" rx="2" fill={darkMode ? '#0EA5E9' : '#06B6D4'} opacity="0.5"/>
      {/* Trend line */}
      <path d="M55 80 L80 60 L105 50 L145 65" stroke={darkMode ? '#10B981' : '#10B981'} strokeWidth="3" strokeLinecap="round" fill="none"/>
      <circle cx="55" cy="80" r="4" fill={darkMode ? '#10B981' : '#10B981'}/>
      <circle cx="80" cy="60" r="4" fill={darkMode ? '#10B981' : '#10B981'}/>
      <circle cx="105" cy="50" r="4" fill={darkMode ? '#10B981' : '#10B981'}/>
      <circle cx="145" cy="65" r="4" fill={darkMode ? '#10B981' : '#10B981'}/>
    </svg>
  ),
  
  users: ({ className, darkMode }) => (
    <svg className={className} viewBox="0 0 200 160" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Shield background */}
      <path d="M100 20 L150 40 L150 90 Q150 120 100 145 Q50 120 50 90 L50 40 Z" fill={darkMode ? '#0EA5E9' : '#06B6D4'} opacity="0.1"/>
      <path d="M100 30 L140 47 L140 87 Q140 112 100 133 Q60 112 60 87 L60 47 Z" fill={darkMode ? '#0EA5E9' : '#06B6D4'} opacity="0.15"/>
      {/* User icon */}
      <circle cx="100" cy="65" r="20" fill={darkMode ? '#0EA5E9' : '#06B6D4'} opacity="0.4"/>
      <circle cx="100" cy="60" r="12" fill={darkMode ? '#0EA5E9' : '#06B6D4'} opacity="0.6"/>
      <ellipse cx="100" cy="100" rx="25" ry="18" fill={darkMode ? '#0EA5E9' : '#06B6D4'} opacity="0.4"/>
      {/* Lock icon */}
      <rect x="120" y="95" width="24" height="20" rx="4" fill={darkMode ? '#F59E0B' : '#F59E0B'} opacity="0.8"/>
      <rect x="126" y="88" width="12" height="10" rx="6" fill="none" stroke={darkMode ? '#F59E0B' : '#F59E0B'} strokeWidth="3"/>
      <circle cx="132" cy="105" r="3" fill="white"/>
    </svg>
  ),
  
  alerts: ({ className, darkMode }) => (
    <svg className={className} viewBox="0 0 200 160" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Bell */}
      <path d="M100 25 C70 25 55 50 55 80 L55 100 L45 110 L45 115 L155 115 L155 110 L145 100 L145 80 C145 50 130 25 100 25" fill={darkMode ? '#475569' : '#D1D5DB'}/>
      <circle cx="100" cy="130" r="12" fill={darkMode ? '#475569' : '#D1D5DB'}/>
      <rect x="95" y="15" width="10" height="15" rx="5" fill={darkMode ? '#475569' : '#D1D5DB'}/>
      {/* Notification badge */}
      <circle cx="135" cy="45" r="18" fill={darkMode ? '#EF4444' : '#EF4444'}/>
      <text x="135" y="51" textAnchor="middle" fill="white" fontSize="16" fontWeight="bold">!</text>
      {/* Sound waves */}
      <path d="M160 70 Q175 80 160 90" stroke={darkMode ? '#0EA5E9' : '#06B6D4'} strokeWidth="3" fill="none" opacity="0.5"/>
      <path d="M170 60 Q190 80 170 100" stroke={darkMode ? '#0EA5E9' : '#06B6D4'} strokeWidth="3" fill="none" opacity="0.3"/>
    </svg>
  ),
};

const emptyStateConfig: Record<EmptyStateType, {
  title: string;
  description: string;
  defaultAction: string;
}> = {
  vehicles: {
    title: 'No vehicles in your fleet',
    description: 'Start building your fleet by adding your first vehicle. Track inspections, fuel, and maintenance all in one place.',
    defaultAction: 'Add Your First Vehicle',
  },
  drivers: {
    title: 'No drivers yet',
    description: 'Add drivers to your team so they can complete pre-start inspections and log fuel usage from the mobile app.',
    defaultAction: 'Add Your First Driver',
  },
  inspections: {
    title: 'No inspections recorded',
    description: 'Inspection reports will appear here once your drivers start completing pre-start checks on the mobile app.',
    defaultAction: 'View Vehicles',
  },
  fuel: {
    title: 'No fuel logs yet',
    description: 'Fuel submissions from your drivers will appear here. Track consumption, costs, and identify trends over time.',
    defaultAction: 'View Dashboard',
  },
  reports: {
    title: 'No reports available',
    description: 'Reports will be generated automatically when inspections are completed. Download PDFs or view detailed breakdowns.',
    defaultAction: 'View Inspections',
  },
  users: {
    title: 'No admin users',
    description: 'Add team members to help manage your fleet. Assign roles and control access to different features.',
    defaultAction: 'Add Admin User',
  },
  alerts: {
    title: 'All clear!',
    description: 'No active alerts at the moment. You\'ll be notified here when something needs your attention.',
    defaultAction: 'View Dashboard',
  },
};

const EmptyState: React.FC<EmptyStateProps> = ({ 
  type, 
  onAction, 
  actionLabel,
  title: customTitle,
  description: customDescription 
}) => {
  const { darkMode } = useTheme();
  const config = emptyStateConfig[type];
  const Illustration = illustrations[type];

  const bgColor = darkMode ? 'bg-[#1E293B]/50' : 'bg-gray-50';
  const textPrimary = darkMode ? 'text-gray-100' : 'text-gray-900';
  const textSecondary = darkMode ? 'text-gray-400' : 'text-gray-500';

  return (
    <div className={`${bgColor} rounded-xl p-8 md:p-12 text-center`}>
      {/* Illustration */}
      <div className="flex justify-center mb-6">
        <Illustration className="w-48 h-40" darkMode={darkMode} />
      </div>
      
      {/* Title */}
      <h3 className={`text-xl font-semibold ${textPrimary} mb-3`}>
        {customTitle || config.title}
      </h3>
      
      {/* Description */}
      <p className={`${textSecondary} mb-8 max-w-md mx-auto leading-relaxed`}>
        {customDescription || config.description}
      </p>
      
      {/* Action Button */}
      {onAction && (
        <button
          onClick={onAction}
          className="inline-flex items-center gap-2 bg-[#0A1628] hover:bg-[#132337] text-white px-6 py-3 rounded-lg font-medium transition-all hover:scale-105 active:scale-95"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          {actionLabel || config.defaultAction}
        </button>
      )}
    </div>
  );
};

export default EmptyState;
