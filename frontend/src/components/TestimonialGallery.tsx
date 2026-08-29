import React, { useRef, useEffect, useState } from 'react';
import { Quote } from 'lucide-react';
import { motion, useInView } from 'framer-motion';
import { fetchApi } from '../lib/apiClient';

interface Testimonial {
  id: string;
  quote_en: string;
  quote_ur: string;
  name_en: string;
  name_ur: string;
  location_en: string;
  location_ur: string;
  initial: string;
  bg_color: string;
}

interface TestimonialGalleryProps {
  isUrdu: boolean;
}

const TestimonialGallery: React.FC<TestimonialGalleryProps> = ({ isUrdu }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchApi<Testimonial[]>('/api/testimonials')
      .then(({ data }) => { if (data) setTestimonials(data); })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <section className="bg-brand-gray relative py-12 md:py-24 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 md:px-16">
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 md:gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="rounded-xl bg-brand-white border border-brand-navy/5 p-5 md:p-8 min-h-[200px] animate-pulse" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="stories" ref={ref} className="bg-brand-gray relative py-12 md:py-24 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 md:px-16 relative z-10">
        <motion.div
          className={`mb-12 ${isUrdu ? 'text-right' : 'text-left'}`}
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
        >
          <h2 className={`text-3xl md:text-5xl font-extrabold text-brand-navy mb-4 ${isUrdu ? 'font-urduHeading' : ''}`}>
            {isUrdu ? 'کمیونٹی کی آوازیں' : 'Voices from Our Community'}
          </h2>
          <p className={`text-brand-navy/60 text-base md:text-lg max-w-2xl ${isUrdu ? 'font-urduBody' : ''}`}>
            {isUrdu ? 'ان لوگوں سے سنیں جن کی زندگیاں بدل گئیں۔' : 'Hear directly from the people whose lives have been transformed.'}
          </p>
        </motion.div>

        {testimonials.length === 0 ? (
          <p className="text-brand-navy/40 text-center py-12">
            {isUrdu ? 'ابھی کوئی گواہی نہیں ہے۔' : 'No testimonials yet.'}
          </p>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 md:gap-6">
            {testimonials.map((t, idx) => {
              const isTeal = t.bg_color === 'teal';
              return (
                <motion.div
                  key={t.id}
                  className={`rounded-xl p-5 md:p-8 flex flex-col justify-between relative overflow-hidden hover:-translate-y-1 hover:shadow-lg transition-all ${
                    isTeal ? 'bg-brand-teal text-brand-white' : 'bg-brand-white text-brand-navy border border-brand-navy/5'
                  } ${idx === 2 ? 'md:hidden lg:block' : ''}`}
                  initial={{ opacity: 0, y: 30 }}
                  animate={isInView ? { opacity: 1, y: 0 } : {}}
                  transition={{ duration: 0.5, delay: idx * 0.15 }}
                >
                  {isTeal && (
                    <div
                      aria-hidden="true"
                      className="absolute inset-0 opacity-[0.08] pointer-events-none"
                      style={{ backgroundImage: 'url("/assets/pattern-jali-accent.webp")', backgroundSize: '120px' }}
                    />
                  )}
                  <Quote className={`w-6 h-6 md:w-8 md:h-8 mb-4 ${isTeal ? 'text-brand-white/50' : 'text-brand-gold'}`} aria-hidden="true" />

                  <blockquote className="relative z-10 flex-grow">
                    <p className={`text-sm md:text-lg leading-relaxed italic ${isUrdu ? 'font-urduBody' : 'font-serif'}`}>
                      {isUrdu ? t.quote_ur : t.quote_en}
                    </p>
                  </blockquote>

                  <div className="flex items-center gap-3 mt-6 relative z-10">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${
                      isTeal ? 'bg-brand-white/20 text-brand-white' : 'bg-brand-teal/10 text-brand-teal'
                    }`} aria-hidden="true">
                      {t.initial}
                    </div>
                    <div>
                      <cite className="not-italic">
                        <p className={`font-bold text-sm ${isUrdu ? 'font-urduBody' : ''}`}>{isUrdu ? t.name_ur : t.name_en}</p>
                        <p className={`text-xs ${isTeal ? 'text-brand-white/60' : 'text-brand-navy/50'} ${isUrdu ? 'font-urduBody' : ''}`}>
                          {isUrdu ? t.location_ur : t.location_en}
                        </p>
                      </cite>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
};

export default TestimonialGallery;
