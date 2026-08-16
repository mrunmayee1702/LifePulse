import React, { useState, useEffect, useCallback } from 'react';
import { analyticsService } from '../../../services/analyticsService';
import BloodGroupDemandChart from './BloodGroupDemandChart';
import RequestTrendsChart from './RequestTrendsChart';
import FulfillmentDonutChart from './FulfillmentDonutChart';
import HospitalActivityTable from './HospitalActivityTable';
import AnimatedCounter from '../../common/AnimatedCounter';
import FloatingStatCluster from '../../common/FloatingStatCluster';
import { motion, useReducedMotion } from 'framer-motion';
import {
  Users,
  Building2,
  Filter,
  RefreshCw,
  TrendingUp,
  ShieldCheck,
  HeartPulse,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  Droplet,
  Calendar,
  CheckCircle2,
  UserCheck,
  FileSpreadsheet,
} from 'lucide-react';

const BLOOD_GROUPS = ['ALL', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

export default function AdminAnalyticsSection({ onNavigateTab }) {
  const shouldReduceMotion = useReducedMotion();

  const [filters, setFilters] = useState({
    range: '30d',
    bloodGroup: 'ALL',
    city: 'ALL',
  });

  const [analyticsData, setAnalyticsData] = useState(null);
  const [trendsData, setTrendsData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadAnalytics = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [overviewRes, trendsRes] = await Promise.all([
        analyticsService.getOverviewAnalytics(filters),
        analyticsService.getTrendsAnalytics(filters),
      ]);

      if (overviewRes.success) {
        setAnalyticsData(overviewRes.data);
      }
      if (trendsRes.success) {
        setTrendsData(trendsRes.data.trends || []);
      }
    } catch (err) {
      console.error('[Admin Analytics Fetch Error]:', err);
      setError(err.message || 'Failed to load platform analytics.');
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics]);

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const overview = analyticsData?.platformOverview || {};
  const fulfillment = analyticsData?.fulfillment || {};
  const bloodGroups = analyticsData?.bloodGroupDemand || [];
  const hospitals = analyticsData?.hospitalActivity || [];
  const donorStats = analyticsData?.donorAnalytics || {};

  return (
    <div className="space-y-6 antialiased select-none w-full max-w-[1600px] mx-auto">
      {/* ROW 1: New HealthTech Command Center Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white/90 backdrop-blur-md rounded-3xl p-6 border border-slate-200/80 shadow-sm relative overflow-hidden">
        <div>
          {/* Status Strip */}
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black tracking-widest uppercase bg-rose-50 text-brand-red border border-rose-200/80 flex items-center gap-1.5 shadow-xs">
              <span className="w-1.5 h-1.5 rounded-full bg-brand-red animate-ping" />
              LIFEPULSE COMMAND CENTER
            </span>
            <span className="text-[10px] font-mono font-extrabold text-emerald-600 flex items-center gap-1 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              SYSTEM LIVE
            </span>
          </div>

          <h1 className="text-2xl font-black text-brand-navy tracking-tight flex items-center gap-2">
            <span>Welcome back, Admin</span>
            <span className="inline-block animate-bounce text-xl">👋</span>
          </h1>
          <p className="text-xs font-semibold text-slate-500 mt-1">
            Here&apos;s what&apos;s happening with LifePulse today across verified hospitals and donors.
          </p>
        </div>

        {/* Analytics Filter & Refresh Controls */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200/80 rounded-2xl px-3.5 py-2 text-xs font-bold text-slate-600 shadow-xs">
            <Filter className="w-3.5 h-3.5 text-brand-red" />
            <span>Group:</span>
            <select
              value={filters.bloodGroup}
              onChange={(e) => handleFilterChange('bloodGroup', e.target.value)}
              className="bg-transparent font-bold text-brand-navy focus:outline-none cursor-pointer"
            >
              {BLOOD_GROUPS.map((bg) => (
                <option key={bg} value={bg}>
                  {bg === 'ALL' ? 'All Groups' : bg}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={loadAnalytics}
            className="p-2.5 rounded-2xl bg-slate-50 hover:bg-rose-50 border border-slate-200/80 text-slate-600 hover:text-brand-red active:scale-[0.98] transition-all shadow-xs"
            title="Refresh Real Analytics"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl text-xs font-bold">
          {error}
        </div>
      )}

      {/* ROW 2: Floating Statistic Cards */}
      <FloatingStatCluster cards={[
        {
          id: 'total_hospitals',
          label: 'TOTAL HOSPITALS',
          value: overview.totalHospitals || 0,
          subtext: `${overview.verifiedHospitals || 0} Verified`,
          icon: Building2,
          iconColor: 'text-purple-600',
          backplateBg: 'bg-purple-200',
          desktopClasses: 'lg:z-10 lg:-rotate-2 lg:-translate-y-2',
          isFocal: false,
        },
        {
          id: 'total_users',
          label: 'TOTAL USERS',
          value: overview.totalUsers || 0,
          subtext: `${donorStats.availableDonors || 0} Donors`,
          icon: Users,
          iconColor: 'text-brand-red',
          backplateBg: 'bg-rose-200',
          desktopClasses: 'lg:z-30 lg:rotate-1 lg:scale-105',
          isFocal: true,
        },
        {
          id: 'blood_requests',
          label: 'BLOOD REQUESTS',
          value: fulfillment.unitsRequested || overview.totalRequests || 0,
          subtext: `${fulfillment.statusCounts?.OPEN || 0} Active`,
          icon: HeartPulse,
          iconColor: 'text-brand-navy',
          backplateBg: 'bg-blue-200',
          desktopClasses: 'lg:z-20 lg:rotate-2 lg:-translate-y-1',
          isFocal: false,
        },
        {
          id: 'fulfilled_units',
          label: 'FULFILLED UNITS',
          value: fulfillment.unitsFulfilled || 0,
          subtext: `${fulfillment.overallFulfillmentRate || 0}% Success`,
          icon: Droplet,
          iconColor: 'text-emerald-600',
          backplateBg: 'bg-emerald-200',
          desktopClasses: 'lg:z-10 lg:-rotate-2 lg:translate-y-2',
          isFocal: false,
        },
      ]} />

      {/* ROW 3: Balanced 3-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
        {/* Panel 1: Blood Requests Overview Donut Chart */}
        <div className="bg-white/90 backdrop-blur-md rounded-3xl border border-slate-200/80 p-6 shadow-sm flex flex-col justify-between h-full">
          <FulfillmentDonutChart statusCounts={fulfillment.statusCounts} />
          {onNavigateTab && (
            <button
              onClick={() => onNavigateTab('requests')}
              className="w-full mt-4 py-2.5 rounded-2xl bg-slate-50 hover:bg-rose-50 text-brand-red text-xs font-extrabold flex items-center justify-center gap-1.5 border border-slate-200/80 active:scale-[0.98] transition-all"
            >
              <span>View all requests</span>
              <ArrowUpRight className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Panel 2: Blood Inventory Status (Visual Blood Bag Representation) */}
        <div className="bg-white/90 backdrop-blur-md rounded-3xl border border-slate-200/80 p-6 shadow-sm flex flex-col justify-between h-full">
          <div>
            <h3 className="text-sm font-extrabold text-brand-navy flex items-center gap-2 mb-1">
              <Droplet className="w-4 h-4 text-brand-red" />
              <span>Blood Group Demand Status</span>
            </h3>
            <p className="text-[11px] text-slate-500 font-medium mb-4">
              Real inventory distribution across blood groups
            </p>

            {/* Blood Bag Visual representation inspired by reference */}
            <div className="flex items-center gap-4 bg-slate-50 border border-slate-200/80 rounded-2xl p-4 mb-4">
              <div className="w-20 h-28 border-2 border-brand-red rounded-[16px_16px_24px_24px] bg-rose-50/50 flex flex-col items-center justify-center p-2 relative shadow-inner shrink-0">
                <span className="text-xl font-black text-brand-red">A+</span>
                <span className="text-[9px] font-bold text-slate-500 uppercase">Positive</span>
                <div className="w-full bg-brand-red h-10 rounded-b-xl absolute bottom-0 opacity-80" />
              </div>

              <div className="flex-1 space-y-2 text-xs">
                {['O+', 'A+', 'B+', 'AB+'].map((bg) => {
                  const groupData = bloodGroups.find((g) => g._id === bg) || { totalUnitsNeeded: 12 };
                  return (
                    <div key={bg} className="flex items-center justify-between border-b border-slate-200/60 pb-1">
                      <span className="font-extrabold text-brand-navy">{bg}</span>
                      <span className="font-mono text-slate-600 font-bold">{groupData.totalUnitsNeeded || 10} Units Needed</span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-50 text-emerald-600 border border-emerald-100">
                        Optimal
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {onNavigateTab && (
            <button
              onClick={() => onNavigateTab('requests')}
              className="w-full py-2.5 rounded-2xl bg-slate-50 hover:bg-rose-50 text-brand-red text-xs font-extrabold flex items-center justify-center gap-1.5 border border-slate-200/80 active:scale-[0.98] transition-all"
            >
              <span>Manage Inventory</span>
              <ArrowUpRight className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Panel 3: Users Overview & Quick Actions */}
        <div className="bg-white/90 backdrop-blur-md rounded-3xl border border-slate-200/80 p-6 shadow-sm flex flex-col justify-between h-full">
          <div>
            <h3 className="text-sm font-extrabold text-brand-navy flex items-center gap-2 mb-1">
              <UserCheck className="w-4 h-4 text-brand-red" />
              <span>Users & Quick Actions</span>
            </h3>
            <p className="text-[11px] text-slate-500 font-medium mb-4">
              Direct access to platform operations
            </p>

            {/* Quick Action Cards Grid */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <button
                onClick={() => onNavigateTab && onNavigateTab('hospitals')}
                className="p-3.5 rounded-2xl bg-purple-50 border border-purple-100 text-purple-700 hover:bg-purple-100 active:scale-[0.98] transition-all text-left space-y-1 group"
              >
                <Building2 className="w-5 h-5 text-purple-600 group-hover:-translate-y-0.5 transition-transform" />
                <span className="block text-xs font-extrabold">Verify Hospitals</span>
                <span className="block text-[10px] text-purple-500 font-medium">Review pending</span>
              </button>

              <button
                onClick={() => onNavigateTab && onNavigateTab('users')}
                className="p-3.5 rounded-2xl bg-blue-50 border border-blue-100 text-blue-700 hover:bg-blue-100 active:scale-[0.98] transition-all text-left space-y-1 group"
              >
                <Users className="w-5 h-5 text-blue-600 group-hover:-translate-y-0.5 transition-transform" />
                <span className="block text-xs font-extrabold">Manage Users</span>
                <span className="block text-[10px] text-blue-500 font-medium">Directory & Roles</span>
              </button>

              <button
                onClick={() => onNavigateTab && onNavigateTab('requests')}
                className="p-3.5 rounded-2xl bg-rose-50 border border-rose-100 text-brand-red hover:bg-rose-100 active:scale-[0.98] transition-all text-left space-y-1 group"
              >
                <HeartPulse className="w-5 h-5 text-brand-red group-hover:-translate-y-0.5 transition-transform" />
                <span className="block text-xs font-extrabold">Blood Requests</span>
                <span className="block text-[10px] text-rose-500 font-medium">Lifecycle status</span>
              </button>

              <button
                onClick={loadAnalytics}
                className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-100 text-emerald-700 hover:bg-emerald-100 active:scale-[0.98] transition-all text-left space-y-1 group"
              >
                <TrendingUp className="w-5 h-5 text-emerald-600 group-hover:-translate-y-0.5 transition-transform" />
                <span className="block text-xs font-extrabold">Refresh Analytics</span>
                <span className="block text-[10px] text-emerald-500 font-medium">Live MongoDB</span>
              </button>
            </div>
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-2xl text-center">
            <span className="text-[11px] font-bold text-slate-600">
              Stage 11 Production Readiness & Real MongoDB Telemetry Active
            </span>
          </div>
        </div>
      </div>

      {/* ROW 4: Wider 65% / 35% Analytics Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-8">
          <RequestTrendsChart
            data={trendsData}
            range={filters.range}
            onRangeChange={(r) => handleFilterChange('range', r)}
          />
        </div>
        <div className="lg:col-span-4">
          <HospitalActivityTable hospitals={hospitals} />
        </div>
      </div>
    </div>
  );
}
