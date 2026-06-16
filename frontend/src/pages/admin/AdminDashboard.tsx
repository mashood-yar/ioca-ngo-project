import { useEffect, useState } from 'react';
import { Users, DollarSign, MessageSquare, FileText, ArrowRight } from 'lucide-react';
import { fetchApi } from '../../lib/apiClient';
import { Link } from 'react-router-dom';

export function AdminDashboard() {
  const [stats, setStats] = useState({
    members: 0,
    donations: 0,
    queries: 0,
    posts: 0,
  });
  const [recentDonations, setRecentDonations] = useState<any[]>([]);
  const [recentQueries, setRecentQueries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboard() {
      try {
        const [
          membersRes,
          donationsRes,
          queriesRes,
          newsRes
        ] = await Promise.all([
          fetchApi<any[]>('/members'),
          fetchApi<any[]>('/donations'),
          fetchApi<any[]>('/contacts?status=unread'),
          fetchApi<any[]>('/news'),
        ]);

        const donations = donationsRes.data || [];
        const queries = queriesRes.data || [];
        
        setStats({
          members: membersRes.data?.length || 0,
          donations: donations.reduce((sum, d) => sum + Number(d.amount || 0), 0),
          queries: queries.length,
          posts: newsRes.data?.length || 0,
        });

        setRecentDonations(donations.slice(0, 5));
        setRecentQueries(queries.slice(0, 5));
      } catch (err) {
        console.error('Failed to load dashboard', err);
      } finally {
        setLoading(false);
      }
    }
    loadDashboard();
  }, []);

  if (loading) {
    return <div className="flex h-64 items-center justify-center">Loading dashboard...</div>;
  }

  const statCards = [
    { label: 'Total Members', value: stats.members, icon: Users, color: 'text-blue-600', bg: 'bg-blue-100' },
    { label: 'Total Donations', value: `Rs ${stats.donations.toLocaleString()}`, icon: DollarSign, color: 'text-green-600', bg: 'bg-green-100' },
    { label: 'Pending Queries', value: stats.queries, icon: MessageSquare, color: 'text-orange-600', bg: 'bg-orange-100' },
    { label: 'Published Posts', value: stats.posts, icon: FileText, color: 'text-purple-600', bg: 'bg-purple-100' },
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard Overview</h1>
        <p className="text-gray-500 mt-1">Welcome back. Here's what's happening today.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <div key={i} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex items-center gap-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${stat.bg}`}>
                <Icon className={`w-6 h-6 ${stat.color}`} />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">{stat.label}</p>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Donations */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-900">Recent Donations</h2>
            <Link to="/admin/donations" className="text-sm text-primary hover:text-primary-dark font-medium flex items-center gap-1">
              View All <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="divide-y divide-gray-100">
            {recentDonations.length === 0 ? (
              <div className="p-6 text-center text-gray-500 text-sm">No donations found.</div>
            ) : (
              recentDonations.map(d => (
                <div key={d.id} className="p-4 sm:px-6 flex items-center justify-between hover:bg-gray-50 transition-colors">
                  <div>
                    <p className="font-medium text-gray-900">{d.donor_name}</p>
                    <p className="text-sm text-gray-500">{new Date(d.created_at).toLocaleDateString()}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-gray-900">Rs {d.amount}</p>
                    <span className={`inline-block px-2 py-1 mt-1 text-xs font-medium rounded-full ${
                      d.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                      d.status === 'rejected' ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {d.status || 'pending'}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Queries */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-900">Unread Queries</h2>
            <Link to="/admin/queries" className="text-sm text-primary hover:text-primary-dark font-medium flex items-center gap-1">
              View All <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="divide-y divide-gray-100">
            {recentQueries.length === 0 ? (
              <div className="p-6 text-center text-gray-500 text-sm">No unread queries.</div>
            ) : (
              recentQueries.map(q => (
                <div key={q.id} className="p-4 sm:px-6 hover:bg-gray-50 transition-colors">
                  <div className="flex justify-between items-start mb-1">
                    <p className="font-medium text-gray-900">{q.name}</p>
                    <span className="text-xs text-gray-500">{new Date(q.created_at).toLocaleDateString()}</span>
                  </div>
                  <p className="text-sm text-gray-600 line-clamp-1">{q.message}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
