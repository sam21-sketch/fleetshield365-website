import React, { useEffect, useState, useRef } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import SlidePanel from '../components/SlidePanel';
import EmptyState from '../components/EmptyState';
import { showToast } from '../components/Toast';
import { SkeletonTable, SkeletonCard } from '../components/Skeleton';
import { AlertTriangle, MapPin, User, Car, FileText, Camera, Clock, Download, Edit3, Plus, X, Calendar, Filter } from 'lucide-react';
import { api, incidentAPI } from '../utils/api';
import { downloadFile, downloadCsv } from '../utils/mobileDownload';
import { formatDateTimeAU } from '../utils/dateUtils';

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

interface PdfAttachment {
  name: string;
  data: string;
  uploaded_at?: string;
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
  pdf_attachments?: PdfAttachment[];
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
  const [stats, setStats] = useState<IncidentStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const [showDetailsPanel, setShowDetailsPanel] = useState(false);
  const [filterSeverity, setFilterSeverity] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [updating, setUpdating] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  
  // Edit mode states
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    description: '',
    severity: '',
    location_address: '',
    police_report_number: '',
    admin_notes: '',
    insurance_claim_number: '',
    resolution_details: '',
  });
  const [newPhotos, setNewPhotos] = useState<string[]>([]);
  const [newPdfs, setNewPdfs] = useState<{name: string; data: string}[]>([]);
  const [saving, setSaving] = useState(false);
  
  // Export filter states
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportDateFrom, setExportDateFrom] = useState('');
  const [exportDateTo, setExportDateTo] = useState('');
  
  const photoInputRef = useRef<HTMLInputElement>(null);
  const pdfInputRef = useRef<HTMLInputElement>(null);

  // Theme styles
  const cardBg = darkMode ? 'bg-[#1E293B] border-[#334155]' : 'bg-white border-gray-100';
  const textPrimary = darkMode ? 'text-gray-100' : 'text-gray-900';
  const textSecondary = darkMode ? 'text-gray-300' : 'text-gray-500';
  const inputBg = darkMode ? 'bg-[#0F172A] border-[#334155] text-gray-100' : 'bg-gray-50 border-gray-200 text-gray-900';
  const tableBg = darkMode ? 'bg-[#0F172A]' : 'bg-gray-50';
  const dividerColor = darkMode ? 'divide-[#334155]' : 'divide-gray-100';
  const hoverBg = darkMode ? 'hover:bg-[#334155]/50' : 'hover:bg-gray-50';
  const sectionBg = darkMode ? 'bg-[#0F172A]' : 'bg-gray-50';

  // Store all incidents and filter client-side for instant response
  const [allIncidents, setAllIncidents] = useState<Incident[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  // Filter incidents client-side - instant, no API call
  const filteredIncidents = allIncidents.filter(incident => {
    if (filterSeverity && incident.severity !== filterSeverity) return false;
    if (filterStatus && incident.status !== filterStatus) return false;
    return true;
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch ALL incidents once (no filter params)
      const [incidentsRes, statsRes] = await Promise.all([
        api.get('/incidents', { params: { limit: '100' } }),
        api.get('/incidents/stats/summary')
      ]);
      
      setAllIncidents(incidentsRes.data || []);
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
    setIsEditing(false);
    setNewPhotos([]);
    setNewPdfs([]);
    setEditForm({
      description: incident.description || '',
      severity: incident.severity || '',
      location_address: incident.location_address || '',
      police_report_number: incident.police_report_number || '',
      admin_notes: incident.admin_notes || '',
      insurance_claim_number: incident.insurance_claim_number || '',
      resolution_details: incident.resolution_details || '',
    });
    setShowDetailsPanel(true);
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    
    Array.from(files).forEach(file => {
      if (file.size > 5 * 1024 * 1024) {
        showToast.error('Photo too large. Max 5MB.');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewPhotos(prev => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
    e.target.value = '';
  };

  const handlePdfUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    
    Array.from(files).forEach(file => {
      if (file.size > 10 * 1024 * 1024) {
        showToast.error('PDF too large. Max 10MB.');
        return;
      }
      if (!file.name.toLowerCase().endsWith('.pdf')) {
        showToast.error('Only PDF files allowed.');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewPdfs(prev => [...prev, { name: file.name, data: reader.result as string }]);
      };
      reader.readAsDataURL(file);
    });
    e.target.value = '';
  };

  const saveIncidentChanges = async () => {
    if (!selectedIncident) return;
    
    setSaving(true);
    try {
      const updateData: any = {};
      
      // Only include changed fields
      if (editForm.description !== selectedIncident.description) updateData.description = editForm.description;
      if (editForm.severity !== selectedIncident.severity) updateData.severity = editForm.severity;
      if (editForm.location_address !== (selectedIncident.location_address || '')) updateData.location_address = editForm.location_address;
      if (editForm.police_report_number !== (selectedIncident.police_report_number || '')) updateData.police_report_number = editForm.police_report_number;
      if (editForm.admin_notes !== (selectedIncident.admin_notes || '')) updateData.admin_notes = editForm.admin_notes;
      if (editForm.insurance_claim_number !== (selectedIncident.insurance_claim_number || '')) updateData.insurance_claim_number = editForm.insurance_claim_number;
      if (editForm.resolution_details !== (selectedIncident.resolution_details || '')) updateData.resolution_details = editForm.resolution_details;
      
      // Add new photos
      if (newPhotos.length > 0) {
        updateData.additional_photos = newPhotos;
      }
      
      // Add new PDFs
      if (newPdfs.length > 0) {
        updateData.pdf_attachments = newPdfs;
      }
      
      if (Object.keys(updateData).length === 0) {
        showToast.info('No changes to save');
        setIsEditing(false);
        return;
      }
      
      const response = await api.put(`/incidents/${selectedIncident.id}`, updateData);
      
      // Update local state with returned data
      const updatedIncident = response.data;
      setAllIncidents(prev => prev.map(inc => 
        inc.id === selectedIncident.id ? { ...inc, ...updatedIncident } : inc
      ));
      setSelectedIncident({ ...selectedIncident, ...updatedIncident });
      
      setIsEditing(false);
      setNewPhotos([]);
      setNewPdfs([]);
      showToast.success('Incident updated successfully');
    } catch (error) {
      showToast.error('Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

  const updateIncidentStatus = async (incidentId: string, newStatus: string) => {
    setUpdating(true);
    try {
      await api.put(`/incidents/${incidentId}`, { status: newStatus });
      
      setAllIncidents(prev => prev.map(inc => 
        inc.id === incidentId ? { ...inc, status: newStatus as any } : inc
      ));
      
      if (selectedIncident && selectedIncident.id === incidentId) {
        setSelectedIncident({ ...selectedIncident, status: newStatus as any });
      }
      
      showToast.success(`Status updated to ${newStatus.replace('_', ' ')}`);
    } catch (error) {
      showToast.error('Failed to update incident');
      fetchData();
    } finally {
      setUpdating(false);
    }
  };

  const handleExport = async () => {
    try {
      const params: any = {};
      if (filterSeverity) params.severity = filterSeverity;
      if (filterStatus) params.status = filterStatus;
      if (exportDateFrom) params.date_from = exportDateFrom;
      if (exportDateTo) params.date_to = exportDateTo;
      
      const response = await incidentAPI.exportCsv(params);
      downloadCsv(response.data, `incidents_${new Date().toISOString().split('T')[0]}.csv`);
      setShowExportModal(false);
      showToast.success('Export downloaded');
    } catch (error) {
      showToast.error('Failed to export incidents');
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
    return formatDateTimeAU(dateString);
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
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-4">
            <div>
              <label className={`block ${textSecondary} text-sm mb-1`}>Severity</label>
              <select
                value={filterSeverity}
                onChange={(e) => setFilterSeverity(e.target.value)}
                className={`${inputBg} border rounded-lg px-3 py-2 text-sm min-w-[140px] focus:ring-2 focus:ring-cyan-500 outline-none`}
                data-testid="severity-filter"
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
                className={`${inputBg} border rounded-lg px-3 py-2 text-sm min-w-[140px] focus:ring-2 focus:ring-cyan-500 outline-none`}
                data-testid="status-filter"
              >
                <option value="">All Statuses</option>
                <option value="reported">Reported</option>
                <option value="under_review">Under Review</option>
                <option value="resolved">Resolved</option>
                <option value="closed">Closed</option>
              </select>
            </div>
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
              <h3 className={`text-lg font-semibold ${textPrimary}`}>Export Incidents</h3>
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
                Current filters (Severity: {filterSeverity || 'All'}, Status: {filterStatus || 'All'}) will also be applied.
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

      {/* Incidents Table */}
      <div className={`${cardBg} border rounded-xl overflow-hidden shadow-sm`}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px]">
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
            {filteredIncidents.map((incident) => (
              <tr key={incident.id} className={hoverBg} data-testid={`incident-row-${incident.id}`}>
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
                    data-testid={`view-btn-${incident.id}`}
                  >
                    View Details
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>

        {filteredIncidents.length === 0 && (
          <EmptyState 
            type="alerts" 
            title="No incidents found"
            description={filterSeverity || filterStatus ? "No incidents match the selected filters." : "Incident reports from drivers will appear here."}
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
            {/* Hidden file inputs */}
            <input ref={photoInputRef} type="file" accept="image/*" multiple onChange={handlePhotoUpload} className="hidden" />
            <input ref={pdfInputRef} type="file" accept=".pdf" multiple onChange={handlePdfUpload} className="hidden" />
            
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

            {/* Edit Toggle & Status */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className={`px-3 py-1.5 rounded text-sm font-medium uppercase ${getSeverityBadge(selectedIncident.severity)}`}>
                  {selectedIncident.severity}
                </span>
                <span className={`px-3 py-1.5 rounded text-sm font-medium ${getStatusBadge(selectedIncident.status)}`}>
                  {selectedIncident.status.replace('_', ' ')}
                </span>
              </div>
              <button
                onClick={() => setIsEditing(!isEditing)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                  isEditing 
                    ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30' 
                    : darkMode ? 'bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30' : 'bg-cyan-100 text-cyan-700 hover:bg-cyan-200'
                }`}
              >
                <Edit3 className="w-4 h-4" />
                {isEditing ? 'Cancel Edit' : 'Edit Report'}
              </button>
            </div>

            {/* Quick Status Update */}
            <div className={`${sectionBg} rounded-lg p-4`}>
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

            {/* Description - Editable */}
            <div>
              <h3 className={`${textPrimary} font-medium mb-2 flex items-center gap-2`}>
                <FileText className="w-4 h-4" />
                Description
              </h3>
              {isEditing ? (
                <textarea
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  rows={4}
                  className={`w-full ${inputBg} border rounded-lg px-4 py-3 focus:ring-2 focus:ring-cyan-500 outline-none resize-none`}
                />
              ) : (
                <p className={`${sectionBg} rounded-lg p-4 ${textPrimary}`}>
                  {selectedIncident.description}
                </p>
              )}
            </div>

            {/* Severity - Editable */}
            {isEditing && (
              <div>
                <h3 className={`${textPrimary} font-medium mb-2`}>Severity</h3>
                <div className="flex gap-2">
                  {['minor', 'moderate', 'severe'].map((sev) => (
                    <button
                      key={sev}
                      onClick={() => setEditForm({ ...editForm, severity: sev })}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                        editForm.severity === sev
                          ? getSeverityBadge(sev)
                          : darkMode ? 'bg-[#334155] text-gray-300' : 'bg-gray-200 text-gray-700'
                      }`}
                    >
                      {sev.charAt(0).toUpperCase() + sev.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Vehicle & Driver Info */}
            <div className="grid grid-cols-2 gap-4">
              <div className={`${sectionBg} rounded-lg p-4`}>
                <div className="flex items-center gap-2 mb-2">
                  <Car className={`w-4 h-4 ${textSecondary}`} />
                  <span className={textSecondary}>Vehicle</span>
                </div>
                <p className={`${textPrimary} font-medium`}>{selectedIncident.vehicle_name}</p>
                <p className={textSecondary}>{selectedIncident.vehicle_rego}</p>
              </div>
              <div className={`${sectionBg} rounded-lg p-4`}>
                <div className="flex items-center gap-2 mb-2">
                  <User className={`w-4 h-4 ${textSecondary}`} />
                  <span className={textSecondary}>Driver</span>
                </div>
                <p className={`${textPrimary} font-medium`}>{selectedIncident.driver_name}</p>
              </div>
            </div>

            {/* Location - Editable */}
            <div className={`${sectionBg} rounded-lg p-4`}>
              <div className="flex items-center gap-2 mb-2">
                <MapPin className={`w-4 h-4 ${textSecondary}`} />
                <span className={textSecondary}>Location</span>
              </div>
              {isEditing ? (
                <input
                  type="text"
                  value={editForm.location_address}
                  onChange={(e) => setEditForm({ ...editForm, location_address: e.target.value })}
                  placeholder="Enter address..."
                  className={`w-full ${inputBg} border rounded-lg px-3 py-2 text-sm`}
                />
              ) : (
                <>
                  <p className={textPrimary}>{selectedIncident.location_address || `${selectedIncident.gps_latitude || 'N/A'}, ${selectedIncident.gps_longitude || ''}`}</p>
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
                </>
              )}
            </div>

            {/* Police Report & Insurance - Editable */}
            <div className="grid grid-cols-2 gap-4">
              <div className={`${sectionBg} rounded-lg p-4`}>
                <label className={`block ${textSecondary} text-sm mb-1`}>Police Report #</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={editForm.police_report_number}
                    onChange={(e) => setEditForm({ ...editForm, police_report_number: e.target.value })}
                    className={`w-full ${inputBg} border rounded-lg px-3 py-2 text-sm`}
                  />
                ) : (
                  <p className={textPrimary}>{selectedIncident.police_report_number || 'N/A'}</p>
                )}
              </div>
              <div className={`${sectionBg} rounded-lg p-4`}>
                <label className={`block ${textSecondary} text-sm mb-1`}>Insurance Claim #</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={editForm.insurance_claim_number}
                    onChange={(e) => setEditForm({ ...editForm, insurance_claim_number: e.target.value })}
                    className={`w-full ${inputBg} border rounded-lg px-3 py-2 text-sm`}
                  />
                ) : (
                  <p className={textPrimary}>{selectedIncident.insurance_claim_number || 'N/A'}</p>
                )}
              </div>
            </div>

            {/* Other Party Details */}
            <div>
              <h3 className={`${textPrimary} font-medium mb-2`}>Other Party Details</h3>
              <div className={`${sectionBg} rounded-lg p-4 space-y-2`}>
                <p className={textPrimary}><strong>Name:</strong> {selectedIncident.other_party?.name || 'N/A'}</p>
                <p className={textPrimary}><strong>Phone:</strong> {selectedIncident.other_party?.phone || 'N/A'}</p>
                <p className={textPrimary}><strong>Vehicle Rego:</strong> {selectedIncident.other_party?.vehicle_rego || 'N/A'}</p>
                {selectedIncident.other_party?.insurance_company && (
                  <p className={textPrimary}><strong>Insurance:</strong> {selectedIncident.other_party.insurance_company}</p>
                )}
              </div>
            </div>

            {/* Photos Section */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className={`${textPrimary} font-medium flex items-center gap-2`}>
                  <Camera className="w-4 h-4" />
                  Photos ({(selectedIncident.damage_photos?.length || 0) + (selectedIncident.other_vehicle_photos?.length || 0) + (selectedIncident.scene_photos?.length || 0) + newPhotos.length})
                </h3>
                {isEditing && (
                  <button
                    onClick={() => photoInputRef.current?.click()}
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm ${darkMode ? 'bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30' : 'bg-cyan-100 text-cyan-700 hover:bg-cyan-200'}`}
                  >
                    <Plus className="w-4 h-4" />
                    Add Photos
                  </button>
                )}
              </div>
              <div className="grid grid-cols-4 gap-2">
                {selectedIncident.damage_photos?.map((photo, index) => (
                  <img key={`damage-${index}`} src={photo} alt={`Damage ${index + 1}`} className="rounded-lg w-full h-20 object-cover cursor-pointer hover:opacity-80" onClick={() => window.open(photo, '_blank')} />
                ))}
                {selectedIncident.other_vehicle_photos?.map((photo, index) => (
                  <img key={`other-${index}`} src={photo} alt={`Other ${index + 1}`} className="rounded-lg w-full h-20 object-cover cursor-pointer hover:opacity-80" onClick={() => window.open(photo, '_blank')} />
                ))}
                {selectedIncident.scene_photos?.map((photo, index) => (
                  <img key={`scene-${index}`} src={photo} alt={`Scene ${index + 1}`} className="rounded-lg w-full h-20 object-cover cursor-pointer hover:opacity-80" onClick={() => window.open(photo, '_blank')} />
                ))}
                {/* New photos being added */}
                {newPhotos.map((photo, index) => (
                  <div key={`new-${index}`} className="relative group">
                    <img src={photo} alt={`New ${index + 1}`} className="rounded-lg w-full h-20 object-cover border-2 border-cyan-500" />
                    <span className="absolute top-1 left-1 bg-cyan-500 text-white text-xs px-1 rounded">NEW</span>
                    <button
                      onClick={() => setNewPhotos(prev => prev.filter((_, i) => i !== index))}
                      className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* PDF Attachments */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className={`${textPrimary} font-medium flex items-center gap-2`}>
                  <FileText className="w-4 h-4" />
                  PDF Attachments ({(selectedIncident.pdf_attachments?.length || 0) + newPdfs.length})
                </h3>
                {isEditing && (
                  <button
                    onClick={() => pdfInputRef.current?.click()}
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm ${darkMode ? 'bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30' : 'bg-cyan-100 text-cyan-700 hover:bg-cyan-200'}`}
                  >
                    <Plus className="w-4 h-4" />
                    Add PDF
                  </button>
                )}
              </div>
              <div className="space-y-2">
                {selectedIncident.pdf_attachments?.map((pdf, index) => (
                  <div key={`pdf-${index}`} className={`${sectionBg} rounded-lg p-3 flex items-center justify-between`}>
                    <span className={textPrimary}>{pdf.name}</span>
                    <a
                      href={pdf.data}
                      download={pdf.name}
                      className={`text-sm ${darkMode ? 'text-cyan-400' : 'text-cyan-600'} hover:underline`}
                    >
                      Download
                    </a>
                  </div>
                ))}
                {newPdfs.map((pdf, index) => (
                  <div key={`new-pdf-${index}`} className={`${sectionBg} rounded-lg p-3 flex items-center justify-between border-2 border-cyan-500`}>
                    <div className="flex items-center gap-2">
                      <span className="bg-cyan-500 text-white text-xs px-1 rounded">NEW</span>
                      <span className={textPrimary}>{pdf.name}</span>
                    </div>
                    <button
                      onClick={() => setNewPdfs(prev => prev.filter((_, i) => i !== index))}
                      className="text-red-500 hover:text-red-400"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                {(selectedIncident.pdf_attachments?.length || 0) + newPdfs.length === 0 && (
                  <p className={`text-sm ${textSecondary}`}>No PDF attachments yet.</p>
                )}
              </div>
            </div>

            {/* Admin Notes - Editable */}
            <div className={`${sectionBg} rounded-lg p-4`}>
              <h3 className={`${textPrimary} font-medium mb-3`}>Admin Notes</h3>
              {isEditing ? (
                <textarea
                  value={editForm.admin_notes}
                  onChange={(e) => setEditForm({ ...editForm, admin_notes: e.target.value })}
                  placeholder="Add internal notes..."
                  rows={3}
                  className={`w-full ${inputBg} border rounded-lg px-4 py-3 focus:ring-2 focus:ring-cyan-500 outline-none resize-none`}
                />
              ) : (
                <p className={textPrimary}>{selectedIncident.admin_notes || 'No admin notes'}</p>
              )}
            </div>

            {/* Resolution Details - Editable */}
            <div className={`${sectionBg} rounded-lg p-4`}>
              <h3 className={`${textPrimary} font-medium mb-3`}>Resolution Details</h3>
              {isEditing ? (
                <textarea
                  value={editForm.resolution_details}
                  onChange={(e) => setEditForm({ ...editForm, resolution_details: e.target.value })}
                  placeholder="How was this incident resolved?"
                  rows={3}
                  className={`w-full ${inputBg} border rounded-lg px-4 py-3 focus:ring-2 focus:ring-cyan-500 outline-none resize-none`}
                />
              ) : (
                <p className={textPrimary}>{selectedIncident.resolution_details || 'Not yet resolved'}</p>
              )}
            </div>

            {/* Save Button */}
            {isEditing && (
              <button
                onClick={saveIncidentChanges}
                disabled={saving}
                className="w-full px-4 py-3 bg-cyan-600 hover:bg-cyan-700 disabled:bg-cyan-800 text-white rounded-lg font-medium transition flex items-center justify-center gap-2"
              >
                {saving && (
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                  </svg>
                )}
                Save All Changes
              </button>
            )}

            {/* Download PDF Report */}
            {!isEditing && (
              <button
                onClick={async () => {
                  setDownloadingPdf(true);
                  try {
                    const response = await incidentAPI.getPdf(selectedIncident.id);
                    const pdfData = response.data.pdf_base64;
                    const byteCharacters = atob(pdfData);
                    const byteNumbers = new Array(byteCharacters.length);
                    for (let i = 0; i < byteCharacters.length; i++) {
                      byteNumbers[i] = byteCharacters.charCodeAt(i);
                    }
                    const byteArray = new Uint8Array(byteNumbers);
                    const blob = new Blob([byteArray], { type: 'application/pdf' });
                    const filename = response.data.filename || `incident_${selectedIncident.id}.pdf`;
                    downloadFile(blob, filename);
                    showToast.success('PDF downloaded');
                  } catch (error) {
                    showToast.error('Failed to download PDF');
                  } finally {
                    setDownloadingPdf(false);
                  }
                }}
                disabled={downloadingPdf}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white rounded-lg font-medium transition"
              >
                <Download className="w-4 h-4" />
                {downloadingPdf ? 'Downloading...' : 'Download Incident Report (PDF)'}
              </button>
            )}

            {/* Timestamps */}
            <div className={`${sectionBg} rounded-lg p-4 flex items-center gap-4`}>
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
