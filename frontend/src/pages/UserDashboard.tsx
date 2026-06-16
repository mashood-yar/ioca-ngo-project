import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { fetchApi } from '../lib/apiClient';
import { formatDate, memberSince, daysUntil } from '../lib/formatDate';
import { Calendar, MapPin, User, RefreshCw, Phone, Mail, X, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ProfileData {
  id: string;
  name: string;
  role: string;
  created_at: string;
  phone?: string;
}

interface Tier {
  name: string;
}

interface MembershipData {
  id: string;
  status: string;
  start_date: string;
  end_date: string;
  payment_ref: string;
  tier?: Tier;
}

interface DonationData {
  id: string;
  created_at: string;
  amount: number;
  payment_method: string;
  status?: string;
}

interface EventData {
  id: string;
  title: string;
  location: string;
  event_date: string;
}

interface RegistrationData {
  id: string;
  status: string;
  event: EventData;
}

interface Zone {
  name: string;
}

interface MemberData {
  zone?: Zone;
}

export function UserDashboard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [membership, setMembership] = useState<MembershipData | null>(null);
  const [donations, setDonations] = useState<DonationData[]>([]);
  const [eventRegistrations, setEventRegistrations] = useState<RegistrationData[]>([]);
  const [member, setMember] = useState<MemberData | null>(null);

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [nameError, setNameError] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  useEffect(() => {
    const handleFocus = () => fetchDashboardData();
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(false);
      
      const [
        { data: profileData },
        { data: membershipData },
        { data: donationsData },
        { data: eventsData },
        { data: memberData }
      ] = await Promise.all([
        fetchApi<ProfileData>('/profile/me'),
        fetchApi<MembershipData>('/memberships/me').catch(() => ({ data: null, error: null })),
        fetchApi<DonationData[]>('/donations/me').catch(() => ({ data: [] as DonationData[], error: null })),
        fetchApi<RegistrationData[]>('/event-registrations/me').catch(() => ({ data: [] as RegistrationData[], error: null })),
        fetchApi<MemberData>('/members/me').catch(() => ({ data: null, error: null })),
      ]);

      setProfile(profileData);
      setMembership(membershipData);
      setDonations(Array.isArray(donationsData) ? donationsData : []);
      setEventRegistrations(Array.isArray(eventsData) ? eventsData : []);
      setMember(memberData);
    } catch (err) {
      console.error('Failed to load dashboard:', err);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setNameError('');
    setPhoneError('');
    
    let hasError = false;
    if (!editName.trim()) {
      setNameError('Full name is required');
      hasError = true;
    }
    if (editPhone.trim().length > 0 && editPhone.trim().length < 7) {
      setPhoneError('Please enter a valid phone number');
      hasError = true;
    }

    if (hasError) return;

    setIsSaving(true);
    try {
      const { error } = await fetchApi('/profile/me', {
        method: 'PATCH',
        body: JSON.stringify({ name: editName, phone: editPhone }),
      });
      if (error) throw new Error(error);
      setProfile(prev => prev ? { ...prev, name: editName, phone: editPhone } : { id: user?.id || '', name: editName, phone: editPhone, role: 'member', created_at: new Date().toISOString() });
      
      setIsSaved(true);
      setTimeout(() => {
        setIsSaved(false);
        setIsEditModalOpen(false);
      }, 300);

      window.dispatchEvent(new CustomEvent('app-toast', { 
        detail: { message: 'Profile updated successfully!', variant: 'success' } 
      }));
    } catch (err) {
      window.dispatchEvent(new CustomEvent('app-toast', { 
        detail: { message: 'Failed to update profile.', variant: 'error' } 
      }));
    } finally {
      if (!isSaved) setIsSaving(false);
    }
  };

  const openEditModal = () => {
    setEditName(profile?.name || user?.user_metadata?.full_name || '');
    setEditPhone(profile?.phone || '');
    setNameError('');
    setPhoneError('');
    setIsSaved(false);
    setIsEditModalOpen(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <div className="flex-1 flex flex-col items-center justify-center">
          <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
          <p className="mt-4 text-gray-500 font-medium">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <div className="flex-1 flex flex-col items-center justify-center px-4">
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 text-center max-w-sm w-full">
            <h2 className="text-xl font-bold text-gray-900 mb-2">Could not load dashboard</h2>
            <p className="text-gray-500 mb-6">Please try again later.</p>
            <button 
              onClick={fetchDashboardData}
              className="bg-indigo-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-indigo-700 w-full transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  const avatarUrl = user?.user_metadata?.avatar_url;
  const fullName = user?.user_metadata?.full_name ?? profile?.name ?? 'User';
  const email = user?.email;
  const joinedAt = profile?.created_at ? memberSince(profile.created_at) : '';
  
  // Extract initials
  const parts = fullName.trim().split(' ').filter(Boolean);
  const initials = parts.length > 1 
    ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    : (parts[0]?.[0] || 'U').toUpperCase();

  const totalDonations = donations.reduce((sum, d) => sum + (Number(d.amount) || 0), 0);
  const totalRegistrations = eventRegistrations.length;
  const membershipStatus = membership?.status || 'none';
  const zoneName = member?.zone?.name || '—';

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <main className="flex-1 w-full max-w-4xl mx-auto px-4 py-8">
        {/* Section 1: Profile header */}
        <div className="flex items-center justify-between bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-6">
          <div className="flex items-center gap-5">
            {avatarUrl ? (
              <img src={avatarUrl} alt={fullName} className="w-14 h-14 rounded-full object-cover" />
            ) : (
              <div className="w-14 h-14 rounded-full bg-indigo-100 text-indigo-700 font-medium text-lg flex items-center justify-center">
                {initials}
              </div>
            )}
            <div>
              <h1 className="text-xl font-medium text-gray-900">{fullName}</h1>
              <p className="text-sm text-gray-500">{email}</p>
              {joinedAt && <p className="text-sm text-gray-400 mt-1">Member since {joinedAt}</p>}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={fetchDashboardData}
              disabled={loading}
              className="p-2 text-gray-500 hover:text-indigo-600 border border-gray-200 rounded-lg transition-colors bg-white hover:bg-gray-50"
              title="Refresh Dashboard"
            >
              <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button 
              onClick={openEditModal}
              className="text-sm font-medium text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-4 py-2 rounded-lg transition-colors"
            >
              Edit Profile
            </button>
          </div>
        </div>

        {/* Section 2: Stat cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Membership</p>
            <p className="text-xl font-medium text-gray-900 capitalize">
              <span className={`inline-block w-2 h-2 rounded-full mr-2 ${
                membershipStatus === 'active' ? 'bg-green-500' : 
                membershipStatus === 'pending' ? 'bg-yellow-500' : 'bg-gray-300'
              }`}></span>
              {membershipStatus}
            </p>
            <p className="text-xs text-gray-400 mt-1">{membership?.tier?.name || 'Not a member'}</p>
          </div>
          <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Donations</p>
            <p className="text-xl font-medium text-gray-900">PKR {totalDonations.toLocaleString('en-PK')}</p>
            <p className="text-xs text-gray-400 mt-1">{donations.length} contributions</p>
          </div>
          <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Events</p>
            <p className="text-xl font-medium text-gray-900">{totalRegistrations}</p>
            <p className="text-xs text-gray-400 mt-1">Registered</p>
          </div>
          <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Zone</p>
            <p className="text-xl font-medium text-gray-900 truncate">{zoneName}</p>
            <p className="text-xs text-gray-400 mt-1">{zoneName !== '—' ? 'Zone member' : 'Not assigned'}</p>
          </div>
        </div>

        {/* Section 3: Membership + Profile Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {/* Membership Card */}
          <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-medium text-gray-900">Membership</h3>
              {membershipStatus !== 'none' && (
                <span className={`text-xs px-2 py-1 rounded-md font-medium capitalize ${
                  membershipStatus === 'active' ? 'bg-green-50 text-green-700' :
                  membershipStatus === 'pending' ? 'bg-yellow-50 text-yellow-700' : 'bg-gray-100 text-gray-500'
                }`}>
                  {membershipStatus}
                </span>
              )}
            </div>

            {membership ? (
              <>
                {membership.end_date && daysUntil(membership.end_date) <= 30 && (
                  <div className="bg-yellow-50 text-yellow-800 text-sm px-3 py-2 rounded-lg mb-4">
                    Your membership expires in {daysUntil(membership.end_date)} days.
                  </div>
                )}
                <div className="space-y-3 flex-1 text-sm">
                  <div className="flex justify-between border-b border-gray-50 pb-2">
                    <span className="text-gray-500">Type</span>
                    <span className="font-medium">{membership.tier?.name || '—'}</span>
                  </div>
                  <div className="flex justify-between border-b border-gray-50 pb-2">
                    <span className="text-gray-500">Started</span>
                    <span className="font-medium">{membership.start_date ? formatDate(membership.start_date) : '—'}</span>
                  </div>
                  <div className="flex justify-between border-b border-gray-50 pb-2">
                    <span className="text-gray-500">Expires</span>
                    <span className={`font-medium ${membership.end_date && daysUntil(membership.end_date) <= 30 ? 'text-red-600' : ''}`}>
                      {membership.end_date ? formatDate(membership.end_date) : '—'}
                    </span>
                  </div>
                  <div className="flex justify-between pb-2">
                    <span className="text-gray-500">Payment ref</span>
                    <span className="font-mono text-gray-600">{membership.payment_ref || '—'}</span>
                  </div>
                </div>
                <button className="w-full mt-4 border border-indigo-200 text-indigo-700 py-2 rounded-lg text-sm font-medium hover:bg-indigo-50 transition-colors">
                  Renew membership
                </button>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center py-6 text-center">
                <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center text-gray-400 mb-3">
                  <User className="w-6 h-6" />
                </div>
                <p className="text-sm font-medium text-gray-900">You are not a member yet</p>
                <Link to="/membership/apply" className="mt-4 w-full bg-indigo-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors block text-center">
                  Apply for membership
                </Link>
              </div>
            )}
          </div>

          {/* Profile Info Card */}
          <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-medium text-gray-900">Profile info</h3>
              <User className="w-5 h-5 text-gray-400" />
            </div>
            
            <div className="space-y-4 flex-1 text-sm">
              <div className="flex justify-between border-b border-gray-50 pb-3">
                <span className="text-gray-500">Full name</span>
                <span className="font-medium">{profile?.name || fullName || '—'}</span>
              </div>
              <div className="flex justify-between border-b border-gray-50 pb-3">
                <span className="text-gray-500">Phone</span>
                <span className="font-medium">{profile?.phone || '—'}</span>
              </div>
              <div className="flex justify-between border-b border-gray-50 pb-3">
                <span className="text-gray-500">Zone</span>
                <span className="font-medium">{member?.zone?.name || 'Not assigned'}</span>
              </div>
              <div className="flex justify-between pb-3">
                <span className="text-gray-500">Role</span>
                <span className={`text-xs px-2 py-1 rounded-md font-medium capitalize ${
                  profile?.role === 'admin' ? 'bg-purple-50 text-purple-700' :
                  profile?.role === 'volunteer' ? 'bg-blue-50 text-blue-700' : 'bg-gray-100 text-gray-700'
                }`}>
                  {profile?.role || 'Member'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Section 4: Donation History */}
        <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm mb-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-medium text-gray-900">Donation history</h3>
            <Link to="/donate" className="text-sm font-medium border border-gray-200 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-colors text-gray-700">
              Donate
            </Link>
          </div>

          {donations.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-gray-500 uppercase bg-gray-50 rounded-t-lg">
                  <tr>
                    <th className="px-4 py-3 font-medium rounded-tl-lg">Date</th>
                    <th className="px-4 py-3 font-medium">Method</th>
                    <th className="px-4 py-3 font-medium">Amount</th>
                    <th className="px-4 py-3 font-medium rounded-tr-lg">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {donations.slice(0, 5).map(donation => (
                    <tr key={donation.id} className="hover:bg-gray-50/50">
                      <td className="px-4 py-3 whitespace-nowrap">{formatDate(donation.created_at)}</td>
                      <td className="px-4 py-3 text-gray-500 capitalize">{donation.payment_method || '—'}</td>
                      <td className="px-4 py-3 font-medium">PKR {Number(donation.amount).toLocaleString('en-PK')}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-1 rounded-md font-medium capitalize ${
                          donation.status === 'confirmed' ? 'bg-green-50 text-green-700' :
                          donation.status === 'rejected' ? 'bg-red-50 text-red-700' : 'bg-yellow-50 text-yellow-700'
                        }`}>
                          {donation.status || 'Completed'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {donations.length > 5 && (
                <div className="mt-4 text-center border-t border-gray-50 pt-3">
                  <button className="text-sm text-indigo-600 hover:text-indigo-800 font-medium">
                    View all {donations.length} donations
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-center bg-gray-50/50 rounded-xl">
              <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-gray-300 shadow-sm mb-3">
                <MapPin className="w-6 h-6" />
              </div>
              <p className="text-sm font-medium text-gray-900 mb-1">No donations yet.</p>
              <p className="text-xs text-gray-500 mb-4">Your contribution history will appear here.</p>
              <Link to="/donate" className="text-sm font-medium text-indigo-600 hover:text-indigo-700">
                Make your first donation
              </Link>
            </div>
          )}
        </div>

        {/* Section 5: Registered Events */}
        <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-medium text-gray-900">Registered events</h3>
            <Link to="/events" className="text-sm font-medium border border-gray-200 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-colors text-gray-700">
              Browse events
            </Link>
          </div>

          {eventRegistrations.length > 0 ? (
            <div className="space-y-3">
              {eventRegistrations.map(reg => {
                const isUpcoming = new Date(reg.event.event_date).getTime() > Date.now();
                const d = new Date(reg.event.event_date);
                return (
                  <div key={reg.id} className="flex items-center gap-4 p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                    <div className={`w-14 rounded-xl flex flex-col items-center justify-center py-2 flex-shrink-0 ${
                      isUpcoming ? 'bg-indigo-50 text-indigo-700' : 'bg-white text-gray-400 border border-gray-100 shadow-sm'
                    }`}>
                      <span className="text-lg font-bold leading-none">{d.getDate()}</span>
                      <span className="text-[10px] font-medium uppercase tracking-wider mt-1">{d.toLocaleDateString('en-US', { month: 'short' })}</span>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium text-gray-900 truncate">{reg.event.title}</h4>
                      <div className="flex items-center gap-1 mt-1 text-xs text-gray-500 truncate">
                        <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                        <span className="truncate">{reg.event.location || 'Online'}</span>
                      </div>
                    </div>

                    <div className="flex-shrink-0 pl-2">
                      <span className={`text-[10px] px-2 py-1 rounded-md font-medium uppercase tracking-wider ${
                        reg.status === 'registered' ? 'bg-green-100 text-green-700' :
                        reg.status === 'cancelled' ? 'bg-red-50 text-red-700' : 'bg-gray-200 text-gray-600'
                      }`}>
                        {reg.status}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-center bg-gray-50/50 rounded-xl">
              <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-gray-300 shadow-sm mb-3">
                <Calendar className="w-6 h-6" />
              </div>
              <p className="text-sm font-medium text-gray-900 mb-1">No events registered yet.</p>
              <Link to="/events" className="mt-3 text-sm font-medium text-indigo-600 hover:text-indigo-700">
                Browse upcoming events
              </Link>
            </div>
          )}
        </div>
      </main>

      {/* Section 6: Edit Profile Modal */}
      <AnimatePresence>
        {isEditModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => !isSaving && !isSaved && setIsEditModalOpen(false)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="relative w-full max-w-md mx-auto bg-white rounded-2xl shadow-2xl flex flex-col p-6"
            >
              <button
                onClick={() => !isSaving && !isSaved && setIsEditModalOpen(false)}
                className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex flex-col items-center mb-6">
                {avatarUrl ? (
                  <img src={avatarUrl} alt={fullName} className="w-16 h-16 rounded-full object-cover mb-3 shadow-sm border border-gray-100" />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-indigo-100 text-indigo-700 font-medium text-xl flex items-center justify-center mb-3 shadow-sm">
                    {initials}
                  </div>
                )}
                <h2 className="text-xl font-semibold text-gray-900 w-full text-left">Edit Profile</h2>
                <p className="text-sm text-gray-500 w-full text-left mt-1">Current name: {fullName}</p>
              </div>

              <form onSubmit={handleEditSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input 
                      type="text" 
                      className={`pl-10 pr-4 py-3 border rounded-xl w-full text-sm focus:outline-none focus:ring-2 transition ${
                        nameError 
                          ? 'border-red-400 focus:ring-red-400 focus:border-transparent' 
                          : 'border-gray-200 focus:ring-indigo-500 focus:border-transparent'
                      }`}
                      value={editName}
                      onChange={(e) => { setEditName(e.target.value); setNameError(''); }}
                      disabled={isSaving || isSaved}
                    />
                  </div>
                  {nameError && <p className="text-xs text-red-500 mt-1">{nameError}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                  <div className="relative">
                    <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input 
                      type="tel" 
                      className={`pl-10 pr-4 py-3 border rounded-xl w-full text-sm focus:outline-none focus:ring-2 transition ${
                        phoneError 
                          ? 'border-red-400 focus:ring-red-400 focus:border-transparent' 
                          : 'border-gray-200 focus:ring-indigo-500 focus:border-transparent'
                      }`}
                      value={editPhone}
                      onChange={(e) => { setEditPhone(e.target.value); setPhoneError(''); }}
                      disabled={isSaving || isSaved}
                      placeholder="+92 XXX XXXXXXX"
                    />
                  </div>
                  {phoneError && <p className="text-xs text-red-500 mt-1">{phoneError}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email address</label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input 
                      type="email" 
                      className="pl-10 pr-4 py-3 border border-gray-200 rounded-xl w-full text-sm bg-gray-50 text-gray-400 cursor-not-allowed outline-none"
                      value={email || ''}
                      disabled
                      readOnly
                    />
                  </div>
                  <p className="text-xs text-gray-400 mt-1">Email is linked to your Google account and cannot be changed.</p>
                </div>

                <div className="pt-4 flex justify-end gap-3">
                  <button 
                    type="button" 
                    onClick={() => setIsEditModalOpen(false)}
                    disabled={isSaving || isSaved}
                    className="text-gray-600 hover:text-gray-800 font-medium px-5 py-2.5 rounded-xl hover:bg-gray-100 transition disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    disabled={isSaving || isSaved}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-6 py-2.5 rounded-xl transition disabled:opacity-70 flex items-center gap-2 min-w-[140px] justify-center"
                  >
                    {isSaved ? (
                      <>
                        <Check className="w-4 h-4" />
                        Saved!
                      </>
                    ) : isSaving ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        Saving...
                      </>
                    ) : (
                      'Save Changes'
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

