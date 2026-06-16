import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { Heart, CheckCircle2, Briefcase, Clock, Users } from 'lucide-react';

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
      {label} {required && '*'}
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
    {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
  </div>
);


const Volunteer: React.FC<VolunteerProps> = ({ isUrdu }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    city: '',
    program: '',
    availability: '',
    heardFrom: '',
    message: '',
    agreeTerms: false,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    // Clear error on change
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) newErrors.name = isUrdu ? 'نام ضروری ہے' : 'Name is required';
    if (!formData.email.trim()) newErrors.email = isUrdu ? 'ای میل ضروری ہے' : 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = isUrdu ? 'درست ای میل درج کریں' : 'Please enter a valid email';
    if (!formData.phone.trim()) newErrors.phone = isUrdu ? 'فون نمبر ضروری ہے' : 'Phone is required';
    if (!formData.city.trim()) newErrors.city = isUrdu ? 'شہر ضروری ہے' : 'City is required';
    if (!formData.program) newErrors.program = isUrdu ? 'پروگرام منتخب کریں' : 'Please select a program';
    if (!formData.agreeTerms) newErrors.agreeTerms = isUrdu ? 'شرائط سے اتفاق ضروری ہے' : 'You must agree to the terms';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    // TODO: Backend dev to integrate volunteer registration API endpoint here
    console.log('Volunteer form data:', formData);
    setIsSubmitted(true);
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

      <div className="py-16 md:py-24">
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
            className="max-w-3xl mx-auto bg-brand-white rounded-[2.5rem] p-8 md:p-12 shadow-xl"
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
                  onClick={() => { setIsSubmitted(false); setFormData({ name: '', email: '', phone: '', city: '', program: '', availability: '', heardFrom: '', message: '', agreeTerms: false }); }}
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

                <div className="grid grid-cols-2 gap-4">
                  <InputField id="vol-name" name="name" label={isUrdu ? 'پورا نام' : 'Full Name'} required placeholder={isUrdu ? 'آپ کا نام' : 'Your name'} value={formData.name} error={errors.name} isUrdu={isUrdu} onChange={handleChange} />
                  <InputField id="vol-email" name="email" label={isUrdu ? 'ای میل' : 'Email'} type="email" required placeholder={isUrdu ? 'آپ کا ای میل' : 'Your email'} value={formData.email} error={errors.email} isUrdu={isUrdu} onChange={handleChange} />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <InputField id="vol-phone" name="phone" label={isUrdu ? 'فون نمبر' : 'Phone'} type="tel" required placeholder={isUrdu ? 'فون نمبر' : 'Phone number'} value={formData.phone} error={errors.phone} isUrdu={isUrdu} onChange={handleChange} />
                  <InputField id="vol-city" name="city" label={isUrdu ? 'شہر' : 'City'} required placeholder={isUrdu ? 'آپ کا شہر' : 'Your city'} value={formData.city} error={errors.city} isUrdu={isUrdu} onChange={handleChange} />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="vol-program" className={`block text-sm font-medium text-brand-navy mb-1.5 ${isUrdu ? 'font-urduBody' : ''}`}>
                      {isUrdu ? 'پروگرام' : 'Interested Program'} *
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
                    {errors.program && <p className="text-red-500 text-xs mt-1">{errors.program}</p>}
                  </div>
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
                </div>

                <div>
                  <label htmlFor="vol-heard" className={`block text-sm font-medium text-brand-navy mb-1.5 ${isUrdu ? 'font-urduBody' : ''}`}>
                    {isUrdu ? 'آپ نے IOCA کے بارے میں کیسے سنا?' : 'How did you hear about IOCA?'}
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
                      : 'I agree to IOCA\'s volunteer terms and code of conduct.'}
                  </label>
                </div>
                {errors.agreeTerms && <p className="text-red-500 text-xs">{errors.agreeTerms}</p>}

                <button
                  type="submit"
                  className="w-full bg-brand-teal text-brand-white font-bold py-4 rounded-xl text-lg hover:opacity-90 transition-opacity flex items-center justify-center gap-2 shadow-lg shadow-brand-teal/20"
                >
                  <Heart className="w-5 h-5" />
                  {isUrdu ? 'رضاکارانہ درخواست بھیجیں' : 'Submit Application'}
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
