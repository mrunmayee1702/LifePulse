import React, { useEffect, useRef } from 'react';
import anime from 'animejs';
import { useReducedMotion } from 'framer-motion';

export default function AnimeTextReveal({ text, className = '' }) {
  const textRef = useRef(null);
  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    if (!textRef.current || shouldReduceMotion) return;
    
    const words = textRef.current.querySelectorAll('.word');
    anime.timeline({ loop: false })
      .add({
        targets: words,
        translateY: [20, 0],
        opacity: [0, 1],
        easing: "easeOutExpo",
        duration: 800,
        delay: anime.stagger(120, { start: 200 })
      });
      
    return () => anime.remove(words);
  }, [shouldReduceMotion]);

  const words = text.split(' ');

  return (
    <span ref={textRef} className={`inline-block ${className}`}>
      {words.map((word, index) => (
        <span 
          key={index} 
          className={`word inline-block ${shouldReduceMotion ? 'opacity-100' : 'opacity-0'} mr-2`}
        >
          {word}
        </span>
      ))}
    </span>
  );
}
