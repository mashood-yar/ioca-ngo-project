import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, ArrowRight, X, Shield } from 'lucide-react';
import { fetchApi } from '../../lib/apiClient';
import { Modal } from '../../components/ui/Modal';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { AdminButton } from './AdminButton';

interface Tier {
  id: string;
  name: string;
  name_ur?: string;
  price: number;
  duration_days: number;
  benefits?: string[];
  is_active: boolean;
  created_at: string;
}

export function AdminTiers() {
  const [tiers, setTiers] = useState<Tier[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedTier, setSelectedTier] = useState<Tier | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    nameUr: '',
    price: 0,
    durationDays: 365,
    benefits: [] as string[],
    isActive: true,
  });
  const [benefitInput, setBenefitInput] = useState('');
  const [saving, setSaving] = useState(false);

  const loadTiers = async () => {
    try {
      setLoading(true);
      const { data } = await fetchApi<Tier[]>('/admin/tiers');
      if (data) setTiers(data);
    } catch (err) {
      console.error(err);
      window.dispatchEvent(new CustomEvent('app-toast', { detail: { message: 'Failed to load tiers', variant: 'error' } }));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTiers();
  }, []);

  const handleOpenForm = (tier?: Tier) => {
    if (tier) {
      setSelectedTier(tier);
      setFormData({
        name: tier.name,
        nameUr: tier.name_ur || '',
        price: tier.price,
        durationDays: tier.duration_days,
        benefits: tier.benefits || [],
        isActive: tier.is_active,
      });
    } else {
      setSelectedTier(null);
      setFormData({
        name: '',
        nameUr: '',
        price: 0,
        durationDays: 365,
        benefits: [],
        isActive: true,
      });
    }
    setBenefitInput('');
    setIsFormOpen(true);
  };

  const handleAddBenefit = () => {
    if (benefitInput.trim() && !formData.benefits.includes(benefitInput.trim())) {
      setFormData(prev => ({
        ...prev,
        benefits: [...prev.benefits, benefitInput.trim()]
      }));
      setBenefitInput('');
    }
  };

  const handleRemoveBenefit = (index: number) => {
    setFormData(prev => ({
      ...prev,
      benefits: prev.benefits.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      const endpoint = selectedTier ? `/admin/tiers/${selectedTier.id}` : '/admin/tiers';
      const method = selectedTier ? 'PATCH' : 'POST';

      const { error } = await fetchApi(endpoint, {
        method,
        body: JSON.stringify(formData),
      });

      if (error) throw new Error(error);

      window.dispatchEvent(new CustomEvent('app-toast', { 
        detail: { message: `Tier successfully ${selectedTier ? 'updated' : 'created'}`, variant: 'success' } 
      }));
      
      setIsFormOpen(false);
      loadTiers();
    } catch (err: any) {
      window.dispatchEvent(new CustomEvent('app-toast', { detail: { message: err.message || 'Failed to save tier', variant: 'error' } }));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedTier) return;
    try {
      setSaving(true);
      const { error } = await fetchApi(`/admin/tiers/${selectedTier.id}`, {
        method: 'DELETE',
      });
      if (error) throw new Error(error);

      window.dispatchEvent(new CustomEvent('app-toast', { detail: { message: 'Tier deleted successfully', variant: 'success' } }));
      setIsDeleteOpen(false);
      loadTiers();
    } catch (err: any) {
      window.dispatchEvent(new CustomEvent('app-toast', { detail: { message: err.message || 'Failed to delete tier', variant: 'error' } }));
      setIsDeleteOpen(false);
    } finally {
      setSaving(false);
    }
  };

  const getDurationLabel = (days: number) => {
    if (days === 30) return 'Monthly';
    if (days === 365) return 'Yearly';
    if (days >= 36500) return 'Lifetime';
    return `${days} Days`;
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl border border-brand-navy/10 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-brand-navy">Membership Tiers</h1>
          <p className="text-brand-navy/60 mt-1">Manage membership pricing, packages, and benefits</p>
        </div>
        <AdminButton onClick={() => handleOpenForm()}>
          <Plus className="w-4 h-4 mr-2" />
          Create Tier
        </AdminButton>
      </div>

      <div className="bg-white border border-brand-navy/10 rounded-2xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-8 text-center text-brand-navy/50">Loading tiers...</div>
        ) : tiers.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center justify-center">
            <div className="w-16 h-16 bg-brand-gray rounded-full flex items-center justify-center mb-4">
              <Shield className="w-8 h-8 text-brand-navy/30" />
            </div>
            <h3 className="text-lg font-bold text-brand-navy mb-2">No tiers found</h3>
            <p className="text-brand-navy/60 mb-6">Create your first membership tier to start accepting members.</p>
            <AdminButton onClick={() => handleOpenForm()}>Create Tier</AdminButton>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-brand-gray/50 border-b border-brand-navy/5 text-xs font-bold text-brand-navy/60 uppercase tracking-wider">
                  <th className="p-4 pl-6 font-semibold">Tier Name</th>
                  <th className="p-4 font-semibold">Price (PKR)</th>
                  <th className="p-4 font-semibold">Duration</th>
                  <th className="p-4 font-semibold">Status</th>
                  <th className="p-4 pr-6 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-navy/5 text-sm">
                {tiers.map((tier) => (
                  <tr key={tier.id} className="hover:bg-brand-gray/30 transition-colors">
                    <td className="p-4 pl-6">
                      <div className="font-bold text-brand-navy">{tier.name}</div>
                      {tier.name_ur && <div className="text-xs text-brand-navy/60 font-urduBody mt-1" dir="rtl">{tier.name_ur}</div>}
                    </td>
                    <td className="p-4 text-brand-navy font-medium">
                      {tier.price.toLocaleString('en-PK')}
                    </td>
                    <td className="p-4 text-brand-navy/70">
                      {getDurationLabel(tier.duration_days)}
                    </td>
                    <td className="p-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        tier.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {tier.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="p-4 pr-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleOpenForm(tier)}
                          className="p-2 text-brand-navy/60 hover:text-brand-teal hover:bg-brand-teal/10 rounded-lg transition-colors"
                          title="Edit Tier"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => { setSelectedTier(tier); setIsDeleteOpen(true); }}
                          className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete Tier"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title={selectedTier ? 'Edit Membership Tier' : 'Create New Tier'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-brand-navy mb-1">Tier Name (English) *</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-2 bg-brand-gray border border-brand-navy/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-teal"
                placeholder="e.g. Premium"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-brand-navy mb-1">Tier Name (Urdu)</label>
              <input
                type="text"
                value={formData.nameUr}
                onChange={e => setFormData({ ...formData, nameUr: e.target.value })}
                className="w-full px-4 py-2 bg-brand-gray border border-brand-navy/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-teal text-right font-urduBody"
                placeholder="مثلا: پریمیم"
                dir="rtl"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-brand-navy mb-1">Price (PKR) *</label>
              <input
                type="number"
                required
                min="0"
                value={formData.price}
                onChange={e => setFormData({ ...formData, price: Number(e.target.value) })}
                className="w-full px-4 py-2 bg-brand-gray border border-brand-navy/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-teal"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-brand-navy mb-1">Duration *</label>
              <select
                value={formData.durationDays}
                onChange={e => setFormData({ ...formData, durationDays: Number(e.target.value) })}
                className="w-full px-4 py-2 bg-brand-gray border border-brand-navy/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-teal"
              >
                <option value={30}>Monthly (30 Days)</option>
                <option value={365}>Yearly (365 Days)</option>
                <option value={36500}>Lifetime (100 Years)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-brand-navy mb-1">Tier Benefits</label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={benefitInput}
                onChange={e => setBenefitInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleAddBenefit())}
                className="flex-1 px-4 py-2 bg-brand-gray border border-brand-navy/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-teal"
                placeholder="e.g. Receive annual reports"
              />
              <button
                type="button"
                onClick={handleAddBenefit}
                className="px-4 py-2 bg-brand-navy/5 text-brand-navy rounded-lg hover:bg-brand-navy/10 transition-colors font-medium"
              >
                Add
              </button>
            </div>
            {formData.benefits.length > 0 && (
              <ul className="space-y-2 mt-3">
                {formData.benefits.map((benefit, index) => (
                  <li key={index} className="flex items-center justify-between bg-brand-gray px-3 py-2 rounded-md text-sm text-brand-navy">
                    <span>{benefit}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveBenefit(index)}
                      className="text-red-500 hover:text-red-700 p-1"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="flex items-center mt-4">
            <input
              type="checkbox"
              id="isActive"
              checked={formData.isActive}
              onChange={e => setFormData({ ...formData, isActive: e.target.checked })}
              className="w-4 h-4 text-brand-teal border-brand-navy/20 rounded focus:ring-brand-teal"
            />
            <label htmlFor="isActive" className="ml-2 text-sm text-brand-navy font-medium">
              Tier is Active (Visible on registration page)
            </label>
          </div>
          <p className="text-xs text-brand-navy/50 ml-6">
            If you want to discontinue a tier, uncheck this instead of deleting it, so existing members keep their history.
          </p>

          <div className="flex justify-end gap-3 pt-4 border-t border-brand-navy/10 mt-6">
            <button
              type="button"
              onClick={() => setIsFormOpen(false)}
              className="px-5 py-2 text-brand-navy/60 hover:text-brand-navy font-semibold transition-colors"
            >
              Cancel
            </button>
            <AdminButton type="submit" loading={saving}>
              {selectedTier ? 'Save Changes' : 'Create Tier'}
            </AdminButton>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={isDeleteOpen}
        title="Delete Tier"
        message={`Are you sure you want to delete ${selectedTier?.name}? This action cannot be undone. If members are currently on this tier, the deletion will be blocked and you should mark it as Inactive instead.`}
        confirmLabel="Delete Tier"
        isDestructive={true}
        onConfirm={handleDelete}
        onCancel={() => setIsDeleteOpen(false)}
        loading={saving}
      />
    </div>
  );
}
