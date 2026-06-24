import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Image as ImageIcon } from 'lucide-react';
import { fetchApi } from '../../lib/apiClient';
import { Modal } from '../../components/ui/Modal';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { useCloudinaryUpload } from '../../hooks/useCloudinaryUpload';
import { optimizeImage } from '../../lib/optimizeImage';
import { AdminButton } from './AdminButton';

interface Program {
  id: string;
  title: string;
  description: string;
  category: 'education' | 'health' | 'youth' | 'community_bonding';
  image_url: string | null;
  status: 'active' | 'inactive';
  created_at: string;
}

const categoryLabels: Record<string, string> = {
  education: '📚 Education',
  health: '🏥 Health',
  youth: '👥 Youth',
  community_bonding: '🤝 Community Bonding',
};

const categoryColors: Record<string, string> = {
  education: 'bg-blue-100 text-blue-700',
  health: 'bg-rose-100 text-rose-700',
  youth: 'bg-violet-100 text-violet-700',
  community_bonding: 'bg-amber-100 text-amber-700',
};

export function AdminPrograms() {
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterCategory, setFilterCategory] = useState<string>('all');

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedProgram, setSelectedProgram] = useState<Program | null>(null);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'education' as Program['category'],
    status: 'active' as Program['status'],
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);

  const { upload, uploading } = useCloudinaryUpload();

  const loadPrograms = async () => {
    try {
      const { data } = await fetchApi<Program[]>('/programs');
      if (data) setPrograms(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPrograms();
  }, []);

  const handleOpenForm = (program?: Program) => {
    if (program) {
      setSelectedProgram(program);
      setFormData({
        title: program.title,
        description: program.description,
        category: program.category,
        status: program.status,
      });
    } else {
      setSelectedProgram(null);
      setFormData({ title: '', description: '', category: 'education', status: 'active' });
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

      const payload = {
        title: formData.title,
        description: formData.description,
        category: formData.category,
        status: formData.status,
        imageUrl,
      };

      const url = selectedProgram ? `/programs/${selectedProgram.id}` : '/programs';
      const method = selectedProgram ? 'PUT' : 'POST';

      const result = await fetchApi<any>(url, {
        method,
        body: JSON.stringify(payload),
      });

      if (result.error) {
        window.dispatchEvent(new CustomEvent('app-toast', { detail: { message: `Failed to save: ${result.error}`, variant: 'error' } }));
        return;
      }

      window.dispatchEvent(new CustomEvent('app-toast', { detail: { message: selectedProgram ? 'Program updated' : 'Program created', variant: 'success' } }));
      setIsFormOpen(false);
      loadPrograms();
    } catch (err: any) {
      window.dispatchEvent(new CustomEvent('app-toast', { detail: { message: `Unexpected error: ${err.message || err}`, variant: 'error' } }));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedProgram) return;
    try {
      await fetchApi(`/programs/${selectedProgram.id}`, { method: 'DELETE' });
      window.dispatchEvent(new CustomEvent('app-toast', { detail: { message: 'Program deleted', variant: 'success' } }));
      loadPrograms();
    } catch (err) {
      window.dispatchEvent(new CustomEvent('app-toast', { detail: { message: 'Failed to delete', variant: 'error' } }));
    }
  };

  const filteredPrograms = filterCategory === 'all'
    ? programs
    : programs.filter(p => p.category === filterCategory);

  if (loading) return <div className="p-8">Loading programs...</div>;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Programs</h1>
          <p className="text-gray-500 mt-1">Manage IOCA programs across all categories</p>
        </div>
        <AdminButton
          onClick={() => handleOpenForm()}
          variant="accent"
          icon={<Plus className="w-5 h-5" />}
        >
          New Program
        </AdminButton>
      </div>

      {/* Category Filter */}
      <div className="flex flex-wrap gap-2">
        {[
          { value: 'all', label: 'All Programs' },
          { value: 'education', label: '📚 Education' },
          { value: 'health', label: '🏥 Health' },
          { value: 'youth', label: '👥 Youth' },
          { value: 'community_bonding', label: '🤝 Community Bonding' },
        ].map((cat) => (
          <button
            key={cat.value}
            onClick={() => setFilterCategory(cat.value)}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              filterCategory === cat.value
                ? 'bg-[#1D2D49] text-white'
                : 'bg-white text-gray-600 border border-[#E5E7EB] hover:bg-gray-50'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white border border-[#E5E7EB] rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#F9FAFB] border-b border-[#E5E7EB] text-xs font-semibold text-[#6B7280] uppercase tracking-wider">
                <th className="p-4 pl-6">Cover</th>
                <th className="p-4">Title</th>
                <th className="p-4">Category</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right pr-6">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E7EB]">
              {filteredPrograms.map((program) => (
                <tr key={program.id} className="hover:bg-[#F9FAFB] transition-colors duration-100 text-[#111827] text-sm">
                  <td className="p-4 pl-6 w-24">
                    {program.image_url ? (
                      <img src={optimizeImage(program.image_url, { width: 80 })} alt={program.title} className="w-16 h-12 object-cover rounded-lg border border-[#E5E7EB]" width={64} height={48} loading="lazy" decoding="async" />
                    ) : (
                      <div className="w-16 h-12 bg-gray-100 rounded-lg flex items-center justify-center border border-[#E5E7EB]">
                        <ImageIcon className="w-5 h-5 text-gray-400" />
                      </div>
                    )}
                  </td>
                  <td className="p-4 font-medium">{program.title}</td>
                  <td className="p-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${categoryColors[program.category] || 'bg-gray-100 text-gray-700'}`}>
                      {categoryLabels[program.category] || program.category}
                    </span>
                  </td>
                  <td className="p-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      program.status === 'active'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-100 text-gray-500'
                    }`}>
                      {program.status}
                    </span>
                  </td>
                  <td className="p-4 pr-6 text-right space-x-2">
                    <AdminButton
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenForm(program)}
                      title="Edit"
                    >
                      <Edit2 className="w-4 h-4" />
                    </AdminButton>
                    <AdminButton
                      variant="danger"
                      size="sm"
                      onClick={() => { setSelectedProgram(program); setIsDeleteOpen(true); }}
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </AdminButton>
                  </td>
                </tr>
              ))}
              {filteredPrograms.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-gray-500">No programs found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create/Edit Modal */}
      <Modal
        isOpen={isFormOpen}
        onClose={() => !saving && setIsFormOpen(false)}
        title={selectedProgram ? 'Edit Program' : 'New Program'}
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-[#111827] mb-1">Title</label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={e => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-3 py-2 text-[#111827] bg-white border border-[#E5E7EB] rounded-lg placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#0D9488] focus:border-[#0D9488] transition-colors duration-150"
              placeholder="Program title"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-[#111827] mb-1">Description</label>
            <textarea
              required
              rows={4}
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 text-[#111827] bg-white border border-[#E5E7EB] rounded-lg placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#0D9488] focus:border-[#0D9488] transition-colors duration-150"
              placeholder="Describe the program"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-[#111827] mb-1">Category</label>
              <select
                value={formData.category}
                onChange={e => setFormData({ ...formData, category: e.target.value as Program['category'] })}
                className="w-full px-3 py-2 text-[#111827] bg-white border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0D9488] focus:border-[#0D9488] transition-colors duration-150"
              >
                <option value="education">📚 Education</option>
                <option value="health">🏥 Health</option>
                <option value="youth">👥 Youth</option>
                <option value="community_bonding">🤝 Community Bonding</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-[#111827] mb-1">Status</label>
              <select
                value={formData.status}
                onChange={e => setFormData({ ...formData, status: e.target.value as Program['status'] })}
                className="w-full px-3 py-2 text-[#111827] bg-white border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0D9488] focus:border-[#0D9488] transition-colors duration-150"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-[#111827] mb-1">Cover Image</label>
            <input
              type="file"
              accept="image/*"
              onChange={e => setSelectedFile(e.target.files?.[0] || null)}
              className="w-full px-3 py-2 text-[#111827] bg-white border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0D9488] focus:border-[#0D9488] transition-colors duration-150 text-sm file:mr-4 file:py-1 file:px-3 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-[#0D9488]/10 file:text-[#0D9488] hover:file:bg-[#0D9488]/20"
            />
          </div>

          <div className="pt-4 border-t border-[#E5E7EB] flex justify-end gap-3">
            <AdminButton
              type="button"
              onClick={() => setIsFormOpen(false)}
              variant="ghost"
              disabled={saving || uploading}
            >
              Cancel
            </AdminButton>
            <AdminButton
              type="submit"
              variant="accent"
              isLoading={saving || uploading}
            >
              {selectedProgram ? 'Update Program' : 'Create Program'}
            </AdminButton>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        title="Delete Program"
        message="Are you sure you want to delete this program? This action cannot be undone."
        confirmLabel="Delete"
        onConfirm={handleDelete}
      />
    </div>
  );
}
