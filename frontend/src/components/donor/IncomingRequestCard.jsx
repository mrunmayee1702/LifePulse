import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../Button';
import { donorService } from '../../services/donorService';
import RadarPing from '../common/RadarPing';
import {
  MapPin,
  Clock,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  RefreshCw,
  HeartPulse,
  AlertTriangle,
  Flame,
  ArrowRight,
} from 'lucide-react';
import { motion } from 'framer-motion';

export default function IncomingRequestCard({ request }) {
  const { user } = useAuth();
  const [status, setStatus] = useState(request.consentStatus || 'NONE'); // NONE | ACCEPTED | DECLINED | FULFILLED
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const donorBloodGroup = user?.bloodGroup || 'A+';
  const requestedBloodGroup = request.bloodGroup || 'A+';
  const isExactMatch = donorBloodGroup.toUpperCase() === requestedBloodGroup.toUpperCase();

  const urgencyUpper = (request.urgency || '').toUpperCase();
  const isCriticalOnly = urgencyUpper === 'CRITICAL' || urgencyUpper === 'EMERGENCY';
  const isUrgent = urgencyUpper === 'URGENT';

  const isPartialFulfillment = request.status === 'PARTIALLY_FULFILLED' || (request.unitsFulfilled > 0 && request.remainingUnits > 0);
  const remainingUnits = request.remainingUnits !== undefined
    ? request.remainingUnits
    : Math.max((request.unitsRequired || 1) - (request.unitsFulfilled || 0), 1);
  
  const unitsRequired = request.unitsRequired || 1;
  const unitsFulfilled = request.unitsFulfilled || 0;
  const hospitalName = request.hospitalName || 'Verified Medical Center';

  const locationText = typeof request.location === 'string'
    ? request.location
    : request.location && typeof request.location === 'object'
    ? `${request.location.city || ''}${request.location.state ? `, ${request.location.state}` : ''}`
    : request.locationAddress || request.city || 'Chembur, Mumbai';

  const distanceText = request.distanceKm !== null && request.distanceKm !== undefined
    ? `${request.distanceKm} km away`
    : '2.1 km away';

  const handleAccept = async () => {
    setIsSubmitting(true);
    setErrorMsg('');
    try {
      const res = await donorService.acceptRequest(request.id);
      if (res.success) {
        setStatus('ACCEPTED');
      }
    } catch (err) {
      console.error('[Accept Request Error]:', err);
      setErrorMsg(err.message || 'Failed to record consent. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDecline = async () => {
    setIsSubmitting(true);
    setErrorMsg('');
    try {
      const res = await donorService.declineRequest(request.id);
      if (res.success) {
        setStatus('DECLINED');
      }
    } catch (err) {
      console.error('[Decline Request Error]:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (status === 'FULFILLED' || request.isFulfilledForDonor) {
    return (
      <div className="bg-emerald-50 border border-emerald-200 rounded-3xl p-6 shadow-xs relative">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-sm">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div className="flex-grow">
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800">
                ✓ YOUR DONATION FULFILLED & RECORDED
              </span>
              <span className="text-xs font-bold text-emerald-700">Verified by Hospital</span>
            </div>
            <h4 className="text-base sm:text-lg font-extrabold text-emerald-950 mb-1">
              Thank you! Donation received by {hospitalName}
            </h4>
            <p className="text-xs sm:text-sm text-emerald-800 leading-relaxed mb-2 font-medium">
              The hospital confirmed receipt of your blood donation. This life-saving contribution is recorded in your Donation History.
            </p>
            <div className="flex flex-wrap items-center gap-3 mt-2">
              <div className="text-xs text-emerald-800 font-semibold bg-emerald-100/80 px-3 py-1 rounded-xl">
                {requestedBloodGroup} Blood • {locationText}
              </div>
              <a
                href="/donor/history"
                className="text-xs font-bold text-emerald-700 hover:text-emerald-900 underline"
              >
                View Donation History →
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (status === 'ACCEPTED') {
    return (
      <div className="bg-emerald-50/70 border border-emerald-200 rounded-3xl p-6 shadow-xs relative">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-sm">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div className="flex-grow">
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800">
                ✓ ACCEPTED & CONNECTED
              </span>
              <span className="text-xs font-bold text-emerald-700">Consent Shared</span>
            </div>
            <h4 className="text-base sm:text-lg font-bold text-emerald-950 mb-1">
              You're connected with {hospitalName}
            </h4>
            <p className="text-xs sm:text-sm text-emerald-800 leading-relaxed mb-2 font-medium">
              Your consent has been recorded. The hospital can now view your shared contact details for urgent coordination.
            </p>
            <div className="text-xs text-emerald-800 font-semibold bg-emerald-100/60 px-3 py-1 rounded-xl inline-block">
              Request Details: {requestedBloodGroup} Blood • {remainingUnits} Unit(s) Still Needed • {locationText}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (status === 'DECLINED') {
    return (
      <div className="bg-slate-50/80 border border-slate-200/80 rounded-3xl p-4 flex items-center justify-between opacity-70">
        <span className="text-xs sm:text-sm text-slate-500 font-medium">
          Request from <strong className="text-slate-700 font-bold">{hospitalName}</strong> declined.
        </span>
        <span className="px-3 py-1 rounded-full text-xs font-bold tracking-wider uppercase bg-slate-200 text-slate-600">
          DECLINED
        </span>
      </div>
    );
  }

  return (
    <motion.div
      whileHover={{ y: -2 }}
      className={`bg-white/90 backdrop-blur-md rounded-3xl p-6 border transition-all duration-300 relative overflow-hidden shadow-xs hover:shadow-md ${
        isCriticalOnly
          ? 'border-rose-300/90 ring-1 ring-rose-100 shadow-[0_4px_20px_rgba(225,29,72,0.08)]'
          : isUrgent
          ? 'border-amber-200/90 bg-amber-50/20'
          : isPartialFulfillment
          ? 'border-amber-300/80 bg-amber-50/10'
          : 'border-slate-200/80'
      }`}
    >
      {/* Top Accent Bar for Critical Only */}
      {isCriticalOnly && (
        <div className="absolute top-0 left-0 right-0 h-1 bg-brand-red animate-pulse" />
      )}

      {errorMsg && (
        <div className="mb-4 p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
          {errorMsg}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
        {/* Left Column: Hospital Name, Location, Distance & Radar Pulse Indicator */}
        <div className="md:col-span-5 space-y-2">
          <div className="flex items-center gap-2">
            {isCriticalOnly ? (
              <div className="flex items-center gap-2">
                <RadarPing color="#E11D48" size={32}>
                  <div className="w-6 h-6 rounded-full bg-brand-red text-white flex items-center justify-center shadow-sm">
                    <Flame className="w-3.5 h-3.5" />
                  </div>
                </RadarPing>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold tracking-wider uppercase bg-rose-100 text-brand-red border border-rose-200 shadow-2xs">
                  CRITICAL EMERGENCY
                </span>
              </div>
            ) : isPartialFulfillment ? (
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-500 inline-block animate-ping" />
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold tracking-wider uppercase bg-amber-100 text-amber-900 border border-amber-300">
                  🟠 PARTIALLY FULFILLED ({unitsFulfilled}/{unitsRequired})
                </span>
              </div>
            ) : isUrgent ? (
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-500 inline-block" />
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold tracking-wider uppercase bg-amber-50 text-amber-700 border border-amber-200">
                  URGENT REQUEST
                </span>
              </div>
            ) : (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold tracking-wider uppercase bg-slate-100 text-slate-600 border border-slate-200">
                STANDARD REQUEST
              </span>
            )}
          </div>

          <h3 className="text-base sm:text-lg font-bold text-brand-navy leading-tight">
            {hospitalName}
          </h3>

          <div className="flex flex-col space-y-1 text-xs sm:text-sm text-slate-500 font-medium">
            <div className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span>{locationText}</span>
            </div>
            <div className="flex items-center gap-1.5 text-brand-red font-semibold">
              <MapPin className="w-3.5 h-3.5 text-brand-red shrink-0" />
              <span>{distanceText}</span>
            </div>
          </div>
        </div>

        {/* Center Column: Blood Group Needed & Donor Compatibility Badge */}
        <div className="md:col-span-4 border-y md:border-y-0 md:border-x border-slate-100 py-3 md:py-0 md:px-6 grid grid-cols-2 gap-4">
          <div>
            <span className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
              Blood Needed
            </span>
            <div className="text-2xl sm:text-3xl font-extrabold text-brand-navy">
              {requestedBloodGroup}
            </div>

            {/* Clear Compatibility Badge & Relationship */}
            {isExactMatch ? (
              <div className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-lg mt-1.5 shadow-2xs">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Exact Match ({donorBloodGroup})</span>
              </div>
            ) : (
              <div className="mt-1.5 space-y-0.5">
                <div className="inline-flex items-center gap-1 text-xs font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-lg shadow-2xs">
                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                  <span>Compatible Donor</span>
                </div>
                <div className="text-[11px] font-semibold text-slate-500 flex items-center gap-1">
                  <span>{donorBloodGroup} donor</span>
                  <ArrowRight className="w-3 h-3 text-slate-400 shrink-0" />
                  <span>{requestedBloodGroup} recipient</span>
                </div>
              </div>
            )}
          </div>

          <div>
            <span className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
              {isPartialFulfillment ? 'Still Needed' : 'Units Needed'}
            </span>
            <div className="text-xl sm:text-2xl font-extrabold text-brand-navy">
              {remainingUnits} Unit{remainingUnits > 1 ? 's' : ''}
            </div>
            {isPartialFulfillment && (
              <span className="text-[11px] font-bold text-amber-700 block mt-0.5">
                ({unitsFulfilled} received of {unitsRequired} required)
              </span>
            )}
          </div>
        </div>

        {/* Right Column: Urgency & Action Button */}
        <div className="md:col-span-3 flex flex-col justify-between items-start md:items-end space-y-3">
          <div className="text-left md:text-right">
            <span className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-0.5">
              Urgency Level
            </span>
            <div className={`text-base sm:text-lg font-bold ${isCriticalOnly ? 'text-brand-red' : isUrgent ? 'text-amber-600' : 'text-slate-700'}`}>
              {request.urgency || 'ASAP'}
            </div>
            <span className={`px-2 py-0.5 rounded-full text-xs font-bold inline-block mt-0.5 ${
              isCriticalOnly ? 'bg-rose-100 text-brand-red' : isUrgent ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-600'
            }`}>
              {isCriticalOnly ? 'Immediate Action Needed' : isUrgent ? 'High Priority' : 'Standard Routine'}
            </span>
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto">
            <Button
              variant="ghost"
              size="sm"
              disabled={isSubmitting}
              onClick={handleDecline}
              className="text-slate-400 hover:text-slate-600 rounded-2xl text-xs sm:text-sm font-semibold"
            >
              Decline
            </Button>

            <Button
              variant="primary"
              size="sm"
              disabled={isSubmitting}
              onClick={handleAccept}
              className={`w-full md:w-auto text-white rounded-2xl px-5 py-2.5 shadow-md text-xs sm:text-sm font-bold transition-all ${
                isCriticalOnly
                  ? 'bg-brand-red hover:bg-rose-700 shadow-rose-200'
                  : 'bg-brand-navy hover:bg-slate-800 shadow-slate-200'
              }`}
            >
              {isSubmitting ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                'Respond Now'
              )}
            </Button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
