import React, { useEffect, useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import SlidePanel from '../components/SlidePanel';
import EmptyState from '../components/EmptyState';
import { showToast } from '../components/Toast';
import { SkeletonTable, SkeletonCard } from '../components/Skeleton';
import { AlertTriangle, MapPin, Phone, User, Car, FileText, Camera, Clock, CheckCircle, XCircle } from 'lucide-react';
import { api } from '../utils/api';

interface OtherParty {
  name: string;
  phone?: string;
  email?: string;
  vehicle_rego?: string;
  insurance_company?: string;
  insurance_policy?: string;
}

interface Witness {
  name?: string;
  phone?: string;
  statement?: string;
}

interface Incident {
  id: string;
  vehicle_id: string;
  vehicle_name: string;
  vehicle_rego: string;
  driver_id: string;
  driver_name: string;
  description: string;
  severity: 'minor' | 'moderate' | 'severe';
  status: 'reported' | 'under_review' | 'resolved' | 'closed';
  location_address?: string;
  gps_latitude?: number;
  gps_longitude?: number;
  other_party: OtherParty;
  witnesses?: Witness[];
  police_report_number?: string;
  injuries_occurred: boolean;
  injury_description?: string;
  damage_photos: string[];
  other_vehicle_photos: string[];
  scene_photos: string[];
  admin_notes?: string;
  insurance_claim_number?: string;
  resolution_details?: string;
  created_at: string;
  updated_at: string;
}

interface IncidentStats {
  total: number;
  this_month: number;
  open_incidents: number;
  by_severity: { minor: number; moderate: number; severe: number };
  by_status: { reported: number; under_review: number; resolved: number; closed: number };
}

const IncidentsPage: React.FC = () => {
  const { darkMode } = useTheme();
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [stats, setStats] = useState<IncidentStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const [showDetailsPanel, setShowDetailsPanel] = useState(false);
  const [filterSeverity, setFilterSeverity] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [updating, setUpdating] = useState(false);
  const [adminNotes, setAdminNotes] = useState<string>('');
  const [savingNotes, setSavingNotes] = useState(false);

  // Theme styles
  const cardBg = darkMode ? 'bg-[#1E293B] border-[#334155]' : 'bg-white border-gray-100';
  const textPrimary = darkMode ? 'text-gray-100' : 'text-gray-900';
  const textSecondary = darkMode ? 'text-gray-300' : 'text-gray-500';
  const inputBg = darkMode ? 'bg-[#0F172A] border-[#334155] text-gray-100' : 'bg-gray-50 border-gray-200 text-gray-900';
  const tableBg = darkMode ? 'bg-[#0F172A]' : 'bg-gray-50';
  const dividerColor = darkMode ? 'divide-[#334155]' : 'divide-gray-100';
  const hoverBg = darkMode ? 'hover:bg-[#334155]/50' : 'hover:bg-gray-50';

  useEffect(() => {
    fetchData();
  }, [filterSeverity, filterStatus]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = { limit: '50' };
      if (filterSeverity) params.severity = filterSeverity;
      if (filterStatus) params.status = filterStatus;
      
      const [incidentsRes, statsRes] = await Promise.all([
        api.get('/incidents', { params }),
        api.get('/incidents/stats/summary')
      ]);
      
      setIncidents(incidentsRes.data || []);
      setStats(statsRes.data || null);
    } catch (error) {
      console.error('Failed to fetch incidents:', error);
      showToast.error('Failed to load incidents');
    } finally {
      setLoading(false);
    }
  };

  const openDetails = (incident: Incident) => {
    setSelectedIncident(incident);
    setAdminNotes(incident.admin_notes || '');
    setShowDetailsPanel(true);
  };

  const saveAdminNotes = async () => {
    if (!selectedIncident) return;
    
    setSavingNotes(true);
    try {
      await api.put(`/incidents/${selectedIncident.id}`, { admin_notes: adminNotes });
      
      // Update local state
      setIncidents(prev => prev.map(inc => 
        inc.id === selectedIncident.id ? { ...inc, admin_notes: adminNotes } : inc
      ));
      setSelectedIncident({ ...selectedIncident, admin_notes: adminNotes });
      
      showToast.success('Notes saved');
    } catch (error) {
      showToast.error('Failed to save notes');
    } finally {
      setSavingNotes(false);
    }
  };

  const updateIncidentStatus = async (incidentId: string, newStatus: string) => {
    setUpdating(true);
    try {
      await api.put(`/incidents/${incidentId}`, { status: newStatus });
      
      // Update local state immediately (optimistic update) - no full refetch
      setIncidents(prev => prev.map(inc => 
        inc.id === incidentId ? { ...inc, status: newStatus as any } : inc
      ));
      
      // Update selected incident if open
      if (selectedIncident && selectedIncident.id === incidentId) {
        setSelectedIncident({ ...selectedIncident, status: newStatus as any });
      }
      
      // Update stats without full reload
      if (stats) {
        const oldStatus = incidents.find(i => i.id === incidentId)?.status;
        if (oldStatus) {
          setStats(prev => prev ? {
            ...prev,
            [`${oldStatus}_count`]: Math.max(0, (prev as any)[`${oldStatus}_count`] - 1),
            [`${newStatus}_count`]: ((prev as any)[`${newStatus}_count`] || 0) + 1,
          } : null);
        }
      }
      
      showToast.success(`Status updated to ${newStatus.replace('_', ' ')}`);
    } catch (error) {
      showToast.error('Failed to update incident');
      // Refetch only on error to restore correct state
      fetchData();
    } finally {
      setUpdating(false);
    }
  };

  const getSeverityBadge = (severity: string) => {
    const badges = {
      minor: darkMode ? 'bg-yellow-500/20 text-yellow-400' : 'bg-yellow-100 text-yellow-700',
      moderate: darkMode ? 'bg-orange-500/20 text-orange-400' : 'bg-orange-100 text-orange-700',
      severe: darkMode ? 'bg-red-500/20 text-red-400' : 'bg-red-100 text-red-700',
    };
    return badges[severity as keyof typeof badges] || badges.moderate;
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      reported: darkMode ? 'bg-red-500/20 text-red-400' : 'bg-red-100 text-red-700',
      under_review: darkMode ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-100 text-blue-700',
      resolved: darkMode ? 'bg-green-500/20 text-green-400' : 'bg-green-100 text-green-700',
      closed: darkMode ? 'bg-gray-500/20 text-gray-400' : 'bg-gray-100 text-gray-600',
    };
    return badges[status as keyof typeof badges] || badges.reported;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-AU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <div className={`h-8 w-48 rounded ${darkMode ? 'bg-[#334155]' : 'bg-gray-200'} animate-pulse mb-2`}></div>
          <div className={`h-4 w-64 rounded ${darkMode ? 'bg-[#334155]' : 'bg-gray-200'} animate-pulse`}></div>
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
        <h1 className={`text-2xl font-bold ${textPrimary}`}>Incident Reports</h1>
        <p className={textSecondary}>View and manage incident reports from your fleet</p>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className={`${cardBg} border rounded-xl p-5 shadow-sm`}>
            <div className={`${textSecondary} text-sm`}>Total Incidents</div>
            <div className={`text-2xl font-bold ${textPrimary}`}>{stats.total}</div>
          </div>
          <div className={`${cardBg} border rounded-xl p-5 shadow-sm`}>
            <div className={`${textSecondary} text-sm`}>This Month</div>
            <div className={`text-2xl font-bold ${textPrimary}`}>{stats.this_month}</div>
          </div>
          <div className={`${cardBg} border rounded-xl p-5 shadow-sm`}>
            <div className={`${textSecondary} text-sm`}>Open Incidents</div>
            <div className={`text-2xl font-bold ${stats.open_incidents > 0 ? 'text-red-500' : textPrimary}`}>{stats.open_incidents}</div>
          </div>
          <div className={`${cardBg} border rounded-xl p-5 shadow-sm`}>
            <div className={`${textSecondary} text-sm`}>Severe</div>
            <div className={`text-2xl font-bold text-red-500`}>{stats.by_severity.severe}</div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className={`${cardBg} border rounded-xl p-4 shadow-sm`}>
        <div className="flex flex-wrap items-center gap-4">
          <div>
            <label className={`block ${textSecondary} text-sm mb-1`}>Severity</label>
            <select
              value={filterSeverity}
              onChange={(e) => setFilterSeverity(e.target.value)}
              className={`${inputBg} border rounded-lg px-3 py-2 text-sm min-w-[150px] focus:ring-2 focus:ring-cyan-500 outline-none`}
            >
              <option value="">All Severities</option>
              <option value="minor">Minor</option>
              <option value="moderate">Moderate</option>
              <option value="severe">Severe</option>
            </select>
          </div>
          <div>
            <label className={`block ${textSecondary} text-sm mb-1`}>Status</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className={`${inputBg} border rounded-lg px-3 py-2 text-sm min-w-[150px] focus:ring-2 focus:ring-cyan-500 outline-none`}
            >
              <option value="">All Statuses</option>
              <option value="reported">Reported</option>
              <option value="under_review">Under Review</option>
              <option value="resolved">Resolved</option>
              <option value="closed">Closed</option>
            </select>
          </div>
        </div>
      </div>

      {/* Incidents Table */}
      <div className={`${cardBg} border rounded-xl overflow-hidden shadow-sm`}>
        <table className="w-full">
          <thead className={tableBg}>
            <tr>
              <th className={`text-left ${textSecondary} font-medium px-6 py-4`}>Date</th>
              <th className={`text-left ${textSecondary} font-medium px-6 py-4`}>Vehicle</th>
              <th className={`text-left ${textSecondary} font-medium px-6 py-4`}>Driver</th>
              <th className={`text-left ${textSecondary} font-medium px-6 py-4`}>Severity</th>
              <th className={`text-left ${textSecondary} font-medium px-6 py-4`}>Status</th>
              <th className={`text-left ${textSecondary} font-medium px-6 py-4`}>Actions</th>
            </tr>
          </thead>
          <tbody className={dividerColor}>
            {incidents.map((incident) => (
              <tr key={incident.id} className={hoverBg}>
                <td className={`px-6 py-4 ${textPrimary}`}>{formatDate(incident.created_at)}</td>
                <td className={`px-6 py-4`}>
                  <div className={textPrimary}>{incident.vehicle_name}</div>
                  <div className={`text-sm ${textSecondary}`}>{incident.vehicle_rego}</div>
                </td>
                <td className={`px-6 py-4 ${textPrimary}`}>{incident.driver_name}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded text-xs font-medium uppercase ${getSeverityBadge(incident.severity)}`}>
                    {incident.severity}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusBadge(incident.status)}`}>
                    {incident.status.replace('_', ' ')}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <button
                    onClick={() => openDetails(incident)}
                    className={`font-medium text-sm ${darkMode ? 'text-cyan-400 hover:text-cyan-300' : 'text-cyan-600 hover:text-cyan-700'}`}
                  >
                    View Details
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {incidents.length === 0 && (
          <EmptyState 
            type="alerts" 
            title="No incidents reported"
            description="Incident reports from drivers will appear here. This is good news - your fleet is running safely!"
          />
        )}
      </div>

      {/* Incident Details Panel */}
      <SlidePanel
        isOpen={showDetailsPanel}
        onClose={() => setShowDetailsPanel(false)}
        title="Incident Details"
        subtitle={selectedIncident ? `${selectedIncident.vehicle_name} - ${formatDate(selectedIncident.created_at)}` : ''}
        width="xl"
      >
        {selectedIncident && (
          <div className="space-y-6">
            {/* Emergency Warning */}
            {selectedIncident.injuries_occurred && (
              <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-4">
                <div className="flex items-center gap-2 text-red-500 font-semibold">
                  <AlertTriangle className="w-5 h-5" />
                  INJURIES REPORTED
                </div>
                <p className={`mt-2 ${textPrimary}`}>{selectedIncident.injury_description || 'No details provided'}</p>
              </div>
            )}

            {/* Status & Severity */}
            <div className="flex items-center gap-4">
              <span className={`px-3 py-1.5 rounded text-sm font-medium uppercase ${getSeverityBadge(selectedIncident.severity)}`}>
                {selectedIncident.severity}
              </span>
              <span className={`px-3 py-1.5 rounded text-sm font-medium ${getStatusBadge(selectedIncident.status)}`}>
                {selectedIncident.status.replace('_', ' ')}
              </span>
            </div>

            {/* Quick Actions */}
            <div className={`${darkMode ? 'bg-[#0F172A]' : 'bg-gray-50'} rounded-lg p-4`}>
              <h3 className={`${textPrimary} font-medium mb-3`}>Update Status</h3>
              <div className="flex flex-wrap gap-2">
                {['reported', 'under_review', 'resolved', 'closed'].map((status) => (
                  <button
                    key={status}
                    onClick={() => updateIncidentStatus(selectedIncident.id, status)}
                    disabled={updating || selectedIncident.status === status}
                    className={`px-3 py-1.5 rounded text-sm font-medium transition ${
                      selectedIncident.status === status
                        ? darkMode ? 'bg-cyan-500/20 text-cyan-400' : 'bg-cyan-100 text-cyan-700'
                        : darkMode ? 'bg-[#334155] hover:bg-[#475569] text-gray-300' : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                    } disabled:opacity-50`}
                  >
                    {status.replace('_', ' ')}
                  </button>
                ))}
              </div>
            </div>

            {/* Admin Notes */}
            <div className={`${darkMode ? 'bg-[#0F172A]' : 'bg-gray-50'} rounded-lg p-4`}>
              <h3 className={`${textPrimary} font-medium mb-3`}>Admin Notes</h3>
              <textarea
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder="Add internal notes about this incident..."
                rows={3}
                className={`w-full ${inputBg} border rounded-lg px-4 py-3 focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none transition resize-none`}
              />
              <div className="flex justify-end mt-2">
                <button
                  onClick={saveAdminNotes}
                  disabled={savingNotes || adminNotes === (selectedIncident.admin_notes || '')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                    adminNotes !== (selectedIncident.admin_notes || '')
                      ? 'bg-cyan-500 hover:bg-cyan-600 text-white'
                      : darkMode ? 'bg-[#334155] text-gray-500' : 'bg-gray-200 text-gray-400'
                  } disabled:opacity-50`}
                >
                  {savingNotes ? 'Saving...' : 'Save Notes'}
                </button>
              </div>
            </div>

            {/* Vehicle & Driver Info */}
            <div className="grid grid-cols-2 gap-4">
              <div className={`${darkMode ? 'bg-[#0F172A]' : 'bg-gray-50'} rounded-lg p-4`}>
                <div className="flex items-center gap-2 mb-2">
                  <Car className={`w-4 h-4 ${textSecondary}`} />
                  <span className={textSecondary}>Vehicle</span>
                </div>
                <p className={`${textPrimary} font-medium`}>{selectedIncident.vehicle_name}</p>
                <p className={textSecondary}>{selectedIncident.vehicle_rego}</p>
              </div>
              <div className={`${darkMode ? 'bg-[#0F172A]' : 'bg-gray-50'} rounded-lg p-4`}>
                <div className="flex items-center gap-2 mb-2">
                  <User className={`w-4 h-4 ${textSecondary}`} />
                  <span className={textSecondary}>Driver</span>
                </div>
                <p className={`${textPrimary} font-medium`}>{selectedIncident.driver_name}</p>
              </div>
            </div>

            {/* Location */}
            {(selectedIncident.location_address || selectedIncident.gps_latitude) && (
              <div className={`${darkMode ? 'bg-[#0F172A]' : 'bg-gray-50'} rounded-lg p-4`}>
                <div className="flex items-center gap-2 mb-2">
                  <MapPin className={`w-4 h-4 ${textSecondary}`} />
                  <span className={textSecondary}>Location</span>
                </div>
                <p className={textPrimary}>{selectedIncident.location_address || `${selectedIncident.gps_latitude}, ${selectedIncident.gps_longitude}`}</p>
                {selectedIncident.gps_latitude && (
                  <a 
                    href={`https://www.google.com/maps?q=${selectedIncident.gps_latitude},${selectedIncident.gps_longitude}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`text-sm ${darkMode ? 'text-cyan-400' : 'text-cyan-600'} hover:underline mt-1 inline-block`}
                  >
                    View on Map →
                  </a>
                )}
              </div>
            )}

            {/* Description */}
            <div>
              <h3 className={`${textPrimary} font-medium mb-2 flex items-center gap-2`}>
                <FileText className="w-4 h-4" />
                Description
              </h3>
              <p className={`${darkMode ? 'bg-[#0F172A]' : 'bg-gray-50'} rounded-lg p-4 ${textPrimary}`}>
                {selectedIncident.description}
              </p>
            </div>

            {/* Other Party Details */}
            <div>
              <h3 className={`${textPrimary} font-medium mb-2`}>Other Party Details</h3>
              <div className={`${darkMode ? 'bg-[#0F172A]' : 'bg-gray-50'} rounded-lg p-4 space-y-2`}>
                <p className={textPrimary}><strong>Name:</strong> {selectedIncident.other_party.name}</p>
                <p className={textPrimary}><strong>Phone:</strong> {selectedIncident.other_party.phone || 'N/A'}</p>
                <p className={textPrimary}><strong>Vehicle Rego:</strong> {selectedIncident.other_party.vehicle_rego || 'N/A'}</p>
                {selectedIncident.other_party.insurance_company && (
                  <p className={textPrimary}><strong>Insurance:</strong> {selectedIncident.other_party.insurance_company}</p>
                )}
              </div>
            </div>

            {/* Police Report */}
            {selectedIncident.police_report_number && (
              <div className={`${darkMode ? 'bg-[#0F172A]' : 'bg-gray-50'} rounded-lg p-4`}>
                <p className={textPrimary}><strong>Police Report #:</strong> {selectedIncident.police_report_number}</p>
              </div>
            )}

            {/* Witnesses */}
            {selectedIncident.witnesses && selectedIncident.witnesses.length > 0 && (
              <div>
                <h3 className={`${textPrimary} font-medium mb-2`}>Witnesses</h3>
                <div className="space-y-2">
                  {selectedIncident.witnesses.map((witness, index) => (
                    <div key={index} className={`${darkMode ? 'bg-[#0F172A]' : 'bg-gray-50'} rounded-lg p-4`}>
                      <p className={textPrimary}><strong>Name:</strong> {witness.name || 'N/A'}</p>
                      <p className={textPrimary}><strong>Phone:</strong> {witness.phone || 'N/A'}</p>
                      {witness.statement && <p className={textSecondary}>{witness.statement}</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Photos */}
            {(selectedIncident.damage_photos?.length > 0 || selectedIncident.other_vehicle_photos?.length > 0 || selectedIncident.scene_photos?.length > 0) && (
              <div>
                <h3 className={`${textPrimary} font-medium mb-2 flex items-center gap-2`}>
                  <Camera className="w-4 h-4" />
                  Photos ({(selectedIncident.damage_photos?.length || 0) + (selectedIncident.other_vehicle_photos?.length || 0) + (selectedIncident.scene_photos?.length || 0)})
                </h3>
                <div className="grid grid-cols-3 gap-2">
                  {selectedIncident.damage_photos?.map((photo, index) => (
                    <img key={`damage-${index}`} src={photo} alt={`Damage ${index + 1}`} className="rounded-lg w-full h-24 object-cover cursor-pointer hover:opacity-80" onClick={() => window.open(photo, '_blank')} />
                  ))}
                  {selectedIncident.other_vehicle_photos?.map((photo, index) => (
                    <img key={`other-${index}`} src={photo} alt={`Other vehicle ${index + 1}`} className="rounded-lg w-full h-24 object-cover cursor-pointer hover:opacity-80" onClick={() => window.open(photo, '_blank')} />
                  ))}
                  {selectedIncident.scene_photos?.map((photo, index) => (
                    <img key={`scene-${index}`} src={photo} alt={`Scene ${index + 1}`} className="rounded-lg w-full h-24 object-cover cursor-pointer hover:opacity-80" onClick={() => window.open(photo, '_blank')} />
                  ))}
                </div>
              </div>
            )}

            {/* Admin Notes */}
            {selectedIncident.admin_notes && (
              <div>
                <h3 className={`${textPrimary} font-medium mb-2`}>Admin Notes</h3>
                <p className={`${darkMode ? 'bg-[#0F172A]' : 'bg-gray-50'} rounded-lg p-4 ${textPrimary}`}>
                  {selectedIncident.admin_notes}
                </p>
              </div>
            )}

            {/* Timestamps */}
            <div className={`${darkMode ? 'bg-[#0F172A]' : 'bg-gray-50'} rounded-lg p-4 flex items-center gap-4`}>
              <Clock className={`w-4 h-4 ${textSecondary}`} />
              <div>
                <p className={textSecondary}>Reported: {formatDate(selectedIncident.created_at)}</p>
                <p className={textSecondary}>Updated: {formatDate(selectedIncident.updated_at)}</p>
              </div>
            </div>
          </div>
        )}
      </SlidePanel>
    </div>
  );
};

export default IncidentsPage;
