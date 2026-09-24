import React, { useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, useInView } from 'framer-motion';
import { ShieldCheck, Award, Heart, Users, ArrowRight } from 'lucide-react';

interface MembershipCTAProps {
  isUrdu: boolean;
}

const tiers = [
  {
    nameEn: 'Supporter',
    nameUr: 'حامی',
    feeEn: 'PKR 1,000 / yr',
    feeUr: '۱,۰۰۰ روپے / سال',
    hoverColor: 'group-hover:text-brand-teal',
  },
  {
    nameEn: 'Associate',
    nameUr: 'ایسوسی ایٹ',
    feeEn: 'PKR 5,000 / yr',
    feeUr: '۵,۰۰۰ روپے / سال',
    hoverColor: 'group-hover:text-brand-gold',
  },
  {
    nameEn: 'Full Member',
    nameUr: 'مکمل رکن',
    feeEn: 'PKR 10,000 / yr',
    feeUr: '۱۰,۰۰۰ روپے / سال',
    hoverColor: 'group-hover:text-white',
  },
];

const benefits = [
  { icon: ShieldCheck, en: 'PCP & FBR Certified', ur: 'PCP اور FBR تصدیق شدہ' },
  { icon: Award, en: 'Priority Programs', ur: 'ترجیحی پروگرام' },
  { icon: Heart, en: 'Impact Tracking', ur: 'اثر ٹریکنگ' },
  { icon: Users, en: 'Zone Access', ur: 'زون تک رسائی' },
];

const trustBadges = [
  'PCP Certified',
  'FBR Tax Exempt',
  '100% Transparent',
];

