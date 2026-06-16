import React, { useRef, useEffect } from 'react';
import { Droplets, GraduationCap, HeartPulse, CheckCircle2 } from 'lucide-react';
import { motion, useInView } from 'framer-motion';
import { toUrduNumerals } from '../utils/formatters';


interface ImpactBentoGridProps {
  isUrdu: boolean;
}

/** Animated counter that counts up to a target value */
const CountUp = ({ target, suffix, isInView, isUrdu }: { target: number, suffix: string, isInView: boolean, isUrdu: boolean }) => {
  const nodeRef = useRef<HTMLSpanElement>(null);
  
  useEffect(() => {
    if (!isInView || !nodeRef.current) return;
    let start = 0;
    const duration = window.innerWidth < 768 ? 1000 : 2000; // Faster on mobile
    const step = (timestamp: number) => {
      start = start || timestamp;
      const progress = Math.min((timestamp - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const currentCount = Math.floor(eased * target);
      
      const displayStr = currentCount.toLocaleString();
      if (nodeRef.current) {
        nodeRef.current.textContent = (isUrdu ? toUrduNumerals(displayStr) : displayStr) + suffix;
      }
      
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [isInView, target, suffix, isUrdu]);
  
  return <span ref={nodeRef}>0{suffix}</span>;
};

const ImpactBentoGrid: React.FC<ImpactBentoGridProps> = ({ isUrdu }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });

  const stats = [
    {
      id: 'medical',
      value: 500,
      suffix: '+',
      labelEn: 'Medical Camps Organized',
      labelUr: 'طبی کیمپ منعقد ہوئے',
      icon: HeartPulse,
      bg: 'bg-brand-teal',
      textColor: 'text-brand-white',
      colSpan: 'col-span-2',
      hasPattern: true,
    },
    {
      id: 'children',
      value: 50,
      suffix: 'K',
      labelEn: 'Children Educated',
      labelUr: 'بچوں کو تعلیم دی گئی',
      icon: GraduationCap,
      bg: 'bg-brand-gold',
      textColor: 'text-brand-navy',
      colSpan: 'col-span-1',
      hasPattern: false,
    },
    {
      id: 'water',
      value: 1200,
      suffix: '+',
      labelEn: 'Water Projects',
      labelUr: 'پانی کے منصوبے',
      icon: Droplets,
      bg: 'bg-brand-white border border-brand-navy/10',
      textColor: 'text-brand-navy',
      colSpan: 'col-span-1',
      hasPattern: false,
    },
  ];

  return (
    <section id="impact" className="pt-8 pb-10 md:py-24 bg-brand-gray relative" ref={ref}>
      {/* Top curve overlapping the Hero section */}
      <div 
        className="absolute left-0 right-0 h-10 md:h-16 bg-brand-gray pointer-events-none z-20" 
        style={{ top: 0, transform: 'translateY(-99%)', clipPath: 'ellipse(60% 100% at 50% 100%)' }} 
        aria-hidden="true" 
      />
      <div className="max-w-7xl mx-auto px-4 md:px-16 relative z-10">
        <motion.div
          className="mb-8 md:mb-12"
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
        >
          <h2 className={`text-3xl md:text-5xl font-extrabold text-brand-navy mb-4 ${isUrdu ? 'font-urduHeading' : ''}`}>
            {isUrdu ? 'ہمارا اثر - ارقام میں' : 'Our Impact - In Numbers'}
          </h2>
          <p className={`text-brand-navy/60 text-base md:text-lg max-w-2xl ${isUrdu ? 'font-urduBody' : ''}`}>
            {isUrdu ? 'ہر عدد ایک کہانی بیان کرتا ہے - ایک زندگی بدلی، ایک کمیونٹی مضبوط ہوئی۔' : 'Every number tells a story - a life changed, a community strengthened.'}
          </p>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
          {stats.map((stat, idx) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={stat.id}
                className={`${stat.colSpan} ${stat.bg} ${stat.textColor} rounded-[2rem] p-5 md:p-8 flex flex-col justify-between relative overflow-hidden hover:-translate-y-1 hover:shadow-lg transition-all min-h-[150px] md:min-h-[220px]`}
                initial={{ opacity: 0, y: 30 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
              >
                {stat.hasPattern && (
                  <div
                    aria-hidden="true"
                    className="absolute inset-0 opacity-[0.08] pointer-events-none"
                    style={{ backgroundImage: 'url("/assets/pattern-jali-accent.webp")', backgroundSize: '150px' }}
                  />
                )}
                <Icon className="w-8 h-8 md:w-10 md:h-10 relative z-10 mb-4 md:mb-0" />
                <div className="relative z-10">
                  <p className="text-2xl md:text-4xl font-extrabold">
                    {isInView ? <CountUp target={stat.value} suffix={stat.suffix} isInView={isInView} isUrdu={isUrdu} /> : '0'}
                  </p>
                  <p className={`text-sm md:text-lg mt-1 opacity-80 ${isUrdu ? 'font-urduBody' : ''}`}>
                    {isUrdu ? stat.labelUr : stat.labelEn}
                  </p>
                </div>
              </motion.div>
            );
          })}

          {/* Full-width certification box */}
          <motion.div
            className="col-span-2 bg-brand-navy text-brand-white rounded-[2rem] p-5 md:p-8 flex flex-col justify-between hover:-translate-y-1 hover:shadow-lg transition-all relative overflow-hidden min-h-[150px] md:min-h-[220px]"
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <div
              className="absolute inset-0 opacity-[0.03] mix-blend-overlay pointer-events-none"
              aria-hidden="true"
              style={{ backgroundImage: 'url("/assets/pattern-jali-accent.webp")', backgroundSize: '200px' }}
            />
            <div className="relative z-10 flex flex-col justify-between h-full">
              <p className={`text-2xl md:text-4xl font-extrabold text-brand-white ${isUrdu ? 'font-urduHeading' : ''}`}>
                {isUrdu ? '٪100' : '100%'}
              </p>
              <div className="mt-4 md:mt-0">
                <p className={`text-sm md:text-lg text-brand-white/80 mb-3 ${isUrdu ? 'font-urduBody' : ''}`}>
                  {isUrdu ? 'آپ کا عطیہ مستحقین تک پہنچتا ہے' : 'of your donation reaches those in need'}
                </p>
                <div className="flex flex-wrap gap-2">
                  <span className="flex items-center gap-1.5 text-xs bg-white/10 border border-white/20 rounded-full px-3 py-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-brand-gold" aria-hidden="true" />
                    {isUrdu ? 'PCP تصدیق شدہ' : 'PCP Certified'}
                  </span>
                  <span className="flex items-center gap-1.5 text-xs bg-white/10 border border-white/20 rounded-full px-3 py-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-brand-gold" aria-hidden="true" />
                    {isUrdu ? 'FBR ٹیکس فری' : 'FBR Tax Exempt'}
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default ImpactBentoGrid;
