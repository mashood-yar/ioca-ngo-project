import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { MapPin, Calendar, CheckCircle2, Clock, Heart } from 'lucide-react';
import { getProjects } from '../services/api';
import type { Project } from '../types';
import { toUrduNumerals } from '../utils/formatters';

interface ProjectsProps {
  isUrdu: boolean;
}

const Projects: React.FC<ProjectsProps> = ({ isUrdu }) => {
  const [activeFilter, setActiveFilter] = useState<'all' | 'ongoing' | 'completed'>('all');
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState('');

  useEffect(() => {
      const fetchProjects = async () => {
      setLoading(true);
      setFetchError('');
      try {
        const data = await getProjects();
        setProjects(data);
      } catch (err) {
        setFetchError('Failed to load projects');
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, [isUrdu]);

  const filters = [
    { key: 'all' as const, labelEn: 'All Projects', labelUr: 'تمام پروجیکٹس' },
    { key: 'ongoing' as const, labelEn: 'Ongoing', labelUr: 'جاری' },
    { key: 'completed' as const, labelEn: 'Completed', labelUr: 'مکمل' },
  ];

  const filtered = activeFilter === 'all'
    ? projects
    : projects.filter(p => p.status === activeFilter);

  return (
    <>
      <Helmet>
        <title>{isUrdu ? 'پروجیکٹس | IOCA' : 'Projects | IOCA'}</title>
        <meta name="description" content="Discover IOCA's ongoing and completed projects across Pakistan - from clean water initiatives to flood relief and school reconstruction." />
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
              {isUrdu ? 'ہمارے پروجیکٹس' : 'Our Projects'}
            </h1>
            <p className={`text-brand-navy/60 text-base md:text-lg max-w-2xl ${isUrdu ? 'font-urduBody' : ''}`}>
              {isUrdu
                ? 'پاکستان بھر میں ہمارے فعال اور مکمل شدہ منصوبوں کا جائزہ لیں۔'
                : 'Explore our active and completed initiatives transforming communities across Pakistan.'}
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

          {/* Projects Grid */}
          {loading ? (
            <p className="text-brand-navy/60 text-center py-16">{isUrdu ? 'لوڈ ہو رہا ہے...' : 'Loading...'}</p>
          ) : fetchError ? (
            <p className="text-red-600 text-center py-16">{fetchError}</p>
          ) : (
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {filtered.map((project, idx) => (
              <motion.div
                key={project.id}
                className="bg-brand-white rounded-[1.5rem] md:rounded-[2rem] overflow-hidden shadow-md hover:shadow-xl transition-all group"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-50px' }}
                transition={{ duration: 0.5, delay: idx * 0.08 }}
              >
                <div className="relative h-28 md:h-48 overflow-hidden">
                  <img
                    src={project.image}
                    alt={isUrdu ? project.titleUr : project.titleEn}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
                  {/* Status Badge */}
                  <span className={`absolute top-3 ${isUrdu ? 'right-3' : 'left-3'} text-[10px] md:text-xs font-bold uppercase px-2 md:px-3 py-1 rounded-full flex items-center gap-1 ${
                    project.status === 'ongoing'
                      ? 'bg-brand-teal text-brand-white'
                      : 'bg-brand-gold text-brand-navy'
                  }`}>
                    {project.status === 'ongoing'
                      ? <Clock className="w-3 h-3" />
                      : <CheckCircle2 className="w-3 h-3" />
                    }
                    {isUrdu ? project.statusUr : project.statusEn}
                  </span>
                </div>

                <div className="p-4 md:p-6">
                  <h3 className={`text-sm md:text-lg font-bold text-brand-navy mb-2 ${isUrdu ? 'font-urduHeading' : ''}`}>
                    {isUrdu ? project.titleUr : project.titleEn}
                  </h3>

                  <div className="flex items-center gap-1.5 text-brand-navy/50 text-[11px] md:text-xs mb-2">
                    <MapPin className="w-3 h-3 shrink-0" />
                    <span>{isUrdu ? project.locationUr : project.locationEn}</span>
                  </div>

                  <div className="flex items-center gap-1.5 text-brand-navy/50 text-[11px] md:text-xs mb-4">
                    <Calendar className="w-3 h-3 shrink-0" />
                    <span>{project.date}</span>
                  </div>

                  <p className={`text-xs md:text-sm text-brand-navy/60 leading-relaxed mb-4 ${isUrdu ? 'font-urduBody' : ''}`}>
                    {isUrdu ? project.descUr : project.descEn}
                  </p>

                  {/* Progress Bar */}
                  <div>
                    <div className="flex justify-between text-[10px] md:text-xs text-brand-navy/50 mb-1.5">
                      <span>{isUrdu ? 'پیشرفت' : 'Progress'}</span>
                      <span className="font-bold text-brand-navy">
                        {isUrdu ? `${toUrduNumerals(project.progress)}٪` : `${project.progress}%`}
                      </span>
                    </div>
                    <div
                      className="w-full h-2 bg-brand-gray rounded-full overflow-hidden"
                      role="progressbar"
                      aria-valuenow={project.progress}
                      aria-valuemin={0}
                      aria-valuemax={100}
                    >
                      <div
                        className={`h-full rounded-full transition-all duration-1000 ${
                          project.progress === 100 ? 'bg-brand-gold' : 'bg-brand-teal'
                        }`}
                        style={{ width: `${project.progress}%` }}
                      />
                    </div>
                  </div>

                  {project.status === 'ongoing' && (
                    <div className="mt-6">
                      <Link
                        to="/donate"
                        className="w-full bg-brand-teal text-brand-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 hover:opacity-90 transition-opacity shadow-md shadow-brand-teal/20"
                      >
                        <Heart className="w-4 h-4" />
                        {isUrdu ? 'ابھی عطیہ کریں' : 'Donate Now'}
                      </Link>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
          )}

          {!loading && !fetchError && filtered.length === 0 && (
            <div className="text-center py-16 text-brand-navy/40">
              <p className="text-lg">{isUrdu ? 'کوئی پروجیکٹ نہیں ملا۔' : 'No projects found.'}</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default Projects;
