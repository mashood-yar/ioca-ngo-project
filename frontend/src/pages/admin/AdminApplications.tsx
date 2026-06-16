import { useState, useEffect } from 'react';
import { fetchApi } from '../../lib/apiClient';
import { Modal } from '../../components/ui/Modal';

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

  const handleUpdateStatus = async (id: string, status: 'under_review' | 'approved' | 'rejected', notes?: string) => {
    try {
      setSubmitting(true);
      const { error } = await fetchApi(`/admin/applications/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status, adminNotes: notes }),
      });
      if (error) throw new Error(error);

      window.dispatchEvent(new CustomEvent('app-toast', { detail: { message: `Application marked as ${status}`, variant: 'success' } }));
      
      // Update local state
      setApplications(apps => apps.map(app => 
        app.id === id ? { ...app, status, admin_notes: notes || app.admin_notes } : app
      ));
      
      setIsRejectModalOpen(false);
    } catch (err: any) {
      window.dispatchEvent(new CustomEvent('app-toast', { detail: { message: err.message || 'Update failed', variant: 'error' } }));
    } finally {
      setSubmitting(false);
    }
  };

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

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-gray-500 uppercase bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 font-medium">Applicant</th>
                <th className="px-6 py-4 font-medium">Zone</th>
                <th className="px-6 py-4 font-medium">Tier</th>
                <th className="px-6 py-4 font-medium">Submitted</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {applications.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    No applications found
                  </td>
                </tr>
              ) : (
                applications.map(app => (
                  <tr key={app.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">{app.full_name}</div>
                      <div className="text-gray-500">{app.email}</div>
                      <div className="text-xs text-gray-400 mt-1">{app.phone}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">{app.zones?.name || '—'}</div>
                      <div className="text-gray-500">{app.zones?.city || '—'}</div>
                    </td>
                    <td className="px-6 py-4 font-medium text-gray-900">
                      {app.tiers?.name || '—'}
                    </td>
                    <td className="px-6 py-4 text-gray-500">
                      {new Date(app.submitted_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${
                        app.status === 'approved' ? 'bg-green-100 text-green-800' :
                        app.status === 'rejected' ? 'bg-red-100 text-red-800' :
                        app.status === 'under_review' ? 'bg-blue-100 text-blue-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {app.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      {app.status === 'pending' && (
                        <button 
                          onClick={() => handleUpdateStatus(app.id, 'under_review')}
                          disabled={submitting}
                          className="text-blue-600 hover:text-blue-900 font-medium disabled:opacity-50"
                        >
                          Review
                        </button>
                      )}
                      
                      {(app.status === 'pending' || app.status === 'under_review') && (
                        <>
                          <button 
                            onClick={() => {
                              if (window.confirm(`Approve ${app.full_name}? This will auto-create their membership.`)) {
                                handleUpdateStatus(app.id, 'approved');
                              }
                            }}
                            disabled={submitting}
                            className="text-green-600 hover:text-green-900 font-medium ml-3 disabled:opacity-50"
                          >
                            Approve
                          </button>
                          
                          <button 
                            onClick={() => {
                              setSelectedApp(app);
                              setRejectNotes('');
                              setIsRejectModalOpen(true);
                            }}
                            disabled={submitting}
                            className="text-red-600 hover:text-red-900 font-medium ml-3 disabled:opacity-50"
                          >
                            Reject
                          </button>
                        </>
                      )}

                      {/* Display motivation / notes toggle */}
                      <button 
                        onClick={() => {
                          alert(`Motivation:\n${app.motivation}\n\nCNIC: ${app.cnic || 'N/A'}\nOccupation: ${app.occupation || 'N/A'}\nAddress: ${app.address || 'N/A'}`);
                        }}
                        className="text-gray-600 hover:text-gray-900 ml-3"
                        title="View Details"
                      >
                        Info
                      </button>
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
        <div className="p-4">
          <p className="text-sm text-gray-600 mb-4">
            Are you sure you want to reject <strong>{selectedApp?.full_name}</strong>'s application? This action cannot be undone.
          </p>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Reason for rejection (Optional)
          </label>
          <textarea
            rows={3}
            value={rejectNotes}
            onChange={(e) => setRejectNotes(e.target.value)}
            className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-red-500 outline-none"
            placeholder="This will be included in the email sent to the applicant..."
          />
          
          <div className="mt-6 flex justify-end gap-3">
            <button
              onClick={() => setIsRejectModalOpen(false)}
              disabled={submitting}
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                if (selectedApp) {
                  handleUpdateStatus(selectedApp.id, 'rejected', rejectNotes);
                }
              }}
              disabled={submitting}
              className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors disabled:opacity-50"
            >
              {submitting ? 'Rejecting...' : 'Confirm Rejection'}
            </button>
          </div>
        </div>
      </Modal>

    </div>
  );
}
