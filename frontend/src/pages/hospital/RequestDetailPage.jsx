import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { hospitalService } from '../../services/hospitalService';
import HospitalHeader from '../../components/hospital/HospitalHeader';
import DonorMatchCard from '../../components/hospital/DonorMatchCard';
import RecordFulfillmentModal from '../../components/hospital/RecordFulfillmentModal';
import Container from '../../components/Container';
import Card from '../../components/Card';
import Footer from '../../components/Footer';
import { Button } from '../../components/Button';
import { Badge } from '../../components/Badge';
import {
  ArrowLeft,
  Calendar,
  MapPin,
  Clock,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  RefreshCw,
  AlertCircle,
  HeartPulse,
  Sparkles,
  ShieldCheck,
  Lock,
  UserCheck,
  Info,
  Phone,
  Mail,
  CheckSquare,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function RequestDetailPage() {
  const { user, logout } = useAuth();
  const requestId = window.location.pathname.split('/hospital/requests/')[1];

  const [profile, setProfile] = useState(null);
  const [request, setRequest] = useState(null);
  const [matchData, setMatchData] = useState(null);
  const [isFulfillmentModalOpen, setIsFulfillmentModalOpen] = useState(false);

  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMatches, setIsLoadingMatches] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const loadData = async () => {
    setIsLoading(true);
    setErrorMsg('');
    try {
      const [profileRes, requestRes] = await Promise.all([
        hospitalService.getHospitalProfile(),
        hospitalService.getBloodRequest(requestId),
      ]);

      if (profileRes.success) setProfile(profileRes.data.profile);
      if (requestRes.success) {
        setRequest(requestRes.data.request);
      }
    } catch (err) {
      console.error('[Load Request Detail Error]:', err);
      setErrorMsg(err.message || 'Failed to fetch blood request details.');
    } finally {
      setIsLoading(false);
    }
  };

  const loadMatches = async () => {
    setIsLoadingMatches(true);
    try {
      const res = await hospitalService.getBloodRequestMatches(requestId);
      if (res.success) {
        setMatchData(res.data);
      }
    } catch (err) {
      console.warn('[Load Matches Notice]:', err.message);
    } finally {
      setIsLoadingMatches(false);
    }
  };

  useEffect(() => {
    if (requestId) {
      loadData();
      loadMatches();
    }
  }, [requestId]);

  // Record Fulfillment Handler
  const handleConfirmFulfillment = async (reqId, fulfillmentPayload) => {
    setErrorMsg('');
    setSuccessMsg('');
    const res = await hospitalService.recordFulfillment(reqId, fulfillmentPayload);
    if (res.success) {
      setSuccessMsg(`Blood donation received and fulfillment updated! (${res.data.unitsFulfilled} / ${res.data.request.unitsRequired} units)`);
      loadData();
      loadMatches();
    }
  };

  // Cancel Request Handler (Gated for non-fulfilled requests)
  const handleCancelRequest = async () => {
    if (!request) return;
    if (request.status === 'FULFILLED' || request.unitsFulfilled >= request.unitsRequired) {
      setErrorMsg('Cannot cancel a fully fulfilled blood request.');
      return;
    }

    if (!window.confirm('Are you sure you want to cancel this blood request?')) return;
    setErrorMsg('');
    setSuccessMsg('');
    setIsUpdating(true);

    try {
      const res = await hospitalService.cancelBloodRequest(request._id);
      if (res.success) {
        setRequest(res.data.request);
        setSuccessMsg('Blood request has been cancelled.');
        loadMatches();
      }
    } catch (err) {
      setErrorMsg(err.message || 'Failed to cancel blood request.');
    } finally {
      setIsUpdating(false);
    }
  };

  const isFulfilled = request?.status === 'FULFILLED' || (request?.unitsFulfilled >= request?.unitsRequired);
  const isCancelled = request?.status === 'CANCELLED';
  const remainingUnits = request ? Math.max(request.unitsRequired - request.unitsFulfilled, 0) : 0;
  const acceptedDonors = request?.acceptedDonors || [];
  const fulfillmentDateText = request?.fulfilledAt
    ? new Date(request.fulfilledAt).toLocaleDateString()
    : request?.updatedAt
    ? new Date(request.updatedAt).toLocaleDateString()
    : new Date().toLocaleDateString();

  return (
    <div className="min-h-screen bg-brand-bg text-brand-navy flex flex-col justify-between antialiased">
      <HospitalHeader user={user} profile={profile} onLogout={logout} currentPath="/hospital/requests" />

      <main className="flex-grow py-8">
        <Container size="md">
          <div className="mb-6">
            <a
              href="/hospital/requests"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-brand-red transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Operations Directory</span>
            </a>
          </div>

          {isLoading ? (
            <div className="py-20 flex flex-col items-center justify-center gap-3 text-brand-navy">
              <RefreshCw className="w-8 h-8 text-brand-red animate-spin" />
              <span className="text-sm font-semibold">Loading Request Details...</span>
            </div>
          ) : errorMsg && !request ? (
            <div className="p-6 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-sm max-w-lg mx-auto text-center my-12">
              <AlertCircle className="w-8 h-8 mx-auto mb-2 text-rose-600" />
              <p className="font-bold mb-3">{errorMsg}</p>
              <a
                href="/hospital/requests"
                className="px-4 py-2 bg-slate-800 text-white rounded-xl text-xs font-bold hover:bg-black transition-all inline-block"
              >
                Return to Directory
              </a>
            </div>
          ) : (
            <div className="space-y-6">
              {errorMsg && (
                <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {successMsg && (
                <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2 font-bold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{successMsg}</span>
                </div>
              )}

              {/* FULFILLED COMPLETION BANNER */}
              {isFulfilled && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-6 rounded-3xl bg-emerald-500 text-white shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center text-white shrink-0">
                      <CheckCircle2 className="w-7 h-7" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-white/20 uppercase tracking-wider">
                          ✓ REQUEST FULFILLED
                        </span>
                        <span className="text-xs font-bold text-emerald-100">Operation Completed</span>
                      </div>
                      <h2 className="text-xl font-black">
                        {request.unitsRequired} / {request.unitsRequired} Units Received & Verified
                      </h2>
                      <p className="text-xs text-emerald-100 font-medium">
                        Completed on {fulfillmentDateText} • All required units have been received from donors. No further action needed.
                      </p>
                    </div>
                  </div>

                  <span className="px-4 py-2 bg-white text-emerald-800 font-extrabold rounded-2xl text-xs shrink-0 text-center shadow-xs">
                    FULFILLED & CLOSED
                  </span>
                </motion.div>
              )}

              {/* Main Request Information Card */}
              <Card variant="elevated" className="p-8 border border-slate-200">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-6 mb-6">
                  <div>
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      {isFulfilled ? (
                        <Badge variant="success">FULFILLED</Badge>
                      ) : request.status === 'PARTIALLY_FULFILLED' ? (
                        <Badge variant="warning">PARTIALLY FULFILLED</Badge>
                      ) : isCancelled ? (
                        <Badge variant="neutral">CANCELLED</Badge>
                      ) : (
                        <Badge variant="info">OPEN</Badge>
                      )}
                      <Badge variant={request.urgency === 'CRITICAL' ? 'danger' : 'warning'}>
                        {request.urgency} URGENCY
                      </Badge>
                      <span className="text-xs font-mono font-bold text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-md">
                        Patient Ref: {request.patientReference}
                      </span>
                    </div>

                    <h1 className="text-3xl font-black text-brand-navy">
                      {request.bloodGroup} Blood Request
                    </h1>
                    <span className="text-xs text-brand-slate block mt-1">
                      Posted by {request.hospitalName} on {new Date(request.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  {/* ACTION BUTTONS (NO CANCEL BUTTON IF FULFILLED) */}
                  <div className="flex items-center gap-2">
                    {!isFulfilled && !isCancelled && remainingUnits > 0 && (
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => setIsFulfillmentModalOpen(true)}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white"
                      >
                        + Record Blood Received
                      </Button>
                    )}

                    {!isFulfilled && !isCancelled && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleCancelRequest}
                        disabled={isUpdating}
                        className="text-rose-600 border-rose-200 hover:bg-rose-50"
                        icon={XCircle}
                      >
                        Cancel Request
                      </Button>
                    )}
                  </div>
                </div>

                {/* Grid Info Details */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8 text-xs">
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <span className="block font-bold text-slate-400 mb-1">Units Required</span>
                    <span className="text-2xl font-black text-brand-navy">{request.unitsRequired} Units</span>
                  </div>

                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <span className="block font-bold text-slate-400 mb-1">Units Received</span>
                    <span className="text-2xl font-black text-emerald-600">{request.unitsFulfilled} Units</span>
                  </div>

                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <span className="block font-bold text-slate-400 mb-1">Remaining Units</span>
                    <span className="text-2xl font-black text-brand-red">
                      {remainingUnits} Units
                    </span>
                  </div>
                </div>

                {/* Reason & Location */}
                <div className="space-y-4 text-xs">
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <span className="block font-bold text-slate-400 mb-1">Reason for Request</span>
                    <p className="font-semibold text-brand-navy leading-relaxed">{request.reason}</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center gap-3">
                      <Calendar className="w-5 h-5 text-brand-red shrink-0" />
                      <div>
                        <span className="block font-bold text-slate-400">Required Date</span>
                        <span className="font-extrabold text-brand-navy">
                          {new Date(request.requiredDate).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center gap-3">
                      <MapPin className="w-5 h-5 text-brand-red shrink-0" />
                      <div>
                        <span className="block font-bold text-slate-400">Location</span>
                        <span className="font-extrabold text-brand-navy">
                          {request.location?.city}, {request.location?.state}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>

              {/* ACCEPTED DONORS FOR THIS REQUEST */}
              <Card variant="elevated" className="p-8 border border-slate-200">
                <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-6">
                  <div>
                    <h2 className="text-xl font-extrabold text-brand-navy flex items-center gap-2">
                      <ShieldCheck className="w-5 h-5 text-emerald-600" />
                      <span>Accepted Donors ({acceptedDonors.length})</span>
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Donors who explicitly accepted this request and granted contact consent.
                    </p>
                  </div>
                </div>

                {acceptedDonors.length === 0 ? (
                  <div className="p-6 bg-slate-50 rounded-2xl text-center border border-slate-100">
                    <UserCheck className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                    <p className="text-xs font-bold text-slate-600">No donor acceptances recorded yet for this request.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {acceptedDonors.map((ad) => (
                      <div
                        key={ad.donorId}
                        className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-800 font-extrabold flex items-center justify-center text-sm shadow-2xs">
                            {ad.bloodGroup}
                          </div>
                          <div>
                            <strong className="text-base font-extrabold text-brand-navy block leading-tight">{ad.name}</strong>
                            <div className="flex items-center gap-3 text-slate-500 mt-1">
                              <span className="flex items-center gap-1 font-semibold text-slate-700">
                                <Phone className="w-3 h-3 text-emerald-600" />
                                {ad.phone}
                              </span>
                              <span className="flex items-center gap-1">
                                <Mail className="w-3 h-3 text-slate-400" />
                                {ad.email}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div>
                          {ad.isFulfilled ? (
                            <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                              ✓ {ad.unitsDonated} Unit Received ({new Date(ad.fulfillmentDate).toLocaleDateString()})
                            </span>
                          ) : (
                            <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-200">
                              Accepted (Pending Reception)
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>

              {/* SMART DONOR MATCHES (ACTIVE REQUESTS ONLY) */}
              {!isFulfilled && !isCancelled && (
                <Card variant="elevated" className="p-8 border border-slate-200">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-6 mb-6">
                    <div>
                      <h2 className="text-2xl font-extrabold text-brand-navy tracking-tight">
                        Smart Donor Matching
                      </h2>
                      <p className="text-xs text-brand-slate max-w-xl mt-1 leading-relaxed">
                        Compatible donor candidates ranked by blood-group compatibility, availability, eligibility, and proximity.
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={loadMatches}
                        disabled={isLoadingMatches}
                        icon={RefreshCw}
                        className={isLoadingMatches ? 'animate-spin' : ''}
                      >
                        Refresh Matches
                      </Button>
                    </div>
                  </div>

                  {isLoadingMatches ? (
                    <div className="py-12 text-center text-slate-500 text-xs flex flex-col items-center gap-2">
                      <RefreshCw className="w-6 h-6 text-brand-red animate-spin" />
                      <span>Finding compatible donor matches...</span>
                    </div>
                  ) : !matchData || matchData.matches?.length === 0 ? (
                    <div className="p-8 bg-slate-50 rounded-2xl text-center border border-slate-100">
                      <h3 className="text-base font-bold text-brand-navy mb-1">No Compatible Donors Available</h3>
                      <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                        No active donors currently match blood group <strong className="text-brand-navy">{request.bloodGroup}</strong> with active availability.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {matchData.matches.map((matchItem, idx) => (
                        <DonorMatchCard key={matchItem.donorId} match={matchItem} rank={idx + 1} />
                      ))}
                    </div>
                  )}
                </Card>
              )}

              {/* FULFILLED OR CANCELLED NOTICE CARD */}
              {(isFulfilled || isCancelled) && (
                <Card variant="default" className="p-8 border border-slate-200 bg-slate-50 text-center">
                  <div className="w-12 h-12 rounded-2xl bg-slate-200 text-slate-600 flex items-center justify-center mx-auto mb-3">
                    <Info className="w-6 h-6" />
                  </div>
                  <h3 className="text-base font-bold text-brand-navy mb-1">
                    {isCancelled ? 'Request Cancelled' : 'Request Fully Fulfilled & Closed'}
                  </h3>
                  <p className="text-xs text-slate-600 max-w-md mx-auto leading-relaxed">
                    {isCancelled
                      ? 'Donor matching and fulfillment actions are disabled because this request was cancelled.'
                      : 'Donor matching is no longer required because all required blood units have been received.'}
                  </p>
                </Card>
              )}
            </div>
          )}
        </Container>
      </main>

      <RecordFulfillmentModal
        isOpen={isFulfillmentModalOpen}
        onClose={() => setIsFulfillmentModalOpen(false)}
        request={request}
        acceptedDonors={acceptedDonors}
        onSuccess={handleConfirmFulfillment}
      />

      <Footer />
    </div>
  );
}
