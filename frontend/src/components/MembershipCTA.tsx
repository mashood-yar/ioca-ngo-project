import React, { useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, useInView } from 'framer-motion';
import { ShieldCheck, Award, Heart, Users, ArrowRight, CheckCircle } from 'lucide-react';

interface MembershipCTAProps {
  isUrdu: boolean;
}

const tiers = [
  {
    nameEn: 'Supporter',
    nameUr: 'حامی',
    feeEn: 'PKR 1,000 / year',
    feeUr: '۱,۰۰۰ روپے / سال',
    color: 'text-brand-teal',
    borderColor: 'border-brand-teal/40',
    bgColor: 'bg-brand-teal/10',
  },
  {
    nameEn: 'Associate',
    nameUr: 'ایسوسی ایٹ',
    feeEn: 'PKR 5,000 / year',
    feeUr: '۵,۰۰۰ روپے / سال',
    color: 'text-brand-gold',
    borderColor: 'border-brand-gold/40',
    bgColor: 'bg-brand-gold/10',
  },
  {
    nameEn: 'Full Member',
    nameUr: 'مکمل رکن',
    feeEn: 'PKR 10,000 / year',
    feeUr: '۱۰,۰۰۰ روپے / سال',
    color: 'text-white',
    borderColor: 'border-white/20',
    bgColor: 'bg-white/10',
  },
];

const benefits = [
  {
    icon: ShieldCheck,
    en: 'PCP-Certified & FBR Tax Exempt Membership',
    ur: 'PCP تصدیق شدہ اور FBR ٹیکس چھوٹ رکنیت',
  },
  {
    icon: Award,
    en: 'Exclusive Member Events & Priority Programs',
    ur: 'خصوصی اراکین کی تقریبات اور ترجیحی پروگرام',
  },
  {
    icon: Heart,
    en: 'Personal Impact Tracking Dashboard',
    ur: 'ذاتی اثر ٹریکنگ ڈیش بورڈ',
  },
  {
    icon: Users,
    en: 'Access to Local Zone Community Projects',
    ur: 'مقامی زون کمیونٹی پروجیکٹس تک رسائی',
  },
];

const trustBadges = [
  'PCP Certified',
  'FBR Tax Exempt',
  'Est. 2004',
  '100% Transparent',
];

