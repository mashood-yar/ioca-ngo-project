import React, { useState, useRef } from 'react';
import { Helmet } from 'react-helmet-async';
import { motion, useInView, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { galleryItems } from '../data/mockData';
import type { GalleryItem } from '../types';
import { optimizeImage } from '../lib/optimizeImage';

interface GalleryProps {
  isUrdu: boolean;
}

const Gallery: React.FC<GalleryProps> = ({ isUrdu }) => {
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [selectedImage, setSelectedImage] = useState<GalleryItem | null>(null);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-50px' });

  const filters = [
    { key: 'all', labelEn: 'All', labelUr: 'سب' },
    { key: 'education', labelEn: 'Education', labelUr: 'تعلیم' },
    { key: 'health', labelEn: 'Health', labelUr: 'صحت' },
    { key: 'youth', labelEn: 'Youth', labelUr: 'نوجوان' },
    { key: 'community', labelEn: 'Community', labelUr: 'کمیونٹی' },
  ];

  const filtered = activeFilter === 'all'
    ? galleryItems
    : galleryItems.filter(g => g.category === activeFilter);

  // Close lightbox on Escape
  React.useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSelectedImage(null);
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  // Scroll lock when lightbox is open
  React.useEffect(() => {
    document.body.style.overflow = selectedImage ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [selectedImage]);

  return (
    <>
      <Helmet>
        <title>{isUrdu ? 'گیلری | IOCA' : 'Gallery | IOCA'}</title>
        <meta name="description" content="Browse photos from IOCA's events, programs, and community outreach across Pakistan." />
      </Helmet>

      <div className="py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4 md:px-16">
          {/* Header */}
          <motion.div
            className="mb-10"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className={`text-4xl md:text-6xl font-extrabold text-brand-navy mb-4 ${isUrdu ? 'font-urduHeading' : ''}`}>
              {isUrdu ? 'گیلری' : 'Gallery'}
            </h1>
            <p className={`text-brand-navy/60 text-base md:text-lg max-w-2xl ${isUrdu ? 'font-urduBody' : ''}`}>
              {isUrdu
                ? 'ہمارے پروگراموں، تقریبات اور کمیونٹی سرگرمیوں کی تصاویر۔'
                : 'Photos from our programs, events, and community activities across Pakistan.'}
            </p>
          </motion.div>

          {/* Filter Tabs */}
          <div className="flex flex-wrap gap-2 mb-10">
            {filters.map(f => (
              <button
                key={f.key}
                onClick={() => setActiveFilter(f.key)}
                className={`px-5 py-2.5 rounded-full text-sm font-medium transition-all ${
                  activeFilter === f.key
                    ? 'bg-brand-teal text-brand-white shadow-md'
                    : 'bg-brand-white text-brand-navy/70 hover:bg-brand-teal/10 border border-brand-navy/10'
                }`}
              >
                {isUrdu ? f.labelUr : f.labelEn}
              </button>
            ))}
          </div>

          {/* Gallery Grid */}
          <div ref={ref} className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
            {filtered.map((item, idx) => (
              <motion.button
                key={item.id}
                onClick={() => setSelectedImage(item)}
                className="group relative rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-shadow aspect-square cursor-pointer focus:outline-none focus:ring-2 focus:ring-brand-gold"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={isInView ? { opacity: 1, scale: 1 } : {}}
                transition={{ duration: 0.4, delay: idx * 0.05 }}
              >
                <img
                  src={optimizeImage(item.image, { width: 400 })}
                  alt={isUrdu ? item.titleUr : item.titleEn}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                  loading="lazy"
                  decoding="async"
                  width={400}
                  height={400}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col justify-end p-4 md:p-6">
                  <h3 className={`text-white text-lg md:text-xl font-bold mb-2 transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300 ${isUrdu ? 'font-urduHeading text-right' : ''}`}>
                    {isUrdu ? item.titleUr : item.titleEn}
                  </h3>
                  <div className="transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300 delay-75">
                    <span className="inline-block bg-brand-teal text-white text-xs md:text-sm px-4 py-2 rounded-full font-medium hover:bg-brand-navy transition-colors">
                      {isUrdu ? 'مزید جانیں' : 'Learn More'}
                    </span>
                  </div>
                </div>
              </motion.button>
            ))}
          </div>

          {filtered.length === 0 && (
            <div className="text-center py-16 text-brand-navy/40">
              <p className="text-lg">{isUrdu ? 'کوئی تصویر نہیں ملی۔' : 'No images found.'}</p>
            </div>
          )}
        </div>
      </div>

      {/* Lightbox */}
      <AnimatePresence>
        {selectedImage && (
          <motion.div
            className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedImage(null)}
          >
            <button
              className="absolute top-6 right-6 text-white/80 hover:text-white transition-colors z-10"
              onClick={() => setSelectedImage(null)}
              aria-label={isUrdu ? 'بند کریں' : 'Close'}
            >
              <X className="w-8 h-8" />
            </button>
            <div className="relative bg-white rounded-2xl overflow-hidden max-w-5xl w-full flex flex-col md:flex-row shadow-2xl" onClick={(e) => e.stopPropagation()}>
              <div className="w-full md:w-3/5 bg-black flex items-center justify-center relative">
                <img
                  src={optimizeImage(selectedImage.image, { width: 1000 })}
                  alt={isUrdu ? selectedImage.titleUr : selectedImage.titleEn}
                  className="w-full max-h-[50vh] md:max-h-[85vh] object-contain"
                  width={800}
                  height={600}
                  decoding="async"
                />
              </div>
              <div className="w-full md:w-2/5 p-8 md:p-12 flex flex-col justify-center overflow-y-auto max-h-[50vh] md:max-h-[85vh]">
                <h2 className={`text-2xl md:text-3xl font-bold text-brand-navy mb-4 ${isUrdu ? 'font-urduHeading text-right' : ''}`}>
                  {isUrdu ? selectedImage.titleUr : selectedImage.titleEn}
                </h2>
                <div className="w-16 h-1 bg-brand-teal mb-6 rounded-full"></div>
                <p className={`text-brand-navy/70 leading-relaxed text-base md:text-lg ${isUrdu ? 'font-urduBody text-right' : ''}`}>
                  {isUrdu ? selectedImage.descUr : selectedImage.descEn}
                </p>
                <div className="mt-8">
                  <span className="inline-block bg-brand-navy/5 text-brand-teal text-sm px-4 py-1.5 rounded-full font-medium uppercase tracking-wider">
                    {isUrdu ? (selectedImage.category === 'education' ? 'تعلیم' : selectedImage.category === 'health' ? 'صحت' : selectedImage.category === 'youth' ? 'نوجوان' : 'کمیونٹی') : selectedImage.category}
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Gallery;
