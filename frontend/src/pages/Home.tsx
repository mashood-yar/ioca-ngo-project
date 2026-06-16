import React from 'react';
import { Helmet } from 'react-helmet-async';
import Hero from '../components/Hero';
import ImpactBentoGrid from '../components/ImpactBentoGrid';
import ProcessBlocks from '../components/ProcessBlocks';
import CampaignCarousel from '../components/CampaignCarousel';
import TestimonialGallery from '../components/TestimonialGallery';

interface HomeProps {
  isUrdu: boolean;
  onDonateClick: (campaignName: string | null) => void;
}

const Home: React.FC<HomeProps> = ({ isUrdu, onDonateClick }) => {
  return (
    <>
      <Helmet>
        <title>IOCA - International Organization For Community Advancement</title>
        <meta name="description" content="Empowering communities across Pakistan through education, healthcare, youth development, and emergency relief. 100% of donations reach those in need." />
      </Helmet>
      <Hero isUrdu={isUrdu} />
      <ImpactBentoGrid isUrdu={isUrdu} />
      <ProcessBlocks isUrdu={isUrdu} />
      <CampaignCarousel isUrdu={isUrdu} onDonateClick={onDonateClick} />
      <TestimonialGallery isUrdu={isUrdu} />
    </>
  );
};

export default Home;
