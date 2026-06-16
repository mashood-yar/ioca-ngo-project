import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Calendar } from 'lucide-react';
import { getNews } from '../services/api';

interface NewsItem {
  id: string;
  title: string;
  content: string;
  image_url: string | null;
  published_at: string;
}

interface NewsProps {
  isUrdu: boolean;
}

const News: React.FC<NewsProps> = ({ isUrdu }) => {
  const [posts, setPosts] = useState<NewsItem[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState('');

  useEffect(() => {
    const fetchNews = async () => {
      setLoading(true);
      setFetchError('');
      try {
        const data = await getNews();
        setPosts(data);
      } catch (err) {
        setFetchError('Failed to load news');
      } finally {
        setLoading(false);
      }
    };

    fetchNews();
  }, [isUrdu]);

  const togglePost = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  return (
    <>
      <Helmet>
        <title>{isUrdu ? 'خبریں | IOCA' : 'News | IOCA'}</title>
        <meta name="description" content="Latest news and updates from IOCA's community advancement programs across Pakistan." />
      </Helmet>

      <div className="py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4 md:px-16">
          <motion.div
            className="mb-12"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className={`text-4xl md:text-6xl font-extrabold text-brand-navy mb-4 ${isUrdu ? 'font-urduHeading' : ''}`}>
              {isUrdu ? 'خبریں' : 'News'}
            </h1>
            <p className={`text-brand-navy/60 text-base md:text-lg max-w-2xl ${isUrdu ? 'font-urduBody' : ''}`}>
              {isUrdu
                ? 'IOCA کی تازہ ترین خبریں اور اپ ڈیٹس۔'
                : 'Latest news and updates from IOCA\'s work in communities across Pakistan.'}
            </p>
          </motion.div>

          {loading ? (
            <p className="text-brand-navy/60 text-center py-16">{isUrdu ? 'لوڈ ہو رہا ہے...' : 'Loading...'}</p>
          ) : fetchError ? (
            <p className="text-red-600 text-center py-16">{fetchError}</p>
          ) : posts.length === 0 ? (
            <p className="text-brand-navy/60 text-center py-16">{isUrdu ? 'کوئی خبر نہیں۔' : 'No news posts yet.'}</p>
          ) : (
            <div className="space-y-8">
              {posts.map((post, idx) => {
                const isExpanded = expandedId === post.id;
                return (
                  <motion.article
                    key={post.id}
                    className="bg-brand-white rounded-[2rem] overflow-hidden shadow-md"
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: '-50px' }}
                    transition={{ duration: 0.5, delay: idx * 0.15 }}
                  >
                    <div className="grid grid-cols-1 md:grid-cols-5">
                      {post.image_url && (
                        <div className="md:col-span-2 h-48 md:h-full overflow-hidden">
                          <img
                            src={post.image_url}
                            alt={post.title}
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                        </div>
                      )}

                      <div className={`${post.image_url ? 'md:col-span-3' : 'md:col-span-5'} p-6 md:p-10 flex flex-col`}>
                        <div className="flex flex-wrap items-center gap-2 mb-4">
                          <span className="flex items-center gap-1 text-[11px] text-brand-navy/40">
                            <Calendar className="w-3 h-3" />
                            {new Date(post.published_at).toLocaleDateString()}
                          </span>
                        </div>

                        <h2 className={`text-xl md:text-2xl font-bold text-brand-navy mb-3 ${isUrdu ? 'font-urduHeading' : ''}`}>
                          {post.title}
                        </h2>

                        <p className={`text-brand-navy/60 leading-relaxed mb-4 line-clamp-3 ${isUrdu ? 'font-urduBody' : ''}`}>
                          {post.content}
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
                                {post.content.split('\n\n').map((para, i) => (
                                  <p key={i}>{para}</p>
                                ))}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>

                        <button
                          onClick={() => togglePost(post.id)}
                          className={`mt-auto flex items-center gap-2 text-brand-teal font-medium text-sm hover:text-brand-navy transition-colors ${isUrdu ? 'flex-row-reverse' : ''}`}
                        >
                          {isExpanded
                            ? (isUrdu ? 'کم پڑھیں' : 'Read Less')
                            : (isUrdu ? 'مزید پڑھیں' : 'Read More')}
                          <ChevronDown className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                        </button>
                      </div>
                    </div>
                  </motion.article>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default News;
