import React, { useEffect, useRef } from 'react';
import { motion, useSpring, useTransform, useInView, useReducedMotion } from 'framer-motion';

export default function AnimatedCounter({ value, duration = 2, className = '' }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-10px" });
  const shouldReduceMotion = useReducedMotion();
  
  const springValue = useSpring(0, {
    duration: duration * 1000,
    bounce: 0,
  });

  const displayValue = useTransform(springValue, (current) => Math.floor(current));

  useEffect(() => {
    if (shouldReduceMotion) return;
    
    if (isInView) {
      springValue.set(value);
    }
  }, [isInView, value, springValue, shouldReduceMotion]);

  if (shouldReduceMotion) {
    return <span className={className}>{value}</span>;
  }

  return <motion.span ref={ref} className={className}>{displayValue}</motion.span>;
}
