import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Image as ImageIcon } from 'lucide-react';
import { fetchApi } from '../../lib/apiClient';
import { Modal } from '../../components/ui/Modal';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { useCloudinaryUpload } from '../../hooks/useCloudinaryUpload';
import { optimizeImage } from '../../lib/optimizeImage';
import { AdminButton } from './AdminButton';

export const AdminImpactStories: React.FC = () => {
  const [stories, setStories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedStory, setSelectedStory] = useState<any>(null);
  
  const { upload, uploading } = useCloudinaryUpload();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');

  const [formData, setFormData] = useState({
    titleEn: '',
    titleUr: '',
    excerptEn: '',
    excerptUr: '',
    contentEn: '',
    contentUr: '',
    category: 'General'
  });

  const loadStories = async () => {
    try {
      const { data } = await fetchApi<any[]>('/impact-stories');
      if (data) setStories(data);
    } catch (err) {
      console.error('Failed to load stories', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStories();
  }, []);

  const handleOpenForm = (s?: any) => {
    if (s) {
      setSelectedStory(s);
      setFormData({
        titleEn: s.title_en || s.titleEn || '',
        titleUr: s.title_ur || s.titleUr || '',
        excerptEn: s.excerpt_en || s.excerptEn || '',
        excerptUr: s.excerpt_ur || s.excerptUr || '',
        contentEn: s.content_en || s.contentEn || '',
        contentUr: s.content_ur || s.contentUr || '',
        category: s.category || 'General'
      });
      setImagePreview(s.image_url ? optimizeImage(s.image_url, { width: 400 }) : '');
    } else {
      setSelectedStory(null);
      setFormData({ titleEn: '', titleUr: '', excerptEn: '', excerptUr: '', contentEn: '', contentUr: '', category: 'General' });
      setImagePreview('');
    }
    setSelectedFile(null);
    setIsFormOpen(true);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      let imageUrl = selectedStory?.image_url;
      if (selectedFile) {
        const uploadResult = await upload(selectedFile, 'impact');
        if (uploadResult) {
          imageUrl = uploadResult;
        } else {
          throw new Error('Image upload failed');
        }
      }

      const payload = {
        titleEn: formData.titleEn,
        titleUr: formData.titleUr,
        excerptEn: formData.excerptEn,
        excerptUr: formData.excerptUr,
        contentEn: formData.contentEn,
        contentUr: formData.contentUr,
        category: formData.category,
        imageUrl
      };

      if (selectedStory) {
        await fetchApi(/impact-stories/ + selectedStory.id, { method: 'PATCH', body: JSON.stringify(payload) });
      } else {
        await fetchApi('/impact-stories', { method: 'POST', body: JSON.stringify(payload) });
      }
      setIsFormOpen(false);
      loadStories();
    } catch (error) {
      console.error('Error saving story:', error);
      alert('Failed to save impact story');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedStory) return;
    try {
      await fetchApi(/impact-stories/ + selectedStory.id, { method: 'DELETE' });
      setIsDeleteOpen(false);
      loadStories();
    } catch (error) {
      console.error('Error deleting story:', error);
      alert('Failed to delete impact story');
    }
  };

  if (loading) return <div className="p-8 text-center">Loading stories...</div>;

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Impact Stories</h1>
          <p className="text-gray-500 mt-1">Manage real stories of transformation</p>
        </div>
        <AdminButton onClick={() => handleOpenForm()} variant="accent" icon={<Plus className="w-5 h-5" />}>
          New Story
        </AdminButton>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="p-4 font-semibold text-gray-600">Image</th>
                <th className="p-4 font-semibold text-gray-600">Title</th>
                <th className="p-4 font-semibold text-gray-600">Category</th>
                <th className="p-4 font-semibold text-gray-600 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {stories.map((s) => (
                <tr key={s.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                  <td className="p-4">
                    {s.image_url ? (
                      <img src={optimizeImage(s.image_url, { width: 100 })} alt="Story" className="w-16 h-12 object-cover rounded-md" />
                    ) : (
                      <div className="w-16 h-12 bg-gray-100 rounded-md flex items-center justify-center text-gray-400">
                        <ImageIcon className="w-6 h-6" />
                      </div>
                    )}
                  </td>
                  <td className="p-4 font-medium">{s.title_en}</td>
                  <td className="p-4 text-gray-500">{s.category}</td>
                  <td className="p-4 text-right space-x-2">
                    <AdminButton variant="outline" size="sm" onClick={() => handleOpenForm(s)} title="Edit">
                      <Edit2 className="w-4 h-4" />
                    </AdminButton>
                    <AdminButton variant="danger" size="sm" onClick={() => { setSelectedStory(s); setIsDeleteOpen(true); }} title="Delete">
                      <Trash2 className="w-4 h-4" />
                    </AdminButton>
                  </td>
                </tr>
              ))}
              {stories.length === 0 && (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-gray-500">No impact stories found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal isOpen={isFormOpen} onClose={() => setIsFormOpen(false)} title={selectedStory ? 'Edit Story' : 'New Story'} maxWidth="max-w-4xl">
        <form onSubmit={handleSave} className="space-y-6 max-h-[80vh] overflow-y-auto px-1">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="col-span-1 md:col-span-2 flex flex-col justify-center mb-4">
              <div className="relative w-full max-w-md h-48 bg-gray-100 rounded-xl overflow-hidden group border-2 border-dashed border-gray-300 mx-auto">
                {imagePreview ? (
                  <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400">
                    <ImageIcon className="w-8 h-8 mb-2" />
                    <span className="text-sm font-medium">Click to upload image</span>
                  </div>
                )}
                <input type="file" accept="image/*" onChange={handleImageChange} className="absolute inset-0 opacity-0 cursor-pointer" />
              </div>
              <p className="text-[11px] text-[#6B7280] mt-2 flex items-center justify-center gap-1 w-full text-center">ℹ️ Recommended: 4:3 or 16:9 Landscape</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Title (English) *</label>
              <input type="text" required value={formData.titleEn} onChange={e => setFormData({...formData, titleEn: e.target.value})} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-brand-teal focus:border-brand-teal" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Title (Urdu)</label>
              <input type="text" dir="rtl" value={formData.titleUr} onChange={e => setFormData({...formData, titleUr: e.target.value})} className="w-full px-4 py-2 border rounded-lg font-urduBody" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
              <input type="text" required value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="w-full px-4 py-2 border rounded-lg" />
            </div>
            <div></div>

            <div className="col-span-1 md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Excerpt (English)</label>
              <textarea rows={2} value={formData.excerptEn} onChange={e => setFormData({...formData, excerptEn: e.target.value})} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-brand-teal" />
            </div>
            <div className="col-span-1 md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Excerpt (Urdu)</label>
              <textarea rows={2} dir="rtl" value={formData.excerptUr} onChange={e => setFormData({...formData, excerptUr: e.target.value})} className="w-full px-4 py-2 border rounded-lg font-urduBody" />
            </div>

            <div className="col-span-1 md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Content (English)</label>
              <textarea rows={6} value={formData.contentEn} onChange={e => setFormData({...formData, contentEn: e.target.value})} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-brand-teal" />
            </div>
            <div className="col-span-1 md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Content (Urdu)</label>
              <textarea rows={6} dir="rtl" value={formData.contentUr} onChange={e => setFormData({...formData, contentUr: e.target.value})} className="w-full px-4 py-2 border rounded-lg font-urduBody" />
            </div>
          </div>
          
          <div className="flex justify-end gap-3 pt-4 border-t">
            <AdminButton type="button" onClick={() => setIsFormOpen(false)} variant="ghost" disabled={saving || uploading}>Cancel</AdminButton>
            <AdminButton type="submit" variant="primary" disabled={saving || uploading}>{saving || uploading ? 'Saving...' : (selectedStory ? 'Update Story' : 'Create Story')}</AdminButton>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDelete}
        title="Delete Story"
        message={`Are you sure you want to delete the story '${selectedStory?.title_en}'? This action cannot be undone.`}
        confirmLabel="Delete Story"
        isDestructive={true}
      />
    </div>
  );
};
