import React, { useRef, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import SEO from '../components/SEO';
import { motion, useInView } from 'framer-motion';
import { optimizeImage } from '../lib/optimizeImage';
import { fetchApi } from '../lib/apiClient';
import type { Program, ProgramCategory } from '../types';
import { formatCompact } from '../utils/formatters';

interface ProgramsProps {
  isUrdu: boolean;
}

const Programs: React.FC<ProgramsProps> = ({ isUrdu }) => {
  const [programs, setPrograms] = useState<Program[]>([]);
  
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [progRes] = await Promise.all([
          fetchApi<Program[]>('/programs'),
          fetchApi<ProgramCategory[]>('/program-categories')
        ]);
        if (progRes.data) setPrograms(progRes.data.filter(p => p.status === 'active'));
        
      } catch (err) {
        console.error('Failed to fetch programs data:', err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  return (
    <>
      <SEO 
        title={isUrdu ? 'پروگرامز | IOCA' : 'Programs | IOCA'}
        description="Explore IOCA's programs in education, healthcare, youth empowerment, and community development across Pakistan."
        isUrdu={isUrdu}
      />

      <div className="py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4 md:px-16">
          <motion.div
            className="mb-12"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className={`text-4xl md:text-6xl font-extrabold text-brand-navy mb-4 ${isUrdu ? 'font-urduHeading' : ''}`}>
              {isUrdu ? 'ہمارے پروگرامز' : 'Our Programs'}
            </h1>
            <p className={`text-brand-navy/60 text-base md:text-lg max-w-2xl ${isUrdu ? 'font-urduBody' : ''}`}>
              {isUrdu
                ? 'ہم تعلیم، صحت، نوجوانوں کی ترقی، اور کمیونٹی بانڈنگ کے پروگراموں کے ذریعے پاکستان بھر میں کمیونٹیز کو بااختیار بناتے ہیں۔'
                : 'We empower communities across Pakistan through education, healthcare, youth development, and community bonding programs.'}
            </p>
          </motion.div>

          {loading ? (
            <div className="py-20 text-center text-[#6B7280]">Loading programs...</div>
          ) : programs.length === 0 ? (
            <div className="py-20 text-center text-[#6B7280]">No programs available at the moment.</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
              {programs.map((prog, idx) => (
                <motion.div
                  key={prog.id}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "0px 0px -20px 0px" }}
                  transition={{ duration: 0.5, delay: idx * 0.1 }}
                >
                  <Link
                    to={`/programs/${prog.id}`}
                    className="group block bg-brand-white rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all h-full flex flex-col"
                  >
                    <div className="relative h-48 md:h-64 overflow-hidden shrink-0 bg-gray-100">
                      {prog.image_url && (
                        <img
                          src={optimizeImage(prog.image_url, { width: 600 })}
                          alt={isUrdu ? prog.title_ur : prog.title_en}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                        />
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>

                    <div className="p-6 md:p-8 flex flex-col flex-grow">
                      <div className="flex items-center gap-3 mb-4">
                        {prog.category?.icon_svg && (
                          <div className="w-10 h-10 bg-brand-navy/5 rounded-full flex items-center justify-center text-brand-navy" dangerouslySetInnerHTML={{ __html: prog.category.icon_svg }} />
                        )}
                        <h2 className={`text-2xl font-bold text-brand-navy group-hover:text-brand-teal transition-colors ${isUrdu ? 'font-urduHeading text-right w-full' : ''}`}>
                          {isUrdu ? prog.title_ur : prog.title_en}
                        </h2>
                      </div>
                      <p className={`text-brand-navy/70 leading-relaxed mb-6 flex-grow ${isUrdu ? 'font-urduBody text-right' : ''}`}>
                        {isUrdu ? prog.desc_ur : prog.desc_en}
                      </p>
                      
                      <div className="grid grid-cols-2 gap-4 pt-6 border-t border-brand-navy/10 mt-auto">
                        <div>
                          <div className="text-xl md:text-2xl font-bold text-brand-teal mb-1">
                            {formatCompact(prog.stats_beneficiaries, isUrdu)}+
                          </div>
                          <div className={`text-xs font-semibold text-brand-navy/60 uppercase tracking-wider ${isUrdu ? 'font-urduBody text-right' : ''}`}>
                            {isUrdu ? '????????' : 'Beneficiaries'}
                          </div>
                        </div>
                        <div>
                          <div className="text-xl md:text-2xl font-bold text-brand-teal mb-1">
                            {formatCompact(prog.stats_projects, isUrdu)}
                          </div>
                          <div className={`text-xs font-semibold text-brand-navy/60 uppercase tracking-wider ${isUrdu ? 'font-urduBody text-right' : ''}`}>
                            {isUrdu ? '????????' : 'Projects'}
                          </div>
                        </div>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default Programs;


