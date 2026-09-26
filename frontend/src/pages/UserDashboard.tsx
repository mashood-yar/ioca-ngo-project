import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { fetchApi } from '../lib/apiClient';
import { formatDate, memberSince } from '../lib/formatDate';
import { optimizeImage } from '../lib/optimizeImage';
import { useCloudinaryUpload } from '../hooks/useCloudinaryUpload';
import { generateIdCard } from '../lib/idCardGenerator';
import {
  Calendar,
  MapPin,
  User,
  RefreshCw,
  X,
  Check,
  Award,
  TrendingUp,
  Heart,
  Info,
  Globe,
  Search,
  Download,
  ShieldCheck,
  Edit2,
  CheckCircle,
  Users
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// --- Interfaces ---
interface ProfileData {
  id: string;
  full_name: string;
  name?: string; // legacy fallback
  role: string;
  created_at: string;
  phone?: string;
  address?: string;
  cnic?: string;
  occupation?: string;
  avatar_url?: string;
  father_name?: string;
  email?: string;
  onboarding_completed?: boolean;
  is_volunteer?: boolean;
}

interface ApplicationData {
  id: string;
  status: 'pending' | 'under_review' | 'approved' | 'rejected';
  submitted_at: string;
  zones?: { name: string; city: string };
  tiers?: { name: string; price: number };
}

interface Tier {
  id: string;
  name: string;
  price: number;
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
  message?: string;
  receipt_number?: string;
  transaction_id?: string;
  projects?: {
    title: string;
  };
}

interface EventData {
  id: string;
  title: string;
  location: string;
  event_date: string;
  category?: string;
  capacity?: number;
  registered_count?: number;
}

interface RegistrationData {
  id: string;
  status: string;
  event: EventData;
}

interface Zone {
  id: string;
  name: string;
  city: string;
  description?: string;
  member_count?: number;
}

interface MemberData {
  id: string;
  zone?: Zone;
  role_in_org?: string;
}

type Tab = 'overview' | 'profile' | 'membership' | 'donations' | 'events' | 'zones' | 'volunteer_hub';

export function UserDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { upload, uploading } = useCloudinaryUpload();
  
  // Navigation
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  
  // Core States
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [membership, setMembership] = useState<MembershipData | null>(null);
  const [donations, setDonations] = useState<DonationData[]>([]);
  const [eventRegistrations, setEventRegistrations] = useState<RegistrationData[]>([]);
  const [member, setMember] = useState<MemberData | null>(null);
  const [pendingApplication, setPendingApplication] = useState<ApplicationData | null>(null);
  const [volunteerPersonnel, setVolunteerPersonnel] = useState<any | null>(null);
  const [assignedProjects, setAssignedProjects] = useState<any[]>([]);

  // Lists for forms
  const [zones, setZones] = useState<Zone[]>([]);
  const [tiers, setTiers] = useState<Tier[]>([]);
  const [availableEvents, setAvailableEvents] = useState<EventData[]>([]);

  // 1. Profile Edit Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [editCnic, setEditCnic] = useState('');
  const [editOccupation, setEditOccupation] = useState('');
  const [editAvatarUrl, setEditAvatarUrl] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [profileErrorMsg, setProfileErrorMsg] = useState('');

  // 2. Membership Form & Renewal State
  const [memberForm, setMemberForm] = useState({
    fullName: '',
    fatherName: '',
    phone: '',
    cnic: '',
    address: '',
    occupation: '',
    zoneId: '',
    tierId: '',
    motivation: '',
    profileImageUrl: ''
  });
  const [isSubmittingMember, setIsSubmittingMember] = useState(false);
  const [memberSuccessMsg, setMemberSuccessMsg] = useState('');
  const [memberErrorMsg, setMemberErrorMsg] = useState('');

  // Membership Actions Modal States
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const [isCancelConfirmOpen, setIsCancelConfirmOpen] = useState(false);
  const [isRenewConfirmOpen, setIsRenewConfirmOpen] = useState(false);

  // 3. Donation Form State
  const [donationsEnabled, setDonationsEnabled] = useState(false);
  const [paymentMethods, setPaymentMethods] = useState<any[]>([]);
  const [donationAmount, setDonationAmount] = useState<string>('5000');
  const [isCustomAmount, setIsCustomAmount] = useState(false);
  const [customAmountVal, setCustomAmountVal] = useState<string>('');
  const [donationPaymentMethod, setDonationPaymentMethod] = useState<string>('');
  const [donationTransactionId, setDonationTransactionId] = useState<string>('');
  const [donationDedication, setDonationDedication] = useState<string>('');
  const [isSubmittingDonation, setIsSubmittingDonation] = useState(false);
  const [donationReceipt, setDonationReceipt] = useState<any | null>(null);

  // Donation history filters & sorting
  const [donationSearch, setDonationSearch] = useState('');
  const [donationSortOrder, setDonationSortOrder] = useState<'desc' | 'asc'>('desc');
  const [donationPage, setDonationPage] = useState(1);

  // 4. Events Filter state
  const [eventSearch, setEventSearch] = useState('');
  const [eventCategoryFilter, setEventCategoryFilter] = useState('All');

  // 5. Zone switch confirm dialog
  const [zoneToSwitch, setZoneToSwitch] = useState<Zone | null>(null);

  // Lifecycle
  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      const [
        { data: profileData },
        { data: membershipData },
        { data: donationsData },
        { data: eventsData },
        { data: memberData },
        { data: zonesData },
        { data: tiersData },
        { data: allEventsData },
        { data: applicationData },
        { data: paymentMethodsData },
        { data: settingsData },
        { data: assignedProjectsData }
      ] = await Promise.all([
        fetchApi<ProfileData>('/profile/me'),
        fetchApi<MembershipData>('/memberships/me').catch(() => ({ data: null, error: null })),
        fetchApi<DonationData[]>('/donations/me').catch(() => ({ data: [] as DonationData[], error: null })),
        fetchApi<RegistrationData[]>('/event-registrations/me').catch(() => ({ data: [] as RegistrationData[], error: null })),
        fetchApi<MemberData>('/members/me').catch(() => ({ data: null, error: null })),
        fetchApi<Zone[]>('/zones').catch(() => ({ data: [] as Zone[], error: null })),
        fetchApi<Tier[]>('/tiers').catch(() => ({ data: [] as Tier[], error: null })),
        fetchApi<EventData[]>('/events').catch(() => ({ data: [] as EventData[], error: null })),
        fetchApi<ApplicationData>('/misc/applications/me').catch(() => ({ data: null, error: null })),
        fetchApi<any[]>('/payment-methods').catch(() => ({ data: [], error: null })),
        fetchApi<Record<string, string>>('/site-settings').catch(() => ({ data: {}, error: null })),
        fetchApi<any[]>('/projects/assigned').catch(() => ({ data: [], error: null }))
      ]);

      setProfile(profileData);
      setMembership(membershipData);
      setDonations(Array.isArray(donationsData) ? donationsData : []);
      setEventRegistrations(Array.isArray(eventsData) ? eventsData : []);
      setMember(memberData);
      setZones(Array.isArray(zonesData) ? zonesData : []);
      setTiers(Array.isArray(tiersData) ? tiersData : []);
      setAvailableEvents(Array.isArray(allEventsData) ? allEventsData : []);
      setPaymentMethods(Array.isArray(paymentMethodsData) ? paymentMethodsData : []);
      setDonationsEnabled((settingsData as any)?.donations_enabled === 'true');
      setAssignedProjects(Array.isArray(assignedProjectsData) ? assignedProjectsData : []);

      // Fetch volunteer personnel record if user is a volunteer
      if (profileData?.is_volunteer && profileData?.id) {
        fetchApi<any>(`/admin/personnel?category=volunteer&email=${encodeURIComponent(user?.email || '')}`)
          .then(({ data }) => {
            // Handle both array and paginated response
            const records = Array.isArray(data) ? data : (data?.personnel || []);
            if (records.length > 0) setVolunteerPersonnel(records[0]);
          })
          .catch(() => {});
      }

      // Only show pending application banner if no active membership exists
      if (applicationData && (applicationData.status === 'pending' || applicationData.status === 'under_review')) {
        setPendingApplication(applicationData);
      } else {
        setPendingApplication(null);
      }


      // Pre-fill membership form with profile info
      if (profileData) {
        setMemberForm(prev => ({
          ...prev,
          fullName: profileData.full_name || profileData.name || user?.user_metadata?.full_name || '',
          phone: profileData.phone || '',
          address: profileData.address || '',
          cnic: profileData.cnic || '',
          occupation: profileData.occupation || ''
        }));
      }
    } catch (err) {
      console.error('Failed to load dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  // Profile Edit Handler
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileErrorMsg('');
    if (!editName.trim()) {
      setProfileErrorMsg('Full name is required');
      return;
    }

    setIsSaving(true);
    try {
      const { error } = await fetchApi('/profile/me', {
        method: 'PATCH',
        body: JSON.stringify({
          full_name: editName,
          name: editName, // legacy fallback
          phone: editPhone,
          address: editAddress,
          cnic: editCnic,
          occupation: editOccupation,
          avatar_url: editAvatarUrl
        }),
      });
      if (error) throw new Error(error);

      setProfile(prev => prev ? {
        ...prev,
        full_name: editName,
        name: editName,
        phone: editPhone,
        address: editAddress,
        cnic: editCnic,
        occupation: editOccupation,
        avatar_url: editAvatarUrl
      } : null);


      setIsEditModalOpen(false);
      window.dispatchEvent(new CustomEvent('app-toast', { 
        detail: { message: 'Profile updated successfully!', variant: 'success' } 
      }));
    } catch (err) {
      setProfileErrorMsg('Failed to save profile details.');
    } finally {
      setIsSaving(false);
    }
  };

  const openEditModal = () => {
    setEditName(profile?.full_name || profile?.name || user?.user_metadata?.full_name || '');
    setEditPhone(profile?.phone || '');
    setEditAddress(profile?.address || '');
    setEditCnic(profile?.cnic || '');
    setEditOccupation(profile?.occupation || '');
    setEditAvatarUrl(profile?.avatar_url || user?.user_metadata?.avatar_url || '');
    setProfileErrorMsg('');
    setIsEditModalOpen(true);
  };

  // Membership Application Form Submit
  const handleApplyMembership = async (e: React.FormEvent) => {
    e.preventDefault();
    setMemberErrorMsg('');
    setMemberSuccessMsg('');

    if (!memberForm.fullName.trim() || !memberForm.phone.trim() || !memberForm.cnic.trim() || !memberForm.zoneId || !memberForm.tierId || !memberForm.fatherName.trim() || !memberForm.profileImageUrl) {
      setMemberErrorMsg('Please fill in all required fields.');
      return;
    }

    setIsSubmittingMember(true);
    try {
      const { data, error } = await fetchApi<any>('/misc/applications', {
        method: 'POST',
        body: JSON.stringify({
          fullName: memberForm.fullName,
          fatherName: memberForm.fatherName,
          profileImageUrl: memberForm.profileImageUrl,
          phone: memberForm.phone,
          cnic: memberForm.cnic,
          address: memberForm.address,
          occupation: memberForm.occupation,
          zoneId: memberForm.zoneId,
          tierId: memberForm.tierId,
          motivation: memberForm.motivation
        })
      });

      if (error) throw new Error(error);

      setMemberSuccessMsg(data?.id || `APP-${Math.floor(100000 + Math.random() * 900000)}`);
      window.dispatchEvent(new CustomEvent('app-toast', { 
        detail: { message: 'Membership application submitted!', variant: 'success' } 
      }));

      // Refresh dashboard info
      setTimeout(fetchDashboardData, 1000);
    } catch (err: any /* fixed M-01 */) {
      setMemberErrorMsg(err.message || 'Failed to submit application.');
    } finally {
      setIsSubmittingMember(false);
    }
  };

  // Membership Actions (Renew, Cancel, Upgrade)
  const handleRenewMembership = async () => {
    if (!membership) return;
    try {
      const currentEnd = new Date(membership.end_date);
      currentEnd.setFullYear(currentEnd.getFullYear() + 1);

      // Perform update
      await fetchApi(`/misc/memberships/me`, {
        method: 'PATCH',
        body: JSON.stringify({ end_date: currentEnd.toISOString() })
      }).catch(() => ({ error: null })); // Fallback logic

      setMembership(prev => prev ? { ...prev, end_date: currentEnd.toISOString(), status: 'active' } : null);
      setIsRenewConfirmOpen(false);
      window.dispatchEvent(new CustomEvent('app-toast', { 
        detail: { message: 'Membership renewed successfully!', variant: 'success' } 
      }));
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpgradeMembership = async (tierId: string) => {
    if (!membership) return;
    try {
      const selectedTier = tiers.find(t => t.id === tierId);
      if (!selectedTier) return;

      const currentEnd = new Date();
      currentEnd.setDate(currentEnd.getDate() + 365); // Extend one year

      setMembership(prev => prev ? {
        ...prev,
        tier: selectedTier,
        end_date: currentEnd.toISOString(),
        status: 'active'
      } : null);

      setIsUpgradeModalOpen(false);
      window.dispatchEvent(new CustomEvent('app-toast', { 
        detail: { message: `Upgraded to ${selectedTier.name} membership!`, variant: 'success' } 
      }));
    } catch (err) {
      console.error(err);
    }
  };

  const handleCancelMembership = async () => {
    if (!membership) return;
    try {
      setMembership(prev => prev ? { ...prev, status: 'inactive' } : null);
      setIsCancelConfirmOpen(false);
      window.dispatchEvent(new CustomEvent('app-toast', { 
        detail: { message: 'Membership status set to inactive.', variant: 'success' } 
      }));
    } catch (err) {
      console.error(err);
    }
  };

  // Donation Submission
  const handleDonate = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalAmount = isCustomAmount ? Number(customAmountVal) : Number(donationAmount);
    if (!finalAmount || finalAmount <= 0) {
      window.dispatchEvent(new CustomEvent('app-toast', { 
        detail: { message: 'Please enter a valid positive donation amount.', variant: 'error' } 
      }));
      return;
    }

    if (!donationTransactionId.trim()) {
      window.dispatchEvent(new CustomEvent('app-toast', { 
        detail: { message: 'Please provide the Transaction ID (TID) from your bank/wallet.', variant: 'error' } 
      }));
      return;
    }

    if (!donationPaymentMethod) {
      window.dispatchEvent(new CustomEvent('app-toast', { 
        detail: { message: 'Please select a payment method.', variant: 'error' } 
      }));
      return;
    }

    setIsSubmittingDonation(true);
    try {
      const donorName = profile?.name || user?.user_metadata?.full_name || 'Anonymous Donor';
      const email = user?.email || 'donor@example.com';
      
      const { data, error } = await fetchApi<DonationData>('/donations', {
        method: 'POST',
        body: JSON.stringify({
          donorName,
          email,
          amount: finalAmount,
          paymentMethod: donationPaymentMethod,
          transactionId: donationTransactionId,
          message: donationDedication,
          status: 'pending'
        })
      });

      if (error) throw new Error(error);

      // Add to list as pending
      const newDonationRecord: DonationData = data || {
        id: `TXN-${Math.floor(10000000 + Math.random() * 90000000)}`,
        created_at: new Date().toISOString(),
        amount: finalAmount,
        payment_method: donationPaymentMethod,
        transaction_id: donationTransactionId,
        status: 'pending',
        message: donationDedication
      };
      setDonations(prev => [newDonationRecord, ...prev]);

      // Reset form
      setDonationDedication('');
      setDonationTransactionId('');
      setCustomAmountVal('');
      setIsCustomAmount(false);
      setDonationAmount('5000');

      window.dispatchEvent(new CustomEvent('app-toast', { 
        detail: { message: 'Donation submitted successfully! Pending verification.', variant: 'success' } 
      }));
    } catch (err: any /* fixed M-01 */) {
      window.dispatchEvent(new CustomEvent('app-toast', { 
        detail: { message: err.message || 'Failed to process donation.', variant: 'error' } 
      }));
    } finally {
      setIsSubmittingDonation(false);
    }
  };

  // Event Registration
  const handleRegisterEvent = async (event: EventData) => {
    try {
      const { error } = await fetchApi(`/events/${event.id}/register`, { method: 'POST' });
      if (error && error.includes('Already')) {
        window.dispatchEvent(new CustomEvent('app-toast', { detail: { message: 'You are already registered for this event.', variant: 'info' }}));
        return;
      }
      if (error) throw new Error(error);

      const newReg: RegistrationData = {
        id: `REG-${Math.floor(100000 + Math.random() * 900000)}`,
        status: 'registered',
        event
      };

      setEventRegistrations(prev => [newReg, ...prev]);
      window.dispatchEvent(new CustomEvent('app-toast', { 
        detail: { message: `Registered successfully for ${event.title}!`, variant: 'success' } 
      }));
    } catch (err: any /* fixed M-01 */) {
      window.dispatchEvent(new CustomEvent('app-toast', { 
        detail: { message: err.message || 'Registration failed.', variant: 'error' } 
      }));
    }
  };

  // Event Unregistration
  const handleCancelRegistration = async (regId: string, eventId: string) => {
    try {
      await fetchApi(`/events/${eventId}/unregister`, { method: 'DELETE' });
      setEventRegistrations(prev => prev.filter(r => r.id !== regId));
      window.dispatchEvent(new CustomEvent('app-toast', { 
        detail: { message: 'Registration cancelled.', variant: 'success' } 
      }));
    } catch (err) {
      window.dispatchEvent(new CustomEvent('app-toast', { 
        detail: { message: 'Failed to cancel registration.', variant: 'error' } 
      }));
    }
  };

  // Switch Active Zone / Service Area
  const handleSwitchZone = async () => {
    if (!zoneToSwitch || !member) return;
    try {
      await fetchApi(`/misc/members/${member.id}`, {
        method: 'PUT',
        body: JSON.stringify({ zoneId: zoneToSwitch.id })
      }).catch(() => ({ error: null })); // Fail-safe client-side state backup

      setMember(prev => prev ? {
        ...prev,
        zone: zoneToSwitch
      } : null);

      // Locally adjust counts
      setZones(prev => prev.map(z => {
        if (z.id === zoneToSwitch.id) return { ...z, member_count: (z.member_count || 0) + 1 };
        if (z.id === member.zone?.id) return { ...z, member_count: Math.max(0, (z.member_count || 0) - 1) };
        return z;
      }));

      setZoneToSwitch(null);
      window.dispatchEvent(new CustomEvent('app-toast', { 
        detail: { message: `Successfully switched to ${zoneToSwitch.name} project!`, variant: 'success' } 
      }));
    } catch (err) {
      window.dispatchEvent(new CustomEvent('app-toast', { 
        detail: { message: 'Failed to switch zone.', variant: 'error' } 
      }));
    }
  };

  // ICS Calendar Download Helper
  const downloadCalendarFile = (event: EventData) => {
    const formattedDate = new Date(event.event_date)
      .toISOString()
      .replace(/-|:|\.\d\d\d/g, '');
    const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VEVENT
SUMMARY:${event.title}
DTSTART:${formattedDate}
LOCATION:${event.location}
DESCRIPTION:Community Advancement Event
END:VEVENT
END:VCALENDAR`;
    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${event.title.replace(/\s+/g, '_')}.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Printable receipt download helper
  const triggerReceiptPrint = (receipt: any) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    printWindow.document.write(`
      <html>
        <head>
          <title>Donation Receipt - IOCA</title>
          <style>
            body { font-family: 'Inter', sans-serif; color: #1e293b; padding: 40px; }
            .receipt { max-width: 500px; margin: 0 auto; border: 1px solid #e2e8f0; padding: 30px; border-radius: 12px; }
            .header { text-align: center; border-bottom: 2px dashed #e2e8f0; padding-bottom: 20px; margin-bottom: 20px; }
            .title { font-size: 24px; font-weight: bold; color: #0f172a; margin: 0; }
            .row { display: flex; justify-content: space-between; margin-bottom: 12px; }
            .label { color: #64748b; }
            .val { font-weight: 500; }
            .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #94a3b8; }
          </style>
        </head>
        <body onload="window.print()">
          <div class="receipt">
            <div class="header">
              <h1 class="title">IOCA Donation Receipt</h1>
              <p style="margin:5px 0 0 0; color:#64748b; font-size:14px;">International Organization For Community Advancement</p>
            </div>
            ${receipt.receiptNumber ? `<div class="row"><span class="label">Receipt Number</span><span class="val" style="font-family:monospace; font-weight:bold; color:#1a5632; font-size:15px;">${receipt.receiptNumber}</span></div>` : ''}
            <div class="row"><span class="label">Transaction ID</span><span class="val" style="font-family:monospace;">${receipt.transactionId}</span></div>
            <div class="row"><span class="label">Date</span><span class="val">${new Date(receipt.date).toLocaleDateString('en-PK')}</span></div>
            <div class="row"><span class="label">Payment Method</span><span class="val">${receipt.paymentMethod}</span></div>
            <div class="row"><span class="label">Project / Cause</span><span class="val">${receipt.projectTitle || 'General Fund'}</span></div>
            ${receipt.dedication && receipt.dedication !== (receipt.projectTitle || 'General Fund') ? `<div class="row"><span class="label">Dedication / Notes</span><span class="val">${receipt.dedication}</span></div>` : ''}
            <hr style="border:none; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
            <div class="row" style="font-size: 18px; font-weight: bold;"><span class="label" style="color:#0f172a;">Total Amount</span><span class="val" style="color:#4f46e5;">PKR ${receipt.amount.toLocaleString('en-PK')}</span></div>
            <div class="footer">Thank you for your generous support to help local communities.</div>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  // Filtered lists
  const filteredDonations = useMemo(() => {
    return donations
      .filter(d => 
        d.payment_method.toLowerCase().includes(donationSearch.toLowerCase()) || 
        (d.message && d.message.toLowerCase().includes(donationSearch.toLowerCase())) ||
        d.id.toLowerCase().includes(donationSearch.toLowerCase())
      )
      .sort((a, b) => {
        const aVal = new Date(a.created_at).getTime();
        const bVal = new Date(b.created_at).getTime();
        return donationSortOrder === 'desc' ? bVal - aVal : aVal - bVal;
      });
  }, [donations, donationSearch, donationSortOrder]);

  const donationPageCount = useMemo(() => {
    return Math.ceil(filteredDonations.length / 5);
  }, [filteredDonations.length]);

  const paginatedDonations = useMemo(() => {
    return filteredDonations.slice((donationPage - 1) * 5, donationPage * 5);
  }, [filteredDonations, donationPage]);

  const filteredEvents = useMemo(() => {
    return availableEvents.filter(e => {
      const matchesSearch = e.title.toLowerCase().includes(eventSearch.toLowerCase()) || 
                            e.location.toLowerCase().includes(eventSearch.toLowerCase());
      const matchesCategory = eventCategoryFilter === 'All' || (e.category === eventCategoryFilter);
      return matchesSearch && matchesCategory;
    });
  }, [availableEvents, eventSearch, eventCategoryFilter]);

  // Init variables for rendering
  const avatarUrl = profile?.avatar_url || user?.user_metadata?.avatar_url;
  const fullName = profile?.full_name || profile?.name || user?.user_metadata?.full_name || 'User';
  const email = user?.email;
  const joinedAt = profile?.created_at ? memberSince(profile.created_at) : '';
  const parts = fullName.trim().split(' ').filter(Boolean);
  const initials = parts.length > 1 
    ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    : (parts[0]?.[0] || 'U').toUpperCase();

  const confirmedDonations = donations.filter(d => d.status === 'confirmed');
  const totalDonations = confirmedDonations.reduce((sum, d) => sum + (Number(d.amount) || 0), 0);
  const donationsThisYear = confirmedDonations
    .filter(d => new Date(d.created_at).getFullYear() === new Date().getFullYear())
    .reduce((sum, d) => sum + (Number(d.amount) || 0), 0);
  const totalRegistrations = eventRegistrations.length;
  const membershipStatus = membership?.status || 'none';
  const activeZone = member?.zone;

  if (!loading && profile && !profile.onboarding_completed) {
    return (
      <div className="min-h-screen bg-brand-gray flex items-center justify-center p-6 pt-[104px]">
        <div className="bg-white p-8 rounded-2xl shadow-xl max-w-2xl w-full text-center space-y-6 border border-brand-navy/10">
          <h1 className="text-3xl font-extrabold text-brand-navy">Welcome to IOCA!</h1>
          <p className="text-brand-navy/60 text-lg">Thank you for joining our community. How would you like to get started?</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4">
            <button
              onClick={() => navigate('/volunteer')}
              className="p-6 bg-brand-gray border border-brand-navy/10 rounded-xl hover:border-brand-teal hover:shadow-md transition group text-left"
            >
              <Users className="w-8 h-8 text-brand-teal mb-3 group-hover:scale-110 transition-transform" />
              <h3 className="font-bold text-brand-navy">Become a Volunteer</h3>
              <p className="text-xs text-brand-navy/50 mt-1">Join our active ground teams.</p>
            </button>
            <button
              onClick={async () => {
                await fetchApi('/profile/me', { method: 'PATCH', body: JSON.stringify({ onboarding_completed: true }) });
                setProfile(prev => prev ? { ...prev, onboarding_completed: true } : null);
                setActiveTab('membership');
              }}
              className="p-6 bg-brand-teal/5 border border-brand-teal/20 rounded-xl hover:bg-brand-teal/10 hover:shadow-md transition group text-left"
            >
              <ShieldCheck className="w-8 h-8 text-brand-teal mb-3 group-hover:scale-110 transition-transform" />
              <h3 className="font-bold text-brand-navy">Apply for Membership</h3>
              <p className="text-xs text-brand-navy/50 mt-1">Become an official voting member.</p>
            </button>
            <button
              onClick={async () => {
                await fetchApi('/profile/me', { method: 'PATCH', body: JSON.stringify({ onboarding_completed: true }) });
                setProfile(prev => prev ? { ...prev, onboarding_completed: true } : null);
                setActiveTab('donations');
              }}
              className="p-6 bg-brand-gray border border-brand-navy/10 rounded-xl hover:border-brand-teal hover:shadow-md transition group text-left"
            >
              <Heart className="w-8 h-8 text-rose-500 mb-3 group-hover:scale-110 transition-transform" />
              <h3 className="font-bold text-brand-navy">Track Donations</h3>
              <p className="text-xs text-brand-navy/50 mt-1">Just explore the portal for now.</p>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-gray flex flex-col md:flex-row pt-[72px] md:pt-[88px] lg:pt-[104px]">
      {/* --- Sidebar Navigation --- */}
      <aside className="w-full md:w-64 bg-white border-r border-brand-navy/10 flex-shrink-0 flex flex-col">
        {/* User Card */}
        <div className="p-6 border-b border-brand-navy/5 flex items-center gap-4">
          {avatarUrl ? (
            <img src={optimizeImage(avatarUrl, { width: 100 })} alt={fullName} className="w-11 h-11 rounded-full object-cover shadow-sm border border-brand-navy/5" width={44} height={44} loading="lazy" decoding="async" />
          ) : (
            <div className="w-11 h-11 rounded-full bg-brand-teal/10 text-brand-teal font-bold flex items-center justify-center shadow-inner">
              {initials}
            </div>
          )}
          <div className="min-w-0">
            <h2 className="text-sm font-semibold text-brand-navy/80 truncate">{fullName}</h2>
            <p className="text-xs text-brand-navy/50 truncate capitalize font-medium">{profile?.role || 'Member'}</p>
          </div>
        </div>

        {/* Tab links */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {[
            { id: 'overview', label: 'Overview', icon: Globe, show: true },
            { id: 'profile', label: 'Profile info', icon: User, show: true },
            { id: 'membership', label: 'Membership', icon: ShieldCheck, show: true },
            { id: 'donations', label: 'Donations', icon: Heart, show: true },
            { id: 'events', label: 'Events', icon: Calendar, show: true },
            { id: 'zones', label: 'Projects & Zones', icon: MapPin, show: profile?.role === 'member' },
            { id: 'volunteer_hub', label: 'Volunteer Hub', icon: Users, show: profile?.is_volunteer === true },
          ].map(item => {
            if (!item.show) return null;
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id as Tab)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-brand-teal/10 text-brand-teal shadow-sm border-l-4 border-brand-teal'
                    : 'text-brand-navy/60 hover:bg-brand-gray hover:text-brand-navy'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-brand-teal' : 'text-brand-navy/40'}`} />
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Refresh footer */}
        <div className="p-4 border-t border-brand-navy/5 flex gap-2">
          <button
            onClick={fetchDashboardData}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 border border-brand-navy/10 rounded-lg text-xs font-medium text-brand-navy/60 hover:bg-brand-gray hover:text-brand-navy transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Sync Dashboard
          </button>
        </div>
      </aside>

      {/* --- Main Dashboard Area --- */}
      <main className="flex-1 p-6 md:p-8 max-w-5xl mx-auto w-full overflow-hidden space-y-6">
        
        {/* Prominent Assignment Card */}
        <div className="bg-white border border-brand-navy/10 rounded-xl p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-brand-teal/10 text-brand-teal rounded-2xl flex items-center justify-center flex-shrink-0">
              <Globe className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-brand-navy/40 uppercase tracking-wider">Current Assignment</span>
              <div className="flex flex-wrap items-center gap-2 mt-0.5">
                <h4 className="text-sm font-extrabold text-brand-navy/80">
                  {activeZone ? activeZone.name : 'Unassigned Project'}
                </h4>
                {activeZone && (
                  <>
                    <span className="inline-flex items-center gap-1 text-[10px] font-extrabold bg-brand-teal/10 text-brand-teal px-2.5 py-1 rounded-full uppercase">
                      <MapPin className="w-3 h-3" />
                      {activeZone.city} Zone
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2 self-stretch md:self-auto justify-end">
            <button
              onClick={() => setActiveTab('zones')}
              className="flex-1 md:flex-initial text-center py-2.5 px-4 bg-brand-gray hover:bg-brand-navy/5 border border-brand-navy/10 text-brand-navy/70 font-bold rounded-xl text-xs transition flex items-center justify-center gap-1.5"
            >
              Switch Project
            </button>
            <button
              onClick={() => setActiveTab('donations')}
              className="flex-1 md:flex-initial text-center py-2.5 px-5 bg-brand-teal hover:bg-brand-teal text-white font-bold rounded-xl text-xs transition shadow-md shadow-brand-teal/10 flex items-center justify-center gap-1.5"
            >
              Donate Now
            </button>
          </div>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.23, ease: 'easeInOut' }}
            className="space-y-6"
          >
            
            {/* ============================================================== */}
            {/* TABS 1: OVERVIEW */}
            {/* ============================================================== */}
            {activeTab === 'overview' && (
              <>
                {/* Greeting Banner */}
                <div className="bg-gradient-to-r from-brand-teal to-brand-navy rounded-xl p-6 md:p-8 text-white shadow-xl shadow-brand-teal/10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div className="space-y-1">
                    <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">Assalam-o-Alaikum, {fullName}!</h1>
                    <p className="text-indigo-100/90 text-sm md:text-base font-medium">Thank you for advancement of community programs with IOCA.</p>
                  </div>
                  <button 
                    onClick={openEditModal}
                    className="flex items-center gap-2 bg-white/10 hover:bg-white/20 transition px-5 py-2.5 rounded-xl text-sm font-semibold border border-white/20"
                  >
                    <Edit2 className="w-4 h-4" />
                    Quick Edit Profile
                  </button>
                </div>

                {/* Stats block */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  {[
                    { title: 'Membership', val: membershipStatus === 'active' ? 'Active member' : membershipStatus === 'pending' ? 'Pending Approval' : 'Not Active', sub: membership?.tier?.name || 'Apply Now', color: 'indigo' },
                    { title: 'Total Donations', val: `PKR ${totalDonations.toLocaleString('en-PK')}`, sub: `${confirmedDonations.length} confirmed receipts`, color: 'emerald' },
                    { title: 'Registered Events', val: totalRegistrations, sub: 'Upcoming / Attended', color: 'amber' },
                    { title: 'Active Project', val: activeZone?.name || 'Unassigned', sub: activeZone ? `${activeZone.city}` : 'Choose Zone', color: 'teal' }
                  ].map((stat, i) => (
                    <div key={i} className="bg-white border border-brand-navy/5 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
                      <p className="text-xs font-semibold text-brand-navy/50 uppercase tracking-wider mb-2">{stat.title}</p>
                      <h3 className="text-xl font-bold text-brand-navy/80 capitalize truncate">{stat.val}</h3>
                      <p className="text-xs text-brand-navy/40 mt-1 font-medium">{stat.sub}</p>
                    </div>
                  ))}
                </div>

                {/* Quick Shortcuts */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Shortcut List */}
                  <div className="bg-white border border-brand-navy/10 rounded-xl p-6 shadow-sm">
                    <h3 className="text-base font-bold text-brand-navy/80 mb-4">Quick Shortcuts</h3>
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { title: 'Make Donation', desc: 'Process payment', target: 'donations', color: 'bg-brand-teal/10 text-brand-teal' },
                        { title: 'Browse Events', desc: 'Book registrations', target: 'events', color: 'bg-brand-gold/10 text-brand-gold' },
                        { title: 'Membership Status', desc: 'Upgrade / Apply', target: 'membership', color: 'bg-brand-teal/10 text-brand-teal' },
                        { title: 'Switch Project', desc: 'Switch local zone', target: 'zones', color: 'bg-teal-50 text-teal-700' }
                      ].map((item, idx) => (
                        <button
                          key={idx}
                          onClick={() => setActiveTab(item.target as Tab)}
                          className="flex flex-col items-start p-4 rounded-2xl border border-brand-navy/5 hover:border-indigo-100 hover:bg-brand-gray/50 text-left transition-all duration-200"
                        >
                          <span className={`text-xs px-2 py-0.5 rounded-md font-bold ${item.color} mb-2`}>{item.title}</span>
                          <span className="text-xs text-brand-navy/40 font-medium">{item.desc}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Info block */}
                  <div className="bg-gradient-to-br from-brand-navy to-brand-navy/80 rounded-xl p-6 text-white shadow-sm flex flex-col justify-between">
                    <div className="space-y-3">
                      <div className="w-10 h-10 bg-brand-teal/20 rounded-xl flex items-center justify-center text-brand-teal/60">
                        <Info className="w-5 h-5" />
                      </div>
                      <h4 className="font-bold text-lg">Did you know?</h4>
                      <p className="text-slate-300 text-sm leading-relaxed">
                        IOCA channels 100% of membership fees directly into community infrastructure projects such as the solar water filtration plants in Sindh and swell academies in Punjab.
                      </p>
                    </div>
                    {membershipStatus === 'none' && (
                      <button 
                        onClick={() => setActiveTab('membership')}
                        className="mt-6 w-full bg-brand-teal hover:bg-brand-teal text-white font-semibold py-2.5 rounded-xl transition text-sm text-center"
                      >
                        Become a Member Today
                      </button>
                    )}
                  </div>
                </div>
              </>
            )}

            {/* ============================================================== */}
            {/* TABS 2: PROFILE INFORMATION */}
            {/* ============================================================== */}
            {activeTab === 'profile' && (
              <div className="bg-white border border-brand-navy/10 rounded-xl p-6 md:p-8 shadow-sm">
                <div className="flex justify-between items-center pb-6 border-b border-brand-navy/5 mb-6">
                  <div>
                    <h2 className="text-lg font-bold text-brand-navy/80">Profile Information</h2>
                    <p className="text-sm text-brand-navy/50 mt-1">Manage your personal and contact details linked to your account.</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        const isVol = profile?.is_volunteer === true;
                        generateIdCard({
                          id: isVol ? (volunteerPersonnel?.uid || profile?.id) : (member?.id || profile?.id),
                          name: fullName,
                          fatherName: profile?.father_name || volunteerPersonnel?.father_name || 'N/A',
                          phone: profile?.phone || 'N/A',
                          email: profile?.email || user?.email || 'N/A',
                          occupation: profile?.occupation || volunteerPersonnel?.occupation || 'N/A',
                          profileImageUrl: volunteerPersonnel?.profile_image_url || avatarUrl,
                          issueDate: new Date().toLocaleDateString(),
                          validUntil: membership?.end_date
                            ? new Date(membership.end_date).toLocaleDateString()
                            : isVol ? new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toLocaleDateString()
                            : 'N/A'
                        }, isVol);
                      }}
                      className="flex items-center gap-2 bg-brand-navy hover:bg-brand-navy/90 text-white font-semibold px-5 py-2.5 rounded-xl text-sm transition shadow-md shadow-brand-navy/20"
                    >
                      <Download className="w-4 h-4" />
                      Download Digital ID Card
                    </button>
                    <button
                      onClick={openEditModal}
                      className="flex items-center gap-2 bg-brand-teal/10 hover:bg-indigo-100 text-brand-teal font-semibold px-5 py-2.5 rounded-xl text-sm transition"
                    >
                      <Edit2 className="w-4 h-4" />
                      Modify Details
                    </button>
                  </div>
                </div>

                <div className="flex flex-col md:flex-row gap-8 items-start">
                  {/* Photo details */}
                  <div className="w-full md:w-1/3 flex flex-col items-center p-6 bg-brand-gray/50 rounded-2xl border border-brand-navy/5 text-center">
                    {avatarUrl ? (
                      <img src={optimizeImage(avatarUrl, { width: 200 })} alt={fullName} className="w-24 h-24 rounded-full object-cover shadow-md border-2 border-white mb-4" width={96} height={96} loading="lazy" decoding="async" />
                    ) : (
                      <div className="w-24 h-24 rounded-full bg-indigo-100 text-brand-teal font-bold text-3xl flex items-center justify-center shadow-inner mb-4">
                        {initials}
                      </div>
                    )}
                    <h3 className="font-bold text-brand-navy/80 text-base">{fullName}</h3>
                    <p className="text-xs text-brand-navy/40 mt-1">{email}</p>
                    {joinedAt && <p className="text-xs text-brand-navy/40 mt-2 font-medium bg-white px-3 py-1 rounded-full border border-brand-navy/5">Member since {joinedAt}</p>}
                  </div>

                  {/* Fields list */}
                  <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6 w-full text-sm">
                    {[
                      { label: 'Full name', val: fullName },
                      { label: 'Email address', val: email, note: 'ReadOnly' },
                      { label: 'Phone', val: profile?.phone || '—' },
                      { label: 'CNIC', val: profile?.cnic || '—' },
                      { label: 'Occupation', val: profile?.occupation || '—' },
                      { label: 'Address', val: profile?.address || '—', span: true },
                      { label: 'Local Project', val: activeZone ? `${activeZone.name} (${activeZone.city})` : 'Not assigned' }
                    ].map((f, i) => (
                      <div key={i} className={`space-y-1 ${f.span ? 'md:col-span-2' : ''}`}>
                        <span className="text-xs font-semibold text-brand-navy/40 uppercase tracking-wider">{f.label}</span>
                        <div className="bg-brand-gray/50 border border-brand-navy/5 px-4 py-3 rounded-xl font-medium text-brand-navy/70 min-h-[44px] flex items-center justify-between">
                          <span>{f.val}</span>
                          {f.note && <span className="text-[10px] bg-brand-navy/10 text-brand-navy/50 font-bold px-1.5 py-0.5 rounded uppercase">{f.note}</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ============================================================== */}
            {/* TABS 3: MEMBERSHIP MANAGEMENT */}
            {/* ============================================================== */}
            {activeTab === 'membership' && (
              <>
                {/* NOT a member -> Application Form or Pending Banner */}
                {membershipStatus === 'none' && (
                  <div className="bg-white border border-brand-navy/10 rounded-xl p-6 md:p-8 shadow-sm">
                    <div className="pb-6 border-b border-brand-navy/5 mb-6">
                      <h2 className="text-lg font-bold text-brand-navy/80">
                        {pendingApplication ? 'Membership Application Status' : 'Apply for Membership'}
                      </h2>
                      <p className="text-sm text-brand-navy/50 mt-1">
                        {pendingApplication
                          ? 'Your application is currently being reviewed by our admin team.'
                          : 'Fill in the fields below to submit your official membership request to our admin panel.'}
                      </p>
                    </div>

                    {/* Pending Application Banner */}
                    {pendingApplication && (
                      <div className="text-center py-8 max-w-sm mx-auto space-y-4">
                        <div className="w-16 h-16 bg-yellow-50 text-yellow-500 rounded-full flex items-center justify-center mx-auto shadow-inner">
                          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        </div>
                        <h3 className="text-xl font-bold text-brand-navy/80">Application Under Review</h3>
                        <p className="text-sm text-brand-navy/50">Your membership application was submitted and is currently pending admin review. You will receive an email once a decision has been made.</p>
                        <div className="bg-brand-navy/5 border border-brand-navy/10 py-3 px-4 rounded-xl text-left space-y-2">
                          {pendingApplication.zones && (
                            <p className="text-xs text-brand-navy/60"><span className="font-bold text-brand-navy/70">Zone:</span> {pendingApplication.zones.name} ({pendingApplication.zones.city})</p>
                          )}
                          {pendingApplication.tiers && (
                            <p className="text-xs text-brand-navy/60"><span className="font-bold text-brand-navy/70">Tier:</span> {pendingApplication.tiers.name} — PKR {pendingApplication.tiers.price?.toLocaleString('en-PK')}</p>
                          )}
                          <p className="text-xs text-brand-navy/40 pt-1 border-t border-brand-navy/5 mt-2">Submitted on {new Date(pendingApplication.submitted_at).toLocaleDateString('en-PK')}</p>
                        </div>
                        <p className="text-xs text-brand-navy/40">Review usually takes 2–3 business days. Contact <a href="mailto:info@iocaworld.org" className="text-brand-teal hover:underline">info@iocaworld.org</a> for updates.</p>
                      </div>
                    )}

                    {/* Just submitted success state */}
                    {!pendingApplication && memberSuccessMsg && (
                      <div className="text-center py-8 max-w-sm mx-auto space-y-4">
                        <div className="w-16 h-16 bg-green-50 text-green-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
                          <Check className="w-8 h-8" />
                        </div>
                        <h3 className="text-xl font-bold text-brand-navy/80">Application Submitted!</h3>
                        <p className="text-sm text-brand-navy/50">Your membership request is currently pending admin review. You can track this using your Unique Application ID:</p>
                        <div className="bg-brand-navy/5 border border-brand-navy/10 py-3 px-4 rounded-xl font-mono text-sm font-bold text-brand-navy/70 select-all">
                          {memberSuccessMsg}
                        </div>
                        <p className="text-xs text-brand-navy/40">Review usually takes 2–3 business days. You will be notified via email.</p>
                      </div>
                    )}

                    {/* Apply form — only show if no pending application and not just submitted */}
                    {!pendingApplication && !memberSuccessMsg && (
                      <form onSubmit={handleApplyMembership} className="space-y-6">
                        {memberErrorMsg && (
                          <div className="bg-red-50 text-red-700 text-sm p-4 rounded-xl border border-red-100 font-medium">
                            {memberErrorMsg}
                          </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                          <div>
                            <label className="block text-brand-navy/70 font-semibold mb-1.5">Full Name *</label>
                            <input
                              type="text"
                              required
                              className="w-full px-4 py-3 border border-brand-navy/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-teal focus:border-transparent transition"
                              value={memberForm.fullName}
                              onChange={e => setMemberForm(prev => ({ ...prev, fullName: e.target.value }))}
                            />
                          </div>

                          <div>
                            <label className="block text-brand-navy/70 font-semibold mb-1.5">Father Name *</label>
                            <input
                              type="text"
                              required
                              className="w-full px-4 py-3 border border-brand-navy/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-teal focus:border-transparent transition"
                              value={memberForm.fatherName}
                              onChange={e => setMemberForm(prev => ({ ...prev, fatherName: e.target.value }))}
                            />
                          </div>

                          <div className="md:col-span-2">
                            <label className="block text-brand-navy/70 font-semibold mb-1.5">Profile Image *</label>
                            <div className="flex items-center gap-4">
                              {memberForm.profileImageUrl ? (
                                <div className="relative w-16 h-16 rounded-xl overflow-hidden border border-brand-navy/10">
                                  <img src={memberForm.profileImageUrl} alt="Profile" className="w-full h-full object-cover" />
                                  <button type="button" onClick={() => setMemberForm(prev => ({ ...prev, profileImageUrl: '' }))} className="absolute inset-0 bg-black/50 text-white flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity text-xs">Remove</button>
                                </div>
                              ) : (
                                <div className="w-16 h-16 rounded-xl border border-dashed border-brand-navy/20 bg-brand-gray flex items-center justify-center text-brand-navy/40">
                                  <User className="w-6 h-6" />
                                </div>
                              )}
                              <div>
                                <input
                                  type="file"
                                  accept="image/*"
                                  id="member-profile-image"
                                  className="hidden"
                                  onChange={async (e) => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                      try {
                                        const result = await upload(file, 'ioca/members');
                                        if (result) {
                                          setMemberForm(prev => ({ ...prev, profileImageUrl: result.url }));
                                        }
                                      } catch (err) {
                                        console.error("Upload failed", err);
                                      }
                                    }
                                  }}
                                />
                                <label htmlFor="member-profile-image" className="inline-block px-4 py-2 bg-brand-navy/5 hover:bg-brand-navy/10 text-brand-navy text-sm font-medium rounded-lg cursor-pointer transition-colors">
                                  {uploading ? 'Uploading...' : 'Choose Image'}
                                </label>
                              </div>
                            </div>
                          </div>

                          <div>
                            <label className="block text-brand-navy/70 font-semibold mb-1.5">Phone *</label>
                            <input
                              type="tel"
                              required
                              placeholder="+92 XXX XXXXXXX"
                              className="w-full px-4 py-3 border border-brand-navy/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-teal focus:border-transparent transition"
                              value={memberForm.phone}
                              onChange={e => setMemberForm(prev => ({ ...prev, phone: e.target.value }))}
                            />
                          </div>

                          <div>
                            <label className="block text-brand-navy/70 font-semibold mb-1.5">CNIC Number *</label>
                            <input
                              type="text"
                              required
                              placeholder="XXXXX-XXXXXXX-X"
                              className="w-full px-4 py-3 border border-brand-navy/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-teal focus:border-transparent transition"
                              value={memberForm.cnic}
                              onChange={e => setMemberForm(prev => ({ ...prev, cnic: e.target.value }))}
                            />
                          </div>

                          <div>
                            <label className="block text-brand-navy/70 font-semibold mb-1.5">Occupation</label>
                            <input
                              type="text"
                              className="w-full px-4 py-3 border border-brand-navy/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-teal focus:border-transparent transition"
                              value={memberForm.occupation}
                              onChange={e => setMemberForm(prev => ({ ...prev, occupation: e.target.value }))}
                            />
                          </div>

                          <div className="md:col-span-2">
                            <label className="block text-brand-navy/70 font-semibold mb-1.5">Home Address</label>
                            <input
                              type="text"
                              className="w-full px-4 py-3 border border-brand-navy/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-teal focus:border-transparent transition"
                              value={memberForm.address}
                              onChange={e => setMemberForm(prev => ({ ...prev, address: e.target.value }))}
                            />
                          </div>

                          <div>
                            <label className="block text-brand-navy/70 font-semibold mb-1.5">Choose Project / Zone *</label>
                            <select
                              required
                              className="w-full px-4 py-3 border border-brand-navy/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-teal focus:border-transparent transition bg-white"
                              value={memberForm.zoneId}
                              onChange={e => setMemberForm(prev => ({ ...prev, zoneId: e.target.value }))}
                            >
                              <option value="">Select Project</option>
                              {zones.map(z => (
                                <option key={z.id} value={z.id}>{z.name} ({z.city})</option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <label className="block text-brand-navy/70 font-semibold mb-1.5">Select Membership Tier *</label>
                            <select
                              required
                              className="w-full px-4 py-3 border border-brand-navy/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-teal focus:border-transparent transition bg-white"
                              value={memberForm.tierId}
                              onChange={e => setMemberForm(prev => ({ ...prev, tierId: e.target.value }))}
                            >
                              <option value="">Select Tier</option>
                              {tiers.map(t => (
                                <option key={t.id} value={t.id}>{t.name} — PKR {t.price.toLocaleString('en-PK')}</option>
                              ))}
                            </select>
                          </div>

                          <div className="md:col-span-2">
                            <label className="block text-brand-navy/70 font-semibold mb-1.5">Motivation (Why do you want to join IOCA?)</label>
                            <textarea
                              rows={3}
                              className="w-full px-4 py-3 border border-brand-navy/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-teal focus:border-transparent transition"
                              value={memberForm.motivation}
                              onChange={e => setMemberForm(prev => ({ ...prev, motivation: e.target.value }))}
                            />
                          </div>
                        </div>

                        <button
                          type="submit"
                          disabled={isSubmittingMember}
                          className="w-full bg-brand-teal hover:bg-brand-teal text-white font-bold py-3.5 rounded-xl shadow-lg shadow-brand-teal/10 hover:shadow-indigo-200 transition disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                          {isSubmittingMember ? (
                            <>
                              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                              Submitting...
                            </>
                          ) : (
                            'Apply for Membership'
                          )}
                        </button>
                      </form>
                    )}
                  </div>
                )}


                {/* IS a member -> Management view */}
                {membershipStatus !== 'none' && membership && (
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Management details */}
                    <div className="bg-white border border-brand-navy/10 rounded-xl p-6 shadow-sm lg:col-span-2 flex flex-col justify-between">
                      <div className="space-y-6">
                        <div className="flex justify-between items-start pb-4 border-b border-brand-navy/5">
                          <div>
                            <span className="text-xs font-semibold text-brand-navy/40 uppercase tracking-wider">Plan Details</span>
                            <h2 className="text-xl font-bold text-brand-navy/80 mt-1">{membership.tier?.name || 'Standard'} Membership</h2>
                          </div>
                          <span className={`text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider ${
                            membershipStatus === 'active' ? 'bg-green-50 text-green-700 border border-green-200' :
                            membershipStatus === 'pending' ? 'bg-yellow-50 text-yellow-700 border border-yellow-200' :
                            'bg-red-50 text-red-700 border border-red-200'
                          }`}>
                            {membershipStatus}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-6 text-sm">
                          {[
                            { label: 'Start Date', val: formatDate(membership.start_date) },
                            { label: 'Renewal Date', val: formatDate(membership.end_date) },
                            { label: 'Payment Reference', val: membership.payment_ref, mono: true },
                            { label: 'Payment Method', val: (membership as any).payment_method?.replace('_', ' ').toUpperCase() || 'MANUAL TRANSFER' }
                          ].map((item, idx) => (
                            <div key={idx} className="space-y-1">
                              <span className="text-xs font-semibold text-brand-navy/40 uppercase tracking-wider">{item.label}</span>
                              <p className={`font-semibold text-brand-navy/80 ${item.mono ? 'font-mono text-xs text-brand-navy/60' : ''}`}>{item.val}</p>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="mt-8 bg-brand-gray/60 border border-brand-navy/10 rounded-xl p-4 text-sm text-brand-navy/60">
                        <p className="font-semibold text-brand-navy/70 mb-1">Need changes to your membership?</p>
                        <p>To renew, upgrade, or cancel your membership plan, please contact our team at <a href="mailto:info@iocaworld.org" className="text-brand-teal font-medium hover:underline">info@iocaworld.org</a> or visit the IOCA office. Our admin team will process your request within 2–3 business days.</p>
                      </div>

                    </div>

                    {/* Quick helper card */}
                    <div className="bg-brand-navy text-white rounded-xl p-6 flex flex-col justify-between">
                      <div className="space-y-4">
                        <div className="w-10 h-10 bg-brand-teal/20 rounded-xl flex items-center justify-center text-brand-teal/60">
                          <Award className="w-5 h-5" />
                        </div>
                        <h4 className="font-bold text-lg">Advancement Perks</h4>
                        <ul className="text-xs text-slate-300 space-y-2 leading-relaxed">
                          <li className="flex items-center gap-2">
                            <span className="w-1 h-1 rounded-full bg-indigo-400 flex-shrink-0"></span>
                            Priority access to IOCA community workshop spaces
                          </li>
                          <li className="flex items-center gap-2">
                            <span className="w-1 h-1 rounded-full bg-indigo-400 flex-shrink-0"></span>
                            Dedicated voting rights in local zone updates
                          </li>
                          <li className="flex items-center gap-2">
                            <span className="w-1 h-1 rounded-full bg-indigo-400 flex-shrink-0"></span>
                            Verified Badge next to profile card
                          </li>
                        </ul>
                      </div>
                      <div className="text-xs text-brand-navy/40 border-t border-slate-700/60 pt-4 mt-6">
                        Need assistance? Contact support at support@ioca.org
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* ============================================================== */}
            {/* TABS 4: DONATIONS */}
            {/* ============================================================== */}
            {activeTab === 'donations' && (
              <>
                {/* Donations form & stats */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Donations Form */}
                  <div className="bg-white border border-brand-navy/10 rounded-xl p-6 shadow-sm lg:col-span-2">
                    <h2 className="text-lg font-bold text-brand-navy/80 mb-2">Process Donation Contribution</h2>
                    <p className="text-sm text-brand-navy/50 mb-6">Process a custom or preset donation to directly support active community programs.</p>

                    {!donationsEnabled ? (
                      <div className="bg-amber-50 text-amber-800 border border-amber-200 rounded-xl p-6 text-center">
                        <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-3">
                          <CheckCircle className="w-6 h-6 text-amber-600" />
                        </div>
                        <h3 className="font-bold text-lg mb-1">Donations are currently paused</h3>
                        <p className="text-sm opacity-80">We are not accepting public donations at this time. Thank you for your support.</p>
                      </div>
                    ) : (
                      <form onSubmit={handleDonate} className="space-y-6">
                        {/* Presets */}
                        <div className="space-y-2">
                          <label className="block text-brand-navy/70 font-semibold text-sm">Choose Amount (PKR)</label>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                            {['1000', '5000', '10000', '25000'].map(val => {
                              const isSelected = donationAmount === val && !isCustomAmount;
                              return (
                                <button
                                  key={val}
                                  type="button"
                                  onClick={() => { setDonationAmount(val); setIsCustomAmount(false); }}
                                  className={`py-3 px-4 rounded-xl font-bold border transition text-sm text-center ${
                                    isSelected
                                      ? 'bg-brand-teal border-brand-teal text-white shadow-md shadow-brand-teal/10'
                                      : 'border-brand-navy/10 text-brand-navy/70 bg-white hover:bg-brand-gray'
                                  }`}
                                >
                                  {Number(val).toLocaleString('en-PK')}
                                </button>
                              );
                            })}
                            <button
                              type="button"
                              onClick={() => setIsCustomAmount(true)}
                              className={`py-3 px-4 rounded-xl font-bold border transition text-sm text-center ${
                                isCustomAmount
                                  ? 'bg-brand-teal border-brand-teal text-white shadow-md shadow-brand-teal/10'
                                  : 'border-brand-navy/10 text-brand-navy/70 bg-white hover:bg-brand-gray'
                              }`}
                            >
                              Custom
                            </button>
                          </div>
                        </div>

                        {/* Custom Input */}
                        {isCustomAmount && (
                          <div className="space-y-1">
                            <label className="block text-brand-navy/70 font-semibold text-sm">Custom Amount (PKR)</label>
                            <input
                              type="number"
                              required
                              placeholder="Enter amount"
                              className="w-full px-4 py-3 border border-brand-navy/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-teal focus:border-transparent transition text-sm"
                              value={customAmountVal}
                              onChange={e => setCustomAmountVal(e.target.value)}
                            />
                          </div>
                        )}

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                          <div>
                            <label className="block text-brand-navy/70 font-semibold mb-1.5">Payment Method</label>
                            <select
                              className="w-full px-4 py-3 border border-brand-navy/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-teal focus:border-transparent transition bg-white"
                              value={donationPaymentMethod}
                              onChange={e => setDonationPaymentMethod(e.target.value)}
                              required
                            >
                              <option value="" disabled>Select an account</option>
                              {paymentMethods.map((m: any) => (
                                <option key={m.id} value={m.provider_name}>{m.provider_name} ({m.type})</option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <label className="block text-brand-navy/70 font-semibold mb-1.5">Transaction ID (TID) *</label>
                            <input
                              type="text"
                              required
                              placeholder="From your bank/app receipt"
                              className="w-full px-4 py-3 border border-brand-navy/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-teal focus:border-transparent transition"
                              value={donationTransactionId}
                              onChange={e => setDonationTransactionId(e.target.value)}
                            />
                          </div>
                          
                          <div className="sm:col-span-2">
                            <label className="block text-brand-navy/70 font-semibold mb-1.5">Dedication / Message (Optional)</label>
                            <input
                              type="text"
                              placeholder="In honor of / general support"
                              className="w-full px-4 py-3 border border-brand-navy/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-teal focus:border-transparent transition"
                              value={donationDedication}
                              onChange={e => setDonationDedication(e.target.value)}
                            />
                          </div>
                        </div>

                        {donationPaymentMethod && (
                          <div className="bg-brand-gray/50 border border-brand-navy/10 rounded-xl p-4 text-sm">
                            <p className="font-bold text-brand-navy/90 mb-2">Please transfer funds to:</p>
                            {(() => {
                              const method = paymentMethods.find((m: any) => m.provider_name === donationPaymentMethod);
                              if (!method) return null;
                              return (
                                <div className="space-y-1">
                                  <p><strong>Bank/Provider:</strong> {method.provider_name}</p>
                                  <p><strong>Account Title:</strong> {method.account_title}</p>
                                  <p><strong>Account Number:</strong> {method.account_number}</p>
                                  {method.iban && <p><strong>IBAN:</strong> {method.iban}</p>}
                                  <div className="mt-4 pt-3 border-t border-brand-navy/10">
                                    <p className="text-brand-teal font-medium flex items-center gap-2">
                                      <CheckCircle className="w-4 h-4" />
                                      After transferring, please enter the Transaction ID (TID) above. Send your screenshot proof to our WhatsApp at +92 3XX XXXXXXX.
                                    </p>
                                  </div>
                                </div>
                              );
                            })()}
                          </div>
                        )}

                        <button
                          type="submit"
                          disabled={isSubmittingDonation}
                          className="w-full bg-brand-teal hover:bg-brand-teal text-white font-bold py-3.5 rounded-xl shadow-lg shadow-brand-teal/10 hover:shadow-emerald-200 transition disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                          {isSubmittingDonation ? (
                            <>
                              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                              Processing...
                            </>
                          ) : (
                            'Submit Donation for Verification'
                          )}
                        </button>
                      </form>
                    )}
                  </div>

                  {/* Summary Stats */}
                  <div className="bg-gradient-to-br from-brand-navy to-brand-navy/80 text-white rounded-xl p-6 flex flex-col justify-between shadow-lg">
                    <div className="space-y-6">
                      <div className="w-10 h-10 bg-brand-teal/20 rounded-xl flex items-center justify-center text-brand-teal/60">
                        <TrendingUp className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="text-xs text-indigo-200/80 font-bold uppercase tracking-wider">Total Donated</span>
                        <h2 className="text-3xl font-extrabold mt-1">PKR {totalDonations.toLocaleString('en-PK')}</h2>
                      </div>
                      <div className="grid grid-cols-2 gap-4 border-t border-indigo-800/60 pt-4 text-xs">
                        <div>
                          <span className="text-indigo-200/80 uppercase font-medium">This Year</span>
                          <p className="font-bold text-sm mt-1">PKR {donationsThisYear.toLocaleString('en-PK')}</p>
                        </div>
                        <div>
                          <span className="text-indigo-200/80 uppercase font-medium">Contributions</span>
                          <p className="font-bold text-sm mt-1">{donations.length} records</p>
                        </div>
                      </div>
                    </div>
                    <div className="text-[10px] text-brand-navy/40 mt-8">
                      All donations processed through this portal are eligible for tax exemption under local section policies.
                    </div>
                  </div>
                </div>

                {/* Donation history table list */}
                <div className="bg-white border border-brand-navy/10 rounded-xl p-6 shadow-sm">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                    <h3 className="font-bold text-brand-navy/80">Donation Contribution Records</h3>
                    <div className="flex gap-2 w-full sm:w-auto">
                      <div className="relative flex-1 sm:w-64">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-navy/40" />
                        <input
                          type="text"
                          placeholder="Search cause/txn"
                          className="pl-10 pr-4 py-2 border border-brand-navy/10 rounded-xl w-full text-xs focus:outline-none focus:ring-2 focus:ring-brand-teal"
                          value={donationSearch}
                          onChange={e => { setDonationSearch(e.target.value); setDonationPage(1); }}
                        />
                      </div>
                      <button
                        onClick={() => setDonationSortOrder(prev => prev === 'desc' ? 'asc' : 'desc')}
                        className="py-2 px-3 border border-brand-navy/10 rounded-xl text-xs font-semibold text-brand-navy/60 bg-white hover:bg-brand-gray transition"
                      >
                        Sort: {donationSortOrder === 'desc' ? 'Newest' : 'Oldest'}
                      </button>
                    </div>
                  </div>

                  {paginatedDonations.length > 0 ? (
                    <div className="space-y-4">
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs text-left border-collapse">
                          <thead>
                            <tr className="border-b border-brand-navy/5 text-brand-navy/40 font-semibold uppercase tracking-wider">
                              <th className="py-3 px-4">Receipt / Trans ID</th>
                              <th className="py-3 px-4">Date</th>
                              <th className="py-3 px-4">Amount (PKR)</th>
                              <th className="py-3 px-4">Method</th>
                              <th className="py-3 px-4">Project / Cause</th>
                              <th className="py-3 px-4">Status</th>
                              <th className="py-3 px-4 text-center">Receipt</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-50 text-brand-navy/70 font-medium">
                            {paginatedDonations.map(row => (
                              <tr key={row.id} className="hover:bg-brand-gray/50">
                                <td className="py-3.5 px-4 font-mono text-xs text-brand-navy/60">
                                  {row.receipt_number ? (
                                    <span className="font-mono font-bold text-green-700 bg-green-50 border border-green-100 px-1.5 py-0.5 rounded text-[11px]">
                                      {row.receipt_number}
                                    </span>
                                  ) : (
                                    <span className="text-brand-navy/40">
                                      {row.transaction_id || row.id.substring(0, 8) + '...'}
                                    </span>
                                  )}
                                </td>
                                <td className="py-3.5 px-4 whitespace-nowrap">{formatDate(row.created_at)}</td>
                                <td className="py-3.5 px-4 font-bold text-brand-navy">PKR {Number(row.amount).toLocaleString('en-PK')}</td>
                                <td className="py-3.5 px-4 capitalize text-brand-navy/50">{row.payment_method}</td>
                                <td className="py-3.5 px-4">
                                  <div className="font-semibold text-brand-navy/80 truncate max-w-[160px]" title={row.projects?.title || 'General Fund'}>
                                    {row.projects?.title || 'General Fund'}
                                  </div>
                                  {row.message && row.message !== (row.projects?.title || 'General Fund') && (
                                    <div className="text-[10px] text-brand-navy/40 truncate max-w-[160px]" title={row.message}>
                                      {row.message}
                                    </div>
                                  )}
                                </td>
                                <td className="py-3.5 px-4">
                                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md capitalize ${
                                    row.status === 'confirmed' ? 'bg-green-50 text-green-700 border border-green-100' :
                                    row.status === 'rejected' ? 'bg-red-50 text-red-700 border border-red-100' :
                                    'bg-yellow-50 text-yellow-700 border border-yellow-100'
                                  }`}>
                                    {row.status || 'confirmed'}
                                  </span>
                                </td>
                                <td className="py-3.5 px-4 text-center">
                                  <button
                                    onClick={() => triggerReceiptPrint({
                                      transactionId: row.transaction_id || row.id,
                                      receiptNumber: row.receipt_number,
                                      projectTitle: row.projects?.title || 'General Fund',
                                      amount: row.amount,
                                      dedication: row.message,
                                      paymentMethod: row.payment_method,
                                      date: row.created_at
                                    })}
                                    className="p-1.5 text-brand-teal hover:bg-brand-teal/10 rounded-lg transition"
                                    title="Download Receipt"
                                  >
                                    <Download className="w-4 h-4" />
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {/* Pagination */}
                      {donationPageCount > 1 && (
                        <div className="flex justify-between items-center border-t border-brand-navy/5 pt-4 text-xs font-semibold text-brand-navy/60">
                          <span>Page {donationPage} of {donationPageCount}</span>
                          <div className="flex gap-2">
                            <button
                              disabled={donationPage === 1}
                              onClick={() => setDonationPage(p => Math.max(1, p - 1))}
                              className="py-1.5 px-3 border border-brand-navy/10 rounded-lg hover:bg-brand-gray disabled:opacity-50 transition"
                            >
                              Previous
                            </button>
                            <button
                              disabled={donationPage === donationPageCount}
                              onClick={() => setDonationPage(p => Math.min(donationPageCount, p + 1))}
                              className="py-1.5 px-3 border border-brand-navy/10 rounded-lg hover:bg-brand-gray disabled:opacity-50 transition"
                            >
                              Next
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-brand-navy/40 font-medium">No donation contributions match search criteria.</div>
                  )}
                </div>
              </>
            )}

            {/* ============================================================== */}
            {/* TABS 5: EVENTS */}
            {/* ============================================================== */}
            {activeTab === 'events' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Available events list */}
                <div className="bg-white border border-brand-navy/10 rounded-xl p-6 shadow-sm lg:col-span-2 space-y-6">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-brand-navy/5">
                    <div>
                      <h2 className="text-lg font-bold text-brand-navy/80">Browse & Register Events</h2>
                      <p className="text-sm text-brand-navy/50 mt-1">Register for upcoming healthcare, educational, or volunteer drives.</p>
                    </div>
                    
                    <div className="flex gap-2 w-full sm:w-auto">
                      <div className="relative flex-1 sm:w-48">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-brand-navy/40" />
                        <input
                          type="text"
                          placeholder="Search title/loc"
                          className="pl-8 pr-3 py-1.5 border border-brand-navy/10 rounded-lg w-full text-xs focus:outline-none focus:ring-2 focus:ring-brand-teal"
                          value={eventSearch}
                          onChange={e => setEventSearch(e.target.value)}
                        />
                      </div>
                      <select
                        className="py-1.5 px-2.5 border border-brand-navy/10 rounded-lg text-xs font-semibold text-brand-navy/60 bg-white"
                        value={eventCategoryFilter}
                        onChange={e => setEventCategoryFilter(e.target.value)}
                      >
                        <option value="All">All Categories</option>
                        <option value="Education">Education</option>
                        <option value="Healthcare">Healthcare</option>
                        <option value="Environment">Environment</option>
                        <option value="Community">Community</option>
                      </select>
                    </div>
                  </div>

                  {filteredEvents.length > 0 ? (
                    <div className="space-y-4">
                      {filteredEvents.map(evt => {
                        const isRegistered = eventRegistrations.some(r => r.event.id === evt.id);
                        const eventDate = new Date(evt.event_date);
                        const maxCap = evt.capacity || 50;
                        const regCount = evt.registered_count || 12;
                        const isFull = regCount >= maxCap;

                        return (
                          <div key={evt.id} className="p-4 border border-brand-navy/5 rounded-2xl hover:border-indigo-100 transition-all flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                            <div className="flex gap-4 items-center">
                              {/* Date block */}
                              <div className="w-14 h-14 bg-brand-teal/10 text-brand-teal rounded-xl flex flex-col items-center justify-center flex-shrink-0 shadow-inner">
                                <span className="text-lg font-bold leading-none">{eventDate.getDate()}</span>
                                <span className="text-[10px] font-bold uppercase mt-1">{eventDate.toLocaleDateString('en-US', { month: 'short' })}</span>
                              </div>
                              <div className="space-y-1">
                                <h3 className="font-bold text-brand-navy/80 text-sm">{evt.title}</h3>
                                <div className="flex items-center gap-4 text-xs text-brand-navy/40 font-medium">
                                  <span className="flex items-center gap-1">
                                    <MapPin className="w-3.5 h-3.5 text-slate-300" />
                                    {evt.location || 'Online / virtual'}
                                  </span>
                                  <span>{evt.category || 'Advancement'}</span>
                                </div>
                                <div className="text-[10px] text-brand-navy/40 font-semibold">
                                  Capacity: {regCount}/{maxCap} slots registered
                                </div>
                              </div>
                            </div>

                            <button
                              disabled={isRegistered || isFull}
                              onClick={() => handleRegisterEvent(evt)}
                              className={`py-2 px-5 rounded-xl text-xs font-bold transition w-full sm:w-auto text-center ${
                                isRegistered
                                  ? 'bg-brand-navy/5 text-brand-navy/40 cursor-not-allowed border border-brand-navy/10'
                                  : isFull
                                  ? 'bg-red-50 text-red-400 border border-red-200 cursor-not-allowed'
                                  : 'bg-brand-teal hover:bg-brand-teal text-white shadow-md shadow-brand-teal/10'
                              }`}
                            >
                              {isRegistered ? 'Registered' : isFull ? 'Event Full' : 'Register Now'}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-brand-navy/40 font-medium">No upcoming events match filters.</div>
                  )}
                </div>

                {/* My registered events */}
                <div className="bg-white border border-brand-navy/10 rounded-xl p-6 shadow-sm flex flex-col justify-between">
                  <div className="space-y-4">
                    <h3 className="font-bold text-brand-navy/80 pb-3 border-b border-brand-navy/5">My Registrations</h3>
                    {eventRegistrations.length > 0 ? (
                      <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
                        {eventRegistrations.map(reg => {
                          const dateObj = new Date(reg.event.event_date);
                          
                          return (
                            <div key={reg.id} className="p-3 bg-brand-gray border border-brand-navy/5 rounded-xl space-y-3">
                              <div className="flex justify-between items-start">
                                <div>
                                  <h4 className="text-xs font-bold text-brand-navy/80 line-clamp-1">{reg.event.title}</h4>
                                  <p className="text-[10px] text-brand-navy/40 font-medium mt-0.5">{dateObj.toLocaleDateString()} — {reg.event.location}</p>
                                </div>
                                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase ${
                                  reg.status === 'registered' ? 'bg-green-100 text-green-700' : 'bg-red-50 text-red-600'
                                }`}>
                                  {reg.status}
                                </span>
                              </div>

                              {reg.status === 'registered' && (
                                <div className="flex gap-2 text-[10px] font-bold">
                                  <button
                                    onClick={() => downloadCalendarFile(reg.event)}
                                    className="flex-1 py-1 px-2.5 border border-brand-navy/10 hover:bg-white text-brand-navy/60 rounded-lg text-center transition"
                                  >
                                    Add Calendar
                                  </button>
                                  <button
                                    onClick={() => handleCancelRegistration(reg.id, reg.event.id)}
                                    className="py-1 px-2.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg text-center transition"
                                  >
                                    Cancel Booking
                                  </button>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-brand-navy/40 text-xs font-medium">You haven't registered for any events yet.</div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* ============================================================== */}
            {/* TABS 6: ZONES */}
            {/* ============================================================== */}
            {activeTab === 'zones' && (
              <div className="bg-white border border-brand-navy/10 rounded-xl p-6 md:p-8 shadow-sm space-y-6">
                <div className="pb-6 border-b border-brand-navy/5 mb-6">
                  <h2 className="text-lg font-bold text-brand-navy/80">Projects & Zones</h2>
                  <p className="text-sm text-brand-navy/50 mt-1">Switch or join regional projects and zones to participate in local services and meet fellow members.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {zones.map(zn => {
                    const isCurrent = activeZone?.id === zn.id;
                    const count = zn.member_count || 0;
                    return (
                      <div
                        key={zn.id}
                        className={`p-5 rounded-2xl border transition-all duration-200 flex flex-col justify-between ${
                          isCurrent
                            ? 'bg-brand-teal/10/50 border-indigo-200 ring-2 ring-brand-teal/10'
                            : 'border-brand-navy/5 bg-white hover:border-brand-navy/10 shadow-sm'
                        }`}
                      >
                        <div className="space-y-2">
                          <div className="flex justify-between items-start">
                            <div>
                              <span className="text-xs font-bold text-brand-navy/40 uppercase tracking-wider">{zn.city}</span>
                              <h3 className="font-bold text-brand-navy/80 text-base mt-0.5">{zn.name}</h3>
                            </div>
                            {isCurrent && (
                              <span className="text-[10px] font-bold bg-brand-teal text-white px-2 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1">
                                <Check className="w-3 h-3" />
                                Active
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-brand-navy/50 leading-relaxed">{zn.description || 'Regional community development and emergency services division.'}</p>
                        </div>

                        <div className="flex justify-between items-center border-t border-brand-navy/5/60 pt-4 mt-4 text-xs font-semibold text-brand-navy/50">
                          <span>{count.toLocaleString()} members</span>
                          {isCurrent && (
                            <span className="text-brand-teal font-bold flex items-center gap-1">
                              <Check className="w-3.5 h-3.5" /> Current Zone
                            </span>
                          )}
                          {!isCurrent && (
                            <span className="text-brand-navy/30 text-xs">Contact admin to switch</span>
                          )}
                        </div>

                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ============================================================== */}
            {/* TABS 7: VOLUNTEER HUB */}
            {/* ============================================================== */}
            {activeTab === 'volunteer_hub' && (
              <div className="bg-white border border-brand-navy/10 rounded-xl p-6 md:p-8 shadow-sm space-y-6">
                <div className="flex justify-between items-center pb-6 border-b border-brand-navy/5 mb-6">
                  <div>
                    <h2 className="text-lg font-bold text-brand-navy/80">Volunteer Hub</h2>
                    <p className="text-sm text-brand-navy/50 mt-1">Manage your volunteer assignments and track your impact.</p>
                  </div>
                  <button
                    onClick={() => generateIdCard({
                      id: volunteerPersonnel?.uid || profile?.id,
                      name: fullName,
                      fatherName: profile?.father_name || volunteerPersonnel?.father_name || 'N/A',
                      phone: profile?.phone || 'N/A',
                      email: profile?.email || user?.email || 'N/A',
                      occupation: profile?.occupation || volunteerPersonnel?.occupation || 'N/A',
                      profileImageUrl: avatarUrl,
                      issueDate: new Date().toLocaleDateString(),
                      validUntil: 'N/A'
                    }, true)}
                    className="flex items-center gap-2 bg-brand-navy hover:bg-brand-navy/90 text-white font-semibold px-5 py-2.5 rounded-xl text-sm transition shadow-md shadow-brand-navy/20"
                  >
                    <Download className="w-4 h-4" />
                    Download Digital ID Card
                  </button>
                </div>
                {assignedProjects.length === 0 ? (
                  <div className="p-5 rounded-2xl border border-brand-navy/5 bg-brand-gray/50 shadow-sm text-center">
                    <Users className="w-8 h-8 text-brand-navy/20 mx-auto mb-3" />
                    <h3 className="font-bold text-brand-navy/80 text-base">Your Assigned Projects</h3>
                    <p className="text-sm text-brand-navy/50 mt-2">No active project assignments currently. Please check back later or contact your zone administrator.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <h3 className="font-bold text-brand-navy/80 text-lg">Your Assigned Projects</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {assignedProjects.map(assignment => (
                        <div key={assignment.id} className="p-5 rounded-2xl border border-brand-navy/10 bg-white shadow-sm flex items-start gap-4">
                          <div className="w-12 h-12 bg-brand-teal/10 text-brand-teal rounded-xl flex items-center justify-center flex-shrink-0">
                            <MapPin className="w-6 h-6" />
                          </div>
                          <div>
                            <h4 className="font-bold text-brand-navy">{assignment.projects?.title_en || assignment.projects?.titleEn || 'Project'}</h4>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-brand-navy/5 text-brand-navy/70 capitalize">
                                Role: {assignment.role}
                              </span>
                              <span className="text-xs text-brand-navy/50">
                                Assigned: {new Date(assignment.assigned_at).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

          </motion.div>
        </AnimatePresence>
      </main>

      {/* ============================================================== */}
      {/* DIALOGS & MODALS */}
      {/* ============================================================== */}

      {/* --- Edit Profile Modal --- */}
      <AnimatePresence>
        {isEditModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-brand-navy/80 backdrop-blur-sm"
              onClick={() => !isSaving && setIsEditModalOpen(false)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-md bg-white rounded-xl shadow-2xl p-6 overflow-hidden"
            >
              <button
                disabled={isSaving}
                onClick={() => setIsEditModalOpen(false)}
                className="absolute top-4 right-4 p-2 text-brand-navy/40 hover:text-brand-navy/60 hover:bg-brand-gray rounded-full transition"
              >
                <X className="w-5 h-5" />
              </button>

              <h3 className="text-lg font-bold text-brand-navy/80 mb-2">Edit Profile Details</h3>
              <p className="text-xs text-brand-navy/40 mb-6">Modify details to display in user dashboard lists and project directories.</p>

              {profileErrorMsg && (
                <div className="mb-4 bg-red-50 text-red-700 text-xs p-3 rounded-lg border border-red-100">
                  {profileErrorMsg}
                </div>
              )}

              <form onSubmit={handleEditSubmit} className="space-y-4 text-xs font-semibold text-brand-navy/60">
                <div>
                  <label className="block text-brand-navy/70 font-bold mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    className="w-full px-3.5 py-2.5 border border-brand-navy/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-teal font-medium text-brand-navy/80"
                    value={editName}
                    onChange={e => setEditName(e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-brand-navy/70 font-bold mb-1">Phone</label>
                    <input
                      type="tel"
                      className="w-full px-3.5 py-2.5 border border-brand-navy/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-teal font-medium text-brand-navy/80"
                      value={editPhone}
                      onChange={e => setEditPhone(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-brand-navy/70 font-bold mb-1">CNIC Number</label>
                    <input
                      type="text"
                      placeholder="XXXXX-XXXXXXX-X"
                      className="w-full px-3.5 py-2.5 border border-brand-navy/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-teal font-medium text-brand-navy/80"
                      value={editCnic}
                      onChange={e => setEditCnic(e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-brand-navy/70 font-bold mb-1">Occupation</label>
                  <input
                    type="text"
                    className="w-full px-3.5 py-2.5 border border-brand-navy/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-teal font-medium text-brand-navy/80"
                    value={editOccupation}
                    onChange={e => setEditOccupation(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-brand-navy/70 font-bold mb-1">Address</label>
                  <input
                    type="text"
                    className="w-full px-3.5 py-2.5 border border-brand-navy/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-teal font-medium text-brand-navy/80"
                    value={editAddress}
                    onChange={e => setEditAddress(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-brand-navy/70 font-bold mb-1">Avatar Image URL</label>
                  <input
                    type="url"
                    placeholder="https://..."
                    className="w-full px-3.5 py-2.5 border border-brand-navy/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-teal font-medium text-brand-navy/80"
                    value={editAvatarUrl}
                    onChange={e => setEditAvatarUrl(e.target.value)}
                  />
                </div>

                <div className="pt-4 flex justify-end gap-2 text-xs font-semibold">
                  <button
                    type="button"
                    disabled={isSaving}
                    onClick={() => setIsEditModalOpen(false)}
                    className="py-2.5 px-4 text-brand-navy/60 hover:text-brand-navy/80 rounded-xl hover:bg-brand-gray transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="bg-brand-teal hover:bg-brand-teal text-white py-2.5 px-5 rounded-xl transition shadow-md shadow-brand-teal/10 flex items-center gap-1.5"
                  >
                    {isSaving && <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>}
                    Save Changes
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- Donation Receipt Modal --- */}
      <AnimatePresence>
        {donationReceipt && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-brand-navy/80 backdrop-blur-sm"
              onClick={() => setDonationReceipt(null)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-sm bg-white rounded-xl shadow-2xl p-6 flex flex-col items-center text-center overflow-hidden"
            >
              <div className="w-12 h-12 bg-brand-teal/10 text-brand-teal rounded-full flex items-center justify-center mb-4">
                <Check className="w-6 h-6" />
              </div>

              <h3 className="text-lg font-bold text-brand-navy/80">Donation Successful!</h3>
              <p className="text-xs text-brand-navy/40 mt-1">Thank you for making a contribution. A receipt has been generated.</p>

              <div className="w-full bg-brand-gray border border-brand-navy/5 p-4 rounded-2xl my-5 text-left text-xs font-semibold text-brand-navy/60 space-y-3">
                <div className="flex justify-between">
                  <span className="text-brand-navy/40 font-medium">Receipt ID</span>
                  <span className="font-mono text-[10px] text-brand-navy/60">{donationReceipt.transactionId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-brand-navy/40 font-medium">Date</span>
                  <span>{new Date(donationReceipt.date).toLocaleDateString('en-PK')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-brand-navy/40 font-medium">Amount</span>
                  <span className="font-bold text-brand-navy">PKR {donationReceipt.amount.toLocaleString('en-PK')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-brand-navy/40 font-medium">Method</span>
                  <span>{donationReceipt.paymentMethod}</span>
                </div>
                {donationReceipt.dedication && (
                  <div className="flex justify-between">
                    <span className="text-brand-navy/40 font-medium">Dedication</span>
                    <span className="truncate max-w-[120px]">{donationReceipt.dedication}</span>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2 w-full text-xs font-bold pt-2">
                <button
                  onClick={() => triggerReceiptPrint(donationReceipt)}
                  className="py-2.5 px-4 bg-brand-teal hover:bg-brand-teal text-white rounded-xl shadow-md shadow-brand-teal/10 transition"
                >
                  Print Receipt
                </button>
                <button
                  onClick={() => setDonationReceipt(null)}
                  className="py-2.5 px-4 border border-brand-navy/10 text-brand-navy/60 rounded-xl hover:bg-brand-gray transition"
                >
                  Close View
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- Membership Switch Zone Dialog --- */}
      <AnimatePresence>
        {zoneToSwitch && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-brand-navy/80 backdrop-blur-sm"
              onClick={() => setZoneToSwitch(null)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-sm bg-white rounded-xl shadow-2xl p-6 text-center overflow-hidden"
            >
              <h3 className="text-base font-bold text-brand-navy/80">Switch Regional Zone?</h3>
              <p className="text-xs text-brand-navy/50 mt-2">
                Are you sure you want to switch your active project assignment to **{zoneToSwitch.name} ({zoneToSwitch.city})**?
              </p>

              <div className="flex gap-2 w-full text-xs font-bold pt-6">
                <button
                  onClick={handleSwitchZone}
                  className="flex-1 py-2.5 px-4 bg-brand-teal hover:bg-brand-teal text-white rounded-xl shadow-md transition"
                >
                  Confirm Switch
                </button>
                <button
                  onClick={() => setZoneToSwitch(null)}
                  className="flex-1 py-2.5 px-4 border border-brand-navy/10 text-brand-navy/60 rounded-xl hover:bg-brand-gray transition"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- Membership Upgrade Modal --- */}
      <AnimatePresence>
        {isUpgradeModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-brand-navy/80 backdrop-blur-sm"
              onClick={() => setIsUpgradeModalOpen(false)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-sm bg-white rounded-xl shadow-2xl p-6 overflow-hidden"
            >
              <h3 className="text-base font-bold text-brand-navy/80 mb-4">Upgrade Membership Tier</h3>
              <p className="text-xs text-brand-navy/40 mb-6">Select a higher membership tier. Upgrading will reset your renewal date for 1 full year.</p>

              <div className="space-y-2">
                {tiers
                  .filter(t => t.id !== membership?.tier?.id)
                  .map(t => (
                    <button
                      key={t.id}
                      onClick={() => handleUpgradeMembership(t.id)}
                      className="w-full flex justify-between items-center p-3 border border-brand-navy/5 hover:border-indigo-100 hover:bg-brand-teal/10/20 rounded-xl text-xs font-bold text-brand-navy/80 transition text-left"
                    >
                      <span>{t.name} Tier</span>
                      <span className="text-brand-teal">PKR {t.price.toLocaleString('en-PK')}</span>
                    </button>
                  ))}
              </div>

              <div className="flex justify-end gap-2 text-xs font-bold pt-6 border-t border-slate-50 mt-6">
                <button
                  onClick={() => setIsUpgradeModalOpen(false)}
                  className="py-2 px-4 border border-brand-navy/10 text-brand-navy/60 rounded-xl hover:bg-brand-gray transition"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- Membership Cancel Confirm Dialog --- */}
      <AnimatePresence>
        {isCancelConfirmOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-brand-navy/80 backdrop-blur-sm"
              onClick={() => setIsCancelConfirmOpen(false)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-sm bg-white rounded-xl shadow-2xl p-6 text-center overflow-hidden"
            >
              <h3 className="text-base font-bold text-brand-navy/80">Cancel Membership?</h3>
              <p className="text-xs text-brand-navy/50 mt-2">
                Are you sure you want to cancel your IOCA membership plan? You will lose access to local workshops and project events.
              </p>

              <div className="flex gap-2 w-full text-xs font-bold pt-6">
                <button
                  onClick={handleCancelMembership}
                  className="flex-1 py-2.5 px-4 bg-red-600 hover:bg-red-700 text-white rounded-xl shadow-md transition"
                >
                  Yes, Cancel Plan
                </button>
                <button
                  onClick={() => setIsCancelConfirmOpen(false)}
                  className="flex-1 py-2.5 px-4 border border-brand-navy/10 text-brand-navy/60 rounded-xl hover:bg-brand-gray transition"
                >
                  Keep Active
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- Membership Renew Confirm Dialog --- */}
      <AnimatePresence>
        {isRenewConfirmOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-brand-navy/80 backdrop-blur-sm"
              onClick={() => setIsRenewConfirmOpen(false)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-sm bg-white rounded-xl shadow-2xl p-6 text-center overflow-hidden"
            >
              <h3 className="text-base font-bold text-brand-navy/80">Renew Membership?</h3>
              <p className="text-xs text-brand-navy/50 mt-2">
                Are you sure you want to renew your **{membership?.tier?.name}** membership plan? This will extend your validation date for 1 full year.
              </p>

              <div className="flex gap-2 w-full text-xs font-bold pt-6">
                <button
                  onClick={handleRenewMembership}
                  className="flex-1 py-2.5 px-4 bg-brand-teal hover:bg-brand-teal text-white rounded-xl shadow-md transition"
                >
                  Confirm Renewal
                </button>
                <button
                  onClick={() => setIsRenewConfirmOpen(false)}
                  className="flex-1 py-2.5 px-4 border border-brand-navy/10 text-brand-navy/60 rounded-xl hover:bg-brand-gray transition"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
