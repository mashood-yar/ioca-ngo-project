import React, { useState, useEffect } from 'react';
import { Users, Search, Shield, Eye, RefreshCw } from 'lucide-react';
import { fetchApi } from '../../lib/apiClient';

interface UserProfile {
  id: string;
  full_name: string;
  email?: string;
  phone?: string;
  role: 'member' | 'volunteer' | 'admin';
  avatar_url?: string;
  is_volunteer?: boolean;
  created_at: string;
}

const ROLE_COLORS: Record<string, string> = {
  admin: 'bg-red-100 text-red-700 border-red-200',
  volunteer: 'bg-blue-100 text-blue-700 border-blue-200',
  member: 'bg-green-100 text-green-700 border-green-200',
};

export function AdminUsers() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [updatingRole, setUpdatingRole] = useState<string | null>(null);

  const loadUsers = async () => {
    setLoading(true);
    const { data, error } = await fetchApi<UserProfile[]>('/admin/users');
    if (data) setUsers(data);
    if (error) window.dispatchEvent(new CustomEvent('app-toast', { detail: { message: 'Failed to load users', variant: 'error' } }));
    setLoading(false);
  };

  useEffect(() => { loadUsers(); }, []);

  const handleRoleChange = async (userId: string, newRole: string) => {
    setUpdatingRole(userId);
    const { error } = await fetchApi(`/admin/users/${userId}`, {
      method: 'PATCH',
      body: JSON.stringify({ role: newRole })
    });
    if (!error) {
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole as UserProfile['role'] } : u));
      window.dispatchEvent(new CustomEvent('app-toast', { detail: { message: 'Role updated successfully', variant: 'success' } }));
    } else {
      window.dispatchEvent(new CustomEvent('app-toast', { detail: { message: 'Failed to update role', variant: 'error' } }));
    }
    setUpdatingRole(null);
  };

  const filteredUsers = users.filter(u =>
    !searchQuery ||
    u.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-brand-navy flex items-center gap-2">
            <Users className="w-6 h-6 text-brand-teal" /> User Management
          </h1>
          <p className="text-sm text-brand-navy/60 mt-1">Manage registered user accounts and roles</p>
        </div>
        <button onClick={loadUsers} className="flex items-center gap-2 px-4 py-2 bg-brand-navy text-white rounded-xl text-sm font-semibold hover:bg-brand-navy/90 transition-colors">
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Search by name or email..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-teal/30"
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 border-4 border-brand-teal border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>No users found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">User</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Role</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Phone</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Joined</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredUsers.map(user => (
                  <tr key={user.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {user.avatar_url ? (
                          <img src={user.avatar_url} alt="" className="w-8 h-8 rounded-full object-cover" />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-brand-navy/10 flex items-center justify-center text-xs font-bold text-brand-navy">
                            {user.full_name?.charAt(0)?.toUpperCase() || '?'}
                          </div>
                        )}
                        <div>
                          <p className="text-sm font-semibold text-brand-navy">{user.full_name || 'Unknown'}</p>
                          <p className="text-xs text-gray-500">{user.email || '—'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <select
                        value={user.role}
                        onChange={e => handleRoleChange(user.id, e.target.value)}
                        disabled={updatingRole === user.id}
                        className={`px-2 py-1 text-xs font-semibold rounded-lg border cursor-pointer ${ROLE_COLORS[user.role] || 'bg-gray-100 text-gray-700'}`}
                      >
                        <option value="member">Member</option>
                        <option value="volunteer">Volunteer</option>
                        <option value="admin">Admin</option>
                      </select>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{user.phone || '—'}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {new Date(user.created_at).toLocaleDateString('en-PK', { year: 'numeric', month: 'short', day: 'numeric' })}
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => setSelectedUser(user)}
                        aria-label="View user details"
                        className="p-1.5 rounded-lg text-gray-400 hover:text-brand-teal hover:bg-brand-teal/10 transition-colors"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[{ label: 'Total Users', value: users.length, color: 'brand-navy' }, { label: 'Members', value: users.filter(u => u.role === 'member').length, color: 'green-600' }, { label: 'Volunteers', value: users.filter(u => u.role === 'volunteer').length, color: 'blue-600' }].map(stat => (
          <div key={stat.label} className="bg-white rounded-xl border border-gray-100 p-4 text-center">
            <p className={`text-2xl font-bold text-${stat.color}`}>{stat.value}</p>
            <p className="text-xs text-gray-500 mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* User Detail Modal */}
      {selectedUser && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-brand-navy">User Details</h2>
              <button onClick={() => setSelectedUser(null)} className="text-gray-400 hover:text-gray-600 text-xl">&times;</button>
            </div>
            <div className="flex items-center gap-4 mb-4">
              {selectedUser.avatar_url ? (
                <img src={selectedUser.avatar_url} alt="" className="w-16 h-16 rounded-full object-cover" />
              ) : (
                <div className="w-16 h-16 rounded-full bg-brand-navy/10 flex items-center justify-center text-xl font-bold text-brand-navy">
                  {selectedUser.full_name?.charAt(0)?.toUpperCase() || '?'}
                </div>
              )}
              <div>
                <p className="font-bold text-brand-navy">{selectedUser.full_name}</p>
                <p className="text-sm text-gray-500">{selectedUser.email}</p>
                <span className={`inline-block mt-1 px-2 py-0.5 text-xs font-semibold rounded-full border ${ROLE_COLORS[selectedUser.role] || ''}`}>
                  {selectedUser.role}
                </span>
              </div>
            </div>
            <div className="space-y-2 text-sm border-t border-gray-100 pt-4">
              <div><span className="font-semibold text-gray-600">Phone:</span> <span>{selectedUser.phone || '—'}</span></div>
              <div><span className="font-semibold text-gray-600">Joined:</span> <span>{new Date(selectedUser.created_at).toLocaleDateString()}</span></div>
              <div><span className="font-semibold text-gray-600">Volunteer:</span> <span>{selectedUser.is_volunteer ? 'Yes' : 'No'}</span></div>
            </div>
            <button onClick={() => setSelectedUser(null)} className="mt-4 w-full bg-brand-navy text-white py-2 rounded-xl font-semibold hover:bg-brand-navy/90">Close</button>
          </div>
        </div>
      )}
    </div>
  );
}
