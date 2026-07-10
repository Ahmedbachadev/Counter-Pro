import React, { useEffect } from 'react';
import LandingLayout from './components/LandingLayout';
import LandingHero from './components/LandingHero';
import LandingTrust from './components/LandingTrust';
import LandingFeatures from './components/LandingFeatures';
import LandingShowcase from './components/LandingShowcase';
import LandingWhyChooseUs from './components/LandingWhyChooseUs';
import LandingIndustries from './components/LandingIndustries';
import LandingDevices from './components/LandingDevices';
import LandingSuccess from './components/LandingSuccess';
import LandingPlans from './components/LandingPlans';
import LandingFAQ from './components/LandingFAQ';
import LandingCTA from './components/LandingCTA';
import LandingContact from './components/LandingContact';
import LandingFooter from './components/LandingFooter';
import '../landing/landing.css';

const LandingPage: React.FC = () => {
  useEffect(() => {
    document.title = 'Counter Pro — Modern Point of Sale Platform';

    return () => {
      document.title = 'Counter Pro - Complete POS Application';
    };
  }, []);

  return (
    <LandingLayout>
      <main id="main-content" role="main">
        <LandingHero />
        <LandingTrust />
        <LandingFeatures />
        <LandingShowcase />
        <LandingWhyChooseUs />
        <LandingIndustries />
        <LandingDevices />
        <LandingSuccess />
        <LandingPlans />
        <LandingFAQ />
        <LandingCTA />
        <LandingContact />
      </main>
      <LandingFooter />
    </LandingLayout>
  );
};

export default LandingPage;
