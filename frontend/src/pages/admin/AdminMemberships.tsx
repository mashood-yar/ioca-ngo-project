import { useState, useEffect } from 'react';
import { CreditCard, Search, RefreshCw, CheckCircle, Clock, XCircle } from 'lucide-react';
import { fetchApi } from '../../lib/apiClient';

interface Membership {
  id: string;
  user_id: string;
  tier_id: string;
  status: string;
  start_date: string;
  end_date: string;
  created_at: string;
  profiles?: { full_name: string; email?: string; phone?: string; avatar_url?: string; };
  tiers?: { name: string; price?: number; };
}

const STATUS_CONFIG = {
  active: { icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50 border-green-200', label: 'Active' },
  expired: { icon: XCircle, color: 'text-red-600', bg: 'bg-red-50 border-red-200', label: 'Expired' },
  pending: { icon: Clock, color: 'text-yellow-600', bg: 'bg-yellow-50 border-yellow-200', label: 'Pending' },
};

export function AdminMemberships() {
  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const loadMemberships = async () => {
    setLoading(true);
    const { data, error } = await fetchApi<Membership[]>('/admin/memberships');
    if (data) setMemberships(data);
    if (error) window.dispatchEvent(new CustomEvent('app-toast', { detail: { message: 'Failed to load memberships', variant: 'error' } }));
    setLoading(false);
  };

  useEffect(() => { loadMemberships(); }, []);

  const filtered = memberships.filter(m => {
    const name = m.profiles?.full_name || '';
    const email = m.profiles?.email || '';
    const matchSearch = !searchQuery || name.toLowerCase().includes(searchQuery.toLowerCase()) || email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchStatus = statusFilter === 'all' || m.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const isExpiringSoon = (endDate: string) => {
    const days = (new Date(endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
    return days > 0 && days <= 30;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-brand-navy flex items-center gap-2">
            <CreditCard className="w-6 h-6 text-brand-teal" /> Memberships
          </h1>
          <p className="text-sm text-brand-navy/60 mt-1">Track active memberships and renewal dates</p>
        </div>
        <button onClick={loadMemberships} className="flex items-center gap-2 px-4 py-2 bg-brand-navy text-white rounded-xl text-sm font-semibold hover:bg-brand-navy/90">
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Total', value: memberships.length, color: 'brand-navy' },
          { label: 'Active', value: memberships.filter(m => m.status === 'active').length, color: 'green-600' },
          { label: 'Expired', value: memberships.filter(m => m.status === 'expired').length, color: 'red-500' },
          { label: 'Expiring Soon', value: memberships.filter(m => m.end_date && isExpiringSoon(m.end_date)).length, color: 'yellow-600' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl border border-gray-100 p-4 text-center">
            <p className={`text-2xl font-bold text-${s.color}`}>{s.value}</p>
            <p className="text-xs text-gray-500 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input type="text" placeholder="Search member..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-teal/30" />
        </div>
        <div className="flex gap-2">
          {['all', 'active', 'expired', 'pending'].map(s => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize ${statusFilter === s ? 'bg-brand-navy text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16"><div className="w-8 h-8 border-4 border-brand-teal border-t-transparent rounded-full animate-spin" /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-gray-400"><CreditCard className="w-12 h-12 mx-auto mb-3 opacity-30" /><p>No memberships found</p></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Member</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Tier</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Start Date</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Expiry</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map(m => {
                  const statusCfg = STATUS_CONFIG[m.status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.pending;
                  const StatusIcon = statusCfg.icon;
                  const expiring = m.end_date && isExpiringSoon(m.end_date);
                  return (
                    <tr key={m.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {m.profiles?.avatar_url ? (
                            <img src={m.profiles.avatar_url} alt="" className="w-8 h-8 rounded-full object-cover" />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-brand-navy/10 flex items-center justify-center text-xs font-bold text-brand-navy">
                              {m.profiles?.full_name?.charAt(0)?.toUpperCase() || '?'}
                            </div>
                          )}
                          <div>
                            <p className="text-sm font-semibold text-brand-navy">{m.profiles?.full_name || '—'}</p>
                            <p className="text-xs text-gray-500">{m.profiles?.email || '—'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-gray-700">{m.tiers?.name || '—'}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-full border ${statusCfg.bg} ${statusCfg.color}`}>
                          <StatusIcon className="w-3 h-3" />{statusCfg.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{m.start_date ? new Date(m.start_date).toLocaleDateString() : '—'}</td>
                      <td className="px-6 py-4">
                        <span className={expiring ? 'text-yellow-600 font-semibold text-sm' : 'text-sm text-gray-600'}>
                          {m.end_date ? new Date(m.end_date).toLocaleDateString() : '—'}
                          {expiring && <span className="ml-1 text-xs">(Expiring Soon)</span>}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
