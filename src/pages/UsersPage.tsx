import React, { useEffect, useState } from 'react';
import { userAPI } from '../utils/api';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import SlidePanel from '../components/SlidePanel';
import EmptyState from '../components/EmptyState';
import { showToast } from '../components/Toast';
import { useKeyboardShortcut, SHORTCUTS } from '../hooks/useKeyboardShortcut';
import { SkeletonTable } from '../components/Skeleton';

interface User {
  id: string;
  email: string;
  full_name: string;
  role: string;
  created_at?: string;
}

const UsersPage: React.FC = () => {
  const { user: currentUser } = useAuth();
  const { darkMode } = useTheme();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPanel, setShowPanel] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    full_name: '',
    password: '',
    role: 'admin',
  });

  // Theme styles - Professional Dark Mode
  const cardBg = darkMode ? 'bg-[#1E293B] border-[#334155]' : 'bg-white border-gray-100';
  const textPrimary = darkMode ? 'text-gray-100' : 'text-gray-900';
  const textSecondary = darkMode ? 'text-gray-300' : 'text-gray-500';
  const inputBg = darkMode ? 'bg-[#0F172A] border-[#334155] text-gray-100 placeholder:text-gray-500' : 'bg-white border-gray-200 text-gray-900';
  const hoverBg = darkMode ? 'hover:bg-[#334155]/50' : 'hover:bg-gray-50';
  const tableBg = darkMode ? 'bg-[#0F172A]' : 'bg-gray-50';
  const dividerColor = darkMode ? 'divide-[#334155]' : 'divide-gray-100';

  // Keyboard shortcuts
  useKeyboardShortcut(SHORTCUTS.NEW, () => openAddPanel());

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await userAPI.getAll();
      setUsers(response.data);
    } catch (error) {
      console.error('Failed to fetch users:', error);
      showToast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({ email: '', full_name: '', password: '', role: 'admin' });
    setEditingUser(null);
  };

  const openAddPanel = () => {
    resetForm();
    setShowPanel(true);
  };

  const openEditPanel = (user: User) => {
    setEditingUser(user);
    setFormData({
      email: user.email,
      full_name: user.full_name,
      password: '',
      role: user.role,
    });
    setShowPanel(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingUser) {
        await userAPI.update(editingUser.id, {
          full_name: formData.full_name,
          role: formData.role,
        });
        showToast.success(`User "${formData.full_name}" updated successfully`);
      } else {
        await userAPI.create(formData);
        showToast.success(`User "${formData.full_name}" created successfully`);
      }
      fetchUsers();
      setShowPanel(false);
      resetForm();
    } catch (error: any) {
      console.error('Failed to save user:', error);
      showToast.error(error.response?.data?.detail || 'Failed to save user');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (currentUser?.id === id) {
      showToast.error("You cannot delete yourself");
      return;
    }
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        await userAPI.delete(id);
        showToast.success('User deleted successfully');
        fetchUsers();
      } catch (error: any) {
        console.error('Failed to delete user:', error);
        showToast.error(error.response?.data?.detail || 'Failed to delete user');
      }
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'super_admin':
        return 'bg-purple-100 text-purple-700';
      case 'admin':
        return 'bg-cyan-100 text-cyan-700';
      case 'driver':
        return 'bg-blue-100 text-blue-700';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <div className={`h-8 w-40 rounded ${darkMode ? 'bg-[#334155]' : 'bg-gray-200'} animate-pulse mb-2`}></div>
            <div className={`h-4 w-56 rounded ${darkMode ? 'bg-[#334155]' : 'bg-gray-200'} animate-pulse`}></div>
          </div>
          <div className={`h-10 w-28 rounded-lg ${darkMode ? 'bg-[#334155]' : 'bg-gray-200'} animate-pulse`}></div>
        </div>
        <SkeletonTable rows={4} columns={4} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className={`text-2xl font-bold ${textPrimary}`}>User Management</h1>
          <p className={textSecondary}>Manage admin users for your company</p>
        </div>
        <button
          onClick={openAddPanel}
          data-testid="add-user-btn"
          className="bg-[#0A1628] hover:bg-[#132337] text-white px-4 py-2.5 rounded-lg font-medium transition flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add User
        </button>
      </div>

      {/* Users List */}
      <div className={`${cardBg} border rounded-xl overflow-hidden shadow-sm`}>
        <table className="w-full">
          <thead className={tableBg}>
            <tr>
              <th className={`text-left ${textSecondary} font-medium px-6 py-4`}>User</th>
              <th className={`text-left ${textSecondary} font-medium px-6 py-4`}>Email</th>
              <th className={`text-left ${textSecondary} font-medium px-6 py-4`}>Role</th>
              <th className={`text-left ${textSecondary} font-medium px-6 py-4`}>Actions</th>
            </tr>
          </thead>
          <tbody className={dividerColor}>
            {users.map((user) => (
              <tr key={user.id} className={hoverBg}>
                <td className="px-6 py-4">
                  <div className="flex items-center">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center mr-3 ${darkMode ? 'bg-cyan-500/20' : 'bg-cyan-100'}`}>
                      <span className={`font-medium ${darkMode ? 'text-cyan-300' : 'text-cyan-700'}`}>
                        {(user.full_name || user.email || '?').charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <div className={`font-medium ${textPrimary}`}>{user.full_name || user.email}</div>
                      {currentUser?.id === user.id && (
                        <span className={`text-xs ${textSecondary}`}>(You)</span>
                      )}
                    </div>
                  </div>
                </td>
                <td className={`px-6 py-4 ${textPrimary}`}>{user.email}</td>
                <td className="px-6 py-4">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${darkMode ? 'bg-cyan-500/20 text-cyan-300' : ''} ${!darkMode ? getRoleBadgeColor(user.role) : ''}`}>
                    {user.role.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => openEditPanel(user)}
                      data-testid={`edit-user-${user.id}`}
                      className={`font-medium text-sm ${darkMode ? 'text-cyan-400 hover:text-cyan-300' : 'text-cyan-600 hover:text-cyan-700'}`}
                    >
                      Edit
                    </button>
                    {currentUser?.id !== user.id && (
                      <button
                        onClick={() => handleDelete(user.id)}
                        data-testid={`delete-user-${user.id}`}
                        className={`font-medium text-sm ${darkMode ? 'text-red-400 hover:text-red-300' : 'text-red-500 hover:text-red-600'}`}
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {users.length === 0 && (
          <EmptyState type="users" onAction={openAddPanel} />
        )}
      </div>

      {/* Add/Edit User Slide Panel */}
      <SlidePanel
        isOpen={showPanel}
        onClose={() => { setShowPanel(false); resetForm(); }}
        title={editingUser ? 'Edit User' : 'Add New User'}
        subtitle={editingUser ? `Editing ${editingUser.full_name || editingUser.email}` : 'Create a new admin user for your team'}
        width="md"
      >
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className={`block text-sm font-medium ${textSecondary} mb-1.5`}>Full Name *</label>
            <input
              type="text"
              value={formData.full_name}
              onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
              className={`w-full ${inputBg} border rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none transition`}
              placeholder="John Smith"
              data-testid="user-fullname-input"
              required
            />
          </div>
          
          <div>
            <label className={`block text-sm font-medium ${textSecondary} mb-1.5`}>Email *</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className={`w-full ${inputBg} border rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none transition ${editingUser ? 'opacity-60 cursor-not-allowed' : ''}`}
              placeholder="john@company.com"
              data-testid="user-email-input"
              required
              disabled={!!editingUser}
            />
            {editingUser && (
              <p className={`text-sm ${textSecondary} mt-1`}>Email cannot be changed</p>
            )}
          </div>
          
          {!editingUser && (
            <div>
              <label className={`block text-sm font-medium ${textSecondary} mb-1.5`}>Password *</label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className={`w-full ${inputBg} border rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none transition`}
                placeholder="Min. 6 characters"
                data-testid="user-password-input"
                required={!editingUser}
                minLength={6}
              />
            </div>
          )}
          
          <div>
            <label className={`block text-sm font-medium ${textSecondary} mb-1.5`}>Role</label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              className={`w-full ${inputBg} border rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none transition`}
              data-testid="user-role-select"
            >
              <option value="admin">Admin</option>
              <option value="super_admin">Super Admin</option>
            </select>
          </div>
          
          <div className={`flex gap-3 pt-4 border-t ${darkMode ? 'border-[#334155]' : 'border-gray-200'}`}>
            <button
              type="button"
              onClick={() => { setShowPanel(false); resetForm(); }}
              data-testid="user-cancel-btn"
              className={`flex-1 py-2.5 rounded-lg font-medium transition ${darkMode ? 'bg-[#334155] hover:bg-[#475569] text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'}`}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              data-testid="user-submit-btn"
              className="flex-1 bg-[#0A1628] hover:bg-[#132337] disabled:opacity-50 text-white py-2.5 rounded-lg font-medium transition"
            >
              {saving ? 'Saving...' : editingUser ? 'Update User' : 'Add User'}
            </button>
          </div>
        </form>
      </SlidePanel>
    </div>
  );
};

export default UsersPage;
