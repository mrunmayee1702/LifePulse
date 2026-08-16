import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { BrainCircuit, Check, ArrowRight, User } from 'lucide-react';

export default function SmartDonorMatchesPanel({ matches = [], isLoading = false, onMatchClick }) {
  const shouldReduceMotion = useReducedMotion();

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, x: 10 },
    visible: { opacity: 1, x: 0, transition: { duration: 0.3 } }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex flex-col h-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 shrink-0 border-b border-slate-100 pb-4">
        <div>
          <h3 className="text-xl font-black text-brand-navy flex items-center gap-2">
            <BrainCircuit className="w-5 h-5 text-brand-red" />
            <span>Smart Donor Matches</span>
          </h3>
          <p className="text-xs text-slate-500 font-bold mt-1">
            Best compatible donors for your most urgent request
          </p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-40 text-slate-400">
            <div className="w-6 h-6 border-2 border-brand-red border-t-transparent rounded-full animate-spin mb-3"></div>
            <span className="text-xs font-bold">Analyzing compatibility network...</span>
          </div>
        ) : matches.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-slate-400 text-center bg-slate-50 rounded-2xl border border-slate-100 p-6">
            <User className="w-8 h-8 mb-3 text-slate-300" />
            <span className="text-sm font-bold text-slate-600 mb-1">No matches found right now</span>
            <span className="text-xs font-medium text-slate-400">There may not be any active urgent requests or eligible donors.</span>
          </div>
        ) : (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-4"
          >
            {matches.map((match, idx) => (
              <motion.div
                key={idx}
                variants={itemVariants}
                className="group relative bg-white border border-slate-200 hover:border-brand-red/30 rounded-2xl p-4 shadow-sm hover:shadow-md transition-all duration-200"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1.5">
                      <h4 className="text-sm font-black text-brand-navy truncate">
                        {match.contactUnlocked && match.donorName ? match.donorName : 'Anonymous Donor'}
                      </h4>
                      {match.matchScore && (
                        <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-black px-2 py-0.5 rounded-full">
                          {match.matchScore}% Match
                        </span>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2 text-[11px] font-bold text-slate-500 mb-3">
                      <span className="text-brand-red">{match.bloodGroup}</span>
                      <span>•</span>
                      <span>{match.approxDistanceKm !== null ? `${match.approxDistanceKm} km` : match.city}</span>
                      <span>•</span>
                      <span className={match.isAvailable ? 'text-emerald-600' : 'text-amber-600'}>
                        {match.isAvailable ? 'Available' : 'Standby'}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-y-1.5 gap-x-2 text-[10px] font-bold text-slate-600">
                      <div className="flex items-center gap-1.5">
                        <Check className="w-3 h-3 text-emerald-500" />
                        <span>Compatible</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Check className="w-3 h-3 text-emerald-500" />
                        <span>{match.approxDistanceKm !== null && match.approxDistanceKm < 50 ? 'Nearby' : 'Available Location'}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Check className="w-3 h-3 text-emerald-500" />
                        <span>Eligible</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Check className="w-3 h-3 text-emerald-500" />
                        <span>Verified</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="shrink-0 flex flex-col items-end">
                    <button 
                      onClick={() => onMatchClick && onMatchClick(match)}
                      className="w-8 h-8 rounded-full bg-slate-50 hover:bg-rose-50 text-slate-400 hover:text-brand-red flex items-center justify-center transition-colors group-hover:scale-110"
                    >
                      <ArrowRight className="w-4 h-4" />
                    </button>
                    <span className="text-[9px] font-bold text-slate-400 mt-2 hover:underline cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity">
                      View Match
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </div>
  );
}
