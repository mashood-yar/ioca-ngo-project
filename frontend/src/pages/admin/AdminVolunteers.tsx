import { useState, useEffect } from 'react';
import { Mail, Phone, MapPin, Clock, CheckCircle2, FileText, Trash2, HeartHandshake, UserPlus, CreditCard, GraduationCap, Shield, RefreshCw } from 'lucide-react';
import { fetchApi } from '../../lib/apiClient';
import { AdminButton } from './AdminButton';

interface Volunteer {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  city: string | null;
  cnic: string | null;
  date_of_birth: string | null;
  education: string | null;
  availability: string | null;
  skills: string | null;
  skills_detail: string | null;
  motivation: string | null;
  heard_from: string | null;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  status: 'pending' | 'reviewed' | 'accepted' | 'rejected';
  admin_notes: string | null;
  created_at: string;
}

export function AdminVolunteers() {
  const [volunteers, setVolunteers] = useState<Volunteer[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'pending' | 'reviewed' | 'accepted' | 'rejected'>('all');
  
  const [localNotes, setLocalNotes] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [isConverting, setIsConverting] = useState(false);

  const loadVolunteers = async () => {
    try {
      const endpoint = filter === 'all' ? '/volunteers' : `/volunteers?status=${filter}`;
      const { data } = await fetchApi<{ volunteers: Volunteer[] }>(endpoint);
      if (data && data.volunteers) {
        setVolunteers(data.volunteers);
      } else if (Array.isArray(data)) {
        setVolunteers(data as Volunteer[]);
      } else {
        setVolunteers([]);
      }
    } catch (err) {
      console.error(err);
      window.dispatchEvent(new CustomEvent('app-toast', { detail: { message: 'Failed to load volunteers', variant: 'error' }}));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVolunteers();
  }, [filter]);

  const selectedVolunteer = volunteers.find(v => v.id === selectedId);

  useEffect(() => {
    if (selectedVolunteer) {
      setLocalNotes(selectedVolunteer.admin_notes || '');
    }
  }, [selectedId]);

  const updateStatus = async (id: string, newStatus: string, notes?: string) => {
    try {
      await fetchApi(`/volunteers/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ 
          status: newStatus,
          // Fixed: was adminNotes (camelCase) — backend Zod expects admin_notes (snake_case)
          ...(notes !== undefined && { admin_notes: notes })
        }),
      });
      setVolunteers(prev => prev.map(v => v.id === id ? { ...v, status: newStatus as any, admin_notes: notes ?? v.admin_notes } : v));
      window.dispatchEvent(new CustomEvent('app-toast', { detail: { message: 'Status updated', variant: 'success' }}));
    } catch (err) {
      window.dispatchEvent(new CustomEvent('app-toast', { detail: { message: 'Failed to update', variant: 'error' }}));
    }
  };

  const handleConvertToPersonnel = async (volunteer: Volunteer) => {
    if (!confirm(`Convert "${volunteer.full_name}" to an official IOCA Personnel member? This will generate a VOL-xxx ID and QR code, and send them a welcome email.`)) return;
    setIsConverting(true);
    try {
      const { data, error } = await fetchApi<{ personnel: { uid: string } }>(`/volunteers/${volunteer.id}/convert`, {
        method: 'POST',
      });
      if (error) throw new Error(error);
      const uid = data?.personnel?.uid || 'VOL-???';
      window.dispatchEvent(new CustomEvent('app-toast', { 
        detail: { message: `✓ ${volunteer.full_name} added to Personnel as ${uid}. Welcome email sent!`, variant: 'success' }
      }));
    } catch (err: any) {
      const msg = err.message || 'Failed to convert to personnel';
      window.dispatchEvent(new CustomEvent('app-toast', { detail: { message: msg, variant: 'error' }}));
    } finally {
      setIsConverting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this application? This action cannot be undone.')) return;
    
    setIsDeleting(true);
    try {
      await fetchApi(`/volunteers/${id}`, { method: 'DELETE' });
      setVolunteers(prev => prev.filter(v => v.id !== id));
      if (selectedId === id) setSelectedId(null);
      window.dispatchEvent(new CustomEvent('app-toast', { detail: { message: 'Application deleted', variant: 'success' }}));
    } catch (err) {
      window.dispatchEvent(new CustomEvent('app-toast', { detail: { message: 'Failed to delete', variant: 'error' }}));
    } finally {
      setIsDeleting(false);
    }
  };

  const handleNotesBlur = () => {
    if (selectedVolunteer && localNotes !== selectedVolunteer.admin_notes) {
      updateStatus(selectedVolunteer.id, selectedVolunteer.status, localNotes);
    }
  };

  if (loading) return <div className="p-8">Loading volunteer applications...</div>;

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col animate-fade-in">
      <div className="flex justify-between items-center mb-6 shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Volunteers</h1>
          <p className="text-gray-500 mt-1">Manage volunteer applications</p>
        </div>
        <div className="flex bg-slate-100 p-1.5 rounded-2xl border border-slate-200/50 shadow-inner overflow-x-auto max-w-full">
          {['all', 'pending', 'reviewed', 'accepted', 'rejected'].map(f => (
            <button
              key={f}
              onClick={() => { setFilter(f as any); setSelectedId(null); }}
              className={`px-4 py-2 rounded-lg text-xs font-bold capitalize transition-all whitespace-nowrap ${
                filter === f
                  ? 'bg-[#1D2D49] text-white shadow-sm'
                  : 'text-[#6B7280] hover:text-[#1D2D49] hover:bg-[#F3F4F6]'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 bg-white rounded-2xl shadow-sm border border-[#E5E7EB] overflow-hidden flex min-h-0">
        {/* Left Panel - List */}
        <div className="w-1/3 min-w-[300px] border-r border-[#E5E7EB] flex flex-col">
          <div className="p-4 border-b border-[#E5E7EB] bg-gray-50 shrink-0">
            <h2 className="font-semibold text-gray-700">Applications ({volunteers.length})</h2>
          </div>
          <div className="flex-1 overflow-y-auto">
            {volunteers.map(v => (
              <button
                key={v.id}
                onClick={() => setSelectedId(v.id)}
                className={`w-full text-left p-4 border-b border-[#E5E7EB]/50 transition-colors flex flex-col gap-1 ${
                  selectedId === v.id ? 'bg-[#0D9488]/10' : 'hover:bg-gray-50'
                } ${v.status === 'pending' ? 'border-l-4 border-l-[#F59E0B]' : 'border-l-4 border-l-transparent'}`}
              >
                <div className="flex justify-between items-start w-full">
                  <span className={`font-medium ${v.status === 'pending' ? 'text-gray-900 font-bold' : 'text-gray-600'}`}>
                    {v.full_name}
                  </span>
                  <span className="text-xs text-gray-400 whitespace-nowrap ml-2">
                    {new Date(v.created_at).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-500 w-full mt-1">
                  <MapPin className="w-3 h-3" />
                  <span className="truncate">{v.city || 'No city provided'}</span>
                </div>
                <div className="mt-2">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border capitalize ${
                    v.status === 'accepted' ? 'bg-[#D1FAE5] text-[#065F46] border-[#D1FAE5]' :
                    v.status === 'rejected' ? 'bg-[#FEE2E2] text-[#991B1B] border-[#FEE2E2]' :
                    v.status === 'reviewed' ? 'bg-[#DBEAFE] text-[#1E40AF] border-[#DBEAFE]' :
                    'bg-[#FEF3C7] text-[#92400E] border-[#FEF3C7]'
                  }`}>
                    {v.status}
                  </span>
                </div>
              </button>
            ))}
            {volunteers.length === 0 && (
              <div className="p-12 text-center text-gray-500 flex flex-col items-center justify-center">
                <HeartHandshake className="w-10 h-10 mb-3 opacity-20" />
                <p>No applications found.</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Panel - Details */}
        <div className="flex-1 bg-gray-50/50 flex flex-col min-w-0">
          {selectedVolunteer ? (
            <div className="flex-1 overflow-y-auto">
              {/* Header Actions */}
              <div className="p-6 bg-white border-b border-[#E5E7EB] sticky top-0 z-10 shadow-sm">
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">{selectedVolunteer.full_name}</h2>
                    <div className="flex flex-wrap gap-4 mt-2 text-sm text-gray-500">
                      <div className="flex items-center gap-1.5">
                        <Mail className="w-4 h-4" />
                        <a href={`mailto:${selectedVolunteer.email}`} className="hover:text-[#0D9488]">{selectedVolunteer.email}</a>
                      </div>
                      {selectedVolunteer.phone && (
                        <div className="flex items-center gap-1.5">
                          <Phone className="w-4 h-4" />
                          <a href={`tel:${selectedVolunteer.phone}`} className="hover:text-[#0D9488]">{selectedVolunteer.phone}</a>
                        </div>
                      )}
                      {selectedVolunteer.city && (
                        <div className="flex items-center gap-1.5">
                          <MapPin className="w-4 h-4" />
                          {selectedVolunteer.city}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2 flex-wrap justify-end">
                    <AdminButton 
                      variant={selectedVolunteer.status === 'accepted' ? 'primary' : 'outline'}
                      onClick={() => updateStatus(selectedVolunteer.id, 'accepted')}
                      className={selectedVolunteer.status === 'accepted' ? 'bg-[#059669] hover:bg-[#047857]' : 'text-[#059669] hover:bg-[#059669]/10'}
                    >
                      Accept
                    </AdminButton>
                    <AdminButton 
                      variant={selectedVolunteer.status === 'reviewed' ? 'primary' : 'outline'}
                      onClick={() => updateStatus(selectedVolunteer.id, 'reviewed')}
                    >
                      Reviewed
                    </AdminButton>
                    <AdminButton 
                      variant={selectedVolunteer.status === 'rejected' ? 'primary' : 'outline'}
                      onClick={() => updateStatus(selectedVolunteer.id, 'rejected')}
                      className={selectedVolunteer.status === 'rejected' ? 'bg-red-600 hover:bg-red-700 border-red-600' : 'text-red-600 hover:bg-red-50 border-red-200'}
                    >
                      Reject
                    </AdminButton>
                  </div>
                </div>

                {/* Convert to Personnel button — only shown when accepted */}
                {selectedVolunteer.status === 'accepted' && (
                  <div className="mt-4 pt-4 border-t border-[#E5E7EB]">
                    <button
                      onClick={() => handleConvertToPersonnel(selectedVolunteer)}
                      disabled={isConverting}
                      className="flex items-center gap-2 bg-[#1D2D49] text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-[#2a3f6b] transition-colors disabled:opacity-60 disabled:cursor-not-allowed shadow-sm"
                    >
                      {isConverting ? (
                        <><RefreshCw className="w-4 h-4 animate-spin" /> Converting...</>
                      ) : (
                        <><UserPlus className="w-4 h-4" /> Add to Personnel (Generate VOL-xxx ID)</>
                      )}
                    </button>
                    <p className="text-xs text-gray-500 mt-1.5">
                      Creates an official personnel record with a unique ID, QR code, and sends a welcome email to the volunteer.
                    </p>
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="p-6 space-y-6 max-w-3xl">

                {/* Personal Details */}
                <div className="bg-white p-6 rounded-xl border border-[#E5E7EB] shadow-sm">
                  <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4">Personal Details</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    {selectedVolunteer.cnic && (
                      <div className="flex items-start gap-2">
                        <CreditCard className="w-4 h-4 text-brand-teal mt-0.5 shrink-0" />
                        <div>
                          <p className="text-gray-500 text-xs">CNIC</p>
                          <p className="font-mono font-medium text-gray-800">{selectedVolunteer.cnic}</p>
                        </div>
                      </div>
                    )}
                    {selectedVolunteer.date_of_birth && (
                      <div className="flex items-start gap-2">
                        <Clock className="w-4 h-4 text-brand-teal mt-0.5 shrink-0" />
                        <div>
                          <p className="text-gray-500 text-xs">Date of Birth</p>
                          <p className="font-medium text-gray-800">{new Date(selectedVolunteer.date_of_birth).toLocaleDateString('en-PK')}</p>
                        </div>
                      </div>
                    )}
                    {selectedVolunteer.education && (
                      <div className="flex items-start gap-2">
                        <GraduationCap className="w-4 h-4 text-brand-teal mt-0.5 shrink-0" />
                        <div>
                          <p className="text-gray-500 text-xs">Education</p>
                          <p className="font-medium text-gray-800 capitalize">{selectedVolunteer.education}</p>
                        </div>
                      </div>
                    )}
                    {selectedVolunteer.heard_from && (
                      <div>
                        <p className="text-gray-500 text-xs">Source</p>
                        <p className="font-medium text-gray-800 capitalize">{selectedVolunteer.heard_from}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Emergency Contact */}
                {(selectedVolunteer.emergency_contact_name || selectedVolunteer.emergency_contact_phone) && (
                  <div className="bg-amber-50 p-5 rounded-xl border border-amber-200 shadow-sm">
                    <h3 className="text-sm font-bold text-amber-900 uppercase tracking-wider flex items-center gap-2 mb-3">
                      <Shield className="w-4 h-4 text-amber-600" />
                      Emergency Contact
                    </h3>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <p className="text-amber-600 text-xs">Name</p>
                        <p className="font-medium text-gray-800">{selectedVolunteer.emergency_contact_name || '—'}</p>
                      </div>
                      <div>
                        <p className="text-amber-600 text-xs">Phone</p>
                        <a href={`tel:${selectedVolunteer.emergency_contact_phone}`} className="font-medium text-gray-800 hover:text-[#0D9488]">
                          {selectedVolunteer.emergency_contact_phone || '—'}
                        </a>
                      </div>
                    </div>
                  </div>
                )}

                {/* Application Details */}
                <div className="bg-white p-6 rounded-xl border border-[#E5E7EB] shadow-sm space-y-5">
                  <div>
                    <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2 mb-3">
                      <Clock className="w-4 h-4 text-brand-teal" />
                      Availability
                    </h3>
                    <p className="text-gray-700 capitalize">{selectedVolunteer.availability || 'Not specified'}</p>
                  </div>
                  
                  <hr className="border-[#E5E7EB]" />
                  
                  <div>
                    <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2 mb-3">
                      <CheckCircle2 className="w-4 h-4 text-brand-teal" />
                      Program / Skills
                    </h3>
                    <p className="text-gray-700 capitalize">{selectedVolunteer.skills || 'Not specified'}</p>
                    {selectedVolunteer.skills_detail && (
                      <p className="text-gray-600 text-sm mt-2 whitespace-pre-wrap">{selectedVolunteer.skills_detail}</p>
                    )}
                  </div>

                  {selectedVolunteer.motivation && (
                    <>
                      <hr className="border-[#E5E7EB]" />
                      <div>
                        <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2 mb-3">
                          <HeartHandshake className="w-4 h-4 text-brand-teal" />
                          Motivation / Message
                        </h3>
                        <p className="text-gray-700 whitespace-pre-wrap">{selectedVolunteer.motivation}</p>
                      </div>
                    </>
                  )}
                </div>

                {/* Admin Notes */}
                <div className="bg-amber-50 p-6 rounded-xl border border-amber-200 shadow-sm">
                  <h3 className="text-sm font-bold text-amber-900 uppercase tracking-wider flex items-center gap-2 mb-3">
                    <FileText className="w-4 h-4 text-amber-600" />
                    Admin Notes (Internal)
                  </h3>
                  <textarea
                    value={localNotes}
                    onChange={(e) => setLocalNotes(e.target.value)}
                    onBlur={handleNotesBlur}
                    placeholder="Add private notes about this applicant..."
                    className="w-full bg-white border border-amber-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                    rows={4}
                  />
                  <p className="text-xs text-amber-600 mt-2">Notes are saved automatically when you click outside the text box.</p>
                </div>

                {/* Delete Zone */}
                <div className="pt-6 border-t border-[#E5E7EB] flex justify-end">
                  <button
                    onClick={() => handleDelete(selectedVolunteer.id)}
                    disabled={isDeleting}
                    className="flex items-center gap-2 text-red-600 hover:text-red-700 hover:bg-red-50 px-4 py-2 rounded-lg transition-colors text-sm font-medium disabled:opacity-50"
                  >
                    <Trash2 className="w-4 h-4" />
                    {isDeleting ? 'Deleting...' : 'Delete Application'}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-400">
              <div className="text-center">
                <HeartHandshake className="w-12 h-12 mx-auto mb-3 opacity-20" />
                <p>Select an application to view details</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
