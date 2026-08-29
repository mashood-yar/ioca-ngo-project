import React, { useState, useRef, useEffect } from 'react';
import SEO from '../components/SEO';
import { motion, useInView, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { optimizeImage } from '../lib/optimizeImage';
import { fetchApi } from '../lib/apiClient';

interface GalleryProps {
  isUrdu: boolean;
}

interface GalleryDBItem {
  id: string;
  image_url: string;
  title_en: string;
  title_ur: string;
  desc_en: string;
  desc_ur: string;
  category: string;
}

const Gallery: React.FC<GalleryProps> = ({ isUrdu }) => {
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [selectedImage, setSelectedImage] = useState<GalleryDBItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [galleryItems, setGalleryItems] = useState<GalleryDBItem[]>([]);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-50px' });

  useEffect(() => {
    const loadGallery = async () => {
      try {
        const { data, error } = await fetchApi<GalleryDBItem[]>('/gallery');
        if (data) setGalleryItems(data);
        if (error) console.error(error);
      } finally {
        setLoading(false);
      }
    };
    loadGallery();
  }, []);

  // Compute unique categories
  const categories = React.useMemo(() => {
    const unique = [...new Set(galleryItems.map(item => item.category).filter(Boolean))];
    return unique.sort();
  }, [galleryItems]);

  const filtered = activeFilter === 'all'
    ? galleryItems
    : galleryItems.filter(g => g.category === activeFilter);

  // Close lightbox on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSelectedImage(null);
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  // Scroll lock when lightbox is open
  useEffect(() => {
    document.body.style.overflow = selectedImage ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [selectedImage]);

  return (
    <>
      <SEO 
        title={isUrdu ? 'گیلری | IOCA' : 'Gallery | IOCA'}
        description="Browse photos from IOCA's events, programs, and community outreach across Pakistan."
        isUrdu={isUrdu}
      />

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
            <button
              onClick={() => setActiveFilter('all')}
              className={`px-5 py-2.5 rounded-full text-sm font-medium transition-all ${
                activeFilter === 'all'
                  ? 'bg-brand-teal text-brand-white shadow-md'
                  : 'bg-brand-white text-brand-navy/70 hover:bg-brand-teal/10 border border-brand-navy/10'
              }`}
            >
              {isUrdu ? 'سب' : 'All'}
            </button>
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveFilter(cat)}
                className={`px-5 py-2.5 rounded-full text-sm font-medium capitalize transition-all ${
                  activeFilter === cat
                    ? 'bg-brand-teal text-brand-white shadow-md'
                    : 'bg-brand-white text-brand-navy/70 hover:bg-brand-teal/10 border border-brand-navy/10'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Gallery Grid */}
          <div ref={ref} className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
            {loading ? (
              // Skeleton Loader
              <>
                {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                  <div key={i} className="rounded-xl bg-brand-navy/10 animate-pulse aspect-square shadow-sm border border-brand-navy/5" />
                ))}
              </>
            ) : (
            filtered.map((item, idx) => (
              <motion.button
                key={item.id}
                onClick={() => setSelectedImage(item)}
                className="group relative rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-shadow aspect-square cursor-pointer focus:outline-none focus:ring-2 focus:ring-brand-gold"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={isInView ? { opacity: 1, scale: 1 } : {}}
                transition={{ duration: 0.4, delay: idx * 0.05 }}
              >
                <img
                  src={optimizeImage(item.image_url, { width: 400 })}
                  alt={isUrdu ? (item.title_ur || item.title_en) : (item.title_en || item.title_ur)}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                  loading="lazy"
                  decoding="async"
                  width={400}
                  height={400}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col justify-end p-4 md:p-6">
                  <h3 className={`text-white text-lg md:text-xl font-bold mb-2 transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300 ${isUrdu ? 'font-urduHeading text-right' : ''}`}>
                    {isUrdu ? (item.title_ur || item.title_en) : (item.title_en || item.title_ur)}
                  </h3>
                  <div className="transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300 delay-75">
                    <span className="inline-block bg-brand-teal text-white text-xs md:text-sm px-4 py-2 rounded-lg font-medium hover:bg-brand-navy transition-colors">
                      {isUrdu ? 'مزید جانیں' : 'Learn More'}
                    </span>
                  </div>
                </div>
              </motion.button>
            ))
            )}
          </div>

          {!loading && filtered.length === 0 && (
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
            <div className="relative bg-white rounded-xl overflow-hidden max-w-5xl w-full flex flex-col md:flex-row shadow-2xl" onClick={(e) => e.stopPropagation()}>
              <div className="w-full md:w-3/5 bg-black flex items-center justify-center relative">
                <img
                  src={optimizeImage(selectedImage.image_url, { width: 1000 })}
                  alt={isUrdu ? (selectedImage.title_ur || selectedImage.title_en) : (selectedImage.title_en || selectedImage.title_ur)}
                  className="w-full max-h-[50vh] md:max-h-[85vh] object-contain"
                  width={800}
                  height={600}
                  decoding="async"
                />
              </div>
              <div className="w-full md:w-2/5 p-8 md:p-12 flex flex-col justify-center overflow-y-auto max-h-[50vh] md:max-h-[85vh]">
                <h2 className={`text-2xl md:text-3xl font-bold text-brand-navy mb-4 ${isUrdu ? 'font-urduHeading text-right' : ''}`}>
                  {isUrdu ? (selectedImage.title_ur || selectedImage.title_en) : (selectedImage.title_en || selectedImage.title_ur)}
                </h2>
                <div className="w-16 h-1 bg-brand-teal mb-6 rounded-full"></div>
                <p className={`text-brand-navy/70 leading-relaxed text-base md:text-lg ${isUrdu ? 'font-urduBody text-right' : ''}`}>
                  {isUrdu ? (selectedImage.desc_ur || selectedImage.desc_en) : (selectedImage.desc_en || selectedImage.desc_ur)}
                </p>
                <div className="mt-8">
                  <span className="inline-block bg-brand-navy/5 text-brand-teal text-sm px-4 py-1.5 rounded-full font-medium uppercase tracking-wider capitalize">
                    {selectedImage.category}
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
