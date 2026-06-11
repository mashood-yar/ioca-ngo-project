import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

interface HeroProps {
  isUrdu: boolean;
}

const fadeUp = (delay: number) => ({
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6, delay },
});

const Hero: React.FC<HeroProps> = ({ isUrdu }) => {
  const [showSticky, setShowSticky] = useState(false);

  useEffect(() => {
    const handleScroll = () => setShowSticky(window.scrollY > 220);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <>
      <header className="relative pt-0 pb-16 md:px-16 md:pt-10 md:pb-24 max-w-7xl mx-auto flex flex-col md:flex-row items-center gap-8 md:gap-12 overflow-hidden">
        
        {/* Subtle Jali Texture */}
        <div
          aria-hidden="true"
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: `repeating-linear-gradient(45deg, var(--color-brand-navy) 0, var(--color-brand-navy) 1px, transparent 0, transparent 50%)`,
            backgroundSize: '10px 10px',
            opacity: 0.035,
            zIndex: 0,
          }}
        />

        {/* Image Block */}
        <motion.div
          className="w-full md:w-1/2 relative z-10 order-first md:order-last"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8 }}
        >
          <div className="w-full md:aspect-square relative shadow-2xl overflow-hidden max-h-[260px] md:max-h-none" style={{ borderRadius: '50% 50% 0 0 / 40% 40% 0 0' }}>
            <img 
              src="/assets/hero-community.webp" 
              alt="Community gathering in Pakistan" 
              className="w-full h-full object-cover hover:scale-105 transition-transform duration-700"
              fetchPriority="high"
              decoding="sync"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-brand-navy/60 via-transparent to-transparent" />
            
            {/* Overlay Stat Badge */}
            <motion.div
              className="absolute bottom-3 left-4 flex items-center justify-center bg-brand-gold text-brand-navy font-semibold px-3 py-1 rounded-full text-xs"
              style={{ direction: isUrdu ? 'rtl' : 'ltr' }}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.8 }}
            >
              {isUrdu ? '10 لاکھ+ زندگیاں متاثر ہوئیں' : '1M+ Lives Impacted'}
            </motion.div>
          </div>
        </motion.div>

        {/* Content Block */}
        <div className="w-full md:w-1/2 flex flex-col gap-0 items-start relative z-10 order-last md:order-first px-4 md:px-0">
          
          {/* Logo Icon */}
          <motion.div className={`w-full ${isUrdu ? 'flex justify-end' : 'flex justify-start'} mb-6`} {...fadeUp(0.1)}>
            <img src="/assets/logos/logo-icon-teal.webp" alt="" className="h-16 md:h-20 w-auto object-contain" aria-hidden="true" fetchPriority="high" decoding="sync" />
          </motion.div>
          
          {/* Eyebrow */}
          <motion.p
            className={`text-[11px] font-semibold tracking-[0.1em] uppercase text-brand-gold mb-3 ${isUrdu ? "font-urduBody text-right w-full" : ""}`}
            {...fadeUp(0.2)}
          >
            ✓ {isUrdu ? 'پی سی پی مصدقہ این جی او' : 'PCP Certified NGO'}
          </motion.p>

          {/* Headline */}
          <motion.div className={`mb-3 ${isUrdu ? 'text-right w-full' : ''}`} {...fadeUp(0.3)}>
            <span className={`block font-extrabold leading-none text-[42px] md:text-[56px] text-brand-navy tracking-tight ${isUrdu ? 'font-urduHeading' : ''}`}>
              {isUrdu ? 'پاکستان کو بااختیار بنانا' : 'The Smarter'}
            </span>
            <span className={`block font-normal leading-snug text-[22px] md:text-[28px] text-brand-navy/80 mt-1 ${isUrdu ? 'font-urduHeading' : ''}`}>
              {isUrdu ? 'ایک روشن مستقبل کے لیے' : 'Path to Creating Lasting Change'}
            </span>
          </motion.div>

          {/* Pills */}
          <motion.div className="flex flex-wrap gap-2 mt-3 mb-4" {...fadeUp(0.4)}>
            <span className={`text-[11px] text-brand-teal border border-brand-teal/25 bg-brand-teal/5 rounded-full px-3 py-1 ${isUrdu ? 'font-urduBody' : ''}`}>
              ✓ {isUrdu ? 'شریعہ کمپلائنٹ' : 'Shariah Compliant'}
            </span>
            <span className={`text-[11px] text-brand-teal border border-brand-teal/25 bg-brand-teal/5 rounded-full px-3 py-1 ${isUrdu ? 'font-urduBody' : ''}`}>
              ✓ {isUrdu ? 'زکوٰۃ اور صدقہ' : 'Zakat & Sadaqah Eligible'}
            </span>
          </motion.div>

          {/* Body Text */}
          <motion.p className="text-base md:text-xl text-brand-navy/70 leading-relaxed max-w-xl" {...fadeUp(0.5)}>
            {isUrdu 
              ? 'ہماری کمیونٹیز کے ساتھ مل کر کام کرتے ہوئے، ہم صحت، تعلیم اور ہنگامی امداد کے ذریعے پائیدار تبدیلی لا رہے ہیں۔' 
              : 'Working hand-in-hand with our communities, we are driving sustainable change through health, education, and emergency relief in Pakistan.'}
          </motion.p>
          
          {/* CTAs */}
          <motion.div className={`flex items-center gap-4 mt-6 ${isUrdu ? 'flex-row-reverse w-full' : ''}`} {...fadeUp(0.6)}>
            <Link
              to="/donate"
              className="inline-flex items-center justify-center bg-brand-gold text-brand-navy font-semibold text-[15px] px-6 rounded-lg min-h-[48px] hover:opacity-90 transition-opacity whitespace-nowrap shadow-lg shadow-brand-gold/20"
            >
              {isUrdu ? 'عطیہ کریں' : 'Donate Now'}
            </Link>
            
            <Link
              to="/programs"
              className="text-brand-teal font-medium text-[14px] hover:underline whitespace-nowrap"
            >
              {isUrdu ? 'پروگرامز دیکھیں ←' : 'Explore Programs →'}
            </Link>
          </motion.div>
        </div>
        
        {/* Decorative blurred shapes */}
        <div className="absolute top-10 right-0 w-64 h-64 bg-brand-gold/5 rounded-full blur-3xl -z-10" aria-hidden="true" />
        <div className="absolute bottom-10 left-10 w-72 h-72 bg-brand-teal/5 rounded-full blur-3xl -z-10" aria-hidden="true" />
      </header>

      {/* Sticky bottom donation bar for mobile */}
      <div
        className={`fixed bottom-0 left-0 right-0 z-50 md:hidden transition-transform duration-300 bg-brand-navy ${
          showSticky ? 'translate-y-0' : 'translate-y-full'
        }`}
        aria-hidden={!showSticky}
      >
        <div className={`flex items-center justify-between px-5 py-3 ${isUrdu ? 'flex-row-reverse' : ''}`}>
          <div className={isUrdu ? 'text-right' : 'text-left'}>
            <p className={`text-brand-white text-[11px] font-medium leading-tight ${isUrdu ? 'font-urduBody' : ''}`}>
              {isUrdu ? '100% عطیات مستحقین تک پہنچتے ہیں' : '100% reaches those in need'}
            </p>
            <p className={`text-brand-white/60 text-[10px] leading-tight ${isUrdu ? 'font-urduBody' : ''}`}>
              {isUrdu ? 'زکوٰۃ اور صدقہ' : 'Zakat & Sadaqah Eligible'}
            </p>
          </div>
          
          <Link
            to="/donate"
            className="bg-brand-gold text-brand-navy font-semibold text-[13px] px-5 rounded-md min-h-[44px] flex items-center justify-center whitespace-nowrap hover:opacity-90 transition-opacity"
          >
            {isUrdu ? 'عطیہ کریں' : 'Donate Now'}
          </Link>
        </div>
      </div>
    </>
  );
};

export default Hero;
