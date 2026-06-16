import React, { useRef } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { motion, useInView } from 'framer-motion';
import { programs } from '../data/mockData';

interface ProgramsProps {
  isUrdu: boolean;
}

const Programs: React.FC<ProgramsProps> = ({ isUrdu }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-50px' });

  return (
    <>
      <Helmet>
        <title>{isUrdu ? 'پروگرامز | IOCA' : 'Programs | IOCA'}</title>
        <meta name="description" content="Explore IOCA's programs in education, healthcare, youth empowerment, and community development across Pakistan." />
      </Helmet>

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
                  className="group block bg-brand-white rounded-[2rem] overflow-hidden shadow-md hover:shadow-xl transition-all"
                >
                  <div className="relative h-32 md:h-64 overflow-hidden">
                    <img
                      src={prog.image}
                      alt={isUrdu ? prog.titleUr : prog.titleEn}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent group-hover:from-transparent transition-all duration-500" />

                  </div>
                  <div className="p-4 md:p-8">
                    <h2 className={`text-base md:text-2xl font-bold text-brand-navy mb-2 ${isUrdu ? 'font-urduHeading' : ''}`}>
                      {isUrdu ? prog.titleUr : prog.titleEn}
                    </h2>
                    <p className={`text-xs md:text-base text-brand-navy/60 leading-relaxed ${isUrdu ? 'font-urduBody' : ''}`}>
                      {isUrdu ? prog.descUr : prog.descEn}
                    </p>
                    <span className="inline-block mt-3 md:mt-4 text-brand-teal font-medium text-sm group-hover:translate-x-1 transition-transform">
                      {isUrdu ? 'مزید ←' : 'Learn →'}
                    </span>
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
