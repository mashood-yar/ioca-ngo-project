import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Image as ImageIcon } from 'lucide-react';
import { fetchApi } from '../../lib/apiClient';
import { Modal } from '../../components/ui/Modal';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { useCloudinaryUpload } from '../../hooks/useCloudinaryUpload';
import { optimizeImage } from '../../lib/optimizeImage';

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
        <button
          onClick={() => handleOpenForm()}
          className="bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-lg flex items-center gap-2 font-medium transition-colors shadow-sm shadow-primary/20"
        >
          <Plus className="w-5 h-5" />
          New Post
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100 text-sm font-semibold text-gray-600">
                <th className="p-4 pl-6">Cover</th>
                <th className="p-4">Title</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right pr-6">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {posts.map((post) => (
                <tr key={post.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="p-4 pl-6 w-24">
                    {post.image_url ? (
                      <img src={optimizeImage(post.image_url, { width: 80 })} alt={post.title} className="w-16 h-12 object-cover rounded-lg border border-gray-200" width={64} height={48} loading="lazy" decoding="async" />
                    ) : (
                      <div className="w-16 h-12 bg-gray-100 rounded-lg flex items-center justify-center border border-gray-200">
                        <ImageIcon className="w-5 h-5 text-gray-400" />
                      </div>
                    )}
                  </td>
                  <td className="p-4 font-medium text-gray-900">{post.title}</td>
                  <td className="p-4">
                    {post.published_at ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">Published</span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">Draft</span>
                    )}
                  </td>
                  <td className="p-4 pr-6 text-right space-x-2">
                    <button
                      onClick={() => handleOpenForm(post)}
                      className="p-2 text-gray-400 hover:text-primary transition-colors rounded-lg hover:bg-primary/10 inline-flex"
                      title="Edit"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => { setSelectedPost(post); setIsDeleteOpen(true); }}
                      className="p-2 text-gray-400 hover:text-red-600 transition-colors rounded-lg hover:bg-red-50 inline-flex"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
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
            <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={e => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Content</label>
            <textarea
              required
              rows={6}
              value={formData.content}
              onChange={e => setFormData({ ...formData, content: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Publish Date (Optional)</label>
              <input
                type="datetime-local"
                value={formData.published_at}
                onChange={e => setFormData({ ...formData, published_at: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Cover Image</label>
              <input
                type="file"
                accept="image/*"
                onChange={e => setSelectedFile(e.target.files?.[0] || null)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary text-sm file:mr-4 file:py-1 file:px-3 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
              />
            </div>
          </div>
          
          <div className="pt-4 border-t border-gray-100 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setIsFormOpen(false)}
              className="px-4 py-2 text-gray-700 font-medium hover:bg-gray-100 rounded-lg transition-colors"
              disabled={saving || uploading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || uploading}
              className="px-4 py-2 bg-primary text-white font-medium rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50"
            >
              {saving || uploading ? 'Saving...' : 'Save Post'}
            </button>
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
