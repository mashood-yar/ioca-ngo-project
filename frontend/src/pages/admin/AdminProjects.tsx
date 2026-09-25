import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Image as ImageIcon, Star, Users } from 'lucide-react';
import { fetchApi } from '../../lib/apiClient';
import { Modal } from '../../components/ui/Modal';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { useCloudinaryUpload } from '../../hooks/useCloudinaryUpload';
import { optimizeImage } from '../../lib/optimizeImage';
import { AdminButton } from './AdminButton';

interface Project {
  id: string;
  titleEn: string;
  titleUr: string;
  descEn: string;
  descUr: string;
  status: string;
  category: string | null;
  locationEn: string | null;
  locationUr: string | null;
  progress: number;
  image_url: string | null;
  is_featured: boolean;
  start_date: string | null;
  end_date: string | null;
  created_at: string;
}

const statusColors: Record<string, string> = {
  ongoing: 'bg-blue-100 text-blue-700',
  completed: 'bg-green-100 text-green-700',
  paused: 'bg-amber-100 text-amber-700',
  upcoming: 'bg-purple-100 text-purple-700',
};

export function AdminProjects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isTeamOpen, setIsTeamOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  const [formData, setFormData] = useState({
    titleEn: '',
    titleUr: '',
    descEn: '',
    descUr: '',
    status: 'ongoing',
    category: '',
    locationEn: '',
    locationUr: '',
    progress: 0,
    is_featured: false,
    start_date: '',
    end_date: '',
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);

  const { upload, uploading } = useCloudinaryUpload();

  const loadProjects = async () => {
    try {
      const { data } = await fetchApi<Project[]>('/projects');
      if (data) setProjects(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProjects();
  }, []);

  const handleOpenForm = (project?: any) => {
    if (project) {
      setSelectedProject(project);
      setFormData({
        titleEn: project.title_en || project.titleEn || project.title || '',
        titleUr: project.title_ur || project.titleUr || '',
        descEn: project.desc_en || project.descEn || project.description || '',
        descUr: project.desc_ur || project.descUr || '',
        status: project.status || 'ongoing',
        category: project.category || '',
        locationEn: project.location_en || project.locationEn || '',
        locationUr: project.location_ur || project.locationUr || '',
        progress: project.progress ?? 0,
        is_featured: project.is_featured || false,
        start_date: project.start_date ? new Date(project.start_date).toISOString().slice(0, 10) : '',
        end_date: project.end_date ? new Date(project.end_date).toISOString().slice(0, 10) : '',
      });
    } else {
      setSelectedProject(null);
      setFormData({ titleEn: '', titleUr: '', descEn: '', descUr: '', status: 'ongoing', category: '', locationEn: '', locationUr: '', progress: 0, is_featured: false, start_date: '', end_date: '' });
    }
    setSelectedFile(null);
    setIsFormOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      let imageUrl = selectedProject?.image_url;

      if (selectedFile) {
        const uploadResult = await upload(selectedFile, 'ioca/projects');
        if (uploadResult) imageUrl = uploadResult.url;
      }

      const payload = {
        titleEn: formData.titleEn,
        titleUr: formData.titleUr,
        descEn: formData.descEn,
        descUr: formData.descUr,
        status: formData.status,
        category: formData.category,
        locationEn: formData.locationEn,
        locationUr: formData.locationUr,
        progress: formData.progress,
        is_featured: formData.is_featured,
        start_date: formData.start_date ? new Date(formData.start_date).toISOString() : null,
        end_date: formData.end_date ? new Date(formData.end_date).toISOString() : null,
        imageUrl,
      };

      const url = selectedProject ? `/projects/${selectedProject.id}` : '/projects';
      const method = selectedProject ? 'PUT' : 'POST';

      const result = await fetchApi<any>(url, {
        method,
        body: JSON.stringify(payload),
      });

      if (result.error) {
        window.dispatchEvent(new CustomEvent('app-toast', { detail: { message: `Failed to save: ${result.error}`, variant: 'error' } }));
        return;
      }

      window.dispatchEvent(new CustomEvent('app-toast', { detail: { message: selectedProject ? 'Project updated' : 'Project created', variant: 'success' } }));
      setIsFormOpen(false);
      loadProjects();
    } catch (err: any /* fixed M-01 */) {
      window.dispatchEvent(new CustomEvent('app-toast', { detail: { message: `Unexpected error: ${err.message || err}`, variant: 'error' } }));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedProject) return;
    try {
      const { error } = await fetchApi(`/projects/${selectedProject.id}`, { method: 'DELETE' });
      if (error) {
        window.dispatchEvent(new CustomEvent('app-toast', { detail: { message: `Failed to delete: ${error}`, variant: 'error' } }));
        return;
      }
      window.dispatchEvent(new CustomEvent('app-toast', { detail: { message: 'Project deleted', variant: 'success' } }));
      loadProjects();
    } catch (err: any /* fixed M-01 */) {
      window.dispatchEvent(new CustomEvent('app-toast', { detail: { message: `Failed to delete: ${err.message || err}`, variant: 'error' } }));
    }
  };

  const filteredProjects = filterStatus === 'all'
    ? projects
    : projects.filter(p => p.status === filterStatus);

  if (loading) return <div className="p-8">Loading projects...</div>;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Projects</h1>
          <p className="text-gray-500 mt-1">Manage IOCA projects and initiatives</p>
        </div>
        <AdminButton
          onClick={() => handleOpenForm()}
          variant="accent"
          icon={<Plus className="w-5 h-5" />}
        >
          New Project
        </AdminButton>
      </div>

      {/* Status Filter */}
      <div className="flex flex-wrap gap-2">
        {[
          { value: 'all', label: 'All Status' },
          { value: 'ongoing', label: '🟢 Ongoing' },
          { value: 'completed', label: '✅ Completed' },
          { value: 'paused', label: '⏸️ Paused' },
          { value: 'upcoming', label: '⏳ Upcoming' },
        ].map((status) => (
          <button
            key={status.value}
            onClick={() => setFilterStatus(status.value)}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              filterStatus === status.value
                ? 'bg-[#1D2D49] text-white'
                : 'bg-white text-gray-600 border border-[#E5E7EB] hover:bg-gray-50'
            }`}
          >
            {status.label}
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
                <th className="p-4">Status</th>
                <th className="p-4">Featured</th>
                <th className="p-4">Dates</th>
                <th className="p-4 text-right pr-6">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E7EB]">
              {filteredProjects.map((project) => (
                <tr key={project.id} className="hover:bg-[#F9FAFB] transition-colors duration-100 text-[#111827] text-sm">
                  <td className="p-4 pl-6 w-24">
                    {project.image_url ? (
                      <img src={optimizeImage(project.image_url, { width: 80 })} alt={project.titleEn} className="w-16 h-12 object-cover rounded-lg border border-[#E5E7EB]" width={64} height={48} loading="lazy" decoding="async" />
                    ) : (
                      <div className="w-16 h-12 bg-gray-100 rounded-lg flex items-center justify-center border border-[#E5E7EB]">
                        <ImageIcon className="w-5 h-5 text-gray-400" />
                      </div>
                    )}
                  </td>
                  <td className="p-4 font-medium">
                    <div>{project.titleEn}</div>
                    {project.category && (
                      <span className="text-xs text-gray-400">{project.category}</span>
                    )}
                  </td>
                  <td className="p-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors[project.status] || 'bg-gray-100 text-gray-700'}`}>
                      {project.status}
                    </span>
                  </td>
                  <td className="p-4">
                    {project.is_featured && (
                      <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
                    )}
                  </td>
                  <td className="p-4 text-gray-600 text-xs">
                    {project.start_date && (
                      <div>Start: {new Date(project.start_date).toLocaleDateString()}</div>
                    )}
                    {project.end_date && (
                      <div>End: {new Date(project.end_date).toLocaleDateString()}</div>
                    )}
                  </td>
                  <td className="p-4 pr-6 text-right space-x-2">
                    <AdminButton
                      variant="outline"
                      size="sm"
                      onClick={() => { setSelectedProject(project); setIsTeamOpen(true); }}
                      title="Team"
                    >
                      <Users className="w-4 h-4 mr-1 inline-block" /> Team
                    </AdminButton>
                    <AdminButton
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenForm(project)}
                      title="Edit"
                    >
                      <Edit2 className="w-4 h-4" />
                    </AdminButton>
                    <AdminButton
                      variant="danger"
                      size="sm"
                      onClick={() => { setSelectedProject(project); setIsDeleteOpen(true); }}
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </AdminButton>
                  </td>
                </tr>
              ))}
              {filteredProjects.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-gray-500">No projects found.</td>
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
        title={selectedProject ? 'Edit Project' : 'New Project'}
      >
        <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-[#111827] mb-1">Title (English)</label>
                <input type="text" required value={formData.titleEn} onChange={e => setFormData({ ...formData, titleEn: e.target.value })} className="w-full px-3 py-2 text-[#111827] bg-white border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0D9488] transition-colors duration-150" placeholder="Project title" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-[#111827] mb-1 text-right font-urdu">Title (Urdu)</label>
                <input type="text" dir="rtl" required value={formData.titleUr} onChange={e => setFormData({ ...formData, titleUr: e.target.value })} className="w-full px-3 py-2 text-[#111827] bg-white border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0D9488] font-urdu transition-colors duration-150" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-[#111827] mb-1">Description (English)</label>
                <textarea required rows={3} value={formData.descEn} onChange={e => setFormData({ ...formData, descEn: e.target.value })} className="w-full px-3 py-2 text-[#111827] bg-white border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0D9488] transition-colors duration-150" placeholder="Describe the project" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-[#111827] mb-1 text-right font-urdu">Description (Urdu)</label>
                <textarea dir="rtl" required rows={3} value={formData.descUr} onChange={e => setFormData({ ...formData, descUr: e.target.value })} className="w-full px-3 py-2 text-[#111827] bg-white border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0D9488] font-urdu transition-colors duration-150" />
              </div>
            </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-[#111827] mb-1">Status</label>
              <select
                value={formData.status}
                onChange={e => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-3 py-2 text-[#111827] bg-white border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0D9488] focus:border-[#0D9488] transition-colors duration-150"
              >
                <option value="ongoing">Ongoing</option>
                <option value="completed">Completed</option>
                <option value="paused">Paused</option>
                <option value="upcoming">Upcoming</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-[#111827] mb-1">Category</label>
              <input
                type="text"
                value={formData.category}
                onChange={e => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-3 py-2 text-[#111827] bg-white border border-[#E5E7EB] rounded-lg placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#0D9488] focus:border-[#0D9488] transition-colors duration-150"
                placeholder="e.g. Infrastructure"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-[#111827] mb-1">Location (English)</label>
              <input type="text" value={formData.locationEn} onChange={e => setFormData({ ...formData, locationEn: e.target.value })} className="w-full px-3 py-2 text-[#111827] bg-white border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0D9488] transition-colors duration-150" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-[#111827] mb-1 text-right font-urdu">Location (Urdu)</label>
              <input type="text" dir="rtl" value={formData.locationUr} onChange={e => setFormData({ ...formData, locationUr: e.target.value })} className="w-full px-3 py-2 text-[#111827] bg-white border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0D9488] font-urdu transition-colors duration-150" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-[#111827] mb-1">Progress ({formData.progress}%)</label>
              <input
                type="range"
                min={0}
                max={100}
                value={formData.progress}
                onChange={e => setFormData({ ...formData, progress: parseInt(e.target.value) })}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#0D9488]"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-[#111827] mb-1">Start Date</label>
              <input
                type="date"
                value={formData.start_date}
                onChange={e => setFormData({ ...formData, start_date: e.target.value })}
                className="w-full px-3 py-2 text-[#111827] bg-white border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0D9488] focus:border-[#0D9488] transition-colors duration-150"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-[#111827] mb-1">End Date</label>
              <input
                type="date"
                value={formData.end_date}
                onChange={e => setFormData({ ...formData, end_date: e.target.value })}
                className="w-full px-3 py-2 text-[#111827] bg-white border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0D9488] focus:border-[#0D9488] transition-colors duration-150"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-[#111827] mb-1">Cover Image</label>
              <input
                type="file"
                accept="image/*"
                onChange={e => setSelectedFile(e.target.files?.[0] || null)}
                className="w-full px-3 py-2 text-[#111827] bg-white border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0D9488] focus:border-[#0D9488] transition-colors duration-150 text-sm file:mr-4 file:py-1 file:px-3 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-[#0D9488]/10 file:text-[#0D9488] hover:file:bg-[#0D9488]/20"
              />
              <p className="text-[11px] text-[#6B7280] mt-1.5 flex items-center gap-1">ℹ️ Recommended: 16:9 Landscape (e.g. 1920x1080)</p>
            </div>
            <div className="flex items-end pb-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.is_featured}
                  onChange={e => setFormData({ ...formData, is_featured: e.target.checked })}
                  className="w-4 h-4 text-[#0D9488] rounded border-gray-300 focus:ring-[#0D9488]"
                />
                <span className="text-sm font-medium text-[#111827]">⭐ Featured Project</span>
              </label>
            </div>
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
              {selectedProject ? 'Update Project' : 'Create Project'}
            </AdminButton>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        title="Delete Project"
        message="Are you sure you want to delete this project? This action cannot be undone."
        confirmLabel="Delete"
        onConfirm={handleDelete}
      />

      <ProjectTeamModal
        project={selectedProject}
        isOpen={isTeamOpen}
        onClose={() => setIsTeamOpen(false)}
      />
    </div>
  );
}

interface TeamMember {
  id: string;
  role: string;
  user_id: string;
  profiles: {
    full_name: string;
    email: string;
  };
}

function ProjectTeamModal({ project, isOpen, onClose }: { project: Project | null, isOpen: boolean, onClose: () => void }) {
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('volunteer');
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    if (isOpen && project) {
      loadTeam();
    }
  }, [isOpen, project]);

  const loadTeam = async () => {
    if (!project) return;
    setLoading(true);
    try {
      const { data } = await fetchApi<TeamMember[]>(`/projects/${project.id}/team`);
      if (data) setTeam(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!project || !email) return;
    setAdding(true);
    try {
      const { error } = await fetchApi(`/projects/${project.id}/team`, {
        method: 'POST',
        body: JSON.stringify({ action: 'assign', email, role })
      });
      if (error) throw new Error(error);
      setEmail('');
      loadTeam();
      window.dispatchEvent(new CustomEvent('app-toast', { detail: { message: 'Member added', variant: 'success' } }));
    } catch (err: any) {
      window.dispatchEvent(new CustomEvent('app-toast', { detail: { message: err.message, variant: 'error' } }));
    } finally {
      setAdding(false);
    }
  };

  const handleRemove = async (userId: string) => {
    if (!project) return;
    if (!window.confirm('Remove this member?')) return;
    try {
      const { error } = await fetchApi(`/projects/${project.id}/team`, {
        method: 'POST',
        body: JSON.stringify({ action: 'unassign', user_id: userId })
      });
      if (error) throw new Error(error);
      loadTeam();
      window.dispatchEvent(new CustomEvent('app-toast', { detail: { message: 'Member removed', variant: 'success' } }));
    } catch (err: any) {
      window.dispatchEvent(new CustomEvent('app-toast', { detail: { message: err.message, variant: 'error' } }));
    }
  };

  if (!project) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Team: ${project.titleEn}`}>
      <div className="space-y-6">
        <form onSubmit={handleAdd} className="flex gap-2 items-end">
          <div className="flex-1">
            <label className="block text-sm font-semibold mb-1">User Email</label>
            <input type="email" required value={email} onChange={e => setEmail(e.target.value)} className="w-full px-3 py-2 border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0D9488]" placeholder="user@example.com" />
          </div>
          <div className="w-40">
            <label className="block text-sm font-semibold mb-1">Role</label>
            <select value={role} onChange={e => setRole(e.target.value)} className="w-full px-3 py-2 border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0D9488]">
              <option value="volunteer">Volunteer</option>
              <option value="coordinator">Coordinator</option>
              <option value="member">Member</option>
            </select>
          </div>
          <AdminButton type="submit" variant="accent" isLoading={adding}>Add</AdminButton>
        </form>

        <div className="border border-[#E5E7EB] rounded-lg overflow-hidden">
          {loading ? (
            <div className="p-4 text-center text-sm text-gray-500">Loading...</div>
          ) : team.length === 0 ? (
            <div className="p-4 text-center text-sm text-gray-500">No team members assigned.</div>
          ) : (
            <table className="w-full text-left text-sm">
              <thead className="bg-[#F9FAFB] border-b border-[#E5E7EB] text-[#6B7280]">
                <tr>
                  <th className="p-3 font-semibold">Name</th>
                  <th className="p-3 font-semibold">Email</th>
                  <th className="p-3 font-semibold">Role</th>
                  <th className="p-3 text-right font-semibold">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E7EB]">
                {team.map(member => (
                  <tr key={member.id} className="hover:bg-[#F9FAFB]">
                    <td className="p-3 text-[#111827]">{member.profiles?.full_name || 'Unknown'}</td>
                    <td className="p-3 text-[#6B7280]">{member.profiles?.email || 'N/A'}</td>
                    <td className="p-3 text-[#111827] capitalize">{member.role}</td>
                    <td className="p-3 text-right">
                      <button onClick={() => handleRemove(member.user_id)} className="text-red-500 hover:text-red-700 font-medium">Remove</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </Modal>
  );
}
