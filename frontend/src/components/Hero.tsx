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
        <div className="absolute inset-0 bg-brand-navy/30 z-10 pointer-events-none" aria-hidden="true" />
        <div className="absolute inset-0 bg-gradient-to-t from-brand-navy/90 via-brand-navy/40 to-transparent z-10 pointer-events-none" aria-hidden="true" />
        
        {/* Content Container */}
        <div className="relative z-20 w-full max-w-7xl mx-auto px-4 md:px-16 pt-32 pb-16 md:pt-12 md:pb-20 flex flex-col">
          <div className={`w-full max-w-3xl ${isUrdu ? 'ml-auto text-right' : 'mr-auto text-left'}`} dir={isUrdu ? 'rtl' : 'ltr'}>
            
            {/* Logo Icon */}
            <motion.div className={`w-full ${isUrdu ? 'flex justify-start' : 'flex justify-start'} mb-3 md:mb-4`} {...fadeUp(0.0)}>
              <img src="/assets/logos/logo-icon-white.webp" alt="" className="h-12 md:h-16 w-auto object-contain drop-shadow-lg" aria-hidden="true" fetchPriority="high" decoding="sync" />
            </motion.div>
            
            {/* Eyebrow */}
            <motion.p
              className={`text-[11px] font-semibold tracking-[0.15em] uppercase text-brand-gold mb-3 drop-shadow-md ${isUrdu ? "font-urduBody" : ""}`}
              {...fadeUp(0.1)}
            >
              ✓ {isUrdu ? settings.hero_eyebrow_ur : settings.hero_eyebrow_en}
            </motion.p>

            {/* Headline */}
            <motion.div className="mb-2 md:mb-4" {...fadeUp(0.15)}>
              <h1 className={`font-extrabold leading-[1.1] text-[28px] md:text-[36px] lg:text-[48px] text-brand-white tracking-tight drop-shadow-xl ${isUrdu ? 'font-urduHeading' : ''}`}>
                {isUrdu ? settings.hero_headline_ur : settings.hero_headline_en}
              </h1>
              <span className={`block font-normal leading-snug text-[16px] md:text-[20px] lg:text-[26px] text-brand-white/90 mt-1.5 drop-shadow-lg ${isUrdu ? 'font-urduHeading' : ''}`}>
                {isUrdu ? settings.hero_subheadline_ur : settings.hero_subheadline_en}
              </span>
            </motion.div>

            {/* Pills */}
            <motion.div className={`flex flex-wrap gap-2 my-4 ${isUrdu ? 'justify-start' : 'justify-start'}`} {...fadeUp(0.2)}>
              <span className={`text-[11px] text-brand-white border border-brand-white/30 bg-brand-white/10 backdrop-blur-md rounded-full px-3 py-1 ${isUrdu ? 'font-urduBody' : ''}`}>
                ✓ {isUrdu ? 'شریعہ کمپلائنٹ' : 'Shariah Compliant'}
              </span>
              <span className={`text-[11px] text-brand-white border border-brand-white/30 bg-brand-white/10 backdrop-blur-md rounded-full px-3 py-1 ${isUrdu ? 'font-urduBody' : ''}`}>
                ✓ {isUrdu ? 'زکوٰۃ اور صدقہ' : 'Zakat & Sadaqah Eligible'}
              </span>
            </motion.div>

            {/* CTAs */}
            <motion.div className={`flex items-center gap-4 mt-5 md:mt-6`} {...fadeUp(0.2)}>
              <Link
                to={settings.hero_cta_primary_url || '/donate'}
                className="inline-flex items-center justify-center bg-brand-teal text-brand-white font-bold text-[15px] px-6 rounded-lg min-h-[48px] hover:bg-brand-white hover:text-brand-navy transition-all duration-300 whitespace-nowrap shadow-xl shadow-brand-teal/20"
              >
                {isUrdu ? settings.hero_cta_primary_text_ur : settings.hero_cta_primary_text_en}
              </Link>
              
              <Link
                to={settings.hero_cta_secondary_url || '/programs'}
                className="text-brand-white font-medium text-[15px] hover:text-brand-gold transition-colors whitespace-nowrap drop-shadow-md"
              >
                {isUrdu ? settings.hero_cta_secondary_text_ur : settings.hero_cta_secondary_text_en}
              </Link>
            </motion.div>
          </div>
        </div>

        {/* Slide Indicator Dots */}
        {isSlideshow && (
          <div
            className={`absolute bottom-5 z-30 flex items-center gap-2.5 ${isUrdu ? 'right-4 md:right-16' : 'left-4 md:left-16'}`}
            role="tablist"
            aria-label={isUrdu ? 'سلائیڈ انڈیکیٹر' : 'Slide indicators'}
          >
            {slides.map((_: any, idx: number) => (
              <button
                key={idx}
                role="tab"
                aria-selected={idx === currentSlide}
                aria-label={isUrdu ? `سلائیڈ ${idx + 1}` : `Slide ${idx + 1}`}
                onClick={() => setCurrentSlide(idx)}
                className={`transition-all duration-300 rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold ${
                  idx === currentSlide
                    ? 'w-6 h-2 bg-brand-gold'
                    : 'w-2 h-2 bg-brand-white/50 hover:bg-brand-white/80'
                }`}
              />
            ))}
          </div>
        )}

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
