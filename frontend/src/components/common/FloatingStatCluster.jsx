import React from 'react';
import AnimatedCounter from './AnimatedCounter';
import { motion, useReducedMotion } from 'framer-motion';

/**
 * Reusable Global Floating Statistic Cluster
 * Displays 1-4 statistic cards in a premium, layered, floating aesthetic.
 * 
 * @param {Array} cards - Array of card configuration objects.
 * Expected properties per card:
 * - id: unique string
 * - label: string (e.g. 'ACTIVE REQUESTS')
 * - value: number
 * - subtext: string
 * - icon: Lucide Icon Component
 * - iconColor: tailwind text class (e.g., 'text-brand-red')
 * - backplateBg: tailwind bg class (e.g., 'bg-rose-200')
 * - desktopClasses: tailwind classes for layout (e.g., 'lg:z-30 lg:rotate-1 lg:-ml-4')
 * - isFocal: boolean (renders card slightly wider and more pronounced)
 * - prefix: optional string for value (e.g. '~')
 * - suffix: optional string for value (e.g. '%')
 */
export default function FloatingStatCluster({ cards = [] }) {
  const shouldReduceMotion = useReducedMotion();

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15, scale: 0.95 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: 0.4,
        ease: 'easeOut',
      },
    },
  };

  if (!cards || cards.length === 0) return null;

  return (
    // Statistics Stage: controlled height, responsive margin bottom provides comfortable separation
    <div className="w-full mb-6 sm:mb-8 lg:mb-12 xl:mb-14 relative lg:h-[220px] flex items-center justify-center">
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className={`grid grid-cols-1 sm:grid-cols-2 lg:flex lg:flex-row lg:items-center lg:justify-center w-full gap-4 lg:gap-6`}
      >
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <motion.div
              key={card.id}
              variants={itemVariants}
              className={`
                relative w-full sm:w-auto lg:w-[240px] xl:w-[260px] flex-shrink-0
                transition-all duration-300 ease-out
                ${card.desktopClasses || ''}
              `}
            >
              {/* Inner Rotating Card Wrapper for Desktop Hover */}
              <div className={`w-full transition-all duration-300 ease-[cubic-bezier(0.23,1,0.32,1)] 
                lg:hover:!rotate-0 lg:hover:!-translate-y-4 lg:hover:!scale-110 lg:hover:!z-50 cursor-pointer group`}
              >
                {/* Backplate Tab */}
                <div className={`absolute inset-x-0 -bottom-2.5 top-6 rounded-[20px] ${card.backplateBg || 'bg-slate-200'} transition-all duration-300 shadow-sm lg:group-hover:translate-y-1 lg:group-hover:shadow-md`}></div>
                
                {/* Front White Card */}
                <div className={`relative bg-white/95 backdrop-blur-sm border ${card.isFocal ? 'border-brand-red/20' : 'border-slate-100'} rounded-[20px] p-5 shadow-[0_4px_15px_rgb(0,0,0,0.05)] flex flex-col justify-between h-[130px] lg:h-[140px]`}>
                  
                  <div>
                    {/* Top Row: Icon and Title */}
                    <div className="flex items-center gap-2 mb-2">
                      {Icon && <Icon className={`w-4 h-4 ${card.iconColor || 'text-slate-600'}`} />}
                      <h4 className="text-[11px] font-black uppercase tracking-wider text-brand-navy truncate">
                        {card.label}
                      </h4>
                    </div>

                    {/* Middle Section: Value */}
                    <div className="text-3xl font-black text-brand-navy tracking-tight leading-none mb-3 flex items-baseline">
                      {card.prefix && <span className="mr-0.5">{card.prefix}</span>}
                      {typeof card.value === 'number' ? (
                        <AnimatedCounter value={card.value} />
                      ) : (
                        <span>{card.value}</span>
                      )}
                      {card.suffix && <span className="ml-0.5 font-bold text-lg">{card.suffix}</span>}
                    </div>
                  </div>

                  {/* Bottom Section: Badge Subtext */}
                  <div>
                    <span className={`text-[9px] font-black uppercase tracking-wider truncate inline-flex items-center px-2 py-0.5 rounded border ${card.isFocal ? 'bg-rose-50 border-rose-100 text-brand-red' : 'bg-slate-50 border-slate-100 text-slate-500'}`}>
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
