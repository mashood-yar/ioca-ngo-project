import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { Upload, CheckCircle, AlertCircle, Loader2, X } from 'lucide-react';
import { fetchApi } from '../lib/apiClient';
import { useCloudinaryUpload } from '../hooks/useCloudinaryUpload';
import { useAuth } from '../hooks/useAuth';

interface Props { isUrdu: boolean; }

const SubmitTestimonial: React.FC<Props> = ({ isUrdu }) => {
  const { user, profile } = useAuth();
  const { upload, uploading } = useCloudinaryUpload();

  const [form, setForm] = useState({
    submitter_name:       profile?.full_name || '',
    submitter_email:      '',
    submitter_phone:      '',
    submitter_location:   '',
    quote_en:             '',
    quote_ur:             '',
    consent_to_publish:   false,
    consent_to_use_photo: false,
  });
  const [honeypot, setHoneypot] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [serverError, setServerError] = useState('');

  const set = (key: string, value: string | boolean) =>
    setForm(prev => ({ ...prev, [key]: value }));

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.submitter_name.trim()) e.submitter_name = isUrdu ? 'نام ضروری ہے' : 'Full name is required';
    if (!form.submitter_email.match(/^[^@]+@[^@]+\.[^@]+$/)) e.submitter_email = isUrdu ? 'درست ای میل درکار ہے' : 'Valid email is required';
    if (!form.submitter_location.trim()) e.submitter_location = isUrdu ? 'مقام ضروری ہے' : 'Location is required';
    if (form.quote_en.length < 30) e.quote_en = isUrdu ? 'تبصرہ کم از کم 30 حروف ہونا چاہیے' : `Testimonial must be at least 30 characters (${form.quote_en.length}/30)`;
    if (!form.consent_to_publish) e.consent_to_publish = isUrdu ? 'اشاعت کی اجازت ضروری ہے' : 'You must consent to publish your testimonial';
    return e;
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { setErrors(prev => ({ ...prev, image: 'Image must be under 5MB' })); return; }
    setImageFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError('');
    const fieldErrors = validate();
    if (Object.keys(fieldErrors).length > 0) { setErrors(fieldErrors); return; }
    setErrors({});
    setSubmitting(true);

    try {
      let photoUrl: string | undefined;
      let photoPublicId: string | undefined;

      if (imageFile && form.consent_to_use_photo) {
        const result = await upload(imageFile, 'community');
        if (!result) throw new Error('Image upload failed');
        photoUrl = result.url;
        photoPublicId = result.publicId;
      }

      const payload: Record<string, unknown> = {
        submitter_name:       form.submitter_name,
        submitter_email:      form.submitter_email,
        submitter_phone:      form.submitter_phone || null,
        submitter_location:   form.submitter_location,
        quote_en:             form.quote_en,
        quote_ur:             form.quote_ur || null,
        consent_to_publish:   true,
        consent_to_use_photo: form.consent_to_use_photo,
        honeypot,
      };
      if (photoUrl)   { payload.photo_url = photoUrl; payload.photo_public_id = photoPublicId; }
      if (user?.id)   payload.user_id = user.id;

      const { error } = await fetchApi('/testimonials/submit', { method: 'POST', body: JSON.stringify(payload) });
      if (error) throw new Error(error);
      setSubmitted(true);
    } catch (err: any) {
      if (err.message?.includes('Too many')) {
        setServerError(isUrdu ? 'بہت زیادہ کوشش۔ بعد میں دوبارہ کوشش کریں۔' : 'Too many submissions. Please try again later.');
      } else {
        setServerError(isUrdu ? 'کچھ غلط ہو گیا۔ دوبارہ کوشش کریں۔' : 'Something went wrong. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <>
        <Helmet><title>{isUrdu ? 'شکریہ | IOCA' : 'Thank You | IOCA'}</title></Helmet>
        <div className="min-h-screen bg-brand-gray flex items-center justify-center px-4 py-24">
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white rounded-2xl shadow-xl p-10 max-w-lg w-full text-center">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-6" />
            <h2 className={`text-2xl font-bold text-brand-navy mb-3 ${isUrdu ? 'font-urduHeading' : ''}`}>{isUrdu ? 'شکریہ!' : 'Thank You!'}</h2>
            <p className={`text-brand-navy/60 leading-relaxed ${isUrdu ? 'font-urduBody' : ''}`}>
              {isUrdu
                ? 'آپ کا تبصرہ موصول ہو گیا ہے۔ ہماری ٹیم جلد اس کا جائزہ لے گی۔'
                : 'Your testimonial has been received. Our team will review it shortly and notify you once approved.'}
            </p>
          </motion.div>
        </div>
      </>
    );
  }

  const inputCls = (field: string) =>
    `w-full px-4 py-3 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-teal/30 focus:border-brand-teal transition-colors ${
      errors[field] ? 'border-red-400 bg-red-50' : 'border-brand-navy/15'
    }`;

  const FieldError = ({ field }: { field: string }) =>
    errors[field] ? <p className="text-red-500 text-xs mt-1">{errors[field]}</p> : null;

  return (
    <>
      <Helmet>
        <title>{isUrdu ? 'اپنی آواز شیئر کریں | IOCA' : 'Share Your Voice | IOCA'}</title>
        <meta name="description" content="Share your testimonial with IOCA. Tell us how we made a difference." />
      </Helmet>

      <div className="min-h-screen bg-brand-gray" dir={isUrdu ? 'rtl' : 'ltr'}>
        <div className="bg-brand-navy pt-32 pb-16 px-4">
          <div className="max-w-2xl mx-auto text-center">
            <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className={`text-4xl md:text-5xl font-extrabold text-white mb-4 ${isUrdu ? 'font-urduHeading' : ''}`}>
              {isUrdu ? 'اپنی آواز شیئر کریں' : 'Share Your Voice'}
            </motion.h1>
            <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className={`text-white/70 text-base md:text-lg ${isUrdu ? 'font-urduBody' : ''}`}>
              {isUrdu ? 'آپ کا تجربہ دوسروں کو IOCA کے بارے میں جاننے میں مدد کرتا ہے۔' : 'Your experience helps others learn about the impact IOCA is making.'}
            </motion.p>
          </div>
        </div>

        <div className="max-w-2xl mx-auto px-4 py-12">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-white rounded-2xl shadow-sm border border-brand-navy/8 p-8 md:p-10">
            {serverError && (
              <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                <p className="text-red-700 text-sm">{serverError}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6" noValidate>
              <input type="text" name="website" value={honeypot} onChange={e => setHoneypot(e.target.value)} style={{ display: 'none' }} tabIndex={-1} autoComplete="off" />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={`block text-sm font-semibold text-brand-navy/70 mb-1.5 ${isUrdu ? 'font-urduBody' : ''}`}>{isUrdu ? 'پورا نام *' : 'Full Name *'}</label>
                  <input type="text" value={form.submitter_name} onChange={e => set('submitter_name', e.target.value)} className={inputCls('submitter_name')} placeholder={isUrdu ? 'فاطمہ بی بی' : 'Fatima Bibi'} />
                  <FieldError field="submitter_name" />
                </div>
                <div>
                  <label className={`block text-sm font-semibold text-brand-navy/70 mb-1.5 ${isUrdu ? 'font-urduBody' : ''}`}>{isUrdu ? 'ای میل *' : 'Email *'}</label>
                  <input type="email" value={form.submitter_email} onChange={e => set('submitter_email', e.target.value)} className={inputCls('submitter_email')} placeholder="you@example.com" />
                  <FieldError field="submitter_email" />
                </div>
                <div>
                  <label className={`block text-sm font-semibold text-brand-navy/70 mb-1.5 ${isUrdu ? 'font-urduBody' : ''}`}>{isUrdu ? 'آپ کا علاقہ *' : 'Your Location *'}</label>
                  <input type="text" value={form.submitter_location} onChange={e => set('submitter_location', e.target.value)} className={inputCls('submitter_location')} placeholder={isUrdu ? 'لاہور، پنجاب' : 'Lahore, Punjab'} />
                  <FieldError field="submitter_location" />
                </div>
                <div>
                  <label className={`block text-sm font-semibold text-brand-navy/70 mb-1.5 ${isUrdu ? 'font-urduBody' : ''}`}>{isUrdu ? 'فون (اختیاری)' : 'Phone (Optional)'}</label>
                  <input type="tel" value={form.submitter_phone} onChange={e => set('submitter_phone', e.target.value)} className={inputCls('submitter_phone')} placeholder="+92 300 0000000" />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className={`block text-sm font-semibold text-brand-navy/70 ${isUrdu ? 'font-urduBody' : ''}`}>{isUrdu ? 'آپ کا تبصرہ (انگریزی) *' : 'Your Testimonial (English) *'}</label>
                  <span className={`text-xs ${form.quote_en.length < 30 ? 'text-red-400' : 'text-green-600'}`}>{form.quote_en.length}/1000</span>
                </div>
                <textarea rows={5} value={form.quote_en} onChange={e => set('quote_en', e.target.value)} className={inputCls('quote_en')} placeholder="IOCA's health camp changed everything for my family..." />
                <FieldError field="quote_en" />
              </div>

              <div>
                <label className={`block text-sm font-semibold text-brand-navy/70 mb-1.5 ${isUrdu ? 'font-urduBody' : ''}`}>{isUrdu ? 'اردو میں تبصرہ (اختیاری)' : 'Testimonial in Urdu (Optional)'}</label>
                <textarea rows={4} dir="rtl" value={form.quote_ur} onChange={e => set('quote_ur', e.target.value)} className={`${inputCls('quote_ur')} font-urduBody`} placeholder="IOCA کے صحت کیمپ نے ہمارے خاندان کے لیے سب کچھ بدل دیا..." />
              </div>

              <div>
                <label className={`block text-sm font-semibold text-brand-navy/70 mb-3 ${isUrdu ? 'font-urduBody' : ''}`}>{isUrdu ? 'آپ کی تصویر (اختیاری)' : 'Your Photo (Optional)'}</label>
                {imagePreview ? (
                  <div className="relative w-20 h-20 rounded-full overflow-hidden border-2 border-brand-teal/40">
                    <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                    <button type="button" onClick={() => { setImageFile(null); setImagePreview(''); }} className="absolute inset-0 bg-black/40 text-white flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <label className="flex items-center gap-3 cursor-pointer w-fit">
                    <div className="w-20 h-20 rounded-full border-2 border-dashed border-brand-navy/20 flex items-center justify-center hover:border-brand-teal/50 hover:bg-brand-teal/5 transition-colors">
                      <Upload className="w-6 h-6 text-brand-navy/30" />
                    </div>
                    <span className={`text-sm text-brand-navy/50 ${isUrdu ? 'font-urduBody' : ''}`}>{isUrdu ? 'تصویر اپلوڈ کریں' : 'Upload photo'}</span>
                    <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handleImageChange} className="hidden" />
                  </label>
                )}
              </div>

              <div className="space-y-3 pt-2 border-t border-brand-navy/10">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input type="checkbox" checked={form.consent_to_publish} onChange={e => set('consent_to_publish', e.target.checked)} className="mt-1 w-4 h-4 rounded accent-brand-teal flex-shrink-0" />
                  <span className={`text-sm text-brand-navy/80 ${isUrdu ? 'font-urduBody' : ''}`}>
                    <strong>{isUrdu ? 'ضروری: ' : 'Required: '}</strong>
                    {isUrdu ? 'میں رضامند ہوں کہ IOCA میرا تبصرہ ان کی ویب سائٹ پر شائع کرے۔' : 'I consent to IOCA publishing my testimonial on their website.'}
                  </span>
                </label>
                {errors.consent_to_publish && <p className="text-red-500 text-xs">{errors.consent_to_publish}</p>}

                {imagePreview && (
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input type="checkbox" checked={form.consent_to_use_photo} onChange={e => set('consent_to_use_photo', e.target.checked)} className="mt-1 w-4 h-4 rounded accent-brand-teal flex-shrink-0" />
                    <span className={`text-sm text-brand-navy/80 ${isUrdu ? 'font-urduBody' : ''}`}>
                      {isUrdu ? 'میں IOCA کو اجازت دیتا/دیتی ہوں کہ وہ میری تصویر تبصرہ کارڈ پر استعمال کریں۔' : 'I allow IOCA to use my photo on the testimonial card.'}
                    </span>
                  </label>
                )}
              </div>

              <button type="submit" disabled={submitting || uploading} className="w-full bg-brand-navy text-white font-bold py-4 rounded-xl hover:bg-brand-teal transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                {(submitting || uploading) && <Loader2 className="w-5 h-5 animate-spin" />}
                {submitting || uploading ? (isUrdu ? 'جمع ہو رہا ہے...' : 'Submitting...') : (isUrdu ? 'اپنی آواز جمع کریں' : 'Submit Your Testimonial')}
              </button>
            </form>
          </motion.div>
        </div>
      </div>
    </>
  );
};

export default SubmitTestimonial;
