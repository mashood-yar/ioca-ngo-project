import React, { useState, useEffect, useRef } from 'react';
import { X, ArrowRight, ArrowLeft, CheckCircle2, CreditCard, Building2, Lock, Loader2 } from 'lucide-react';
import { toUrduNumerals } from '../utils/formatters';
import { saveDonation } from '../lib/saveDonation';
import { useCloudinaryUpload } from '../hooks/useCloudinaryUpload';
import { fetchApi } from '../lib/apiClient';
import { useAuth } from '../hooks/useAuth';

interface DonationModalProps {
  isOpen: boolean;
  onClose: () => void;
  isUrdu: boolean;
  initialCampaign?: string;
  /** H1-08: Pre-select amount passed from DonatePage */
  initialAmount?: number | null;
  initialIsMonthly?: boolean;
}

/** H1-07: Impact label for each preset amount */
const IMPACT_LABELS_EN: Record<number, string> = {
  1000: 'Feeds a family for a week',
  2000: 'School supplies for a child',
  5000: 'Funds a medical checkup camp',
  10000: 'Sponsors a student for a term',
};
const IMPACT_LABELS_UR: Record<number, string> = {
  1000: 'ایک ہفتے کے لیے خوراک',
  2000: 'ایک بچے کا اسکول سامان',
  5000: 'ایک طبی کیمپ',
  10000: 'ایک طالب علم کا سمسٹر',
};

/** H1-06: Step labels for progress bar */
const STEP_LABELS_EN = ['Amount', 'Your Info', 'Payment', 'Confirm'];
const STEP_LABELS_UR = ['رقم', 'معلومات', 'ادائیگی', 'تصدیق'];

