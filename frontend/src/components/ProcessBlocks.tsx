import React, { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { toUrduNumerals } from '../utils/formatters';

interface ProcessBlocksProps {
  isUrdu: boolean;
}

const ProcessBlocks: React.FC<ProcessBlocksProps> = ({ isUrdu }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });

  const steps = [
    {
      id: 1,
      titleEn: 'Identify',
      titleUr: 'شناخت',
      descEn: 'We work directly with communities to identify their most pressing needs through on-the-ground assessments.',
      descUr: 'ہم کمیونٹیز کے ساتھ براہ راست کام کرتے ہیں تاکہ ان کی سب سے اہم ضروریات کی نشاندہی کی جا سکے۔',
      bg: 'bg-brand-teal text-brand-white',
      hasPattern: true,
    },
    {
      id: 2,
      titleEn: 'Plan',
      titleUr: 'منصوبہ بندی',
      descEn: 'Expert teams design evidence-based interventions tailored to each community\'s unique context.',
      descUr: 'ماہر ٹیمیں ہر کمیونٹی کے منفرد سیاق و سباق کے مطابق شواہد پر مبنی مداخلتیں تیار کرتی ہیں۔',
      bg: 'bg-brand-white border border-brand-navy/10 text-brand-navy',
      hasPattern: false,
    },
    {
      id: 3,
      titleEn: 'Execute',
      titleUr: 'عمل درآمد',
      descEn: 'Programs are implemented with full community participation, ensuring ownership and sustainability.',
      descUr: 'پروگرام مکمل کمیونٹی شرکت کے ساتھ نافذ کیے جاتے ہیں، جو ملکیت اور پائیداری کو یقینی بناتے ہیں۔',
      bg: 'bg-brand-white border border-brand-navy/10 text-brand-navy',
      hasPattern: false,
    },
    {
      id: 4,
      titleEn: 'Impact & Traceability',
      titleUr: 'اثر اور ٹریس ایبلٹی',
      descEn: 'Every rupee is tracked with full transparency. Donors receive detailed impact reports with verified outcomes.',
      descUr: 'ہر روپے کی مکمل شفافیت کے ساتھ نگرانی کی جاتی ہے۔ عطیہ دہندگان کو تصدیق شدہ نتائج کی تفصیلی رپورٹیں ملتی ہیں۔',
      bg: 'bg-brand-gold text-brand-navy',
      hasPattern: false,
    },
  ];

  // Width classes as static strings (Tailwind JIT can detect these)
  const widthClasses: Record<number, string> = {
    1: 'lg:w-[40%]',
    2: 'lg:w-[20%]',
    3: 'lg:w-[20%]',
    4: 'lg:w-[20%]',
  };

  const orderedSteps = isUrdu ? [...steps].reverse() : steps;

  return (
    <section id="process" ref={ref} className="relative pt-4 pb-12 md:pt-10 md:pb-24 bg-brand-gray overflow-hidden">
      {/* Decorative curved bottom edge */}
      <div aria-hidden="true" className="absolute bottom-0 left-0 right-0 h-12 md:h-20 bg-brand-white" style={{ clipPath: 'ellipse(60% 100% at 50% 100%)' }} />

      <div className="max-w-7xl mx-auto px-4 md:px-16 relative z-10">
        <motion.div
          className="text-center mb-8 md:mb-16"
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
        >
          <h2 className={`text-3xl md:text-5xl font-extrabold text-brand-navy mb-4 ${isUrdu ? 'font-urduHeading' : ''}`}>
            {isUrdu ? 'ہم کیسے کام کرتے ہیں' : 'How We Work'}
          </h2>
          <p className={`text-brand-navy/60 text-base md:text-lg max-w-2xl mx-auto ${isUrdu ? 'font-urduBody' : ''}`}>
            {isUrdu ? 'شناخت سے اثر تک - ہمارا ثابت شدہ طریقہ کار' : 'From identification to impact - our proven methodology'}
          </p>
        </motion.div>

        {/* Dashed connector line (desktop only) */}
        <div aria-hidden="true" className="hidden lg:block absolute top-1/2 left-[10%] right-[10%] border-t-2 border-dashed border-brand-navy/10 -translate-y-1/2 z-0" />

        <ol className="grid grid-cols-2 lg:flex lg:flex-row gap-4 md:gap-6 relative z-10">
          {orderedSteps.map((step, idx) => (
            <motion.li
              key={step.id}
              className={`${widthClasses[step.id]} ${step.bg} rounded-[2rem] p-4 md:p-6 flex flex-col justify-between relative overflow-hidden hover:shadow-xl transition-shadow group min-h-[160px] md:min-h-[240px]`}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: idx * 0.12 }}
            >
              {step.hasPattern && (
                <div
                  aria-hidden="true"
                  className="absolute inset-0 opacity-[0.08] pointer-events-none"
                  style={{ backgroundImage: 'url("/assets/pattern-jali-accent.webp")', backgroundSize: '120px' }}
                />
              )}

              {/* Step number watermark (only on step 1) */}
              {step.id === 1 && (
                <span aria-hidden="true" className={`absolute ${isUrdu ? 'left-3' : 'right-3'} top-2 text-7xl md:text-8xl font-black opacity-10 select-none`}>
                  {isUrdu ? toUrduNumerals('01') : '01'}
                </span>
              )}

              <div className="relative z-10">
                <span className={`text-sm md:text-base font-bold opacity-60 group-hover:opacity-100 transition-colors ${isUrdu ? 'font-urduBody' : ''}`}>
                  {isUrdu ? `${toUrduNumerals(step.id)}.` : `${step.id}.`}
                </span>
                <h3 className={`text-base md:text-2xl font-bold mt-2 ${isUrdu ? 'font-urduHeading' : ''}`}>
                  {isUrdu ? step.titleUr : step.titleEn}
                </h3>
              </div>
              <p className={`text-xs md:text-base mt-2 opacity-80 relative z-10 ${isUrdu ? 'font-urduBody' : ''}`}>
                {isUrdu ? step.descUr : step.descEn}
              </p>
            </motion.li>
          ))}
        </ol>
      </div>
    </section>
  );
};

export default ProcessBlocks;
