import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { useReducedMotion } from 'framer-motion';

export function useStaggerFadeIn(dependency = null) {
  const containerRef = useRef(null);
  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    if (shouldReduceMotion || !containerRef.current) return;
    
    const elements = containerRef.current.children;
    
    gsap.fromTo(
      elements,
      { opacity: 0, y: 15 },
      {
        opacity: 1,
        y: 0,
        duration: 0.5,
        stagger: 0.1,
        ease: 'power2.out',
        clearProps: 'all'
      }
    );
  }, [dependency, shouldReduceMotion]);

  return containerRef;
}
