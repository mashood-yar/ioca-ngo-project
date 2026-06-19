import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Image as ImageIcon } from 'lucide-react';
import { fetchApi } from '../../lib/apiClient';
import { Modal } from '../../components/ui/Modal';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { useCloudinaryUpload } from '../../hooks/useCloudinaryUpload';
import { optimizeImage } from '../../lib/optimizeImage';
import { AdminButton } from './AdminButton';

interface NewsPost {
  id: string;
  title: string;
  content: string;
  image_url?: string;
  published_at?: string;
}

export function AdminPosts() {
  const [posts, setPosts] = useState<NewsPost[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedPost, setSelectedPost] = useState<NewsPost | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({ title: '', content: '', published_at: '' });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);

  const { upload, uploading } = useCloudinaryUpload();

  const loadPosts = async () => {
    try {
      const { data } = await fetchApi<NewsPost[]>('/news');
      if (data) setPosts(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPosts();
  }, []);

  const handleOpenForm = (post?: NewsPost) => {
    if (post) {
      setSelectedPost(post);
      setFormData({
        title: post.title,
        content: post.content,
        published_at: post.published_at ? new Date(post.published_at).toISOString().slice(0, 16) : '',
      });
    } else {
      setSelectedPost(null);
      setFormData({ title: '', content: '', published_at: '' });
    }
    setSelectedFile(null);
    setIsFormOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      let imageUrl = selectedPost?.image_url;

      if (selectedFile) {
        const uploadResult = await upload(selectedFile, 'ioca/news');
        if (uploadResult) {
          imageUrl = uploadResult.url;
        }
      }

      const payload = {
        title: formData.title,
        content: formData.content,
        publishedAt: formData.published_at ? new Date(formData.published_at).toISOString() : null,
        imageUrl,
      };

      if (selectedPost) {
        await fetchApi(`/news/${selectedPost.id}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
        window.dispatchEvent(new CustomEvent('app-toast', { detail: { message: 'Post updated successfully', variant: 'success' }}));
      } else {
        await fetchApi('/news', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        window.dispatchEvent(new CustomEvent('app-toast', { detail: { message: 'Post created successfully', variant: 'success' }}));
      }

      setIsFormOpen(false);
      loadPosts();
    } catch (err) {
      window.dispatchEvent(new CustomEvent('app-toast', { detail: { message: 'Failed to save post', variant: 'error' }}));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedPost) return;
    try {
      await fetchApi(`/news/${selectedPost.id}`, { method: 'DELETE' });
      window.dispatchEvent(new CustomEvent('app-toast', { detail: { message: 'Post deleted', variant: 'success' }}));
      loadPosts();
    } catch (err) {
      window.dispatchEvent(new CustomEvent('app-toast', { detail: { message: 'Failed to delete', variant: 'error' }}));
    }
  };

  if (loading) return <div className="p-8">Loading posts...</div>;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">News & Posts</h1>
          <p className="text-gray-500 mt-1">Manage public news articles</p>
        </div>
        <AdminButton
          onClick={() => handleOpenForm()}
          variant="accent"
          icon={<Plus className="w-5 h-5" />}
        >
          New Post
        </AdminButton>
      </div>

      <div className="bg-white border border-[#E5E7EB] rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#F9FAFB] border-b border-[#E5E7EB] text-xs font-semibold text-[#6B7280] uppercase tracking-wider">
                <th className="p-4 pl-6">Cover</th>
                <th className="p-4">Title</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right pr-6">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E7EB]">
              {posts.map((post) => (
                <tr key={post.id} className="hover:bg-[#F9FAFB] transition-colors duration-100 text-[#111827] text-sm">
                  <td className="p-4 pl-6 w-24">
                    {post.image_url ? (
                      <img src={optimizeImage(post.image_url, { width: 80 })} alt={post.title} className="w-16 h-12 object-cover rounded-lg border border-[#E5E7EB]" width={64} height={48} loading="lazy" decoding="async" />
                    ) : (
                      <div className="w-16 h-12 bg-gray-100 rounded-lg flex items-center justify-center border border-[#E5E7EB]">
                        <ImageIcon className="w-5 h-5 text-gray-400" />
                      </div>
                    )}
                  </td>
                  <td className="p-4 font-medium">{post.title}</td>
                  <td className="p-4">
                    {post.published_at ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#D1FAE5] text-[#065F46]">Published</span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#F3F4F6] text-[#4B5563]">Draft</span>
                    )}
                  </td>
                  <td className="p-4 pr-6 text-right space-x-2">
                    <AdminButton
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenForm(post)}
                      title="Edit"
                    >
                      <Edit2 className="w-4 h-4" />
                    </AdminButton>
                    <AdminButton
                      variant="danger"
                      size="sm"
                      onClick={() => { setSelectedPost(post); setIsDeleteOpen(true); }}
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </AdminButton>
                  </td>
                </tr>
              ))}
              {posts.length === 0 && (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-gray-500">No posts found. Create one to get started.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal
        isOpen={isFormOpen}
        onClose={() => !saving && setIsFormOpen(false)}
        title={selectedPost ? 'Edit Post' : 'New Post'}
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-[#111827] mb-1">Title</label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={e => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-3 py-2 text-[#111827] bg-white border border-[#E5E7EB] rounded-lg placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#0D9488] focus:border-[#0D9488] disabled:bg-[#F9FAFB] disabled:text-[#6B7280] disabled:cursor-not-allowed transition-colors duration-150"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-[#111827] mb-1">Content</label>
            <textarea
              required
              rows={6}
              value={formData.content}
              onChange={e => setFormData({ ...formData, content: e.target.value })}
              className="w-full px-3 py-2 text-[#111827] bg-white border border-[#E5E7EB] rounded-lg placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#0D9488] focus:border-[#0D9488] disabled:bg-[#F9FAFB] disabled:text-[#6B7280] disabled:cursor-not-allowed transition-colors duration-150"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-[#111827] mb-1">Publish Date (Optional)</label>
              <input
                type="datetime-local"
                value={formData.published_at}
                onChange={e => setFormData({ ...formData, published_at: e.target.value })}
                className="w-full px-3 py-2 text-[#111827] bg-white border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0D9488] focus:border-[#0D9488] disabled:bg-[#F9FAFB] disabled:text-[#6B7280] disabled:cursor-not-allowed transition-colors duration-150"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-[#111827] mb-1">Cover Image</label>
              <input
                type="file"
                accept="image/*"
                onChange={e => setSelectedFile(e.target.files?.[0] || null)}
                className="w-full px-3 py-2 text-[#111827] bg-white border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0D9488] focus:border-[#0D9488] disabled:bg-[#F9FAFB] disabled:text-[#6B7280] disabled:cursor-not-allowed transition-colors duration-150 text-sm file:mr-4 file:py-1 file:px-3 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-[#0D9488]/10 file:text-[#0D9488] hover:file:bg-[#0D9488]/20"
              />
            </div>
          </div>
          
          <div className="pt-4 border-t border-gray-100 flex justify-end gap-3">
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
              Save Post
            </AdminButton>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        title="Delete Post"
        message="Are you sure you want to delete this post? This cannot be undone."
        confirmLabel="Delete"
        onConfirm={handleDelete}
      />
    </div>
  );
}
