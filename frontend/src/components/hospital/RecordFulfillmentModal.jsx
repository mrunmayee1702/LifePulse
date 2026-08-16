import React, { useState } from 'react';
import { Button } from '../Button';
import { CheckCircle2, HeartPulse, AlertCircle, X, UserCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function RecordFulfillmentModal({
  isOpen,
  onClose,
  request,
  acceptedDonors = [],
  onSuccess,
}) {
  const [selectedDonorId, setSelectedDonorId] = useState('');
  const [unitsReceived, setUnitsReceived] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen || !request) return null;

  const remainingUnits = Math.max(request.unitsRequired - request.unitsFulfilled, 0);

  // Filter donors who accepted this request and haven't fulfilled yet
  const unfulfilledAcceptedDonors = acceptedDonors.filter((d) => !d.isFulfilled);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!selectedDonorId) {
      setErrorMsg('Please select an accepted donor who provided the blood.');
      return;
    }

    if (unitsReceived < 1 || unitsReceived > remainingUnits) {
      setErrorMsg(`Units received must be between 1 and ${remainingUnits}.`);
      return;
    }

    setIsSubmitting(true);
    try {
      await onSuccess(request._id || request.id, {
        donorId: selectedDonorId,
        unitsReceived: Number(unitsReceived),
      });
      onClose();
    } catch (err) {
      console.error('[Record Fulfillment Error]:', err);
      setErrorMsg(err.message || 'Failed to record blood fulfillment.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full z-10 shadow-2xl border border-slate-200 relative overflow-hidden"
        >
          {/* Top Accent */}
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-emerald-500" />

          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-5 right-5 w-8 h-8 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center hover:bg-slate-200 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-black text-brand-navy leading-tight">
                Record Blood Fulfillment
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                Request Ref: {request.patientReference || request._id} • {request.bloodGroup} Blood
              </p>
            </div>
          </div>

          {errorMsg && (
            <div className="mb-4 p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Request Status Bar */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 grid grid-cols-3 gap-2 text-center text-xs mb-6">
            <div>
              <span className="block text-[10px] font-bold text-slate-400 uppercase">Required</span>
              <strong className="text-sm font-extrabold text-brand-navy">{request.unitsRequired} Units</strong>
            </div>
            <div>
              <span className="block text-[10px] font-bold text-slate-400 uppercase">Received</span>
              <strong className="text-sm font-extrabold text-emerald-600">{request.unitsFulfilled} Units</strong>
            </div>
            <div>
              <span className="block text-[10px] font-bold text-slate-400 uppercase">Remaining</span>
              <strong className="text-sm font-extrabold text-brand-red">{remainingUnits} Units</strong>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-brand-navy mb-1">
                Select Accepted Donor <span className="text-brand-red">*</span>
              </label>
              {unfulfilledAcceptedDonors.length === 0 ? (
                <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-medium flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>No unfulfilled accepted donors for this request. Acceptances will appear here once donors respond.</span>
                </div>
              ) : (
                <select
                  value={selectedDonorId}
                  onChange={(e) => setSelectedDonorId(e.target.value)}
                  required
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-brand-navy focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="">-- Choose Accepted Donor --</option>
                  {unfulfilledAcceptedDonors.map((donor) => (
                    <option key={donor.donorId || donor._id} value={donor.donorId || donor._id}>
                      {donor.name} ({donor.bloodGroup || request.bloodGroup}) — Accepted {donor.consentGivenAt ? new Date(donor.consentGivenAt).toLocaleDateString() : 'Recently'}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-brand-navy mb-1">
                Units Received from this Donor (Max: {remainingUnits})
              </label>
              <input
                type="number"
                min="1"
                max={remainingUnits || 1}
                value={unitsReceived}
                onChange={(e) => setUnitsReceived(Math.max(1, Number(e.target.value)))}
                disabled={unfulfilledAcceptedDonors.length === 0}
                required
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-brand-navy focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="pt-2 flex justify-end gap-3">
              <Button type="button" variant="ghost" size="md" onClick={onClose} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="md"
                disabled={isSubmitting || unfulfilledAcceptedDonors.length === 0 || remainingUnits === 0}
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                {isSubmitting ? 'Recording...' : '✓ Confirm & Record Fulfillment'}
              </Button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
