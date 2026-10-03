import { useState, useEffect } from 'react';
import { fetchApi } from '../../lib/apiClient';
import { Modal } from '../../components/ui/Modal';
import { AdminButton } from './AdminButton';

interface Application {
  id: string;
  user_id: string;
  status: 'pending' | 'under_review' | 'approved' | 'rejected';
  full_name: string;
  email: string;
  phone: string;
  cnic?: string;
  address?: string;
  occupation?: string;
  motivation: string;
  submitted_at: string;
  admin_notes?: string;
  zones?: { name: string; city: string };
  tiers?: { name: string; price: number };
  profiles?: { name: string; email: string };
}

export function AdminApplications() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [rejectNotes, setRejectNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Payment recording state
  const [isApproveModalOpen, setIsApproveModalOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('bank_transfer');
  const [paymentRef, setPaymentRef] = useState('');

  const [viewingApplication, setViewingApplication] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    loadApplications();
  }, []);

  const loadApplications = async () => {
    try {
      setLoading(true);
      const { data } = await fetchApi('/admin/applications');
      setApplications(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      window.dispatchEvent(new CustomEvent('app-toast', { detail: { message: 'Failed to load applications', variant: 'error' } }));
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (id: string, status: 'under_review' | 'approved' | 'rejected', notes?: string, pMethod?: string, pRef?: string) => {
    try {
      setSubmitting(true);
      const { error } = await fetchApi(`/admin/applications/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status, adminNotes: notes, paymentMethod: pMethod, paymentRef: pRef }),
      });
      if (error) throw new Error(error);

      window.dispatchEvent(new CustomEvent('app-toast', { detail: { message: `Application marked as ${status}`, variant: 'success' } }));
      
      setIsRejectModalOpen(false);
      setIsApproveModalOpen(false);
      // Update local state
      setApplications(apps => apps.map(app => 
        app.id === id ? { ...app, status, admin_notes: notes || app.admin_notes } : app
      ));
      
      setIsRejectModalOpen(false);
    } catch (err: any /* fixed M-01 */) {
      window.dispatchEvent(new CustomEvent('app-toast', { detail: { message: err.message || 'Update failed', variant: 'error' } }));
    } finally {
      setSubmitting(false);
    }
  };

  const filteredApplications = applications.filter(app => {
    const matchesSearch = !searchQuery || 
      app.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.phone?.includes(searchQuery);
    const matchesStatus = statusFilter === 'all' || app.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return <div className="animate-pulse">Loading applications...</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Membership Applications</h2>
          <p className="text-sm text-gray-500 mt-1">Review and manage incoming membership requests</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-3 mb-4">
        <input
          type="text"
          placeholder="Search by name, email, phone..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="flex-1 min-w-[200px] border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-teal/30"
        />
        <div className="flex gap-2">
          {['all', 'pending', 'approved', 'rejected'].map(status => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-colors ${
                statusFilter === status
                  ? 'bg-brand-navy text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >{status === 'all' ? 'All' : status}</button>
          ))}
        </div>
      </div>

      <div className="bg-white border border-[#E5E7EB] rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-[#6B7280] bg-[#F9FAFB] border-b border-[#E5E7EB] uppercase tracking-wider font-semibold">
              <tr>
                <th className="px-6 py-4 font-semibold">Applicant</th>
                <th className="px-6 py-4 font-semibold">Zone</th>
                <th className="px-6 py-4 font-semibold">Tier</th>
                <th className="px-6 py-4 font-semibold">Submitted</th>
                <th className="px-6 py-4 font-semibold">Status</th>
                <th className="px-6 py-4 font-semibold text-right pr-8">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E7EB]">
              {filteredApplications.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    No applications found
                  </td>
                </tr>
              ) : (
                filteredApplications.map(app => (
                  <tr key={app.id} className="hover:bg-[#F9FAFB] transition-colors duration-100 text-[#111827] text-sm">
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">{app.full_name}</div>
                      <div className="text-gray-500 text-xs">{app.email}</div>
                      <div className="text-xs text-gray-400 mt-1">{app.phone}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">{app.zones?.name || '—'}</div>
                      <div className="text-gray-500 text-xs">{app.zones?.city || '—'}</div>
                    </td>
                    <td className="px-6 py-4 font-medium text-gray-900">
                      {app.tiers?.name || '—'}
                    </td>
                    <td className="px-6 py-4 text-gray-500">
                      {new Date(app.submitted_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border capitalize ${
                        app.status === 'approved' ? 'bg-[#D1FAE5] text-[#065F46] border-[#D1FAE5]' :
                        app.status === 'rejected' ? 'bg-[#FEE2E2] text-[#991B1B] border-[#FEE2E2]' :
                        app.status === 'under_review' ? 'bg-[#DBEAFE] text-[#1E40AF] border-[#DBEAFE]' :
                        'bg-[#FEF3C7] text-[#92400E] border-[#FEF3C7]'
                      }`}>
                        {app.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 pr-8">
                      <div className="flex items-center justify-end flex-wrap gap-2">
                        {app.status === 'pending' && (
                          <AdminButton 
                            onClick={() => handleUpdateStatus(app.id, 'under_review')}
                            disabled={submitting}
                            variant="warning"
                            size="sm"
                          >
                            Review
                          </AdminButton>
                        )}
                        
                        {(app.status === 'pending' || app.status === 'under_review') && (
                          <>
                            <AdminButton 
                              onClick={() => {
                                setSelectedApp(app);
                                setPaymentMethod('bank_transfer');
                                setPaymentRef('');
                                setIsApproveModalOpen(true);
                              }}
                              disabled={submitting}
                              variant="success"
                              size="sm"
                            >
                              Approve
                            </AdminButton>
                            
                            <AdminButton 
                              onClick={() => {
                                setSelectedApp(app);
                                setRejectNotes('');
                                setIsRejectModalOpen(true);
                              }}
                              disabled={submitting}
                              variant="danger"
                              size="sm"
                            >
                              Reject
                            </AdminButton>
                          </>
                        )}

                        <AdminButton 
                          onClick={() => setViewingApplication(app)}
                          variant="ghost"
                          size="sm"
                          title="View Details"
                        >
                          Info
                        </AdminButton>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal
        isOpen={isRejectModalOpen}
        onClose={() => !submitting && setIsRejectModalOpen(false)}
        title="Reject Application"
      >
        <div className="p-4 space-y-4">
          <p className="text-sm text-gray-600">
            Are you sure you want to reject <strong>{selectedApp?.full_name}</strong>'s application? This action cannot be undone.
          </p>
          <div>
            <label className="block text-sm font-semibold text-[#111827] mb-2">
              Reason for rejection (Optional)
            </label>
            <textarea
              rows={3}
              value={rejectNotes}
              onChange={(e) => setRejectNotes(e.target.value)}
              className="w-full px-3 py-2 text-[#111827] bg-white border border-[#E5E7EB] rounded-lg placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#0D9488] focus:border-[#0D9488] disabled:bg-[#F9FAFB] disabled:text-[#6B7280] disabled:cursor-not-allowed transition-colors duration-150 text-sm"
              placeholder="This will be included in the email sent to the applicant..."
            />
          </div>
          
          <div className="pt-4 border-t border-[#E5E7EB] flex justify-end gap-3">
            <AdminButton
              onClick={() => setIsRejectModalOpen(false)}
              disabled={submitting}
              variant="ghost"
            >
              Cancel
            </AdminButton>
            <AdminButton
              onClick={() => {
                if (selectedApp) {
                  handleUpdateStatus(selectedApp.id, 'rejected', rejectNotes);
                }
              }}
              variant="danger"
              isLoading={submitting}
            >
              Confirm Rejection
            </AdminButton>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={isApproveModalOpen}
        onClose={() => !submitting && setIsApproveModalOpen(false)}
        title="Approve Membership & Record Payment"
      >
        <div className="p-4 space-y-4">
          <p className="text-sm text-gray-600">
            You are approving <strong>{selectedApp?.full_name}</strong>'s application. Please record their initial membership payment details below.
          </p>
          <div>
            <label className="block text-sm font-semibold text-[#111827] mb-2">Payment Method</label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="w-full px-3 py-2 text-[#111827] bg-white border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0D9488] focus:border-[#0D9488]"
            >
              <option value="bank_transfer">Bank Transfer</option>
              <option value="easypaisa">Easypaisa</option>
              <option value="jazzcash">JazzCash</option>
              <option value="cash">Cash</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-[#111827] mb-2">Transaction ID / Reference Number</label>
            <input
              type="text"
              value={paymentRef}
              onChange={(e) => setPaymentRef(e.target.value)}
              className="w-full px-3 py-2 text-[#111827] bg-white border border-[#E5E7EB] rounded-lg placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#0D9488] focus:border-[#0D9488]"
              placeholder="e.g. TID-123456789 or Receipt No."
              required
            />
          </div>
          
          <div className="pt-4 border-t border-[#E5E7EB] flex justify-end gap-3">
            <AdminButton
              onClick={() => setIsApproveModalOpen(false)}
              disabled={submitting}
              variant="ghost"
            >
              Cancel
            </AdminButton>
            <AdminButton
              onClick={() => {
                if (selectedApp) {
                  handleUpdateStatus(selectedApp.id, 'approved', undefined, paymentMethod, paymentRef);
                }
              }}
              variant="success"
              isLoading={submitting}
              disabled={!paymentRef.trim()}
            >
              Approve & Activate
            </AdminButton>
          </div>
        </div>
      </Modal>

      {viewingApplication && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-brand-navy">Application Details</h2>
              <button onClick={() => setViewingApplication(null)} className="text-gray-400 hover:text-gray-600 text-xl">&times;</button>
            </div>
            <div className="space-y-3 text-sm">
              <div><span className="font-semibold text-gray-600">Full Name:</span> <span className="text-gray-900">{viewingApplication.full_name}</span></div>
              <div><span className="font-semibold text-gray-600">Father's Name:</span> <span className="text-gray-900">{viewingApplication.father_name || '—'}</span></div>
              <div><span className="font-semibold text-gray-600">Email:</span> <span className="text-gray-900">{viewingApplication.email}</span></div>
              <div><span className="font-semibold text-gray-600">Phone:</span> <span className="text-gray-900">{viewingApplication.phone}</span></div>
              <div><span className="font-semibold text-gray-600">CNIC:</span> <span className="text-gray-900">{viewingApplication.cnic}</span></div>
              <div><span className="font-semibold text-gray-600">Address:</span> <span className="text-gray-900">{viewingApplication.address}</span></div>
              <div><span className="font-semibold text-gray-600">Occupation:</span> <span className="text-gray-900">{viewingApplication.occupation}</span></div>
              <div><span className="font-semibold text-gray-600">Zone:</span> <span className="text-gray-900">{viewingApplication.zones?.name || viewingApplication.zone_id}</span></div>
              <div><span className="font-semibold text-gray-600">Tier:</span> <span className="text-gray-900">{viewingApplication.tiers?.name || viewingApplication.tier_id}</span></div>
              <div><span className="font-semibold text-gray-600">Status:</span> <span className="text-gray-900 capitalize">{viewingApplication.status}</span></div>
              {viewingApplication.motivation && (
                <div><span className="font-semibold text-gray-600">Motivation:</span> <p className="text-gray-900 mt-1 text-sm">{viewingApplication.motivation}</p></div>
              )}
              {viewingApplication.profile_image_url && (
                <div><span className="font-semibold text-gray-600">Profile Photo:</span>
                  <img src={viewingApplication.profile_image_url} alt="Applicant" className="mt-2 w-20 h-20 rounded-full object-cover border" />
                </div>
              )}
            </div>
            <button onClick={() => setViewingApplication(null)} className="mt-6 w-full bg-brand-navy text-white py-2 rounded-xl font-semibold hover:bg-brand-navy/90 transition-colors">Close</button>
          </div>
        </div>
      )}

    </div>
  );
}
