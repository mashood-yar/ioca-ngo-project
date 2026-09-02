import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Image as ImageIcon } from 'lucide-react';
import { fetchApi } from '../../lib/apiClient';
import { Modal } from '../../components/ui/Modal';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { useCloudinaryUpload } from '../../hooks/useCloudinaryUpload';
import { AdminButton } from './AdminButton';
import type { Program, ProgramCategory } from '../../types';

export function AdminProgramsList() {
  const [programs, setPrograms] = useState<Program[]>([]);
  const [categories, setCategories] = useState<ProgramCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterCategory, setFilterCategory] = useState<string>('all');

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedProgram, setSelectedProgram] = useState<Program | null>(null);

  const [formData, setFormData] = useState({
    titleEn: '', titleUr: '', descEn: '', descUr: '', contentEn: '', contentUr: '',
    categoryId: '', status: 'active',
    statsBeneficiaries: 0, statsProjects: 0, statsVolunteers: 0
  });
  
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const { upload, uploading } = useCloudinaryUpload();

  const loadData = async () => {
    try {
      const [progRes, catRes] = await Promise.all([
        fetchApi<Program[]>('/programs'),
        fetchApi<ProgramCategory[]>('/program-categories')
      ]);
      if (progRes.data) setPrograms(progRes.data);
      if (catRes.data) setCategories(catRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const openForm = (program?: Program) => {
    if (program) {
      setSelectedProgram(program);
      setFormData({
        titleEn: program.title_en,
        titleUr: program.title_ur,
        descEn: program.desc_en,
        descUr: program.desc_ur,
        contentEn: program.content_en,
        contentUr: program.content_ur,
        categoryId: program.category_id,
        status: program.status,
        statsBeneficiaries: program.stats_beneficiaries,
        statsProjects: program.stats_projects,
        statsVolunteers: program.stats_volunteers
      });
    } else {
      setSelectedProgram(null);
      setFormData({
        titleEn: '', titleUr: '', descEn: '', descUr: '', contentEn: '', contentUr: '',
        categoryId: categories[0]?.id || '', status: 'active',
        statsBeneficiaries: 0, statsProjects: 0, statsVolunteers: 0
      });
    }
    setSelectedFile(null);
    setIsFormOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      let imageUrl = selectedProgram?.image_url;
      if (selectedFile) {
        const uploadResult = await upload(selectedFile, 'ioca/programs');
        if (uploadResult) imageUrl = uploadResult.url;
      }

      const payload = { ...formData, imageUrl };
      const url = selectedProgram ? `/programs/${selectedProgram.id}` : '/programs';
      const method = selectedProgram ? 'PUT' : 'POST';

      const result = await fetchApi<any>(url, { method, body: JSON.stringify(payload) });

      if (result.error) throw new Error(result.error);

      window.dispatchEvent(new CustomEvent('app-toast', { detail: { message: selectedProgram ? 'Program updated' : 'Program created', variant: 'success' } }));
      setIsFormOpen(false);
      loadData();
    } catch (err: any) {
      window.dispatchEvent(new CustomEvent('app-toast', { detail: { message: err.message, variant: 'error' } }));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedProgram) return;
    try {
      const result = await fetchApi(`/programs/${selectedProgram.id}`, { method: 'DELETE' });
      if (result.error) throw new Error(result.error);
      window.dispatchEvent(new CustomEvent('app-toast', { detail: { message: 'Program deleted', variant: 'success' } }));
      setIsDeleteOpen(false);
      loadData();
    } catch (err: any) {
      window.dispatchEvent(new CustomEvent('app-toast', { detail: { message: err.message, variant: 'error' } }));
    }
  };

  const filteredPrograms = filterCategory === 'all' ? programs : programs.filter(p => p.category_id === filterCategory);

  if (loading) return <div className="p-8 text-center text-[#6B7280]">Loading programs...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white p-6 rounded-xl shadow-sm border border-[#E5E7EB]">
        <div>
          <h2 className="text-2xl font-bold text-[#111827]">Programs Management</h2>
          <p className="text-[#6B7280] mt-1">Manage IOCA programs across all categories</p>
        </div>
        <AdminButton onClick={() => openForm()} icon={Plus}>New Program</AdminButton>
      </div>

      <div className="flex gap-2 pb-4 overflow-x-auto">
        <button onClick={() => setFilterCategory('all')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filterCategory === 'all' ? 'bg-[#1E293B] text-white' : 'bg-white text-[#6B7280] hover:bg-[#F3F4F6] border border-[#E5E7EB]'}`}>All Programs</button>
        {categories.map(cat => (
          <button key={cat.id} onClick={() => setFilterCategory(cat.id)} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${filterCategory === cat.id ? 'bg-[#1E293B] text-white' : 'bg-white text-[#6B7280] hover:bg-[#F3F4F6] border border-[#E5E7EB]'}`}>
            <span dangerouslySetInnerHTML={{ __html: cat.icon_svg || '' }} className="w-4 h-4" />
            {cat.name_en}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-[#E5E7EB] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#F9FAFB] border-b border-[#E5E7EB]">
                <th className="py-4 px-6 text-xs font-semibold text-[#6B7280] uppercase tracking-wider">Cover</th>
                <th className="py-4 px-6 text-xs font-semibold text-[#6B7280] uppercase tracking-wider">Title</th>
                <th className="py-4 px-6 text-xs font-semibold text-[#6B7280] uppercase tracking-wider">Category</th>
                <th className="py-4 px-6 text-xs font-semibold text-[#6B7280] uppercase tracking-wider">Status</th>
                <th className="py-4 px-6 text-xs font-semibold text-[#6B7280] uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E7EB]">
              {filteredPrograms.map(prog => (
                <tr key={prog.id} className="hover:bg-[#F9FAFB] transition-colors">
                  <td className="py-4 px-6">
                    {prog.image_url ? <img src={prog.image_url} alt="" className="w-16 h-10 object-cover rounded shadow-sm" /> : <div className="w-16 h-10 bg-[#F3F4F6] rounded flex items-center justify-center text-[#9CA3AF]"><ImageIcon className="w-5 h-5" /></div>}
                  </td>
                  <td className="py-4 px-6">
                    <p className="text-sm font-medium text-[#111827]">{prog.title_en}</p>
                    <p className="text-sm text-[#6B7280] font-urdu" dir="rtl">{prog.title_ur}</p>
                  </td>
                  <td className="py-4 px-6 text-sm text-[#6B7280]">{prog.category?.name_en || 'Unknown'}</td>
                  <td className="py-4 px-6">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${prog.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>{prog.status}</span>
                  </td>
                  <td className="py-4 px-6 text-sm text-right space-x-3">
                    <button onClick={() => openForm(prog)} className="text-[#0D9488] hover:text-[#0F766E] transition-colors"><Edit2 className="w-4 h-4" /></button>
                    <button onClick={() => { setSelectedProgram(prog); setIsDeleteOpen(true); }} className="text-[#EF4444] hover:text-[#DC2626] transition-colors"><Trash2 className="w-4 h-4" /></button>
                  </td>
                </tr>
              ))}
              {filteredPrograms.length === 0 && <tr><td colSpan={5} className="py-8 text-center text-[#6B7280]">No programs found.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      <Modal isOpen={isFormOpen} onClose={() => setIsFormOpen(false)} title={selectedProgram ? 'Edit Program' : 'New Program'} maxWidth="max-w-4xl">
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-[#111827] mb-1">Title (English)</label>
              <input type="text" required value={formData.titleEn} onChange={e => setFormData({ ...formData, titleEn: e.target.value })} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#0D9488]" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-[#111827] mb-1 text-right font-urdu">Title (Urdu)</label>
              <input type="text" dir="rtl" required value={formData.titleUr} onChange={e => setFormData({ ...formData, titleUr: e.target.value })} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#0D9488] font-urdu" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-[#111827] mb-1">Description (English)</label>
              <textarea required rows={2} value={formData.descEn} onChange={e => setFormData({ ...formData, descEn: e.target.value })} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#0D9488]" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-[#111827] mb-1 text-right font-urdu">Description (Urdu)</label>
              <textarea dir="rtl" required rows={2} value={formData.descUr} onChange={e => setFormData({ ...formData, descUr: e.target.value })} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#0D9488] font-urdu" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-[#111827] mb-1">Full Content (English)</label>
              <textarea required rows={4} value={formData.contentEn} onChange={e => setFormData({ ...formData, contentEn: e.target.value })} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#0D9488]" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-[#111827] mb-1 text-right font-urdu">Full Content (Urdu)</label>
              <textarea dir="rtl" required rows={4} value={formData.contentUr} onChange={e => setFormData({ ...formData, contentUr: e.target.value })} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#0D9488] font-urdu" />
            </div>
          </div>
          
          <div className="grid grid-cols-3 gap-4 bg-[#F9FAFB] p-4 rounded-lg border border-[#E5E7EB]">
            <div>
              <label className="block text-sm font-semibold text-[#111827] mb-1">Total Beneficiaries</label>
              <input type="number" required value={formData.statsBeneficiaries} onChange={e => setFormData({ ...formData, statsBeneficiaries: parseInt(e.target.value) || 0 })} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#0D9488]" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-[#111827] mb-1">Total Projects</label>
              <input type="number" required value={formData.statsProjects} onChange={e => setFormData({ ...formData, statsProjects: parseInt(e.target.value) || 0 })} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#0D9488]" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-[#111827] mb-1">Active Volunteers</label>
              <input type="number" required value={formData.statsVolunteers} onChange={e => setFormData({ ...formData, statsVolunteers: parseInt(e.target.value) || 0 })} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#0D9488]" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-[#111827] mb-1">Category</label>
              <select required value={formData.categoryId} onChange={e => setFormData({ ...formData, categoryId: e.target.value })} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#0D9488]">
                <option value="" disabled>Select a category...</option>
                {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name_en}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-[#111827] mb-1">Status</label>
              <select value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value })} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#0D9488]">
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-[#111827] mb-1">Cover Image</label>
            <input type="file" accept="image/*" onChange={e => setSelectedFile(e.target.files?.[0] || null)} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#0D9488] text-sm file:mr-4 file:py-1 file:px-3 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-[#0D9488]/10 file:text-[#0D9488] hover:file:bg-[#0D9488]/20" />
            {selectedProgram?.image_url && !selectedFile && <p className="text-xs text-[#6B7280] mt-1">Leave empty to keep current image</p>}
          </div>

          <div className="pt-4 border-t flex justify-end gap-3">
            <AdminButton type="button" variant="secondary" onClick={() => setIsFormOpen(false)}>Cancel</AdminButton>
            <AdminButton type="submit" isLoading={saving}>Save Program</AdminButton>
          </div>
        </form>
      </Modal>

      <ConfirmDialog isOpen={isDeleteOpen} onClose={() => setIsDeleteOpen(false)} onConfirm={handleDelete} title="Delete Program" message="Are you sure you want to delete this program?" confirmLabel="Delete" isDangerous />
    </div>
  );
}
