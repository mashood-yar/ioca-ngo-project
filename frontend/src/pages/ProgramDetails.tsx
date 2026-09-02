import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import SEO from '../components/SEO';
import { motion } from 'framer-motion';
import { ArrowLeft, Users, FolderOpen, UserCheck } from 'lucide-react';
import { fetchApi } from '../lib/apiClient';
import { formatCompact } from '../utils/formatters';
import type { Program } from '../types';
import { optimizeImage } from '../lib/optimizeImage';

interface ProgramDetailsProps {
  isUrdu: boolean;
}

const ProgramDetails: React.FC<ProgramDetailsProps> = ({ isUrdu }) => {
  const { id } = useParams<{ id: string }>();
  const [program, setProgram] = useState<Program | null>(null);
  const [relatedPrograms, setRelatedPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadProgram = async () => {
      try {
        const { data, error } = await fetchApi<Program>(`/programs/${id}`);
        if (data) {
          setProgram(data);
          // Fetch all active programs for the "Related Programs" section
          const allRes = await fetchApi<Program[]>('/programs');
          if (allRes.data) {
            setRelatedPrograms(allRes.data.filter(p => p.id !== id && p.status === 'active').slice(0, 3));
          }
        }
      } catch (err) {
        console.error('Failed to load program', err);
      } finally {
        setLoading(false);
      }
    };
    if (id) loadProgram();
  }, [id]);

  if (loading) {
    return <div className="min-h-[60vh] flex items-center justify-center text-brand-navy">Loading...</div>;
  }

  if (!program) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center text-center px-4">
        <div>
          <h1 className={`text-2xl font-bold text-brand-navy mb-3 ${isUrdu ? 'font-urduHeading' : ''}`}>
            {isUrdu ? 'پروگرام نہیں ملا' : 'Program not found'}
          </h1>
          <Link to="/programs" className="text-brand-teal font-medium hover:underline">
            {isUrdu ? 'تمام پروگرامز دیکھیں' : 'View all programs'}
          </Link>
        </div>
      </div>
    );
  }

  const stats = [
    { icon: Users, value: formatCompact(program.stats_beneficiaries, isUrdu), labelEn: 'Beneficiaries', labelUr: 'مستفیدین' },
    { icon: FolderOpen, value: formatCompact(program.stats_projects, isUrdu), labelEn: 'Projects', labelUr: 'پروجیکٹس' },
    { icon: UserCheck, value: formatCompact(program.stats_volunteers, isUrdu), labelEn: 'Volunteers', labelUr: 'رضاکار' },
  ];

  return (
    <>
      <SEO 
        title={`${isUrdu ? program.title_ur : program.title_en} | IOCA`}
        description={isUrdu ? program.desc_ur : program.desc_en}
        isUrdu={isUrdu}
      />
      
      <div className="bg-brand-white">
        {/* Hero Section */}
        <div className="relative pt-32 pb-20 lg:pt-40 lg:pb-28 overflow-hidden bg-brand-navy">
          {program.hero_image_url || program.image_url ? (
            <div className="absolute inset-0">
              <img 
                src={optimizeImage(program.hero_image_url || program.image_url, { width: 1920 })}
                alt=""
                className="w-full h-full object-cover opacity-30"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-brand-navy via-brand-navy/80 to-transparent" />
            </div>
          ) : null}
          
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <Link 
              to="/programs"
              className="inline-flex items-center text-brand-white/80 hover:text-brand-teal transition-colors mb-8 group"
            >
              <ArrowLeft className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform" />
              {isUrdu ? 'پروگرامز پر واپس جائیں' : 'Back to Programs'}
            </Link>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={`max-w-3xl ${isUrdu ? 'ml-auto text-right' : ''}`}
            >
              {program.category && (
                <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand-teal/20 text-brand-teal mb-6 border border-brand-teal/20 backdrop-blur-sm ${isUrdu ? 'flex-row-reverse' : ''}`}>
                  {program.category.icon_svg && <span dangerouslySetInnerHTML={{ __html: program.category.icon_svg }} className="w-4 h-4" />}
                  <span className={`text-sm font-semibold tracking-wide ${isUrdu ? 'font-urduBody' : ''}`}>
                    {isUrdu ? program.category.name_ur : program.category.name_en}
                  </span>
                </div>
              )}
              <h1 className={`text-4xl md:text-5xl lg:text-6xl font-extrabold text-brand-white mb-6 leading-tight ${isUrdu ? 'font-urduHeading' : ''}`}>
                {isUrdu ? program.title_ur : program.title_en}
              </h1>
              <p className={`text-xl text-brand-white/80 leading-relaxed ${isUrdu ? 'font-urduBody' : ''}`}>
                {isUrdu ? program.desc_ur : program.desc_en}
              </p>
            </motion.div>
          </div>
        </div>

        {/* Content Section */}
        <div className="py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-3 gap-12 lg:gap-16">
              
              {/* Main Content */}
              <div className={`lg:col-span-2 space-y-12 ${isUrdu ? 'lg:order-2' : ''}`}>
                <div className={`prose prose-lg max-w-none prose-headings:text-brand-navy prose-p:text-brand-navy/70 prose-a:text-brand-teal hover:prose-a:text-brand-teal-dark ${isUrdu ? 'font-urduBody text-right text-xl leading-loose text-justify' : ''}`}>
                  <div dangerouslySetInnerHTML={{ __html: (isUrdu ? program.content_ur : program.content_en)?.replace(/\n/g, '<br/>') || '' }} />
                </div>
              </div>

              {/* Sidebar */}
              <div className={`lg:col-span-1 ${isUrdu ? 'lg:order-1' : ''}`}>
                <div className="bg-brand-white rounded-2xl shadow-xl shadow-brand-navy/5 border border-brand-navy/10 p-8 sticky top-24">
                  <h3 className={`text-xl font-bold text-brand-navy mb-8 pb-4 border-b border-brand-navy/10 ${isUrdu ? 'font-urduHeading text-right' : ''}`}>
                    {isUrdu ? 'پروگرام کا اثر' : 'Program Impact'}
                  </h3>
                  <div className="space-y-8">
                    {stats.map((stat, idx) => (
                      <div key={idx} className={`flex items-center gap-4 ${isUrdu ? 'flex-row-reverse text-right' : ''}`}>
                        <div className="w-12 h-12 rounded-xl bg-brand-teal/10 flex items-center justify-center text-brand-teal shrink-0">
                          <stat.icon className="w-6 h-6" />
                        </div>
                        <div>
                          <div className="text-2xl font-bold text-brand-navy">{stat.value}</div>
                          <div className={`text-sm font-medium text-brand-navy/60 ${isUrdu ? 'font-urduBody' : ''}`}>
                            {isUrdu ? stat.labelUr : stat.labelEn}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-10 pt-8 border-t border-brand-navy/10">
                    <Link
                      to="/donate"
                      className={`w-full block text-center py-4 px-6 bg-brand-teal hover:bg-brand-teal-dark text-white rounded-xl font-semibold transition-colors shadow-lg shadow-brand-teal/20 ${isUrdu ? 'font-urduBody text-lg' : ''}`}
                    >
                      {isUrdu ? 'اس پروگرام کی حمایت کریں' : 'Support This Program'}
                    </Link>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ProgramDetails;
