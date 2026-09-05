import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { optimizeImage } from '../lib/optimizeImage';
import { useSiteSettings } from '../hooks/useSiteSettings';

interface HeroProps {
  isUrdu: boolean;
}

const fadeUp = (delay: number) => ({
  initial: { opacity: 0, y: 15 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4, delay, ease: "easeOut" as any },
});

const Hero: React.FC<HeroProps> = ({ isUrdu }) => {
  const { settings } = useSiteSettings();
  const [showSticky, setShowSticky] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);

  // Parse slides from settings
  const slides = React.useMemo(() => {
    try {
      if (settings.hero_slides) {
        return JSON.parse(settings.hero_slides);
      }
    } catch (e) {
      console.error('Failed to parse hero slides', e);
    }
    return [];
  }, [settings.hero_slides]);

  // H1-03 FIX: Reset slide index when language changes
  useEffect(() => {
    setCurrentSlide(0);
  }, [isUrdu]);

  // Scroll handler for sticky mobile bar with requestAnimationFrame throttling
  useEffect(() => {
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const isSticky = window.scrollY > 220;
          setShowSticky(prev => prev !== isSticky ? isSticky : prev);
          ticking = false;
        });
        ticking = true;
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const isSlideshow = settings.hero_mode === 'slideshow' && slides.length > 0;

  // H1-03 FIX: Add slides.length to deps to avoid stale closure
  useEffect(() => {
    if (!isSlideshow) return;
    
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [isSlideshow, slides.length]);

  return (
    <>
      <section className="relative w-full min-h-[75vh] md:min-h-[calc(100vh-120px)] max-h-[850px] flex flex-col justify-end md:justify-center overflow-hidden bg-brand-navy">
        
        {/* Background Images */}
        {isSlideshow ? (
          slides.map((slide: any, index: number) => (
            <img
              key={slide.url}
              src={optimizeImage(slide.url, { width: 1920 })}
              alt={isUrdu ? slide.alt_ur : slide.alt_en}
              className={`absolute inset-0 w-full h-full object-cover object-center z-0 transition-opacity duration-1000 ease-in-out ${
                index === currentSlide ? 'opacity-100' : 'opacity-0'
              }`}
              fetchPriority={index === 0 ? "high" : "auto"}
              decoding={index === 0 ? "sync" : "async"}
              loading={index === 0 ? "eager" : "lazy"}
              width={1920}
              height={1080}
            />
          ))
        ) : (
          <img
            src={optimizeImage(settings.hero_static_image_url, { width: 1920 })}
            alt="Hero Background"
            className="absolute inset-0 w-full h-full object-cover object-center z-0 opacity-100"
            fetchPriority="high"
            decoding="sync"
            loading="eager"
            width={1920}
            height={1080}
          />
        )}

        {/* Cinematic Gradient Overlays */}
        <div className="absolute inset-0 bg-black/50 z-10 pointer-events-none" aria-hidden="true" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/10 to-black/40 z-10 pointer-events-none" aria-hidden="true" />
        
        {/* Content Container */}
        <div className="relative z-20 w-full h-full max-w-7xl mx-auto px-6 md:px-16 pt-32 pb-16 md:pb-24 flex flex-col justify-end">
          <div className={`w-full grid grid-cols-1 md:grid-cols-[1fr_minmax(280px,360px)] gap-8 md:gap-16 items-end ${isUrdu ? 'text-right' : 'text-left'}`} dir={isUrdu ? 'rtl' : 'ltr'}>
            
            {/* Left Column: Headline and supporting elements */}
            <div>
              {/* Headline */}
              <motion.div className="mb-5" {...fadeUp(0.15)}>
                <h1 className={`font-extrabold leading-[1.1] text-[36px] md:text-[46px] text-white tracking-tighter drop-shadow-lg ${isUrdu ? 'font-urduHeading' : ''}`}>
                  {isUrdu ? settings.hero_headline_ur : settings.hero_headline_en}
                </h1>
              </motion.div>

              {/* Badge Pills */}
              <motion.div className="flex flex-wrap gap-2" {...fadeUp(0.2)}>
                <span className={`text-[12px] font-medium text-white border border-white/20 bg-white/10 backdrop-blur-md rounded-full px-4 py-1.5 ${isUrdu ? 'font-urduBody' : ''}`}>
                  ✓ {isUrdu ? 'شرعی اصولوں کے مطابق' : 'Shariah Compliant'}
                </span>
                <span className={`text-[12px] font-medium text-white border border-white/20 bg-white/10 backdrop-blur-md rounded-full px-4 py-1.5 ${isUrdu ? 'font-urduBody' : ''}`}>
                  ✓ {isUrdu ? 'زکوٰۃ اور صدقہ کے اہل' : 'Zakat & Sadaqah Eligible'}
                </span>
              </motion.div>
            </div>

            {/* Right Column: Description and CTAs */}
            <motion.div className="flex flex-col gap-6 md:pb-2" {...fadeUp(0.25)}>
              <p className={`font-normal leading-relaxed text-[15px] md:text-[16px] text-white/80 drop-shadow-md ${isUrdu ? 'font-urduHeading' : ''}`}>
                {isUrdu ? settings.hero_subheadline_ur : settings.hero_subheadline_en}
              </p>

              {/* CTAs */}
              <div className="flex flex-wrap items-center gap-4">
                <Link
                  to={settings.hero_cta_primary_url || '/donate'}
                  className={`inline-flex items-center justify-center bg-white text-brand-navy font-bold text-[14px] px-6 rounded-full min-h-[46px] hover:shadow-[0_8px_26px_rgba(0,0,0,0.26)] hover:-translate-y-[1px] transition-all duration-300 whitespace-nowrap ${isUrdu ? 'pr-2' : 'pl-6 pr-2'}`}
                >
                  <span className={isUrdu ? 'ml-3' : 'mr-3'}>{isUrdu ? settings.hero_cta_primary_text_ur : settings.hero_cta_primary_text_en}</span>
                  <span className="w-8 h-8 rounded-full bg-brand-gold flex items-center justify-center flex-shrink-0">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#111" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><line x1="7" y1="17" x2="17" y2="7"></line><polyline points="7 7 17 7 17 17"></polyline></svg>
                  </span>
                </Link>
                
                <Link
                  to={settings.hero_cta_secondary_url || '/programs'}
                  className="text-white font-medium text-[14px] hover:text-brand-gold transition-colors whitespace-nowrap drop-shadow-md"
                >
                  {isUrdu ? settings.hero_cta_secondary_text_ur : settings.hero_cta_secondary_text_en}
                </Link>
              </div>
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
        dir={isUrdu ? 'rtl' : 'ltr'}
      >
        <div className={`flex items-center justify-between px-5 py-3`}>
          <div className="text-start">
            <p className={`text-brand-white text-[12px] font-semibold leading-tight mb-0.5 ${isUrdu ? 'font-urduBody' : ''}`}>
              {isUrdu ? '100% عطیات مستحقین تک پہنچتے ہیں' : '100% reaches those in need'}
            </p>
            <p className={`text-brand-white/70 text-[10px] leading-tight ${isUrdu ? 'font-urduBody' : ''}`}>
              {isUrdu ? 'زکوٰۃ اور صدقہ' : 'Zakat & Sadaqah Eligible'}
            </p>
          </div>
          
          <Link
            tabIndex={showSticky ? 0 : -1}
            to="/donate"
            className="bg-brand-teal text-brand-white font-bold text-[13px] px-6 rounded-lg min-h-[44px] flex items-center justify-center whitespace-nowrap hover:opacity-90 transition-opacity"
          >
            {isUrdu ? 'عطیہ کریں' : 'Donate Now'}
          </Link>
        </div>
      </div>
    </>
  );
};

export default Hero;
