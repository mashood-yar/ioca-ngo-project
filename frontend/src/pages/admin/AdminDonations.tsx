import { useState, useEffect } from 'react';
import { 
  CheckCircle, 
  XCircle, 
  Image as ImageIcon, 
  Search, 
  TrendingUp, 
  Users, 
  FolderHeart, 
  DollarSign, 
  FileSpreadsheet, 
  X, 
  ChevronRight, 
  Loader2, 
  UserCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { fetchApi } from '../../lib/apiClient';
import { useCloudinaryUpload } from '../../hooks/useCloudinaryUpload';
import { optimizeImage } from '../../lib/optimizeImage';
import { AdminButton } from './AdminButton';

interface Donation {
  id: string;
  donor_name: string;
  email?: string;
  phone?: string;
  amount: number;
  payment_method: string;
  status: 'pending' | 'payment_verified' | 'confirmed' | 'rejected';
  screenshot_url?: string;
  screenshot_public_id?: string;
  created_at: string;
  receipt_number?: string;
  transaction_id?: string;
  notes?: string;
  projects?: { title: string };
  project_id?: string;
  payment_verified_at?: string;
  payment_verified_by?: string;
  verification_notes?: string;
}

interface ProjectTotals {
  project_id: string | null;
  title: string;
  confirmed: number;
  pending: number;
  count: number;
}

interface TopDonor {
  donor_name: string;
  email: string;
  total_donated: number;
  count: number;
}

interface SummaryData {
  total_confirmed: number;
  total_pending: number;
  total_rejected: number;
  total_all_time: number;
  count_confirmed: number;
  count_pending: number;
  unique_donors_count: number;
  per_project: ProjectTotals[];
  top_donors: TopDonor[];
}

export function AdminDonations() {
  const [donations, setDonations] = useState<Donation[]>([]);
  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'all' | 'donors'>('overview');

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'payment_verified' | 'confirmed' | 'rejected'>('all');
  
  // Selection states for Modals / Drawers
  const [selectedDonation, setSelectedDonation] = useState<Donation | null>(null);
  const [actionType, setActionType] = useState<'confirm' | 'reject' | 'verify_payment' | null>(null);
  const [notes, setNotes] = useState('');
  const [isActionProcessing, setIsActionProcessing] = useState(false);

  // Lightbox
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

  // Side drawer for Donor history
  const [selectedDonor, setSelectedDonor] = useState<{ name: string; email: string } | null>(null);
  const [donorHistory, setDonorHistory] = useState<Donation[]>([]);
  const [loadingDonorHistory, setLoadingDonorHistory] = useState(false);

  const { upload, uploading } = useCloudinaryUpload();

  const loadData = async () => {
    try {
      const [donationsRes, summaryRes] = await Promise.all([
        fetchApi<Donation[]>('/donations'),
        fetchApi<SummaryData>('/donations/summary')
      ]);

      if (donationsRes.data) {
        setDonations(donationsRes.data);
      }
      if (summaryRes.data) {
        setSummary(summaryRes.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAction = async () => {
    if (!selectedDonation || !actionType) return;
    setIsActionProcessing(true);
    try {
      let response;
      let newStatus: string;
      if (actionType === 'verify_payment') {
        newStatus = 'payment_verified';
        response = await fetchApi<Donation>(`/donations/${selectedDonation.id}/verify-payment`, {
          method: 'PATCH',
          body: JSON.stringify({ verificationNotes: notes || undefined }),
        });
      } else {
        newStatus = actionType === 'confirm' ? 'confirmed' : 'rejected';
        response = await fetchApi<Donation>(`/donations/${selectedDonation.id}`, {
          method: 'PATCH',
          body: JSON.stringify({ status: newStatus, notes: notes || undefined }),
        });
      }

      if (response.error) throw new Error(response.error);

      window.dispatchEvent(new CustomEvent('app-toast', { 
        detail: { message: `Donation status updated successfully!`, variant: 'success' }
      }));
      
      // Reset action states
      setSelectedDonation(null);
      setActionType(null);
      setNotes('');
      
      // Reload page data
      await loadData();
    } catch (err: any) {
      window.dispatchEvent(new CustomEvent('app-toast', { 
        detail: { message: err.message || 'Failed to update status', variant: 'error' }
      }));
    } finally {
      setIsActionProcessing(false);
    }
  };

  const handleUploadScreenshot = async (id: string, file: File) => {
    try {
      const result = await upload(file, 'ioca/donations');
      if (result) {
        const response = await fetchApi(`/donations/${id}`, {
          method: 'PUT',
          body: JSON.stringify({ screenshotUrl: result.url, screenshotPublicId: result.publicId }),
        });

        if (response.error) throw new Error(response.error);

        window.dispatchEvent(new CustomEvent('app-toast', { detail: { message: 'Screenshot uploaded and mapped successfully!', variant: 'success' }}));
        await loadData();
      }
    } catch (err: any) {
      window.dispatchEvent(new CustomEvent('app-toast', { detail: { message: err.message || 'Upload failed', variant: 'error' }}));
    }
  };

  const loadDonorHistory = async (email: string, name: string) => {
    setLoadingDonorHistory(true);
    setSelectedDonor({ name, email });
    try {
      const { data, error } = await fetchApi<{ donations: Donation[] }>(`/donations/donor/${encodeURIComponent(email)}`);
      if (!error && data) {
        setDonorHistory(data.donations);
      } else {
        // Fallback to client-side filtering if endpoint has issues
        setDonorHistory(donations.filter(d => d.email?.toLowerCase().trim() === email.toLowerCase().trim()));
      }
    } catch (err) {
      console.error(err);
      setDonorHistory(donations.filter(d => d.email?.toLowerCase().trim() === email.toLowerCase().trim()));
    } finally {
      setLoadingDonorHistory(false);
    }
  };

  const downloadCSV = () => {
    const headers = [
      'Receipt Number', 
      'Donor Name', 
      'Email', 
      'Phone', 
      'Project', 
      'Amount (PKR)', 
      'Payment Method', 
      'Transaction ID', 
      'Status', 
      'Notes', 
      'Date'
    ];
    
    const rows = donations.map(d => [
      d.receipt_number || 'N/A',
      d.donor_name || 'Anonymous',
      d.email || 'N/A',
      d.phone || 'N/A',
      d.projects?.title || 'General Fund',
      d.amount,
      d.payment_method,
      d.transaction_id || d.id,
      d.status,
      d.notes || '',
      new Date(d.created_at).toLocaleString('en-PK')
    ]);

    const csvContent = [
      headers.join(','), 
      ...rows.map(e => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `ioca_donations_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Group Donors client-side for the tab
  const groupedDonors = donations.reduce((acc: Record<string, { name: string; email: string; phone?: string; total: number; count: number }>, curr) => {
    if (curr.status !== 'confirmed') return acc;
    const emailKey = curr.email?.toLowerCase().trim() || '';
    const nameKey = curr.donor_name.toLowerCase().trim();
    const key = emailKey ? emailKey : `name_${nameKey}`;

    if (!acc[key]) {
      acc[key] = {
        name: curr.donor_name,
        email: curr.email || 'N/A',
        phone: curr.phone || undefined,
        total: 0,
        count: 0
      };
    }
    acc[key].total += Number(curr.amount) || 0;
    acc[key].count += 1;
    return acc;
  }, {});

  const donorProfilesList = Object.values(groupedDonors).sort((a, b) => b.total - a.total);

  // Search and status filters for All Donations list
  const filteredDonations = donations.filter(d => {
    const matchesSearch = 
      d.donor_name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      (d.email && d.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (d.receipt_number && d.receipt_number.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (d.transaction_id && d.transaction_id.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (d.projects?.title && d.projects.title.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = statusFilter === 'all' || d.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Search filter for Donor Profiles list
  const filteredDonors = donorProfilesList.filter(dp => 
    dp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    dp.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <Loader2 className="w-10 h-10 animate-spin text-brand-teal" />
        <p className="text-gray-500 font-medium text-sm">Loading donations dashboard...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12 animate-in fade-in duration-500">
      {/* Dashboard Top Heading */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-gray-100 pb-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Donations Portal</h1>
          <p className="text-slate-500 mt-1.5 font-medium">Verify bank receipts, allocate project funds, and audit donation distributions.</p>
        </div>
        <AdminButton
          onClick={downloadCSV}
          variant="ghost"
          icon={<FileSpreadsheet className="w-4 h-4" />}
        >
          Export Audit Log (CSV)
        </AdminButton>
      </div>

      {/* Modern Segmented Navigation Tabs */}
      <div className="flex bg-slate-100 p-1.5 rounded-2xl max-w-lg border border-slate-200/50 shadow-inner">
        {[
          { id: 'overview', label: 'Overview Metrics', icon: TrendingUp },
          { id: 'all', label: 'All Contributions', icon: DollarSign },
          { id: 'donors', label: 'Donor Directory', icon: Users },
        ].map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id as any);
                setSearchTerm('');
              }}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all ${
                activeTab === tab.id
                  ? 'bg-[#1D2D49] text-white shadow-md'
                  : 'text-[#6B7280] hover:text-[#1D2D49] hover:bg-[#F3F4F6]'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* --- TAB 1: OVERVIEW METRICS --- */}
      {activeTab === 'overview' && (
        <div className="space-y-8 animate-in fade-in duration-300">
          {/* Key KPI Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 border border-emerald-200/60 p-6 rounded-xl shadow-sm">
              <span className="text-xs font-black text-emerald-800 uppercase tracking-widest">Total Confirmed</span>
              <h3 className="text-2xl font-black text-slate-900 mt-2">
                <strong>PKR {(summary?.total_confirmed || 0).toLocaleString('en-PK')}</strong>
              </h3>
              <p className="text-xs text-emerald-700/80 mt-1 font-bold">{summary?.count_confirmed} contributions approved</p>
            </div>

            <div className="bg-gradient-to-br from-amber-50 to-amber-100/50 border border-amber-200/60 p-6 rounded-xl shadow-sm">
              <span className="text-xs font-black text-amber-800 uppercase tracking-widest">Awaiting Verification</span>
              <h3 className="text-2xl font-black text-slate-900 mt-2">
                <strong>PKR {(summary?.total_pending || 0).toLocaleString('en-PK')}</strong>
              </h3>
              <p className="text-xs text-amber-700/80 mt-1 font-bold">{summary?.count_pending} receipts to audit</p>
            </div>

            <div className="bg-gradient-to-br from-rose-50 to-rose-100/50 border border-rose-200/60 p-6 rounded-xl shadow-sm">
              <span className="text-xs font-black text-rose-800 uppercase tracking-widest">Total Rejected</span>
              <h3 className="text-2xl font-black text-slate-900 mt-2">
                <strong>PKR {(summary?.total_rejected || 0).toLocaleString('en-PK')}</strong>
              </h3>
              <p className="text-xs text-rose-700/80 mt-1 font-bold">Unconfirmed or failed payments</p>
            </div>

            <div className="bg-gradient-to-br from-indigo-50 to-indigo-100/50 border border-indigo-200/60 p-6 rounded-xl shadow-sm">
              <span className="text-xs font-black text-indigo-800 uppercase tracking-widest">Unique Contributors</span>
              <h3 className="text-2xl font-black text-slate-900 mt-2">
                <strong>{summary?.unique_donors_count || 0}</strong>
              </h3>
              <p className="text-xs text-indigo-700/80 mt-1 font-bold">Registered email donors</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
            {/* Project Distribution breakdown list */}
            <div className="lg:col-span-3 bg-white border border-slate-100 p-6 rounded-xl shadow-sm">
              <div className="flex items-center justify-between mb-6 border-b border-slate-50 pb-4">
                <h4 className="font-extrabold text-slate-800 text-lg flex items-center gap-2">
                  <FolderHeart className="w-5 h-5 text-brand-teal" />
                  Allocated Projects Summary
                </h4>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider">
                      <th className="py-3 px-2">Project Name</th>
                      <th className="py-3 px-2 text-right">Confirmed Total</th>
                      <th className="py-3 px-2 text-right">Pending Total</th>
                      <th className="py-3 px-2 text-center">Receipts</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 font-medium">
                    {summary?.per_project?.map((proj, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/50">
                        <td className="py-3.5 px-2 text-slate-800 font-bold max-w-[200px] truncate">{proj.title}</td>
                        <td className="py-3.5 px-2 text-right text-emerald-600 font-bold">PKR {Number(proj.confirmed).toLocaleString('en-PK')}</td>
                        <td className="py-3.5 px-2 text-right text-amber-600 font-bold">PKR {Number(proj.pending).toLocaleString('en-PK')}</td>
                        <td className="py-3.5 px-2 text-center text-slate-500 font-bold">{proj.count}</td>
                      </tr>
                    ))}
                    {(!summary?.per_project || summary.per_project.length === 0) && (
                      <tr>
                        <td colSpan={4} className="py-8 text-center text-slate-400">No project allocations recorded.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Top Donors leaderboard */}
            <div className="lg:col-span-2 bg-white border border-slate-100 p-6 rounded-xl shadow-sm">
              <div className="flex items-center justify-between mb-6 border-b border-slate-50 pb-4">
                <h4 className="font-extrabold text-slate-800 text-lg flex items-center gap-2">
                  <Users className="w-5 h-5 text-indigo-600" />
                  Honor Roll Leaders
                </h4>
              </div>
              <div className="space-y-4">
                {summary?.top_donors?.map((donor, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl hover:bg-slate-100/70 transition-colors">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-full bg-indigo-50 text-indigo-700 font-bold text-xs flex items-center justify-center shrink-0">
                        {idx + 1}
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-slate-800 text-xs truncate">{donor.donor_name}</p>
                        <p className="text-[10px] text-slate-400 truncate">{donor.email || 'Anonymous'}</p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs font-extrabold text-slate-800">PKR {Number(donor.total_donated).toLocaleString('en-PK')}</p>
                      <p className="text-[9px] text-slate-400 font-bold">{donor.count} donations</p>
                    </div>
                  </div>
                ))}
                {(!summary?.top_donors || summary.top_donors.length === 0) && (
                  <p className="py-8 text-center text-slate-400 text-xs font-semibold">No confirmed donor list available.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- TAB 2: ALL CONTRIBUTIONS --- */}
      {activeTab === 'all' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          {/* Controls: Search, Status pills */}
          <div className="flex flex-col lg:flex-row gap-4 items-stretch lg:items-center justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search by donor, receipt, trx ID, or project..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-11 pr-4 py-3 rounded-2xl border border-[#E5E7EB] outline-none focus:ring-2 focus:ring-[#0D9488] focus:border-[#0D9488] font-medium text-sm bg-white text-[#111827]"
              />
            </div>

            <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200/50 self-start">
              {(['all', 'pending', 'payment_verified', 'confirmed', 'rejected'] as const).map(status => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={`px-4 py-2 rounded-lg text-xs font-bold capitalize transition-all ${
                    statusFilter === status
                      ? 'bg-[#1D2D49] text-white shadow-sm'
                      : 'text-[#6B7280] hover:text-[#1D2D49] hover:bg-[#F3F4F6]'
                  }`}
                >
                  {status === 'payment_verified' ? 'verified' : status}
                </button>
              ))}
            </div>
          </div>

          {/* Audit List Table */}
          <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse min-w-[1000px]">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider">
                    <th className="p-4 pl-6">Receipt / Trx ID</th>
                    <th className="p-4">Donor Info</th>
                    <th className="p-4">Allocated Project</th>
                    <th className="p-4 text-right">Amount</th>
                    <th className="p-4">Method & Date</th>
                    <th className="p-4">Proof</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-center pr-6">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 font-medium text-slate-700">
                  {filteredDonations.map(d => (
                    <tr key={d.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-4 pl-6">
                        {d.receipt_number ? (
                          <div className="font-mono font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded border border-slate-200 inline-block">
                            {d.receipt_number}
                          </div>
                        ) : (
                          <div className="text-slate-400 font-mono">
                            {d.transaction_id || d.id.substring(0, 8) + '...'}
                          </div>
                        )}
                        {d.transaction_id && d.receipt_number && (
                          <div className="text-[10px] text-slate-400 font-mono mt-1" title="Transaction ID">
                            TRX: {d.transaction_id}
                          </div>
                        )}
                      </td>
                      <td className="p-4">
                        <div className="font-bold text-slate-800">{d.donor_name}</div>
                        <div className="text-[10px] text-slate-400 font-semibold mt-0.5">{d.email || d.phone || 'No Contact'}</div>
                      </td>
                      <td className="p-4">
                        <span className="font-bold text-slate-800">{d.projects?.title || 'General Fund'}</span>
                      </td>
                      <td className="p-4 text-right font-bold text-slate-900">
                        PKR {Number(d.amount).toLocaleString('en-PK')}
                      </td>
                      <td className="p-4">
                        <div className="font-bold text-slate-800 capitalize">{d.payment_method.replace('_', ' ')}</div>
                        <div className="text-[10px] text-slate-400 mt-0.5">{new Date(d.created_at).toLocaleString()}</div>
                      </td>
                      <td className="p-4">
                        {d.screenshot_url ? (
                          <button
                            onClick={() => setLightboxImage(d.screenshot_url!)}
                            className="relative group block w-14 h-11 rounded-lg overflow-hidden border border-slate-200 shrink-0"
                          >
                            <img
                              src={optimizeImage(d.screenshot_url, { width: 120 })}
                              alt="Screenshot proof"
                              className="w-full h-full object-cover"
                              width={56}
                              height={44}
                              loading="lazy"
                              decoding="async"
                            />
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                              <Search className="w-3.5 h-3.5 text-white" />
                            </div>
                          </button>
                        ) : (
                          <div className="relative group shrink-0">
                            <input
                              type="file"
                              accept="image/*"
                              onChange={e => e.target.files?.[0] && handleUploadScreenshot(d.id, e.target.files[0])}
                              disabled={uploading}
                              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                            />
                            <div className="w-14 h-11 bg-slate-50 hover:bg-slate-100 rounded-lg flex flex-col items-center justify-center border border-slate-200 border-dashed transition-colors cursor-pointer">
                              {uploading ? (
                                <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
                              ) : (
                                <>
                                  <ImageIcon className="w-3.5 h-3.5 text-slate-400" />
                                  <span className="text-[8px] text-slate-400 font-bold mt-0.5">Upload</span>
                                </>
                              )}
                            </div>
                          </div>
                        )}
                      </td>
                      <td className="p-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border capitalize ${
                          d.status === 'confirmed' ? 'bg-[#D1FAE5] text-[#065F46] border-[#D1FAE5]' :
                          d.status === 'payment_verified' ? 'bg-[#DBEAFE] text-[#1E40AF] border-[#DBEAFE]' :
                          d.status === 'rejected' ? 'bg-[#FEE2E2] text-[#991B1B] border-[#FEE2E2]' :
                          'bg-[#FEF3C7] text-[#92400E] border-[#FEF3C7]'
                        }`}>
                          {d.status === 'payment_verified' ? 'verified' : d.status}
                        </span>
                      </td>
                      <td className="p-4 pr-6 text-center">
                        {d.status === 'pending' ? (
                          <div className="flex items-center justify-center gap-1.5">
                            <AdminButton
                              variant="warning"
                              size="sm"
                              onClick={() => { setSelectedDonation(d); setActionType('verify_payment'); }}
                              title="Verify Payment"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </AdminButton>
                            <AdminButton
                              variant="danger"
                              size="sm"
                              onClick={() => { setSelectedDonation(d); setActionType('reject'); }}
                              title="Reject Donation"
                            >
                              <XCircle className="w-4 h-4" />
                            </AdminButton>
                          </div>
                        ) : d.status === 'payment_verified' ? (
                          <div className="flex items-center justify-center gap-1.5">
                            <AdminButton
                              variant="success"
                              size="sm"
                              onClick={() => { setSelectedDonation(d); setActionType('confirm'); }}
                              title="Confirm & Send Receipt Email"
                            >
                              <UserCheck className="w-4 h-4" />
                            </AdminButton>
                            <AdminButton
                              variant="danger"
                              size="sm"
                              onClick={() => { setSelectedDonation(d); setActionType('reject'); }}
                              title="Reject Donation"
                            >
                              <XCircle className="w-4 h-4" />
                            </AdminButton>
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-400 font-bold">Processed</span>
                        )}
                      </td>
                    </tr>
                  ))}
                  {filteredDonations.length === 0 && (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-slate-400 font-medium">No donation contributions match criteria.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* --- TAB 3: DONOR DIRECTORY --- */}
      {activeTab === 'donors' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          <div className="relative max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search directory by donor name or email..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-3 rounded-2xl border border-[#E5E7EB] outline-none focus:ring-2 focus:ring-[#0D9488] focus:border-[#0D9488] font-medium text-sm bg-white text-[#111827]"
            />
          </div>

          {/* Grid Layout for Donor Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredDonors.map((dp, idx) => {
              const nameParts = dp.name.trim().split(' ');
              const initials = nameParts.length > 1 
                ? (nameParts[0][0] + nameParts[nameParts.length - 1][0]).toUpperCase()
                : (nameParts[0]?.[0] || 'D').toUpperCase();

              return (
                <div key={idx} className="bg-white border border-slate-100 rounded-xl p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
                  <div className="flex gap-4">
                    <div className="w-12 h-12 bg-indigo-50 text-indigo-700 rounded-2xl flex items-center justify-center font-bold text-sm shrink-0">
                      {initials}
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-extrabold text-slate-800 text-sm truncate">{dp.name}</h4>
                      <p className="text-xs text-slate-400 truncate mt-0.5">{dp.email}</p>
                      {dp.phone && <p className="text-[10px] text-slate-400 truncate mt-0.5">{dp.phone}</p>}
                    </div>
                  </div>

                  <div className="mt-6 pt-4 border-t border-slate-50 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Approved</span>
                      <span className="text-sm font-extrabold text-slate-800 mt-1 block">PKR {dp.total.toLocaleString('en-PK')}</span>
                    </div>
                    <button
                      onClick={() => loadDonorHistory(dp.email, dp.name)}
                      className="flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors cursor-pointer"
                    >
                      Audit History
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}

            {filteredDonors.length === 0 && (
              <div className="col-span-full py-12 text-center text-slate-400 font-medium">No donor directory records match criteria.</div>
            )}
          </div>
        </div>
      )}

      {/* --- CONFIRMATION ACTION DIALOG MODAL --- */}
      <AnimatePresence>
        {selectedDonation && actionType && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
              onClick={() => setSelectedDonation(null)}
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative bg-white w-full max-w-md rounded-[2rem] p-6 shadow-2xl overflow-hidden z-10"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-extrabold text-slate-900">
                  {actionType === 'verify_payment' ? 'Verify Payment' :
                   actionType === 'confirm' ? 'Confirm Donation' : 'Reject Transaction'}
                </h3>
                <button
                  onClick={() => { setSelectedDonation(null); setActionType(null); setNotes(''); }}
                  className="p-1.5 rounded-full hover:bg-slate-50 transition-colors"
                >
                  <X className="w-5 h-5 text-slate-400" />
                </button>
              </div>

              <div className="space-y-4">
                <p className="text-sm text-slate-600 leading-relaxed">
                  {actionType === 'verify_payment' ? (
                    <>
                      Are you sure you want to verify the payment of <strong>PKR {Number(selectedDonation.amount).toLocaleString('en-PK')}</strong> from <strong>{selectedDonation.donor_name}</strong>?
                      This will change the status to "payment_verified" and allow confirming it to generate a receipt.
                    </>
                  ) : actionType === 'confirm' ? (
                    <>
                      Are you sure you want to approve this donation of <strong>PKR {Number(selectedDonation.amount).toLocaleString('en-PK')}</strong> from <strong>{selectedDonation.donor_name}</strong>?
                      This will generate an official receipt number and automatically trigger a thank you email.
                    </>
                  ) : (
                    <>
                      Are you sure you want to reject this contribution from <strong>{selectedDonation.donor_name}</strong>? This status change will be recorded in the dashboard.
                    </>
                  )}
                </p>

                {actionType === 'confirm' && selectedDonation.verification_notes && (
                  <div className="bg-yellow-50 text-yellow-800 p-3 rounded-lg border border-yellow-100 text-[11px] leading-relaxed">
                    <p className="font-bold mb-1">Payment Verification Notes:</p>
                    <p className="italic">{selectedDonation.verification_notes}</p>
                  </div>
                )}

                <div>
                  <label htmlFor="action-notes" className="block text-xs font-semibold text-[#111827] mb-2">
                    {actionType === 'verify_payment' ? 'Verification Notes (Optional but Recommended)' : 'Internal Review Notes (Optional)'}
                  </label>
                  <textarea
                    id="action-notes"
                    rows={3}
                    placeholder={actionType === 'verify_payment' 
                      ? "e.g., Verified bank transfer reference TRX-12345" 
                      : "Input details or reasons for rejection..."}
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    className="w-full px-3 py-2 text-[#111827] bg-white border border-[#E5E7EB] rounded-lg placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#0D9488] focus:border-[#0D9488] disabled:bg-[#F9FAFB] disabled:text-[#6B7280] disabled:cursor-not-allowed transition-colors duration-150 text-sm"
                  />
                </div>

                <div className="flex gap-3 pt-4 border-t border-[#E5E7EB]">
                  <AdminButton
                    type="button"
                    variant="ghost"
                    className="flex-1"
                    onClick={() => { setSelectedDonation(null); setActionType(null); setNotes(''); }}
                    disabled={isActionProcessing}
                  >
                    Cancel
                  </AdminButton>
                  <AdminButton
                    type="button"
                    variant={actionType === 'verify_payment' ? 'warning' : actionType === 'confirm' ? 'success' : 'danger'}
                    className="flex-1"
                    onClick={handleAction}
                    isLoading={isActionProcessing}
                  >
                    {actionType === 'verify_payment' ? 'Verify Payment' :
                     actionType === 'confirm' ? 'Confirm & Send' : 'Reject'}
                  </AdminButton>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- SCREENSHOT PROOF LIGHTBOX --- */}
      <AnimatePresence>
        {lightboxImage && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/80"
              onClick={() => setLightboxImage(null)}
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative max-w-4xl w-full max-h-[90vh] flex flex-col items-center justify-center z-10"
            >
              <button
                onClick={() => setLightboxImage(null)}
                className="absolute -top-12 right-0 p-2 text-white/80 hover:text-white transition-colors"
                aria-label="Close Preview"
              >
                <X className="w-6 h-6" />
              </button>
              <img
                src={optimizeImage(lightboxImage, { width: 1200 })}
                alt="Payment Proof Fullscreen"
                className="max-w-full max-h-[80vh] object-contain rounded-2xl border border-white/10 shadow-2xl"
                width={1000}
                height={750}
                decoding="async"
              />
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- DONOR HISTORY SIDE-DRAWER PANEL --- */}
      <AnimatePresence>
        {selectedDonor && (
          <div className="fixed inset-0 z-50 overflow-hidden">
            <div className="absolute inset-0 overflow-hidden">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-slate-900/30 backdrop-blur-sm transition-opacity"
                onClick={() => setSelectedDonor(null)}
              />

              <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10">
                <motion.div
                  initial={{ x: '100%' }}
                  animate={{ x: 0 }}
                  exit={{ x: '100%' }}
                  transition={{ type: 'spring', damping: 25, stiffness: 220 }}
                  className="pointer-events-auto w-screen max-w-xl"
                >
                  <div className="flex h-full flex-col overflow-y-scroll bg-white shadow-2xl border-l border-slate-100">
                    {/* Drawer Header */}
                    <div className="bg-slate-50 border-b border-slate-100 p-6 flex items-center justify-between">
                      <div className="min-w-0">
                        <h3 className="text-lg font-extrabold text-slate-800 truncate flex items-center gap-2">
                          <UserCheck className="w-5 h-5 text-indigo-600" />
                          Donor Contribution Sheet
                        </h3>
                        <p className="text-xs text-slate-400 font-semibold truncate mt-0.5">{selectedDonor.name} &bull; {selectedDonor.email}</p>
                      </div>
                      <button
                        onClick={() => setSelectedDonor(null)}
                        className="p-1.5 rounded-full hover:bg-slate-200 transition-colors"
                      >
                        <X className="w-5 h-5 text-slate-400" />
                      </button>
                    </div>

                    {/* Drawer Body content */}
                    <div className="flex-1 p-6 space-y-6">
                      {loadingDonorHistory ? (
                        <div className="flex flex-col items-center justify-center py-20 space-y-3">
                          <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
                          <p className="text-slate-400 text-xs font-semibold">Loading histories...</p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider">Historical Receipts Log</h4>
                          {donorHistory.map((item, idx) => (
                            <div key={idx} className="border border-slate-100 rounded-2xl p-4 bg-slate-50 hover:bg-slate-100/40 transition-colors space-y-3">
                              <div className="flex items-center justify-between">
                                <span className="font-mono text-xs font-bold text-slate-700 bg-white px-2 py-0.5 rounded border border-slate-100">
                                  {item.receipt_number || 'TRX ID: ' + (item.transaction_id || item.id.substring(0,8))}
                                </span>
                                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold capitalize border ${
                                  item.status === 'confirmed' ? 'bg-[#D1FAE5] text-[#065F46] border-[#D1FAE5]' :
                                  item.status === 'rejected' ? 'bg-[#FEE2E2] text-[#991B1B] border-[#FEE2E2]' :
                                  'bg-[#FEF3C7] text-[#92400E] border-[#FEF3C7]'
                                }`}>
                                  {item.status}
                                </span>
                              </div>

                              <div className="flex items-center justify-between text-xs">
                                <div>
                                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Allocated Project</p>
                                  <p className="font-bold text-slate-800 mt-0.5">{item.projects?.title || 'General Fund'}</p>
                                </div>
                                <div className="text-right">
                                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Amount</p>
                                  <p className="font-extrabold text-slate-900 mt-0.5">PKR {Number(item.amount).toLocaleString('en-PK')}</p>
                                </div>
                              </div>

                              <div className="flex justify-between items-center text-[10px] text-slate-400 font-semibold border-t border-slate-100/50 pt-2">
                                <span>Method: {item.payment_method}</span>
                                <span>{new Date(item.created_at).toLocaleDateString()}</span>
                              </div>

                              {item.notes && (
                                <div className="text-[10px] bg-slate-100 text-slate-600 px-3 py-2 rounded-xl border border-slate-200/40 italic">
                                  <strong>Admin note:</strong> {item.notes}
                                </div>
                              )}
                            </div>
                          ))}

                          {donorHistory.length === 0 && (
                            <p className="text-center text-slate-400 py-12 text-sm font-medium">No verified contributions for this donor.</p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
