import React, { useState, useEffect, useCallback } from 'react';
import { Inbox, Eye, CheckCircle, XCircle, Trash2, Search, Filter, ChevronDown, ChevronUp, Loader2, ExternalLink } from 'lucide-react';
import { fetchApi } from '../../lib/apiClient';
import { Modal } from '../../components/ui/Modal';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { AdminButton } from './AdminButton';
import { optimizeImage } from '../../lib/optimizeImage';

// ─── Types ────────────────────────────────────────────────────────────────────
interface ImpactStorySubmission {
  id: string;
  submitter_name: string;
  submitter_email: string;
  submitter_phone?: string | null;
  submitter_location?: string | null;
  title_en: string;
  title_ur?: string | null;
  story_en: string;
  story_ur?: string | null;
  excerpt_en?: string | null;
  excerpt_ur?: string | null;
  category: string;
  image_url?: string | null;
  program_name?: string | null;
  year_of_impact?: number | null;
  consent_to_publish: boolean;
  consent_to_edit: boolean;
  status: 'pending' | 'approved' | 'rejected';
  admin_notes?: string | null;
  rejection_reason?: string | null;
  reviewed_at?: string | null;
  published_story_id?: string | null;
  submitted_at: string;
}

interface TestimonialSubmission {
  id: string;
  submitter_name: string;
  submitter_email: string;
  submitter_phone?: string | null;
  submitter_location: string;
  quote_en: string;
  quote_ur?: string | null;
  photo_url?: string | null;
  display_name?: string | null;
  display_initial?: string | null;
  bg_color: string;
  consent_to_publish: boolean;
  consent_to_use_photo: boolean;
  status: 'pending' | 'approved' | 'rejected';
  admin_notes?: string | null;
  rejection_reason?: string | null;
  reviewed_at?: string | null;
  published_testimonial_id?: string | null;
  submitted_at: string;
}

type Tab = 'stories' | 'testimonials';
type StatusFilter = 'all' | 'pending' | 'approved' | 'rejected';

