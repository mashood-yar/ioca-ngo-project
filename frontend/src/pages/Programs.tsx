import React, { useRef } from 'react';
import { Link } from 'react-router-dom';
import SEO from '../components/SEO';
import { motion, useInView } from 'framer-motion';
import { programs } from '../data/mockData';
import { optimizeImage } from '../lib/optimizeImage';

interface ProgramsProps {
  isUrdu: boolean;
}

const Programs: React.FC<ProgramsProps> = ({ isUrdu }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-50px' });

  return (
    <>
      <SEO 
        title={isUrdu ? 'پروگرامز | IOCA' : 'Programs | IOCA'}
        description="Explore IOCA's programs in education, healthcare, youth empowerment, and community development across Pakistan."
        isUrdu={isUrdu}
      />

      <div className="py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4 md:px-16">
          {/* Header */}
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
                ? 'ہم تعلیم، صحت، نوجوانوں کی ترقی اور کمیونٹی ہم آہنگی کے ذریعے پاکستان بھر میں کمیونٹیز کو بااختیار بنا رہے ہیں۔'
                : 'We empower communities across Pakistan through education, healthcare, youth development, and community bonding programs.'}
            </p>
          </motion.div>

          {/* Programs Grid */}
          <div ref={ref} className="grid grid-cols-2 gap-4 md:gap-8">
            {programs.map((prog, idx) => (
              <motion.div
                key={prog.id}
                initial={{ opacity: 0, y: 30 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
              >
                <Link
                  to={`/programs/${prog.id}`}
                  className="group block bg-brand-white rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all"
                >
                  <div className="relative h-32 md:h-64 overflow-hidden shrink-0">
                    <img
                      src={optimizeImage(prog.image, { width: 400 })}
                      alt={isUrdu ? prog.titleUr : prog.titleEn}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                      loading="lazy"
                      decoding="async"
                      width={400}
                      height={256}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500" />
                  </div>
                  <div className="p-4 md:p-8 flex flex-col flex-grow">
                    <h2 className={`text-base md:text-2xl font-bold text-brand-navy mb-2 ${isUrdu ? 'font-urduHeading' : ''}`}>
                      {isUrdu ? prog.titleUr : prog.titleEn}
                    </h2>
                    <p className={`text-xs md:text-base text-brand-navy/60 leading-relaxed mb-6 flex-grow ${isUrdu ? 'font-urduBody' : ''}`}>
                      {isUrdu ? prog.descUr : prog.descEn}
                    </p>

                    {/* Program Stats */}
                    {prog.stats && (
                      <div className="grid grid-cols-2 gap-2 mb-6 border-t border-brand-navy/10 pt-4">
                        <div>
                          <p className="text-xl md:text-2xl font-extrabold text-brand-teal">{prog.stats.beneficiaries.toLocaleString()}+</p>
                          <p className={`text-[10px] md:text-xs text-brand-navy/60 uppercase tracking-widest font-medium ${isUrdu ? 'font-urduBody' : ''}`}>
                            {isUrdu ? 'مستفید' : 'Beneficiaries'}
                          </p>
                        </div>
                        <div>
                          <p className="text-xl md:text-2xl font-extrabold text-brand-teal">{prog.stats.projects}</p>
                          <p className={`text-[10px] md:text-xs text-brand-navy/60 uppercase tracking-widest font-medium ${isUrdu ? 'font-urduBody' : ''}`}>
                            {isUrdu ? 'پروجیکٹس' : 'Projects'}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Hover CTA Button */}
                    <div className="mt-auto pt-2 overflow-hidden border-t border-transparent group-hover:border-brand-navy/5 transition-colors">
                      <div className="flex items-center justify-between font-bold text-sm text-brand-navy group-hover:text-brand-teal transition-colors transform translate-y-0 md:translate-y-12 opacity-100 md:opacity-0 group-hover:translate-y-0 group-hover:opacity-100 duration-300 ease-out">
                        <span className={`${isUrdu ? 'font-urduHeading text-base' : ''}`}>
                          {isUrdu ? 'پروگرام دریافت کریں' : 'Explore Program'}
                        </span>
                        <span className="bg-brand-teal/10 text-brand-teal p-2 rounded-lg group-hover:bg-brand-teal group-hover:text-white transition-colors">
                          {isUrdu ? '←' : '→'}
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
};

export default Programs;
