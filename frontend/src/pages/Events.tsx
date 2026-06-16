import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { MapPin, Calendar, Check, Plus } from 'lucide-react';
import { getEvents } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import { fetchApi } from '../lib/apiClient';

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
  const { user } = useAuth();
  const [registeredEventIds, setRegisteredEventIds] = useState<Set<string>>(new Set());
  const [registeringId, setRegisteringId] = useState<string | null>(null);

  useEffect(() => {
    const fetchRegistrations = async () => {
      if (!user) return;
      const { data } = await fetchApi('/event-registrations/me');
      if (Array.isArray(data)) {
        setRegisteredEventIds(new Set(data.map((r: any) => r.event_id)));
      }
    };
    fetchRegistrations();
  }, [user]);

  const handleRegister = async (eventId: string) => {
    if (!user || registeredEventIds.has(eventId)) return;
    setRegisteringId(eventId);
    const { error } = await fetchApi(`/events/${eventId}/register`, { method: 'POST' });
    if (!error) {
      setRegisteredEventIds(prev => new Set(prev).add(eventId));
      window.dispatchEvent(new CustomEvent('app-toast', { detail: { message: 'Successfully registered!', variant: 'success' } }));
    } else {
      window.dispatchEvent(new CustomEvent('app-toast', { detail: { message: error, variant: 'error' } }));
    }
    setRegisteringId(null);
  };

  useEffect(() => {
    const fetchEvents = async () => {
      setLoading(true);
      setFetchError('');
      try {
        const data = await getEvents();
        setEvents(data);
      } catch (err) {
        setFetchError('Failed to load events');
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

                    {user && (
                      <button
                        onClick={() => handleRegister(event.id)}
                        disabled={registeredEventIds.has(event.id) || registeringId === event.id}
                        className={`mt-4 w-full py-2 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-colors ${
                          registeredEventIds.has(event.id)
                            ? 'bg-green-50 text-green-700 border border-green-200'
                            : 'bg-brand-teal text-white hover:bg-brand-teal/90'
                        } disabled:opacity-70`}
                      >
                        {registeredEventIds.has(event.id) ? (
                          <>
                            <Check className="w-4 h-4" />
                            {isUrdu ? 'رجسٹرڈ ✓' : 'Registered ✓'}
                          </>
                        ) : registeringId === event.id ? (
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        ) : (
                          <>
                            <Plus className="w-4 h-4" />
                            {isUrdu ? 'رجسٹر کریں' : 'Register'}
                          </>
                        )}
                      </button>
                    )}
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
