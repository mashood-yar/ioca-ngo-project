import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import SEO from '../components/SEO';
import { motion } from 'framer-motion';
import { ShieldAlert, Users, Mail, Bell, HeartHandshake } from 'lucide-react';
import { fetchApi } from '../lib/apiClient';

interface DonatePageProps {
  isUrdu: boolean;
  onDonateClick: (amount: number | null, isMonthly?: boolean) => void;
}

const DonatePage: React.FC<DonatePageProps> = ({ isUrdu }) => {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);
  const [subscribing, setSubscribing] = useState(false);
  const [subscribeError, setSubscribeError] = useState('');

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setSubscribing(true);
    setSubscribeError('');
    const { error } = await fetchApi('/misc/newsletter', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
    setSubscribing(false);
    if (error) {
      setSubscribeError(isUrdu ? 'کچھ غلط ہو گیا۔ دوبارہ کوشش کریں۔' : 'Something went wrong. Please try again.');
    } else {
      setSubscribed(true);
      setEmail('');
    }
  };

  const alternatives = [
    {
      icon: Users,
      titleEn: 'Become a Volunteer',
      titleUr: 'رضاکار بنیں',
      descEn: 'Join our on-ground team and help us execute community projects directly.',
      descUr: 'ہماری ٹیم میں شامل ہوں اور کمیونٹی پروجیکٹس میں براہ راست مدد کریں۔',
      link: '/volunteer',
      linkTextEn: 'Apply Now',
      linkTextUr: 'درخواست دیں'
    },
    {
      icon: Mail,
      titleEn: 'Contact Us',
      titleUr: 'ہم سے رابطہ کریں',
      descEn: 'Have resources or partnerships to offer? Reach out to our core team.',
      descUr: 'کیا آپ وسائل یا شراکت داری کی پیشکش کرنا چاہتے ہیں؟ ہماری ٹیم سے رابطہ کریں۔',
      link: '/contact',
      linkTextEn: 'Get in Touch',
      linkTextUr: 'رابطہ کریں'
    }
  ];

  return (
    <>
      <SEO 
        title={isUrdu ? 'عطیہ کریں | IOCA' : 'Donate | IOCA'}
        description="Support IOCA's mission. We are currently finalizing our regulatory approvals to accept public donations officially."
        isUrdu={isUrdu}
      />

      <div className="py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4 md:px-16">
          {/* Header */}
          <motion.div
            className="text-center mb-12"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className={`text-4xl md:text-6xl font-extrabold text-brand-navy mb-4 ${isUrdu ? 'font-urduHeading' : ''}`}>
              {isUrdu ? 'تبدیلی لانے میں ہماری مدد کریں' : 'Help Us Create Change'}
            </h1>
            <p className={`text-brand-navy/60 text-base md:text-lg max-w-2xl mx-auto ${isUrdu ? 'font-urduBody' : ''}`}>
              {isUrdu
                ? 'آپ کا تعاون ہمارے مشن کے لیے انمول ہے۔ ہم فی الحال سرکاری منظوری کے عمل سے گزر رہے ہیں۔'
                : 'Your support is invaluable to our mission. We are currently undergoing official government registration.'}
            </p>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-start">
            {/* "Coming Soon" Card */}
            <motion.div
              className="lg:col-span-3 bg-brand-white rounded-xl p-8 md:p-12 shadow-xl border-t-4 border-brand-teal relative overflow-hidden"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              {/* Background accent */}
              <div className="absolute top-0 right-0 p-16 opacity-5 pointer-events-none">
                <HeartHandshake className="w-64 h-64 text-brand-navy" />
              </div>

              <div className="relative z-10">
                <div className="w-16 h-16 rounded-2xl bg-brand-teal/10 flex items-center justify-center mb-6">
                  <ShieldAlert className="w-8 h-8 text-brand-teal" />
                </div>
                
                <h2 className={`text-2xl md:text-3xl font-bold text-brand-navy mb-4 ${isUrdu ? 'font-urduHeading' : ''}`}>
                  {isUrdu ? 'عطیات عارضی طور پر موقوف ہیں' : 'Donations Temporarily Paused'}
                </h2>
                
                <p className={`text-brand-navy/70 text-lg leading-relaxed mb-8 ${isUrdu ? 'font-urduBody' : ''}`}>
                  {isUrdu 
                    ? 'IOCA کی حمایت کرنے کے آپ کے فراخدلانہ ارادے کا شکریہ۔ ہم اس وقت سرکاری طور پر عوامی عطیات قبول کرنے کے لیے حکومتی رجسٹریشن اور ریگولیٹری منظوریوں کو حتمی شکل دے رہے ہیں۔ یہ عمل 100% قانونی تعمیل اور شفافیت کو یقینی بناتا ہے۔ عطیات جلد ہی کھول دیے جائیں گے۔'
                    : 'Thank you for your generous intent to support IOCA. We are currently finalizing our registration and regulatory approvals with the government to accept public donations officially. This process ensures 100% legal compliance and financial transparency. Donations will open soon.'}
                </p>

                <div className="bg-brand-gray rounded-xl p-6 border border-brand-navy/5">
                  <h3 className={`font-bold text-brand-navy flex items-center gap-2 mb-4 ${isUrdu ? 'font-urduHeading' : ''}`}>
                    <Bell className="w-5 h-5 text-brand-teal" />
                    {isUrdu ? 'جب عطیات شروع ہوں تو مجھے مطلع کریں' : 'Notify me when donations open'}
                  </h3>
                  
                  {subscribed ? (
                    <div className="bg-green-50 text-green-700 p-4 rounded-lg font-medium text-sm flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                      {isUrdu ? 'شکریہ! ہم آپ کو آگاہ رکھیں گے۔' : 'Thank you! We will keep you updated.'}
                    </div>
                  ) : (
                    <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row gap-3">
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder={isUrdu ? "اپنا ای میل درج کریں..." : "Enter your email..."}
                        className="flex-1 px-4 py-3 rounded-lg border border-brand-navy/10 focus:outline-none focus:border-brand-teal focus:ring-1 focus:ring-brand-teal/20"
                      />
                      <button
                        type="submit"
                        disabled={subscribing}
                        className="bg-brand-navy text-white px-6 py-3 rounded-lg font-bold hover:bg-brand-navy/90 transition-colors whitespace-nowrap disabled:opacity-60 disabled:cursor-not-allowed"
                      >
                        {subscribing ? '...' : (isUrdu ? 'سبسکرائب کریں' : 'Subscribe')}
                      </button>
                    </form>
                  )}
                  {subscribeError && <p className="text-red-500 text-sm mt-2">{subscribeError}</p>}

                </div>
              </div>
            </motion.div>

            {/* Alternative Actions */}
            <div className="lg:col-span-2 space-y-4">
              <h3 className={`font-bold text-brand-navy text-xl mb-6 ${isUrdu ? 'font-urduHeading' : ''}`}>
                {isUrdu ? 'مدد کرنے کے دیگر طریقے' : 'Other Ways to Help Now'}
              </h3>
              
              {alternatives.map((alt, idx) => {
                const Icon = alt.icon;
                return (
                  <motion.div
                    key={idx}
                    className="bg-brand-white rounded-xl p-6 border border-brand-navy/5 hover:shadow-lg transition-shadow group"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 + idx * 0.1 }}
                  >
                    <div className="flex items-start gap-4 mb-4">
                      <div className="w-12 h-12 rounded-xl bg-brand-gray flex items-center justify-center shrink-0 group-hover:bg-brand-teal/10 transition-colors">
                        <Icon className="w-6 h-6 text-brand-navy group-hover:text-brand-teal transition-colors" />
                      </div>
                      <div>
                        <h4 className={`font-bold text-brand-navy mb-1 ${isUrdu ? 'font-urduHeading' : ''}`}>
                          {isUrdu ? alt.titleUr : alt.titleEn}
                        </h4>
                        <p className={`text-sm text-brand-navy/60 ${isUrdu ? 'font-urduBody' : ''}`}>
                          {isUrdu ? alt.descUr : alt.descEn}
                        </p>
                      </div>
                    </div>
                    <Link
                      to={alt.link}
                      className={`block text-center w-full py-2.5 rounded-lg border-2 border-brand-navy/10 font-bold text-brand-navy hover:border-brand-teal hover:text-brand-teal transition-colors ${isUrdu ? 'font-urduBody' : ''}`}
                    >
                      {isUrdu ? alt.linkTextUr : alt.linkTextEn}
                    </Link>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default DonatePage;
