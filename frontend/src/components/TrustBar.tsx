import React from 'react';

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
      isBold: false,
    },
    {
      icon: CheckCircle2,
      textEn: 'FBR Tax Exempt',
      textUr: 'FBR ٹیکس فری',
      isBold: false,
    },
    {
      icon: HeartHandshake,
      textEn: 'Zakat Eligible',
      textUr: 'زکوٰۃ کے لیے موزوں',
      isBold: false,
    },
    {
      icon: Scale,
      textEn: 'Shariah Compliant',
      textUr: 'شریعت کے مطابق',
      isBold: false,
    },
  ];

  const tickerItems = [
    {
      icon: null,
      textEn: '100% Transparency & Trust',
      textUr: '٪100 شفافیت اور اعتماد',
      isBold: true,
    },
    ...certifications,
  ];

  // Duplicate items to ensure smooth infinite scrolling
  const scrollItems = [...tickerItems, ...tickerItems, ...tickerItems, ...tickerItems];

  return (
    <div className="bg-brand-teal border-y border-brand-white/20 relative overflow-hidden flex items-center py-2.5 md:py-3">
      <div
        className="absolute inset-0 opacity-5 mix-blend-overlay pointer-events-none"
        aria-hidden="true"
        style={{ backgroundImage: 'url("/assets/pattern-jali-accent.webp")', backgroundSize: '150px' }}
      />
      
      {/* Ticker Container */}
      <div className="relative z-10 flex w-full overflow-hidden">
        <div className="animate-marquee flex items-center whitespace-nowrap w-max">
          {scrollItems.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                className={`flex items-center gap-2 md:gap-3 px-6 md:px-10 border-r border-brand-white/20 ${isUrdu ? 'flex-row-reverse' : ''}`}
              >
                {Icon && <Icon className="w-4 h-4 md:w-5 md:h-5 text-brand-gold shrink-0" aria-hidden="true" />}
                <span className={`text-sm md:text-base text-brand-white ${item.isBold ? 'font-extrabold' : 'font-medium'} ${isUrdu ? (item.isBold ? 'font-urduHeading' : 'font-urduBody') : ''}`}>
                  {isUrdu ? item.textUr : item.textEn}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default TrustBar;