const MembershipCTA: React.FC<MembershipCTAProps> = ({ isUrdu }) => {
  const navigate = useNavigate();
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-80px' });

  return (
    <section
      ref={ref}
      className="relative bg-brand-navy overflow-hidden"
      style={{ direction: isUrdu ? 'rtl' : 'ltr' }}
    >
      {/* Geometric background pattern */}
      <div className="absolute inset-0 pointer-events-none select-none overflow-hidden">
        {/* Large diagonal grid lines */}
        <svg
          className="absolute inset-0 w-full h-full opacity-[0.04]"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <pattern id="memberGrid" width="60" height="60" patternUnits="userSpaceOnUse">
              <path d="M 60 0 L 0 0 0 60" fill="none" stroke="#569AD0" strokeWidth="1" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#memberGrid)" />
        </svg>
        {/* Glowing orb top-right */}
        <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-brand-teal/10 blur-3xl" />
        {/* Glowing orb bottom-left */}
        <div className="absolute -bottom-24 -left-24 w-80 h-80 rounded-full bg-brand-gold/5 blur-3xl" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 md:px-16 py-20 md:py-28">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">

          {/* ── Left Column ── */}
          <motion.div
            initial={{ opacity: 0, x: isUrdu ? 40 : -40 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.7, ease: 'easeOut' }}
            className="space-y-7"
          >
            {/* Gold pill badge */}
            <span className="inline-flex items-center gap-2 bg-brand-gold/15 border border-brand-gold/30 text-brand-gold text-xs font-black uppercase tracking-widest px-4 py-2 rounded-full">
              <Award className="w-3.5 h-3.5" />
              {isUrdu ? 'رکن بنیں' : 'Become a Member'}
            </span>

            {/* Heading */}
            <div>
              <h2 className={`text-3xl md:text-5xl font-black text-white leading-tight tracking-tight ${isUrdu ? 'font-urduHeading text-right' : ''}`}>
                {isUrdu
                  ? 'IOCA خاندان میں شامل ہوں۔ پاکستان کا مستقبل سنواریں۔'
                  : <>Join the IOCA Family.<br />Shape Pakistan's Future.</>
                }
              </h2>
              <p className={`mt-4 text-white/60 text-base md:text-lg leading-relaxed max-w-md ${isUrdu ? 'font-urduBody text-right' : ''}`}>
                {isUrdu
                  ? 'آپ کی رکنیت براہ راست تعلیم، صحت اور کمیونٹی ترقی کے پروگراموں کو فنڈ کرتی ہے۔'
                  : 'Your membership directly funds education, healthcare, and community development programs across Pakistan.'}
              </p>
            </div>

            {/* Benefits */}
            <ul className="space-y-3.5">
              {benefits.map((b, i) => {
                const Icon = b.icon;
                return (
                  <motion.li
                    key={i}
                    initial={{ opacity: 0, x: isUrdu ? 20 : -20 }}
                    animate={isInView ? { opacity: 1, x: 0 } : {}}
                    transition={{ duration: 0.5, delay: 0.15 + i * 0.08 }}
                    className={`flex items-center gap-3 ${isUrdu ? 'flex-row-reverse' : ''}`}
                  >
                    <div className="w-8 h-8 rounded-lg bg-brand-teal/15 flex items-center justify-center flex-shrink-0">
                      <Icon className="w-4 h-4 text-brand-teal" />
                    </div>
                    <span className={`text-white/75 text-sm font-medium ${isUrdu ? 'font-urduBody text-right' : ''}`}>
                      {isUrdu ? b.ur : b.en}
                    </span>
                  </motion.li>
                );
              })}
            </ul>

            {/* CTA Buttons */}
            <div className={`flex flex-wrap gap-3 pt-2 ${isUrdu ? 'flex-row-reverse' : ''}`}>
              <button
                onClick={() => navigate('/dashboard')}
                className="group inline-flex items-center gap-2 bg-brand-teal hover:bg-brand-teal-dark text-white font-bold px-7 py-3.5 rounded-xl transition-all duration-200 shadow-lg shadow-brand-teal/20 text-sm"
              >
                {isUrdu ? 'رکنیت کے لیے درخواست دیں' : 'Apply for Membership'}
                <ArrowRight className={`w-4 h-4 transition-transform group-hover:translate-x-1 ${isUrdu ? 'rotate-180' : ''}`} />
              </button>
              <button
                onClick={() => navigate('/about')}
                className="inline-flex items-center gap-2 border border-white/20 hover:border-white/40 text-white/70 hover:text-white font-semibold px-6 py-3.5 rounded-xl transition-all duration-200 text-sm"
              >
                {isUrdu ? 'مزید جانیں' : 'Learn More'}
              </button>
            </div>
          </motion.div>

          {/* ── Right Column ── */}
          <motion.div
            initial={{ opacity: 0, x: isUrdu ? -40 : 40 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.7, ease: 'easeOut', delay: 0.1 }}
            className="space-y-5"
          >
            {/* Tiers Card */}
            <div className="bg-brand-navy-light border border-white/10 rounded-2xl overflow-hidden shadow-2xl shadow-black/20">
              {/* Card header */}
              <div className="px-6 py-4 border-b border-white/10 bg-brand-gold/10">
                <p className="text-brand-gold text-xs font-black uppercase tracking-widest">
                  {isUrdu ? 'رکنیت کی اقسام' : 'Membership Tiers'}
                </p>
              </div>
              {/* Tier rows */}
              <div className="divide-y divide-white/5">
                {tiers.map((tier, i) => (
                  <div key={i} className={`flex items-center justify-between px-6 py-4 hover:bg-white/5 transition-colors ${isUrdu ? 'flex-row-reverse' : ''}`}>
                    <div className={`flex items-center gap-3 ${isUrdu ? 'flex-row-reverse' : ''}`}>
                      <span className={`w-2 h-2 rounded-full flex-shrink-0 ${
                        i === 0 ? 'bg-brand-teal' : i === 1 ? 'bg-brand-gold' : 'bg-white/50'
                      }`} />
                      <span className={`text-sm font-bold text-white ${isUrdu ? 'font-urduHeading' : ''}`}>
                        {isUrdu ? tier.nameUr : tier.nameEn}
                      </span>
                    </div>
                    <span className={`text-xs font-semibold ${tier.color} ${isUrdu ? 'font-urduBody' : 'font-mono'}`}>
                      {isUrdu ? tier.feeUr : tier.feeEn}
                    </span>
                  </div>
                ))}
              </div>
              {/* Footer note */}
              <div className="px-6 py-3 bg-white/5 border-t border-white/10">
                <p className={`text-white/40 text-xs text-center ${isUrdu ? 'font-urduBody' : ''}`}>
                  {isUrdu
                    ? 'تمام اقسام ایک جیسے پروگراموں کی حمایت کرتی ہیں'
                    : 'All tiers directly fund the same community programs'}
                </p>
              </div>
            </div>

            {/* Trust badges */}
            <div className={`flex flex-wrap gap-2 ${isUrdu ? 'flex-row-reverse' : ''}`}>
              {trustBadges.map((badge, i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-1.5 bg-white/5 border border-white/10 text-white/50 text-xs font-semibold px-3 py-1.5 rounded-full"
                >
                  <CheckCircle className="w-3 h-3 text-brand-teal/70" />
                  {badge}
                </span>
              ))}
            </div>
          </motion.div>

        </div>
      </div>
    </section>
  );
};

export default MembershipCTA;
