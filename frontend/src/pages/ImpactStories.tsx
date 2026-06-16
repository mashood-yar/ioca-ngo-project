import React, { useState, useRef } from 'react';
import { Helmet } from 'react-helmet-async';
import { motion, useInView, AnimatePresence } from 'framer-motion';
import { ChevronDown, Quote, Calendar, Tag } from 'lucide-react';
import { impactStories } from '../data/mockData';

interface ImpactStoriesProps {
  isUrdu: boolean;
}

const ImpactStories: React.FC<ImpactStoriesProps> = ({ isUrdu }) => {
  const [expandedStory, setExpandedStory] = useState<string | null>(null);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-50px' });

  const toggleStory = (id: string) => {
    setExpandedStory(prev => prev === id ? null : id);
  };

  return (
    <>
      <Helmet>
        <title>{isUrdu ? 'کہانیاں | IOCA' : 'Impact Stories | IOCA'}</title>
        <meta name="description" content="Read inspiring stories of transformation - real people, real communities, real impact through IOCA's programs." />
      </Helmet>

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
            {impactStories.map((story, idx) => {
              const isExpanded = expandedStory === story.id;
              return (
                <motion.article
                  key={story.id}
                  className="bg-brand-white rounded-[2rem] overflow-hidden shadow-md"
                  initial={{ opacity: 0, y: 30 }}
                  animate={isInView ? { opacity: 1, y: 0 } : {}}
                  transition={{ duration: 0.5, delay: idx * 0.15 }}
                >
                  <div className="grid grid-cols-1 md:grid-cols-5">
                    {/* Image */}
                    <div className="md:col-span-2 h-48 md:h-full overflow-hidden">
                      <img
                        src={story.image}
                        alt={isUrdu ? story.titleUr : story.titleEn}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    </div>

                    {/* Content */}
                    <div className="md:col-span-3 p-6 md:p-10 flex flex-col">
                      <div className="flex flex-wrap items-center gap-2 mb-4">
                        <span className="flex items-center gap-1 text-[11px] bg-brand-teal/10 text-brand-teal px-3 py-1 rounded-full font-medium">
                          <Tag className="w-3 h-3" />
                          {isUrdu ? story.categoryUr : story.categoryEn}
                        </span>
                        <span className="flex items-center gap-1 text-[11px] text-brand-navy/40">
                          <Calendar className="w-3 h-3" />
                          {story.date}
                        </span>
                      </div>

                      <h2 className={`text-xl md:text-2xl font-bold text-brand-navy mb-3 ${isUrdu ? 'font-urduHeading' : ''}`}>
                        {isUrdu ? story.titleUr : story.titleEn}
                      </h2>

                      <p className={`text-brand-navy/60 leading-relaxed mb-4 ${isUrdu ? 'font-urduBody' : ''}`}>
                        {isUrdu ? story.excerptUr : story.excerptEn}
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
                              {(isUrdu ? story.contentUr : story.contentEn).split('\n\n').map((para, i) => (
                                <p key={i}>{para}</p>
                              ))}
                            </div>

                            <blockquote className="border-s-4 border-brand-gold ps-6 py-2 mb-4">
                              <Quote className="w-5 h-5 text-brand-gold mb-2" aria-hidden="true" />
                              <p className={`text-lg italic text-brand-navy ${isUrdu ? 'font-urduBody' : 'font-serif'}`}>
                                {isUrdu ? story.quoteUr : story.quoteEn}
                              </p>
                            </blockquote>
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
            })}
          </div>
        </div>
      </div>
    </>
  );
};

export default ImpactStories;
