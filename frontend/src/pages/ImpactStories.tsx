import React, { useState, useRef } from 'react';
import SEO from '../components/SEO';
import { motion, useInView, AnimatePresence } from 'framer-motion';
import { ChevronDown, Calendar, Tag } from 'lucide-react';
import { optimizeImage } from '../lib/optimizeImage';

import { fetchApi } from '../lib/apiClient';

interface Story {
  id: string;
  title_en: string;
  title_ur?: string;
  excerpt_en: string;
  excerpt_ur?: string;
  content_en: string;
  content_ur?: string;
  image_url: string;
  category: string;
  published_at: string;
}

interface ImpactStoriesProps {
  isUrdu: boolean;
}

const ImpactStories: React.FC<ImpactStoriesProps> = ({ isUrdu }) => {
  const [stories, setStories] = useState<Story[]>([]);
  const [expandedStory, setExpandedStory] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const ref = useRef(null);
  const storyRefs = useRef<{ [key: string]: HTMLElement | null }>({});
  const isInView = useInView(ref, { once: true, margin: '-50px' });

  React.useEffect(() => {
    fetchApi<Story[]>('/impact-stories')
      .then(({ data }) => {
        if (data) setStories(data);
      })
      .finally(() => setLoading(false));
  }, []);

  const toggleStory = (id: string) => {
    setExpandedStory(prev => {
      const isExpanding = prev !== id;
      if (isExpanding) {
        setTimeout(() => {
          // Scroll the story into view smoothly after it expands
          storyRefs.current[id]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 150);
      }
      return isExpanding ? id : null;
    });
  };

  return (
    <>
      <SEO 
        title={isUrdu ? 'کہانیاں | IOCA' : 'Impact Stories | IOCA'}
        description="Read inspiring stories of transformation - real people, real communities, real impact through IOCA's programs."
        isUrdu={isUrdu}
      />

      <div className="py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4 md:px-16">
          {/* Header */}
          <motion.div
            className="mb-12"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className={`text-4xl md:text-6xl font-extrabold text-brand-navy mb-4 ${isUrdu ? 'font-urduHeading' : ''}`}>
              {isUrdu ? 'اثرات کی کہانیاں' : 'Impact Stories'}
            </h1>
            <p className={`text-brand-navy/60 text-base md:text-lg max-w-2xl ${isUrdu ? 'font-urduBody' : ''}`}>
              {isUrdu
                ? 'حقیقی لوگ، حقیقی کمیونٹیز، حقیقی تبدیلی - یہ کہانیاں IOCA کے اثرات کی گواہی دیتی ہیں۔'
                : 'Real people, real communities, real impact - these stories bear witness to the transformative power of IOCA\'s work.'}
            </p>
          </motion.div>

          {/* Stories */}
          <div ref={ref} className="space-y-8">
            {loading ? (
              // Skeleton Loader
              <>
                {[1, 2].map((i) => (
                  <div key={i} className="bg-brand-white rounded-xl overflow-hidden shadow-sm border border-brand-navy/5 animate-pulse">
                    <div className="grid grid-cols-1 md:grid-cols-5">
                      <div className="md:col-span-2 h-48 md:h-full bg-brand-navy/10" />
                      <div className="md:col-span-3 p-6 md:p-10 space-y-4">
                        <div className="h-4 bg-brand-navy/10 rounded w-1/4" />
                        <div className="h-6 bg-brand-navy/10 rounded w-3/4" />
                        <div className="space-y-2 mt-4">
                          <div className="h-3 bg-brand-navy/5 rounded w-full" />
                          <div className="h-3 bg-brand-navy/5 rounded w-full" />
                          <div className="h-3 bg-brand-navy/5 rounded w-5/6" />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </>
            ) : stories.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-brand-navy/60">No impact stories found.</p>
              </div>
            ) : (
            stories.map((story, idx) => {
              const isExpanded = expandedStory === story.id;
              return (
                <motion.article
                  key={story.id}
                  ref={(el) => { storyRefs.current[story.id] = el; }}
                  className="bg-brand-white rounded-xl overflow-hidden shadow-md"
                  initial={{ opacity: 0, y: 30 }}
                  animate={isInView ? { opacity: 1, y: 0 } : {}}
                  transition={{ duration: 0.5, delay: idx * 0.15 }}
                >
                  <div className="grid grid-cols-1 md:grid-cols-5">
                    {/* Image */}
                    <div className="md:col-span-2 h-48 md:h-full overflow-hidden">
                      <img
                        src={optimizeImage(story.image_url || '/assets/impact-ali.webp', { width: 400 })}
                        alt={isUrdu ? (story.title_ur || story.title_en) : story.title_en}
                        className="w-full h-full object-cover"
                        loading="lazy"
                        decoding="async"
                        width={400}
                        height={200}
                      />
                    </div>

                    {/* Content */}
                    <div className="md:col-span-3 p-6 md:p-10 flex flex-col h-full">
                      <div className="flex flex-wrap items-center gap-2 mb-4">
                        <span className="flex items-center gap-1 text-[11px] bg-brand-teal/10 text-brand-teal px-3 py-1 rounded-full font-medium">
                          <Tag className="w-3 h-3" />
                          {story.category}
                        </span>
                        <span className="flex items-center gap-1 text-[11px] text-brand-navy/40">
                          <Calendar className="w-3 h-3" />
                          {new Date(story.published_at || new Date()).toLocaleDateString()}
                        </span>
                      </div>

                      <h2 className={`text-xl md:text-2xl font-bold text-brand-navy mb-3 ${isUrdu ? 'font-urduHeading' : ''}`}>
                        {isUrdu ? (story.title_ur || story.title_en) : story.title_en}
                      </h2>

                      <p className={`text-brand-navy/60 leading-relaxed mb-4 ${isUrdu ? 'font-urduBody' : ''}`}>
                        {isUrdu ? (story.excerpt_ur || story.excerpt_en) : story.excerpt_en}
                      </p>

                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.3 }}
                            className="overflow-hidden"
                          >
                            <div className={`text-brand-navy/70 leading-relaxed space-y-4 mb-6 ${isUrdu ? 'font-urduBody' : ''}`}>
                              {(isUrdu ? (story.content_ur || story.content_en) : story.content_en)?.split('\n\n').map((para, i) => (
                                <p key={i}>{para}</p>
                              ))}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      <button
                        onClick={() => toggleStory(story.id)}
                        className={`mt-auto flex items-center gap-2 text-brand-teal font-medium text-sm hover:text-brand-navy transition-colors ${isUrdu ? 'flex-row-reverse' : ''}`}
                      >
                        {isExpanded
                          ? (isUrdu ? 'کم پڑھیں' : 'Read Less')
                          : (isUrdu ? 'پوری کہانی پڑھیں' : 'Read Full Story')}
                        <ChevronDown className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                      </button>
                    </div>
                  </div>
                </motion.article>
              );
            })
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default ImpactStories;
