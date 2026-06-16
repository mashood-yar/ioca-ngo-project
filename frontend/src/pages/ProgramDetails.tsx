import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { ArrowLeft, Users, FolderOpen, UserCheck } from 'lucide-react';
import { programs } from '../data/mockData';
import { formatCompact } from '../utils/formatters';
import type { Program } from '../types';

interface ProgramDetailsProps {
  isUrdu: boolean;
}

const ProgramDetails: React.FC<ProgramDetailsProps> = ({ isUrdu }) => {
  const { id } = useParams<{ id: string }>();
  const program = programs.find(p => p.id === id) as Program | undefined;

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

  const relatedPrograms = programs.filter(p => p.id !== id).slice(0, 3);

  const stats = [
    { icon: Users, value: formatCompact(program.stats.beneficiaries, isUrdu), labelEn: 'Beneficiaries', labelUr: 'مستفیدین' },
    { icon: FolderOpen, value: formatCompact(program.stats.projects, isUrdu), labelEn: 'Projects', labelUr: 'پروجیکٹس' },
    { icon: UserCheck, value: formatCompact(program.stats.volunteers, isUrdu), labelEn: 'Volunteers', labelUr: 'رضاکار' },
  ];

  return (
    <>
      <Helmet>
        <title>{isUrdu ? `${program.titleUr} | IOCA` : `${program.titleEn} | IOCA`}</title>
        <meta name="description" content={isUrdu ? program.descUr : program.descEn} />
      </Helmet>

      {/* Hero */}
      <div className="relative h-[40vh] md:h-[60vh]">
        <img src={program.heroImage || program.image} alt={isUrdu ? program.titleUr : program.titleEn} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-black/60 z-10" aria-hidden="true" />
        <div className="absolute inset-0 z-20 flex flex-col justify-end px-6 md:px-16 pt-6 md:pt-16 pb-32 md:pb-40 max-w-7xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <Link to="/programs" className={`inline-flex items-center gap-2 text-brand-white/80 hover:text-brand-white text-sm mb-4 transition-colors ${isUrdu ? 'flex-row-reverse' : ''}`}>
              <ArrowLeft className={`w-4 h-4 ${isUrdu ? 'rotate-180' : ''}`} />
              {isUrdu ? 'تمام پروگرامز کی طرف واپس' : 'Back to All Programs'}
            </Link>
            <h1 className={`text-3xl md:text-5xl font-extrabold text-brand-white ${isUrdu ? 'font-urduHeading' : ''}`}>
              {isUrdu ? program.titleUr : program.titleEn}
            </h1>
          </motion.div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 md:px-8 -mt-24 relative z-30">
        <motion.div
          className="bg-brand-white rounded-[2.5rem] shadow-xl p-8 md:p-12"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          {/* Impact Stats */}
          <div className="grid grid-cols-3 gap-4 mb-10 p-6 bg-brand-gray rounded-2xl">
            {stats.map((stat, idx) => {
              const Icon = stat.icon;
              return (
                <div key={idx} className="text-center">
                  <Icon className="w-6 h-6 text-brand-teal mx-auto mb-2" />
                  <p className="text-xl md:text-2xl font-extrabold text-brand-navy">{stat.value}</p>
                  <p className={`text-xs text-brand-navy/60 ${isUrdu ? 'font-urduBody' : ''}`}>{isUrdu ? stat.labelUr : stat.labelEn}</p>
                </div>
              );
            })}
          </div>

          <h2 className={`text-2xl md:text-3xl font-bold text-brand-navy mb-6 ${isUrdu ? 'font-urduHeading' : ''}`}>
            {isUrdu ? 'جائزہ' : 'Overview'}
          </h2>

          <div className={`text-brand-navy/70 leading-relaxed text-base md:text-lg space-y-4 ${isUrdu ? 'font-urduBody' : ''}`}>
            {(isUrdu ? program.contentUr : program.contentEn).split('\n\n').map((para, i) => (
              <p key={i}>{para}</p>
            ))}
          </div>

          {/* Donate CTA */}
          <div className="mt-12 p-8 bg-brand-teal/5 rounded-2xl border border-brand-teal/10 text-center">
            <h3 className={`text-xl font-bold text-brand-navy mb-3 ${isUrdu ? 'font-urduHeading' : ''}`}>
              {isUrdu ? 'اس پروگرام کی مدد کریں' : 'Support this program'}
            </h3>
            <p className={`text-brand-navy/60 mb-6 ${isUrdu ? 'font-urduBody' : ''}`}>
              {isUrdu ? 'آپ کا عطیہ براہ راست اس پروگرام کے مستفیدین تک پہنچتا ہے۔' : 'Your donation directly reaches the beneficiaries of this program.'}
            </p>
            <Link
              to="/donate"
              className="inline-flex items-center justify-center bg-brand-teal text-brand-white font-semibold px-8 py-3.5 rounded-full hover:opacity-90 transition-opacity shadow-lg shadow-brand-teal/20"
            >
              {isUrdu ? 'ابھی عطیہ کریں' : 'Donate Now'}
            </Link>
          </div>
        </motion.div>

        {/* Related Programs */}
        {relatedPrograms.length > 0 && (
          <div className="mt-16 mb-16">
            <h2 className={`text-2xl font-bold text-brand-navy mb-8 ${isUrdu ? 'font-urduHeading' : ''}`}>
              {isUrdu ? 'دیگر پروگرامز' : 'Related Programs'}
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {relatedPrograms.map(rp => (
                <Link key={rp.id} to={`/programs/${rp.id}`} className="group bg-brand-white rounded-2xl overflow-hidden shadow-md hover:shadow-lg transition-shadow">
                  <div className="h-24 md:h-32 overflow-hidden">
                    <img src={rp.image} alt={isUrdu ? rp.titleUr : rp.titleEn} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
                  </div>
                  <div className="p-3 md:p-4">
                    <h3 className={`font-bold text-sm md:text-base text-brand-navy ${isUrdu ? 'font-urduHeading' : ''}`}>
                      {isUrdu ? rp.titleUr : rp.titleEn}
                    </h3>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default ProgramDetails;
