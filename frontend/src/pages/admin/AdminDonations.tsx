import { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Image as ImageIcon, Search } from 'lucide-react';
import { fetchApi } from '../../lib/apiClient';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { Modal } from '../../components/ui/Modal';
import { useCloudinaryUpload } from '../../hooks/useCloudinaryUpload';

interface Donation {
  id: string;
  donor_name: string;
  email?: string;
  phone?: string;
  amount: number;
  payment_method: string;
  status: 'pending' | 'confirmed' | 'rejected';
  screenshot_url?: string;
  created_at: string;
}

export function AdminDonations() {
  const [donations, setDonations] = useState<Donation[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [selectedDonation, setSelectedDonation] = useState<Donation | null>(null);
  const [actionType, setActionType] = useState<'confirm' | 'reject'>('confirm');
  
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [lightboxImage, setLightboxImage] = useState('');
  const [filter, setFilter] = useState<'all' | 'pending' | 'confirmed' | 'rejected'>('all');

  const { upload, uploading } = useCloudinaryUpload();

  const loadDonations = async () => {
    try {
      const { data } = await fetchApi<Donation[]>('/donations');
      if (data) setDonations(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDonations();
  }, []);

  const handleAction = async () => {
    if (!selectedDonation) return;
    try {
      const newStatus = actionType === 'confirm' ? 'confirmed' : 'rejected';
      await fetchApi(`/donations/${selectedDonation.id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus }),
      });
      
      window.dispatchEvent(new CustomEvent('app-toast', { 
        detail: { message: `Donation ${newStatus}`, variant: 'success' }
      }));
      
      loadDonations();
    } catch (err) {
      window.dispatchEvent(new CustomEvent('app-toast', { 
        detail: { message: 'Failed to update status', variant: 'error' }
      }));
    }
  };

  const handleUploadScreenshot = async (id: string, file: File) => {
    try {
      const result = await upload(file, 'ioca/donations');
      if (result) {
        await fetchApi(`/donations/${id}/screenshot`, {
          method: 'POST',
          body: JSON.stringify({ screenshotUrl: result.url, screenshotPublicId: result.publicId }),
        });
        window.dispatchEvent(new CustomEvent('app-toast', { detail: { message: 'Screenshot uploaded', variant: 'success' }}));
        loadDonations();
      }
    } catch (err) {
      window.dispatchEvent(new CustomEvent('app-toast', { detail: { message: 'Upload failed', variant: 'error' }}));
    }
  };

  const filteredDonations = filter === 'all' ? donations : donations.filter(d => d.status === filter);

  if (loading) return <div className="p-8">Loading donations...</div>;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Donations</h1>
          <p className="text-gray-500 mt-1">Verify and manage donor contributions</p>
        </div>
        
        <div className="flex bg-white rounded-lg p-1 border border-gray-200 shadow-sm">
          {['all', 'pending', 'confirmed', 'rejected'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f as any)}
              className={`px-4 py-1.5 rounded-md text-sm font-medium capitalize transition-colors ${
                filter === f ? 'bg-primary text-white shadow-sm' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[1000px]">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100 text-sm font-semibold text-gray-600">
                <th className="p-4 pl-6">Donor Info</th>
                <th className="p-4">Amount</th>
                <th className="p-4">Payment Info</th>
                <th className="p-4">Proof</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right pr-6">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredDonations.map((donation) => (
                <tr key={donation.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="p-4 pl-6">
                    <p className="font-medium text-gray-900">{donation.donor_name}</p>
                    <p className="text-xs text-gray-500">{donation.email || donation.phone}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{new Date(donation.created_at).toLocaleString()}</p>
                  </td>
                  <td className="p-4 font-bold text-gray-900">Rs {donation.amount.toLocaleString()}</td>
                  <td className="p-4 text-sm text-gray-600 capitalize">{donation.payment_method.replace('_', ' ')}</td>
                  <td className="p-4">
                    {donation.screenshot_url ? (
                      <button 
                        onClick={() => { setLightboxImage(donation.screenshot_url!); setIsLightboxOpen(true); }}
                        className="relative group block w-16 h-12 rounded-lg overflow-hidden border border-gray-200"
                      >
                        <img src={donation.screenshot_url} alt="Proof" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <Search className="w-4 h-4 text-white" />
                        </div>
                      </button>
                    ) : (
                      <div className="relative group">
                        <input 
                          type="file" 
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                          accept="image/*"
                          onChange={e => e.target.files?.[0] && handleUploadScreenshot(donation.id, e.target.files[0])}
                          disabled={uploading}
                        />
                        <div className="w-16 h-12 bg-gray-50 hover:bg-gray-100 rounded-lg flex flex-col items-center justify-center border border-gray-200 border-dashed transition-colors">
                          <ImageIcon className="w-4 h-4 text-gray-400" />
                          <span className="text-[10px] text-gray-500 font-medium">Add</span>
                        </div>
                      </div>
                    )}
                  </td>
                  <td className="p-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      donation.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                      donation.status === 'rejected' ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {donation.status}
                    </span>
                  </td>
                  <td className="p-4 pr-6 text-right">
                    {donation.status === 'pending' ? (
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => { setSelectedDonation(donation); setActionType('confirm'); setIsConfirmOpen(true); }}
                          className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                          title="Confirm"
                        >
                          <CheckCircle className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => { setSelectedDonation(donation); setActionType('reject'); setIsConfirmOpen(true); }}
                          className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Reject"
                        >
                          <XCircle className="w-5 h-5" />
                        </button>
                      </div>
                    ) : (
                      <span className="text-sm text-gray-400 font-medium">Processed</span>
                    )}
                  </td>
                </tr>
              ))}
              {filteredDonations.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-gray-500">No donations found in this status.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <ConfirmDialog
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        title={actionType === 'confirm' ? 'Confirm Donation' : 'Reject Donation'}
        message={actionType === 'confirm' 
          ? `Are you sure you want to confirm this donation of Rs ${selectedDonation?.amount} from ${selectedDonation?.donor_name}? A confirmation email will be sent automatically.`
          : 'Are you sure you want to mark this donation as rejected? No email will be sent.'
        }
        confirmLabel={actionType === 'confirm' ? 'Confirm & Send Email' : 'Reject'}
        isDestructive={actionType === 'reject'}
        onConfirm={handleAction}
      />

      <Modal isOpen={isLightboxOpen} onClose={() => setIsLightboxOpen(false)} title="Payment Proof" maxWidth="max-w-3xl">
        <img src={lightboxImage} alt="Payment Proof Full" className="w-full h-auto rounded-lg" />
      </Modal>
    </div>
  );
}
