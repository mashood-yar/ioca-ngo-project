import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Mail, Phone, Shield } from 'lucide-react';
import { fetchApi } from '../../lib/apiClient';
import { Modal } from '../../components/ui/Modal';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { useSearchParams } from 'react-router-dom';
import { useCloudinaryUpload } from '../../hooks/useCloudinaryUpload';
import { optimizeImage } from '../../lib/optimizeImage';

interface Zone {
  id: string;
  name: string;
}

interface Member {
  id: string;
  zone_id: string;
  full_name: string;
  email?: string;
  phone?: string;
  cnic?: string;
  role_in_org: string;
  profile_image_url?: string;
  joined_at: string;
  is_active: boolean;
  zone?: { name: string };
}

export function AdminMembers() {
  const [searchParams] = useSearchParams();
  const filterZoneId = searchParams.get('zone');
  
  const [members, setMembers] = useState<Member[]>([]);
  const [zones, setZones] = useState<Zone[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  
  const [formData, setFormData] = useState({ 
    zone_id: filterZoneId || '', 
    full_name: '', 
    email: '', 
    phone: '', 
    cnic: '', 
    role_in_org: 'Member', 
    joined_at: new Date().toISOString().split('T')[0], 
    is_active: true 
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);

  const { upload, uploading } = useCloudinaryUpload();

  const loadData = async () => {
    setLoading(true);
    try {
      const endpoint = filterZoneId ? `/members?zone=${filterZoneId}` : '/members';
      const [membersRes, zonesRes] = await Promise.all([
        fetchApi<Member[]>(endpoint),
        fetchApi<Zone[]>('/zones')
      ]);
      
      if (membersRes.data) setMembers(membersRes.data);
      if (zonesRes.data) setZones(zonesRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [filterZoneId]);

  const handleOpenForm = (member?: Member) => {
    if (member) {
      setSelectedMember(member);
      setFormData({
        zone_id: member.zone_id,
        full_name: member.full_name,
        email: member.email || '',
        phone: member.phone || '',
        cnic: member.cnic || '',
        role_in_org: member.role_in_org,
        joined_at: member.joined_at,
        is_active: member.is_active,
      });
    } else {
      setSelectedMember(null);
      setFormData({ 
        zone_id: filterZoneId || (zones[0]?.id || ''), 
        full_name: '', 
        email: '', 
        phone: '', 
        cnic: '', 
        role_in_org: 'Member', 
        joined_at: new Date().toISOString().split('T')[0], 
        is_active: true 
      });
    }
    setSelectedFile(null);
    setIsFormOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      let profileImageUrl = selectedMember?.profile_image_url;

      if (selectedFile) {
        const uploadResult = await upload(selectedFile, 'ioca/members');
        if (uploadResult) profileImageUrl = uploadResult.url;
      }

      const payload = {
        zoneId: formData.zone_id,
        fullName: formData.full_name,
        email: formData.email,
        phone: formData.phone,
        cnic: formData.cnic,
        roleInOrg: formData.role_in_org,
        joinedAt: new Date(formData.joined_at).toISOString(),
        isActive: formData.is_active,
        profileImageUrl,
      };

      if (selectedMember) {
        await fetchApi(`/members/${selectedMember.id}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
        window.dispatchEvent(new CustomEvent('app-toast', { detail: { message: 'Member updated', variant: 'success' }}));
      } else {
        await fetchApi('/members', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        window.dispatchEvent(new CustomEvent('app-toast', { detail: { message: 'Member added', variant: 'success' }}));
      }

      setIsFormOpen(false);
      loadData();
    } catch (err) {
      window.dispatchEvent(new CustomEvent('app-toast', { detail: { message: 'Failed to save member', variant: 'error' }}));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedMember) return;
    try {
      await fetchApi(`/members/${selectedMember.id}`, { method: 'DELETE' });
      window.dispatchEvent(new CustomEvent('app-toast', { detail: { message: 'Member removed', variant: 'success' }}));
      loadData();
    } catch (err) {
      window.dispatchEvent(new CustomEvent('app-toast', { detail: { message: 'Failed to delete member', variant: 'error' }}));
    }
  };

  if (loading) return <div className="p-8">Loading members...</div>;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {filterZoneId ? `Members in Zone` : 'All Members'}
          </h1>
          <p className="text-gray-500 mt-1">Manage organization members and volunteers</p>
        </div>
        <button
          onClick={() => handleOpenForm()}
          className="bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-lg flex items-center gap-2 font-medium transition-colors shadow-sm shadow-primary/20"
        >
          <Plus className="w-5 h-5" />
          Add Member
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100 text-sm font-semibold text-gray-600">
                <th className="p-4 pl-6">Member</th>
                <th className="p-4">Contact</th>
                <th className="p-4">Role & Zone</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right pr-6">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {members.map((member) => (
                <tr key={member.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="p-4 pl-6">
                    <div className="flex items-center gap-3">
                      <img 
                        src={member.profile_image_url ? optimizeImage(member.profile_image_url, { width: 80 }) : `https://ui-avatars.com/api/?name=${encodeURIComponent(member.full_name)}&background=random`} 
                        alt={member.full_name} 
                        className="w-10 h-10 rounded-full object-cover border border-gray-200"
                        width={40}
                        height={40}
                        loading="lazy"
                        decoding="async"
                      />
                      <div>
                        <p className="font-medium text-gray-900">{member.full_name}</p>
                        <p className="text-xs text-gray-500">CNIC: {member.cnic || 'N/A'}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="space-y-1">
                      {member.email && (
                        <div className="flex items-center gap-1.5 text-sm text-gray-600">
                          <Mail className="w-3.5 h-3.5" />
                          {member.email}
                        </div>
                      )}
                      {member.phone && (
                        <div className="flex items-center gap-1.5 text-sm text-gray-600">
                          <Phone className="w-3.5 h-3.5" />
                          {member.phone}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5 text-sm font-medium text-gray-900">
                        <Shield className="w-3.5 h-3.5 text-primary" />
                        {member.role_in_org}
                      </div>
                      <p className="text-xs text-gray-500">{member.zone?.name || 'Unknown Zone'}</p>
                    </div>
                  </td>
                  <td className="p-4">
                    {member.is_active ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">Active</span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">Inactive</span>
                    )}
                  </td>
                  <td className="p-4 pr-6 text-right space-x-2">
                    <button
                      onClick={() => handleOpenForm(member)}
                      className="p-2 text-gray-400 hover:text-primary transition-colors rounded-lg hover:bg-primary/10 inline-flex"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => { setSelectedMember(member); setIsDeleteOpen(true); }}
                      className="p-2 text-gray-400 hover:text-red-600 transition-colors rounded-lg hover:bg-red-50 inline-flex"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {members.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-gray-500">No members found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal
        isOpen={isFormOpen}
        onClose={() => !saving && setIsFormOpen(false)}
        title={selectedMember ? 'Edit Member' : 'Add Member'}
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
              <input
                type="text"
                required
                value={formData.full_name}
                onChange={e => setFormData({ ...formData, full_name: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Zone *</label>
              <select
                required
                value={formData.zone_id}
                onChange={e => setFormData({ ...formData, zone_id: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary bg-white"
              >
                <option value="" disabled>Select Zone</option>
                {zones.map(z => <option key={z.id} value={z.id}>{z.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={e => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
              <input
                type="tel"
                value={formData.phone}
                onChange={e => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">CNIC</label>
              <input
                type="text"
                placeholder="xxxxx-xxxxxxx-x"
                value={formData.cnic}
                onChange={e => setFormData({ ...formData, cnic: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Role in Org *</label>
              <input
                type="text"
                required
                list="roles"
                value={formData.role_in_org}
                onChange={e => setFormData({ ...formData, role_in_org: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
              />
              <datalist id="roles">
                <option value="Member" />
                <option value="Volunteer" />
                <option value="Zone Head" />
                <option value="Secretary" />
              </datalist>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Join Date</label>
              <input
                type="date"
                required
                value={formData.joined_at}
                onChange={e => setFormData({ ...formData, joined_at: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Profile Photo</label>
              <input
                type="file"
                accept="image/*"
                onChange={e => setSelectedFile(e.target.files?.[0] || null)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary text-sm file:mr-4 file:py-1 file:px-3 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
              />
            </div>
          </div>
          
          <div className="flex items-center gap-3 bg-gray-50 p-4 rounded-xl border border-gray-100">
            <input
              type="checkbox"
              id="is_active"
              checked={formData.is_active}
              onChange={e => setFormData({ ...formData, is_active: e.target.checked })}
              className="w-4 h-4 text-primary rounded border-gray-300 focus:ring-primary"
            />
            <label htmlFor="is_active" className="text-sm font-medium text-gray-700">Member is currently active</label>
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
              {saving || uploading ? 'Saving...' : 'Save Member'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        title="Remove Member"
        message="Are you sure you want to remove this member from the organization?"
        confirmLabel="Remove"
        onConfirm={handleDelete}
      />
    </div>
  );
}
