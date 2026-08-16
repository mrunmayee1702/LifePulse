import React, { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { Building2, Droplets, User, HeartPulse, ChevronRight } from 'lucide-react';
import LifePulseLogo from '../../assets/logo/LifePulseLogo';

export default function LifePulseCinematic() {
  const [isPlaying, setIsPlaying] = useState(true);
  const containerRef = useRef(null);
  const tlRef = useRef(null);
  const idleAnimationRef = useRef(null);
  const isTransitioningRef = useRef(false);
  
  // Elements Refs
  const bgRef = useRef(null);
  const centerGlowRef = useRef(null);
  const ecgPathRef = useRef(null);
  const networkContainerRef = useRef(null);
  const logoContainerRef = useRef(null);
  const taglineRef = useRef(null);
  
  // Network Nodes Refs
  const centerNodeRef = useRef(null);
  const hospitalNodeRef = useRef(null);
  const donorNodeRef = useRef(null);
  const patientNodeRef = useRef(null);
  
  // Connection Lines Refs
  const line1Ref = useRef(null);
  const line2Ref = useRef(null);
  const line3Ref = useRef(null);
  
  // Particles
  const p1Ref = useRef(null);
  const p2Ref = useRef(null);
  const p3Ref = useRef(null);

  // Door Refs
  const doorContainerRef = useRef(null);
  const doorFrameRef = useRef(null);
  const doorPanelRef = useRef(null);
  const doorHandleRef = useRef(null);
  const doorLightRef = useRef(null);
  const enterTextRef = useRef(null);

  useEffect(() => {
    // Session Storage Logic
    const isDevForce = window.location.search.includes('intro=true');
    const hasPlayed = sessionStorage.getItem('cinematicPlayed');
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if ((hasPlayed && !isDevForce) || prefersReducedMotion) {
      setIsPlaying(false);
      return;
    }

    // Set initial states
    gsap.set(bgRef.current, { opacity: 1 });
    gsap.set(centerGlowRef.current, { scale: 0, opacity: 0 });
    gsap.set(networkContainerRef.current, { opacity: 0 });
    gsap.set([hospitalNodeRef.current, donorNodeRef.current, patientNodeRef.current, centerNodeRef.current], { scale: 0, opacity: 0 });
    gsap.set([line1Ref.current, line2Ref.current, line3Ref.current], { strokeDasharray: 400, strokeDashoffset: 400 });
    gsap.set([p1Ref.current, p2Ref.current, p3Ref.current], { opacity: 0 });
    gsap.set(logoContainerRef.current, { scale: 0.8, opacity: 0, filter: 'blur(10px)' });
    gsap.set(taglineRef.current, { opacity: 0, y: 20 });
    gsap.set(doorContainerRef.current, { opacity: 0, scale: 0.8 });
    
    // SVG ECG Setup
    const ecgLength = ecgPathRef.current.getTotalLength();
    gsap.set(ecgPathRef.current, { strokeDasharray: ecgLength, strokeDashoffset: ecgLength, opacity: 0 });

    const tl = gsap.timeline();
    tlRef.current = tl;

    // SCENE 1: Darkness / Life Begins (0 - 1s)
    tl.to(centerGlowRef.current, { scale: 1, opacity: 0.8, duration: 1, ease: 'power2.out' }, 0);
    
    // SCENE 2: The Pulse (1 - 2s)
    tl.to(ecgPathRef.current, { opacity: 1, duration: 0.2 }, 1);
    tl.to(ecgPathRef.current, { strokeDashoffset: 0, duration: 1, ease: 'power2.inOut' }, 1);
    tl.to(ecgPathRef.current, { opacity: 0, duration: 0.4 }, 2);
    tl.to(centerGlowRef.current, { scale: 2, opacity: 0, duration: 0.5 }, 2);

    // SCENE 3 & 4: Life Network & Expansion (2 - 4.5s)
    tl.to(networkContainerRef.current, { opacity: 1, duration: 0.1 }, 2.1);
    
    // Reveal Center Node
    tl.to(centerNodeRef.current, { scale: 1, opacity: 1, duration: 0.4, ease: 'back.out(1.5)' }, 2.1);
    
    // Draw connecting lines
    tl.to([line1Ref.current, line2Ref.current, line3Ref.current], { strokeDashoffset: 0, duration: 0.8, ease: 'power2.inOut' }, 2.3);
    
    // Reveal Outer Nodes
    tl.to([hospitalNodeRef.current, donorNodeRef.current, patientNodeRef.current], { 
      scale: 1, opacity: 1, duration: 0.5, stagger: 0.1, ease: 'back.out(1.5)' 
    }, 2.5);

    // Particles traveling along connections
    tl.to(p2Ref.current, { opacity: 1, duration: 0.1 }, 2.8);
    tl.fromTo(p2Ref.current, { x: -200, y: 150 }, { x: 0, y: 0, duration: 0.8, ease: 'power1.inOut' }, 2.8);
    tl.to(p2Ref.current, { opacity: 0, duration: 0.1 }, 3.5);

    tl.to(p1Ref.current, { opacity: 1, duration: 0.1 }, 3.2);
    tl.fromTo(p1Ref.current, { x: 0, y: 0 }, { x: 200, y: -120 }, { duration: 0.8, ease: 'power1.inOut' }, 3.2);
    tl.to(p1Ref.current, { opacity: 0, duration: 0.1 }, 3.9);

    tl.to(p3Ref.current, { opacity: 1, duration: 0.1 }, 3.4);
    tl.fromTo(p3Ref.current, { x: 0, y: 0 }, { x: -180, y: -140 }, { duration: 0.8, ease: 'power1.inOut' }, 3.4);
    tl.to(p3Ref.current, { opacity: 0, duration: 0.1 }, 4.1);

    // SCENE 5: Logo Reveal (4.5 - 5.5s)
    tl.to([hospitalNodeRef.current, donorNodeRef.current, patientNodeRef.current], { 
      x: 0, y: 0, scale: 0, opacity: 0, duration: 0.6, ease: 'power3.in' 
    }, 4.5);
    tl.to([line1Ref.current, line2Ref.current, line3Ref.current], { opacity: 0, duration: 0.4 }, 4.5);
    tl.to(centerNodeRef.current, { scale: 0, opacity: 0, duration: 0.4 }, 4.8);
    
    tl.to(logoContainerRef.current, { scale: 1, opacity: 1, filter: 'blur(0px)', duration: 0.8, ease: 'power2.out' }, 4.9);
    tl.to(taglineRef.current, { opacity: 1, y: 0, duration: 0.6, ease: 'power2.out' }, 5.2);

    // SCENE 6: Transition to Door (5.5 - 6.5s)
    tl.to(logoContainerRef.current, { scale: 0.95, opacity: 0, filter: 'blur(5px)', duration: 1, ease: 'power2.inOut' }, 5.5);
    tl.to(taglineRef.current, { opacity: 0, y: -10, duration: 0.8, ease: 'power2.inOut' }, 5.5);
    
    // SCENE 7: Door Appears (6.5s)
    tl.to(doorContainerRef.current, { opacity: 1, scale: 1, duration: 1, ease: 'power2.out' }, 6.2);
    tl.call(() => {
      // Start Idle Breathing Glow behind door
      idleAnimationRef.current = gsap.timeline({ repeat: -1, yoyo: true })
        .to(doorLightRef.current, { opacity: 0.5, duration: 2, ease: 'sine.inOut' });
    });

    // Mouse Parallax effect
    const handleMouseMove = (e) => {
      if (window.innerWidth < 768 || isTransitioningRef.current) return;
      const x = (e.clientX / window.innerWidth - 0.5) * 20;
      const y = (e.clientY / window.innerHeight - 0.5) * 20;
      gsap.to(networkContainerRef.current, { x, y, duration: 1, ease: 'power1.out' });
      gsap.to(doorContainerRef.current, { x: x * 0.5, y: y * 0.5, duration: 1, ease: 'power1.out' });
    };
    
    window.addEventListener('mousemove', handleMouseMove);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      if (tlRef.current) tlRef.current.kill();
      if (idleAnimationRef.current) idleAnimationRef.current.kill();
    };
  }, []);

  const handleSkip = () => {
    isTransitioningRef.current = true;
    if (tlRef.current) tlRef.current.kill();
    if (idleAnimationRef.current) idleAnimationRef.current.kill();
    sessionStorage.setItem('cinematicPlayed', 'true');
    gsap.to(containerRef.current, { opacity: 0, duration: 0.4, onComplete: () => setIsPlaying(false) });
  };

  const handleDoorHover = () => {
    if (isTransitioningRef.current) return;
    gsap.to(doorFrameRef.current, { scale: 1.02, z: 20, duration: 0.4, ease: 'power2.out' });
    gsap.to(doorLightRef.current, { opacity: 0.8, duration: 0.4 });
    gsap.to(enterTextRef.current, { scale: 1.05, opacity: 1, duration: 0.3 });
  };

  const handleDoorLeave = () => {
    if (isTransitioningRef.current) return;
    gsap.to(doorFrameRef.current, { scale: 1, z: 0, duration: 0.4, ease: 'power2.out' });
    gsap.to(doorLightRef.current, { opacity: 0.5, duration: 0.4 });
    gsap.to(enterTextRef.current, { scale: 1, opacity: 0.8, duration: 0.3 });
  };

  const handleDoorClick = () => {
    if (isTransitioningRef.current) return;
    isTransitioningRef.current = true;
    
    // Kill Idle and Hover animations
    if (idleAnimationRef.current) idleAnimationRef.current.kill();
    
    const tlDoor = gsap.timeline({
      onComplete: () => {
        sessionStorage.setItem('cinematicPlayed', 'true');
        setIsPlaying(false);
      }
    });

    // Fade out text and skip button
    tlDoor.to([enterTextRef.current, '.skip-button'], { opacity: 0, duration: 0.2 }, 0);
    
    // Phase 1: Handle presses down
    tlDoor.to(doorHandleRef.current, { y: 3, duration: 0.15, ease: 'power1.in' }, 0);
    
    // Phase 2: Door swings open and light spills
    tlDoor.to(doorPanelRef.current, { rotateY: -95, duration: 1.2, ease: 'power2.inOut' }, 0.2);
    tlDoor.to(doorLightRef.current, { opacity: 1, scale: 1.2, duration: 1.2, ease: 'power2.inOut' }, 0.2);
    
    // Phase 3 & 4: Camera moves forward through the doorway
    // We scale up the entire door container massively while keeping it centered
    tlDoor.to(doorContainerRef.current, { 
      scale: 15, 
      z: 500,
      opacity: 0, 
      duration: 1.5, 
      ease: 'power2.in' 
    }, 0.6);
    
    // Phase 5: Fade out the black background to reveal the app
    tlDoor.to(containerRef.current, { opacity: 0, duration: 0.8, ease: 'power1.inOut' }, 1.3);
  };

  if (!isPlaying) return null;

  return (
    <div 
      ref={containerRef} 
      className="fixed inset-0 z-[9999] bg-[#020813] flex items-center justify-center overflow-hidden"
    >
      {/* Background Ambience */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#020813] via-[#051124] to-[#020813] opacity-80" />
      
      {/* Central Glowing Red Point (Scene 1) */}
      <div 
        ref={centerGlowRef}
        className="absolute w-4 h-4 rounded-full bg-brand-red shadow-[0_0_40px_10px_rgba(215,25,63,0.6)]"
      />

      {/* SVG ECG Waveform (Scene 2) */}
      <svg className="absolute w-full max-w-4xl h-64 pointer-events-none" viewBox="0 0 1000 200" preserveAspectRatio="none">
        <path 
          ref={ecgPathRef}
          d="M 0,100 L 400,100 L 420,100 L 440,50 L 460,150 L 480,20 L 500,160 L 520,80 L 540,100 L 560,100 L 1000,100" 
          fill="none" 
          stroke="#D7193F" 
          strokeWidth="3" 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          className="drop-shadow-[0_0_8px_rgba(215,25,63,0.8)]"
        />
      </svg>

      {/* Network Nodes (Scene 3 & 4) */}
      <div ref={networkContainerRef} className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <svg className="absolute w-[600px] h-[600px] overflow-visible" viewBox="-300 -300 600 600">
          <line ref={line1Ref} x1="0" y1="0" x2="200" y2="-120" stroke="#243B53" strokeWidth="2" strokeDasharray="5,5" />
          <line ref={line2Ref} x1="-200" y1="150" x2="0" y2="0" stroke="#243B53" strokeWidth="2" strokeDasharray="5,5" />
          <line ref={line3Ref} x1="0" y1="0" x2="-180" y2="-140" stroke="#243B53" strokeWidth="2" strokeDasharray="5,5" />
        </svg>

        <div ref={p1Ref} className="absolute w-2 h-2 rounded-full bg-blue-400 shadow-[0_0_10px_rgba(96,165,250,0.8)]" />
        <div ref={p2Ref} className="absolute w-2 h-2 rounded-full bg-brand-red shadow-[0_0_10px_rgba(215,25,63,0.8)]" />
        <div ref={p3Ref} className="absolute w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.8)]" />

        <div ref={centerNodeRef} className="absolute flex items-center justify-center w-16 h-16 rounded-full bg-brand-navy border border-brand-red/30 shadow-[0_0_30px_rgba(215,25,63,0.4)]">
          <HeartPulse className="w-8 h-8 text-brand-red" />
        </div>
        <div ref={hospitalNodeRef} className="absolute flex items-center justify-center w-12 h-12 rounded-2xl bg-slate-800 border border-slate-700 shadow-xl" style={{ transform: 'translate(200px, -120px)' }}>
          <Building2 className="w-6 h-6 text-blue-400" />
        </div>
        <div ref={donorNodeRef} className="absolute flex items-center justify-center w-12 h-12 rounded-full bg-rose-950 border border-rose-800 shadow-xl" style={{ transform: 'translate(-200px, 150px)' }}>
          <Droplets className="w-6 h-6 text-brand-red" />
        </div>
        <div ref={patientNodeRef} className="absolute flex items-center justify-center w-12 h-12 rounded-full bg-emerald-950 border border-emerald-800 shadow-xl" style={{ transform: 'translate(-180px, -140px)' }}>
          <User className="w-6 h-6 text-emerald-400" />
        </div>
      </div>

      {/* Logo Reveal (Scene 5) */}
      <div className="absolute flex flex-col items-center justify-center pointer-events-none">
        <div ref={logoContainerRef}>
          <LifePulseLogo size="lg" variant="light" className="scale-150 drop-shadow-[0_0_20px_rgba(255,255,255,0.1)]" />
        </div>
        <p ref={taglineRef} className="mt-8 text-slate-300 font-medium tracking-wide text-lg drop-shadow-md">
          Connecting Lives. Saving Lives.
        </p>
      </div>

      {/* Scene 7: Interactive 3D Door */}
      <div 
        ref={doorContainerRef} 
        className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none"
        style={{ perspective: '1200px' }}
      >
        <div 
          ref={doorFrameRef}
          className="relative w-48 h-80 sm:w-56 sm:h-96 border-[4px] border-slate-700/60 rounded-t-sm flex items-end justify-center pointer-events-auto cursor-pointer"
          style={{ transformStyle: 'preserve-3d' }}
          onMouseEnter={handleDoorHover}
          onMouseLeave={handleDoorLeave}
          onClick={handleDoorClick}
        >
          {/* Light behind door */}
          <div 
            ref={doorLightRef} 
            className="absolute inset-0 bg-white/10 shadow-[0_0_120px_60px_rgba(255,255,255,0.3)] pointer-events-none opacity-0 mix-blend-screen" 
          />
          
          {/* Door Panel */}
          <div 
            ref={doorPanelRef}
            className="absolute inset-0 bg-[#0a152d] border-r border-slate-600/40 flex flex-col items-center justify-center shadow-[inset_-10px_0_20px_rgba(0,0,0,0.5)]"
            style={{ transformOrigin: 'left center' }}
          >
            {/* Subtle Branding on Door */}
            <div className="absolute top-12 opacity-20">
              <HeartPulse className="w-10 h-10 text-brand-red" />
            </div>
            {/* Frame details */}
            <div className="absolute inset-4 border border-white/5 rounded-t-sm pointer-events-none" />
            
            {/* Handle */}
            <div 
              ref={doorHandleRef}
              className="absolute right-4 top-1/2 -translate-y-1/2 w-2 h-14 bg-slate-300 rounded-full shadow-[inset_0_0_5px_rgba(0,0,0,0.5),_0_0_10px_rgba(255,255,255,0.2)]"
            />
          </div>
        </div>
        
        {/* Enter Text */}
        <div 
          ref={enterTextRef} 
          className="mt-8 flex flex-col items-center pointer-events-auto cursor-pointer opacity-80" 
          onClick={handleDoorClick}
        >
          <span className="text-xl sm:text-2xl font-bold tracking-[0.2em] text-white drop-shadow-md">
            ENTER LIFEPULSE
          </span>
          <span className="text-xs text-brand-red mt-2 tracking-widest uppercase opacity-90">
            Click to enter
          </span>
        </div>
      </div>

      {/* Skip Button */}
      <button 
        onClick={handleSkip}
        className="skip-button absolute bottom-8 right-8 flex items-center gap-1 px-4 py-2 text-sm font-semibold text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-full backdrop-blur-sm transition-colors border border-white/10 pointer-events-auto z-50"
      >
        Skip Intro
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
}
