import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Image as ImageIcon, Eye } from 'lucide-react';
import { fetchApi } from '../../lib/apiClient';
import { Modal } from '../../components/ui/Modal';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { useCloudinaryUpload } from '../../hooks/useCloudinaryUpload';
import { optimizeImage } from '../../lib/optimizeImage';
import { AdminButton } from './AdminButton';

interface GalleryImage {
  id: string;
  title: string;
  image_url: string;
  image_public_id: string | null;
  caption: string | null;
  category: string | null;
  created_at: string;
}

export function AdminGallery() {
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterCategory, setFilterCategory] = useState<string>('all');

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<GalleryImage | null>(null);

  const [formData, setFormData] = useState({
    title: '',
    caption: '',
    category: '',
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const { upload, uploading } = useCloudinaryUpload();

  const loadImages = async () => {
    try {
      const { data } = await fetchApi<GalleryImage[]>('/gallery');
      if (data) setImages(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadImages();
  }, []);

  // Get unique categories from images
  const categories = Array.from(new Set(images.map(img => img.category).filter(Boolean))) as string[];

  const handleOpenForm = () => {
    setFormData({ title: '', caption: '', category: '' });
    setSelectedFile(null);
    setPreviewUrl(null);
    setIsFormOpen(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setSelectedFile(file);
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => setPreviewUrl(ev.target?.result as string);
      reader.readAsDataURL(file);
    } else {
      setPreviewUrl(null);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      window.dispatchEvent(new CustomEvent('app-toast', { detail: { message: 'Please select an image', variant: 'error' } }));
      return;
    }

    setSaving(true);
    try {
      const uploadResult = await upload(selectedFile, 'ioca/gallery');
      if (!uploadResult) {
        window.dispatchEvent(new CustomEvent('app-toast', { detail: { message: 'Image upload failed', variant: 'error' } }));
        return;
      }

      const payload = {
        title: formData.title,
        imageUrl: uploadResult.url,
        imagePublicId: uploadResult.publicId,
        caption: formData.caption || null,
        category: formData.category || null,
      };

      const result = await fetchApi<any>('/gallery', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      if (result.error) {
        window.dispatchEvent(new CustomEvent('app-toast', { detail: { message: `Failed to save: ${result.error}`, variant: 'error' } }));
        return;
      }

      window.dispatchEvent(new CustomEvent('app-toast', { detail: { message: 'Image uploaded to gallery', variant: 'success' } }));
      setIsFormOpen(false);
      loadImages();
    } catch (err: any) {
      window.dispatchEvent(new CustomEvent('app-toast', { detail: { message: `Unexpected error: ${err.message || err}`, variant: 'error' } }));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedImage) return;
    try {
      await fetchApi(`/gallery/${selectedImage.id}`, { method: 'DELETE' });
      window.dispatchEvent(new CustomEvent('app-toast', { detail: { message: 'Image deleted', variant: 'success' } }));
      loadImages();
    } catch (err) {
      window.dispatchEvent(new CustomEvent('app-toast', { detail: { message: 'Failed to delete', variant: 'error' } }));
    }
  };

  const filteredImages = filterCategory === 'all'
    ? images
    : images.filter(img => img.category === filterCategory);

  if (loading) return <div className="p-8">Loading gallery...</div>;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gallery</h1>
          <p className="text-gray-500 mt-1">Manage IOCA photo gallery</p>
        </div>
        <AdminButton
          onClick={handleOpenForm}
          variant="accent"
          icon={<Plus className="w-5 h-5" />}
        >
          Upload Image
        </AdminButton>
      </div>

      {/* Category Filter */}
      {categories.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setFilterCategory('all')}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              filterCategory === 'all'
                ? 'bg-[#1D2D49] text-white'
                : 'bg-white text-gray-600 border border-[#E5E7EB] hover:bg-gray-50'
            }`}
          >
            All ({images.length})
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setFilterCategory(cat)}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                filterCategory === cat
                  ? 'bg-[#1D2D49] text-white'
                  : 'bg-white text-gray-600 border border-[#E5E7EB] hover:bg-gray-50'
              }`}
            >
              {cat} ({images.filter(img => img.category === cat).length})
            </button>
          ))}
        </div>
      )}

      {/* Image Grid */}
      {filteredImages.length === 0 ? (
        <div className="bg-white border border-[#E5E7EB] rounded-2xl p-12 text-center">
          <ImageIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-600 mb-1">No images yet</h3>
          <p className="text-gray-400 text-sm">Upload your first image to get started</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredImages.map((image) => (
            <div
              key={image.id}
              className="group relative bg-white border border-[#E5E7EB] rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200"
            >
              <div className="aspect-square overflow-hidden">
                <img
                  src={optimizeImage(image.image_url, { width: 400 })}
                  alt={image.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  loading="lazy"
                  decoding="async"
                />
              </div>

              {/* Overlay with actions */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col justify-end p-3">
                <div className="flex gap-2 justify-end mb-2">
                  <button
                    onClick={() => { setSelectedImage(image); setIsPreviewOpen(true); }}
                    className="p-2 bg-white/90 rounded-lg hover:bg-white transition-colors"
                    title="Preview"
                  >
                    <Eye className="w-4 h-4 text-gray-700" />
                  </button>
                  <button
                    onClick={() => { setSelectedImage(image); setIsDeleteOpen(true); }}
                    className="p-2 bg-red-500/90 rounded-lg hover:bg-red-600 transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4 text-white" />
                  </button>
                </div>
              </div>

              {/* Info bar */}
              <div className="p-3">
                <h3 className="text-sm font-medium text-gray-900 truncate">{image.title}</h3>
                {image.caption && (
                  <p className="text-xs text-gray-500 truncate mt-0.5">{image.caption}</p>
                )}
                <div className="flex items-center justify-between mt-2">
                  {image.category && (
                    <span className="text-xs px-2 py-0.5 bg-[#0D9488]/10 text-[#0D9488] rounded-full font-medium">
                      {image.category}
                    </span>
                  )}
                  <span className="text-xs text-gray-400">
                    {new Date(image.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload Modal */}
      <Modal
        isOpen={isFormOpen}
        onClose={() => !saving && setIsFormOpen(false)}
        title="Upload Image"
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
              placeholder="Image title"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-[#111827] mb-1">Caption (optional)</label>
            <input
              type="text"
              value={formData.caption}
              onChange={e => setFormData({ ...formData, caption: e.target.value })}
              className="w-full px-3 py-2 text-[#111827] bg-white border border-[#E5E7EB] rounded-lg placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#0D9488] focus:border-[#0D9488] transition-colors duration-150"
              placeholder="Brief description"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-[#111827] mb-1">Category (optional)</label>
            <input
              type="text"
              value={formData.category}
              onChange={e => setFormData({ ...formData, category: e.target.value })}
              className="w-full px-3 py-2 text-[#111827] bg-white border border-[#E5E7EB] rounded-lg placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#0D9488] focus:border-[#0D9488] transition-colors duration-150"
              placeholder="e.g. Events, Community, Education"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-[#111827] mb-1">Image *</label>
            <input
              type="file"
              accept="image/*"
              required
              onChange={handleFileChange}
              className="w-full px-3 py-2 text-[#111827] bg-white border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0D9488] focus:border-[#0D9488] transition-colors duration-150 text-sm file:mr-4 file:py-1 file:px-3 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-[#0D9488]/10 file:text-[#0D9488] hover:file:bg-[#0D9488]/20"
            />
            {previewUrl && (
              <div className="mt-3 rounded-lg overflow-hidden border border-[#E5E7EB]">
                <img src={previewUrl} alt="Preview" className="w-full max-h-48 object-cover" />
              </div>
            )}
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
              Upload
            </AdminButton>
          </div>
        </form>
      </Modal>

      {/* Preview Modal */}
      <Modal
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        title={selectedImage?.title || 'Image Preview'}
        maxWidth="max-w-4xl"
      >
        {selectedImage && (
          <div>
            <img
              src={optimizeImage(selectedImage.image_url, { width: 1200 })}
              alt={selectedImage.title}
              className="w-full rounded-lg"
            />
            {selectedImage.caption && (
              <p className="mt-4 text-gray-600">{selectedImage.caption}</p>
            )}
            <div className="mt-3 flex items-center gap-3 text-sm text-gray-400">
              {selectedImage.category && (
                <span className="px-2 py-0.5 bg-[#0D9488]/10 text-[#0D9488] rounded-full font-medium">
                  {selectedImage.category}
                </span>
              )}
              <span>{new Date(selectedImage.created_at).toLocaleDateString()}</span>
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        title="Delete Image"
        message="Are you sure you want to delete this image? This action cannot be undone."
        confirmLabel="Delete"
        onConfirm={handleDelete}
      />
    </div>
  );
}
