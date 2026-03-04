import React, { useEffect, useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { api } from '../utils/api';
import { showToast } from '../components/Toast';
import { SkeletonCard } from '../components/Skeleton';
import SlidePanel from '../components/SlidePanel';
import { 
  HelpCircle, 
  ChevronDown, 
  ChevronRight, 
  Send, 
  MessageSquare,
  CheckCircle,
  Clock,
  AlertCircle,
  User,
  Truck,
  Settings
} from 'lucide-react';

interface FAQItem {
  q: string;
  a: string;
}

interface FAQCategory {
  category: string;
  questions: FAQItem[];
}

interface SupportRequest {
  id: string;
  ticket_number: string;
  user_name: string;
  user_email: string;
  user_role: string;
  subject: string;
  message: string;
  category: string;
  status: string;
  admin_response: string | null;
  created_at: string;
  updated_at: string;
  resolved_at: string | null;
}

const HelpPage: React.FC = () => {
  const { darkMode } = useTheme();
  const [faqData, setFaqData] = useState<FAQCategory[]>([]);
  const [supportRequests, setSupportRequests] = useState<SupportRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedCategory, setExpandedCategory] = useState<string | null>('driver');
  const [expandedQuestions, setExpandedQuestions] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState<'faq' | 'requests'>('faq');
  
  // New request form
  const [showNewRequest, setShowNewRequest] = useState(false);
  const [newRequest, setNewRequest] = useState({
    subject: '',
    message: '',
    category: 'general'
  });
  const [submitting, setSubmitting] = useState(false);
  
  // Selected request for detail view
  const [selectedRequest, setSelectedRequest] = useState<SupportRequest | null>(null);
  const [responseText, setResponseText] = useState('');
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [faqRes, requestsRes] = await Promise.all([
        api.get('/faq'),
        api.get('/support')
      ]);
      setFaqData(faqRes.data || []);
      setSupportRequests(requestsRes.data || []);
    } catch (error) {
      console.error('Failed to fetch help data:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleQuestion = (questionId: string) => {
    const newExpanded = new Set(expandedQuestions);
    if (newExpanded.has(questionId)) {
      newExpanded.delete(questionId);
    } else {
      newExpanded.add(questionId);
    }
    setExpandedQuestions(newExpanded);
  };

  const handleSubmitRequest = async () => {
    if (!newRequest.subject.trim() || !newRequest.message.trim()) {
      showToast.error('Please fill in all fields');
      return;
    }
    
    setSubmitting(true);
    try {
      const response = await api.post('/support', newRequest);
      showToast.success(`Request submitted! Ticket: ${response.data.ticket_number}`);
      setNewRequest({ subject: '', message: '', category: 'general' });
      setShowNewRequest(false);
      fetchData();
    } catch (error) {
      showToast.error('Failed to submit request');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateRequest = async (requestId: string, status: string) => {
    setUpdating(true);
    try {
      await api.put(`/support/${requestId}`, { 
        status,
        admin_response: responseText || undefined
      });
      showToast.success('Request updated');
      setResponseText('');
      fetchData();
      if (selectedRequest) {
        const updated = await api.get(`/support/${requestId}`);
        setSelectedRequest(updated.data);
      }
    } catch (error) {
      showToast.error('Failed to update request');
    } finally {
      setUpdating(false);
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'driver': return <Truck className="w-5 h-5" />;
      case 'admin': return <Settings className="w-5 h-5" />;
      default: return <HelpCircle className="w-5 h-5" />;
    }
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'driver': return 'For Drivers';
      case 'admin': return 'For Admins';
      default: return 'General';
    }
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      open: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
      in_progress: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
      resolved: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
      closed: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-400',
    };
    return styles[status] || styles.open;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'resolved':
      case 'closed':
        return <CheckCircle className="w-4 h-4" />;
      case 'in_progress':
        return <Clock className="w-4 h-4" />;
      default:
        return <AlertCircle className="w-4 h-4" />;
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <SkeletonCard />
        <SkeletonCard />
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Help & Support</h1>
          <p className={`mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Find answers or submit a support request
          </p>
        </div>
        <button
          onClick={() => setShowNewRequest(true)}
          className="flex items-center gap-2 px-4 py-2 bg-cyan-500 text-white rounded-lg hover:bg-cyan-600 transition-colors"
          data-testid="new-request-btn"
        >
          <MessageSquare className="w-5 h-5" />
          New Request
        </button>
      </div>

      {/* Tabs */}
      <div className={`flex gap-1 p-1 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
        <button
          onClick={() => setActiveTab('faq')}
          className={`flex-1 px-4 py-2 rounded-md font-medium transition-colors ${
            activeTab === 'faq'
              ? 'bg-white dark:bg-gray-700 shadow-sm'
              : 'hover:bg-white/50 dark:hover:bg-gray-700/50'
          }`}
        >
          <HelpCircle className="w-4 h-4 inline mr-2" />
          FAQ
        </button>
        <button
          onClick={() => setActiveTab('requests')}
          className={`flex-1 px-4 py-2 rounded-md font-medium transition-colors ${
            activeTab === 'requests'
              ? 'bg-white dark:bg-gray-700 shadow-sm'
              : 'hover:bg-white/50 dark:hover:bg-gray-700/50'
          }`}
        >
          <MessageSquare className="w-4 h-4 inline mr-2" />
          Support Requests
          {supportRequests.filter(r => r.status === 'open').length > 0 && (
            <span className="ml-2 px-2 py-0.5 text-xs bg-red-500 text-white rounded-full">
              {supportRequests.filter(r => r.status === 'open').length}
            </span>
          )}
        </button>
      </div>

      {/* FAQ Section */}
      {activeTab === 'faq' && (
        <div className="space-y-4">
          {faqData.map((category) => (
            <div
              key={category.category}
              className={`rounded-xl border overflow-hidden ${
                darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
              }`}
            >
              {/* Category Header */}
              <button
                onClick={() => setExpandedCategory(
                  expandedCategory === category.category ? null : category.category
                )}
                className={`w-full flex items-center justify-between p-4 transition-colors ${
                  darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${
                    darkMode ? 'bg-cyan-500/20 text-cyan-400' : 'bg-cyan-100 text-cyan-600'
                  }`}>
                    {getCategoryIcon(category.category)}
                  </div>
                  <div className="text-left">
                    <h3 className="font-semibold">{getCategoryLabel(category.category)}</h3>
                    <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      {category.questions.length} questions
                    </p>
                  </div>
                </div>
                {expandedCategory === category.category ? (
                  <ChevronDown className="w-5 h-5 text-gray-400" />
                ) : (
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                )}
              </button>

              {/* Questions */}
              {expandedCategory === category.category && (
                <div className={`border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                  {category.questions.map((item, idx) => {
                    const questionId = `${category.category}-${idx}`;
                    const isExpanded = expandedQuestions.has(questionId);
                    
                    return (
                      <div
                        key={idx}
                        className={`border-b last:border-b-0 ${
                          darkMode ? 'border-gray-700' : 'border-gray-100'
                        }`}
                      >
                        <button
                          onClick={() => toggleQuestion(questionId)}
                          className={`w-full flex items-center justify-between p-4 text-left transition-colors ${
                            darkMode ? 'hover:bg-gray-700/50' : 'hover:bg-gray-50'
                          }`}
                        >
                          <span className="font-medium pr-4">{item.q}</span>
                          {isExpanded ? (
                            <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />
                          ) : (
                            <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
                          )}
                        </button>
                        {isExpanded && (
                          <div className={`px-4 pb-4 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                            <div className={`p-4 rounded-lg whitespace-pre-line ${
                              darkMode ? 'bg-gray-700/50' : 'bg-gray-50'
                            }`}>
                              {item.a}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Support Requests Section */}
      {activeTab === 'requests' && (
        <div className={`rounded-xl border overflow-hidden ${
          darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
        }`}>
          {supportRequests.length === 0 ? (
            <div className="p-8 text-center">
              <MessageSquare className={`w-12 h-12 mx-auto mb-4 ${darkMode ? 'text-gray-600' : 'text-gray-300'}`} />
              <p className={darkMode ? 'text-gray-400' : 'text-gray-500'}>No support requests yet</p>
              <button
                onClick={() => setShowNewRequest(true)}
                className="mt-4 text-cyan-500 hover:text-cyan-400"
              >
                Submit your first request
              </button>
            </div>
          ) : (
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {supportRequests.map((request) => (
                <div
                  key={request.id}
                  onClick={() => setSelectedRequest(request)}
                  className={`p-4 cursor-pointer transition-colors ${
                    darkMode ? 'hover:bg-gray-700/50' : 'hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-xs font-mono ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                          {request.ticket_number}
                        </span>
                        <span className={`px-2 py-0.5 text-xs font-medium rounded-full flex items-center gap-1 ${getStatusBadge(request.status)}`}>
                          {getStatusIcon(request.status)}
                          {request.status.replace('_', ' ')}
                        </span>
                      </div>
                      <h4 className="font-medium">{request.subject}</h4>
                      <p className={`text-sm mt-1 line-clamp-2 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        {request.message}
                      </p>
                      <div className={`flex items-center gap-4 mt-2 text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                        <span className="flex items-center gap-1">
                          <User className="w-3 h-3" />
                          {request.user_name}
                        </span>
                        <span>
                          {new Date(request.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* New Request Modal */}
      <SlidePanel
        isOpen={showNewRequest}
        onClose={() => setShowNewRequest(false)}
        title="New Support Request"
      >
        <div className="space-y-4">
          <div>
            <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Category
            </label>
            <select
              value={newRequest.category}
              onChange={(e) => setNewRequest({ ...newRequest, category: e.target.value })}
              className={`w-full px-4 py-2 rounded-lg border ${
                darkMode
                  ? 'bg-gray-700 border-gray-600 text-white'
                  : 'bg-white border-gray-300 text-gray-900'
              }`}
            >
              <option value="general">General Question</option>
              <option value="technical">Technical Issue</option>
              <option value="billing">Billing</option>
              <option value="feature_request">Feature Request</option>
              <option value="bug_report">Bug Report</option>
            </select>
          </div>
          
          <div>
            <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Subject
            </label>
            <input
              type="text"
              value={newRequest.subject}
              onChange={(e) => setNewRequest({ ...newRequest, subject: e.target.value })}
              placeholder="Brief description of your issue"
              className={`w-full px-4 py-2 rounded-lg border ${
                darkMode
                  ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                  : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
              }`}
            />
          </div>
          
          <div>
            <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Message
            </label>
            <textarea
              value={newRequest.message}
              onChange={(e) => setNewRequest({ ...newRequest, message: e.target.value })}
              placeholder="Describe your question or issue in detail..."
              rows={6}
              className={`w-full px-4 py-2 rounded-lg border ${
                darkMode
                  ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                  : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
              }`}
            />
          </div>
          
          <button
            onClick={handleSubmitRequest}
            disabled={submitting}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-cyan-500 text-white rounded-lg hover:bg-cyan-600 disabled:opacity-50 transition-colors"
          >
            {submitting ? (
              'Submitting...'
            ) : (
              <>
                <Send className="w-5 h-5" />
                Submit Request
              </>
            )}
          </button>
        </div>
      </SlidePanel>

      {/* Request Detail Panel */}
      <SlidePanel
        isOpen={!!selectedRequest}
        onClose={() => { setSelectedRequest(null); setResponseText(''); }}
        title={`Ticket ${selectedRequest?.ticket_number || ''}`}
      >
        {selectedRequest && (
          <div className="space-y-6">
            {/* Status */}
            <div className="flex items-center gap-2">
              <span className={`px-3 py-1 text-sm font-medium rounded-full flex items-center gap-1 ${getStatusBadge(selectedRequest.status)}`}>
                {getStatusIcon(selectedRequest.status)}
                {selectedRequest.status.replace('_', ' ')}
              </span>
              <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                {selectedRequest.category.replace('_', ' ')}
              </span>
            </div>
            
            {/* Subject */}
            <div>
              <h3 className="font-semibold text-lg">{selectedRequest.subject}</h3>
              <div className={`flex items-center gap-4 mt-1 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                <span className="flex items-center gap-1">
                  <User className="w-4 h-4" />
                  {selectedRequest.user_name} ({selectedRequest.user_role})
                </span>
                <span>{selectedRequest.user_email}</span>
              </div>
            </div>
            
            {/* Message */}
            <div>
              <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Message
              </label>
              <div className={`p-4 rounded-lg whitespace-pre-line ${
                darkMode ? 'bg-gray-700' : 'bg-gray-100'
              }`}>
                {selectedRequest.message}
              </div>
            </div>
            
            {/* Admin Response (if exists) */}
            {selectedRequest.admin_response && (
              <div>
                <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Response
                </label>
                <div className={`p-4 rounded-lg whitespace-pre-line border-l-4 border-cyan-500 ${
                  darkMode ? 'bg-cyan-900/20' : 'bg-cyan-50'
                }`}>
                  {selectedRequest.admin_response}
                </div>
              </div>
            )}
            
            {/* Response Form (for admins) */}
            {selectedRequest.status !== 'closed' && (
              <div className="space-y-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <div>
                  <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Add Response
                  </label>
                  <textarea
                    value={responseText}
                    onChange={(e) => setResponseText(e.target.value)}
                    placeholder="Type your response..."
                    rows={4}
                    className={`w-full px-4 py-2 rounded-lg border ${
                      darkMode
                        ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                    }`}
                  />
                </div>
                
                <div className="flex gap-2">
                  {selectedRequest.status === 'open' && (
                    <button
                      onClick={() => handleUpdateRequest(selectedRequest.id, 'in_progress')}
                      disabled={updating}
                      className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
                    >
                      Mark In Progress
                    </button>
                  )}
                  <button
                    onClick={() => handleUpdateRequest(selectedRequest.id, 'resolved')}
                    disabled={updating}
                    className="flex-1 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50"
                  >
                    Mark Resolved
                  </button>
                </div>
              </div>
            )}
            
            {/* Timestamps */}
            <div className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
              <p>Created: {new Date(selectedRequest.created_at).toLocaleString()}</p>
              {selectedRequest.resolved_at && (
                <p>Resolved: {new Date(selectedRequest.resolved_at).toLocaleString()}</p>
              )}
            </div>
          </div>
        )}
      </SlidePanel>
    </div>
  );
};

export default HelpPage;
