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

const HERO_IMAGES = [
  '/assets/hero-slider/خدمتِ خلق.webp',
  '/assets/hero-slider/امید کی کرن.webp',
  '/assets/hero-slider/صحت مند معاشرہ.webp',
];

const Hero: React.FC<HeroProps> = ({ isUrdu }) => {
  const [showSticky, setShowSticky] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);

  // Scroll handler for sticky mobile bar
  useEffect(() => {
    const handleScroll = () => setShowSticky(window.scrollY > 220);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Slider interval
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % HERO_IMAGES.length);
    }, 4000); // Change every 4 seconds
    return () => clearInterval(timer);
  }, []);

  return (
    <>
      <section className="relative w-full min-h-[75vh] md:min-h-[calc(100vh-120px)] max-h-[850px] flex flex-col justify-end md:justify-center overflow-hidden bg-brand-navy">
        
        {/* Background Slider */}
        {HERO_IMAGES.map((src, index) => (
          <img
            key={src}
            src={src}
            alt="Hero background"
            className={`absolute inset-0 w-full h-full object-cover object-center z-0 transition-opacity duration-1000 ease-in-out ${
              index === currentSlide ? 'opacity-100' : 'opacity-0'
            }`}
            fetchPriority={index === 0 ? "high" : "auto"}
            decoding={index === 0 ? "sync" : "async"}
          />
        ))}

        {/* Cinematic Gradient Overlays */}
        {/* Darkens the entire image slightly for text readability */}
        <div className="absolute inset-0 bg-brand-navy/30 z-10 pointer-events-none" aria-hidden="true" />
        {/* Deep gradient from the bottom to ensure bottom-placed text pops completely */}
        <div className="absolute inset-0 bg-gradient-to-t from-brand-navy/90 via-brand-navy/40 to-transparent z-10 pointer-events-none" aria-hidden="true" />
        
        {/* Content Container */}
        <div className="relative z-20 w-full max-w-7xl mx-auto px-4 md:px-16 pt-32 pb-12 md:pt-12 md:pb-16 flex flex-col">
          <div className={`w-full max-w-3xl ${isUrdu ? 'ml-auto text-right' : 'mr-auto text-left'}`}>
            
            {/* Logo Icon */}
            <motion.div className={`w-full ${isUrdu ? 'flex justify-end' : 'flex justify-start'} mb-3 md:mb-4`} {...fadeUp(0.1)}>
              <img src="/assets/logos/logo-icon-white.webp" alt="" className="h-12 md:h-16 w-auto object-contain drop-shadow-lg" aria-hidden="true" fetchPriority="high" decoding="sync" />
            </motion.div>
            
            {/* Eyebrow */}
            <motion.p
              className={`text-[11px] font-semibold tracking-[0.15em] uppercase text-brand-gold mb-3 drop-shadow-md ${isUrdu ? "font-urduBody" : ""}`}
              {...fadeUp(0.2)}
            >
              ✓ {isUrdu ? 'پی سی پی مصدقہ این جی او' : 'PCP Certified NGO'}
            </motion.p>

            {/* Headline */}
            <motion.div className="mb-2 md:mb-4" {...fadeUp(0.3)}>
              <span className={`block font-extrabold leading-[1.1] text-[28px] md:text-[36px] lg:text-[48px] text-brand-white tracking-tight drop-shadow-xl ${isUrdu ? 'font-urduHeading' : ''}`}>
                {isUrdu ? 'پاکستان کو بااختیار بنانا' : 'The Smarter'}
              </span>
              <span className={`block font-normal leading-snug text-[16px] md:text-[20px] lg:text-[24px] text-brand-white/90 mt-1.5 drop-shadow-lg ${isUrdu ? 'font-urduHeading' : ''}`}>
                {isUrdu ? 'ایک روشن مستقبل کے لیے' : 'Path to Creating Lasting Change'}
              </span>
            </motion.div>

            {/* Pills */}
            <motion.div className={`flex flex-wrap gap-2 my-4 ${isUrdu ? 'justify-end' : 'justify-start'}`} {...fadeUp(0.4)}>
              <span className={`text-[11px] text-brand-white border border-brand-white/30 bg-brand-white/10 backdrop-blur-md rounded-full px-3 py-1 ${isUrdu ? 'font-urduBody' : ''}`}>
                ✓ {isUrdu ? 'شریعہ کمپلائنٹ' : 'Shariah Compliant'}
              </span>
              <span className={`text-[11px] text-brand-white border border-brand-white/30 bg-brand-white/10 backdrop-blur-md rounded-full px-3 py-1 ${isUrdu ? 'font-urduBody' : ''}`}>
                ✓ {isUrdu ? 'زکوٰۃ اور صدقہ' : 'Zakat & Sadaqah Eligible'}
              </span>
            </motion.div>

            {/* CTAs */}
            <motion.div className={`flex items-center gap-4 mt-5 md:mt-6 ${isUrdu ? 'flex-row-reverse' : ''}`} {...fadeUp(0.4)}>
              <Link
                to="/donate"
                className="inline-flex items-center justify-center bg-brand-teal text-brand-white font-bold text-[15px] px-6 rounded-lg min-h-[48px] hover:bg-brand-white hover:text-brand-navy transition-all duration-300 whitespace-nowrap shadow-xl shadow-brand-teal/20"
              >
                {isUrdu ? 'عطیہ کریں' : 'Donate Now'}
              </Link>
              
              <Link
                to="/programs"
                className="text-brand-white font-medium text-[15px] hover:text-brand-gold transition-colors whitespace-nowrap drop-shadow-md"
              >
                {isUrdu ? 'پروگرامز دیکھیں ←' : 'Explore Programs →'}
              </Link>
            </motion.div>
          </div>
        </div>

      </section>

      {/* Sticky bottom donation bar for mobile */}
      <div
        className={`fixed bottom-0 left-0 right-0 z-50 md:hidden transition-transform duration-300 bg-brand-navy shadow-[0_-10px_40px_rgba(0,0,0,0.3)] border-t border-white/10 ${
          showSticky ? 'translate-y-0' : 'translate-y-full'
        }`}
        aria-hidden={!showSticky}
      >
        <div className={`flex items-center justify-between px-5 py-3 ${isUrdu ? 'flex-row-reverse' : ''}`}>
          <div className={isUrdu ? 'text-right' : 'text-left'}>
            <p className={`text-brand-white text-[12px] font-semibold leading-tight mb-0.5 ${isUrdu ? 'font-urduBody' : ''}`}>
              {isUrdu ? '100% عطیات مستحقین تک پہنچتے ہیں' : '100% reaches those in need'}
            </p>
            <p className={`text-brand-white/70 text-[10px] leading-tight ${isUrdu ? 'font-urduBody' : ''}`}>
              {isUrdu ? 'زکوٰۃ اور صدقہ' : 'Zakat & Sadaqah Eligible'}
            </p>
          </div>
          
          <Link
            to="/donate"
            className="bg-brand-teal text-brand-white font-bold text-[13px] px-6 rounded-md min-h-[44px] flex items-center justify-center whitespace-nowrap hover:opacity-90 transition-opacity"
          >
            {isUrdu ? 'عطیہ کریں' : 'Donate Now'}
          </Link>
        </div>
      </div>
    </>
  );
};

export default Hero;
