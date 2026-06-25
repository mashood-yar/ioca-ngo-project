import React, { useRef } from 'react';
import { ArrowLeft, ArrowRight, ArrowRight as ArrowIcon, Tag, Calendar } from 'lucide-react';
import { motion, useInView } from 'framer-motion';
import { Link } from 'react-router-dom';
import { impactStories } from '../data/mockData';
import { optimizeImage } from '../lib/optimizeImage';

interface ImpactStoriesCarouselProps {
  isUrdu: boolean;
}

const ImpactStoriesCarousel: React.FC<ImpactStoriesCarouselProps> = ({ isUrdu }) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const sectionRef = useRef(null);
  const isInView = useInView(sectionRef, { once: true, margin: '-100px' });

  const scroll = (direction: 'left' | 'right') => {
    if (!scrollRef.current) return;
    const amount = scrollRef.current.offsetWidth * 0.8;
    scrollRef.current.scrollBy({ left: direction === 'left' ? -amount : amount, behavior: 'smooth' });
  };

  return (
    <section ref={sectionRef} className="py-12 md:py-24 overflow-hidden relative bg-brand-white">
      <div className="max-w-7xl mx-auto px-4 md:px-16">
        {/* Header */}
        <motion.div
          className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10"
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
        >
          <div>
            <h2 className={`text-3xl md:text-5xl font-extrabold text-brand-navy mb-3 ${isUrdu ? 'font-urduHeading' : ''}`}>
              {isUrdu ? 'اثر کی کہانیاں' : 'Impact Stories'}
            </h2>
            <p className={`text-brand-navy/60 text-base md:text-lg max-w-lg ${isUrdu ? 'font-urduBody' : ''}`}>
              {isUrdu ? 'ان کمیونٹیز سے تبدیلی کی حقیقی کہانیاں جن کی ہم خدمت کرتے ہیں۔' : 'Real stories of change from the communities we serve.'}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => scroll('left')}
              className="hidden md:flex w-12 h-12 rounded-lg border-2 border-brand-navy/20 items-center justify-center text-brand-navy hover:bg-brand-navy hover:text-brand-white transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold focus-visible:ring-offset-2"
              aria-label={isUrdu ? 'پچھلا' : 'Scroll left'}
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <button
              onClick={() => scroll('right')}
              className="hidden md:flex w-12 h-12 rounded-lg border-2 border-brand-navy/20 items-center justify-center text-brand-navy hover:bg-brand-navy hover:text-brand-white transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold focus-visible:ring-offset-2"
              aria-label={isUrdu ? 'اگلا' : 'Scroll right'}
            >
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </motion.div>

        {/* Mobile swipe hint */}
        <p className="flex md:hidden text-xs text-brand-navy/40 mb-3 items-center gap-1">
          <ArrowLeft className="w-3 h-3" /> {isUrdu ? 'سوائپ کریں' : 'Swipe to explore'} <ArrowRight className="w-3 h-3" />
        </p>

        {/* Carousel */}
        <div
          ref={scrollRef}
          role="region"
          aria-roledescription="carousel"
          aria-label={isUrdu ? 'اثر کی کہانیاں' : 'Impact stories'}
          className="flex gap-6 overflow-x-auto snap-x snap-mandatory hide-scrollbar py-4 px-1 -mx-1"
        >
          {impactStories.slice(0, 5).map((story, idx) => (
            <motion.div
              key={story.id}
              className="group min-w-[85vw] md:min-w-[350px] lg:min-w-[400px] snap-center md:snap-start bg-brand-white rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-shadow flex flex-col border-2 border-brand-teal/20 hover:border-brand-teal will-change-transform"
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: idx * 0.15 }}
            >
              {/* Image */}
              <div className="relative h-40 md:h-48 overflow-hidden">
                <img
                  src={optimizeImage(story.image, { width: 400 })}
                  alt={isUrdu ? story.titleUr : story.titleEn}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  loading="lazy"
                  decoding="async"
                  width={400}
                  height={192}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
              </div>

              {/* Content */}
              <div className="p-5 flex flex-col flex-grow">
                <div className="flex flex-wrap items-center gap-2 mb-3">
                  <span className="flex items-center gap-1 text-[10px] bg-brand-teal/10 text-brand-teal px-2 py-1 rounded-md font-bold uppercase tracking-wider">
                    <Tag className="w-3 h-3" />
                    {isUrdu ? story.categoryUr : story.categoryEn}
                  </span>
                  {story.date && (
                    <span className="flex items-center gap-1 text-[10px] text-brand-navy/50 font-semibold uppercase tracking-wider">
                      <Calendar className="w-3 h-3" />
                      {story.date}
                    </span>
                  )}
                </div>

                <h3 className={`text-lg md:text-xl font-bold text-brand-navy mb-2 line-clamp-2 ${isUrdu ? 'font-urduHeading' : ''}`}>
                  {isUrdu ? story.titleUr : story.titleEn}
                </h3>
                
                <p className={`text-sm text-brand-navy/60 leading-relaxed mb-4 flex-grow line-clamp-3 ${isUrdu ? 'font-urduBody' : ''}`}>
                  {isUrdu ? story.excerptUr : story.excerptEn}
                </p>

                <div className="mt-auto pt-4 border-t border-brand-navy/5">
                  <Link 
                    to="/impact-stories" 
                    className="flex items-center gap-2 text-brand-teal font-bold text-sm hover:text-brand-navy transition-colors group/link w-fit"
                  >
                    {isUrdu ? 'پوری کہانی پڑھیں' : 'Read Full Story'}
                    <ArrowIcon className="w-4 h-4 group-hover/link:translate-x-1 transition-transform" />
                  </Link>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
        
        <div className="mt-8 text-center md:hidden">
          <Link 
            to="/impact-stories" 
            className="inline-flex items-center justify-center gap-2 border-2 border-brand-teal text-brand-teal font-bold py-2.5 px-6 rounded-lg hover:bg-brand-teal hover:text-white transition-colors"
          >
            {isUrdu ? 'تمام کہانیاں دیکھیں' : 'View All Stories'}
            <ArrowIcon className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  );
};

export default ImpactStoriesCarousel;
