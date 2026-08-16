import React from 'react';
import AnimatedCounter from './AnimatedCounter';
import { motion, useReducedMotion } from 'framer-motion';

/**
 * Reusable Global Floating Statistic Cluster
 * Displays 1-4 statistic cards in a clean, responsive 4-column grid.
 * All 4 cards fit cleanly inside the available container width without horizontal overflow or clipping.
 */
export default function FloatingStatCluster({ cards = [] }) {
  const shouldReduceMotion = useReducedMotion();

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15, scale: 0.96 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: 0.35,
        ease: 'easeOut',
      },
    },
  };

  if (!cards || cards.length === 0) return null;

  return (
    <div className="w-full mb-6 relative">
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 w-full gap-4 lg:gap-5 items-stretch"
      >
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <motion.div
              key={card.id}
              variants={itemVariants}
              className={`
                relative w-full h-full min-w-0
                transition-all duration-300 ease-out
                ${card.desktopClasses || ''}
              `}
            >
              {/* Inner Card Wrapper with Hover Elevation */}
              <div className="w-full h-full transition-all duration-300 ease-[cubic-bezier(0.23,1,0.32,1)] 
                lg:hover:!rotate-0 lg:hover:!-translate-y-2 lg:hover:!scale-[1.02] lg:hover:!z-50 cursor-pointer group"
              >
                {/* Backplate Tab */}
                <div className={`absolute inset-x-0 -bottom-2 top-4 rounded-[20px] ${card.backplateBg || 'bg-slate-200'} transition-all duration-300 shadow-xs lg:group-hover:translate-y-0.5 lg:group-hover:shadow-sm`}></div>
                
                {/* Front White Card */}
                <div className={`relative bg-white/95 backdrop-blur-sm border ${card.isFocal ? 'border-brand-red/30 ring-1 ring-brand-red/10' : 'border-slate-100'} rounded-[20px] p-5 shadow-[0_4px_15px_rgb(0,0,0,0.04)] flex flex-col justify-between h-[135px] sm:h-[140px]`}>
                  
                  <div>
                    {/* Top Row: Icon and Title */}
                    <div className="flex items-center gap-2 mb-2 min-w-0">
                      {Icon && <Icon className={`w-4 h-4 shrink-0 ${card.iconColor || 'text-slate-600'}`} />}
                      <h4 className="text-[11px] font-black uppercase tracking-wider text-brand-navy truncate">
                        {card.label}
                      </h4>
                    </div>

                    {/* Middle Section: Value */}
                    <div className="text-2xl sm:text-3xl font-black text-brand-navy tracking-tight leading-none mb-3 flex items-baseline truncate">
                      {card.prefix && <span className="mr-0.5">{card.prefix}</span>}
                      {typeof card.value === 'number' ? (
                        <AnimatedCounter value={card.value} />
                      ) : (
                        <span>{card.value}</span>
                      )}
                      {card.suffix && <span className="ml-0.5 font-bold text-base sm:text-lg">{card.suffix}</span>}
                    </div>
                  </div>

                  {/* Bottom Section: Badge Subtext */}
                  <div className="min-w-0">
                    <span className={`text-[9px] font-black uppercase tracking-wider truncate inline-flex items-center px-2 py-0.5 rounded border max-w-full ${card.isFocal ? 'bg-rose-50 border-rose-100 text-brand-red' : 'bg-slate-50 border-slate-100 text-slate-500'}`}>
                      {card.subtext}
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </motion.div>
    </div>
  );
}
