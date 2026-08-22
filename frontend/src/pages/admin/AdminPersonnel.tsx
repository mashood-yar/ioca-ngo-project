import React, { useState, useEffect, useRef } from 'react';
import { Users, Plus, QrCode, Trash2, Link, Edit, Image as ImageIcon } from 'lucide-react';
import { PageLoadingSpinner } from '../../components/PageLoadingSpinner';
import { optimizeImage } from '../../lib/optimizeImage';
import { supabase } from '../../lib/supabase';

export const AdminPersonnel: React.FC = () => {
  const [personnel, setPersonnel] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    category: 'employee',
    full_name: '',
    email: '',
    phone: '',
    title: '',
    bio: '',
    status: 'active',
    profile_image: '' // Base64 string for upload
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchPersonnel = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch('/api/admin/personnel', {
        headers: { 'Authorization': `Bearer ${session?.access_token || ''}` }
      });
      const data = await res.json();
      setPersonnel(data.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPersonnel();
  }, []);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setFormData({ ...formData, profile_image: reader.result as string });
    reader.readAsDataURL(file);
  };

  const handleEditClick = (person: any) => {
    setEditingId(person.id);
    setFormData({
      category: person.category,
      full_name: person.full_name,
      email: person.email || '',
      phone: person.phone || '',
      title: person.title || '',
      bio: person.bio || '',
      status: person.status,
      profile_image: '' // We don't load the existing URL into the base64 field, but we can display it.
    });
    setIsAdding(true);
  };

  const handleAddNewClick = () => {
    setEditingId(null);
    setFormData({
      category: 'employee',
      full_name: '',
      email: '',
      phone: '',
      title: '',
      bio: '',
      status: 'active',
      profile_image: ''
    });
    setIsAdding(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const url = editingId ? `/api/admin/personnel/${editingId}` : '/api/admin/personnel';
      const method = editingId ? 'PUT' : 'POST';

      await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token || ''}`
        },
        body: JSON.stringify(formData)
      });
      setIsAdding(false);
      setEditingId(null);
      fetchPersonnel();
    } catch (e) {
      console.error(e);
      setLoading(false);
    }
  };

  const handleRemove = async (id: string) => {
    if (!window.confirm('Are you sure you want to offboard this person? They will be marked as former and their ID voided.')) return;
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      await fetch(`/api/admin/personnel/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${session?.access_token || ''}` }
      });
      fetchPersonnel();
    } catch (e) {
      console.error(e);
      setLoading(false);
    }
  };

  if (loading && personnel.length === 0) return <PageLoadingSpinner />;

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-brand-navy flex items-center gap-2">
            <Users className="text-brand-teal" /> Personnel Management
          </h1>
          <p className="text-gray-500 text-sm">Manage Board Members, Partners, Employees, and Volunteers.</p>
        </div>
        <button
          onClick={handleAddNewClick}
          className="bg-brand-teal text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-brand-teal/90"
        >
          <Plus className="w-5 h-5" /> Add Personnel
        </button>
      </div>

      {isAdding && (
        <div className="bg-white p-6 rounded-xl shadow-md border mb-8">
          <h2 className="text-xl font-semibold mb-4">{editingId ? 'Edit Personnel' : 'Add New Personnel'}</h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            <div className="md:col-span-2 flex items-center gap-4 mb-2">
              <div 
                className="w-20 h-20 rounded-full bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden cursor-pointer hover:bg-gray-50"
                onClick={() => fileInputRef.current?.click()}
              >
                {formData.profile_image ? (
                  <img src={formData.profile_image} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <ImageIcon className="text-gray-400 w-8 h-8" />
                )}
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700">Profile Image</p>
                <p className="text-xs text-gray-500 mb-2">Click the avatar to upload a photo.</p>
                <input 
                  type="file" 
                  accept="image/*" 
                  ref={fileInputRef} 
                  className="hidden" 
                  onChange={handleImageChange} 
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select className="w-full border rounded-lg p-2" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} disabled={!!editingId}>
                <option value="employee">Employee</option>
                <option value="volunteer">Volunteer</option>
                <option value="board">Board Member</option>
                <option value="partner">Partner</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select className="w-full border rounded-lg p-2" value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})}>
                <option value="active">Active</option>
                <option value="suspended">Suspended</option>
                <option value="former">Former</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
              <input required type="text" className="w-full border rounded-lg p-2" value={formData.full_name} onChange={e => setFormData({...formData, full_name: e.target.value})} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
              <input required type="text" className="w-full border rounded-lg p-2" placeholder="e.g. Graphic Designer" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email (Optional)</label>
              <input type="email" className="w-full border rounded-lg p-2" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone (Optional)</label>
              <input type="text" className="w-full border rounded-lg p-2" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Bio (Only visible for Board/Partners)</label>
              <textarea className="w-full border rounded-lg p-2 h-20" value={formData.bio} onChange={e => setFormData({...formData, bio: e.target.value})} />
            </div>
            
            <div className="md:col-span-2 flex justify-end gap-2 mt-2">
              <button type="button" onClick={() => setIsAdding(false)} className="px-4 py-2 border rounded-lg text-gray-600 hover:bg-gray-50">Cancel</button>
              <button type="submit" disabled={loading} className="px-4 py-2 bg-brand-navy text-white rounded-lg hover:bg-brand-navy/90 disabled:opacity-50">
                {loading ? 'Saving...' : editingId ? 'Update Personnel' : 'Save & Generate ID'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-xl shadow border overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 text-gray-600 border-b text-sm">
            <tr>
              <th className="p-4">Personnel</th>
              <th className="p-4">Category</th>
              <th className="p-4">Status</th>
              <th className="p-4 text-center">ID Card</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y text-sm">
            {personnel.map(p => (
              <tr key={p.id} className="hover:bg-gray-50">
                <td className="p-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden">
                    <img src={p.profile_image_url ? optimizeImage(p.profile_image_url, { width: 100 }) : '/assets/team-1.webp'} alt="" className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <p className="font-semibold text-brand-navy">{p.full_name}</p>
                    <p className="text-gray-500 text-xs">{p.title}</p>
                  </div>
                </td>
                <td className="p-4 capitalize">
                  <span className={`px-2 py-1 rounded text-xs font-semibold ${p.category === 'board' ? 'bg-purple-100 text-purple-700' : p.category === 'employee' ? 'bg-blue-100 text-blue-700' : p.category === 'volunteer' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                    {p.category}
                  </span>
                </td>
                <td className="p-4">
                  <span className={`px-2 py-1 rounded-full text-xs border ${p.status === 'active' ? 'border-green-200 text-green-700 bg-green-50' : p.status === 'former' ? 'border-gray-200 text-gray-700 bg-gray-50' : 'border-red-200 text-red-700 bg-red-50'}`}>
                    {p.status}
                  </span>
                </td>
                <td className="p-4 text-center">
                  <div className="flex flex-col items-center gap-1">
                    {p.qr_code_url ? (
                      <a href={p.qr_code_url} target="_blank" rel="noreferrer" className="text-brand-teal hover:underline flex items-center gap-1 text-xs">
                        <QrCode className="w-4 h-4" /> View QR
                      </a>
                    ) : (
                      <span className="text-gray-400 text-xs">Generating...</span>
                    )}
                    <a href={`/verify/${p.uid}`} target="_blank" rel="noreferrer" className="text-gray-500 hover:text-brand-navy flex items-center gap-1 text-xs">
                      <Link className="w-3 h-3" /> Link
                    </a>
                  </div>
                </td>
                <td className="p-4 text-right">
                  <button onClick={() => handleEditClick(p)} className="text-gray-500 hover:text-brand-teal p-2" title="Edit">
                    <Edit className="w-4 h-4" />
                  </button>
                  {p.status === 'active' && (
                    <button onClick={() => handleRemove(p.id)} className="text-red-500 hover:text-red-700 p-2" title="Mark as Former">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {personnel.length === 0 && (
              <tr>
                <td colSpan={5} className="p-8 text-center text-gray-500">No personnel found. Add someone to generate their ID.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
