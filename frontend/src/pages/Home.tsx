import React from 'react';
import Hero from '../components/Hero';
import ImpactBentoGrid from '../components/ImpactBentoGrid';
import TrustBar from '../components/TrustBar';
import ProcessBlocks from '../components/ProcessBlocks';
import CampaignCarousel from '../components/CampaignCarousel';
import TestimonialGallery from '../components/TestimonialGallery';
import SEO from '../components/SEO';

interface HomeProps {
  isUrdu: boolean;
  onDonateClick: (campaignName: string | null) => void;
}

const Home: React.FC<HomeProps> = ({ isUrdu, onDonateClick }) => {
  return (
    <>
      <SEO 
        title="IOCA - International Organization For Community Advancement"
        description="Empowering communities across Pakistan through education, healthcare, youth development, and emergency relief. 100% of donations reach those in need."
        isUrdu={isUrdu}
      />
      <Hero isUrdu={isUrdu} />
      <TrustBar isUrdu={isUrdu} />
      <CampaignCarousel isUrdu={isUrdu} onDonateClick={onDonateClick} />
      <ImpactBentoGrid isUrdu={isUrdu} />
      <ProcessBlocks isUrdu={isUrdu} />
      <TestimonialGallery isUrdu={isUrdu} />
    </>
  );
};

export default Home;
