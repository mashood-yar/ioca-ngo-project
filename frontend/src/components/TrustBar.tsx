import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, ShieldCheck, HeartHandshake, Scale } from 'lucide-react';

interface TrustBarProps {
  isUrdu: boolean;
}

const TrustBar: React.FC<TrustBarProps> = ({ isUrdu }) => {
  const certifications = [
    {
      icon: ShieldCheck,
      textEn: 'PCP Certified',
      textUr: 'PCP تصدیق شدہ',
    },
    {
      icon: CheckCircle2,
      textEn: 'FBR Tax Exempt',
      textUr: 'FBR ٹیکس فری',
    },
    {
      icon: HeartHandshake,
      textEn: 'Zakat Eligible',
      textUr: 'زکوٰۃ کے لیے موزوں',
    },
    {
      icon: Scale,
      textEn: 'Shariah Compliant',
      textUr: 'شریعت کے مطابق',
    },
  ];

  return (
    <div className="bg-brand-navy border-y border-brand-white/10 relative overflow-hidden">
      <div
        className="absolute inset-0 opacity-5 mix-blend-overlay pointer-events-none"
        aria-hidden="true"
        style={{ backgroundImage: 'url("/assets/pattern-jali-accent.webp")', backgroundSize: '150px' }}
      />
      <div className="max-w-7xl mx-auto px-4 md:px-16 py-4 md:py-6 relative z-10">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 md:gap-8">
          <div className={`flex flex-col md:flex-row md:items-center gap-2 md:gap-4 shrink-0 text-center md:text-left ${isUrdu ? 'md:text-right md:flex-row-reverse' : ''}`}>
            <span className={`text-xl md:text-2xl font-extrabold text-brand-white ${isUrdu ? 'font-urduHeading' : ''}`}>
              {isUrdu ? '٪100' : '100%'}
            </span>
            <span className={`text-sm md:text-base text-brand-white font-medium ${isUrdu ? 'font-urduBody' : ''}`}>
              {isUrdu ? 'شفافیت اور اعتماد' : 'Transparency & Trust'}
            </span>
          </div>

          <div className="hidden md:block w-px h-8 bg-brand-white/20 shrink-0"></div>

          <div className={`flex flex-wrap items-center justify-center gap-3 md:gap-6 w-full ${isUrdu ? 'flex-row-reverse' : ''}`}>
            {certifications.map((cert, idx) => {
              const Icon = cert.icon;
              return (
                <motion.div
                  key={idx}
                  className="flex items-center gap-2"
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: idx * 0.1 }}
                >
                  <Icon className="w-4 h-4 md:w-5 md:h-5 text-brand-gold shrink-0" aria-hidden="true" />
                  <span className={`text-xs md:text-sm text-brand-white font-medium ${isUrdu ? 'font-urduBody' : ''}`}>
                    {isUrdu ? cert.textUr : cert.textEn}
                  </span>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TrustBar;
