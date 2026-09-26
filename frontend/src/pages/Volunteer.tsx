import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { Heart, CheckCircle2, Briefcase, Clock, Users, Shield, AlertCircle, Upload } from 'lucide-react';
import { fetchApi } from '../lib/apiClient';
import { useAuth } from '../hooks/useAuth';
import { useCloudinaryUpload } from '../hooks/useCloudinaryUpload';

interface VolunteerProps {
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

// Section divider with label
const SectionHeader: React.FC<{ label: string; isUrdu: boolean }> = ({ label, isUrdu }) => (
  <div className="flex items-center gap-3 pt-2">
    <div className="h-px flex-1 bg-brand-navy/10" />
    <span className={`text-xs font-bold text-brand-navy/40 uppercase tracking-wider whitespace-nowrap ${isUrdu ? 'font-urduBody' : ''}`}>{label}</span>
    <div className="h-px flex-1 bg-brand-navy/10" />
  </div>
);

const Volunteer: React.FC<VolunteerProps> = ({ isUrdu }) => {
  const { user } = useAuth();
  const { upload, uploading } = useCloudinaryUpload();

  const [formData, setFormData] = useState({
    name: '',
    father_name: '',
    profile_image_url: '',
    email: '',
    phone: '',
    cnic: '',
    date_of_birth: '',
    city: '',
    education: '',
    program: '',
    availability: '',
    skills_detail: '',
    heardFrom: '',
    message: '',
    emergency_contact_name: '',
    emergency_contact_phone: '',
    agreeTerms: false,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  // Smart Auto-fill
  React.useEffect(() => {
    if (user) {
      fetchApi<any>('/profile/me').then(res => {
        if (res.data) {
          setFormData(prev => ({
            ...prev,
            name: res.data.full_name || user.user_metadata?.full_name || prev.name,
            father_name: res.data.father_name || prev.father_name,
            email: res.data.email || user.email || prev.email,
            phone: res.data.phone || prev.phone,
            cnic: res.data.cnic || prev.cnic,
            city: res.data.address || prev.city, // Address to city loosely
            profile_image_url: res.data.avatar_url || prev.profile_image_url,
          }));
        }
      }).catch(err => console.error("Could not fetch profile for auto-fill", err));
    }
  }, [user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) newErrors.name = isUrdu ? 'نام ضروری ہے' : 'Full name is required';
    if (!formData.father_name.trim()) newErrors.father_name = isUrdu ? 'والد کا نام ضروری ہے' : 'Father name is required';
    if (!formData.profile_image_url) newErrors.profile_image_url = isUrdu ? 'پروفائل تصویر ضروری ہے' : 'Profile image is required';
    if (!formData.email.trim()) newErrors.email = isUrdu ? 'ای میل ضروری ہے' : 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = isUrdu ? 'درست ای میل درج کریں' : 'Please enter a valid email';
    if (!formData.phone.trim()) newErrors.phone = isUrdu ? 'فون نمبر ضروری ہے' : 'Phone is required';
    if (!formData.cnic.trim()) newErrors.cnic = isUrdu ? 'شناختی کارڈ نمبر ضروری ہے' : 'CNIC is required';
    else if (!/^\d{5}-?\d{7}-?\d{1}$/.test(formData.cnic.replace(/\s/g, ''))) newErrors.cnic = isUrdu ? '13 ہندسوں کا درست شناختی کارڈ نمبر درج کریں' : 'Enter a valid 13-digit CNIC (e.g. 12345-1234567-1)';
    if (!formData.date_of_birth) newErrors.date_of_birth = isUrdu ? 'تاریخ پیدائش ضروری ہے' : 'Date of birth is required';
    else {
      const dob = new Date(formData.date_of_birth);
      const age = (Date.now() - dob.getTime()) / (1000 * 60 * 60 * 24 * 365.25);
      if (age < 16) newErrors.date_of_birth = isUrdu ? 'کم از کم عمر 16 سال ہونی چاہیے' : 'You must be at least 16 years old';
    }
    if (!formData.city.trim()) newErrors.city = isUrdu ? 'شہر ضروری ہے' : 'City is required';
    if (!formData.education) newErrors.education = isUrdu ? 'تعلیمی سطح منتخب کریں' : 'Please select your education level';
    if (!formData.program) newErrors.program = isUrdu ? 'پروگرام منتخب کریں' : 'Please select a program';
    if (!formData.emergency_contact_name.trim()) newErrors.emergency_contact_name = isUrdu ? 'ہنگامی رابطہ کا نام ضروری ہے' : 'Emergency contact name is required';
    if (!formData.emergency_contact_phone.trim()) newErrors.emergency_contact_phone = isUrdu ? 'ہنگامی رابطہ کا فون ضروری ہے' : 'Emergency contact phone is required';
    if (!formData.agreeTerms) newErrors.agreeTerms = isUrdu ? 'شرائط سے اتفاق ضروری ہے' : 'You must agree to the terms';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setIsSubmitting(true);
    setSubmitError('');
    const { error } = await fetchApi('/volunteers', {
      method: 'POST',
      body: JSON.stringify({
        user_id: user?.id,
        full_name: formData.name,
        father_name: formData.father_name,
        profile_image_url: formData.profile_image_url,
        email: formData.email,
        phone: formData.phone,
        cnic: formData.cnic,
        date_of_birth: formData.date_of_birth,
        city: formData.city,
        education: formData.education,
        availability: formData.availability,
        skills: formData.program,
        skills_detail: formData.skills_detail,
        motivation: formData.message,
        heard_from: formData.heardFrom,
        emergency_contact_name: formData.emergency_contact_name,
        emergency_contact_phone: formData.emergency_contact_phone,
      }),
    });
    setIsSubmitting(false);
    if (error) {
      setSubmitError(isUrdu ? 'کچھ غلط ہو گیا۔ دوبارہ کوشش کریں۔' : 'Something went wrong. Please try again.');
    } else {
      setIsSubmitted(true);
    }
  };

  const benefits = [
    { icon: Heart, titleEn: 'Make a Difference', titleUr: 'فرق ڈالیں', descEn: 'Directly impact the lives of those in need.', descUr: 'ضرورت مندوں کی زندگیوں پر براہ راست اثر ڈالیں۔' },
    { icon: Users, titleEn: 'Build Community', titleUr: 'کمیونٹی بنائیں', descEn: 'Connect with like-minded changemakers.', descUr: 'ہم خیال تبدیلی پسندوں سے جڑیں۔' },
    { icon: Briefcase, titleEn: 'Gain Experience', titleUr: 'تجربہ حاصل کریں', descEn: 'Develop professional skills while serving.', descUr: 'خدمت کرتے ہوئے پیشہ ورانہ مہارتیں حاصل کریں۔' },
    { icon: Clock, titleEn: 'Flexible Hours', titleUr: 'لچکدار اوقات', descEn: 'Volunteer on your own schedule.', descUr: 'اپنے شیڈول کے مطابق رضاکارانہ خدمات۔' },
  ];

  return (
    <>
      <Helmet>
        <title>{isUrdu ? 'رضاکار بنیں | IOCA' : 'Volunteer | IOCA'}</title>
        <meta name="description" content="Join IOCA as a volunteer and help transform communities across Pakistan. Flexible hours, meaningful work, real impact." />
      </Helmet>

      <div className="pt-32 pb-16 md:pt-40 md:pb-24">
        <div className="max-w-7xl mx-auto px-4 md:px-16">
          {/* Header */}
          <motion.div
            className="mb-12"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className={`text-4xl md:text-6xl font-extrabold text-brand-navy mb-4 ${isUrdu ? 'font-urduHeading' : ''}`}>
              {isUrdu ? 'رضاکار بنیں' : 'Become a Volunteer'}
            </h1>
            <p className={`text-brand-navy/60 text-base md:text-lg max-w-2xl ${isUrdu ? 'font-urduBody' : ''}`}>
              {isUrdu
                ? 'IOCA کے ساتھ مل کر پاکستان بھر میں کمیونٹیز کی خدمت کریں۔ آپ کا وقت اور مہارتیں زندگیاں بدل سکتی ہیں۔'
                : 'Join IOCA and serve communities across Pakistan. Your time and skills can transform lives.'}
            </p>
          </motion.div>

          {/* Benefits Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
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
                  <div className="w-10 h-10 rounded-xl bg-brand-teal/10 flex items-center justify-center mx-auto mb-3">
                    <Icon className="w-5 h-5 text-brand-teal" />
                  </div>
                  <h3 className={`font-bold text-brand-navy text-sm mb-1 ${isUrdu ? 'font-urduHeading' : ''}`}>
                    {isUrdu ? b.titleUr : b.titleEn}
                  </h3>
                  <p className={`text-xs text-brand-navy/50 ${isUrdu ? 'font-urduBody' : ''}`}>
                    {isUrdu ? b.descUr : b.descEn}
                  </p>
                </motion.div>
              );
            })}
          </div>

          {/* Form */}
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
                    ? 'ہماری ٹیم جلد آپ سے رابطہ کرے گی۔ IOCA کے ساتھ شامل ہونے کا شکریہ!'
                    : 'Our team will reach out to you shortly. Thank you for joining the IOCA family!'}
                </p>
                <button
                  onClick={() => {
                    setIsSubmitted(false);
                    setFormData({
                      name: '', father_name: '', profile_image_url: '', email: '', phone: '', cnic: '', date_of_birth: '', city: '',
                      education: '', program: '', availability: '', skills_detail: '',
                      heardFrom: '', message: '', emergency_contact_name: '',
                      emergency_contact_phone: '', agreeTerms: false
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
                  {isUrdu ? 'رضاکارانہ فارم' : 'Volunteer Registration'}
                </h2>

                {/* ─── Section 1: Personal Information ─────────────────────── */}
                <SectionHeader label={isUrdu ? 'ذاتی معلومات' : 'Personal Information'} isUrdu={isUrdu} />

                <div className="grid grid-cols-2 gap-4">
                  <InputField id="vol-name" name="name" label={isUrdu ? 'پورا نام' : 'Full Name'} required placeholder={isUrdu ? 'آپ کا نام' : 'Your full name'} value={formData.name} error={errors.name} isUrdu={isUrdu} onChange={handleChange} />
                  <InputField id="vol-father-name" name="father_name" label={isUrdu ? 'والد کا نام' : 'Father Name'} required placeholder={isUrdu ? 'والد کا نام' : 'Father name'} value={formData.father_name} error={errors.father_name} isUrdu={isUrdu} onChange={handleChange} />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <InputField id="vol-email" name="email" label={isUrdu ? 'ای میل' : 'Email'} type="email" required placeholder={isUrdu ? 'آپ کا ای میل' : 'Your email'} value={formData.email} error={errors.email} isUrdu={isUrdu} onChange={handleChange} />
                  <InputField id="vol-phone" name="phone" label={isUrdu ? 'فون نمبر' : 'Phone'} type="tel" required placeholder={isUrdu ? 'مثلاً 03001234567' : 'e.g. 03001234567'} value={formData.phone} error={errors.phone} isUrdu={isUrdu} onChange={handleChange} />
                </div>

                <div className="mb-4">
                  <label className={`block text-sm font-medium text-brand-navy mb-1.5 ${isUrdu ? 'font-urduBody' : ''}`}>
                    {isUrdu ? 'پروفائل تصویر' : 'Profile Image'} <span className="text-red-500">*</span>
                  </label>
                  <div className="flex items-center gap-4">
                    {formData.profile_image_url ? (
                      <div className="relative w-16 h-16 rounded-xl overflow-hidden border border-brand-navy/10">
                        <img src={formData.profile_image_url} alt="Profile" className="w-full h-full object-cover" />
                        <button type="button" onClick={() => setFormData(prev => ({ ...prev, profile_image_url: '' }))} className="absolute inset-0 bg-black/50 text-white flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity text-xs">Remove</button>
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
                        id="vol-profile-image"
                        className="hidden"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            try {
                              const result = await upload(file, 'ioca/volunteers');
                              if (result) {
                                setFormData(prev => ({ ...prev, profile_image_url: result.url }));
                                if (errors.profile_image_url) setErrors(prev => ({ ...prev, profile_image_url: '' }));
                              }
                            } catch (err) {
                              console.error("Upload failed", err);
                            }
                          }
                        }}
                      />
                      <label htmlFor="vol-profile-image" className="inline-block px-4 py-2 bg-brand-navy/5 hover:bg-brand-navy/10 text-brand-navy text-sm font-medium rounded-lg cursor-pointer transition-colors">
                        {uploading ? (isUrdu ? 'اپ لوڈ ہو رہا ہے...' : 'Uploading...') : (isUrdu ? 'تصویر منتخب کریں' : 'Choose Image')}
                      </label>
                      {errors.profile_image_url && <p className="text-red-500 text-xs mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.profile_image_url}</p>}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <InputField id="vol-city" name="city" label={isUrdu ? 'شہر' : 'City'} required placeholder={isUrdu ? 'آپ کا شہر' : 'Your city'} value={formData.city} error={errors.city} isUrdu={isUrdu} onChange={handleChange} />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <InputField id="vol-cnic" name="cnic" label={isUrdu ? 'شناختی کارڈ نمبر' : 'CNIC Number'} required placeholder={isUrdu ? 'مثلاً 12345-1234567-1' : 'e.g. 12345-1234567-1'} value={formData.cnic} error={errors.cnic} isUrdu={isUrdu} onChange={handleChange} />
                  <InputField id="vol-dob" name="date_of_birth" label={isUrdu ? 'تاریخ پیدائش' : 'Date of Birth'} type="date" required placeholder="" value={formData.date_of_birth} error={errors.date_of_birth} isUrdu={isUrdu} onChange={handleChange} />
                </div>

                {/* ─── Section 2: Volunteer Preferences ────────────────────── */}
                <SectionHeader label={isUrdu ? 'رضاکارانہ ترجیحات' : 'Volunteer Preferences'} isUrdu={isUrdu} />

                <div className="grid grid-cols-2 gap-4">
                  {/* Education */}
                  <div>
                    <label htmlFor="vol-education" className={`block text-sm font-medium text-brand-navy mb-1.5 ${isUrdu ? 'font-urduBody' : ''}`}>
                      {isUrdu ? 'تعلیمی سطح' : 'Education Level'} <span className="text-red-500">*</span>
                    </label>
                    <select
                      id="vol-education"
                      name="education"
                      required
                      value={formData.education}
                      onChange={handleChange}
                      className={`w-full px-4 py-3 rounded-xl border ${errors.education ? 'border-red-400 bg-red-50' : 'border-brand-navy/10 bg-brand-gray'} focus:outline-none focus:border-brand-teal transition-all text-sm`}
                    >
                      <option value="">{isUrdu ? 'تعلیمی سطح منتخب کریں' : 'Select education level'}</option>
                      <option value="matric">{isUrdu ? 'میٹرک' : 'Matric / O-Level'}</option>
                      <option value="intermediate">{isUrdu ? 'انٹرمیڈیٹ' : 'Intermediate / A-Level'}</option>
                      <option value="bachelors">{isUrdu ? 'بیچلرز' : 'Bachelors'}</option>
                      <option value="masters">{isUrdu ? 'ماسٹرز' : 'Masters'}</option>
                      <option value="phd">{isUrdu ? 'پی ایچ ڈی' : 'PhD'}</option>
                      <option value="other">{isUrdu ? 'دیگر' : 'Other'}</option>
                    </select>
                    {errors.education && <p className="text-red-500 text-xs mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.education}</p>}
                  </div>

                  {/* Program */}
                  <div>
                    <label htmlFor="vol-program" className={`block text-sm font-medium text-brand-navy mb-1.5 ${isUrdu ? 'font-urduBody' : ''}`}>
                      {isUrdu ? 'پروگرام' : 'Interested Program'} <span className="text-red-500">*</span>
                    </label>
                    <select
                      id="vol-program"
                      name="program"
                      required
                      value={formData.program}
                      onChange={handleChange}
                      className={`w-full px-4 py-3 rounded-xl border ${errors.program ? 'border-red-400 bg-red-50' : 'border-brand-navy/10 bg-brand-gray'} focus:outline-none focus:border-brand-teal transition-all text-sm`}
                    >
                      <option value="">{isUrdu ? 'پروگرام منتخب کریں' : 'Select program'}</option>
                      <option value="education">{isUrdu ? 'تعلیم' : 'Education'}</option>
                      <option value="health">{isUrdu ? 'صحت' : 'Healthcare'}</option>
                      <option value="youth">{isUrdu ? 'نوجوانوں کی ترقی' : 'Youth Empowerment'}</option>
                      <option value="community">{isUrdu ? 'کمیونٹی ہم آہنگی' : 'Community Bonding'}</option>
                      <option value="any">{isUrdu ? 'کوئی بھی' : 'Any / All'}</option>
                    </select>
                    {errors.program && <p className="text-red-500 text-xs mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.program}</p>}
                  </div>
                </div>

                {/* Availability */}
                <div>
                  <label htmlFor="vol-availability" className={`block text-sm font-medium text-brand-navy mb-1.5 ${isUrdu ? 'font-urduBody' : ''}`}>
                    {isUrdu ? 'دستیابی' : 'Availability'}
                  </label>
                  <select
                    id="vol-availability"
                    name="availability"
                    value={formData.availability}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-xl border border-brand-navy/10 bg-brand-gray focus:outline-none focus:border-brand-teal transition-all text-sm"
                  >
                    <option value="">{isUrdu ? 'دستیابی منتخب کریں' : 'Select availability'}</option>
                    <option value="weekdays">{isUrdu ? 'ورکنگ ڈیز' : 'Weekdays'}</option>
                    <option value="weekends">{isUrdu ? 'ویک اینڈ' : 'Weekends'}</option>
                    <option value="both">{isUrdu ? 'دونوں' : 'Both'}</option>
                    <option value="remote">{isUrdu ? 'ریموٹ/آن لائن' : 'Remote / Online'}</option>
                  </select>
                </div>

                {/* ─── Section 3: Skills & Experience ──────────────────────── */}
                <SectionHeader label={isUrdu ? 'مہارتیں اور تجربہ' : 'Skills & Experience'} isUrdu={isUrdu} />

                <div>
                  <label htmlFor="vol-skills" className={`block text-sm font-medium text-brand-navy mb-1.5 ${isUrdu ? 'font-urduBody' : ''}`}>
                    {isUrdu ? 'آپ کی مہارتیں اور تجربہ (اختیاری)' : 'Your Skills & Experience (Optional)'}
                  </label>
                  <textarea
                    id="vol-skills"
                    name="skills_detail"
                    rows={3}
                    value={formData.skills_detail}
                    onChange={handleChange}
                    placeholder={isUrdu ? 'مثلاً: طبی علم، تدریس، ڈیزائن، کمیونٹی آرگنائزنگ...' : 'e.g. Medical knowledge, teaching, graphic design, community organizing...'}
                    className="w-full px-4 py-3 rounded-xl border border-brand-navy/10 bg-brand-gray focus:outline-none focus:border-brand-teal transition-all text-sm resize-none"
                  />
                </div>

                {/* ─── Section 4: Emergency Contact ─────────────────────────── */}
                <SectionHeader label={isUrdu ? 'ہنگامی رابطہ' : 'Emergency Contact'} isUrdu={isUrdu} />

                <div className="bg-amber-50 border border-amber-200/60 rounded-xl p-4">
                  <div className="flex items-start gap-2 mb-4">
                    <Shield className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                    <p className={`text-xs text-amber-700 ${isUrdu ? 'font-urduBody' : ''}`}>
                      {isUrdu
                        ? 'فیلڈ ورک کی حفاظت کے لیے ہنگامی رابطہ کی معلومات ضروری ہے۔'
                        : 'Emergency contact is required for volunteer fieldwork safety.'}
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <InputField id="vol-ec-name" name="emergency_contact_name" label={isUrdu ? 'ہنگامی رابطے کا نام' : 'Contact Name'} required placeholder={isUrdu ? 'مثلاً والدین/قریبی رشتہ دار' : 'e.g. Parent / Relative'} value={formData.emergency_contact_name} error={errors.emergency_contact_name} isUrdu={isUrdu} onChange={handleChange} />
                    <InputField id="vol-ec-phone" name="emergency_contact_phone" label={isUrdu ? 'ہنگامی رابطے کا فون' : 'Contact Phone'} type="tel" required placeholder={isUrdu ? 'فون نمبر' : 'Phone number'} value={formData.emergency_contact_phone} error={errors.emergency_contact_phone} isUrdu={isUrdu} onChange={handleChange} />
                  </div>
                </div>

                {/* ─── Section 5: Additional ────────────────────────────────── */}
                <SectionHeader label={isUrdu ? 'اضافی معلومات' : 'Additional'} isUrdu={isUrdu} />

                <div>
                  <label htmlFor="vol-heard" className={`block text-sm font-medium text-brand-navy mb-1.5 ${isUrdu ? 'font-urduBody' : ''}`}>
                    {isUrdu ? 'آپ نے IOCA کے بارے میں کیسے سنا؟' : 'How did you hear about IOCA?'}
                  </label>
                  <select
                    id="vol-heard"
                    name="heardFrom"
                    value={formData.heardFrom}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-xl border border-brand-navy/10 bg-brand-gray focus:outline-none focus:border-brand-teal transition-all text-sm"
                  >
                    <option value="">{isUrdu ? 'منتخب کریں' : 'Select option'}</option>
                    <option value="social">{isUrdu ? 'سوشل میڈیا' : 'Social Media'}</option>
                    <option value="friend">{isUrdu ? 'دوست/خاندان' : 'Friend / Family'}</option>
                    <option value="website">{isUrdu ? 'ویب سائٹ' : 'Website'}</option>
                    <option value="event">{isUrdu ? 'تقریب' : 'Event'}</option>
                    <option value="other">{isUrdu ? 'دیگر' : 'Other'}</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="vol-message" className={`block text-sm font-medium text-brand-navy mb-1.5 ${isUrdu ? 'font-urduBody' : ''}`}>
                    {isUrdu ? 'اضافی پیغام (اختیاری)' : 'Additional Message (Optional)'}
                  </label>
                  <textarea
                    id="vol-message"
                    name="message"
                    rows={3}
                    value={formData.message}
                    onChange={handleChange}
                    placeholder={isUrdu ? 'کوئی اضافی معلومات...' : "Anything else you'd like us to know..."}
                    className="w-full px-4 py-3 rounded-xl border border-brand-navy/10 bg-brand-gray focus:outline-none focus:border-brand-teal transition-all text-sm resize-none"
                  />
                </div>

                <div className="flex items-start gap-3">
                  <input
                    id="vol-terms"
                    name="agreeTerms"
                    type="checkbox"
                    checked={formData.agreeTerms}
                    onChange={handleChange}
                    className="w-4 h-4 mt-1 rounded border-brand-navy/20 text-brand-teal focus:ring-brand-teal/20"
                  />
                  <label htmlFor="vol-terms" className={`text-sm text-brand-navy/60 ${isUrdu ? 'font-urduBody' : ''}`}>
                    {isUrdu
                      ? 'میں IOCA کی رضاکارانہ شرائط و ضوابط سے اتفاق کرتا/کرتی ہوں۔'
                      : "I agree to IOCA's volunteer terms and code of conduct."}
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
                  <Heart className="w-5 h-5" />
                  {isSubmitting
                    ? (isUrdu ? 'بھیج رہے ہیں...' : 'Submitting...')
                    : (isUrdu ? 'رضاکارانہ درخواست بھیجیں' : 'Submit Application')}
                </button>
              </form>
            )}
          </motion.div>
        </div>
      </div>
    </>
  );
};

export default Volunteer;
