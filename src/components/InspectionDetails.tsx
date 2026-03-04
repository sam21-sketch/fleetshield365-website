import React from 'react';
import { useTheme } from '../contexts/ThemeContext';
import SlidePanel from './SlidePanel';
import { 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Calendar,
  User,
  Truck,
  Clock,
  FileText,
  Image
} from 'lucide-react';

interface InspectionItem {
  name: string;
  status: 'pass' | 'fail' | 'na';
  notes?: string;
}

interface Inspection {
  id: string;
  vehicle_name?: string;
  vehicle_rego?: string;
  driver_name?: string;
  inspection_type?: string;
  has_issues?: boolean;
  status?: string;
  created_at?: string;
  odometer?: number;
  items?: InspectionItem[];
  notes?: string;
  photos?: string[];
  signature?: string;
}

interface InspectionDetailsProps {
  isOpen: boolean;
  onClose: () => void;
  inspection: Inspection | null;
}

const InspectionDetails: React.FC<InspectionDetailsProps> = ({ isOpen, onClose, inspection }) => {
  const { darkMode } = useTheme();

  if (!inspection) return null;

  const textPrimary = darkMode ? 'text-gray-100' : 'text-gray-900';
  const textSecondary = darkMode ? 'text-gray-300' : 'text-gray-500';
  const cardBg = darkMode ? 'bg-[#0F172A]' : 'bg-gray-50';
  const borderColor = darkMode ? 'border-[#334155]' : 'border-gray-200';

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pass':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'fail':
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString();
  };

  // Mock checklist items if not provided
  const checklistItems: InspectionItem[] = inspection.items || [
    { name: 'Tyres condition', status: inspection.has_issues ? 'fail' : 'pass' },
    { name: 'Lights & indicators', status: 'pass' },
    { name: 'Brakes', status: 'pass' },
    { name: 'Mirrors', status: 'pass' },
    { name: 'Windscreen & wipers', status: 'pass' },
    { name: 'Fluid levels', status: 'pass' },
    { name: 'Horn', status: 'pass' },
    { name: 'Seat belt', status: 'pass' },
    { name: 'Fire extinguisher', status: inspection.has_issues ? 'fail' : 'pass' },
    { name: 'First aid kit', status: 'pass' },
  ];

  const passCount = checklistItems.filter(i => i.status === 'pass').length;
  const failCount = checklistItems.filter(i => i.status === 'fail').length;

  return (
    <SlidePanel
      isOpen={isOpen}
      onClose={onClose}
      title="Inspection Details"
      subtitle={`${inspection.vehicle_name || 'Vehicle'} - ${formatDate(inspection.created_at)}`}
      width="xl"
    >
      <div className="space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-2 gap-4">
          <div className={`${cardBg} rounded-lg p-4`}>
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${darkMode ? 'bg-[#475569]' : 'bg-white'}`}>
                <Truck className={`w-5 h-5 ${darkMode ? 'text-cyan-400' : 'text-cyan-600'}`} />
              </div>
              <div>
                <p className={`text-sm ${textSecondary}`}>Vehicle</p>
                <p className={`font-medium ${textPrimary}`}>{inspection.vehicle_name || 'N/A'}</p>
                <p className={`text-xs ${textSecondary}`}>{inspection.vehicle_rego || ''}</p>
              </div>
            </div>
          </div>
          <div className={`${cardBg} rounded-lg p-4`}>
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${darkMode ? 'bg-[#475569]' : 'bg-white'}`}>
                <User className={`w-5 h-5 ${darkMode ? 'text-cyan-400' : 'text-cyan-600'}`} />
              </div>
              <div>
                <p className={`text-sm ${textSecondary}`}>Driver</p>
                <p className={`font-medium ${textPrimary}`}>{inspection.driver_name || 'N/A'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Status & Time */}
        <div className={`${cardBg} rounded-lg p-4`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Calendar className={`w-5 h-5 ${textSecondary}`} />
              <div>
                <p className={`text-sm ${textSecondary}`}>Date & Time</p>
                <p className={`font-medium ${textPrimary}`}>{formatDate(inspection.created_at)}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Clock className={`w-5 h-5 ${textSecondary}`} />
              <div>
                <p className={`text-sm ${textSecondary}`}>Type</p>
                <p className={`font-medium ${textPrimary} capitalize`}>{inspection.inspection_type || 'Pre-start'}</p>
              </div>
            </div>
            <div>
              <span className={`px-3 py-1.5 rounded-full text-sm font-medium ${
                inspection.has_issues 
                  ? 'bg-red-100 text-red-700' 
                  : 'bg-green-100 text-green-700'
              }`}>
                {inspection.has_issues ? 'Issues Found' : 'All Clear'}
              </span>
            </div>
          </div>
        </div>

        {/* Odometer */}
        {inspection.odometer && (
          <div className={`${cardBg} rounded-lg p-4`}>
            <p className={`text-sm ${textSecondary} mb-1`}>Odometer Reading</p>
            <p className={`text-2xl font-bold ${textPrimary}`}>
              {inspection.odometer.toLocaleString()} km
            </p>
          </div>
        )}

        {/* Checklist Items */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className={`font-semibold ${textPrimary}`}>Checklist Items</h3>
            <div className="flex items-center gap-4 text-sm">
              <span className="flex items-center gap-1 text-green-600">
                <CheckCircle className="w-4 h-4" /> {passCount} Pass
              </span>
              <span className="flex items-center gap-1 text-red-500">
                <XCircle className="w-4 h-4" /> {failCount} Fail
              </span>
            </div>
          </div>
          <div className={`border ${borderColor} rounded-lg divide-y ${darkMode ? 'divide-[#334155]' : 'divide-gray-100'}`}>
            {checklistItems.map((item, index) => (
              <div key={index} className="flex items-center justify-between px-4 py-3">
                <span className={textPrimary}>{item.name}</span>
                <div className="flex items-center gap-2">
                  {item.notes && (
                    <span className={`text-sm ${textSecondary}`}>{item.notes}</span>
                  )}
                  {getStatusIcon(item.status)}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Notes */}
        {inspection.notes && (
          <div>
            <h3 className={`font-semibold ${textPrimary} mb-2 flex items-center gap-2`}>
              <FileText className="w-4 h-4" /> Driver Notes
            </h3>
            <div className={`${cardBg} rounded-lg p-4`}>
              <p className={textSecondary}>{inspection.notes}</p>
            </div>
          </div>
        )}

        {/* Photos */}
        {inspection.photos && inspection.photos.length > 0 && (
          <div>
            <h3 className={`font-semibold ${textPrimary} mb-2 flex items-center gap-2`}>
              <Image className="w-4 h-4" /> Photos ({inspection.photos.length})
            </h3>
            <div className="grid grid-cols-3 gap-2">
              {inspection.photos.map((photo, index) => (
                <img 
                  key={index}
                  src={photo} 
                  alt={`Inspection photo ${index + 1}`}
                  className="rounded-lg w-full h-24 object-cover"
                />
              ))}
            </div>
          </div>
        )}

        {/* Signature */}
        {inspection.signature && (
          <div>
            <h3 className={`font-semibold ${textPrimary} mb-2`}>Driver Signature</h3>
            <div className={`${cardBg} rounded-lg p-4`}>
              <img 
                src={inspection.signature} 
                alt="Driver signature"
                className="max-h-20 mx-auto"
              />
            </div>
          </div>
        )}
      </div>
    </SlidePanel>
  );
};

export default InspectionDetails;
