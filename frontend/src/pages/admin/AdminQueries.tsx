import { useState, useEffect } from 'react';
import { Mail, Clock, CheckCircle2, Inbox } from 'lucide-react';
import { fetchApi } from '../../lib/apiClient';

interface Query {
  id: string;
  name: string;
  email: string;
  message: string;
  status: 'unread' | 'read' | 'replied';
  admin_notes?: string;
  created_at: string;
  replied_at?: string;
}

export function AdminQueries() {
  const [queries, setQueries] = useState<Query[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'unread' | 'read' | 'replied'>('all');
  
  // Local state for the selected query's notes (to allow typing without full re-renders)
  const [localNotes, setLocalNotes] = useState('');

  const loadQueries = async () => {
    try {
      const endpoint = filter === 'all' ? '/contacts' : `/contacts?status=${filter}`;
      const { data } = await fetchApi<Query[]>(endpoint);
      if (data) setQueries(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadQueries();
  }, [filter]);

  const selectedQuery = queries.find(q => q.id === selectedId);

  // Sync local notes when selection changes
  useEffect(() => {
    if (selectedQuery) {
      setLocalNotes(selectedQuery.admin_notes || '');
      // Auto-mark as read if unread
      if (selectedQuery.status === 'unread') {
        updateStatus(selectedQuery.id, 'read');
      }
    }
  }, [selectedId]);

  const updateStatus = async (id: string, newStatus: string, notes?: string) => {
    try {
      await fetchApi(`/contacts/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ 
          status: newStatus,
          ...(notes !== undefined && { adminNotes: notes })
        }),
      });
      // Update local state optimistic
      setQueries(prev => prev.map(q => q.id === id ? { ...q, status: newStatus as any, admin_notes: notes ?? q.admin_notes } : q));
    } catch (err) {
      window.dispatchEvent(new CustomEvent('app-toast', { detail: { message: 'Failed to update', variant: 'error' }}));
    }
  };

  const handleNotesBlur = () => {
    if (selectedQuery && localNotes !== selectedQuery.admin_notes) {
      updateStatus(selectedQuery.id, selectedQuery.status, localNotes);
    }
  };

  if (loading) return <div className="p-8">Loading queries...</div>;

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col animate-fade-in">
      <div className="flex justify-between items-center mb-6 shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Client Queries</h1>
          <p className="text-gray-500 mt-1">Manage contact form submissions</p>
        </div>
        <div className="flex bg-white rounded-lg p-1 border border-gray-200 shadow-sm">
          {['all', 'unread', 'read', 'replied'].map(f => (
            <button
              key={f}
              onClick={() => { setFilter(f as any); setSelectedId(null); }}
              className={`px-4 py-1.5 rounded-md text-sm font-medium capitalize transition-colors ${
                filter === f ? 'bg-primary text-white shadow-sm' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex min-h-0">
        {/* Left Panel - List */}
        <div className="w-1/3 min-w-[300px] border-r border-gray-100 flex flex-col">
          <div className="p-4 border-b border-gray-100 bg-gray-50 shrink-0">
            <h2 className="font-semibold text-gray-700">Inbox ({queries.length})</h2>
          </div>
          <div className="flex-1 overflow-y-auto">
            {queries.map(q => (
              <button
                key={q.id}
                onClick={() => setSelectedId(q.id)}
                className={`w-full text-left p-4 border-b border-gray-50 transition-colors flex flex-col gap-1 ${
                  selectedId === q.id ? 'bg-primary/5' : 'hover:bg-gray-50'
                } ${q.status === 'unread' ? 'border-l-4 border-l-blue-500' : 'border-l-4 border-l-transparent'}`}
              >
                <div className="flex justify-between items-start w-full">
                  <span className={`font-medium ${q.status === 'unread' ? 'text-gray-900' : 'text-gray-600'}`}>
                    {q.name}
                  </span>
                  <span className="text-xs text-gray-400 whitespace-nowrap ml-2">
                    {new Date(q.created_at).toLocaleDateString()}
                  </span>
                </div>
                <span className="text-sm text-gray-500 truncate w-full">{q.message}</span>
                <div className="mt-2">
                  <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full uppercase tracking-wider ${
                    q.status === 'replied' ? 'bg-green-100 text-green-700' :
                    q.status === 'unread' ? 'bg-blue-100 text-blue-700' :
                    'bg-gray-100 text-gray-600'
                  }`}>
                    {q.status}
                  </span>
                </div>
              </button>
            ))}
            {queries.length === 0 && (
              <div className="p-8 text-center text-gray-500">No queries found.</div>
            )}
          </div>
        </div>

        {/* Right Panel - Detail */}
        <div className="flex-1 bg-white flex flex-col overflow-y-auto">
          {selectedQuery ? (
            <div className="p-8 max-w-3xl">
              <div className="flex justify-between items-start mb-8">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-lg">
                    {selectedQuery.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">{selectedQuery.name}</h2>
                    <div className="flex items-center gap-4 text-sm text-gray-500 mt-1">
                      <span className="flex items-center gap-1"><Mail className="w-4 h-4" /> {selectedQuery.email}</span>
                      <span className="flex items-center gap-1"><Clock className="w-4 h-4" /> {new Date(selectedQuery.created_at).toLocaleString()}</span>
                    </div>
                  </div>
                </div>
                {selectedQuery.status !== 'replied' && (
                  <button
                    onClick={() => updateStatus(selectedQuery.id, 'replied')}
                    className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors font-medium text-sm shadow-sm"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Mark as Replied
                  </button>
                )}
              </div>

              <div className="bg-gray-50 rounded-2xl p-6 mb-8 border border-gray-100">
                <p className="text-gray-800 whitespace-pre-wrap leading-relaxed">
                  {selectedQuery.message}
                </p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">Admin Notes (Private)</label>
                <textarea
                  rows={4}
                  placeholder="Add notes about this query... (auto-saves on click away)"
                  value={localNotes}
                  onChange={(e) => setLocalNotes(e.target.value)}
                  onBlur={handleNotesBlur}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary text-sm bg-yellow-50/30"
                />
                <p className="text-xs text-gray-400 mt-2">Notes are only visible to administrators.</p>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
              <Inbox className="w-16 h-16 mb-4 opacity-20" />
              <p>Select a query to view details</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
