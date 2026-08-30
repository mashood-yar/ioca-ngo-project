import React, { useRef, useEffect, useState } from 'react';
import { ArrowLeft, ArrowRight, Heart } from 'lucide-react';
import { motion, useInView } from 'framer-motion';
import { optimizeImage } from '../lib/optimizeImage';
import { fetchApi } from '../lib/apiClient';

interface Project {
  id: string;
  title_en?: string;
  title_ur?: string;
  description_en?: string;
  description_ur?: string;
  description?: string;
  title?: string;
  image_url?: string;
  category?: string;
  is_featured?: boolean;
  slug?: string;
}

interface CampaignCarouselProps {
  isUrdu: boolean;
  onDonateClick: (campaignName: string) => void;
}

const CampaignCarousel: React.FC<CampaignCarouselProps> = ({ isUrdu, onDonateClick }) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const sectionRef = useRef(null);
  const isInView = useInView(sectionRef, { once: true, margin: '-100px' });
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchApi<Project[]>('/projects?is_featured=true&limit=6')
      .then(({ data }) => {
        if (data && data.length > 0) {
          setProjects(data);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const scroll = (direction: 'left' | 'right') => {
    if (!scrollRef.current) return;
    const amount = scrollRef.current.offsetWidth * 0.8;
    scrollRef.current.scrollBy({ left: direction === 'left' ? -amount : amount, behavior: 'smooth' });
  };

  const getTitle = (p: Project) => isUrdu ? (p.title_ur || p.title || '') : (p.title_en || p.title || '');
  const getDesc = (p: Project) => isUrdu ? (p.description_ur || p.description || '') : (p.description_en || p.description || '');

  // Loading skeleton
  const Skeleton = () => (
    <div className="min-w-[85vw] md:min-w-[350px] lg:min-w-[400px] snap-center bg-brand-white rounded-xl overflow-hidden shadow-md border-2 border-brand-teal/10 animate-pulse">
      <div className="h-40 md:h-48 bg-brand-gray" />
      <div className="p-5 space-y-3">
        <div className="h-6 bg-brand-gray rounded w-3/4" />
        <div className="h-4 bg-brand-gray rounded w-full" />
        <div className="h-4 bg-brand-gray rounded w-2/3" />
        <div className="h-10 bg-brand-gray rounded mt-4" />
      </div>
    </div>
  );

  return (
    <section id="causes" ref={sectionRef} className="py-12 md:py-24 overflow-hidden relative">
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
              {isUrdu ? 'فعال مہمات' : 'Active Appeals'}
            </h2>
            <p className={`text-brand-navy/60 text-base md:text-lg max-w-lg ${isUrdu ? 'font-urduBody' : ''}`}>
              {isUrdu ? 'آپ کا عطیہ براہ راست ان پروگراموں کی مدد کرتا ہے جو زندگیاں بدلتے ہیں۔' : 'Your donation directly supports programs that are changing lives across Pakistan.'}
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
          aria-label={isUrdu ? 'مہمات' : 'Campaign appeals'}
          className="flex gap-6 overflow-x-auto snap-x snap-mandatory hide-scrollbar py-4 px-1 -mx-1"
        >
          {loading ? (
            [1, 2, 3].map(i => <Skeleton key={i} />)
          ) : projects.length === 0 ? (
            <p className="text-brand-navy/40 py-12 text-center w-full">
              {isUrdu ? 'فی الحال کوئی مہم نہیں ہے۔' : 'No active appeals at the moment.'}
            </p>
          ) : (
            projects.map((project, idx) => (
              <motion.div
                key={project.id}
                className="group min-w-[85vw] md:min-w-[350px] lg:min-w-[400px] snap-center md:snap-start bg-brand-white rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-shadow flex flex-col border-2 border-brand-teal/20 hover:border-brand-teal will-change-transform"
                initial={{ opacity: 0, y: 30 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: idx * 0.15 }}
              >
                {/* Image */}
                <div className="relative h-40 md:h-48 overflow-hidden">
                  <img
                    src={optimizeImage(project.image_url || '/assets/proj-education.webp', { width: 400 })}
                    alt={getTitle(project)}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    loading="lazy"
                    decoding="async"
                    width={400}
                    height={192}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                  {project.category && (
                    <span className={`absolute top-4 ${isUrdu ? 'right-4' : 'left-4'} text-[11px] font-bold uppercase px-3 py-1 rounded-full bg-brand-white/90 text-brand-navy`}>
                      {project.category}
                    </span>
                  )}
                </div>

                {/* Content */}
                <div className="p-4 md:p-5 flex flex-col flex-grow">
                  <h3 className={`text-xl md:text-2xl font-bold text-brand-navy mb-2 ${isUrdu ? 'font-urduHeading' : ''}`}>
                    {getTitle(project)}
                  </h3>
                  <p className={`text-sm text-brand-navy/60 leading-relaxed mb-4 flex-grow ${isUrdu ? 'font-urduBody' : ''}`}>
                    {getDesc(project)}
                  </p>

                  <button
                    onClick={() => onDonateClick(getTitle(project))}
                    className="w-full py-2.5 rounded-lg font-bold flex items-center justify-center gap-2 transition-colors bg-brand-teal text-brand-white hover:opacity-90 shadow-md shadow-brand-teal/20 mt-auto"
                  >
                    <Heart className="w-4 h-4" />
                    {isUrdu ? 'عطیہ کریں' : 'Donate Now'}
                  </button>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>
    </section>
  );
};

export default CampaignCarousel;
