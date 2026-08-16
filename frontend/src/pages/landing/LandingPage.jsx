import React, { useEffect, useState } from 'react';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import HeroSection from './HeroSection';
import ValuePropsSection from './ValuePropsSection';
import HowItWorksSection from './HowItWorksSection';
import PrivacyFeatureSection from './PrivacyFeatureSection';
import EmergencyRequestsSection from './EmergencyRequestsSection';
import ImpactStatsSection from './ImpactStatsSection';
import BloodCompatibilitySection from './BloodCompatibilitySection';
import FinalCTASection from './FinalCTASection';

export default function LandingPage() {
  useEffect(() => {
    if (window.location.hash) {
      const hash = window.location.hash;
      const timer = setTimeout(() => {
        if (hash === '#hero') {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        } else {
          const element = document.querySelector(hash);
          if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
          }
        }
      }, 150);
      return () => clearTimeout(timer);
    }
  }, []);

  return (
    <div className="min-h-screen bg-brand-bg text-brand-navy flex flex-col antialiased">
      <Navbar />
      <main className="flex-grow">
        <HeroSection />
        <ValuePropsSection />
        <HowItWorksSection />
        <PrivacyFeatureSection />
        <EmergencyRequestsSection />
        <ImpactStatsSection />
        <BloodCompatibilitySection />
        <FinalCTASection />
      </main>
      <Footer />
    </div>
  );
}
