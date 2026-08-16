import React, { useEffect, useRef } from 'react';
import anime from 'animejs';
import { useReducedMotion } from 'framer-motion';

export default function AnimeParticles({ className = '' }) {
  const svgRef = useRef(null);
  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    if (shouldReduceMotion || !svgRef.current) return;

    const dots = svgRef.current.querySelectorAll('.donor-node');
    const lines = svgRef.current.querySelectorAll('.donor-connection');
    
    // Float the network nodes organically
    anime({
      targets: dots,
      translateY: () => anime.random(-20, 20),
      translateX: () => anime.random(-20, 20),
      scale: () => anime.random(0.9, 1.2),
      easing: 'easeInOutSine',
      duration: () => anime.random(3000, 6000),
      direction: 'alternate',
      loop: true
    });
    
    // Light pulses traveling between nodes along the connection lines
    anime({
      targets: lines,
      strokeDashoffset: [anime.setDashoffset, 0],
      opacity: [
        { value: 0, duration: 0 },
        { value: 0.4, duration: 1500 },
        { value: 0, duration: 1500 }
      ],
      easing: 'easeInOutSine',
      duration: () => anime.random(3000, 5000),
      delay: () => anime.random(1000, 4000),
      loop: true,
      direction: 'normal'
    });

    return () => {
      anime.remove(dots);
      anime.remove(lines);
    }
  }, [shouldReduceMotion]);

  if (shouldReduceMotion) return null;

  // Static regional node locations for the donor map
  const nodes = [
    { id: 1, cx: '15%', cy: '25%' },
    { id: 2, cx: '35%', cy: '15%' },
    { id: 3, cx: '25%', cy: '45%' },
    { id: 4, cx: '75%', cy: '20%' },
    { id: 5, cx: '85%', cy: '40%' },
    { id: 6, cx: '65%', cy: '60%' },
    { id: 7, cx: '20%', cy: '75%' },
    { id: 8, cx: '45%', cy: '80%' },
    { id: 9, cx: '80%', cy: '85%' },
    { id: 10, cx: '50%', cy: '50%' }, // central hub
  ];
  
  const connections = [
    [1,2], [1,3], [2,3], [3,10], [2,10],
    [4,5], [4,10], [5,6], [6,10], [7,8], 
    [8,10], [7,3], [8,9], [9,6]
  ];

  return (
    <div className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`}>
      <svg ref={svgRef} className="w-full h-full opacity-60">
        <defs>
          <radialGradient id="nodeGlow">
            <stop offset="0%" stopColor="#D7193F" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#D7193F" stopOpacity="0" />
          </radialGradient>
        </defs>
        
        {connections.map((conn, i) => {
          const n1 = nodes.find(n => n.id === conn[0]);
          const n2 = nodes.find(n => n.id === conn[1]);
          return (
            <line
              key={`conn-${i}`}
              className="donor-connection"
              x1={n1.cx} y1={n1.cy} x2={n2.cx} y2={n2.cy}
              stroke="#D7193F"
              strokeWidth="1.5"
              strokeDasharray="4 6"
              opacity="0"
            />
          );
        })}

        {nodes.map(n => (
          <g key={`node-${n.id}`} className="donor-node transform origin-center">
            <circle cx={n.cx} cy={n.cy} r="14" fill="url(#nodeGlow)" className="opacity-40" />
            <circle cx={n.cx} cy={n.cy} r="2.5" fill="#D7193F" />
          </g>
        ))}
      </svg>
    </div>
  );
}
