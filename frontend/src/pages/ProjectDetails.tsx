import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import SEO from '../components/SEO';
import { motion } from 'framer-motion';
import { ArrowLeft, MapPin, Calendar, CheckCircle2, Clock, Heart } from 'lucide-react';
import { fetchApi } from '../lib/apiClient';
import { optimizeImage } from '../lib/optimizeImage';
import type { Project } from '../types';
import { PageLoadingSpinner } from '../components/PageLoadingSpinner';

interface ProjectDetailsProps {
  isUrdu: boolean;
}

const ProjectDetails: React.FC<ProjectDetailsProps> = ({ isUrdu }) => {
  const { id } = useParams<{ id: string }>();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    fetchApi<Project>(`/projects/${id}`)
      .then(({ data, error }) => {
        if (error) setError(error);
        else if (data) setProject(data);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <PageLoadingSpinner />;

  if (error || !project) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4">
        <h2 className="text-2xl font-bold text-brand-navy mb-4">
          {isUrdu ? 'پروجیکٹ نہیں ملا' : 'Project Not Found'}
        </h2>
        <p className="text-brand-gray-dark mb-6">
          {isUrdu ? 'جس پروجیکٹ کی آپ تلاش کر رہے ہیں وہ موجود نہیں ہے۔' : 'The project you are looking for does not exist.'}
        </p>
        <Link to="/projects" className="text-brand-teal hover:underline font-semibold flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" /> {isUrdu ? 'پروجیکٹس پر واپس جائیں' : 'Back to Projects'}
        </Link>
      </div>
    );
  }

  const title = isUrdu ? (project.titleUr || project.titleEn || project.title) : (project.titleEn || project.titleUr || project.title);
  const description = isUrdu ? (project.descUr || project.descEn || project.description) : (project.descEn || project.descUr || project.description);
  const location = isUrdu ? (project.locationUr || project.locationEn) : (project.locationEn || project.locationUr);

  const getStatusDisplay = () => {
    switch (project.status) {
      case 'ongoing':
        return { icon: Clock, textEn: 'Ongoing', textUr: 'جاری', color: 'bg-brand-teal text-white' };
      case 'completed':
        return { icon: CheckCircle2, textEn: 'Completed', textUr: 'مکمل', color: 'bg-brand-gold text-brand-navy' };
      case 'upcoming':
        return { icon: Calendar, textEn: 'Upcoming', textUr: 'جلد آ رہا ہے', color: 'bg-purple-600 text-white' };
      case 'paused':
        return { icon: Clock, textEn: 'Paused', textUr: 'روک دیا گیا', color: 'bg-gray-500 text-white' };
      default:
        return { icon: Clock, textEn: 'Ongoing', textUr: 'جاری', color: 'bg-brand-teal text-white' };
    }
  };

  const statusObj = getStatusDisplay();
  const StatusIcon = statusObj.icon;

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return null;
    try {
      const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric' };
      return new Date(dateString).toLocaleDateString(isUrdu ? 'ur-PK' : 'en-US', options);
    } catch {
      return null;
    }
  };

  const startDate = formatDate(project.start_date || project.startDate);
  const endDate = formatDate(project.end_date || project.endDate);

  return (
    <div className={`min-h-screen bg-brand-gray-light pt-24 pb-16 ${isUrdu ? 'font-urdu text-right' : 'text-left'}`} dir={isUrdu ? 'rtl' : 'ltr'}>
      <SEO 
        title={`${title} - IOCA`}
        description={description?.substring(0, 150) || ''}
      />
      
      <div className="container mx-auto px-4 max-w-5xl">
        <Link to="/projects" className="inline-flex items-center gap-2 text-brand-teal hover:text-brand-navy font-semibold mb-6 transition-colors">
          <ArrowLeft className={`w-4 h-4 ${isUrdu ? 'rotate-180' : ''}`} />
          {isUrdu ? '???? ????????' : 'All Projects'}
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-xl overflow-hidden border border-brand-teal/10"
        >
          {/* Hero Image */}
          <div className="relative h-[30vh] md:h-[50vh] w-full bg-gray-100">
            <img
              src={optimizeImage(project.image_url || '/assets/hero-community.webp', { width: 1200 })}
              alt={title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
            
            <div className="absolute bottom-0 left-0 right-0 p-6 md:p-10">
              <div className="flex flex-wrap items-center gap-3 mb-4">
                <span className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-bold shadow-md ${statusObj.color}`}>
                  <StatusIcon className="w-4 h-4" />
                  {isUrdu ? statusObj.textUr : statusObj.textEn}
                </span>
              </div>
              <h1 className="text-3xl md:text-5xl font-extrabold text-white leading-tight drop-shadow-md">
                {title}
              </h1>
            </div>
          </div>

          <div className="p-6 md:p-10 grid grid-cols-1 lg:grid-cols-3 gap-10">
            <div className="lg:col-span-2 space-y-8">
              <section>
                <h2 className="text-2xl font-bold text-brand-navy mb-4 border-b-2 border-brand-teal/20 pb-2 inline-block">
                  {isUrdu ? '??????? ?? ???????' : 'Project Details'}
                </h2>
                <div className="text-brand-gray-dark leading-relaxed whitespace-pre-wrap">
                  {description}
                </div>
              </section>

              {project.status !== 'completed' && (
                <div className="bg-brand-teal/10 rounded-xl p-8 text-center border border-brand-teal/20">
                  <h3 className="text-xl font-bold text-brand-navy mb-3">
                    {isUrdu ? '????? ???? ?? ????? ????' : 'Support Our Cause'}
                  </h3>
                  <p className="text-brand-gray-dark mb-6">
                    {isUrdu ? '?? ?? ???? ???????? ??? ????? ?????? ?? ???? ???' : 'Your donation can make a real difference in the communities.'}
                  </p>
                  <Link
                    to="/donate"
                    className="inline-flex items-center justify-center gap-2 px-8 py-3 bg-brand-teal text-white font-bold rounded-lg shadow-md shadow-brand-teal/20 hover:opacity-90 transition-opacity"
                  >
                    <Heart className="w-5 h-5" />
                    {isUrdu ? '???? ???? ????' : 'Donate Now'}
                  </Link>
                </div>
              )}
            </div>

            <div className="space-y-6">
              <div className="bg-gray-50 rounded-xl p-6 border border-gray-100">
                <h3 className="text-lg font-bold text-brand-navy mb-4 pb-2 border-b border-gray-200">
                  {isUrdu ? '???????' : 'Information'}
                </h3>
                
                <ul className="space-y-4">
                  {location && (
                    <li className="flex items-start gap-3 text-brand-gray-dark">
                      <MapPin className="w-5 h-5 text-brand-teal shrink-0 mt-0.5" />
                      <span>{location}</span>
                    </li>
                  )}
                  {startDate && (
                    <li className="flex items-start gap-3 text-brand-gray-dark">
                      <Calendar className="w-5 h-5 text-brand-teal shrink-0 mt-0.5" />
                      <div>
                        <div className="text-xs text-gray-500 uppercase font-semibold">{isUrdu ? '????' : 'Start Date'}</div>
                        <div>{startDate}</div>
                      </div>
                    </li>
                  )}
                  {endDate && (
                    <li className="flex items-start gap-3 text-brand-gray-dark">
                      <CheckCircle2 className="w-5 h-5 text-brand-teal shrink-0 mt-0.5" />
                      <div>
                        <div className="text-xs text-gray-500 uppercase font-semibold">{isUrdu ? '??????' : 'End Date'}</div>
                        <div>{endDate}</div>
                      </div>
                    </li>
                  )}
                </ul>

                {project.progress !== undefined && project.progress !== null && project.progress > 0 && (
                  <div className="mt-8 pt-6 border-t border-gray-200">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-bold text-brand-navy text-sm uppercase">{isUrdu ? 'پیش رفت' : 'Progress'}</span>
                      <span className="font-bold text-brand-teal">{project.progress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${project.progress}%` }}
                        transition={{ duration: 1, ease: "easeOut" }}
                        className="bg-brand-teal h-2.5 rounded-full"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default ProjectDetails;
