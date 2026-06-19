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
    { label: 'Total Members', value: stats.members, icon: Users, color: 'text-brand-teal', bg: 'bg-brand-teal/10' },
    { label: 'Total Donations', value: `Rs ${stats.donations.toLocaleString()}`, icon: DollarSign, color: 'text-brand-teal', bg: 'bg-brand-teal/10' },
    { label: 'Pending Queries', value: stats.queries, icon: MessageSquare, color: 'text-brand-gold', bg: 'bg-brand-gold/10' },
    { label: 'Published Posts', value: stats.posts, icon: FileText, color: 'text-brand-teal', bg: 'bg-brand-teal/10' },
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-brand-navy">Dashboard Overview</h1>
        <p className="text-brand-navy/60 mt-1">Welcome back. Here's what's happening today.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <div key={i} className="bg-white rounded-2xl p-6 shadow-sm border border-brand-navy/5 flex items-center gap-4 hover:-translate-y-1 hover:shadow-md transition-all">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${stat.bg}`}>
                <Icon className={`w-6 h-6 ${stat.color}`} />
              </div>
              <div>
                <p className="text-sm font-medium text-brand-navy/60">{stat.label}</p>
                <p className="text-2xl font-bold text-brand-navy">{stat.value}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Donations */}
        <div className="bg-white border border-brand-navy/10 rounded-2xl shadow-sm overflow-hidden">
          <div className="p-6 border-b border-brand-navy/10 flex items-center justify-between">
            <h2 className="text-lg font-bold text-brand-navy">Recent Donations</h2>
            <Link to="/admin/donations" className="text-sm text-brand-teal hover:text-brand-teal/80 font-medium flex items-center gap-1">
              View All <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="divide-y divide-brand-navy/10">
            {recentDonations.length === 0 ? (
              <div className="p-6 text-center text-brand-navy/50 text-sm">No donations found.</div>
            ) : (
              recentDonations.map(d => (
                <div key={d.id} className="p-4 sm:px-6 flex items-center justify-between hover:bg-brand-gray transition-colors">
                  <div>
                    <p className="font-medium text-brand-navy">{d.donor_name}</p>
                    <p className="text-sm text-brand-navy/60">{new Date(d.created_at).toLocaleDateString()}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-brand-navy">Rs {d.amount}</p>
                    <span className={`inline-block px-2.5 py-0.5 mt-1 text-xs font-medium rounded-full ${
                      d.status === 'confirmed' ? 'bg-emerald-100 text-emerald-800' :
                      d.status === 'rejected' ? 'bg-red-100 text-red-800' :
                      'bg-amber-100 text-amber-800'
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
        <div className="bg-white border border-brand-navy/10 rounded-2xl shadow-sm overflow-hidden">
          <div className="p-6 border-b border-brand-navy/10 flex items-center justify-between">
            <h2 className="text-lg font-bold text-brand-navy">Unread Queries</h2>
            <Link to="/admin/queries" className="text-sm text-brand-teal hover:text-brand-teal/80 font-medium flex items-center gap-1">
              View All <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="divide-y divide-brand-navy/10">
            {recentQueries.length === 0 ? (
              <div className="p-6 text-center text-brand-navy/50 text-sm">No unread queries.</div>
            ) : (
              recentQueries.map(q => (
                <div key={q.id} className="p-4 sm:px-6 hover:bg-brand-gray transition-colors">
                  <div className="flex justify-between items-start mb-1">
                    <p className="font-medium text-brand-navy">{q.name}</p>
                    <span className="text-xs text-brand-navy/50">{new Date(q.created_at).toLocaleDateString()}</span>
                  </div>
                  <p className="text-sm text-brand-navy/70 line-clamp-1">{q.message}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
