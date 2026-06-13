import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { MapPin, Calendar } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface EventItem {
  id: string;
  title: string;
  description: string;
  location: string | null;
  event_date: string | null;
  image_url: string | null;
}

interface EventsProps {
  isUrdu: boolean;
}

const Events: React.FC<EventsProps> = ({ isUrdu }) => {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState('');

  useEffect(() => {
    const fetchEvents = async () => {
      setLoading(true);
      setFetchError('');

      try {
        const { data, error } = await supabase
          .from('events')
          .select('*')
          .order('event_date', { ascending: false });

        if (error) {
          console.warn('Failed to load events from Supabase, falling back to empty state.');
          setEvents([]);
        } else {
          setEvents(data ?? []);
        }
      } catch (err) {
        console.warn('Exception during Supabase fetch, falling back to empty state.', err);
        setEvents([]);
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, [isUrdu]);

  return (
    <>
      <Helmet>
        <title>{isUrdu ? 'تقریبات | IOCA' : 'Events | IOCA'}</title>
        <meta name="description" content="Upcoming and past events from IOCA's community programs across Pakistan." />
      </Helmet>

      <div className="py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4 md:px-16">
          <motion.div
            className="mb-10"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className={`text-4xl md:text-6xl font-extrabold text-brand-navy mb-4 ${isUrdu ? 'font-urduHeading' : ''}`}>
              {isUrdu ? 'تقریبات' : 'Events'}
            </h1>
            <p className={`text-brand-navy/60 text-base md:text-lg max-w-2xl ${isUrdu ? 'font-urduBody' : ''}`}>
              {isUrdu
                ? 'IOCA کی آنے والی اور گزشتہ تقریبات۔'
                : 'Upcoming and past events from IOCA\'s community programs.'}
            </p>
          </motion.div>

          {loading ? (
            <p className="text-brand-navy/60 text-center py-16">{isUrdu ? 'لوڈ ہو رہا ہے...' : 'Loading...'}</p>
          ) : fetchError ? (
            <p className="text-red-600 text-center py-16">{fetchError}</p>
          ) : events.length === 0 ? (
            <p className="text-brand-navy/60 text-center py-16">{isUrdu ? 'کوئی تقریب نہیں۔' : 'No events yet.'}</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {events.map((event, idx) => (
                <motion.div
                  key={event.id}
                  className="bg-brand-white rounded-[2rem] overflow-hidden shadow-md hover:shadow-xl transition-all group"
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-50px' }}
                  transition={{ duration: 0.5, delay: idx * 0.08 }}
                >
                  <div className="relative h-48 overflow-hidden">
                    <img
                      src={event.image_url ?? '/assets/hero-community.webp'}
                      alt={event.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
                  </div>

                  <div className="p-6">
                    <h3 className={`text-lg font-bold text-brand-navy mb-2 ${isUrdu ? 'font-urduHeading' : ''}`}>
                      {event.title}
                    </h3>

                    {event.location && (
                      <div className="flex items-center gap-1.5 text-brand-navy/50 text-xs mb-2">
                        <MapPin className="w-3 h-3 shrink-0" />
                        <span>{event.location}</span>
                      </div>
                    )}

                    {event.event_date && (
                      <div className="flex items-center gap-1.5 text-brand-navy/50 text-xs mb-4">
                        <Calendar className="w-3 h-3 shrink-0" />
                        <span>{new Date(event.event_date).toLocaleString()}</span>
                      </div>
                    )}

                    <p className={`text-sm text-brand-navy/60 leading-relaxed line-clamp-3 ${isUrdu ? 'font-urduBody' : ''}`}>
                      {event.description}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default Events;
