import React from 'react';
import { useTheme } from '../contexts/ThemeContext';

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular' | 'rounded';
  width?: string | number;
  height?: string | number;
  animation?: 'pulse' | 'wave' | 'none';
  style?: React.CSSProperties;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className = '',
  variant = 'rectangular',
  width,
  height,
  animation = 'pulse',
  style: customStyle,
}) => {
  const { darkMode } = useTheme();
  
  const baseClasses = darkMode ? 'bg-[#334155]' : 'bg-gray-200';
  
  const variantClasses = {
    text: 'rounded',
    circular: 'rounded-full',
    rectangular: '',
    rounded: 'rounded-lg',
  };

  const animationClasses = {
    pulse: 'animate-pulse',
    wave: 'animate-shimmer',
    none: '',
  };

  const style: React.CSSProperties = {
    width: width,
    height: height,
    ...customStyle,
  };

  return (
    <div
      className={`${baseClasses} ${variantClasses[variant]} ${animationClasses[animation]} ${className}`}
      style={style}
    />
  );
};

// Pre-built skeleton patterns
export const SkeletonCard: React.FC<{ className?: string }> = ({ className = '' }) => {
  const { darkMode } = useTheme();
  const cardBg = darkMode ? 'bg-[#1E293B] border-[#334155]' : 'bg-white border-gray-100';
  
  return (
    <div className={`${cardBg} border rounded-xl p-5 ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <Skeleton variant="rounded" className="w-10 h-10" />
        <Skeleton variant="rounded" className="w-4 h-4" />
      </div>
      <Skeleton variant="text" className="h-8 w-16 mb-2" />
      <Skeleton variant="text" className="h-4 w-24" />
    </div>
  );
};

export const SkeletonChart: React.FC<{ className?: string }> = ({ className = '' }) => {
  const { darkMode } = useTheme();
  const cardBg = darkMode ? 'bg-[#1E293B] border-[#334155]' : 'bg-white border-gray-100';
  const barBg = darkMode ? 'bg-[#475569]' : 'bg-gray-300';
  
  return (
    <div className={`${cardBg} border rounded-xl p-5 ${className}`}>
      <Skeleton variant="text" className="h-6 w-40 mb-4" />
      <div className="h-64 flex items-end gap-2 pt-4">
        <div className={`flex-1 h-[40%] rounded-lg animate-pulse ${barBg}`}></div>
        <div className={`flex-1 h-[65%] rounded-lg animate-pulse ${barBg}`}></div>
        <div className={`flex-1 h-[45%] rounded-lg animate-pulse ${barBg}`}></div>
        <div className={`flex-1 h-[80%] rounded-lg animate-pulse ${barBg}`}></div>
        <div className={`flex-1 h-[55%] rounded-lg animate-pulse ${barBg}`}></div>
        <div className={`flex-1 h-[70%] rounded-lg animate-pulse ${barBg}`}></div>
        <div className={`flex-1 h-[50%] rounded-lg animate-pulse ${barBg}`}></div>
      </div>
    </div>
  );
};

export const SkeletonTableRow: React.FC<{ columns?: number }> = ({ columns = 5 }) => {
  return (
    <tr>
      {Array.from({ length: columns }).map((_, i) => (
        <td key={i} className="px-6 py-4">
          <Skeleton variant="text" className="h-4 w-full max-w-[120px]" />
        </td>
      ))}
    </tr>
  );
};

export const SkeletonTable: React.FC<{ rows?: number; columns?: number; className?: string }> = ({ 
  rows = 5, 
  columns = 5,
  className = ''
}) => {
  const { darkMode } = useTheme();
  const cardBg = darkMode ? 'bg-[#1E293B] border-[#334155]' : 'bg-white border-gray-100';
  const tableBg = darkMode ? 'bg-[#0F172A]' : 'bg-gray-50';
  
  return (
    <div className={`${cardBg} border rounded-xl overflow-hidden ${className}`}>
      <table className="w-full">
        <thead className={tableBg}>
          <tr>
            {Array.from({ length: columns }).map((_, i) => (
              <th key={i} className="px-6 py-4 text-left">
                <Skeleton variant="text" className="h-4 w-20" />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }).map((_, i) => (
            <SkeletonTableRow key={i} columns={columns} />
          ))}
        </tbody>
      </table>
    </div>
  );
};

// Dashboard skeleton
export const DashboardSkeleton: React.FC = () => {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <Skeleton variant="text" className="h-8 w-32 mb-2" />
          <Skeleton variant="text" className="h-4 w-48" />
        </div>
        <div className="flex gap-2">
          <Skeleton variant="rounded" className="h-10 w-28" />
          <Skeleton variant="rounded" className="h-10 w-28" />
        </div>
      </div>
      
      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
      
      {/* Charts */}
      <div className="grid lg:grid-cols-2 gap-6">
        <SkeletonChart />
        <SkeletonChart />
      </div>
    </div>
  );
};

export default Skeleton;
