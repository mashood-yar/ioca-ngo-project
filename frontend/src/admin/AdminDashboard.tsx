import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getSession, signOut } from '../lib/auth';
import { fetchApi } from '../lib/apiClient';

type Tab = 'contacts' | 'donations' | 'news' | 'events' | 'projects';

interface ContactSubmission {
  id: string;
  name: string;
  email: string;
  message: string;
  created_at: string;
}

interface Donation {
  id: string;
  donor_name: string | null;
  email: string | null;
  phone: string | null;
  payment_method: string | null;
  amount: number | null;
  message: string | null;
  created_at: string;
}

interface NewsPost {
  id: string;
  title: string;
  content: string;
  image_url: string | null;
  published_at: string;
}

interface EventItem {
  id: string;
  title: string;
  description: string;
  location: string | null;
  event_date: string | null;
  image_url: string | null;
  created_at: string;
}

interface ProjectItem {
  id: string;
  title: string;
  description: string;
  status: string;
  image_url: string | null;
  created_at: string;
}

const emptyNewsForm = { title: '', content: '', image_url: '' };
const emptyEventForm = { title: '', description: '', location: '', event_date: '', image_url: '' };
const emptyProjectForm = { title: '', description: '', status: 'ongoing', image_url: '' };

const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });
};

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<Tab>('contacts');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [contacts, setContacts] = useState<ContactSubmission[]>([]);
  const [donations, setDonations] = useState<Donation[]>([]);
  const [newsPosts, setNewsPosts] = useState<NewsPost[]>([]);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [projects, setProjects] = useState<ProjectItem[]>([]);

  const [editingNewsId, setEditingNewsId] = useState<string | null>(null);
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [newsForm, setNewsForm] = useState(emptyNewsForm);
  const [eventForm, setEventForm] = useState(emptyEventForm);
  const [projectForm, setProjectForm] = useState(emptyProjectForm);

  const handleAuthError = useCallback(async (fetchError: any) => {
    if (String(fetchError?.message || fetchError).includes('JWT') || String(fetchError?.message || fetchError).includes('token') || fetchError?.code === 'PGRST301') {
      await signOut();
      navigate('/admin/login', { replace: true });
      return true;
    }
    return false;
  }, [navigate]);

  const loadContacts = useCallback(async () => {
    const { data, error: fetchError } = await fetchApi<ContactSubmission[]>('/contacts');

    if (fetchError) {
      if (await handleAuthError(fetchError)) return;
      setError('Failed to load contact submissions');
    } else {
      setContacts(data ?? []);
    }
  }, [handleAuthError]);

  const loadDonations = useCallback(async () => {
    const { data, error: fetchError } = await fetchApi<Donation[]>('/donations');

    if (fetchError) {
      if (await handleAuthError(fetchError)) return;
      setError('Failed to load donations');
    } else {
      setDonations(data ?? []);
    }
  }, [handleAuthError]);

  const loadNews = useCallback(async () => {
    const { data, error: fetchError } = await fetchApi<NewsPost[]>('/news');

    if (fetchError) {
      if (await handleAuthError(fetchError)) return;
      setError('Failed to load news posts');
    } else {
      setNewsPosts(data ?? []);
    }
  }, [handleAuthError]);

  const loadEvents = useCallback(async () => {
    const { data, error: fetchError } = await fetchApi<EventItem[]>('/events');

    if (fetchError) {
      if (await handleAuthError(fetchError)) return;
      setError('Failed to load events');
    } else {
      setEvents(data ?? []);
    }
  }, [handleAuthError]);

  const loadProjects = useCallback(async () => {
    const { data, error: fetchError } = await fetchApi<ProjectItem[]>('/projects');

    if (fetchError) {
      if (await handleAuthError(fetchError)) return;
      setError('Failed to load projects');
    } else {
      setProjects(data ?? []);
    }
  }, [handleAuthError]);

  const loadTabData = useCallback(async (tab: Tab) => {
    setLoading(true);
    setError('');

    switch (tab) {
      case 'contacts':
        await loadContacts();
        break;
      case 'donations':
        await loadDonations();
        break;
      case 'news':
        await loadNews();
        break;
      case 'events':
        await loadEvents();
        break;
      case 'projects':
        await loadProjects();
        break;
    }

    setLoading(false);
  }, [loadContacts, loadDonations, loadEvents, loadNews, loadProjects]);

  useEffect(() => {
    const checkAuthAndLoad = async () => {
      const { data: { session } } = await getSession();
      if (!session) {
        navigate('/admin/login', { replace: true });
        return;
      }
      await loadTabData(activeTab);
    };

    checkAuthAndLoad();
  }, [navigate, activeTab, loadTabData]);

  const handleLogout = async () => {
    await signOut();
    navigate('/admin/login');
  };

  const handleDelete = async (table: 'contacts' | 'news' | 'events' | 'projects', id: string) => {
    setDeletingId(id);

    const { error: deleteError } = await fetchApi(`/${table}/${id}`, { method: 'DELETE' });

    if (deleteError) {
      if (await handleAuthError(deleteError)) return;
      setError(`Failed to delete ${table} record`);
    } else {
      switch (table) {
        case 'contacts':
          setContacts((prev) => prev.filter((c) => c.id !== id));
          break;
        case 'news':
          setNewsPosts((prev) => prev.filter((n) => n.id !== id));
          break;
        case 'events':
          setEvents((prev) => prev.filter((e) => e.id !== id));
          break;
        case 'projects':
          setProjects((prev) => prev.filter((p) => p.id !== id));
          break;
      }
    }

    setDeletingId(null);
  };

  const resetNewsForm = () => {
    setEditingNewsId(null);
    setNewsForm(emptyNewsForm);
  };

  const resetEventForm = () => {
    setEditingEventId(null);
    setEventForm(emptyEventForm);
  };

  const resetProjectForm = () => {
    setEditingProjectId(null);
    setProjectForm(emptyProjectForm);
  };

  const handleSaveNews = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    const payload = {
      title: newsForm.title,
      content: newsForm.content,
      imageUrl: newsForm.image_url || undefined,
    };

    const result = editingNewsId
      ? await fetchApi(`/news/${editingNewsId}`, { method: 'PUT', body: JSON.stringify(payload) })
      : await fetchApi('/news', { method: 'POST', body: JSON.stringify(payload) });

    if (result.error) {
      if (await handleAuthError(result.error)) return;
      setError('Failed to save news post');
    } else {
      resetNewsForm();
      await loadNews();
    }

    setSaving(false);
  };

  const handleSaveEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    const payload = {
      title: eventForm.title,
      description: eventForm.description,
      location: eventForm.location || undefined,
      eventDate: eventForm.event_date || undefined,
      imageUrl: eventForm.image_url || undefined,
    };

    const result = editingEventId
      ? await fetchApi(`/events/${editingEventId}`, { method: 'PUT', body: JSON.stringify(payload) })
      : await fetchApi('/events', { method: 'POST', body: JSON.stringify(payload) });

    if (result.error) {
      if (await handleAuthError(result.error)) return;
      setError('Failed to save event');
    } else {
      resetEventForm();
      await loadEvents();
    }

    setSaving(false);
  };

  const handleSaveProject = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    const payload = {
      title: projectForm.title,
      description: projectForm.description,
      status: projectForm.status,
      imageUrl: projectForm.image_url || undefined,
    };

    const result = editingProjectId
      ? await fetchApi(`/projects/${editingProjectId}`, { method: 'PUT', body: JSON.stringify(payload) })
      : await fetchApi('/projects', { method: 'POST', body: JSON.stringify(payload) });

    if (result.error) {
      if (await handleAuthError(result.error)) return;
      setError('Failed to save project');
    } else {
      resetProjectForm();
      await loadProjects();
    }

    setSaving(false);
  };

  const formatDate = (dateStr: string) => new Date(dateStr).toLocaleString();

  const tabs: { key: Tab; label: string }[] = [
    { key: 'contacts', label: 'Contacts' },
    { key: 'donations', label: 'Donations' },
    { key: 'news', label: 'News' },
    { key: 'events', label: 'Events' },
    { key: 'projects', label: 'Projects' },
  ];

  return (
    <div className="min-h-screen bg-brand-gray">
      <header className="bg-brand-navy text-white px-6 py-4 flex items-center justify-between">
        <h1 className="text-xl font-bold">IOCA Admin Dashboard</h1>
        <button
          onClick={handleLogout}
          className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm font-bold transition-colors"
        >
          Logout
        </button>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex flex-wrap gap-2 mb-6">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${
                activeTab === tab.key
                  ? 'bg-brand-teal text-white'
                  : 'bg-white text-brand-navy/70 hover:bg-brand-teal/10 border border-brand-navy/10'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {error && (
          <p className="text-red-600 text-sm mb-4">{error}</p>
        )}

        {loading ? (
          <p className="text-brand-navy/60">Loading...</p>
        ) : (
          <>
            {activeTab === 'contacts' && (
              <>
                <h2 className="text-2xl font-bold text-brand-navy mb-6">Contact Submissions</h2>
                {contacts.length === 0 ? (
                  <p className="text-brand-navy/60">No contact submissions yet.</p>
                ) : (
                  <div className="bg-white rounded-2xl shadow-lg border border-brand-navy/10 overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead>
                        <tr className="border-b border-brand-navy/10 bg-brand-gray">
                          <th className="px-4 py-3 font-bold text-brand-navy">Name</th>
                          <th className="px-4 py-3 font-bold text-brand-navy">Email</th>
                          <th className="px-4 py-3 font-bold text-brand-navy">Message</th>
                          <th className="px-4 py-3 font-bold text-brand-navy">Date</th>
                          <th className="px-4 py-3 font-bold text-brand-navy">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {contacts.map((contact) => (
                          <tr key={contact.id} className="border-b border-brand-navy/5 hover:bg-brand-gray/50">
                            <td className="px-4 py-3 text-brand-navy">{contact.name}</td>
                            <td className="px-4 py-3 text-brand-navy">{contact.email}</td>
                            <td className="px-4 py-3 text-brand-navy max-w-xs truncate">{contact.message}</td>
                            <td className="px-4 py-3 text-brand-navy/70 whitespace-nowrap">{formatDate(contact.created_at)}</td>
                            <td className="px-4 py-3">
                              <button
                                onClick={() => handleDelete('contacts', contact.id)}
                                disabled={deletingId === contact.id}
                                className="px-3 py-1 bg-red-600 text-white text-xs font-bold rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                              >
                                {deletingId === contact.id ? 'Deleting...' : 'Delete'}
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            )}

            {activeTab === 'donations' && (
              <>
                <h2 className="text-2xl font-bold text-brand-navy mb-6">Donations</h2>
                {donations.length === 0 ? (
                  <p className="text-brand-navy/60">No donations yet.</p>
                ) : (
                  <div className="bg-white rounded-2xl shadow-lg border border-brand-navy/10 overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead>
                        <tr className="border-b border-brand-navy/10 bg-brand-gray">
                          <th className="px-4 py-3 font-bold text-brand-navy">Date</th>
                          <th className="px-4 py-3 font-bold text-brand-navy">Donor</th>
                          <th className="px-4 py-3 font-bold text-brand-navy">Contact</th>
                          <th className="px-4 py-3 font-bold text-brand-navy">Method</th>
                          <th className="px-4 py-3 font-bold text-brand-navy">Amount</th>
                          <th className="px-4 py-3 font-bold text-brand-navy">Message / Cause</th>
                        </tr>
                      </thead>
                      <tbody>
                        {donations.map((donation) => (
                          <tr key={donation.id} className="border-b border-brand-navy/5 hover:bg-brand-gray/50">
                            <td className="px-4 py-3 text-brand-navy/70 whitespace-nowrap">{formatDate(donation.created_at)}</td>
                            <td className="px-4 py-3 text-brand-navy">{donation.donor_name ?? 'Anonymous'}</td>
                            <td className="px-4 py-3">
                              <div className="text-sm text-brand-navy/70">{donation.email || '-'}</div>
                              <div className="text-xs text-brand-navy/50">{donation.phone || '-'}</div>
                            </td>
                            <td className="px-4 py-3 text-brand-navy uppercase">{donation.payment_method || 'Unknown'}</td>
                            <td className="px-4 py-3 text-brand-navy font-bold">Rs {donation.amount?.toLocaleString() || 0}</td>
                            <td className="px-4 py-3 text-brand-navy max-w-xs truncate">{donation.message ?? '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            )}

            {activeTab === 'news' && (
              <>
                <h2 className="text-2xl font-bold text-brand-navy mb-6">News</h2>
                <form onSubmit={handleSaveNews} className="bg-white rounded-2xl shadow-lg border border-brand-navy/10 p-6 mb-6 space-y-4">
                  <h3 className="font-bold text-brand-navy">{editingNewsId ? 'Edit Post' : 'Create Post'}</h3>
                  <input
                    type="text"
                    required
                    placeholder="Title"
                    value={newsForm.title}
                    onChange={(e) => setNewsForm({ ...newsForm, title: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-brand-navy/20 focus:border-brand-teal outline-none"
                  />
                  <textarea
                    required
                    rows={4}
                    placeholder="Content"
                    value={newsForm.content}
                    onChange={(e) => setNewsForm({ ...newsForm, content: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-brand-navy/20 focus:border-brand-teal outline-none resize-none"
                  />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={async (e) => {
                      if (e.target.files && e.target.files[0]) {
                        const base64 = await fileToBase64(e.target.files[0]);
                        setNewsForm({ ...newsForm, image_url: base64 });
                      }
                    }}
                    className="w-full px-4 py-3 rounded-xl border border-brand-navy/20 focus:border-brand-teal outline-none"
                  />
                  {newsForm.image_url && <img src={newsForm.image_url} alt="Preview" className="mt-2 h-20 rounded object-cover" />}
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      disabled={saving}
                      className="px-4 py-2 bg-brand-navy text-white rounded-lg text-sm font-bold hover:bg-brand-teal transition-colors disabled:opacity-50"
                    >
                      {saving ? 'Saving...' : editingNewsId ? 'Update' : 'Create'}
                    </button>
                    {editingNewsId && (
                      <button
                        type="button"
                        onClick={resetNewsForm}
                        className="px-4 py-2 bg-brand-gray text-brand-navy rounded-lg text-sm font-bold border border-brand-navy/10"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </form>
                {newsPosts.length === 0 ? (
                  <p className="text-brand-navy/60">No news posts yet.</p>
                ) : (
                  <div className="bg-white rounded-2xl shadow-lg border border-brand-navy/10 overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead>
                        <tr className="border-b border-brand-navy/10 bg-brand-gray">
                          <th className="px-4 py-3 font-bold text-brand-navy">Title</th>
                          <th className="px-4 py-3 font-bold text-brand-navy">Content</th>
                          <th className="px-4 py-3 font-bold text-brand-navy">Published</th>
                          <th className="px-4 py-3 font-bold text-brand-navy">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {newsPosts.map((post) => (
                          <tr key={post.id} className="border-b border-brand-navy/5 hover:bg-brand-gray/50">
                            <td className="px-4 py-3 text-brand-navy">{post.title}</td>
                            <td className="px-4 py-3 text-brand-navy max-w-xs truncate">{post.content}</td>
                            <td className="px-4 py-3 text-brand-navy/70 whitespace-nowrap">{formatDate(post.published_at)}</td>
                            <td className="px-4 py-3 space-x-2">
                              <button
                                onClick={() => {
                                  setEditingNewsId(post.id);
                                  setNewsForm({
                                    title: post.title,
                                    content: post.content,
                                    image_url: post.image_url ?? '',
                                  });
                                }}
                                className="px-3 py-1 bg-brand-teal text-white text-xs font-bold rounded-lg hover:opacity-90"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleDelete('news', post.id)}
                                disabled={deletingId === post.id}
                                className="px-3 py-1 bg-red-600 text-white text-xs font-bold rounded-lg hover:bg-red-700 disabled:opacity-50"
                              >
                                Delete
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            )}

            {activeTab === 'events' && (
              <>
                <h2 className="text-2xl font-bold text-brand-navy mb-6">Events</h2>
                <form onSubmit={handleSaveEvent} className="bg-white rounded-2xl shadow-lg border border-brand-navy/10 p-6 mb-6 space-y-4">
                  <h3 className="font-bold text-brand-navy">{editingEventId ? 'Edit Event' : 'Create Event'}</h3>
                  <input
                    type="text"
                    required
                    placeholder="Title"
                    value={eventForm.title}
                    onChange={(e) => setEventForm({ ...eventForm, title: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-brand-navy/20 focus:border-brand-teal outline-none"
                  />
                  <textarea
                    required
                    rows={3}
                    placeholder="Description"
                    value={eventForm.description}
                    onChange={(e) => setEventForm({ ...eventForm, description: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-brand-navy/20 focus:border-brand-teal outline-none resize-none"
                  />
                  <input
                    type="text"
                    placeholder="Location"
                    value={eventForm.location}
                    onChange={(e) => setEventForm({ ...eventForm, location: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-brand-navy/20 focus:border-brand-teal outline-none"
                  />
                  <input
                    type="datetime-local"
                    value={eventForm.event_date}
                    onChange={(e) => setEventForm({ ...eventForm, event_date: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-brand-navy/20 focus:border-brand-teal outline-none"
                  />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={async (e) => {
                      if (e.target.files && e.target.files[0]) {
                        const base64 = await fileToBase64(e.target.files[0]);
                        setEventForm({ ...eventForm, image_url: base64 });
                      }
                    }}
                    className="w-full px-4 py-3 rounded-xl border border-brand-navy/20 focus:border-brand-teal outline-none"
                  />
                  {eventForm.image_url && <img src={eventForm.image_url} alt="Preview" className="mt-2 h-20 rounded object-cover" />}
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      disabled={saving}
                      className="px-4 py-2 bg-brand-navy text-white rounded-lg text-sm font-bold hover:bg-brand-teal transition-colors disabled:opacity-50"
                    >
                      {saving ? 'Saving...' : editingEventId ? 'Update' : 'Create'}
                    </button>
                    {editingEventId && (
                      <button type="button" onClick={resetEventForm} className="px-4 py-2 bg-brand-gray text-brand-navy rounded-lg text-sm font-bold border border-brand-navy/10">
                        Cancel
                      </button>
                    )}
                  </div>
                </form>
                {events.length === 0 ? (
                  <p className="text-brand-navy/60">No events yet.</p>
                ) : (
                  <div className="bg-white rounded-2xl shadow-lg border border-brand-navy/10 overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead>
                        <tr className="border-b border-brand-navy/10 bg-brand-gray">
                          <th className="px-4 py-3 font-bold text-brand-navy">Title</th>
                          <th className="px-4 py-3 font-bold text-brand-navy">Location</th>
                          <th className="px-4 py-3 font-bold text-brand-navy">Date</th>
                          <th className="px-4 py-3 font-bold text-brand-navy">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {events.map((event) => (
                          <tr key={event.id} className="border-b border-brand-navy/5 hover:bg-brand-gray/50">
                            <td className="px-4 py-3 text-brand-navy">{event.title}</td>
                            <td className="px-4 py-3 text-brand-navy">{event.location ?? '—'}</td>
                            <td className="px-4 py-3 text-brand-navy/70 whitespace-nowrap">
                              {event.event_date ? formatDate(event.event_date) : '—'}
                            </td>
                            <td className="px-4 py-3 space-x-2">
                              <button
                                onClick={() => {
                                  setEditingEventId(event.id);
                                  setEventForm({
                                    title: event.title,
                                    description: event.description,
                                    location: event.location ?? '',
                                    event_date: event.event_date ? event.event_date.slice(0, 16) : '',
                                    image_url: event.image_url ?? '',
                                  });
                                }}
                                className="px-3 py-1 bg-brand-teal text-white text-xs font-bold rounded-lg hover:opacity-90"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleDelete('events', event.id)}
                                disabled={deletingId === event.id}
                                className="px-3 py-1 bg-red-600 text-white text-xs font-bold rounded-lg hover:bg-red-700 disabled:opacity-50"
                              >
                                Delete
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            )}

            {activeTab === 'projects' && (
              <>
                <h2 className="text-2xl font-bold text-brand-navy mb-6">Projects</h2>
                <form onSubmit={handleSaveProject} className="bg-white rounded-2xl shadow-lg border border-brand-navy/10 p-6 mb-6 space-y-4">
                  <h3 className="font-bold text-brand-navy">{editingProjectId ? 'Edit Project' : 'Create Project'}</h3>
                  <input
                    type="text"
                    required
                    placeholder="Title"
                    value={projectForm.title}
                    onChange={(e) => setProjectForm({ ...projectForm, title: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-brand-navy/20 focus:border-brand-teal outline-none"
                  />
                  <textarea
                    required
                    rows={3}
                    placeholder="Description"
                    value={projectForm.description}
                    onChange={(e) => setProjectForm({ ...projectForm, description: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-brand-navy/20 focus:border-brand-teal outline-none resize-none"
                  />
                  <select
                    value={projectForm.status}
                    onChange={(e) => setProjectForm({ ...projectForm, status: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-brand-navy/20 focus:border-brand-teal outline-none"
                  >
                    <option value="ongoing">Ongoing</option>
                    <option value="completed">Completed</option>
                  </select>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={async (e) => {
                      if (e.target.files && e.target.files[0]) {
                        const base64 = await fileToBase64(e.target.files[0]);
                        setProjectForm({ ...projectForm, image_url: base64 });
                      }
                    }}
                    className="w-full px-4 py-3 rounded-xl border border-brand-navy/20 focus:border-brand-teal outline-none"
                  />
                  {projectForm.image_url && <img src={projectForm.image_url} alt="Preview" className="mt-2 h-20 rounded object-cover" />}
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      disabled={saving}
                      className="px-4 py-2 bg-brand-navy text-white rounded-lg text-sm font-bold hover:bg-brand-teal transition-colors disabled:opacity-50"
                    >
                      {saving ? 'Saving...' : editingProjectId ? 'Update' : 'Create'}
                    </button>
                    {editingProjectId && (
                      <button type="button" onClick={resetProjectForm} className="px-4 py-2 bg-brand-gray text-brand-navy rounded-lg text-sm font-bold border border-brand-navy/10">
                        Cancel
                      </button>
                    )}
                  </div>
                </form>
                {projects.length === 0 ? (
                  <p className="text-brand-navy/60">No projects yet.</p>
                ) : (
                  <div className="bg-white rounded-2xl shadow-lg border border-brand-navy/10 overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead>
                        <tr className="border-b border-brand-navy/10 bg-brand-gray">
                          <th className="px-4 py-3 font-bold text-brand-navy">Title</th>
                          <th className="px-4 py-3 font-bold text-brand-navy">Status</th>
                          <th className="px-4 py-3 font-bold text-brand-navy">Created</th>
                          <th className="px-4 py-3 font-bold text-brand-navy">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {projects.map((project) => (
                          <tr key={project.id} className="border-b border-brand-navy/5 hover:bg-brand-gray/50">
                            <td className="px-4 py-3 text-brand-navy">{project.title}</td>
                            <td className="px-4 py-3 text-brand-navy capitalize">{project.status}</td>
                            <td className="px-4 py-3 text-brand-navy/70 whitespace-nowrap">{formatDate(project.created_at)}</td>
                            <td className="px-4 py-3 space-x-2">
                              <button
                                onClick={() => {
                                  setEditingProjectId(project.id);
                                  setProjectForm({
                                    title: project.title,
                                    description: project.description,
                                    status: project.status,
                                    image_url: project.image_url ?? '',
                                  });
                                }}
                                className="px-3 py-1 bg-brand-teal text-white text-xs font-bold rounded-lg hover:opacity-90"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleDelete('projects', project.id)}
                                disabled={deletingId === project.id}
                                className="px-3 py-1 bg-red-600 text-white text-xs font-bold rounded-lg hover:bg-red-700 disabled:opacity-50"
                              >
                                Delete
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            )}
          </>
        )}
      </main>
    </div>
  );
};

export default AdminDashboard;
