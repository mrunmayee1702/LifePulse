import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { hospitalService } from '../../services/hospitalService';
import HospitalHeader from '../../components/hospital/HospitalHeader';
import HospitalSidebar from '../../components/hospital/HospitalSidebar';
import RecordFulfillmentModal from '../../components/hospital/RecordFulfillmentModal';
import SoftBlushWaveBackground from '../../components/donor/SoftBlushWaveBackground';
import Footer from '../../components/Footer';
import { Button } from '../../components/Button';
import SearchInput from '../../components/common/SearchInput';
import FilterSelect from '../../components/common/FilterSelect';
import SortDropdown from '../../components/common/SortDropdown';
import PaginationControls from '../../components/common/PaginationControls';
import EmptyState from '../../components/common/EmptyState';
import SkeletonRow from '../../components/common/SkeletonRow';
import {
  PlusCircle,
  RefreshCw,
  AlertCircle,
  FileText,
  Users,
  CheckCircle2,
  Clock,
  HeartPulse,
  Phone,
  Mail,
  MapPin,
  ShieldCheck,
  Eye,
  CheckSquare,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const BLOOD_GROUPS = [
  { label: 'All Blood Groups', value: 'ALL' },
  { label: 'A+', value: 'A+' },
  { label: 'A-', value: 'A-' },
  { label: 'B+', value: 'B+' },
  { label: 'B-', value: 'B-' },
  { label: 'AB+', value: 'AB+' },
  { label: 'AB-', value: 'AB-' },
  { label: 'O+', value: 'O+' },
  { label: 'O-', value: 'O-' },
];

const URGENCY_OPTIONS = [
  { label: 'All Urgencies', value: 'ALL' },
  { label: 'Critical', value: 'CRITICAL' },
  { label: 'Urgent', value: 'URGENT' },
  { label: 'High', value: 'HIGH' },
  { label: 'Normal', value: 'NORMAL' },
];

const SORT_OPTIONS = [
  { label: 'Newest First', value: 'createdAt' },
  { label: 'Required Date', value: 'requiredDate' },
  { label: 'Urgency', value: 'urgency' },
  { label: 'Units Needed', value: 'unitsRequired' },
];

export default function BloodRequestsListPage() {
  const { user, logout } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('REQUESTS'); // 'AVAILABLE_DONORS' | 'REQUESTS' | 'ACCEPTED_DONORS' | 'FULFILLMENT'

  const [profile, setProfile] = useState(null);
  const [requests, setRequests] = useState([]);
  const [acceptedDonors, setAcceptedDonors] = useState([]);
  const [availableDonors, setAvailableDonors] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });

  // Fulfillment Modal State
  const [fulfillmentModal, setFulfillmentModal] = useState({
    isOpen: false,
    request: null,
  });

  const [filters, setFilters] = useState({
    search: '',
    status: 'ACTIVE',
    urgency: 'ALL',
    bloodGroup: 'ALL',
    sortBy: 'createdAt',
    sortOrder: 'desc',
    page: 1,
    limit: 10,
  });

  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [actionSuccessMsg, setActionSuccessMsg] = useState('');

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setErrorMsg('');
    try {
      const [profileRes, requestsRes, acceptedRes, availableRes] = await Promise.all([
        hospitalService.getHospitalProfile().catch(() => null),
        hospitalService.getBloodRequests(filters).catch(() => ({ success: true, data: { requests: [] } })),
        hospitalService.getAcceptedDonors().catch(() => ({ success: true, data: { acceptedDonors: [] } })),
        hospitalService.getAvailableDonors().catch(() => ({ success: true, data: { donors: [] } })),
      ]);

      if (profileRes && profileRes.success) setProfile(profileRes.data.profile);
      if (requestsRes && requestsRes.success) {
        setRequests(requestsRes.data.requests || []);
        if (requestsRes.data.pagination) setPagination(requestsRes.data.pagination);
      }
      if (acceptedRes && acceptedRes.success) setAcceptedDonors(acceptedRes.data.acceptedDonors || []);
      if (availableRes && availableRes.success) setAvailableDonors(availableRes.data.donors || []);
    } catch (err) {
      console.error('[Load Operations Data Error]:', err);
      setErrorMsg(err.message || 'Failed to fetch hospital operations data.');
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value, page: 1 }));
  };

  const handleSortChange = (sortBy, sortOrder) => {
    setFilters((prev) => ({ ...prev, sortBy, sortOrder, page: 1 }));
  };

  const handlePageChange = (newPage) => {
    setFilters((prev) => ({ ...prev, page: newPage }));
  };

  const handleClearFilters = () => {
    setFilters({
      search: '',
      status: 'ACTIVE',
      urgency: 'ALL',
      bloodGroup: 'ALL',
      sortBy: 'createdAt',
      sortOrder: 'desc',
      page: 1,
      limit: 10,
    });
  };

  // Record Fulfillment Handler
  const handleConfirmFulfillment = async (requestId, fulfillmentPayload) => {
    setActionSuccessMsg('');
    const res = await hospitalService.recordFulfillment(requestId, fulfillmentPayload);
    if (res.success) {
      setActionSuccessMsg(`Blood fulfillment recorded! ${res.data.unitsFulfilled} unit(s) received (${res.data.status}).`);
      await loadData(); // Refresh all tables & status transition
    }
  };

  const openFulfillmentModalForRequest = (reqDoc) => {
    setFulfillmentModal({
      isOpen: true,
      request: reqDoc,
    });
  };

  return (
    <div className="min-h-screen text-brand-navy flex flex-col justify-between antialiased relative select-none overflow-x-hidden">
      <SoftBlushWaveBackground />

      <HospitalHeader
        user={user}
        profile={profile}
        onLogout={logout}
        onToggleSidebar={() => setIsSidebarOpen(true)}
        currentPath="/hospital/requests"
      />

      <div className="flex flex-1 p-4 sm:p-6 lg:p-8 gap-6 max-w-[1600px] mx-auto w-full relative z-10">
        {/* Left Sidebar */}
        <div className="hidden lg:block shrink-0">
          <HospitalSidebar
            activeRoute="/hospital/requests"
            requestCount={requests.length}
          />
        </div>

        {/* Mobile Sidebar Overlay */}
        <AnimatePresence>
          {isSidebarOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsSidebarOpen(false)}
                className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 lg:hidden"
              />
              <motion.div
                initial={{ x: -280 }}
                animate={{ x: 0 }}
                exit={{ x: -280 }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="fixed top-0 left-0 bottom-0 z-50 p-4 lg:hidden"
              >
                <HospitalSidebar
                  activeRoute="/hospital/requests"
                  requestCount={requests.length}
                  onCloseMobile={() => setIsSidebarOpen(false)}
                  className="h-full shadow-2xl"
                />
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Right Main Operational Workspace */}
        <div className="flex-1 space-y-6 overflow-hidden min-w-0">
          {/* Header Banner */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white/90 backdrop-blur-md p-6 rounded-3xl border border-slate-200/80 shadow-xs">
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-brand-navy tracking-tight mb-1">
                Hospital Blood Operations Workspace
              </h1>
              <p className="text-xs text-slate-500 font-medium">
                Manage live blood requests, track donor consent acceptances, and record blood fulfillment.
              </p>
            </div>

            <Button
              variant="primary"
              size="md"
              icon={PlusCircle}
              onClick={() => { window.location.href = '/hospital/requests/new'; }}
            >
              + Create Blood Request
            </Button>
          </div>

          {actionSuccessMsg && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center justify-between shadow-xs"
            >
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <span>{actionSuccessMsg}</span>
              </div>
              <button
                onClick={() => setActionSuccessMsg('')}
                className="text-xs text-emerald-600 hover:text-emerald-800 underline font-semibold"
              >
                Dismiss
              </button>
            </motion.div>
          )}

          {/* 4 MAIN OPERATIONAL TABS */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-white/80 backdrop-blur-md p-1.5 rounded-2xl border border-slate-200/80 shadow-2xs">
            <button
              onClick={() => setActiveTab('AVAILABLE_DONORS')}
              className={`py-3 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                activeTab === 'AVAILABLE_DONORS'
                  ? 'bg-brand-navy text-white shadow-xs'
                  : 'text-slate-600 hover:text-brand-navy hover:bg-slate-100'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>1. Available Donors</span>
              <span className="ml-1 px-2 py-0.5 rounded-full text-[10px] bg-slate-700/30 text-white font-mono">
                {availableDonors.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('REQUESTS')}
              className={`py-3 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                activeTab === 'REQUESTS'
                  ? 'bg-brand-navy text-white shadow-xs'
                  : 'text-slate-600 hover:text-brand-navy hover:bg-slate-100'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>2. Blood Requests</span>
              <span className="ml-1 px-2 py-0.5 rounded-full text-[10px] bg-slate-700/30 text-white font-mono">
                {requests.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('ACCEPTED_DONORS')}
              className={`py-3 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                activeTab === 'ACCEPTED_DONORS'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-brand-navy hover:bg-slate-100'
              }`}
            >
              <ShieldCheck className="w-4 h-4 text-emerald-200" />
              <span>3. Accepted Donors</span>
              <span className="ml-1 px-2 py-0.5 rounded-full text-[10px] bg-emerald-700/40 text-white font-mono">
                {acceptedDonors.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('FULFILLMENT')}
              className={`py-3 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                activeTab === 'FULFILLMENT'
                  ? 'bg-brand-red text-white shadow-xs'
                  : 'text-slate-600 hover:text-brand-navy hover:bg-slate-100'
              }`}
            >
              <CheckSquare className="w-4 h-4" />
              <span>4. Fulfillment Tracking</span>
            </button>
          </div>

          {/* REQUEST STATUS FILTERS (FOR BLOOD REQUESTS TAB) */}
          {activeTab === 'REQUESTS' && (
            <div className="flex items-center gap-2 border-b border-slate-200 overflow-x-auto pb-1">
              {[
                { label: 'Active Requests', value: 'ACTIVE' },
                { label: 'Open Only', value: 'OPEN' },
                { label: 'Partially Fulfilled', value: 'PARTIALLY_FULFILLED' },
                { label: 'Fulfilled / Completed', value: 'FULFILLED' },
                { label: 'Cancelled', value: 'CANCELLED' },
                { label: 'All Requests', value: 'ALL' },
              ].map((st) => (
                <button
                  key={st.value}
                  onClick={() => handleFilterChange('status', st.value)}
                  className={`py-2 px-4 text-xs font-bold rounded-t-2xl transition-all border-b-2 whitespace-nowrap ${
                    filters.status === st.value
                      ? 'border-brand-red text-brand-red bg-white/90 shadow-2xs'
                      : 'border-transparent text-slate-500 hover:text-brand-navy'
                  }`}
                >
                  {st.label}
                </button>
              ))}
            </div>
          )}

          {/* Search, Filter & Sort Toolbar */}
          <div className="bg-white/90 backdrop-blur-md rounded-3xl border border-slate-200/80 p-4 shadow-xs flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
            <SearchInput
              value={filters.search}
              onChange={(s) => handleFilterChange('search', s)}
              placeholder="Search by reference, donor, or reason..."
              className="w-full lg:w-72"
            />

            <div className="flex flex-wrap items-center gap-3">
              <FilterSelect
                label="Blood Group"
                value={filters.bloodGroup}
                onChange={(v) => handleFilterChange('bloodGroup', v)}
                options={BLOOD_GROUPS}
              />

              <FilterSelect
                label="Urgency"
                value={filters.urgency}
                onChange={(v) => handleFilterChange('urgency', v)}
                options={URGENCY_OPTIONS}
              />

              <SortDropdown
                sortBy={filters.sortBy}
                sortOrder={filters.sortOrder}
                options={SORT_OPTIONS}
                onSortChange={handleSortChange}
              />
            </div>
          </div>

          {isLoading ? (
            <SkeletonRow count={4} type="card" />
          ) : errorMsg ? (
            <div className="p-6 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs max-w-lg mx-auto text-center my-12">
              <AlertCircle className="w-8 h-8 mx-auto mb-2 text-rose-600" />
              <p className="font-bold mb-3">{errorMsg}</p>
              <Button variant="outline" size="sm" onClick={loadData} icon={RefreshCw}>
                Retry Loading
              </Button>
            </div>
          ) : (
            <>
              {/* TAB 1: AVAILABLE DONORS */}
              {activeTab === 'AVAILABLE_DONORS' && (
                <div className="bg-white/90 backdrop-blur-md rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                    <div>
                      <h3 className="text-base font-extrabold text-brand-navy">
                        Available Donors Network
                      </h3>
                      <p className="text-xs text-slate-500">
                        Compatible donors registered and available for emergency dispatch near your hospital location.
                      </p>
                    </div>
                    <span className="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
                      {availableDonors.length} Donors Active
                    </span>
                  </div>

                  {availableDonors.length === 0 ? (
                    <EmptyState
                      title="No available donors currently registered"
                      message="There are no active available donors matching your network area right now."
                      icon={Users}
                    />
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase text-[11px]">
                            <th className="py-3 px-3">Donor Name</th>
                            <th className="py-3 px-3">Blood Group</th>
                            <th className="py-3 px-3">Proximity</th>
                            <th className="py-3 px-3">Total Donations</th>
                            <th className="py-3 px-3">Availability</th>
                            <th className="py-3 px-3 text-right">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 font-medium">
                          {availableDonors.map((donor) => (
                            <tr key={donor.donorId} className="hover:bg-slate-50/80 transition-colors">
                              <td className="py-3 px-3 font-bold text-brand-navy">
                                {donor.name}
                              </td>
                              <td className="py-3 px-3">
                                <span className="px-2.5 py-1 rounded-lg bg-rose-50 text-brand-red font-mono font-extrabold text-xs border border-rose-100">
                                  {donor.bloodGroup}
                                </span>
                              </td>
                              <td className="py-3 px-3 text-slate-600">
                                <div className="flex items-center gap-1">
                                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                                  <span>{donor.approxDistanceKm} km away</span>
                                </div>
                              </td>
                              <td className="py-3 px-3 font-bold text-slate-700">
                                {donor.totalDonationsCount} donation(s)
                              </td>
                              <td className="py-3 px-3">
                                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                                  AVAILABLE
                                </span>
                              </td>
                              <td className="py-3 px-3 text-right">
                                <button
                                  onClick={() => { window.location.href = '/hospital/requests/new'; }}
                                  className="px-3 py-1.5 bg-brand-navy hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all"
                                >
                                  Request Donation
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: BLOOD REQUESTS */}
              {activeTab === 'REQUESTS' && (
                <div className="bg-white/90 backdrop-blur-md rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                    <div>
                      <h3 className="text-base font-extrabold text-brand-navy">
                        Hospital Created Blood Requests Directory
                      </h3>
                      <p className="text-xs text-slate-500">
                        Operational list of all requests issued by your hospital with real-time fulfillment state.
                      </p>
                    </div>
                  </div>

                  {requests.length === 0 ? (
                    <EmptyState
                      title="No blood requests found"
                      message="There are no blood requests matching your active filters or search criteria."
                      onClearFilters={handleClearFilters}
                      icon={FileText}
                    />
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase text-[11px]">
                            <th className="py-3 px-3">Patient Ref</th>
                            <th className="py-3 px-3">Blood Group</th>
                            <th className="py-3 px-3">Needed</th>
                            <th className="py-3 px-3">Accepted Donors</th>
                            <th className="py-3 px-3">Received</th>
                            <th className="py-3 px-3">Remaining</th>
                            <th className="py-3 px-3">Status</th>
                            <th className="py-3 px-3 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 font-medium">
                          {requests.map((reqDoc) => {
                            const isReqFulfilled = reqDoc.status === 'FULFILLED' || (reqDoc.unitsFulfilled >= reqDoc.unitsRequired);
                            const remaining = Math.max(reqDoc.unitsRequired - reqDoc.unitsFulfilled, 0);
                            return (
                              <tr key={reqDoc._id} className="hover:bg-slate-50/80 transition-colors">
                                <td className="py-3 px-3 font-mono font-bold text-brand-navy">
                                  {reqDoc.patientReference}
                                </td>
                                <td className="py-3 px-3">
                                  <span className="px-2.5 py-1 rounded-lg bg-rose-50 text-brand-red font-mono font-extrabold text-xs border border-rose-100">
                                    {reqDoc.bloodGroup}
                                  </span>
                                </td>
                                <td className="py-3 px-3 font-bold text-slate-800">
                                  {reqDoc.unitsRequired} units
                                </td>
                                <td className="py-3 px-3">
                                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-800 border border-blue-200">
                                    {reqDoc.acceptedDonorsCount || 0} accepted
                                  </span>
                                </td>
                                <td className="py-3 px-3 font-bold text-emerald-600">
                                  {reqDoc.unitsFulfilled} units
                                </td>
                                <td className="py-3 px-3 font-bold text-brand-red">
                                  {remaining} units
                                </td>
                                <td className="py-3 px-3">
                                  {isReqFulfilled ? (
                                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                                      ✓ FULFILLED
                                    </span>
                                  ) : reqDoc.status === 'PARTIALLY_FULFILLED' ? (
                                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-900 border border-amber-200">
                                      PARTIAL ({reqDoc.unitsFulfilled}/{reqDoc.unitsRequired})
                                    </span>
                                  ) : reqDoc.status === 'CANCELLED' ? (
                                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                                      CANCELLED
                                    </span>
                                  ) : (
                                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-100 text-blue-800 border border-blue-200">
                                      OPEN
                                    </span>
                                  )}
                                </td>
                                <td className="py-3 px-3 text-right space-x-2">
                                  <a
                                    href={`/hospital/requests/${reqDoc._id}`}
                                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-brand-navy rounded-xl text-xs font-bold inline-flex items-center gap-1 transition-all"
                                  >
                                    <Eye className="w-3.5 h-3.5" />
                                    <span>Details</span>
                                  </a>
                                  {!isReqFulfilled && reqDoc.status !== 'CANCELLED' && remaining > 0 && (
                                    <button
                                      onClick={() => openFulfillmentModalForRequest(reqDoc)}
                                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all"
                                    >
                                      Fulfill Blood
                                    </button>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}

                  <PaginationControls pagination={pagination} onPageChange={handlePageChange} />
                </div>
              )}

              {/* TAB 3: ACCEPTED DONORS */}
              {activeTab === 'ACCEPTED_DONORS' && (
                <div className="bg-white/90 backdrop-blur-md rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                    <div>
                      <h3 className="text-base font-extrabold text-brand-navy flex items-center gap-2">
                        <ShieldCheck className="w-5 h-5 text-emerald-600" />
                        <span>Accepted Donors Directory</span>
                      </h3>
                      <p className="text-xs text-slate-500">
                        Donors who explicitly granted contact consent to respond to your hospital's blood requests.
                      </p>
                    </div>
                    <span className="text-xs font-bold text-emerald-800 bg-emerald-100 px-3 py-1 rounded-full border border-emerald-200">
                      {acceptedDonors.length} Consents Granted
                    </span>
                  </div>

                  {acceptedDonors.length === 0 ? (
                    <EmptyState
                      title="No donor acceptances recorded yet"
                      message="When compatible donors accept your blood requests, their unlocked contact profiles will automatically appear here."
                      icon={Users}
                    />
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase text-[11px]">
                            <th className="py-3 px-3">Donor Name</th>
                            <th className="py-3 px-3">Donor Blood Group</th>
                            <th className="py-3 px-3">Patient Ref</th>
                            <th className="py-3 px-3">Accepted Date</th>
                            <th className="py-3 px-3">Unlocked Contact</th>
                            <th className="py-3 px-3">Fulfillment State</th>
                            <th className="py-3 px-3 text-right">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 font-medium">
                          {acceptedDonors.map((item) => (
                            <tr key={item.consentId} className="hover:bg-slate-50/80 transition-colors">
                              <td className="py-3 px-3 font-bold text-brand-navy">
                                {item.name}
                              </td>
                              <td className="py-3 px-3">
                                <span className="px-2.5 py-1 rounded-lg bg-rose-50 text-brand-red font-mono font-extrabold text-xs border border-rose-100">
                                  {item.bloodGroup}
                                </span>
                              </td>
                              <td className="py-3 px-3 font-mono font-bold text-slate-700">
                                {item.patientReference}
                              </td>
                              <td className="py-3 px-3 text-slate-600">
                                {item.consentGivenAt ? new Date(item.consentGivenAt).toLocaleDateString() : 'Recently'}
                              </td>
                              <td className="py-3 px-3">
                                <div className="space-y-0.5 text-[11px]">
                                  <div className="flex items-center gap-1 text-slate-800 font-bold">
                                    <Phone className="w-3 h-3 text-emerald-600" />
                                    <span>{item.phone}</span>
                                  </div>
                                  <div className="flex items-center gap-1 text-slate-500">
                                    <Mail className="w-3 h-3 text-slate-400" />
                                    <span>{item.email}</span>
                                  </div>
                                </div>
                              </td>
                              <td className="py-3 px-3">
                                {item.isFulfilled ? (
                                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                                    ✓ Blood Received ({item.unitsDonated} unit)
                                  </span>
                                ) : (
                                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-900 border border-amber-200">
                                    Pending Blood Reception
                                  </span>
                                )}
                              </td>
                              <td className="py-3 px-3 text-right">
                                {!item.isFulfilled ? (
                                  <button
                                    onClick={() => {
                                      const reqObj = requests.find((r) => r._id === item.requestId) || {
                                        _id: item.requestId,
                                        patientReference: item.patientReference,
                                        bloodGroup: item.requestBloodGroup,
                                        unitsRequired: item.unitsRequired,
                                        unitsFulfilled: item.unitsFulfilled,
                                      };
                                      openFulfillmentModalForRequest(reqObj);
                                    }}
                                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all"
                                  >
                                    Record Blood Received
                                  </button>
                                ) : (
                                  <span className="text-xs text-emerald-600 font-bold">
                                    ✓ Recorded
                                  </span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 4: FULFILLMENT TRACKING */}
              {activeTab === 'FULFILLMENT' && (
                <div className="bg-white/90 backdrop-blur-md rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-6">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                    <div>
                      <h3 className="text-base font-extrabold text-brand-navy flex items-center gap-2">
                        <CheckSquare className="w-5 h-5 text-brand-red" />
                        <span>Fulfillment Operations & Tracking</span>
                      </h3>
                      <p className="text-xs text-slate-500">
                        Request-by-request blood reception progress and donor contribution audit.
                      </p>
                    </div>
                  </div>

                  {requests.length === 0 ? (
                    <EmptyState
                      title="No request fulfillment records"
                      message="Create blood requests to begin tracking fulfillment progress."
                      icon={FileText}
                    />
                  ) : (
                    <div className="space-y-4">
                      {requests.map((reqDoc) => {
                        const isReqFulfilled = reqDoc.status === 'FULFILLED' || (reqDoc.unitsFulfilled >= reqDoc.unitsRequired);
                        const remaining = Math.max(reqDoc.unitsRequired - reqDoc.unitsFulfilled, 0);
                        const progressPct = Math.min(Math.round((reqDoc.unitsFulfilled / reqDoc.unitsRequired) * 100), 100);
                        const reqAcceptedDonors = acceptedDonors.filter((d) => d.requestId === reqDoc._id);

                        return (
                          <div
                            key={reqDoc._id}
                            className="p-5 rounded-2xl bg-slate-50/90 border border-slate-200/80 space-y-4"
                          >
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/60 pb-3">
                              <div>
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="text-xs font-mono font-bold text-brand-navy">
                                    REQUEST #{reqDoc.patientReference}
                                  </span>
                                  {isReqFulfilled ? (
                                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                                      🟢 FULLY FULFILLED
                                    </span>
                                  ) : reqDoc.status === 'PARTIALLY_FULFILLED' ? (
                                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-200">
                                      🟠 PARTIALLY FULFILLED
                                    </span>
                                  ) : (
                                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-200">
                                      🔵 OPEN
                                    </span>
                                  )}
                                </div>
                                <h4 className="text-base font-extrabold text-brand-navy">
                                  {reqDoc.bloodGroup} Blood Requirement ({reqDoc.unitsRequired} Units)
                                </h4>
                              </div>

                              {!isReqFulfilled && reqDoc.status !== 'CANCELLED' && remaining > 0 && (
                                <button
                                  onClick={() => openFulfillmentModalForRequest(reqDoc)}
                                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all self-start sm:self-center"
                                >
                                  + Record Blood Received
                                </button>
                              )}
                            </div>

                            {/* Progress Bar & Numerical Metrics */}
                            <div className="space-y-1.5">
                              <div className="flex items-center justify-between text-xs font-bold text-slate-600">
                                <span>Received: {reqDoc.unitsFulfilled} / {reqDoc.unitsRequired} units</span>
                                <span>Remaining: {remaining} unit(s)</span>
                              </div>
                              <div className="w-full h-3 bg-slate-200 rounded-full overflow-hidden">
                                <div
                                  className={`h-full transition-all duration-500 ${
                                    isReqFulfilled
                                      ? 'bg-emerald-500'
                                      : 'bg-amber-500'
                                  }`}
                                  style={{ width: `${progressPct}%` }}
                                />
                              </div>
                            </div>

                            {/* Accepted Donors List for this Request */}
                            <div className="bg-white p-3 rounded-xl border border-slate-200/80 text-xs">
                              <span className="block font-bold text-slate-400 uppercase text-[10px] mb-2">
                                Accepted Donors ({reqAcceptedDonors.length})
                              </span>
                              {reqAcceptedDonors.length === 0 ? (
                                <p className="text-slate-500 text-[11px]">No donors have accepted this request yet.</p>
                              ) : (
                                <div className="space-y-2">
                                  {reqAcceptedDonors.map((ad) => (
                                    <div
                                      key={ad.consentId}
                                      className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-100"
                                    >
                                      <div className="flex items-center gap-2">
                                        <div className="w-6 h-6 rounded-full bg-slate-200 text-slate-700 font-bold flex items-center justify-center text-[10px]">
                                          {ad.bloodGroup}
                                        </div>
                                        <div>
                                          <strong className="text-brand-navy block leading-tight">{ad.name}</strong>
                                          <span className="text-[10px] text-slate-400">{ad.phone}</span>
                                        </div>
                                      </div>

                                      {ad.isFulfilled ? (
                                        <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                                          ✓ {ad.unitsDonated} Unit Received ({new Date(ad.fulfillmentDate).toLocaleDateString()})
                                        </span>
                                      ) : (
                                        <span className="text-[11px] text-amber-700 font-semibold bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                                          Accepted (Pending Blood Reception)
                                        </span>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Record Fulfillment Modal */}
      <RecordFulfillmentModal
        isOpen={fulfillmentModal.isOpen}
        onClose={() => setFulfillmentModal({ isOpen: false, request: null })}
        request={fulfillmentModal.request}
        acceptedDonors={acceptedDonors.filter(
          (d) => d.requestId === fulfillmentModal.request?._id || d.requestId === fulfillmentModal.request?.id
        )}
        onSuccess={handleConfirmFulfillment}
      />

      <Footer />
    </div>
  );
}
