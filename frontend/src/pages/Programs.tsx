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
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-50px' });
  const [programs, setPrograms] = useState<Program[]>([]);
  const [categories, setCategories] = useState<ProgramCategory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [progRes, catRes] = await Promise.all([
          fetchApi<Program[]>('/programs'),
          fetchApi<ProgramCategory[]>('/program-categories')
        ]);
        if (progRes.data) setPrograms(progRes.data.filter(p => p.status === 'active'));
        if (catRes.data) setCategories(catRes.data);
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
        title={isUrdu ? 'U_OU^U_OO U.O | IOCA' : 'Programs | IOCA'}
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
            <h1 className={\	ext-4xl md:text-6xl font-extrabold text-brand-navy mb-4 \\}>
              {isUrdu ? 'OU.OO1U' U_OU^U_OO U.O' : 'Our Programs'}
            </h1>
            <p className={\	ext-brand-navy/60 text-base md:text-lg max-w-2xl \\}>
              {isUrdu
                ? 'OU. U.OO1U' U_OU^U_OO U.O UcU' O_O1UOUU OOU,UO U' O U^O UcU.UOU^U+U1UO OU^O1 OOO1U+U?OOOUOU' U+U^OU^O U+U^U UcUO OOU,UO O U^O UcU.UOU^U+U1UO OU?O1 U_OU^O3UOO UcU' OOUOO1U' U_O UcO3OO U+ O"U_O U.UOU UcU.UOU^U+U1UOO UcU^ O"O O OrOUOO O O"U+O  OU?U' U?UOUU"'
                : 'We empower communities across Pakistan through education, healthcare, youth development, and community bonding programs.'}
            </p>
          </motion.div>

          {loading ? (
            <div className="py-20 text-center text-[#6B7280]">Loading programs...</div>
          ) : programs.length === 0 ? (
            <div className="py-20 text-center text-[#6B7280]">No programs available at the moment.</div>
          ) : (
            <div ref={ref} className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
              {programs.map((prog, idx) => (
                <motion.div
                  key={prog.id}
                  initial={{ opacity: 0, y: 30 }}
                  animate={isInView ? { opacity: 1, y: 0 } : {}}
                  transition={{ duration: 0.5, delay: idx * 0.1 }}
                >
                  <Link
                    to={\/programs/\\}
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
                        <h2 className={\	ext-2xl font-bold text-brand-navy group-hover:text-brand-teal transition-colors \\}>
                          {isUrdu ? prog.title_ur : prog.title_en}
                        </h2>
                      </div>
                      <p className={\	ext-brand-navy/70 leading-relaxed mb-6 flex-grow \\}>
                        {isUrdu ? prog.desc_ur : prog.desc_en}
                      </p>
                      
                      <div className="grid grid-cols-2 gap-4 pt-6 border-t border-brand-navy/10 mt-auto">
                        <div>
                          <div className="text-xl md:text-2xl font-bold text-brand-teal mb-1">
                            {formatCompact(prog.stats_beneficiaries, isUrdu)}+
                          </div>
                          <div className={\	ext-xs font-semibold text-brand-navy/60 uppercase tracking-wider \\}>
                            {isUrdu ? 'U.O3OU?UOO_UOU+' : 'Beneficiaries'}
                          </div>
                        </div>
                        <div>
                          <div className="text-xl md:text-2xl font-bold text-brand-teal mb-1">
                            {formatCompact(prog.stats_projects, isUrdu)}
                          </div>
                          <div className={\	ext-xs font-semibold text-brand-navy/60 uppercase tracking-wider \\}>
                            {isUrdu ? 'U_OU^OUOUcU1O3' : 'Projects'}
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
