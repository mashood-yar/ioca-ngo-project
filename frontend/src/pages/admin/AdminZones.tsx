import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, MapPin, Users, ArrowRight } from 'lucide-react';
import { fetchApi } from '../../lib/apiClient';
import { Modal } from '../../components/ui/Modal';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { Link } from 'react-router-dom';
import { AdminButton } from './AdminButton';

interface Zone {
  id: string;
  name: string;
  city: string;
  description: string;
  created_at: string;
  members: { count: number }[]; // Since Supabase returns counts like this
}

export function AdminZones() {
  const [zones, setZones] = useState<Zone[]>([]);
  const [loading, setLoading] = useState(true);
  
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedZone, setSelectedZone] = useState<Zone | null>(null);
  
  const [formData, setFormData] = useState({ name: '', city: '', description: '' });
  const [saving, setSaving] = useState(false);

  const loadZones = async () => {
    try {
      const { data } = await fetchApi<Zone[]>('/zones');
      if (data) setZones(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadZones();
  }, []);

  const handleOpenForm = (zone?: Zone) => {
    if (zone) {
      setSelectedZone(zone);
      setFormData({
        name: zone.name,
        city: zone.city,
        description: zone.description || '',
      });
    } else {
      setSelectedZone(null);
      setFormData({ name: '', city: '', description: '' });
    }
    setIsFormOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (selectedZone) {
        await fetchApi(`/zones/${selectedZone.id}`, {
          method: 'PUT',
          body: JSON.stringify(formData),
        });
        window.dispatchEvent(new CustomEvent('app-toast', { detail: { message: 'Zone updated', variant: 'success' }}));
      } else {
        await fetchApi('/zones', {
          method: 'POST',
          body: JSON.stringify(formData),
        });
        window.dispatchEvent(new CustomEvent('app-toast', { detail: { message: 'Zone created', variant: 'success' }}));
      }
      setIsFormOpen(false);
      loadZones();
    } catch (err) {
      window.dispatchEvent(new CustomEvent('app-toast', { detail: { message: 'Failed to save zone', variant: 'error' }}));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedZone) return;
    try {
      await fetchApi(`/zones/${selectedZone.id}`, { method: 'DELETE' });
      window.dispatchEvent(new CustomEvent('app-toast', { detail: { message: 'Zone deleted', variant: 'success' }}));
      loadZones();
    } catch (err) {
      window.dispatchEvent(new CustomEvent('app-toast', { detail: { message: 'Failed to delete zone', variant: 'error' }}));
    }
  };

  if (loading) return <div className="p-8">Loading zones...</div>;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Zones</h1>
          <p className="text-gray-500 mt-1">Manage geographic regions and their members</p>
        </div>
        <AdminButton
          onClick={() => handleOpenForm()}
          variant="accent"
          icon={<Plus className="w-5 h-5" />}
        >
          New Zone
        </AdminButton>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {zones.map((zone) => {
          const memberCount = zone.members?.[0]?.count || 0;
          return (
            <div key={zone.id} className="bg-white rounded-2xl shadow-sm border border-[#E5E7EB] overflow-hidden flex flex-col transition-all hover:shadow-md">
              <div className="p-6 border-b border-[#E5E7EB] flex-1">
                <div className="flex justify-between items-start mb-4">
                  <div className="w-10 h-10 bg-[#0D9488]/10 rounded-xl flex items-center justify-center">
                    <MapPin className="w-5 h-5 text-[#0D9488]" />
                  </div>
                  <div className="flex gap-2">
                    <AdminButton
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenForm(zone)}
                      title="Edit"
                    >
                      <Edit2 className="w-4 h-4" />
                    </AdminButton>
                    <AdminButton
                      variant="danger"
                      size="sm"
                      onClick={() => { setSelectedZone(zone); setIsDeleteOpen(true); }}
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </AdminButton>
                  </div>
                </div>
                <h2 className="text-lg font-bold text-gray-900 mb-1">{zone.name}</h2>
                <p className="text-sm font-medium text-gray-500 mb-3">{zone.city}</p>
                <p className="text-sm text-gray-600 line-clamp-2">{zone.description || 'No description provided.'}</p>
              </div>
              <div className="bg-gray-50 px-6 py-4 flex items-center justify-between border-t border-[#E5E7EB]/50">
                <div className="flex items-center gap-2 text-sm font-medium text-gray-600">
                  <Users className="w-4 h-4 text-gray-400" />
                  {memberCount} Members
                </div>
                <Link 
                  to={`/admin/members?zone=${zone.id}`}
                  className="text-sm font-medium text-[#0D9488] hover:text-[#0F766E] flex items-center gap-1 font-bold"
                >
                  View <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          );
        })}
        {zones.length === 0 && (
          <div className="col-span-full p-12 text-center bg-white rounded-2xl border border-[#E5E7EB] border-dashed">
            <p className="text-gray-500 mb-4">No zones created yet.</p>
            <AdminButton
              onClick={() => handleOpenForm()}
              variant="ghost"
            >
              Create your first zone
            </AdminButton>
          </div>
        )}
      </div>

      <Modal
        isOpen={isFormOpen}
        onClose={() => !saving && setIsFormOpen(false)}
        title={selectedZone ? 'Edit Zone' : 'New Zone'}
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-[#111827] mb-1">Zone Name</label>
            <input
              type="text"
              required
              placeholder="e.g. Lahore Central"
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 text-[#111827] bg-white border border-[#E5E7EB] rounded-lg placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#0D9488] focus:border-[#0D9488] disabled:bg-[#F9FAFB] disabled:text-[#6B7280] disabled:cursor-not-allowed transition-colors duration-150"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-[#111827] mb-1">City</label>
            <input
              type="text"
              required
              placeholder="e.g. Lahore"
              value={formData.city}
              onChange={e => setFormData({ ...formData, city: e.target.value })}
              className="w-full px-3 py-2 text-[#111827] bg-white border border-[#E5E7EB] rounded-lg placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#0D9488] focus:border-[#0D9488] disabled:bg-[#F9FAFB] disabled:text-[#6B7280] disabled:cursor-not-allowed transition-colors duration-150"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-[#111827] mb-1">Description (Optional)</label>
            <textarea
              rows={3}
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 text-[#111827] bg-white border border-[#E5E7EB] rounded-lg placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#0D9488] focus:border-[#0D9488] disabled:bg-[#F9FAFB] disabled:text-[#6B7280] disabled:cursor-not-allowed transition-colors duration-150"
            />
          </div>
          
          <div className="pt-4 border-t border-[#E5E7EB] flex justify-end gap-3">
            <AdminButton
              type="button"
              onClick={() => setIsFormOpen(false)}
              variant="ghost"
              disabled={saving}
            >
              Cancel
            </AdminButton>
            <AdminButton
              type="submit"
              variant="accent"
              isLoading={saving}
            >
              Save Zone
            </AdminButton>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        title="Delete Zone"
        message="Are you sure you want to delete this zone? WARNING: This will also delete ALL members assigned to this zone permanently."
        confirmLabel="Delete Zone & Members"
        onConfirm={handleDelete}
      />
    </div>
  );
}