// ─── Status Badge ─────────────────────────────────────────────────────────────
const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const map: Record<string, string> = {
    pending:  'bg-amber-100 text-amber-700 border border-amber-200',
    approved: 'bg-green-100 text-green-700 border border-green-200',
    rejected: 'bg-red-100 text-red-700 border border-red-200',
  };
  return (
    <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${map[status] || 'bg-gray-100 text-gray-500'}`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────
export const AdminSubmissions: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('stories');
  const [stories, setStories] = useState<ImpactStorySubmission[]>([]);
  const [testimonials, setTestimonials] = useState<TestimonialSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [search, setSearch] = useState('');

  // Modals
  const [viewItem, setViewItem] = useState<ImpactStorySubmission | TestimonialSubmission | null>(null);
  const [reviewItem, setReviewItem] = useState<ImpactStorySubmission | TestimonialSubmission | null>(null);
  const [deleteItem, setDeleteItem] = useState<ImpactStorySubmission | TestimonialSubmission | null>(null);
  const [rejectItem, setRejectItem] = useState<ImpactStorySubmission | TestimonialSubmission | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [saving, setSaving] = useState(false);

  // Edit form state for review modal
  const [editData, setEditData] = useState<Record<string, string>>({})

  const toast = (message: string, variant: 'success' | 'error' = 'success') =>
    window.dispatchEvent(new CustomEvent('app-toast', { detail: { message, variant } }));

  const loadStories = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.set('status', statusFilter);
      if (search) params.set('search', search);
      const { data } = await fetchApi<ImpactStorySubmission[]>(`/impact-stories/submissions?${params}`);
      setStories(data || []);
    } catch { toast('Failed to load story submissions', 'error'); }
    finally { setLoading(false); }
  }, [statusFilter, search]);

  const loadTestimonials = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.set('status', statusFilter);
      if (search) params.set('search', search);
      const { data } = await fetchApi<TestimonialSubmission[]>(`/testimonials/submissions?${params}`);
      setTestimonials(data || []);
    } catch { toast('Failed to load testimonial submissions', 'error'); }
    finally { setLoading(false); }
  }, [statusFilter, search]);

  useEffect(() => {
    if (activeTab === 'stories') loadStories();
    else loadTestimonials();
  }, [activeTab, loadStories, loadTestimonials]);

  const pendingStoriesCount = stories.filter(s => s.status === 'pending').length;
  const pendingTestimonialsCount = testimonials.filter(t => t.status === 'pending').length;

  // ── Approve ──────────────────────────────────────────────────────────────────
  const handleApprove = async (item: ImpactStorySubmission | TestimonialSubmission, extraData?: Record<string, string>) => {
    setSaving(true);
    try {
      const endpoint = activeTab === 'stories'
        ? `/impact-stories/submissions/${item.id}`
        : `/testimonials/submissions/${item.id}`;
      const payload: Record<string, unknown> = { action: 'approve', ...editData, ...extraData };
      const { error } = await fetchApi(endpoint, { method: 'PATCH', body: JSON.stringify(payload) });
      if (error) throw new Error(error);
      toast('✅ Approved and published successfully!');
      setReviewItem(null);
      setEditData({});
      if (activeTab === 'stories') loadStories(); else loadTestimonials();
    } catch (e: any) {
      toast(e.message || 'Failed to approve', 'error');
    } finally { setSaving(false); }
  };

  // ── Reject ───────────────────────────────────────────────────────────────────
  const handleReject = async () => {
    if (!rejectItem) return;
    setSaving(true);
    try {
      const endpoint = activeTab === 'stories'
        ? `/impact-stories/submissions/${rejectItem.id}`
        : `/testimonials/submissions/${rejectItem.id}`;
      const { error } = await fetchApi(endpoint, {
        method: 'PATCH',
        body: JSON.stringify({ action: 'reject', rejection_reason: rejectionReason || null }),
      });
      if (error) throw new Error(error);
      toast('Submission rejected.');
      setRejectItem(null);
      setRejectionReason('');
      if (activeTab === 'stories') loadStories(); else loadTestimonials();
    } catch (e: any) {
      toast(e.message || 'Failed to reject', 'error');
    } finally { setSaving(false); }
  };

  // ── Delete ───────────────────────────────────────────────────────────────────
  const handleDelete = async () => {
    if (!deleteItem) return;
    try {
      const endpoint = activeTab === 'stories'
        ? `/impact-stories/submissions/${deleteItem.id}`
        : `/testimonials/submissions/${deleteItem.id}`;
      const { error } = await fetchApi(endpoint, { method: 'DELETE' });
      if (error) throw new Error(error);
      toast('Submission deleted.');
      setDeleteItem(null);
      if (activeTab === 'stories') loadStories(); else loadTestimonials();
    } catch (e: any) {
      toast(e.message || 'Failed to delete', 'error');
    }
  };

  // ── Open Review Modal ─────────────────────────────────────────────────────────
  const openReview = (item: ImpactStorySubmission | TestimonialSubmission) => {
    setReviewItem(item);
    if (activeTab === 'stories') {
      const s = item as ImpactStorySubmission;
      setEditData({
        title_en:   s.title_en || '',
        title_ur:   s.title_ur || '',
        excerpt_en: s.excerpt_en || '',
        excerpt_ur: s.excerpt_ur || '',
        story_en:   s.story_en || '',
        story_ur:   s.story_ur || '',
        category:   s.category || 'General',
        admin_notes: s.admin_notes || '',
      });
    } else {
      const t = item as TestimonialSubmission;
      setEditData({
        quote_en:       t.quote_en || '',
        quote_ur:       t.quote_ur || '',
        display_name:   t.display_name || t.submitter_name || '',
        display_initial: t.display_initial || t.submitter_name[0] || '',
        bg_color:       t.bg_color || 'white',
        admin_notes:    t.admin_notes || '',
      });
    }
  };

  const ed = (key: string) => editData[key] || '';
  const setEd = (key: string, val: string) => setEditData(prev => ({ ...prev, [key]: val }));

  const inputCls = 'w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-teal/30 focus:border-brand-teal';

  const currentItems = activeTab === 'stories' ? stories : testimonials;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Inbox className="w-8 h-8 text-brand-teal" />
            Community Submissions
          </h1>
          <p className="text-gray-500 mt-1">Review and moderate public-submitted impact stories and testimonials</p>
        </div>
        {(pendingStoriesCount + pendingTestimonialsCount) > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-2 text-sm text-amber-700 font-medium">
            🔔 {pendingStoriesCount + pendingTestimonialsCount} pending review
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 mb-6">
        {(['stories', 'testimonials'] as Tab[]).map(tab => {
          const pendingCount = tab === 'stories' ? pendingStoriesCount : pendingTestimonialsCount;
          return (
            <button
              key={tab}
              onClick={() => { setActiveTab(tab); setStatusFilter('all'); setSearch(''); }}
              className={`px-6 py-3 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 ${
                activeTab === tab
                  ? 'border-brand-teal text-brand-teal'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab === 'stories' ? 'Impact Stories' : 'Testimonials'}
              {pendingCount > 0 && (
                <span className="bg-amber-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">{pendingCount}</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name, email, or title..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-teal/30"
          />
        </div>
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value as StatusFilter)}
          className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-teal/30 bg-white"
        >
          <option value="all">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 text-brand-teal animate-spin" />
          </div>
        ) : currentItems.length === 0 ? (
          <div className="py-16 text-center text-gray-400">
            <Inbox className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>No submissions found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="p-4 font-semibold text-gray-600 text-sm">Submitter</th>
                  <th className="p-4 font-semibold text-gray-600 text-sm">Location</th>
                  <th className="p-4 font-semibold text-gray-600 text-sm">{activeTab === 'stories' ? 'Title' : 'Quote Preview'}</th>
                  <th className="p-4 font-semibold text-gray-600 text-sm">Date</th>
                  <th className="p-4 font-semibold text-gray-600 text-sm">Status</th>
                  <th className="p-4 font-semibold text-gray-600 text-sm text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {currentItems.map(item => (
                  <tr key={item.id} className="border-b border-gray-50 hover:bg-gray-50/60 transition-colors">
                    <td className="p-4">
                      <p className="font-semibold text-sm text-gray-900">{item.submitter_name}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{item.submitter_email}</p>
                    </td>
                    <td className="p-4 text-sm text-gray-500">{item.submitter_location || '—'}</td>
                    <td className="p-4 max-w-xs">
                      <p className="text-sm text-gray-700 truncate">
                        {activeTab === 'stories'
                          ? (item as ImpactStorySubmission).title_en
                          : (item as TestimonialSubmission).quote_en.slice(0, 80) + '...'}
                      </p>
                      {activeTab === 'stories' && (
                        <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full mt-1 inline-block">
                          {(item as ImpactStorySubmission).category}
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-sm text-gray-400 whitespace-nowrap">
                      {new Date(item.submitted_at).toLocaleDateString()}
                    </td>
                    <td className="p-4">
                      <StatusBadge status={item.status} />
                    </td>
                    <td className="p-4">
                      <div className="flex items-center justify-end gap-1.5">
                        <AdminButton variant="outline" size="sm" onClick={() => setViewItem(item)} title="View">
                          <Eye className="w-4 h-4" />
                        </AdminButton>
                        {item.status === 'pending' && (
                          <AdminButton variant="primary" size="sm" onClick={() => openReview(item)} title="Review">
                            Review
                          </AdminButton>
                        )}
                        <AdminButton variant="danger" size="sm" onClick={() => setDeleteItem(item)} title="Delete">
                          <Trash2 className="w-4 h-4" />
                        </AdminButton>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── View Modal (Read-Only) ───────────────────────────────────────────── */}
      <Modal isOpen={!!viewItem} onClose={() => setViewItem(null)} title="Submission Details" maxWidth="max-w-3xl">
        {viewItem && (
          <div className="space-y-4 max-h-[75vh] overflow-y-auto px-1">
            <div className="grid grid-cols-2 gap-4 bg-gray-50 rounded-xl p-4">
              <div><p className="text-xs text-gray-400 mb-1">Name</p><p className="font-semibold text-sm">{viewItem.submitter_name}</p></div>
              <div><p className="text-xs text-gray-400 mb-1">Email</p><p className="text-sm">{viewItem.submitter_email}</p></div>
              <div><p className="text-xs text-gray-400 mb-1">Location</p><p className="text-sm">{viewItem.submitter_location || '—'}</p></div>
              <div><p className="text-xs text-gray-400 mb-1">Submitted</p><p className="text-sm">{new Date(viewItem.submitted_at).toLocaleString()}</p></div>
              <div><p className="text-xs text-gray-400 mb-1">Status</p><StatusBadge status={viewItem.status} /></div>
              {viewItem.status === 'rejected' && (viewItem as ImpactStorySubmission).rejection_reason && (
                <div className="col-span-2"><p className="text-xs text-gray-400 mb-1">Rejection Reason</p><p className="text-sm text-red-600">{(viewItem as ImpactStorySubmission).rejection_reason}</p></div>
              )}
            </div>

            {activeTab === 'stories' ? (
              <>
                <div><p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Title</p><p className="font-semibold text-lg">{(viewItem as ImpactStorySubmission).title_en}</p></div>
                {(viewItem as ImpactStorySubmission).title_ur && <div dir="rtl" className="font-urduHeading">{(viewItem as ImpactStorySubmission).title_ur}</div>}
                <div><p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Category</p><span className="bg-brand-teal/10 text-brand-teal text-xs font-semibold px-3 py-1 rounded-full">{(viewItem as ImpactStorySubmission).category}</span></div>
                {(viewItem as ImpactStorySubmission).program_name && <div><p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">IOCA Program</p><p className="text-sm">{(viewItem as ImpactStorySubmission).program_name}</p></div>}
                {(viewItem as ImpactStorySubmission).image_url && <div><p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Photo</p><img src={optimizeImage((viewItem as ImpactStorySubmission).image_url!, { width: 400 })} alt="Story" className="w-full max-w-sm rounded-xl object-cover h-48" /></div>}
                <div><p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Full Story</p><div className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap bg-gray-50 rounded-xl p-4">{(viewItem as ImpactStorySubmission).story_en}</div></div>
                {(viewItem as ImpactStorySubmission).story_ur && <div dir="rtl"><p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 text-right">اردو کہانی</p><div className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap bg-gray-50 rounded-xl p-4 font-urduBody">{(viewItem as ImpactStorySubmission).story_ur}</div></div>}
              </>
            ) : (
              <>
                <div><p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Testimonial</p><div className="text-base text-gray-700 leading-relaxed bg-gray-50 rounded-xl p-4 italic">"{(viewItem as TestimonialSubmission).quote_en}"</div></div>
                {(viewItem as TestimonialSubmission).quote_ur && <div dir="rtl"><p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 text-right">اردو</p><div className="text-base text-gray-700 leading-relaxed bg-gray-50 rounded-xl p-4 font-urduBody">"{(viewItem as TestimonialSubmission).quote_ur}"</div></div>}
                {(viewItem as TestimonialSubmission).photo_url && <div><p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Photo</p><img src={optimizeImage((viewItem as TestimonialSubmission).photo_url!, { width: 200 })} alt="Submitter" className="w-20 h-20 rounded-full object-cover" /></div>}
              </>
            )}

            <div className="flex justify-end gap-3 pt-4 border-t">
              {viewItem.status === 'pending' && (
                <AdminButton variant="accent" onClick={() => { setViewItem(null); openReview(viewItem); }}>Review & Moderate</AdminButton>
              )}
              <AdminButton variant="ghost" onClick={() => setViewItem(null)}>Close</AdminButton>
            </div>
          </div>
        )}
      </Modal>

      {/* ── Review & Edit Modal ─────────────────────────────────────────────── */}
      <Modal isOpen={!!reviewItem} onClose={() => { setReviewItem(null); setEditData({}); }} title="Review Submission" maxWidth="max-w-5xl">
        {reviewItem && (
          <div className="max-h-[80vh] overflow-y-auto px-1">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

              {/* Left: Original submitted content (read-only) */}
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider border-b pb-2">Original Submission</h3>
                <div className="bg-gray-50 rounded-xl p-4 space-y-3 text-sm">
                  <p><span className="font-semibold text-gray-500">Name:</span> {reviewItem.submitter_name}</p>
                  <p><span className="font-semibold text-gray-500">Email:</span> {reviewItem.submitter_email}</p>
                  <p><span className="font-semibold text-gray-500">Location:</span> {reviewItem.submitter_location || '—'}</p>
                  {activeTab === 'stories' && (
                    <>
                      <p><span className="font-semibold text-gray-500">Title:</span> {(reviewItem as ImpactStorySubmission).title_en}</p>
                      <p><span className="font-semibold text-gray-500">Category:</span> {(reviewItem as ImpactStorySubmission).category}</p>
                      {(reviewItem as ImpactStorySubmission).program_name && <p><span className="font-semibold text-gray-500">Program:</span> {(reviewItem as ImpactStorySubmission).program_name}</p>}
                      <div className="bg-white border border-gray-200 rounded-lg p-3 max-h-48 overflow-y-auto">
                        <p className="text-gray-600 whitespace-pre-wrap leading-relaxed">{(reviewItem as ImpactStorySubmission).story_en}</p>
                      </div>
                      {(reviewItem as ImpactStorySubmission).image_url && (
                        <img src={optimizeImage((reviewItem as ImpactStorySubmission).image_url!, { width: 300 })} alt="Submitted" className="w-full h-32 object-cover rounded-lg" />
                      )}
                    </>
                  )}
                  {activeTab === 'testimonials' && (
                    <>
                      <div className="bg-white border border-gray-200 rounded-lg p-3">
                        <p className="text-gray-600 italic leading-relaxed">"{(reviewItem as TestimonialSubmission).quote_en}"</p>
                      </div>
                      {(reviewItem as TestimonialSubmission).photo_url && (
                        <img src={optimizeImage((reviewItem as TestimonialSubmission).photo_url!, { width: 100 })} alt="Photo" className="w-16 h-16 rounded-full object-cover" />
                      )}
                    </>
                  )}
                </div>
              </div>

              {/* Right: Admin edit form */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-brand-teal uppercase tracking-wider border-b pb-2">Edit Before Publishing</h3>

                {activeTab === 'stories' ? (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 mb-1">Title (English)</label>
                      <input type="text" value={ed('title_en')} onChange={e => setEd('title_en', e.target.value)} className={inputCls} />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 mb-1">Title (Urdu)</label>
                      <input type="text" dir="rtl" value={ed('title_ur')} onChange={e => setEd('title_ur', e.target.value)} className={`${inputCls} font-urduBody`} />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 mb-1">Excerpt (English) — shown on listing</label>
                      <textarea rows={2} value={ed('excerpt_en')} onChange={e => setEd('excerpt_en', e.target.value)} className={inputCls} placeholder="Write a brief excerpt for the listing page..." />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 mb-1">Excerpt (Urdu)</label>
                      <textarea rows={2} dir="rtl" value={ed('excerpt_ur')} onChange={e => setEd('excerpt_ur', e.target.value)} className={`${inputCls} font-urduBody`} />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 mb-1">Full Story (English)</label>
                      <textarea rows={6} value={ed('story_en')} onChange={e => setEd('story_en', e.target.value)} className={inputCls} />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 mb-1">Full Story (Urdu)</label>
                      <textarea rows={5} dir="rtl" value={ed('story_ur')} onChange={e => setEd('story_ur', e.target.value)} className={`${inputCls} font-urduBody`} />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 mb-1">Category</label>
                      <select value={ed('category')} onChange={e => setEd('category', e.target.value)} className={inputCls}>
                        {['Health','Education','Youth','Women','Water','Emergency','General'].map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 mb-1">Display Name (can anonymize)</label>
                      <input type="text" value={ed('display_name')} onChange={e => { setEd('display_name', e.target.value); if (e.target.value) setEd('display_initial', e.target.value[0].toUpperCase()); }} className={inputCls} />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 mb-1">Initial (1 letter — shown in avatar)</label>
                      <input type="text" maxLength={1} value={ed('display_initial')} onChange={e => setEd('display_initial', e.target.value.toUpperCase())} className={inputCls} />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 mb-1">Testimonial (English)</label>
                      <textarea rows={4} value={ed('quote_en')} onChange={e => setEd('quote_en', e.target.value)} className={inputCls} />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 mb-1">Testimonial (Urdu)</label>
                      <textarea rows={4} dir="rtl" value={ed('quote_ur')} onChange={e => setEd('quote_ur', e.target.value)} className={`${inputCls} font-urduBody`} />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 mb-1">Card Color</label>
                      <select value={ed('bg_color')} onChange={e => setEd('bg_color', e.target.value)} className={inputCls}>
                        <option value="white">White (default)</option>
                        <option value="teal">Teal (accent)</option>
                      </select>
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Admin Notes (internal, not shown publicly)</label>
                  <textarea rows={2} value={ed('admin_notes')} onChange={e => setEd('admin_notes', e.target.value)} className={inputCls} placeholder="Internal notes about this submission..." />
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-6 mt-6 border-t">
              <div className="flex gap-2">
                <AdminButton
                  variant="danger"
                  disabled={saving}
                  onClick={() => { setRejectItem(reviewItem); setReviewItem(null); setEditData({}); }}
                >
                  <XCircle className="w-4 h-4 mr-1" /> Reject
                </AdminButton>
                <AdminButton variant="ghost" onClick={() => { setReviewItem(null); setEditData({}); }} disabled={saving}>Cancel</AdminButton>
              </div>
              <AdminButton
                variant="accent"
                disabled={saving}
                onClick={() => handleApprove(reviewItem)}
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <CheckCircle className="w-4 h-4 mr-1" />}
                {saving ? 'Publishing...' : 'Approve & Publish'}
              </AdminButton>
            </div>
          </div>
        )}
      </Modal>

      {/* ── Reject Modal ───────────────────────────────────────────────────── */}
      <Modal isOpen={!!rejectItem} onClose={() => { setRejectItem(null); setRejectionReason(''); }} title="Reject Submission" maxWidth="max-w-lg">
        {rejectItem && (
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              You are about to reject the submission by <strong>{rejectItem.submitter_name}</strong>.
            </p>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Rejection Reason (Optional)</label>
              <textarea
                rows={4}
                value={rejectionReason}
                onChange={e => setRejectionReason(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-300"
                placeholder="Explain why this submission cannot be published. This will be noted internally."
              />
            </div>
            <div className="flex justify-end gap-3 pt-2 border-t">
              <AdminButton variant="ghost" onClick={() => { setRejectItem(null); setRejectionReason(''); }} disabled={saving}>Cancel</AdminButton>
              <AdminButton variant="danger" onClick={handleReject} disabled={saving}>
                {saving ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
                Confirm Rejection
              </AdminButton>
            </div>
          </div>
        )}
      </Modal>

      {/* ── Delete Confirm ──────────────────────────────────────────────────── */}
      <ConfirmDialog
        isOpen={!!deleteItem}
        onClose={() => setDeleteItem(null)}
        onConfirm={handleDelete}
        title="Delete Submission"
        message={`Permanently delete the submission from "${deleteItem?.submitter_name}"? This cannot be undone.`}
        confirmLabel="Delete"
        isDestructive={true}
      />
    </div>
  );
};
