import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { CheckCircle2, Shield, AlertCircle, Upload, Users, Star } from 'lucide-react';
import { fetchApi } from '../lib/apiClient';
import { useCloudinaryUpload } from '../hooks/useCloudinaryUpload';

interface MembershipProps {
  isUrdu: boolean;
}

interface InputFieldProps {
  id: string;
  name: string;
  label: string;
  type?: string;
  required?: boolean;
  placeholder: string;
  value: string;
  error?: string;
  isUrdu: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
}

const InputField: React.FC<InputFieldProps> = ({ id, name, label, type = 'text', required = false, placeholder, value, error, isUrdu, onChange }) => (
  <div>
    <label htmlFor={id} className={`block text-sm font-medium text-brand-navy mb-1.5 ${isUrdu ? 'font-urduBody' : ''}`}>
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    <input
      id={id}
      name={name}
      type={type}
      required={required}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className={`w-full px-4 py-3 rounded-xl border ${error ? 'border-red-400 bg-red-50' : 'border-brand-navy/10 bg-brand-gray'} focus:outline-none focus:border-brand-teal focus:ring-1 focus:ring-brand-teal/20 transition-all text-sm`}
    />
    {error && <p className="text-red-500 text-xs mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{error}</p>}
  </div>
);

const SectionHeader: React.FC<{ label: string; isUrdu: boolean }> = ({ label, isUrdu }) => (
  <div className="flex items-center gap-3 pt-2">
    <div className="h-px flex-1 bg-brand-navy/10" />
    <span className={`text-xs font-bold text-brand-navy/40 uppercase tracking-wider whitespace-nowrap ${isUrdu ? 'font-urduBody' : ''}`}>{label}</span>
    <div className="h-px flex-1 bg-brand-navy/10" />
  </div>
);

const MembershipApplication: React.FC<MembershipProps> = ({ isUrdu }) => {
  // useAuth removed because user is unused, or we can just omit it
  const { upload, uploading } = useCloudinaryUpload();

  const [formData, setFormData] = useState({
    fullName: '',
    fatherName: '',
    email: '',
    phone: '',
    cnic: '',
    address: '',
    occupation: '',
    zoneId: '',
    tierId: '',
    motivation: '',
    profileImageUrl: '',
    agreeTerms: false,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const [zones, setZones] = useState<any[]>([]);
  const [tiers, setTiers] = useState<any[]>([]);

  useEffect(() => {
    fetchApi<any[]>('/zones').then(res => setZones(res.data || []));
    fetchApi<any[]>('/tiers').then(res => setTiers(res.data || []));
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.fullName.trim()) newErrors.fullName = isUrdu ? 'نام ضروری ہے' : 'Full name is required';
    if (!formData.fatherName.trim()) newErrors.fatherName = isUrdu ? 'والد کا نام ضروری ہے' : 'Father name is required';
    if (!formData.email.trim()) newErrors.email = isUrdu ? 'ای میل ضروری ہے' : 'Email is required';
    else if (!/^\S+@\S+\.\S+$/.test(formData.email)) newErrors.email = isUrdu ? 'درست ای میل درج کریں' : 'Valid email is required';
    if (!formData.profileImageUrl) newErrors.profileImageUrl = isUrdu ? 'پروفائل تصویر ضروری ہے' : 'Profile image is required';
    if (!formData.phone.trim()) newErrors.phone = isUrdu ? 'فون نمبر ضروری ہے' : 'Phone is required';
    if (!formData.cnic.trim()) newErrors.cnic = isUrdu ? 'شناختی کارڈ نمبر ضروری ہے' : 'CNIC is required';
    else if (!/^\d{5}-?\d{7}-?\d{1}$/.test(formData.cnic.replace(/\s/g, ''))) newErrors.cnic = isUrdu ? '13 ہندسوں کا درست شناختی کارڈ نمبر درج کریں' : 'Enter a valid 13-digit CNIC (e.g. 12345-1234567-1)';
    if (!formData.address.trim()) newErrors.address = isUrdu ? 'پتہ ضروری ہے' : 'Address is required';
    if (!formData.occupation.trim()) newErrors.occupation = isUrdu ? 'پیشہ ضروری ہے' : 'Occupation is required';
    if (!formData.zoneId) newErrors.zoneId = isUrdu ? 'زون منتخب کریں' : 'Please select a zone';
    if (!formData.tierId) newErrors.tierId = isUrdu ? 'میمبرشپ ٹئیر منتخب کریں' : 'Please select a membership tier';
    if (!formData.agreeTerms) newErrors.agreeTerms = isUrdu ? 'شرائط سے اتفاق ضروری ہے' : 'You must agree to the terms';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setIsSubmitting(true);
    setSubmitError('');

    try {
      const { error } = await fetchApi('/misc/applications', {
        method: 'POST',
        body: JSON.stringify(formData),
      });

      if (error) throw new Error(error);
      setIsSubmitted(true);
    } catch (err: any) {
      setSubmitError(err.message || (isUrdu ? 'کچھ غلط ہو گیا۔ دوبارہ کوشش کریں۔' : 'Something went wrong. Please try again.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const benefits = [
    { icon: Users, titleEn: 'Join the Community', titleUr: 'کمیونٹی میں شامل ہوں', descEn: 'Connect with a vast network of changemakers.', descUr: 'تبدیلی پسندوں کے وسیع نیٹ ورک سے جڑیں۔' },
    { icon: Shield, titleEn: 'Voting Rights', titleUr: 'ووٹ دینے کا حق', descEn: 'Participate in our core decision-making.', descUr: 'ہمارے اہم فیصلوں میں حصہ لیں۔' },
    { icon: Star, titleEn: 'Special Access', titleUr: 'خصوصی رسائی', descEn: 'Get exclusive updates and invitations.', descUr: 'خصوصی اپ ڈیٹس اور دعوت نامے حاصل کریں۔' },
  ];

  return (
    <>
      <Helmet>
        <title>{isUrdu ? 'میمبر بنیں | IOCA' : 'Become a Member | IOCA'}</title>
        <meta name="description" content="Apply for an official membership at IOCA and become a part of our core team." />
      </Helmet>

      <div className="pt-32 pb-16 md:pt-40 md:pb-24">
        <div className="max-w-7xl mx-auto px-4 md:px-16">
          <motion.div
            className="mb-12 text-center md:text-left"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className={`text-4xl md:text-6xl font-extrabold text-brand-navy mb-4 ${isUrdu ? 'font-urduHeading' : ''}`}>
              {isUrdu ? 'ممبر بنیں' : 'Become a Member'}
            </h1>
            <p className={`text-brand-navy/60 text-base md:text-lg max-w-2xl mx-auto md:mx-0 ${isUrdu ? 'font-urduBody' : ''}`}>
              {isUrdu
                ? 'IOCA کے باقاعدہ ممبر بنیں اور فیصلہ سازی میں حصہ لیں۔ ہم مل کر بڑا اثر پیدا کر سکتے ہیں۔'
                : 'Become an official IOCA member and participate in decision-making. Together we can create a larger impact.'}
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
            {benefits.map((b, idx) => {
              const Icon = b.icon;
              return (
                <motion.div
                  key={idx}
                  className="bg-brand-white rounded-2xl p-5 border border-brand-navy/5 text-center hover:shadow-lg transition-shadow"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: idx * 0.08 }}
                >
                  <div className="w-12 h-12 rounded-xl bg-brand-teal/10 flex items-center justify-center mx-auto mb-4">
                    <Icon className="w-6 h-6 text-brand-teal" />
                  </div>
                  <h3 className={`font-bold text-brand-navy text-lg mb-2 ${isUrdu ? 'font-urduHeading' : ''}`}>
                    {isUrdu ? b.titleUr : b.titleEn}
                  </h3>
                  <p className={`text-sm text-brand-navy/60 ${isUrdu ? 'font-urduBody' : ''}`}>
                    {isUrdu ? b.descUr : b.descEn}
                  </p>
                </motion.div>
              );
            })}
          </div>

          <motion.div
            className="max-w-3xl mx-auto bg-brand-white rounded-xl p-8 md:p-12 shadow-xl"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            {isSubmitted ? (
              <div className="flex flex-col items-center justify-center text-center py-12">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                  <CheckCircle2 className="w-8 h-8 text-green-600" />
                </div>
                <h3 className={`text-2xl font-bold text-brand-navy mb-2 ${isUrdu ? 'font-urduHeading' : ''}`}>
                  {isUrdu ? 'شکریہ! آپ کی درخواست موصول ہو گئی ہے۔' : 'Thank You! Your Application Has Been Received.'}
                </h3>
                <p className={`text-brand-navy/60 mb-6 max-w-md ${isUrdu ? 'font-urduBody' : ''}`}>
                  {isUrdu
                    ? 'ہماری ٹیم آپ کی ممبرشپ درخواست کا جائزہ لے گی۔'
                    : 'Our team will review your membership application and get back to you shortly.'}
                </p>
                <button
                  onClick={() => {
                    setIsSubmitted(false);
                    setFormData({
                      fullName: '', fatherName: '', email: '', phone: '', cnic: '', address: '', occupation: '',
                      zoneId: '', tierId: '', motivation: '', profileImageUrl: '', agreeTerms: false
                    });
                  }}
                  className="text-brand-teal font-medium hover:underline text-sm"
                >
                  {isUrdu ? 'ایک اور درخواست بھیجیں' : 'Submit another application'}
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <h2 className={`text-2xl font-bold text-brand-navy mb-6 ${isUrdu ? 'font-urduHeading' : ''}`}>
                  {isUrdu ? 'میمبرشپ فارم' : 'Membership Application'}
                </h2>

                <SectionHeader label={isUrdu ? 'ذاتی معلومات' : 'Personal Information'} isUrdu={isUrdu} />

                <div className="grid grid-cols-2 gap-4">
                  <InputField id="mem-name" name="fullName" label={isUrdu ? 'پورا نام' : 'Full Name'} required placeholder={isUrdu ? 'آپ کا نام' : 'Your full name'} value={formData.fullName} error={errors.fullName} isUrdu={isUrdu} onChange={handleChange} />
                  <InputField id="mem-father-name" name="fatherName" label={isUrdu ? 'والد کا نام' : 'Father Name'} required placeholder={isUrdu ? 'والد کا نام' : 'Father name'} value={formData.fatherName} error={errors.fatherName} isUrdu={isUrdu} onChange={handleChange} />
                </div>
                
                <InputField id="mem-email" name="email" label={isUrdu ? 'ای میل' : 'Email Address'} type="email" required placeholder={isUrdu ? 'آپ کا ای میل' : 'Your email address'} value={formData.email} error={errors.email} isUrdu={isUrdu} onChange={handleChange} />

                <div className="grid grid-cols-2 gap-4">
                  <InputField id="mem-phone" name="phone" label={isUrdu ? 'فون نمبر' : 'Phone'} type="tel" required placeholder={isUrdu ? 'مثلاً 03001234567' : 'e.g. 03001234567'} value={formData.phone} error={errors.phone} isUrdu={isUrdu} onChange={handleChange} />
                  <InputField id="mem-cnic" name="cnic" label={isUrdu ? 'شناختی کارڈ نمبر' : 'CNIC Number'} required placeholder={isUrdu ? 'مثلاً 12345-1234567-1' : 'e.g. 12345-1234567-1'} value={formData.cnic} error={errors.cnic} isUrdu={isUrdu} onChange={handleChange} />
                </div>

                <div className="mb-4">
                  <label className={`block text-sm font-medium text-brand-navy mb-1.5 ${isUrdu ? 'font-urduBody' : ''}`}>
                    {isUrdu ? 'پروفائل تصویر' : 'Profile Image'} <span className="text-red-500">*</span>
                  </label>
                  <div className="flex items-center gap-4">
                    {formData.profileImageUrl ? (
                      <div className="relative w-16 h-16 rounded-xl overflow-hidden border border-brand-navy/10">
                        <img src={formData.profileImageUrl} alt="Profile" className="w-full h-full object-cover" />
                        <button type="button" onClick={() => setFormData(prev => ({ ...prev, profileImageUrl: '' }))} className="absolute inset-0 bg-black/50 text-white flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity text-xs">Remove</button>
                      </div>
                    ) : (
                      <div className="w-16 h-16 rounded-xl border border-dashed border-brand-navy/20 bg-brand-gray flex items-center justify-center text-brand-navy/40">
                        <Upload className="w-6 h-6" />
                      </div>
                    )}
                    <div className="flex-1">
                      <input
                        type="file"
                        accept="image/*"
                        id="mem-profile-image"
                        className="hidden"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            try {
                              const result = await upload(file, 'ioca/members');
                              if (result) {
                                setFormData(prev => ({ ...prev, profileImageUrl: result.url }));
                                if (errors.profileImageUrl) setErrors(prev => ({ ...prev, profileImageUrl: '' }));
                              }
                            } catch (err) {
                              console.error("Upload failed", err);
                            }
                          }
                        }}
                      />
                      <label htmlFor="mem-profile-image" className="inline-block px-4 py-2 bg-brand-navy/5 hover:bg-brand-navy/10 text-brand-navy text-sm font-medium rounded-lg cursor-pointer transition-colors">
                        {uploading ? (isUrdu ? 'اپ لوڈ ہو رہا ہے...' : 'Uploading...') : (isUrdu ? 'تصویر منتخب کریں' : 'Choose Image')}
                      </label>
                      {errors.profileImageUrl && <p className="text-red-500 text-xs mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.profileImageUrl}</p>}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <InputField id="mem-address" name="address" label={isUrdu ? 'پتہ' : 'Address'} required placeholder={isUrdu ? 'آپ کا پتہ' : 'Your address'} value={formData.address} error={errors.address} isUrdu={isUrdu} onChange={handleChange} />
                  <InputField id="mem-occupation" name="occupation" label={isUrdu ? 'پیشہ' : 'Occupation'} required placeholder={isUrdu ? 'آپ کا پیشہ' : 'Your occupation'} value={formData.occupation} error={errors.occupation} isUrdu={isUrdu} onChange={handleChange} />
                </div>

                <SectionHeader label={isUrdu ? 'میمبرشپ کی تفصیلات' : 'Membership Details'} isUrdu={isUrdu} />

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="mem-zone" className={`block text-sm font-medium text-brand-navy mb-1.5 ${isUrdu ? 'font-urduBody' : ''}`}>
                      {isUrdu ? 'زون' : 'Zone'} <span className="text-red-500">*</span>
                    </label>
                    <select
                      id="mem-zone"
                      name="zoneId"
                      required
                      value={formData.zoneId}
                      onChange={handleChange}
                      className={`w-full px-4 py-3 rounded-xl border ${errors.zoneId ? 'border-red-400 bg-red-50' : 'border-brand-navy/10 bg-brand-gray'} focus:outline-none focus:border-brand-teal transition-all text-sm`}
                    >
                      <option value="">{isUrdu ? 'زون منتخب کریں' : 'Select a zone'}</option>
                      {zones.map((zone: any) => (
                        <option key={zone.id} value={zone.id}>{zone.name} - {zone.city}</option>
                      ))}
                    </select>
                    {errors.zoneId && <p className="text-red-500 text-xs mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.zoneId}</p>}
                  </div>

                  <div>
                    <label htmlFor="mem-tier" className={`block text-sm font-medium text-brand-navy mb-1.5 ${isUrdu ? 'font-urduBody' : ''}`}>
                      {isUrdu ? 'میمبرشپ ٹئیر' : 'Membership Tier'} <span className="text-red-500">*</span>
                    </label>
                    <select
                      id="mem-tier"
                      name="tierId"
                      required
                      value={formData.tierId}
                      onChange={handleChange}
                      className={`w-full px-4 py-3 rounded-xl border ${errors.tierId ? 'border-red-400 bg-red-50' : 'border-brand-navy/10 bg-brand-gray'} focus:outline-none focus:border-brand-teal transition-all text-sm`}
                    >
                      <option value="">{isUrdu ? 'ٹئیر منتخب کریں' : 'Select a tier'}</option>
                      {tiers.map((tier: any) => (
                        <option key={tier.id} value={tier.id}>{tier.name} - PKR {tier.price}/year</option>
                      ))}
                    </select>
                    {errors.tierId && <p className="text-red-500 text-xs mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.tierId}</p>}
                  </div>
                </div>

                <div>
                  <label htmlFor="mem-motivation" className={`block text-sm font-medium text-brand-navy mb-1.5 ${isUrdu ? 'font-urduBody' : ''}`}>
                    {isUrdu ? 'میمبرشپ کی وجہ (اختیاری)' : 'Motivation (Optional)'}
                  </label>
                  <textarea
                    id="mem-motivation"
                    name="motivation"
                    rows={3}
                    value={formData.motivation}
                    onChange={handleChange}
                    placeholder={isUrdu ? 'آپ IOCA میں کیوں شامل ہونا چاہتے ہیں؟' : 'Why do you want to join IOCA?'}
                    className="w-full px-4 py-3 rounded-xl border border-brand-navy/10 bg-brand-gray focus:outline-none focus:border-brand-teal transition-all text-sm resize-none"
                  />
                </div>

                <div className="flex items-start gap-3">
                  <input
                    id="mem-terms"
                    name="agreeTerms"
                    type="checkbox"
                    checked={formData.agreeTerms}
                    onChange={handleChange}
                    className="w-4 h-4 mt-1 rounded border-brand-navy/20 text-brand-teal focus:ring-brand-teal/20"
                  />
                  <label htmlFor="mem-terms" className={`text-sm text-brand-navy/60 ${isUrdu ? 'font-urduBody' : ''}`}>
                    {isUrdu
                      ? 'میں IOCA کی شرائط و ضوابط سے اتفاق کرتا/کرتی ہوں۔'
                      : "I agree to IOCA's terms and conditions."}
                  </label>
                </div>
                {errors.agreeTerms && <p className="text-red-500 text-xs flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.agreeTerms}</p>}

                {submitError && (
                  <p className="text-red-500 text-sm text-center bg-red-50 border border-red-200 rounded-lg py-2 px-3">{submitError}</p>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-brand-teal text-brand-white font-bold py-4 rounded-xl text-lg hover:opacity-90 transition-opacity flex items-center justify-center gap-2 shadow-lg shadow-brand-teal/20 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  <Shield className="w-5 h-5" />
                  {isSubmitting
                    ? (isUrdu ? 'بھیج رہے ہیں...' : 'Submitting...')
                    : (isUrdu ? 'درخواست بھیجیں' : 'Submit Application')}
                </button>
              </form>
            )}
          </motion.div>
        </div>
      </div>
    </>
  );
};

export default MembershipApplication;
