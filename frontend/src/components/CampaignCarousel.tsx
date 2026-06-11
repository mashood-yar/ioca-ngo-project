import React, { useRef } from 'react';
import { ArrowLeft, ArrowRight, Heart } from 'lucide-react';
import { motion, useInView } from 'framer-motion';
import { campaigns } from '../data/mockData';
import { toUrduNumerals } from '../utils/formatters';

interface CampaignCarouselProps {
  isUrdu: boolean;
  onDonateClick: (campaignName: string) => void;
}

const CampaignCarousel: React.FC<CampaignCarouselProps> = ({ isUrdu, onDonateClick }) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const sectionRef = useRef(null);
  const isInView = useInView(sectionRef, { once: true, margin: '-100px' });

  const scroll = (direction: 'left' | 'right') => {
    if (!scrollRef.current) return;
    const amount = scrollRef.current.offsetWidth * 0.8;
    scrollRef.current.scrollBy({ left: direction === 'left' ? -amount : amount, behavior: 'smooth' });
  };

  const displayNum = (n: number) => isUrdu ? toUrduNumerals(n.toLocaleString()) : n.toLocaleString();

  return (
    <section id="causes" ref={sectionRef} className="bg-brand-gray py-16 md:py-24 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 md:px-16">
        {/* Header */}
        <motion.div
          className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10"
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
        >
          <div>
            <h2 className={`text-3xl md:text-5xl font-extrabold text-brand-navy mb-3 ${isUrdu ? 'font-urduHeading' : ''}`}>
              {isUrdu ? 'فعال مہمات' : 'Active Appeals'}
            </h2>
            <p className={`text-brand-navy/60 text-base md:text-lg max-w-lg ${isUrdu ? 'font-urduBody' : ''}`}>
              {isUrdu ? 'آپ کا عطیہ براہ راست ان پروگراموں کی مدد کرتا ہے جو زندگیاں بدلتے ہیں۔' : 'Your donation directly supports programs that are changing lives across Pakistan.'}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => scroll('left')}
              className="hidden md:flex w-12 h-12 rounded-full border-2 border-brand-navy/20 items-center justify-center text-brand-navy hover:bg-brand-navy hover:text-brand-white transition-colors"
              aria-label={isUrdu ? 'پچھلا' : 'Scroll left'}
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <button
              onClick={() => scroll('right')}
              className="hidden md:flex w-12 h-12 rounded-full border-2 border-brand-navy/20 items-center justify-center text-brand-navy hover:bg-brand-navy hover:text-brand-white transition-colors"
              aria-label={isUrdu ? 'اگلا' : 'Scroll right'}
            >
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </motion.div>

        {/* Mobile swipe hint */}
        <p className="flex md:hidden text-xs text-brand-navy/40 mb-3 items-center gap-1">
          <ArrowLeft className="w-3 h-3" /> {isUrdu ? 'سوائپ کریں' : 'Swipe to explore'} <ArrowRight className="w-3 h-3" />
        </p>

        {/* Carousel */}
        <div
          ref={scrollRef}
          role="region"
          aria-roledescription="carousel"
          aria-label={isUrdu ? 'مہمات' : 'Campaign appeals'}
          className="flex gap-6 overflow-x-auto snap-x snap-mandatory hide-scrollbar py-4 px-1 -mx-1"
        >
          {campaigns.map((campaign, idx) => {
            const progressPercent = Math.round((campaign.raised / campaign.goal) * 100);
            return (
              <motion.div
                key={campaign.id}
                className={`group min-w-[85vw] md:min-w-[350px] lg:min-w-[400px] snap-center md:snap-start bg-brand-white rounded-[2rem] overflow-hidden shadow-md hover:shadow-xl transition-shadow flex flex-col border-2 will-change-transform ${campaign.isUrgent ? 'border-brand-gold' : 'border-transparent'}`}
                initial={{ opacity: 0, y: 30 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: idx * 0.15 }}
              >
                {/* Image */}
                <div className="relative h-48 md:h-56 overflow-hidden">
                  <img
                    src={campaign.image}
                    alt={isUrdu ? campaign.titleUr : campaign.titleEn}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    loading="lazy"
                    decoding="async"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                  <span className={`absolute top-4 ${isUrdu ? 'right-4' : 'left-4'} text-[11px] font-bold uppercase px-3 py-1 rounded-full ${campaign.isUrgent ? 'bg-red-500 text-white' : 'bg-brand-white/90 text-brand-navy'}`}>
                    {isUrdu ? campaign.categoryUr : campaign.categoryEn}
                  </span>
                </div>

                {/* Content */}
                <div className="p-6 flex flex-col flex-grow">
                  <h3 className={`text-xl md:text-2xl font-bold text-brand-navy mb-2 ${isUrdu ? 'font-urduHeading' : ''}`}>
                    {isUrdu ? campaign.titleUr : campaign.titleEn}
                  </h3>
                  <p className="text-sm text-brand-navy/60 leading-relaxed mb-6 line-clamp-3">
                    {isUrdu ? campaign.descUr : campaign.descEn}
                  </p>

                  {/* Progress Bar */}
                  <div className="mt-auto">
                    <div
                      className="w-full h-2 bg-brand-gray rounded-full overflow-hidden mb-3"
                      role="progressbar"
                      aria-valuenow={progressPercent}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-label={`${progressPercent}% funded`}
                    >
                      <div
                        className={`h-full rounded-full transition-all duration-1000 ${campaign.isUrgent ? 'bg-red-500' : 'bg-brand-teal'}`}
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-sm mb-6">
                      <div>
                        <span className="font-bold text-brand-navy">{isUrdu ? `Rs ${displayNum(campaign.raised)}` : `Rs ${displayNum(campaign.raised)}`}</span>
                        <span className="text-brand-navy/50 ml-1">{isUrdu ? 'جمع ہوئے' : 'raised'}</span>
                      </div>
                      <div className="text-brand-navy/50">
                        {isUrdu ? `ہدف: Rs ${displayNum(campaign.goal)}` : `Goal: Rs ${displayNum(campaign.goal)}`}
                      </div>
                    </div>

                    <button
                      onClick={() => onDonateClick(isUrdu ? campaign.titleUr : campaign.titleEn)}
                      className={`w-full py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors ${
                        campaign.isUrgent
                          ? 'bg-brand-gold text-brand-navy hover:opacity-90'
                          : 'bg-brand-gray text-brand-navy border-2 border-brand-navy/10 hover:bg-brand-navy hover:text-brand-white'
                      }`}
                    >
                      <Heart className="w-4 h-4" />
                      {campaign.isUrgent
                        ? (isUrdu ? 'فوری مدد کریں' : 'Donate Urgently')
                        : (isUrdu ? 'عطیہ کریں' : 'Donate Now')}
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default CampaignCarousel;
