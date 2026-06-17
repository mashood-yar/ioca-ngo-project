import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { fetchApi } from '../../lib/apiClient';

interface Zone {
  id: string;
  name: string;
  city: string;
  _count?: { members: number };
}

interface Tier {
  id: string;
  name: string;
  price: number;
  description: string;
  duration_days: number;
}

export function MembershipApply() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [zones, setZones] = useState<Zone[]>([]);
  const [tiers, setTiers] = useState<Tier[]>([]);

  const [formData, setFormData] = useState({
    zoneId: '',
    zoneName: '',
    tierId: '',
    tierName: '',
    tierPrice: 0,
    fullName: user?.user_metadata?.full_name || '',
    email: user?.email || '',
    phone: '',
    cnic: '',
    address: '',
    occupation: '',
    motivation: '',
  });

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        // Check if user already has application/membership
        const { data: myApp } = await fetchApi('/misc/applications/me').catch(() => ({ data: null }));
        if (myApp) {
          navigate('/membership/waiting', { replace: true });
          return;
        }

        const [{ data: zonesData }, { data: tiersData }] = await Promise.all([
          fetchApi('/zones'),
          fetchApi('/tiers'),
        ]);
        
        setZones(Array.isArray(zonesData) ? zonesData : []);
        setTiers(Array.isArray(tiersData) ? tiersData : []);
      } catch (err) {
        console.error(err);
        setError('Failed to load form data');
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [navigate]);

  const handleNext = () => {
    if (step === 1 && (!formData.zoneId || !formData.tierId)) return;
    if (step === 2 && (!formData.fullName || !formData.phone || formData.motivation.length < 50)) return;
    setStep(s => s + 1);
  };

  const handleBack = () => {
    setStep(s => s - 1);
  };

  const handleSubmit = async () => {
    try {
      setSubmitting(true);
      setError(null);
      
      const { error: submitError } = await fetchApi('/misc/applications', {
        method: 'POST',
        body: JSON.stringify({
          zoneId: formData.zoneId,
          tierId: formData.tierId,
          fullName: formData.fullName,
          phone: formData.phone,
          cnic: formData.cnic,
          address: formData.address,
          occupation: formData.occupation,
          motivation: formData.motivation
        })
      });

      if (submitError) throw new Error(submitError);
      
      window.dispatchEvent(new CustomEvent('app-toast', { 
        detail: { message: 'Application submitted successfully!', variant: 'success' } 
      }));
      navigate('/membership/waiting', { replace: true });

    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to submit application');
      window.dispatchEvent(new CustomEvent('app-toast', { 
        detail: { message: err.message || 'Failed to submit application', variant: 'error' } 
      }));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        
        {/* Progress Bar */}
        <div className="mb-10">
          <div className="flex items-center justify-between relative">
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-gray-200 -z-10 rounded-full overflow-hidden">
              <div 
                className="h-full bg-indigo-600 transition-all duration-300"
                style={{ width: `${((step - 1) / 2) * 100}%` }}
              ></div>
            </div>
            
            {[
              { num: 1, label: 'Zone' },
              { num: 2, label: 'Your Info' },
              { num: 3, label: 'Review' }
            ].map(s => (
              <div key={s.num} className="flex flex-col items-center gap-2 bg-gray-50 px-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                  step >= s.num ? 'bg-indigo-600 text-white shadow-md' : 'bg-gray-200 text-gray-500'
                }`}>
                  {step > s.num ? '✓' : s.num}
                </div>
                <span className={`text-sm font-medium ${step >= s.num ? 'text-indigo-900' : 'text-gray-500'}`}>
                  {s.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Step Content */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          
          {step === 1 && (
            <div className="p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Choose your zone and membership tier</h2>
              <p className="text-gray-500 mb-8">Select the zone closest to your city and the membership tier that suits you.</p>

              <div className="mb-8">
                <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">Select Zone</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {zones.map(zone => (
                    <div 
                      key={zone.id}
                      onClick={() => setFormData(f => ({ ...f, zoneId: zone.id, zoneName: zone.name }))}
                      className={`cursor-pointer rounded-xl p-4 transition-all relative ${
                        formData.zoneId === zone.id 
                          ? 'border-2 border-indigo-600 bg-indigo-50 shadow-sm' 
                          : 'border border-gray-200 bg-white hover:border-indigo-300'
                      }`}
                    >
                      <h4 className="font-medium text-gray-900">{zone.name}</h4>
                      <p className="text-sm text-gray-500 mt-1">{zone.city}</p>
                      {typeof zone._count?.members === 'number' && (
                        <span className="absolute top-4 right-4 text-xs font-medium bg-gray-100 text-gray-600 px-2 py-1 rounded-md">
                          {zone._count.members} members
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">Select Tier</h3>
                <div className="grid grid-cols-1 gap-3">
                  {tiers.map(tier => (
                    <div 
                      key={tier.id}
                      onClick={() => setFormData(f => ({ ...f, tierId: tier.id, tierName: tier.name, tierPrice: tier.price }))}
                      className={`cursor-pointer rounded-xl p-4 transition-all ${
                        formData.tierId === tier.id 
                          ? 'border-2 border-indigo-600 bg-indigo-50 shadow-sm' 
                          : 'border border-gray-200 bg-white hover:border-indigo-300'
                      }`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-medium text-gray-900">{tier.name}</h4>
                        <span className="font-semibold text-indigo-700">PKR {tier.price.toLocaleString()} / year</span>
                      </div>
                      <p className="text-sm text-gray-500">{tier.description}</p>
                      <p className="text-xs text-gray-400 mt-2">Duration: {tier.duration_days} days</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-gray-100 flex justify-end">
                <button 
                  onClick={handleNext}
                  disabled={!formData.zoneId || !formData.tierId}
                  className="bg-indigo-600 text-white px-8 py-3 rounded-xl font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto"
                >
                  Continue
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Tell us about yourself</h2>
              <p className="text-gray-500 mb-8">This information will be reviewed by the IOCA admin team.</p>

              <div className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Full name *</label>
                    <input 
                      type="text" 
                      required
                      value={formData.fullName}
                      onChange={e => setFormData(f => ({ ...f, fullName: e.target.value }))}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                    <input 
                      type="email" 
                      disabled
                      value={formData.email}
                      className="w-full px-4 py-2.5 border border-gray-200 bg-gray-50 text-gray-500 rounded-lg outline-none cursor-not-allowed"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone *</label>
                    <input 
                      type="tel" 
                      required
                      value={formData.phone}
                      onChange={e => setFormData(f => ({ ...f, phone: e.target.value }))}
                      placeholder="+92 300 0000000"
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">CNIC</label>
                    <input 
                      type="text" 
                      value={formData.cnic}
                      onChange={e => setFormData(f => ({ ...f, cnic: e.target.value }))}
                      placeholder="XXXXX-XXXXXXX-X"
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                  <textarea 
                    rows={2}
                    value={formData.address}
                    onChange={e => setFormData(f => ({ ...f, address: e.target.value }))}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
                  ></textarea>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Occupation</label>
                  <input 
                    type="text" 
                    value={formData.occupation}
                    onChange={e => setFormData(f => ({ ...f, occupation: e.target.value }))}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Why do you want to join IOCA? *</label>
                  <textarea 
                    rows={4}
                    required
                    value={formData.motivation}
                    onChange={e => setFormData(f => ({ ...f, motivation: e.target.value }))}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
                  ></textarea>
                  <p className={`text-xs mt-1 font-medium ${formData.motivation.length >= 50 ? 'text-green-600' : 'text-gray-500'}`}>
                    {formData.motivation.length} / 50 minimum characters
                  </p>
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-gray-100 flex justify-between gap-4">
                <button 
                  onClick={handleBack}
                  className="px-6 py-3 rounded-xl font-medium text-gray-600 hover:bg-gray-100 transition-colors"
                >
                  Back
                </button>
                <button 
                  onClick={handleNext}
                  disabled={!formData.fullName || !formData.phone || formData.motivation.length < 50}
                  className="bg-indigo-600 text-white px-8 py-3 rounded-xl font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50 flex-1 sm:flex-none"
                >
                  Continue to Review
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Review your application</h2>
              <p className="text-gray-500 mb-8">Please confirm everything looks correct before submitting.</p>

              {error && (
                <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-lg text-sm font-medium">
                  {error}
                </div>
              )}

              <div className="bg-gray-50 rounded-xl p-6 border border-gray-200 font-mono text-sm">
                <div className="grid grid-cols-3 gap-2 mb-2">
                  <span className="text-gray-500">Zone:</span>
                  <span className="col-span-2 font-medium">{formData.zoneName}</span>
                </div>
                <div className="grid grid-cols-3 gap-2 mb-4">
                  <span className="text-gray-500">Tier:</span>
                  <span className="col-span-2 font-medium">{formData.tierName} — PKR {formData.tierPrice.toLocaleString()}/year</span>
                </div>
                <hr className="border-gray-200 mb-4" />
                <div className="grid grid-cols-3 gap-2 mb-2">
                  <span className="text-gray-500">Full name:</span>
                  <span className="col-span-2 font-medium">{formData.fullName}</span>
                </div>
                <div className="grid grid-cols-3 gap-2 mb-2">
                  <span className="text-gray-500">Email:</span>
                  <span className="col-span-2">{formData.email}</span>
                </div>
                <div className="grid grid-cols-3 gap-2 mb-2">
                  <span className="text-gray-500">Phone:</span>
                  <span className="col-span-2">{formData.phone}</span>
                </div>
                <div className="grid grid-cols-3 gap-2 mb-2">
                  <span className="text-gray-500">CNIC:</span>
                  <span className="col-span-2">{formData.cnic || '—'}</span>
                </div>
                <div className="grid grid-cols-3 gap-2 mb-2">
                  <span className="text-gray-500">Address:</span>
                  <span className="col-span-2">{formData.address || '—'}</span>
                </div>
                <div className="grid grid-cols-3 gap-2 mb-4">
                  <span className="text-gray-500">Occupation:</span>
                  <span className="col-span-2">{formData.occupation || '—'}</span>
                </div>
                <hr className="border-gray-200 mb-4" />
                <div>
                  <span className="text-gray-500 block mb-2">Why joining:</span>
                  <p className="bg-white p-3 border border-gray-200 rounded italic text-gray-700">"{formData.motivation}"</p>
                </div>
              </div>

              <div className="mt-6 flex items-center gap-3">
                <input 
                  type="checkbox" 
                  id="confirm"
                  className="w-5 h-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600"
                  onChange={(e) => {
                    const btn = document.getElementById('submitBtn') as HTMLButtonElement;
                    if (btn) btn.disabled = !e.target.checked || submitting;
                  }}
                />
                <label htmlFor="confirm" className="text-sm text-gray-700">
                  I confirm that all information provided is accurate and complete.
                </label>
              </div>

              <div className="mt-8 pt-6 border-t border-gray-100 flex justify-between gap-4">
                <button 
                  onClick={handleBack}
                  disabled={submitting}
                  className="px-6 py-3 rounded-xl font-medium text-gray-600 hover:bg-gray-100 transition-colors disabled:opacity-50"
                >
                  Back
                </button>
                <button 
                  id="submitBtn"
                  onClick={handleSubmit}
                  disabled={true}
                  className="bg-indigo-600 text-white px-8 py-3 rounded-xl font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex-1 sm:flex-none flex items-center justify-center gap-2"
                >
                  {submitting && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>}
                  {submitting ? 'Submitting...' : 'Submit Application'}
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
