import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { MapPin, Mail, Phone, Clock, Send, CheckCircle2 } from 'lucide-react';
import { sendContactEmail } from '../lib/sendContactEmail';

interface ContactProps {
  isUrdu: boolean;
}

const Contact: React.FC<ContactProps> = ({ isUrdu }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
  });
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitError('');

    const composedMessage = [
      formData.subject ? `Subject: ${formData.subject}` : '',
      formData.phone ? `Phone: ${formData.phone}` : '',
      formData.message,
    ].filter(Boolean).join('\n\n');

    try {
      const ok = await sendContactEmail(formData.name, formData.email, composedMessage);
      if (!ok) {
        throw new Error('Failed to send message');
      }
      setIsSubmitted(true);
      setFormData({ name: '', email: '', phone: '', subject: '', message: '' });
    } catch {
      setSubmitError(isUrdu ? 'پیغام بھیجنے میں ناکامی۔ دوبارہ کوشش کریں۔' : 'Failed to send message. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const contactInfo = [
    {
      icon: MapPin,
      titleEn: 'Visit Us',
      titleUr: 'ہم سے ملیں',
      textEn: 'IOCA Head Office,\nLahore, Pakistan',
      textUr: 'IOCA ہیڈ آفس، لاہور، پاکستان',
    },
    {
      icon: Mail,
      titleEn: 'Email Us',
      titleUr: 'ای میل کریں',
      textEn: 'info@ioca.org',
      textUr: 'info@ioca.org',
      href: 'mailto:info@ioca.org',
    },
    {
      icon: Phone,
      titleEn: 'Call Us',
      titleUr: 'فون کریں',
      textEn: '+92 42 3576 1234',
      textUr: '+92 42 3576 1234',
      href: 'tel:+924235761234',
    },
    {
      icon: Clock,
      titleEn: 'Office Hours',
      titleUr: 'دفتری اوقات',
      textEn: 'Mon – Fri: 9:00 AM – 5:00 PM\nSat: 10:00 AM – 2:00 PM',
      textUr: 'پیر سے جمعہ: صبح 9 سے شام 5 بجے\nہفتہ: صبح 10 سے دوپہر 2 بجے',
    },
  ];

  return (
    <>
      <Helmet>
        <title>{isUrdu ? 'رابطہ کریں | IOCA' : 'Contact Us | IOCA'}</title>
        <meta name="description" content="Get in touch with IOCA. Visit our office in Lahore, call us, or send us an email. We'd love to hear from you." />
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
              {isUrdu ? 'رابطہ کریں' : 'Contact Us'}
            </h1>
            <p className={`text-brand-navy/60 text-base md:text-lg max-w-2xl ${isUrdu ? 'font-urduBody' : ''}`}>
              {isUrdu
                ? 'ہم آپ سے سننا چاہتے ہیں۔ کوئی سوال ہو، شراکت کا ارادہ ہو یا رضاکارانہ خدمات - ہم سے رابطہ کریں۔'
                : 'We\'d love to hear from you. Whether you have questions, want to partner with us, or are interested in volunteering - reach out.'}
            </p>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 md:gap-12">
            {/* Contact Info Cards */}
            <div className="lg:col-span-2 grid grid-cols-2 gap-4">
              {contactInfo.map((item, idx) => {
                const Icon = item.icon;
                const content = (
                  <motion.div
                    key={idx}
                    className="bg-brand-white rounded-2xl p-5 md:p-6 border border-brand-navy/5 hover:shadow-lg transition-shadow"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: idx * 0.1 }}
                  >
                    <div className="w-10 h-10 rounded-xl bg-brand-teal/10 flex items-center justify-center mb-4">
                      <Icon className="w-5 h-5 text-brand-teal" />
                    </div>
                    <h3 className={`font-bold text-brand-navy mb-2 text-sm ${isUrdu ? 'font-urduHeading' : ''}`}>
                      {isUrdu ? item.titleUr : item.titleEn}
                    </h3>
                    <p className={`text-xs md:text-sm text-brand-navy/60 whitespace-pre-line ${isUrdu ? 'font-urduBody' : ''}`}>
                      {isUrdu ? item.textUr : item.textEn}
                    </p>
                  </motion.div>
                );
                if (item.href) {
                  return <a key={idx} href={item.href} className="contents">{content}</a>;
                }
                return <React.Fragment key={idx}>{content}</React.Fragment>;
              })}
            </div>

            {/* Contact Form */}
            <motion.div
              className="lg:col-span-3 bg-brand-white rounded-[2rem] p-6 md:p-10 shadow-md"
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
                    {isUrdu ? 'شکریہ!' : 'Thank You!'}
                  </h3>
                  <p className={`text-brand-navy/60 mb-6 ${isUrdu ? 'font-urduBody' : ''}`}>
                    {isUrdu ? 'ہم نے آپ کا پیغام موصول کر لیا ہے۔ ہم جلد آپ سے رابطہ کریں گے۔' : 'We\'ve received your message. We\'ll get back to you soon.'}
                  </p>
                  <button
                    onClick={() => setIsSubmitted(false)}
                    className="text-brand-teal font-medium hover:underline text-sm"
                  >
                    {isUrdu ? 'ایک اور پیغام بھیجیں' : 'Send another message'}
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="contact-name" className={`block text-sm font-medium text-brand-navy mb-1.5 ${isUrdu ? 'font-urduBody' : ''}`}>
                        {isUrdu ? 'پورا نام' : 'Full Name'} *
                      </label>
                      <input
                        id="contact-name"
                        name="name"
                        type="text"
                        required
                        value={formData.name}
                        onChange={handleChange}
                        placeholder={isUrdu ? 'آپ کا نام' : 'Your name'}
                        className="w-full px-4 py-3 rounded-xl border border-brand-navy/10 bg-brand-gray focus:outline-none focus:border-brand-teal focus:ring-1 focus:ring-brand-teal/20 transition-all text-sm"
                      />
                    </div>
                    <div>
                      <label htmlFor="contact-email" className={`block text-sm font-medium text-brand-navy mb-1.5 ${isUrdu ? 'font-urduBody' : ''}`}>
                        {isUrdu ? 'ای میل' : 'Email'} *
                      </label>
                      <input
                        id="contact-email"
                        name="email"
                        type="email"
                        required
                        value={formData.email}
                        onChange={handleChange}
                        placeholder={isUrdu ? 'آپ کا ای میل' : 'Your email'}
                        className="w-full px-4 py-3 rounded-xl border border-brand-navy/10 bg-brand-gray focus:outline-none focus:border-brand-teal focus:ring-1 focus:ring-brand-teal/20 transition-all text-sm"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="contact-phone" className={`block text-sm font-medium text-brand-navy mb-1.5 ${isUrdu ? 'font-urduBody' : ''}`}>
                        {isUrdu ? 'فون نمبر' : 'Phone'}
                      </label>
                      <input
                        id="contact-phone"
                        name="phone"
                        type="tel"
                        value={formData.phone}
                        onChange={handleChange}
                        placeholder={isUrdu ? 'فون نمبر' : 'Phone number'}
                        className="w-full px-4 py-3 rounded-xl border border-brand-navy/10 bg-brand-gray focus:outline-none focus:border-brand-teal focus:ring-1 focus:ring-brand-teal/20 transition-all text-sm"
                      />
                    </div>
                    <div>
                      <label htmlFor="contact-subject" className={`block text-sm font-medium text-brand-navy mb-1.5 ${isUrdu ? 'font-urduBody' : ''}`}>
                        {isUrdu ? 'موضوع' : 'Subject'} *
                      </label>
                      <select
                        id="contact-subject"
                        name="subject"
                        required
                        value={formData.subject}
                        onChange={handleChange}
                        className="w-full px-4 py-3 rounded-xl border border-brand-navy/10 bg-brand-gray focus:outline-none focus:border-brand-teal focus:ring-1 focus:ring-brand-teal/20 transition-all text-sm"
                      >
                        <option value="">{isUrdu ? 'موضوع منتخب کریں' : 'Select a subject'}</option>
                        <option value="general">{isUrdu ? 'عمومی انکوائری' : 'General Inquiry'}</option>
                        <option value="partnership">{isUrdu ? 'شراکت داری' : 'Partnership'}</option>
                        <option value="donation">{isUrdu ? 'عطیات' : 'Donation Query'}</option>
                        <option value="volunteer">{isUrdu ? 'رضاکارانہ خدمات' : 'Volunteering'}</option>
                        <option value="media">{isUrdu ? 'میڈیا' : 'Media Inquiry'}</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label htmlFor="contact-message" className={`block text-sm font-medium text-brand-navy mb-1.5 ${isUrdu ? 'font-urduBody' : ''}`}>
                      {isUrdu ? 'پیغام' : 'Message'} *
                    </label>
                    <textarea
                      id="contact-message"
                      name="message"
                      required
                      rows={5}
                      value={formData.message}
                      onChange={handleChange}
                      placeholder={isUrdu ? 'آپ کا پیغام یہاں لکھیں...' : 'Write your message here...'}
                      className="w-full px-4 py-3 rounded-xl border border-brand-navy/10 bg-brand-gray focus:outline-none focus:border-brand-teal focus:ring-1 focus:ring-brand-teal/20 transition-all text-sm resize-none"
                    />
                  </div>

                  {submitError && (
                    <p className="text-red-600 text-sm">{submitError}</p>
                  )}

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-brand-teal text-brand-white font-bold py-3.5 rounded-xl hover:opacity-90 transition-opacity flex items-center justify-center gap-2 shadow-lg shadow-brand-teal/20 disabled:opacity-50"
                  >
                    <Send className="w-4 h-4" />
                    {isSubmitting
                      ? (isUrdu ? 'بھیجا جا رہا ہے...' : 'Sending...')
                      : (isUrdu ? 'پیغام بھیجیں' : 'Send Message')}
                  </button>
                </form>
              )}
            </motion.div>
          </div>

          {/* Map Placeholder */}
          <motion.div
            className="mt-12 bg-brand-white rounded-[2rem] overflow-hidden shadow-md h-64 md:h-80 flex items-center justify-center border border-brand-navy/5"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            {/* TODO: Replace with actual Google Maps embed */}
            <div className="text-center text-brand-navy/30">
              <MapPin className="w-10 h-10 mx-auto mb-3" />
              <p className="font-medium">{isUrdu ? 'نقشہ یہاں ظاہر ہوگا' : 'Map will be displayed here'}</p>
              <p className="text-sm mt-1">IOCA Head Office, Lahore, Pakistan</p>
            </div>
          </motion.div>
        </div>
      </div>
    </>
  );
};

export default Contact;
