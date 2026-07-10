import React from 'react';
import LandingNavbar from './LandingNavbar';

interface LandingLayoutProps {
  children: React.ReactNode;
}

const LandingLayout: React.FC<LandingLayoutProps> = ({ children }) => {
  return (
    <div className="landing-page">
      {/* Premium Background */}
      <div className="landing-bg" aria-hidden="true">
        <div className="landing-bg-grid" />
        <div className="landing-bg-noise" />
        <div className="landing-bg-orb landing-bg-orb--primary" />
        <div className="landing-bg-orb landing-bg-orb--secondary" />
      </div>

      {/* Navigation */}
      <LandingNavbar />

      {/* Main Content */}
      <div className="lp-content">
        {children}
      </div>
    </div>
  );
};

export default LandingLayout;
