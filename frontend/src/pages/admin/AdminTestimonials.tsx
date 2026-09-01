import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import { fetchApi } from '../../lib/apiClient';
import { Modal } from '../../components/ui/Modal';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { AdminButton } from './AdminButton';

export const AdminTestimonials: React.FC = () => {
  const [testimonials, setTestimonials] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedTestimonial, setSelectedTestimonial] = useState<any>(null);

  const [formData, setFormData] = useState({
    quoteEn: '',
    quoteUr: '',
    nameEn: '',
    nameUr: '',
    locationEn: '',
    locationUr: '',
    initial: '',
    bg_color: 'white',
    sort_order: 0,
    is_active: true
  });

  const loadTestimonials = async () => {
    try {
      const { data } = await fetchApi<any[]>('/testimonials');
      if (data) setTestimonials(data);
    } catch (err) {
      console.error('Failed to load testimonials', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTestimonials();
  }, []);

  const handleOpenForm = (t?: any) => {
    if (t) {
      setSelectedTestimonial(t);
      setFormData({
        quoteEn: t.quote_en || t.quoteEn || '',
        quoteUr: t.quote_ur || t.quoteUr || '',
        nameEn: t.name_en || t.nameEn || '',
        nameUr: t.name_ur || t.nameUr || '',
        locationEn: t.location_en || t.locationEn || '',
        locationUr: t.location_ur || t.locationUr || '',
        initial: t.initial || '',
        bg_color: t.bg_color || 'white',
        sort_order: t.sort_order ?? 0,
        is_active: t.is_active ?? true
      });
    } else {
      setSelectedTestimonial(null);
      setFormData({ quoteEn: '', quoteUr: '', nameEn: '', nameUr: '', locationEn: '', locationUr: '', initial: '', bg_color: 'white', sort_order: 0, is_active: true });
    }
    setIsFormOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        quote_en: formData.quoteEn,
        quote_ur: formData.quoteUr,
        name_en: formData.nameEn,
        name_ur: formData.nameUr,
        location_en: formData.locationEn,
        location_ur: formData.locationUr,
        initial: formData.initial.substring(0, 1).toUpperCase(),
        bg_color: formData.bg_color,
        sort_order: formData.sort_order,
        is_active: formData.is_active
      };

      if (selectedTestimonial) {
        await fetchApi(/testimonials/ + selectedTestimonial.id, { method: 'PATCH', body: JSON.stringify(payload) });
      } else {
        await fetchApi('/testimonials', { method: 'POST', body: JSON.stringify(payload) });
      }
      setIsFormOpen(false);
      loadTestimonials();
    } catch (error) {
      console.error('Error saving testimonial:', error);
      alert('Failed to save testimonial');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedTestimonial) return;
    try {
      await fetchApi(/testimonials/ + selectedTestimonial.id, { method: 'DELETE' });
      setIsDeleteOpen(false);
      loadTestimonials();
    } catch (error) {
      console.error('Error deleting testimonial:', error);
      alert('Failed to delete testimonial');
    }
  };

  if (loading) return <div className="p-8 text-center">Loading testimonials...</div>;

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Testimonials</h1>
          <p className="text-gray-500 mt-1">Manage what people say about IOCA</p>
        </div>
        <AdminButton onClick={() => handleOpenForm()} variant="accent" icon={<Plus className="w-5 h-5" />}>
          New Testimonial
        </AdminButton>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="p-4 font-semibold text-gray-600">Initial</th>
                <th className="p-4 font-semibold text-gray-600">Name</th>
                <th className="p-4 font-semibold text-gray-600">Quote</th>
                <th className="p-4 font-semibold text-gray-600">Location</th>
                <th className="p-4 font-semibold text-gray-600">Status</th>
                <th className="p-4 font-semibold text-gray-600 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {testimonials.map((t) => (
                <tr key={t.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                  <td className="p-4">
                    <div className={"w-10 h-10 rounded-full flex items-center justify-center font-bold text-xl"} style={{ backgroundColor: t.bg_color === 'white' ? '#f3f4f6' : t.bg_color }}>
                      {t.initial}
                    </div>
                  </td>
                  <td className="p-4 font-medium">{t.name_en}</td>
                  <td className="p-4 text-gray-600 truncate max-w-xs">{t.quote_en}</td>
                  <td className="p-4 text-gray-500">{t.location_en}</td>
                  <td className="p-4">
                    <span className={"px-2.5 py-1 text-xs font-medium rounded-full "}>
                      {t.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="p-4 text-right space-x-2">
                    <AdminButton variant="outline" size="sm" onClick={() => handleOpenForm(t)} title="Edit">
                      <Edit2 className="w-4 h-4" />
                    </AdminButton>
                    <AdminButton variant="danger" size="sm" onClick={() => { setSelectedTestimonial(t); setIsDeleteOpen(true); }} title="Delete">
                      <Trash2 className="w-4 h-4" />
                    </AdminButton>
                  </td>
                </tr>
              ))}
              {testimonials.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-gray-500">No testimonials found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal isOpen={isFormOpen} onClose={() => setIsFormOpen(false)} title={selectedTestimonial ? 'Edit Testimonial' : 'New Testimonial'}>
        <form onSubmit={handleSave} className="space-y-6 max-h-[80vh] overflow-y-auto px-1">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name (English) *</label>
              <input type="text" required value={formData.nameEn} onChange={e => setFormData({...formData, nameEn: e.target.value})} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-brand-teal focus:border-brand-teal" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name (Urdu)</label>
              <input type="text" dir="rtl" value={formData.nameUr} onChange={e => setFormData({...formData, nameUr: e.target.value})} className="w-full px-4 py-2 border rounded-lg font-urduBody" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Location (English) *</label>
              <input type="text" required value={formData.locationEn} onChange={e => setFormData({...formData, locationEn: e.target.value})} className="w-full px-4 py-2 border rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Location (Urdu)</label>
              <input type="text" dir="rtl" value={formData.locationUr} onChange={e => setFormData({...formData, locationUr: e.target.value})} className="w-full px-4 py-2 border rounded-lg font-urduBody" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Initial (1 Char) *</label>
              <input type="text" required maxLength={1} value={formData.initial} onChange={e => setFormData({...formData, initial: e.target.value})} className="w-full px-4 py-2 border rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Background Color</label>
              <input type="text" value={formData.bg_color} onChange={e => setFormData({...formData, bg_color: e.target.value})} placeholder="e.g. #FCD34D or white" className="w-full px-4 py-2 border rounded-lg" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Quote (English) *</label>
            <textarea required rows={4} value={formData.quoteEn} onChange={e => setFormData({...formData, quoteEn: e.target.value})} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-brand-teal" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Quote (Urdu)</label>
            <textarea rows={4} dir="rtl" value={formData.quoteUr} onChange={e => setFormData({...formData, quoteUr: e.target.value})} className="w-full px-4 py-2 border rounded-lg font-urduBody" />
          </div>
          <div className="flex gap-4">
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={formData.is_active} onChange={e => setFormData({...formData, is_active: e.target.checked})} className="w-4 h-4 text-brand-teal focus:ring-brand-teal border-gray-300 rounded" />
              <span className="text-sm text-gray-700">Active (Show on homepage)</span>
            </label>
            <div className="flex-1 flex items-center gap-2">
              <label className="text-sm text-gray-700">Sort Order:</label>
              <input type="number" value={formData.sort_order} onChange={e => setFormData({...formData, sort_order: parseInt(e.target.value) || 0})} className="w-20 px-2 py-1 border rounded" />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t">
            <AdminButton type="button" onClick={() => setIsFormOpen(false)} variant="ghost" disabled={saving}>Cancel</AdminButton>
            <AdminButton type="submit" variant="primary" disabled={saving}>{saving ? 'Saving...' : (selectedTestimonial ? 'Update Testimonial' : 'Create Testimonial')}</AdminButton>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDelete}
        title="Delete Testimonial"
        message={`Are you sure you want to delete the testimonial from ${selectedTestimonial?.name_en}? This action cannot be undone.`}
        confirmLabel="Delete Testimonial"
        isDestructive={true}
      />
    </div>
  );
};
