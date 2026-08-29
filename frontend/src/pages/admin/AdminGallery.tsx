import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Image as ImageIcon } from 'lucide-react';
import { fetchApi } from '../../lib/apiClient';
import { Modal } from '../../components/ui/Modal';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { useCloudinaryUpload } from '../../hooks/useCloudinaryUpload';
import { optimizeImage } from '../../lib/optimizeImage';
import { AdminButton } from './AdminButton';

interface GalleryItem {
  id: string;
  image_url: string;
  title_en: string;
  title_ur: string;
  desc_en: string;
  desc_ur: string;
  category: string;
  sort_order: number;
}

export function AdminGallery() {
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<GalleryItem | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    title_en: '', title_ur: '', desc_en: '', desc_ur: '', category: '', sort_order: 0
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);

  const { upload, uploading } = useCloudinaryUpload();

  const loadItems = async () => {
    try {
      const [galleryRes, catsRes] = await Promise.all([
        fetchApi<GalleryItem[]>('/gallery'),
        fetchApi<string[]>('/gallery/categories')
      ]);
      if (galleryRes.data) setItems(galleryRes.data);
      if (catsRes.data) setCategories(catsRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadItems();
  }, []);

  const handleOpenForm = (item?: GalleryItem) => {
    if (item) {
      setSelectedItem(item);
      setFormData({
        title_en: item.title_en || '',
        title_ur: item.title_ur || '',
        desc_en: item.desc_en || '',
        desc_ur: item.desc_ur || '',
        category: item.category || '',
        sort_order: item.sort_order || 0
      });
    } else {
      setSelectedItem(null);
      setFormData({ title_en: '', title_ur: '', desc_en: '', desc_ur: '', category: '', sort_order: 0 });
    }
    setSelectedFile(null);
    setIsFormOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      let imageUrl = selectedItem?.image_url;

      if (selectedFile) {
        const uploadResult = await upload(selectedFile, 'ioca/gallery');
        if (uploadResult) {
          imageUrl = uploadResult.url;
        }
      }

      if (!imageUrl && !selectedItem) {
        throw new Error('Image is required');
      }

      const payload = {
        title_en: formData.title_en,
        title_ur: formData.title_ur,
        desc_en: formData.desc_en,
        desc_ur: formData.desc_ur,
        category: formData.category,
        sort_order: Number(formData.sort_order),
        image_url: imageUrl,
      };

      if (selectedItem) {
        await fetchApi(`/gallery/${selectedItem.id}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
        window.dispatchEvent(new CustomEvent('app-toast', { detail: { message: 'Image updated successfully', variant: 'success' }}));
      } else {
        await fetchApi('/gallery', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        window.dispatchEvent(new CustomEvent('app-toast', { detail: { message: 'Image uploaded successfully', variant: 'success' }}));
      }

      setIsFormOpen(false);
      loadItems();
    } catch (error: any) {
      window.dispatchEvent(new CustomEvent('app-toast', { detail: { message: error.message || 'Error saving image', variant: 'error' }}));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedItem) return;
    try {
      await fetchApi(`/gallery/${selectedItem.id}`, { method: 'DELETE' });
      window.dispatchEvent(new CustomEvent('app-toast', { detail: { message: 'Image deleted', variant: 'success' }}));
      setIsDeleteOpen(false);
      loadItems();
    } catch (err) {
      console.error(err);
      window.dispatchEvent(new CustomEvent('app-toast', { detail: { message: 'Failed to delete image', variant: 'error' }}));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-brand-navy">Gallery Manager</h1>
          <p className="text-sm text-gray-500 mt-1">Manage images and dynamic categories.</p>
        </div>
        <AdminButton onClick={() => handleOpenForm()} icon={<Plus className="w-4 h-4" />}>Add Image</AdminButton>
      </div>

      {loading ? (
        <div className="animate-pulse space-y-4">
          <div className="h-48 bg-gray-200 rounded-lg"></div>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {items.map((item) => (
            <div key={item.id} className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden group">
              <div className="relative aspect-square">
                {item.image_url ? (
                  <img src={optimizeImage(item.image_url, { width: 300 })} alt={item.title_en} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                    <ImageIcon className="w-8 h-8 text-gray-400" />
                  </div>
                )}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <button type="button" onClick={() => handleOpenForm(item)} className="p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors" title="Edit">
                    <Edit2 className="w-5 h-5" />
                  </button>
                  <button type="button" onClick={() => { setSelectedItem(item); setIsDeleteOpen(true); }} className="p-2 bg-white/10 hover:bg-red-500/80 rounded-full text-white transition-colors" title="Delete">
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
                <div className="absolute top-2 right-2 bg-brand-navy/80 text-white text-[10px] px-2 py-1 rounded-full capitalize">
                  {item.category}
                </div>
              </div>
              <div className="p-3">
                <h3 className="font-semibold text-gray-900 truncate" title={item.title_en || item.title_ur}>{item.title_en || item.title_ur || 'Untitled'}</h3>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal isOpen={isFormOpen} onClose={() => !saving && setIsFormOpen(false)} title={selectedItem ? "Edit Image" : "Upload Image"}>
        <form onSubmit={handleSave} className="space-y-4">
          
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Image</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
              className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-brand-teal/10 file:text-brand-teal hover:file:bg-brand-teal/20"
              required={!selectedItem}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Title (English)</label>
              <input type="text" value={formData.title_en} onChange={e => setFormData({...formData, title_en: e.target.value})} className="w-full px-3 py-2 border rounded-md" />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Title (Urdu)</label>
              <input type="text" value={formData.title_ur} onChange={e => setFormData({...formData, title_ur: e.target.value})} className="w-full px-3 py-2 border rounded-md" dir="rtl" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Description (English)</label>
              <textarea value={formData.desc_en} onChange={e => setFormData({...formData, desc_en: e.target.value})} className="w-full px-3 py-2 border rounded-md" rows={3}></textarea>
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Description (Urdu)</label>
              <textarea value={formData.desc_ur} onChange={e => setFormData({...formData, desc_ur: e.target.value})} className="w-full px-3 py-2 border rounded-md" rows={3} dir="rtl"></textarea>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Category</label>
              <input 
                type="text" 
                list="category-suggestions" 
                value={formData.category} 
                onChange={e => setFormData({...formData, category: e.target.value.toLowerCase()})} 
                className="w-full px-3 py-2 border rounded-md" 
                placeholder="e.g. health"
              />
              <datalist id="category-suggestions">
                {categories.map(c => <option key={c} value={c} />)}
              </datalist>
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Sort Order</label>
              <input type="number" value={formData.sort_order} onChange={e => setFormData({...formData, sort_order: Number(e.target.value)})} className="w-full px-3 py-2 border rounded-md" />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <button type="button" onClick={() => setIsFormOpen(false)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50">Cancel</button>
            <button type="submit" disabled={saving || uploading} className="px-4 py-2 text-sm font-medium text-white bg-brand-navy rounded-md hover:bg-brand-navy/90 disabled:opacity-50">
              {saving || uploading ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDelete}
        title="Delete Image"
        message="Are you sure you want to delete this image? This action cannot be undone."
        confirmLabel="Delete"
        isDestructive={true}
      />
    </div>
  );
}