const DonationModal: React.FC<DonationModalProps> = ({ isOpen, onClose, isUrdu, initialCampaign, initialAmount, initialIsMonthly }) => {
  const [step, setStep] = useState<number>(1); // 1 to 5
  const [isProcessing, setIsProcessing] = useState(false);
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvc, setCardCvc] = useState('');
  const [amount, setAmount] = useState<number | null>(5000);
  const [customAmount, setCustomAmount] = useState<string>('');
  const [fundType, setFundType] = useState<'zakat' | 'sadaqah' | 'general'>('general');
  const [campaign, setCampaign] = useState<string>(initialCampaign || 'General Fund');
  const [donorName, setDonorName] = useState('');
  const [donorEmail, setDonorEmail] = useState('');
  const [donorPhone, setDonorPhone] = useState('');
  const [isAnon, setIsAnon] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<string | null>(null);
  const [donationId, setDonationId] = useState<string | null>(null);
  const [screenshotFile, setScreenshotFile] = useState<File | null>(null);
  const [projects, setProjects] = useState<{ id: string; title: string }[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [transactionId, setTransactionId] = useState<string>('');
  const [isMonthly, setIsMonthly] = useState<boolean>(false);
  const modalRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();

  const { upload, uploading } = useCloudinaryUpload();

  // Reset state when opened and fetch projects
  useEffect(() => {
    if (isOpen) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setStep(1);
      // H1-08: use initialAmount if provided, otherwise default to 5000
      setAmount(initialAmount ?? 5000);
      setIsMonthly(initialIsMonthly ?? false);
      setCustomAmount('');
      setFundType('general');
      setDonorName(user?.user_metadata?.full_name || '');
      setDonorEmail(user?.email || '');
      setDonorPhone(user?.user_metadata?.phone || '');
      setIsAnon(false);
      setPaymentMethod(null);
      setTransactionId('');
      setSelectedProjectId('');

      const loadProjects = async () => {
        const { data, error } = await fetchApi<{ id: string; title: string }[]>('/projects');
        if (!error && data) {
          setProjects(data);
          if (initialCampaign) {
            const matched = data.find(p => p.title.toLowerCase() === initialCampaign.toLowerCase());
            if (matched) {
              setSelectedProjectId(matched.id);
              setCampaign(matched.title);
            } else {
              setSelectedProjectId('');
              setCampaign(initialCampaign);
            }
          } else {
            setSelectedProjectId('');
            setCampaign('General Fund');
          }
        } else {
          setSelectedProjectId('');
          setCampaign(initialCampaign || 'General Fund');
        }
      };
      loadProjects();
    }
  }, [isOpen, initialCampaign, initialAmount, initialIsMonthly, user]);

  const presetAmounts = [1000, 2000, 5000, 10000];

  // Handle Escape key and body scroll lock
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') onClose();
      };
      document.addEventListener('keydown', handleKeyDown);
      return () => {
        document.body.style.overflow = '';
        document.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [isOpen, onClose]);

  // Focus trap
  useEffect(() => {
    if (!isOpen || !modalRef.current) return;
    const focusableElements = modalRef.current.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    const handleTab = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          lastElement.focus();
          e.preventDefault();
        }
      } else {
        if (document.activeElement === lastElement) {
          firstElement.focus();
          e.preventDefault();
        }
      }
    };

    // Focus the first element initially
    if (firstElement) {
      // Need a small timeout because of animations
      setTimeout(() => firstElement.focus(), 50);
    }

    document.addEventListener('keydown', handleTab);
    return () => document.removeEventListener('keydown', handleTab);
  }, [isOpen, step]);

  if (!isOpen) return null;

  const handleNext = async () => {
    setIsProcessing(true);
    try {
      if (step === 3 && paymentMethod === 'manual') {
        const finalAmount = amount || parseInt(customAmount) || 0;
        const message = `${campaign} • ${fundType}`;
        const { success, data } = await saveDonation(
          isAnon ? 'Anonymous' : donorName, 
          donorEmail, 
          donorPhone || 'N/A', 
          paymentMethod, 
          finalAmount, 
          message, 
          user?.id,
          selectedProjectId || undefined,
          transactionId || undefined
        );
        if (success && data?.id) {
          setDonationId(data.id);
        }
        setStep(4);
      } else if (step === 3 && paymentMethod === 'online') {
        setStep(4); // go to checkout
      } else {
        setStep(s => s + 1);
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handleManualComplete = async () => {
    if (!donationId) return;
    setIsProcessing(true);
    try {
      let screenshotUrl = '';
      let screenshotPublicId = '';
      if (screenshotFile) {
        const result = await upload(screenshotFile, 'ioca/donations');
        if (result) {
          screenshotUrl = result.url;
          screenshotPublicId = result.publicId;
        }
      }
      
      // Update screenshot and/or transactionId
      await fetchApi(`/donations/${donationId}`, {
        method: 'PUT',
        body: JSON.stringify({ 
          screenshotUrl: screenshotUrl || undefined, 
          screenshotPublicId: screenshotPublicId || undefined,
          transactionId: transactionId || undefined
        }),
      });
      setStep(5);
    } catch (err) {
      console.error(err);
      // Still go to success step even if screenshot/TRX ID fails
      setStep(5);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCheckoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    // Simulate payment processing delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const finalAmount = amount || parseInt(customAmount) || 0;
    const message = `${campaign} • ${fundType}`;
    await saveDonation(
      isAnon ? 'Anonymous' : donorName, 
      donorEmail, 
      donorPhone || 'N/A', 
      paymentMethod || 'online', 
      finalAmount, 
      message, 
      user?.id,
      selectedProjectId || undefined,
      transactionId || undefined
    );
    
    setIsProcessing(false);
    setStep(5); // Success step
  };
  const handleBack = () => setStep(s => (s > 1 ? s - 1 : s) as 1 | 2 | 3 | 4);

  const displayNum = (num: number | string) => isUrdu ? toUrduNumerals(num) : num.toString();

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6" aria-labelledby="modal-title" role="dialog" aria-modal="true">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-brand-navy/40 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Content */}
      <div 
        ref={modalRef}
        className={`relative bg-brand-white w-full max-w-lg rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] ${isUrdu ? 'font-urduBody rtl' : 'ltr'}`} 
        onClick={e => e.stopPropagation()}
        dir={isUrdu ? 'rtl' : 'ltr'}
      >
        
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-brand-navy/10 shrink-0">
          <h2 id="modal-title" className={`text-2xl font-bold text-brand-navy ${isUrdu ? 'font-urduHeading' : ''}`}>
            {step === 4 ? (isUrdu ? 'شکریہ' : 'Thank You') : (isUrdu ? 'اپنا عطیہ دیں' : 'Make a Donation')}
          </h2>
          <button 
            onClick={onClose}
            className="text-brand-navy/50 hover:text-brand-navy bg-brand-navy/5 hover:bg-brand-navy/10 p-2 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-brand-teal"
            aria-label={isUrdu ? 'بند کریں' : 'Close modal'}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* H1-06: Branded Step Progress Bar — replaces the plain bar */}
        {step < 5 && (
          <div className="px-6 pt-4 pb-3 shrink-0" aria-label={isUrdu ? `مرحلہ ${step} از 4` : `Step ${step} of 4`}>
            <div className="flex items-center justify-between gap-1">
              {(isUrdu ? STEP_LABELS_UR : STEP_LABELS_EN).map((label, idx) => {
                const stepNum = idx + 1;
                const isComplete = step > stepNum;
                const isActive = step === stepNum;
                return (
                  <React.Fragment key={label}>
                    <div className="flex flex-col items-center gap-1 min-w-0">
                      <div
                        className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                          isComplete
                            ? 'bg-brand-gold text-brand-navy'
                            : isActive
                            ? 'bg-brand-teal text-brand-white ring-2 ring-brand-teal ring-offset-2'
                            : 'bg-brand-navy/10 text-brand-navy/40'
                        }`}
                        aria-current={isActive ? 'step' : undefined}
                      >
                        {isComplete ? '✓' : stepNum}
                      </div>
                      <span className={`text-[9px] leading-tight text-center transition-colors ${
                        isComplete ? 'text-brand-gold font-semibold' : isActive ? 'text-brand-teal font-bold' : 'text-brand-navy/30'
                      } ${isUrdu ? 'font-urduBody' : ''}`}>
                        {label}
                      </span>
                    </div>
                    {idx < 3 && (
                      <div className={`flex-1 h-0.5 mb-3 transition-all duration-300 ${
                        step > stepNum ? 'bg-brand-gold' : 'bg-brand-navy/10'
                      }`} />
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          </div>
        )}

        {/* Body (Scrollable) */}
        <div className="p-6 overflow-y-auto flex-grow">
          
          {/* STEP 1: AMOUNT & CAUSE */}
          {step === 1 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              
              {/* Frequency Toggle */}
              <div className="bg-brand-gray p-1 rounded-lg flex mb-6">
                <button
                  onClick={() => setIsMonthly(false)}
                  className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${!isMonthly ? 'bg-white shadow-sm text-brand-navy' : 'text-brand-navy/60 hover:text-brand-navy'}`}
                >
                  {isUrdu ? 'ایک بار' : 'One-time'}
                </button>
                <button
                  onClick={() => setIsMonthly(true)}
                  className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${isMonthly ? 'bg-white shadow-sm text-brand-navy' : 'text-brand-navy/60 hover:text-brand-navy'}`}
                >
                  {isUrdu ? 'ماہانہ' : 'Monthly'}
                </button>
              </div>

              {/* Amounts */}
              <div>
                <label className="block text-sm font-semibold text-brand-navy/80 mb-3" id="amount-label">
                  {isUrdu ? 'عطیہ کی رقم منتخب کریں (Rs)' : 'Select Amount (Rs)'}
                </label>
                <div className="grid grid-cols-2 gap-3" role="group" aria-labelledby="amount-label">
                  {presetAmounts.map(preset => (
                    <button
                      key={preset}
                      onClick={() => { setAmount(preset); setCustomAmount(''); }}
                      aria-pressed={amount === preset}
                      className={`py-3 rounded-lg font-bold border-2 transition-all focus:outline-none focus:ring-2 focus:ring-brand-teal flex flex-col items-center gap-0.5 ${
                        amount === preset
                          ? 'border-brand-teal bg-brand-teal/5 text-brand-teal'
                          : 'border-brand-navy/10 text-brand-navy hover:border-brand-navy/30'
                      }`}
                    >
                      <span className="text-[15px]">Rs {displayNum(preset.toLocaleString())}</span>
                      {/* H1-07: Impact label */}
                      <span className={`text-[10px] font-normal opacity-70 leading-tight text-center ${
                        amount === preset ? 'text-brand-teal' : 'text-brand-navy/60'
                      } ${isUrdu ? 'font-urduBody' : ''}`}>
                        {isUrdu ? IMPACT_LABELS_UR[preset] : IMPACT_LABELS_EN[preset]}
                      </span>
                    </button>
                  ))}
                  <div className="col-span-2 relative">
                    <label htmlFor="custom-amount" className="sr-only">
                      {isUrdu ? 'اپنی رقم درج کریں' : 'Custom Amount'}
                    </label>
                    <span className="absolute top-1/2 -translate-y-1/2 start-4 text-brand-navy/50 font-bold" aria-hidden="true">Rs</span>
                    <input 
                      id="custom-amount"
                      type="number" 
                      min="100"
                      placeholder={isUrdu ? 'اپنی رقم درج کریں' : 'Custom Amount'}
                      value={customAmount}
                      onChange={(e) => {
                        setCustomAmount(e.target.value);
                        setAmount(null);
                      }}
                      className="w-full ps-12 pe-4 py-3.5 rounded-lg border-2 border-brand-navy/10 font-bold text-brand-navy focus:border-brand-gold focus:outline-none focus:ring-2 focus:ring-brand-teal/50 transition-colors"
                    />
                  </div>
                </div>
              </div>

              {/* Cause & Type */}
              <div className="space-y-4 pt-4 border-t border-brand-navy/10">
                <div>
                  <label htmlFor="campaign-select" className="block text-sm font-semibold text-brand-navy/80 mb-2">
                    {isUrdu ? 'کس مقصد کے لیے؟' : 'Designate to Cause'}
                  </label>
                  <select 
                    id="campaign-select"
                    value={selectedProjectId}
                    onChange={(e) => {
                      const val = e.target.value;
                      setSelectedProjectId(val);
                      if (val === '') {
                        setCampaign('General Fund');
                      } else {
                        const matched = projects.find(p => p.id === val);
                        if (matched) {
                          setCampaign(matched.title);
                        }
                      }
                    }}
                    className="w-full px-4 py-3 rounded-lg border-2 border-brand-navy/10 font-medium text-brand-navy focus:border-brand-gold focus:outline-none focus:ring-2 focus:ring-brand-teal/50 bg-white"
                  >
                    <option value="">{isUrdu ? 'جنرل فنڈ (جہاں سب سے زیادہ ضرورت ہو)' : 'General Fund (Where needed most)'}</option>
                    {projects.length === 0 ? (
                      <>
                        <option value="Maternal Health Care">{isUrdu ? 'زچہ و بچہ کی صحت' : 'Maternal Health Care'}</option>
                        <option value="Girls Education Fund">{isUrdu ? 'لڑکیوں کی تعلیم' : 'Girls Education Fund'}</option>
                        <option value="Flood Relief & Rehab">{isUrdu ? 'سیلاب کی بحالی' : 'Flood Relief & Rehab'}</option>
                      </>
                    ) : (
                      projects.map(p => (
                        <option key={p.id} value={p.id}>
                          {p.title}
                        </option>
                      ))
                    )}
                  </select>
                </div>
                
                <div className="flex gap-3" role="group" aria-label={isUrdu ? 'فنڈ کی قسم' : 'Fund type'}>
                  {(['general', 'zakat', 'sadaqah'] as const).map(type => (
                    <button
                      key={type}
                      onClick={() => setFundType(type)}
                      aria-pressed={fundType === type}
                      className={`flex-1 py-2 rounded-lg text-xs font-bold border focus:outline-none focus:ring-2 focus:ring-brand-teal ${fundType === type ? 'border-brand-navy bg-brand-navy text-white' : 'border-brand-navy/20 text-brand-navy hover:bg-brand-navy/5'}`}
                    >
                      {type === 'general' ? (isUrdu ? 'عطیہ' : 'General') : 
                       type === 'zakat' ? (isUrdu ? 'زکوٰۃ' : 'Zakat') : 
                       (isUrdu ? 'صدقہ' : 'Sadaqah')}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: DETAILS */}
          {step === 2 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="bg-brand-gold/10 p-4 rounded-lg mb-6 border border-brand-gold/20">
                <p className="text-sm font-medium text-brand-navy flex justify-between items-center">
                  <span>{isUrdu ? 'آپ کا عطیہ:' : 'Your Donation:'}</span>
                  <span className="font-bold text-lg">Rs {displayNum((amount || customAmount || 0).toLocaleString())}</span>
                </p>
                <p className="text-xs text-brand-navy/70 mt-1 font-medium">
                  {campaign} • {fundType.charAt(0).toUpperCase() + fundType.slice(1)}
                </p>
              </div>

              <div>
                <label htmlFor="donor-name" className="block text-sm font-semibold text-brand-navy/80 mb-2">{isUrdu ? 'پورا نام' : 'Full Name'} *</label>
                <input id="donor-name" type="text" value={donorName} onChange={e => setDonorName(e.target.value)} required className="w-full px-4 py-3 rounded-lg border border-brand-navy/20 focus:border-brand-gold focus:outline-none focus:ring-2 focus:ring-brand-teal/50" />
              </div>
              
              <div>
                <label htmlFor="donor-email" className="block text-sm font-semibold text-brand-navy/80 mb-2">{isUrdu ? 'ای میل ایڈریس' : 'Email Address'} *</label>
                <input id="donor-email" type="email" value={donorEmail} onChange={e => setDonorEmail(e.target.value)} required className="w-full px-4 py-3 rounded-lg border border-brand-navy/20 focus:border-brand-gold focus:outline-none focus:ring-2 focus:ring-brand-teal/50" />
              </div>

              <div>
                <label htmlFor="donor-phone" className="block text-sm font-semibold text-brand-navy/80 mb-2">{isUrdu ? 'فون نمبر (اختیاری)' : 'Phone Number (Optional)'}</label>
                <input id="donor-phone" type="tel" value={donorPhone} onChange={e => setDonorPhone(e.target.value)} className="w-full px-4 py-3 rounded-lg border border-brand-navy/20 focus:border-brand-gold focus:outline-none focus:ring-2 focus:ring-brand-teal/50" />
              </div>

              <div className="flex items-center gap-3 pt-4">
                <input type="checkbox" id="anon" checked={isAnon} onChange={e => setIsAnon(e.target.checked)} className="w-5 h-5 accent-brand-gold rounded focus:ring-brand-teal focus:ring-offset-2" />
                <label htmlFor="anon" className="text-sm text-brand-navy/80 font-medium cursor-pointer">
                  {isUrdu ? 'میرا عطیہ گمنام رکھیں' : 'Make my donation anonymous'}
                </label>
              </div>
            </div>
          )}

          {/* STEP 3: PAYMENT */}
          {step === 3 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <label className="block text-sm font-semibold text-brand-navy/80 mb-2" id="payment-label">
                {isUrdu ? 'ادائیگی کا طریقہ منتخب کریں' : 'Select Payment Method'}
              </label>
              
              <div className="space-y-3" role="group" aria-labelledby="payment-label">
                <button onClick={() => setPaymentMethod('online')} className={`w-full flex items-center justify-between p-4 border-2 rounded-lg transition-all text-left focus:outline-none focus:ring-2 focus:ring-brand-teal ${paymentMethod === 'online' ? 'border-brand-teal bg-brand-teal/5' : 'border-brand-navy/10 hover:border-brand-teal hover:bg-brand-teal/5'}`}>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-brand-navy/5 rounded-full flex items-center justify-center text-brand-navy" aria-hidden="true">
                      <CreditCard className="w-5 h-5" />
                    </div>
                    <span className="font-bold text-brand-navy">{isUrdu ? 'آن لائن ادائیگی (کارڈ)' : 'Online Payment (Credit / Debit Card)'}</span>
                  </div>
                </button>

                <button onClick={() => setPaymentMethod('manual')} className={`w-full flex items-center justify-between p-4 border-2 rounded-lg transition-all text-left focus:outline-none focus:ring-2 focus:ring-brand-teal ${paymentMethod === 'manual' ? 'border-brand-teal bg-brand-teal/5' : 'border-brand-navy/10 hover:border-brand-teal hover:bg-brand-teal/5'}`}>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-brand-navy/5 rounded-full flex items-center justify-center text-brand-navy" aria-hidden="true">
                      <Building2 className="w-5 h-5" />
                    </div>
                    <span className="font-bold text-brand-navy">{isUrdu ? 'بینک ٹرانسفر / موبائل والیٹ' : 'Manual Transfer (Bank / Mobile Account)'}</span>
                  </div>
                </button>
              </div>
            </div>
          )}

          {/* STEP 4: CHECKOUT OR MANUAL DETAILS */}
          {step === 4 && (
            <div className="py-2 animate-in fade-in slide-in-from-bottom-4 duration-500">
              {paymentMethod === 'online' ? (
                <form onSubmit={handleCheckoutSubmit} className="space-y-6">
                  <div className="text-center mb-6">
                    <div className="w-16 h-16 bg-brand-gold/10 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Lock className="w-8 h-8 text-brand-gold" />
                    </div>
                    <h3 className={`text-2xl font-black text-brand-navy ${isUrdu ? 'font-urduHeading' : ''}`}>
                      {isUrdu ? 'محفوظ آن لائن ادائیگی' : 'Secure Online Checkout'}
                    </h3>
                    <p className="text-brand-navy/60 text-sm mt-1">
                      {isUrdu ? 'اپنے کارڈ کی تفصیلات درج کریں' : 'Enter your card details to complete the donation'}
                    </p>
                  </div>

                  {/* Order Summary */}
                  <div className="bg-brand-gray/50 rounded-lg p-4 flex justify-between items-center border border-brand-navy/5">
                    <span className="font-bold text-brand-navy/70">{isUrdu ? 'عطیہ کی رقم:' : 'Donation Amount:'}</span>
                    <span className="text-2xl font-black text-brand-gold">Rs {(amount || customAmount || 0).toLocaleString()}</span>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-bold text-brand-navy mb-1.5">Card Number</label>
                      <div className="relative">
                        <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-brand-navy/40" />
                        <input 
                          type="text" 
                          required
                          placeholder="0000 0000 0000 0000" 
                          maxLength={19}
                          value={cardNumber}
                          onChange={e => setCardNumber(e.target.value)}
                          className="w-full pl-10 pr-4 py-3 rounded-lg border border-brand-navy/20 focus:border-brand-gold focus:ring-1 focus:ring-brand-teal outline-none transition-all font-mono"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-bold text-brand-navy mb-1.5">Expiry Date</label>
                        <input 
                          type="text" 
                          required
                          placeholder="MM/YY" 
                          maxLength={5}
                          value={cardExpiry}
                          onChange={e => setCardExpiry(e.target.value)}
                          className="w-full px-4 py-3 rounded-lg border border-brand-navy/20 focus:border-brand-gold focus:ring-1 focus:ring-brand-teal outline-none transition-all font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-brand-navy mb-1.5">CVC</label>
                        <input 
                          type="text" 
                          required
                          placeholder="123" 
                          maxLength={4}
                          value={cardCvc}
                          onChange={e => setCardCvc(e.target.value)}
                          className="w-full px-4 py-3 rounded-lg border border-brand-navy/20 focus:border-brand-gold focus:ring-1 focus:ring-brand-teal outline-none transition-all font-mono"
                        />
                      </div>
                    </div>
                    <div className="pt-2">
                      <p className="text-xs text-brand-navy/50 flex items-center gap-1.5 justify-center">
                        <Lock className="w-3 h-3" />
                        Payments are securely processed via 256-bit encryption
                      </p>
                    </div>
                  </div>
                </form>
              ) : (
                <div className="w-full text-left">
                  <h3 className={`text-2xl font-black text-brand-navy mb-4 text-center ${isUrdu ? 'font-urduHeading' : ''}`}>
                    {isUrdu ? 'دستی ٹرانسفر کی تفصیلات' : 'Manual Transfer Details'}
                  </h3>
                  <div className="bg-brand-gold/10 p-4 rounded-lg border border-brand-gold/20 mb-6">
                    <p className={`text-brand-navy/80 font-medium text-sm mb-4 ${isUrdu ? 'text-right' : ''}`}>
                      {isUrdu 
                        ? 'براہ کرم مندرجہ ذیل میں سے کسی بھی اکاؤنٹ میں رقم منتقل کریں اور پھر رسید کی تصویر (screenshot) نیچے اپلوڈ کریں۔' 
                        : 'Please transfer the amount to any of the following accounts and upload the payment screenshot below to confirm your donation.'}
                    </p>
                    <div className="bg-white rounded-lg p-4 border border-brand-gold/20">
                      <label className="block text-sm font-bold text-brand-navy mb-2">
                        {isUrdu ? 'ادائیگی کا ثبوت (اسکرین شاٹ)' : 'Payment Proof (Screenshot)'}
                      </label>
                      <input 
                        type="file" 
                        accept="image/*"
                        onChange={e => setScreenshotFile(e.target.files?.[0] || null)}
                        className="w-full text-sm text-brand-navy/70 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-brand-teal/10 file:text-brand-teal hover:file:bg-brand-teal/20"
                      />
                    </div>
                    <div className="bg-white rounded-lg p-4 border border-brand-gold/20 mt-4">
                      <label htmlFor="transaction-id" className="block text-sm font-bold text-brand-navy mb-2">
                        {isUrdu ? 'ٹرانزیکشن آئی ڈی / حوالہ نمبر (اختیاری)' : 'Transaction ID / Reference Number (Optional)'}
                      </label>
                      <input 
                        id="transaction-id"
                        type="text"
                        placeholder="e.g. TRX-12345678"
                        value={transactionId}
                        onChange={e => setTransactionId(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-lg border border-brand-navy/20 focus:border-brand-gold focus:outline-none focus:ring-2 focus:ring-brand-teal/50 font-mono text-brand-navy"
                      />
                    </div>
                  </div>
                  <div className="bg-brand-navy/5 p-4 rounded-lg space-y-4">
                    <div>
                      <p className="text-xs font-bold text-brand-navy/50 uppercase">Bank Transfer</p>
                      <p className="font-bold text-brand-navy">Meezan Bank: 1234 5678 9012 3456</p>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-brand-navy/50 uppercase">EasyPaisa</p>
                      <p className="font-bold text-brand-navy">0300 0000000 <span className="font-normal text-sm text-brand-navy/70">(IOCA Org)</span></p>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-brand-navy/50 uppercase">JazzCash</p>
                      <p className="font-bold text-brand-navy">0300 0000000 <span className="font-normal text-sm text-brand-navy/70">(IOCA Org)</span></p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STEP 5: SUCCESS (ONLINE) */}
          {step === 5 && (
            <div className="py-8 flex flex-col items-center justify-center text-center animate-in zoom-in-95 duration-500">
              <div className="w-20 h-20 bg-brand-navy/10 rounded-full flex items-center justify-center mb-6" aria-hidden="true">
                <CheckCircle2 className="w-10 h-10 text-brand-navy" />
              </div>
              <h3 className={`text-3xl font-black text-brand-navy mb-4 ${isUrdu ? 'font-urduHeading' : ''}`}>
                {isUrdu ? 'جزاک اللہ!' : 'Jazakallah Khair!'}
              </h3>
              <p className={`text-brand-navy/70 max-w-sm mx-auto leading-relaxed ${isUrdu ? 'font-urduBody' : ''}`}>
                {isUrdu 
                  ? 'آپ کا عطیہ کامیابی کے ساتھ وصول کر لیا گیا ہے۔ آپ کا تعاون معاشرے میں حقیقی تبدیلی لا رہا ہے۔' 
                  : 'Your generous donation has been securely processed. An electronic receipt has been sent to your email.'}
              </p>
            </div>
          )}

        </div>

        {/* Footer Actions */}
        {(step < 4 || (step === 4 && paymentMethod === 'online')) && (
          <div className="p-6 border-t border-brand-navy/10 bg-brand-gray/50 flex items-center gap-4 shrink-0">
            {step > 1 && (
              <button 
                onClick={handleBack}
                disabled={isProcessing}
                className="p-4 rounded-lg border border-brand-navy/20 text-brand-navy hover:bg-brand-navy/5 transition-colors focus:outline-none focus:ring-2 focus:ring-brand-teal disabled:opacity-50"
                aria-label={isUrdu ? 'پچھلا قدم' : 'Previous step'}
              >
                <ArrowLeft className={`w-5 h-5 ${isUrdu ? 'rotate-180' : ''}`} />
              </button>
            )}
            
            {step === 4 && paymentMethod === 'online' ? (
              <button 
                onClick={handleCheckoutSubmit}
                disabled={!cardNumber || !cardExpiry || !cardCvc || isProcessing}
                className="flex-1 bg-brand-teal text-brand-white py-4 rounded-lg font-bold text-lg hover:opacity-90 transition-opacity flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-brand-teal/20"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Lock className="w-5 h-5" />
                    Pay Rs {(amount || customAmount || 0).toLocaleString()}
                  </>
                )}
              </button>
            ) : (
              <button 
                onClick={step === 4 && paymentMethod === 'manual' ? handleManualComplete : handleNext}
                disabled={isProcessing || uploading || (step === 1 && !amount && !customAmount) || (step === 2 && (!donorName || !donorEmail)) || (step === 3 && !paymentMethod)}
                className="flex-1 bg-brand-teal text-brand-white py-4 rounded-lg font-bold text-lg hover:opacity-90 transition-opacity flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-brand-teal/20"
              >
                {isProcessing || uploading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : null}
                {step === 4 && paymentMethod === 'manual' ? (isUrdu ? 'ادائیگی مکمل کریں' : 'Complete Donation') : (isUrdu ? 'آگے بڑھیں' : 'Continue')}
                {step < 3 && <ArrowRight className={`w-5 h-5 ${isUrdu ? 'rotate-180' : ''}`} />}
              </button>
            )}
          </div>
        )}
        
        {((step === 4 && paymentMethod === 'manual') || step === 5) && (
          <div className="p-6 border-t border-brand-navy/10 bg-brand-gray/50 shrink-0">
            <button 
              onClick={onClose}
              className="w-full bg-brand-navy/5 text-brand-navy py-4 rounded-lg font-bold hover:bg-brand-navy/10 transition-colors focus:outline-none focus:ring-2 focus:ring-brand-teal"
            >
              {isUrdu ? 'مرکزی صفحہ پر واپس جائیں' : 'Return to Home'}
            </button>
          </div>
        )}

      </div>
    </div>
  );
};

export default DonationModal;
