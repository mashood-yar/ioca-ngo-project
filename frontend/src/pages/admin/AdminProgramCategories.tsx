import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import { fetchApi } from '../../lib/apiClient';
import { Modal } from '../../components/ui/Modal';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { AdminButton } from './AdminButton';
import type { ProgramCategory } from '../../types';

export function AdminProgramCategories() {
  const [categories, setCategories] = useState<ProgramCategory[]>([]);
  const [loading, setLoading] = useState(true);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<ProgramCategory | null>(null);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    nameEn: '',
    nameUr: '',
    slug: '',
    iconSvg: '',
    sortOrder: 0
  });

  const loadCategories = async () => {
    try {
      const { data } = await fetchApi<ProgramCategory[]>('/program-categories');
      if (data) setCategories(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const openForm = (category?: ProgramCategory) => {
    if (category) {
      setSelectedCategory(category);
      setFormData({
        nameEn: category.name_en,
        nameUr: category.name_ur,
        slug: category.slug,
        iconSvg: category.icon_svg || '',
        sortOrder: category.sort_order
      });
    } else {
      setSelectedCategory(null);
      setFormData({ nameEn: '', nameUr: '', slug: '', iconSvg: '', sortOrder: categories.length + 1 });
    }
    setIsFormOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const url = selectedCategory ? `/program-categories/${selectedCategory.id}` : '/program-categories';
      const method = selectedCategory ? 'PUT' : 'POST';

      const result = await fetchApi<any>(url, {
        method,
        body: JSON.stringify(formData),
      });

      if (result.error) {
        window.dispatchEvent(new CustomEvent('app-toast', { detail: { message: `Failed to save: ${result.error}`, variant: 'error' } }));
        return;
      }

      window.dispatchEvent(new CustomEvent('app-toast', { detail: { message: selectedCategory ? 'Category updated' : 'Category created', variant: 'success' } }));
      setIsFormOpen(false);
      loadCategories();
    } catch (err: any) {
      window.dispatchEvent(new CustomEvent('app-toast', { detail: { message: err.message, variant: 'error' } }));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedCategory) return;
    try {
      const result = await fetchApi(`/program-categories/${selectedCategory.id}`, { method: 'DELETE' });
      if (result.error) {
        window.dispatchEvent(new CustomEvent('app-toast', { detail: { message: `Failed to delete: ${result.error}`, variant: 'error' } }));
        return;
      }
      window.dispatchEvent(new CustomEvent('app-toast', { detail: { message: 'Category deleted', variant: 'success' } }));
      setIsDeleteOpen(false);
      loadCategories();
    } catch (err: any) {
      window.dispatchEvent(new CustomEvent('app-toast', { detail: { message: err.message, variant: 'error' } }));
    }
  };

  if (loading) return <div className="p-8 text-center text-[#6B7280]">Loading categories...</div>;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center bg-white p-6 rounded-xl shadow-sm border border-[#E5E7EB]">
        <div>
          <h2 className="text-2xl font-bold text-[#111827]">Program Categories</h2>
          <p className="text-[#6B7280] mt-1">Manage categories for the programs page</p>
        </div>
        <AdminButton onClick={() => openForm()} icon={Plus}>New Category</AdminButton>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-[#E5E7EB] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#F9FAFB] border-b border-[#E5E7EB]">
                <th className="py-4 px-6 text-xs font-semibold text-[#6B7280] uppercase tracking-wider">Icon</th>
                <th className="py-4 px-6 text-xs font-semibold text-[#6B7280] uppercase tracking-wider">Name (English)</th>
                <th className="py-4 px-6 text-xs font-semibold text-[#6B7280] uppercase tracking-wider text-right">Name (Urdu)</th>
                <th className="py-4 px-6 text-xs font-semibold text-[#6B7280] uppercase tracking-wider">Slug</th>
                <th className="py-4 px-6 text-xs font-semibold text-[#6B7280] uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E7EB]">
              {categories.map((cat) => (
                <tr key={cat.id} className="hover:bg-[#F9FAFB] transition-colors">
                  <td className="py-4 px-6">
                    <div className="w-10 h-10 bg-brand-white flex items-center justify-center rounded-lg text-brand-navy shadow-sm" dangerouslySetInnerHTML={{ __html: cat.icon_svg || '' }} />
                  </td>
                  <td className="py-4 px-6 text-sm font-medium text-[#111827]">{cat.name_en}</td>
                  <td className="py-4 px-6 text-sm font-medium text-[#111827] text-right font-urdu">{cat.name_ur}</td>
                  <td className="py-4 px-6 text-sm text-[#6B7280]">{cat.slug}</td>
                  <td className="py-4 px-6 text-sm text-right space-x-3">
                    <button onClick={() => openForm(cat)} className="text-[#0D9488] hover:text-[#0F766E] transition-colors"><Edit2 className="w-4 h-4" /></button>
                    <button onClick={() => { setSelectedCategory(cat); setIsDeleteOpen(true); }} className="text-[#EF4444] hover:text-[#DC2626] transition-colors"><Trash2 className="w-4 h-4" /></button>
                  </td>
                </tr>
              ))}
              {categories.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-[#6B7280]">No categories found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal isOpen={isFormOpen} onClose={() => setIsFormOpen(false)} title={selectedCategory ? 'Edit Category' : 'New Category'}>
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-[#111827] mb-1">Name (English)</label>
              <input type="text" required value={formData.nameEn} onChange={e => setFormData({ ...formData, nameEn: e.target.value })} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#0D9488]" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-[#111827] mb-1 text-right font-urdu">Name (Urdu)</label>
              <input type="text" dir="rtl" required value={formData.nameUr} onChange={e => setFormData({ ...formData, nameUr: e.target.value })} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#0D9488] font-urdu" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-[#111827] mb-1">Slug</label>
            <input type="text" required value={formData.slug} onChange={e => setFormData({ ...formData, slug: e.target.value })} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#0D9488]" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-[#111827] mb-1">SVG Icon Code</label>
            <textarea rows={4} value={formData.iconSvg} onChange={e => setFormData({ ...formData, iconSvg: e.target.value })} placeholder="<svg>...</svg>" className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#0D9488] font-mono text-sm" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-[#111827] mb-1">Sort Order</label>
            <input type="number" required value={formData.sortOrder} onChange={e => setFormData({ ...formData, sortOrder: parseInt(e.target.value) })} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#0D9488]" />
          </div>
          <div className="pt-4 border-t flex justify-end gap-3">
            <AdminButton type="button" variant="secondary" onClick={() => setIsFormOpen(false)}>Cancel</AdminButton>
            <AdminButton type="submit" isLoading={saving}>Save Category</AdminButton>
          </div>
        </form>
      </Modal>

      <ConfirmDialog isOpen={isDeleteOpen} onClose={() => setIsDeleteOpen(false)} onConfirm={handleDelete} title="Delete Category" message="Are you sure you want to delete this category? This cannot be undone." confirmLabel="Delete" isDangerous />
    </div>
  );
}