const MembershipCTA: React.FC<MembershipCTAProps> = ({ isUrdu }) => {
  const navigate = useNavigate();
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-50px' });

  return (
    <section className="py-12 md:py-16 px-4 md:px-8 max-w-7xl mx-auto" style={{ direction: isUrdu ? 'rtl' : 'ltr' }}>
      <motion.div
        ref={ref}
        initial={{ opacity: 0, y: 20 }}
        animate={isInView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="relative bg-brand-navy rounded-3xl overflow-hidden shadow-2xl"
      >
        {/* Subtle, elegant accent gradient (No generic orbs) */}
        <div className="absolute inset-0 bg-gradient-to-br from-brand-teal/5 via-transparent to-brand-gold/5 pointer-events-none" />

        <div className="relative p-8 md:p-12 grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-center">
          
          {/* ── Left Column (Content) ── */}
          <div className="lg:col-span-7 space-y-6">
            <p className="text-brand-gold text-xs font-bold uppercase tracking-widest flex items-center gap-2">
              <Award className="w-3.5 h-3.5" />
              {isUrdu ? 'رکنیت پروگرام' : 'Official Membership'}
            </p>

            <div>
              <h2 className={`text-3xl md:text-4xl font-black text-white leading-tight tracking-tight ${isUrdu ? 'font-urduHeading' : ''}`}>
                {isUrdu ? (
                  <>ایک بہتر پاکستان کے لیے <span className="text-brand-gold">IOCA کا حصہ</span> بنیں۔</>
                ) : (
                  <>Join the <span className="text-brand-gold">IOCA Family.</span><br />Shape Pakistan's Future.</>
                )}
              </h2>
              <p className={`mt-3 text-white/70 text-sm md:text-base leading-relaxed max-w-lg ${isUrdu ? 'font-urduBody' : ''}`}>
                {isUrdu
                  ? 'آپ کا تعاون پاکستان بھر میں تعلیم، صحت اور کمیونٹی کے فلاحی پروگراموں کو براہ راست فنڈ کرتا ہے۔'
                  : 'Your membership directly funds education, healthcare, and community development programs across Pakistan.'}
              </p>
            </div>

            {/* Compact 2x2 Benefits Grid */}
            <div className="grid grid-cols-2 gap-x-4 gap-y-3 pt-1">
              {benefits.map((b, i) => {
                const Icon = b.icon;
                return (
                  <div key={i} className="flex items-center gap-2.5">
                    <Icon className="w-4 h-4 text-brand-teal shrink-0" />
                    <span className={`text-white/80 text-sm font-medium ${isUrdu ? 'font-urduBody' : ''}`}>
                      {isUrdu ? b.ur : b.en}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Action Buttons */}
            <div className={`flex flex-wrap items-center gap-4 pt-4 ${isUrdu ? 'flex-row-reverse' : ''}`}>
              <button
                onClick={() => navigate('/dashboard')}
                className="group flex items-center gap-2 bg-brand-teal hover:bg-brand-teal-dark text-white font-semibold px-6 py-3 rounded-xl transition-colors text-sm shadow-md"
              >
                {isUrdu ? 'رکنیت حاصل کریں' : 'Become a Member'}
                <ArrowRight className={`w-4 h-4 transition-transform group-hover:translate-x-1 ${isUrdu ? 'rotate-180' : ''}`} />
              </button>
              <button
                onClick={() => navigate('/about')}
                className="flex items-center gap-2 text-white/70 hover:text-white font-semibold px-4 py-3 transition-colors text-sm"
              >
                {isUrdu ? 'مزید معلومات' : 'Learn More'}
              </button>
            </div>
          </div>

          {/* ── Right Column (Tiers & Trust) ── */}
          <div className="lg:col-span-5 flex flex-col justify-center relative">
            
            {/* Minimalist Editorial Layout */}
            <div className={`relative z-10 ${isUrdu ? 'lg:pr-10' : 'lg:pl-10'}`}>
              {/* Elegant vertical divider line on desktop */}
              <div className={`hidden lg:block absolute top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-white/15 to-transparent ${isUrdu ? 'right-0' : 'left-0'}`} />

              <h3 className={`text-white/40 text-[10px] font-bold uppercase tracking-[0.3em] mb-8 ${isUrdu ? 'text-right' : ''}`}>
                {isUrdu ? 'رکنیت کی اقسام' : 'Annual Contributions'}
              </h3>
              
              <div className="space-y-7">
                {tiers.map((tier, i) => (
                  <div key={i} className={`group cursor-default flex flex-col ${isUrdu ? 'items-end' : 'items-start'}`}>
                    <div className={`w-full flex items-end justify-between ${isUrdu ? 'flex-row-reverse' : ''}`}>
                      <h4 className={`text-white/90 font-medium text-lg lg:text-xl transition-colors duration-300 ${tier.hoverColor} ${isUrdu ? 'font-urduHeading' : ''}`}>
                        {isUrdu ? tier.nameUr : tier.nameEn}
                      </h4>
                      
                      {/* Menu-style dot leader */}
                      <div className="flex-1 mx-4 border-b-2 border-dotted border-white/15 relative top-[-6px] opacity-40 group-hover:opacity-100 transition-opacity duration-300" />
                      
                      <span className={`text-white/60 font-medium transition-colors duration-300 ${tier.hoverColor} ${isUrdu ? 'font-urduBody text-sm' : 'font-mono text-sm'}`}>
                        {isUrdu ? tier.feeUr : tier.feeEn}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              
              <p className={`text-white/30 text-[11px] mt-10 font-medium tracking-wide ${isUrdu ? 'text-right font-urduBody' : ''}`}>
                {isUrdu ? '* تمام کیٹیگریز براہ راست ہمارے فلاحی پروگراموں کی معاونت کرتی ہیں۔' : '* All tiers directly support our core community programs.'}
              </p>
            </div>

            {/* Trust Badges - Ultra minimal */}
            <div className={`mt-8 pt-6 border-t border-white/10 flex flex-wrap items-center gap-x-5 gap-y-3 text-[10px] font-bold text-white/40 uppercase tracking-widest ${isUrdu ? 'justify-end flex-row-reverse lg:pr-10' : 'justify-start lg:pl-10'}`}>
              {trustBadges.map((badge, i) => (
                <span key={i} className={`flex items-center gap-1.5 transition-colors hover:text-white/80 cursor-default ${isUrdu ? 'flex-row-reverse' : ''}`}>
                  <ShieldCheck className="w-3.5 h-3.5 opacity-60" />
                  {badge}
                </span>
              ))}
            </div>

          </div>
        </div>
      </motion.div>
    </section>
  );
};

export default MembershipCTA;
