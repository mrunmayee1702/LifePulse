import React, { useEffect, useRef } from 'react';
import anime from 'animejs';
import { useReducedMotion } from 'framer-motion';

export default function LockUnlockIcon({ isUnlocked = false, className = "w-6 h-6" }) {
  const shackleRef = useRef(null);
  const shouldReduceMotion = useReducedMotion();
  
  useEffect(() => {
    if (shouldReduceMotion || !shackleRef.current) return;
    
    if (isUnlocked) {
      anime({
        targets: shackleRef.current,
        translateY: -3,
        rotate: -20,
        transformOrigin: "7px 11px",
        easing: 'spring(1, 80, 10, 0)',
        duration: 800
      });
    } else {
      anime({
        targets: shackleRef.current,
        translateY: 0,
        rotate: 0,
        transformOrigin: "7px 11px",
        easing: 'spring(1, 80, 10, 0)',
        duration: 800
      });
    }
    
    return () => anime.remove(shackleRef.current);
  }, [isUnlocked, shouldReduceMotion]);

  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2.5" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <path 
        ref={shackleRef}
        d="M7 11V7a5 5 0 0 1 10 0v4" 
      />
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
    </svg>
  );
}
