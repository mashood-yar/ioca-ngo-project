import React, { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, ShieldAlert } from 'lucide-react';
import { fetchApi } from '../../lib/apiClient';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';

interface ImpactStat {
  id: string;
  label_en: string;
  label_ur: string;
  value: number;
  suffix: string;
  icon: string;
  color: string;
  sort_order: number;
  is_active: boolean;
}

export const AdminImpactStats: React.FC = () => {
  const [stats, setStats] = useState<ImpactStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  // Delete confirm state
  const [itemToDelete, setItemToDelete] = useState<ImpactStat | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [formData, setFormData] = useState({
    label_en: '',
    label_ur: '',
    value: 0,
    suffix: '+',
    icon: 'HeartPulse',
    color: 'teal',
    sort_order: 0,
    is_active: true
  });

  const loadStats = () => {
    setLoading(true);
    fetchApi<ImpactStat[]>('/api/impact-stats')
      .then(({ data, error }) => {
        if (data) setStats(data);
        if (error) setErrorMsg(error);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadStats();
  }, []);

  const handleEditClick = (stat: ImpactStat) => {
    setEditingId(stat.id);
    setFormData({
      label_en: stat.label_en,
      label_ur: stat.label_ur,
      value: stat.value,
      suffix: stat.suffix || '+',
      icon: stat.icon || 'HeartPulse',
      color: stat.color || 'teal',
      sort_order: stat.sort_order || 0,
      is_active: stat.is_active !== false
    });
    setErrorMsg(null);
    setIsAdding(true);
  };

  const handleAddNew = () => {
    setEditingId(null);
    setFormData({
      label_en: '',
      label_ur: '',
      value: 0,
      suffix: '+',
      icon: 'HeartPulse',
      color: 'teal',
      sort_order: stats.length * 10,
      is_active: true
    });
    setErrorMsg(null);
    setIsAdding(true);
  };

  const handleCancel = () => {
    setIsAdding(false);
    setEditingId(null);
    setErrorMsg(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const method = editingId ? 'PATCH' : 'POST';
    const endpoint = editingId ? `/api/impact-stats/${editingId}` : '/api/impact-stats';

    const { error } = await fetchApi(endpoint, {
      method,
      body: JSON.stringify(formData)
    });

    if (error) {
      setErrorMsg(error);
      return;
    }

    setIsAdding(false);
    setEditingId(null);
    loadStats();
  };

  const handleDeleteConfirm = async () => {
    if (!itemToDelete) return;
    setIsDeleting(true);
    setErrorMsg(null);
    
    const { error } = await fetchApi(`/api/impact-stats/${itemToDelete.id}`, { method: 'DELETE' });
    
    setIsDeleting(false);
    if (error) {
      setErrorMsg(error);
      return;
    }
    
    setItemToDelete(null);
    loadStats();
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-brand-navy">Impact Stats (Home Page)</h1>
        {!isAdding && (
          <button
            onClick={handleAddNew}
            className="flex items-center gap-2 bg-brand-teal text-white px-4 py-2 rounded-lg hover:bg-opacity-90 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Add New Stat
          </button>
        )}
      </div>

      {errorMsg && (
        <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 flex items-start">
          <ShieldAlert className="w-5 h-5 text-red-500 mr-3 mt-0.5" />
          <p className="text-red-700">{errorMsg}</p>
        </div>
      )}

      {isAdding ? (
        <div className="bg-white rounded-xl shadow-sm border border-brand-navy/10 p-6">
          <h2 className="text-xl font-semibold text-brand-navy mb-6">
            {editingId ? 'Edit Stat' : 'Add New Stat'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-6">
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-brand-navy mb-2">Label (English) *</label>
                <input
                  type="text"
                  value={formData.label_en}
                  onChange={e => setFormData({...formData, label_en: e.target.value})}
                  required
                  className="w-full px-4 py-2 rounded-lg border border-brand-navy/20 focus:outline-none focus:border-brand-teal"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-brand-navy mb-2">Label (Urdu) *</label>
                <input
                  type="text"
                  dir="rtl"
                  value={formData.label_ur}
                  onChange={e => setFormData({...formData, label_ur: e.target.value})}
                  required
                  className="w-full px-4 py-2 rounded-lg border border-brand-navy/20 focus:outline-none focus:border-brand-teal font-urduBody"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-brand-navy mb-2">Number Value *</label>
                <input
                  type="number"
                  value={formData.value}
                  onChange={e => setFormData({...formData, value: parseInt(e.target.value) || 0})}
                  required
                  className="w-full px-4 py-2 rounded-lg border border-brand-navy/20 focus:outline-none focus:border-brand-teal"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-brand-navy mb-2">Suffix (e.g. +, K+)</label>
                <input
                  type="text"
                  value={formData.suffix}
                  onChange={e => setFormData({...formData, suffix: e.target.value})}
                  className="w-full px-4 py-2 rounded-lg border border-brand-navy/20 focus:outline-none focus:border-brand-teal"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-brand-navy mb-2">Icon Name</label>
                <select
                  value={formData.icon}
                  onChange={e => setFormData({...formData, icon: e.target.value})}
                  className="w-full px-4 py-2 rounded-lg border border-brand-navy/20 focus:outline-none focus:border-brand-teal"
                >
                  <option value="HeartPulse">HeartPulse</option>
                  <option value="GraduationCap">GraduationCap</option>
                  <option value="Droplets">Droplets</option>
                  <option value="Waves">Waves</option>
                  <option value="Users">Users</option>
                  <option value="Star">Star</option>
                  <option value="BookOpen">BookOpen</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-brand-navy mb-2">Color Scheme</label>
                <select
                  value={formData.color}
                  onChange={e => setFormData({...formData, color: e.target.value})}
                  className="w-full px-4 py-2 rounded-lg border border-brand-navy/20 focus:outline-none focus:border-brand-teal"
                >
                  <option value="teal">Teal (2 columns wide)</option>
                  <option value="gold">Gold (1 column wide)</option>
                  <option value="white">White (1 column wide)</option>
                  <option value="navy">Navy (2 columns wide)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-brand-navy mb-2">Sort Order</label>
                <input
                  type="number"
                  value={formData.sort_order}
                  onChange={e => setFormData({...formData, sort_order: parseInt(e.target.value) || 0})}
                  className="w-full px-4 py-2 rounded-lg border border-brand-navy/20 focus:outline-none focus:border-brand-teal"
                />
              </div>

              <div className="flex items-center mt-8">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={formData.is_active}
                  onChange={e => setFormData({...formData, is_active: e.target.checked})}
                  className="w-4 h-4 text-brand-teal border-gray-300 rounded focus:ring-brand-teal"
                />
                <label htmlFor="is_active" className="ml-2 block text-sm font-medium text-brand-navy">
                  Active (Visible on site)
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-4 pt-6 border-t border-brand-navy/10">
              <button
                type="button"
                onClick={handleCancel}
                className="px-6 py-2 rounded-lg border border-brand-navy/20 text-brand-navy hover:bg-brand-gray transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2 rounded-lg bg-brand-teal text-white hover:bg-opacity-90 transition-colors"
              >
                {editingId ? 'Update Stat' : 'Add Stat'}
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-brand-navy/10 overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-brand-navy/60">Loading stats...</div>
          ) : stats.length === 0 ? (
            <div className="p-8 text-center text-brand-navy/60">No stats found. Click "Add New Stat" to create one.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-brand-gray/50 text-brand-navy font-semibold">
                  <tr>
                    <th className="p-4">Label</th>
                    <th className="p-4">Value</th>
                    <th className="p-4">Color & Icon</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brand-navy/5">
                  {stats.map(stat => (
                    <tr key={stat.id} className="hover:bg-brand-gray/50 transition-colors">
                      <td className="p-4">
                        <p className="font-semibold">{stat.label_en}</p>
                        <p className="text-xs text-brand-navy/60">{stat.label_ur}</p>
                      </td>
                      <td className="p-4 font-bold text-brand-teal">{stat.value}{stat.suffix}</td>
                      <td className="p-4">
                        <span className="text-sm px-2 py-1 bg-brand-gray rounded">{stat.color} / {stat.icon}</span>
                      </td>
                      <td className="p-4">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          stat.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                        }`}>
                          {stat.is_active ? 'Active' : 'Hidden'}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => handleEditClick(stat)}
                            className="p-2 text-brand-navy/60 hover:text-brand-teal hover:bg-brand-teal/10 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setItemToDelete(stat)}
                            className="p-2 text-brand-navy/60 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete"
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
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!itemToDelete}
        title="Delete Impact Stat"
        message="Are you sure you want to delete the stat? This action cannot be undone."
        confirmLabel={isDeleting ? "Deleting..." : "Delete Stat"}
        cancelLabel="Cancel"
        onConfirm={handleDeleteConfirm}
        onClose={() => setItemToDelete(null)}
        isDestructive={true}
      />
    </div>
  );
};
