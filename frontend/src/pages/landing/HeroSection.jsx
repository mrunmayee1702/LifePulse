import React from 'react';
import Container from '../../components/Container';
import { Button } from '../../components/Button';
import HeroVisual from '../../components/hero/HeroVisual';
import { HeartPulse, ShieldCheck, PhoneCall, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import AnimeTextReveal from '../../components/animations/AnimeTextReveal';
import AnimeParticles from '../../components/animations/AnimeParticles';

export default function HeroSection() {
  return (
    <section id="hero" className="relative bg-brand-navy text-white pt-12 pb-20 md:pt-20 md:pb-28 overflow-hidden select-none">
      {/* Radial Glow & Subtle Depth Background */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-brand-red/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 left-10 w-80 h-80 bg-blue-600/10 rounded-full blur-[100px] pointer-events-none" />
      
      {/* Anime.js Floating Particles */}
      <AnimeParticles count={50} />

      {/* Signature Crimson Light Sweep — Runs ONCE during initial reveal */}
      <motion.div
        initial={{ x: '-100%', opacity: 0 }}
        animate={{ x: '100%', opacity: [0, 0.35, 0] }}
        transition={{ duration: 1.2, delay: 0.15, ease: 'easeInOut' }}
        className="absolute inset-y-0 w-1/2 bg-gradient-to-r from-transparent via-brand-red/20 to-transparent skew-x-12 pointer-events-none z-20"
      />

      <Container size="lg" className="relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Column: Content */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="lg:col-span-7 flex flex-col items-start"
          >
            {/* Top Eyebrow Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-800/80 border border-slate-700 text-xs font-semibold text-slate-200 mb-6 shadow-sm">
              <Sparkles className="w-3.5 h-3.5 text-brand-red" />
              <span>HEALTHCARE • DONATION • CONNECTION</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-[1.15] mb-6 flex flex-col items-start gap-1">
              <AnimeTextReveal text="Donate Blood," />
              <AnimeTextReveal text="Save Lives." className="text-brand-red font-black" />
            </h1>

            {/* Subtitle */}
            <p className="text-base sm:text-lg text-slate-300 max-w-xl leading-relaxed mb-8">
              LifePulse connects verified healthcare institutions with available blood donors when every second matters. Privacy-first coordination with explicit donor consent.
            </p>

            {/* Primary & Secondary CTAs */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full sm:w-auto mb-10">
              <Button
                variant="primary"
                size="lg"
                icon={HeartPulse}
                onClick={() => { window.location.href = '/register'; }}
              >
                Donate Now
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="text-white border-slate-700 hover:bg-slate-800 hover:border-slate-500"
                icon={PhoneCall}
                onClick={() => { window.location.href = '/register'; }}
              >
                Request Blood
              </Button>
            </div>

            {/* Micro Trust Indicators */}
            <div className="pt-6 border-t border-slate-800/80 w-full flex flex-wrap items-center gap-6 text-xs text-slate-400">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>100% Consent Privacy</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>Verified Hospitals Only</span>
              </div>
            </div>
          </motion.div>

          {/* Right Column: Realistic Hero Visual */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="lg:col-span-5 flex justify-center"
          >
            <HeroVisual />
          </motion.div>
        </div>
      </Container>
    </section>
  );
}
