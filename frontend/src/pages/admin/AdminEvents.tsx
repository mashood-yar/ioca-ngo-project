import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Image as ImageIcon, Users } from 'lucide-react';
import { fetchApi } from '../../lib/apiClient';
import { Modal } from '../../components/ui/Modal';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { useCloudinaryUpload } from '../../hooks/useCloudinaryUpload';
import { optimizeImage } from '../../lib/optimizeImage';
import { AdminButton } from './AdminButton';

interface Event {
  id: string;
  title: string;
  description: string;
  location?: string;
  event_date?: string;
  end_date?: string;
  capacity?: number;
  image_url?: string;
}

export function AdminEvents() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  
  const [formData, setFormData] = useState({ 
    title: '', 
    description: '', 
    location: '', 
    event_date: '',
    endDate: '',
    capacity: '',
    is_online: false,
    meetingUrl: ''
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);

  const [attendeeModal, setAttendeeModal] = useState<{ open: boolean; event: any; attendees: any[]; loading: boolean; } | null>(null);

  const { upload, uploading } = useCloudinaryUpload();

  const handleOpenAttendees = async (event: Event) => {
    setAttendeeModal({ open: true, event, attendees: [], loading: true });
    try {
      const { data } = await fetchApi<any[]>(`/event-registrations?event_id=${event.id}`);
      setAttendeeModal({ open: true, event, attendees: data || [], loading: false });
    } catch (err) {
      setAttendeeModal({ open: true, event, attendees: [], loading: false });
    }
  };

  const loadEvents = async () => {
    try {
      const { data } = await fetchApi<Event[]>('/events');
      if (data) setEvents(data);
    } catch (err) {
      // Intentional empty catch
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEvents();
  }, []);

  const handleOpenForm = (event?: Event) => {
    if (event) {
      setSelectedEvent(event);
      const isOnline = event.location?.toLowerCase().includes('http') || event.location?.toLowerCase().includes('zoom');
      setFormData({
        title: event.title,
        description: event.description,
        location: event.location || '',
        event_date: event.event_date ? new Date(event.event_date).toISOString().slice(0, 16) : '',
        endDate: event.end_date ? new Date(event.end_date).toISOString().slice(0, 16) : '',
        capacity: event.capacity?.toString() || '',
        is_online: !!isOnline,
        meetingUrl: isOnline ? (event.location || '') : ''
      });
    } else {
      setSelectedEvent(null);
      setFormData({ title: '', description: '', location: '', event_date: '', endDate: '', capacity: '', is_online: false, meetingUrl: '' });
    }
    setSelectedFile(null);
    setIsFormOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      let imageUrl = selectedEvent?.image_url;

      if (selectedFile) {
        const uploadResult = await upload(selectedFile, 'ioca/events');
        if (uploadResult) imageUrl = uploadResult.url;
      }

      const payload = {
        title: formData.title,
        description: formData.description,
        location: formData.is_online ? formData.meetingUrl : formData.location,
        eventDate: formData.event_date ? new Date(formData.event_date).toISOString() : null,
        endDate: formData.endDate ? new Date(formData.endDate).toISOString() : null,
        capacity: formData.capacity ? parseInt(formData.capacity, 10) : null,
        isOnline: formData.is_online,
        imageUrl,
      };

      const url = selectedEvent ? `/events/${selectedEvent.id}` : '/events';
      const method = selectedEvent ? 'PUT' : 'POST';

      const result = await fetchApi<any>(url, {
        method,
        body: JSON.stringify(payload),
      });

      if (result.error) {
        window.dispatchEvent(new CustomEvent('app-toast', { detail: { message: `Failed to save: ${result.error}`, variant: 'error' }}));
        return;
      }

      window.dispatchEvent(new CustomEvent('app-toast', { detail: { message: 'Event saved successfully!', variant: 'success' }}));
      setIsFormOpen(false);
      loadEvents();
    } catch (err: any /* fixed M-01 */) {
      window.dispatchEvent(new CustomEvent('app-toast', { detail: { message: `Unexpected error: ${err.message || err}`, variant: 'error' }}));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedEvent) return;
    try {
      await fetchApi(`/events/${selectedEvent.id}`, { method: 'DELETE' });
      window.dispatchEvent(new CustomEvent('app-toast', { detail: { message: 'Event deleted', variant: 'success' }}));
      loadEvents();
    } catch (err) {
      window.dispatchEvent(new CustomEvent('app-toast', { detail: { message: 'Failed to delete', variant: 'error' }}));
    }
  };

  if (loading) return <div className="p-8">Loading events...</div>;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Events</h1>
          <p className="text-gray-500 mt-1">Manage upcoming and past events</p>
        </div>
        <AdminButton
          onClick={() => handleOpenForm()}
          variant="accent"
          icon={<Plus className="w-5 h-5" />}
        >
          New Event
        </AdminButton>
      </div>

      <div className="bg-white border border-[#E5E7EB] rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#F9FAFB] border-b border-[#E5E7EB] text-xs font-semibold text-[#6B7280] uppercase tracking-wider">
                <th className="p-4 pl-6">Cover</th>
                <th className="p-4">Title</th>
                <th className="p-4">Date & Time</th>
                <th className="p-4">Location</th>
                <th className="p-4 text-right pr-6">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E7EB]">
              {events.map((event) => (
                <tr key={event.id} className="hover:bg-[#F9FAFB] transition-colors duration-100 text-[#111827] text-sm">
                  <td className="p-4 pl-6 w-24">
                    {event.image_url ? (
                      <img src={optimizeImage(event.image_url, { width: 80 })} alt={event.title} className="w-16 h-12 object-cover rounded-lg border border-[#E5E7EB]" width={64} height={48} loading="lazy" decoding="async" />
                    ) : (
                      <div className="w-16 h-12 bg-gray-100 rounded-lg flex items-center justify-center border border-[#E5E7EB]">
                        <ImageIcon className="w-5 h-5 text-gray-400" />
                      </div>
                    )}
                  </td>
                  <td className="p-4 font-medium">{event.title}</td>
                  <td className="p-4 text-gray-600">
                    {event.event_date ? new Date(event.event_date).toLocaleString() : 'TBD'}
                  </td>
                  <td className="p-4 text-gray-600 truncate max-w-xs">{event.location || 'TBD'}</td>
                  <td className="p-4 pr-6 text-right space-x-2">
                    <AdminButton
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenAttendees(event)}
                      title="Attendees"
                    >
                      <Users className="w-4 h-4" />
                    </AdminButton>
                    <AdminButton
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenForm(event)}
                      title="Edit"
                    >
                      <Edit2 className="w-4 h-4" />
                    </AdminButton>
                    <AdminButton
                      variant="danger"
                      size="sm"
                      onClick={() => { setSelectedEvent(event); setIsDeleteOpen(true); }}
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </AdminButton>
                  </td>
                </tr>
              ))}
              {events.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-gray-500">No events found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal
        isOpen={isFormOpen}
        onClose={() => !saving && setIsFormOpen(false)}
        title={selectedEvent ? 'Edit Event' : 'New Event'}
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
            <label className="block text-sm font-semibold text-[#111827] mb-1">Description</label>
            <textarea
              required
              rows={4}
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 text-[#111827] bg-white border border-[#E5E7EB] rounded-lg placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#0D9488] focus:border-[#0D9488] disabled:bg-[#F9FAFB] disabled:text-[#6B7280] disabled:cursor-not-allowed transition-colors duration-150"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-[#111827] mb-1">Start Date & Time</label>
              <input
                type="datetime-local"
                required
                value={formData.event_date}
                onChange={e => setFormData({ ...formData, event_date: e.target.value })}
                className="w-full px-3 py-2 text-[#111827] bg-white border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0D9488] focus:border-[#0D9488] disabled:bg-[#F9FAFB] disabled:text-[#6B7280] disabled:cursor-not-allowed transition-colors duration-150"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-[#111827] mb-1">End Date & Time (Optional)</label>
              <input
                type="datetime-local"
                value={formData.endDate}
                onChange={e => setFormData({ ...formData, endDate: e.target.value })}
                className="w-full px-3 py-2 text-[#111827] bg-white border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0D9488] focus:border-[#0D9488] disabled:bg-[#F9FAFB] disabled:text-[#6B7280] disabled:cursor-not-allowed transition-colors duration-150"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-[#111827] mb-1">Capacity (Optional)</label>
              <input
                type="number"
                value={formData.capacity}
                onChange={e => setFormData({ ...formData, capacity: e.target.value })}
                placeholder="e.g. 100"
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
              <p className="text-[11px] text-[#6B7280] mt-1.5 flex items-center gap-1">ℹ️ Recommended: 16:9 Landscape (e.g. 1920x1080)</p>
            </div>
          </div>
          <div className="bg-[#F9FAFB] p-4 rounded-xl border border-[#E5E7EB]">
            <div className="flex items-center gap-3 mb-3">
              <input
                type="checkbox"
                id="is_online"
                checked={formData.is_online}
                onChange={e => setFormData({ ...formData, is_online: e.target.checked })}
                className="w-4 h-4 text-[#0D9488] rounded border-gray-300 focus:ring-[#0D9488]"
              />
              <label htmlFor="is_online" className="text-sm font-medium text-[#111827]">This is an online event</label>
            </div>
            <div>
              <label className="block text-sm font-semibold text-[#111827] mb-1">
                {formData.is_online ? 'Meeting URL (Zoom, Meet, etc)' : 'Physical Location'}
              </label>
              <input
                type="text"
                placeholder={formData.is_online ? 'https://zoom.us/j/123...' : '123 Main St...'}
                value={formData.is_online ? formData.meetingUrl : formData.location}
                onChange={e => formData.is_online ? setFormData({ ...formData, meetingUrl: e.target.value }) : setFormData({ ...formData, location: e.target.value })}
                className="w-full px-3 py-2 text-[#111827] bg-white border border-[#E5E7EB] rounded-lg placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#0D9488] focus:border-[#0D9488] disabled:bg-[#F9FAFB] disabled:text-[#6B7280] disabled:cursor-not-allowed transition-colors duration-150"
              />
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
              Save Event
            </AdminButton>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        title="Delete Event"
        message="Are you sure you want to delete this event?"
        confirmLabel="Delete"
        onConfirm={handleDelete}
      />

      {attendeeModal?.open && (
        <Modal
          isOpen={attendeeModal.open}
          onClose={() => setAttendeeModal(null)}
          title={`Attendees: ${attendeeModal.event.title} (${attendeeModal.attendees.length})`}
        >
          {attendeeModal.loading ? (
            <div className="py-8 text-center">Loading attendees...</div>
          ) : attendeeModal.attendees.length === 0 ? (
            <div className="py-8 text-center text-gray-500">No attendees registered yet.</div>
          ) : (
            <div className="overflow-x-auto max-h-96">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b">
                    <th className="p-3">Name</th>
                    <th className="p-3">Email</th>
                    <th className="p-3">Phone</th>
                    <th className="p-3">Registered At</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {attendeeModal.attendees.map((att: any) => (
                    <tr key={att.id} className="hover:bg-gray-50">
                      <td className="p-3 font-medium">{att.full_name || '—'}</td>
                      <td className="p-3 text-gray-600">{att.email || '—'}</td>
                      <td className="p-3 text-gray-600">{att.phone || '—'}</td>
                      <td className="p-3 text-gray-600">{new Date(att.registered_at).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Modal>
      )}
    </div>
  );
}
