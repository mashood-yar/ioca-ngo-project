import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { Upload, CheckCircle, AlertCircle, Loader2, X } from 'lucide-react';
import { fetchApi } from '../lib/apiClient';
import { useCloudinaryUpload } from '../hooks/useCloudinaryUpload';
import { useAuth } from '../hooks/useAuth';
import { optimizeImage } from '../lib/optimizeImage';

interface Props { isUrdu: boolean; }

const CATEGORIES = ['Health', 'Education', 'Youth', 'Women', 'Water', 'Emergency', 'General'];
const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: CURRENT_YEAR - 2014 }, (_, i) => CURRENT_YEAR - i);

const SubmitImpactStory: React.FC<Props> = ({ isUrdu }) => {
  const { user, profile } = useAuth();
  const { upload, uploading } = useCloudinaryUpload();

  const [form, setForm] = useState({
    submitter_name:     profile?.full_name || '',
    submitter_email:    '',
    submitter_phone:    '',
    submitter_location: '',
    title_en:           '',
    title_ur:           '',
    story_en:           '',
    story_ur:           '',
    category:           'General',
    program_name:       '',
    year_of_impact:     '',
    consent_to_publish: false,
    consent_to_edit:    false,
  });
  const [honeypot, setHoneypot] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [imageUrl, setImageUrl] = useState<string>('');
  const [imagePublicId, setImagePublicId] = useState<string>('');
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
    if (!form.title_en.trim() || form.title_en.length < 5) e.title_en = isUrdu ? 'عنوان ضروری ہے' : 'Title must be at least 5 characters';
    if (form.story_en.length < 100) e.story_en = isUrdu ? 'کہانی کم از کم 100 حروف ہونی چاہیے' : `Story must be at least 100 characters (${form.story_en.length}/100)`;
    if (!form.consent_to_publish) e.consent_to_publish = isUrdu ? 'اشاعت کی اجازت ضروری ہے' : 'You must consent to publish your story';
    return e;
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setErrors(prev => ({ ...prev, image: 'Image must be under 5MB' }));
      return;
    }
    setImageFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result as string);
    reader.readAsDataURL(file);
    setErrors(prev => ({ ...prev, image: '' }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError('');
    const fieldErrors = validate();
    if (Object.keys(fieldErrors).length > 0) { setErrors(fieldErrors); return; }
    setErrors({});
    setSubmitting(true);

    try {
      let finalImageUrl = imageUrl;
      let finalPublicId = imagePublicId;

      if (imageFile) {
        const result = await upload(imageFile, 'community');
        if (!result) throw new Error('Image upload failed');
        finalImageUrl = result.url;
        finalPublicId = result.publicId;
      }

      const payload: Record<string, unknown> = {
        submitter_name:     form.submitter_name,
        submitter_email:    form.submitter_email,
        submitter_phone:    form.submitter_phone || null,
        submitter_location: form.submitter_location || null,
        title_en:           form.title_en,
        title_ur:           form.title_ur || null,
        story_en:           form.story_en,
        story_ur:           form.story_ur || null,
        category:           form.category,
        program_name:       form.program_name || null,
        year_of_impact:     form.year_of_impact ? parseInt(form.year_of_impact) : null,
        consent_to_publish: true,
        consent_to_edit:    form.consent_to_edit,
        honeypot,
      };
      if (finalImageUrl) { payload.image_url = finalImageUrl; payload.image_public_id = finalPublicId; }
      if (user?.id) payload.user_id = user.id;

      const { error } = await fetchApi('/impact-stories/submit', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      if (error) throw new Error(error);
      setSubmitted(true);
    } catch (err: any) {
      if (err.message?.includes('100 characters')) {
        setErrors({ story_en: err.message });
      } else if (err.message?.includes('Too many')) {
        setServerError(isUrdu ? 'بہت زیادہ جمع کرانے کی کوشش۔ بعد میں دوبارہ کوشش کریں۔' : 'Too many submissions. Please try again later.');
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
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-2xl shadow-xl p-10 max-w-lg w-full text-center"
          >
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-6" />
            <h2 className={`text-2xl font-bold text-brand-navy mb-3 ${isUrdu ? 'font-urduHeading' : ''}`}>
              {isUrdu ? 'شکریہ!' : 'Thank You!'}
            </h2>
            <p className={`text-brand-navy/60 leading-relaxed ${isUrdu ? 'font-urduBody' : ''}`}>
              {isUrdu
                ? `آپ کی کہانی موصول ہو گئی ہے۔ ہماری ٹیم 3-5 کاروباری دنوں میں اس کا جائزہ لے گی۔ منظوری ملنے پر آپ کو ${form.submitter_email} پر اطلاع دی جائے گی۔`
                : `Your story has been received. Our team will review it within 3-5 business days. You will be notified at ${form.submitter_email} once it's approved.`}
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
        <title>{isUrdu ? 'اپنی کہانی شیئر کریں | IOCA' : 'Share Your Story | IOCA'}</title>
        <meta name="description" content="Share your impact story with IOCA. Your transformation could inspire thousands." />
      </Helmet>

      <div className="min-h-screen bg-brand-gray" dir={isUrdu ? 'rtl' : 'ltr'}>
        {/* Hero Header */}
        <div className="bg-brand-navy pt-32 pb-16 px-4">
          <div className="max-w-3xl mx-auto text-center">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={`text-4xl md:text-5xl font-extrabold text-white mb-4 ${isUrdu ? 'font-urduHeading' : ''}`}
            >
              {isUrdu ? 'اپنی کہانی شیئر کریں' : 'Share Your Story'}
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className={`text-white/70 text-base md:text-lg max-w-xl mx-auto ${isUrdu ? 'font-urduBody' : ''}`}
            >
              {isUrdu
                ? 'آپ کی تبدیلی ہزاروں کو متاثر کر سکتی ہے۔ IOCA کے ساتھ اپنا تجربہ شیئر کریں۔'
                : 'Your transformation could inspire thousands. Share your experience with IOCA.'}
            </motion.p>
          </div>
        </div>

        {/* Form */}
        <div className="max-w-3xl mx-auto px-4 py-12">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-2xl shadow-sm border border-brand-navy/8 p-8 md:p-10"
          >
            {serverError && (
              <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                <p className="text-red-700 text-sm">{serverError}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-8" noValidate>
              {/* Honeypot */}
              <input type="text" name="website" value={honeypot} onChange={e => setHoneypot(e.target.value)} style={{ display: 'none' }} tabIndex={-1} autoComplete="off" />

              {/* Section 1 */}
              <div>
                <h3 className={`text-lg font-bold text-brand-navy mb-4 pb-2 border-b border-brand-navy/10 ${isUrdu ? 'font-urduHeading' : ''}`}>
                  {isUrdu ? '۱. آپ کے بارے میں' : '1. About You'}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className={`block text-sm font-semibold text-brand-navy/70 mb-1.5 ${isUrdu ? 'font-urduBody' : ''}`}>
                      {isUrdu ? 'پورا نام *' : 'Full Name *'}
                    </label>
                    <input type="text" value={form.submitter_name} onChange={e => set('submitter_name', e.target.value)} className={inputCls('submitter_name')} placeholder={isUrdu ? 'علی خان' : 'Ali Khan'} />
                    <FieldError field="submitter_name" />
                  </div>
                  <div>
                    <label className={`block text-sm font-semibold text-brand-navy/70 mb-1.5 ${isUrdu ? 'font-urduBody' : ''}`}>
                      {isUrdu ? 'ای میل *' : 'Email Address *'}
                    </label>
                    <input type="email" value={form.submitter_email} onChange={e => set('submitter_email', e.target.value)} className={inputCls('submitter_email')} placeholder="you@example.com" />
                    <FieldError field="submitter_email" />
                  </div>
                  <div>
                    <label className={`block text-sm font-semibold text-brand-navy/70 mb-1.5 ${isUrdu ? 'font-urduBody' : ''}`}>
                      {isUrdu ? 'فون نمبر' : 'Phone Number'}
                    </label>
                    <input type="tel" value={form.submitter_phone} onChange={e => set('submitter_phone', e.target.value)} className={inputCls('submitter_phone')} placeholder="+92 300 0000000" />
                  </div>
                  <div>
                    <label className={`block text-sm font-semibold text-brand-navy/70 mb-1.5 ${isUrdu ? 'font-urduBody' : ''}`}>
                      {isUrdu ? 'آپ کا علاقہ' : 'Your Location'}
                    </label>
                    <input type="text" value={form.submitter_location} onChange={e => set('submitter_location', e.target.value)} className={inputCls('submitter_location')} placeholder={isUrdu ? 'مردان، خیبر پختونخوا' : 'Mardan, KPK'} />
                  </div>
                </div>
              </div>

              {/* Section 2 */}
              <div>
                <h3 className={`text-lg font-bold text-brand-navy mb-4 pb-2 border-b border-brand-navy/10 ${isUrdu ? 'font-urduHeading' : ''}`}>
                  {isUrdu ? '۲. آپ کی کہانی' : '2. Your Story'}
                </h3>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className={`block text-sm font-semibold text-brand-navy/70 mb-1.5 ${isUrdu ? 'font-urduBody' : ''}`}>
                        {isUrdu ? 'عنوان (انگریزی) *' : 'Story Title (English) *'}
                      </label>
                      <input type="text" value={form.title_en} onChange={e => set('title_en', e.target.value)} className={inputCls('title_en')} placeholder="How IOCA Changed My Life" />
                      <FieldError field="title_en" />
                    </div>
                    <div>
                      <label className={`block text-sm font-semibold text-brand-navy/70 mb-1.5 ${isUrdu ? 'font-urduBody' : ''}`}>
                        {isUrdu ? 'عنوان (اردو)' : 'Story Title (Urdu)'}
                      </label>
                      <input type="text" dir="rtl" value={form.title_ur} onChange={e => set('title_ur', e.target.value)} className={`${inputCls('title_ur')} font-urduBody`} placeholder="IOCA نے میری زندگی کیسے بدلی" />
                    </div>
                    <div>
                      <label className={`block text-sm font-semibold text-brand-navy/70 mb-1.5 ${isUrdu ? 'font-urduBody' : ''}`}>
                        {isUrdu ? 'زمرہ *' : 'Category *'}
                      </label>
                      <select value={form.category} onChange={e => set('category', e.target.value)} className={inputCls('category')}>
                        {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className={`block text-sm font-semibold text-brand-navy/70 mb-1.5 ${isUrdu ? 'font-urduBody' : ''}`}>
                        {isUrdu ? 'IOCA پروگرام' : 'IOCA Program (if any)'}
                      </label>
                      <input type="text" value={form.program_name} onChange={e => set('program_name', e.target.value)} className={inputCls('program_name')} placeholder={isUrdu ? 'مثلاً: صحت پروگرام' : 'e.g. Sehat Program'} />
                    </div>
                    <div>
                      <label className={`block text-sm font-semibold text-brand-navy/70 mb-1.5 ${isUrdu ? 'font-urduBody' : ''}`}>
                        {isUrdu ? 'اثر کا سال' : 'Year of Impact'}
                      </label>
                      <select value={form.year_of_impact} onChange={e => set('year_of_impact', e.target.value)} className={inputCls('year_of_impact')}>
                        <option value="">{isUrdu ? 'سال منتخب کریں' : 'Select year'}</option>
                        {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                      </select>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-1.5">
                      <label className={`block text-sm font-semibold text-brand-navy/70 ${isUrdu ? 'font-urduBody' : ''}`}>
                        {isUrdu ? 'آپ کی مکمل کہانی (انگریزی) *' : 'Your Full Story (English) *'}
                      </label>
                      <span className={`text-xs ${form.story_en.length < 100 ? 'text-red-400' : 'text-green-600'}`}>
                        {form.story_en.length}/5000 {form.story_en.length < 100 ? `(min 100)` : ''}
                      </span>
                    </div>
                    <textarea rows={10} value={form.story_en} onChange={e => set('story_en', e.target.value)} className={inputCls('story_en')} placeholder="Tell us your story in detail. What was your situation before IOCA? How did they help? What changed in your life?" />
                    <FieldError field="story_en" />
                  </div>

                  <div>
                    <label className={`block text-sm font-semibold text-brand-navy/70 mb-1.5 ${isUrdu ? 'font-urduBody' : ''}`}>
                      {isUrdu ? 'آپ کی کہانی (اردو)' : 'Your Story in Urdu (Optional)'}
                    </label>
                    <textarea rows={8} dir="rtl" value={form.story_ur} onChange={e => set('story_ur', e.target.value)} className={`${inputCls('story_ur')} font-urduBody`} placeholder="اردو میں اپنی کہانی لکھیں (اختیاری)" />
                  </div>
                </div>
              </div>

              {/* Section 3 — Photo */}
              <div>
                <h3 className={`text-lg font-bold text-brand-navy mb-4 pb-2 border-b border-brand-navy/10 ${isUrdu ? 'font-urduHeading' : ''}`}>
                  {isUrdu ? '۳. تصویر (اختیاری)' : '3. Photo (Optional)'}
                </h3>
                <div className="relative">
                  {imagePreview ? (
                    <div className="relative w-full max-w-sm h-48 rounded-xl overflow-hidden border-2 border-brand-teal/40">
                      <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                      <button type="button" onClick={() => { setImageFile(null); setImagePreview(''); setImageUrl(''); }} className="absolute top-2 right-2 bg-black/50 text-white rounded-full p-1 hover:bg-black/70">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center w-full max-w-sm h-48 border-2 border-dashed border-brand-navy/20 rounded-xl cursor-pointer hover:border-brand-teal/50 hover:bg-brand-teal/5 transition-colors">
                      <Upload className="w-8 h-8 text-brand-navy/30 mb-2" />
                      <span className={`text-sm text-brand-navy/50 ${isUrdu ? 'font-urduBody' : ''}`}>{isUrdu ? 'تصویر اپلوڈ کریں' : 'Click to upload a photo'}</span>
                      <span className="text-xs text-brand-navy/30 mt-1">JPG, PNG, WEBP — max 5MB</span>
                      <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handleImageChange} className="hidden" />
                    </label>
                  )}
                  {errors.image && <p className="text-red-500 text-xs mt-1">{errors.image}</p>}
                </div>
              </div>

              {/* Section 4 — Consent */}
              <div>
                <h3 className={`text-lg font-bold text-brand-navy mb-4 pb-2 border-b border-brand-navy/10 ${isUrdu ? 'font-urduHeading' : ''}`}>
                  {isUrdu ? '۴. رضامندی' : '4. Consent'}
                </h3>
                <div className="space-y-3">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input type="checkbox" checked={form.consent_to_publish} onChange={e => set('consent_to_publish', e.target.checked)} className="mt-1 w-4 h-4 rounded accent-brand-teal flex-shrink-0" />
                    <span className={`text-sm text-brand-navy/80 ${isUrdu ? 'font-urduBody' : ''}`}>
                      <strong>{isUrdu ? 'ضروری: ' : 'Required: '}</strong>
                      {isUrdu ? 'میں رضامند ہوں کہ IOCA میری کہانی ان کی ویب سائٹ اور سوشل میڈیا پر شائع کرے۔' : 'I consent to IOCA publishing my story on their website and social media channels.'}
                    </span>
                  </label>
                  {errors.consent_to_publish && <p className="text-red-500 text-xs">{errors.consent_to_publish}</p>}

                  <label className="flex items-start gap-3 cursor-pointer">
                    <input type="checkbox" checked={form.consent_to_edit} onChange={e => set('consent_to_edit', e.target.checked)} className="mt-1 w-4 h-4 rounded accent-brand-teal flex-shrink-0" />
                    <span className={`text-sm text-brand-navy/80 ${isUrdu ? 'font-urduBody' : ''}`}>
                      {isUrdu ? 'میں IOCA کو اجازت دیتا/دیتی ہوں کہ وہ وضاحت کے لیے میری کہانی میں ترمیم یا ترجمہ کریں۔ (اختیاری)' : 'I allow IOCA to edit or translate my story for clarity and accuracy. (Optional)'}
                    </span>
                  </label>
                </div>
              </div>

              {/* Submit */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={submitting || uploading}
                  className="w-full bg-brand-navy text-white font-bold py-4 rounded-xl hover:bg-brand-teal transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {(submitting || uploading) && <Loader2 className="w-5 h-5 animate-spin" />}
                  {submitting || uploading
                    ? (isUrdu ? 'جمع ہو رہا ہے...' : 'Submitting...')
                    : (isUrdu ? 'اپنی کہانی جمع کریں' : 'Submit Your Story')}
                </button>
                <p className={`text-xs text-brand-navy/40 text-center mt-3 ${isUrdu ? 'font-urduBody' : ''}`}>
                  {isUrdu ? 'آپ کی کہانی شائع ہونے سے پہلے ہماری ٹیم اس کا جائزہ لے گی۔' : 'Your story will be reviewed by our team before being published.'}
                </p>
              </div>
            </form>
          </motion.div>
        </div>
      </div>
    </>
  );
};

export default SubmitImpactStory;
