import React from 'react';
import { Badge } from '../Badge';
import { AlertCircle, Flame, ArrowRight, Stethoscope } from 'lucide-react';
import { motion } from 'framer-motion';

export default function CriticalRequestsPanel({ requests = [] }) {
  const criticalList = requests.filter(
    (r) => (r.urgency === 'CRITICAL' || r.urgency === 'URGENT') && 
           (r.status === 'OPEN' || r.status === 'PARTIALLY_FULFILLED')
  );

  const getLocationText = (locationProp, locationAddress) => {
    if (typeof locationProp === 'string') return locationProp;
    if (locationProp && typeof locationProp === 'object') {
      const city = locationProp.city || '';
      const state = locationProp.state || '';
      if (city || state) return `${city}${state ? `, ${state}` : ''}`;
    }
    if (typeof locationAddress === 'string') return locationAddress;
    return 'Facility Location';
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.15 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4 } }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex flex-col h-full">
      <div className="flex items-center gap-2 border-b border-slate-100 pb-4 mb-6 shrink-0">
        <Flame className="w-5 h-5 text-brand-red animate-pulse" />
        <div>
          <h3 className="text-xl font-black text-brand-navy">Critical Requests</h3>
          <p className="text-xs text-slate-500 font-bold mt-1">
            Requests requiring immediate donor allocation
          </p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
        {criticalList.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-slate-400 text-center bg-emerald-50 rounded-2xl border border-emerald-100 p-6">
            <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 mb-3">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <span className="text-sm font-bold text-slate-600 mb-1">No Critical Requests</span>
            <span className="text-xs font-medium text-slate-400">All emergencies are currently fulfilled or handled.</span>
          </div>
        ) : (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-4"
          >
            {criticalList.map((req) => {
              const isCritical = req.urgency === 'CRITICAL';
              const locationStr = getLocationText(req.location, req.locationAddress);
              const refId = String(req._id || req.id).substring(0, 6);

              return (
                <motion.div
                  key={req._id || req.id}
                  variants={itemVariants}
                  className={`group relative bg-white border border-slate-200 hover:border-brand-red/30 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all duration-200`}
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div className="w-10 h-10 rounded-full bg-rose-50 text-brand-red flex items-center justify-center font-black shadow-xs shrink-0 ring-4 ring-rose-50/50">
                          {req.bloodGroup}
                        </div>
                        <div>
                          <h4 className="text-sm font-black text-brand-navy leading-tight">
                            {req.bloodGroup} Blood Request
                          </h4>
                          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                            Status: <span className="text-brand-navy">{req.status.replace('_', ' ')}</span>
                          </span>
                        </div>
                      </div>
                      
                      <div className="shrink-0 flex items-center gap-2">
                        {isCritical && (
                          <span className="relative flex h-2.5 w-2.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-red opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-brand-red"></span>
                          </span>
                        )}
                        <Badge
                          variant={isCritical ? 'danger' : 'warning'}
                          className="text-[9px] font-black uppercase py-1 px-2"
                        >
                          {req.urgency}
                        </Badge>
                      </div>
                    </div>

                    <div className="pt-2 pb-1">
                      <div className="flex items-center gap-2 text-sm font-bold text-slate-700">
                        <Stethoscope className="w-4 h-4 text-slate-400" />
                        <span>{req.unitsRequired} Units Needed • {req.unitDepartment || 'Hospital Unit'}</span>
                      </div>
                    </div>

                    <div className="flex flex-col gap-1 text-[11px] font-bold text-slate-500 bg-slate-50 p-3 rounded-xl border border-slate-100">
                      <div className="flex items-center justify-between">
                        <span>Location:</span>
                        <span className="text-slate-700">{locationStr}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Reference:</span>
                        <span className="font-mono text-slate-600 bg-white px-1.5 py-0.5 rounded border border-slate-200">
                          PT-{refId}
                        </span>
                      </div>
                    </div>

                    <div className="pt-2 flex justify-end">
                      <button 
                        onClick={() => window.location.href = `/hospital/requests/${req._id || req.id}`}
                        className="inline-flex items-center gap-1.5 text-[11px] font-black text-brand-red hover:text-rose-800 uppercase tracking-wider transition-colors"
                      >
                        <span>View Request</span>
                        <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </div>
    </div>
  );
}
