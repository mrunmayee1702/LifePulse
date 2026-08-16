import React from 'react';
import { HeartPulse, Droplet, CheckCircle2, AlertTriangle } from 'lucide-react';
import FloatingStatCluster from '../common/FloatingStatCluster';

export default function HospitalOverviewStrip({ requests = [] }) {
  // Calculate stats strictly from real data
  const activeRequests = requests.filter((r) => r.status === 'OPEN' || r.status === 'PARTIALLY_FULFILLED').length;
  
  const urgentRequests = requests.filter(
    (r) => (r.urgency === 'CRITICAL' || r.urgency === 'URGENT') && 
           (r.status === 'OPEN' || r.status === 'PARTIALLY_FULFILLED')
  ).length;

  const totalUnitsNeeded = requests.reduce((sum, r) => {
    if (r.status === 'OPEN' || r.status === 'PARTIALLY_FULFILLED') {
      return sum + (Number(r.unitsRequired) || 0);
    }
    return sum;
  }, 0);
  
  const totalUnitsFulfilled = requests.reduce((sum, r) => sum + (Number(r.unitsFulfilled) || 0), 0);

  // We want the visual order (left to right) to be: Urgent, Active, Needed, Fulfilled.
  const cards = [
    {
      id: 'urgent_requests',
      label: 'URGENT REQUESTS',
      value: urgentRequests,
      subtext: 'Critical Need',
      icon: AlertTriangle,
      iconColor: 'text-amber-600',
      backplateBg: 'bg-amber-200',
      desktopClasses: 'lg:z-10 lg:-rotate-2 lg:-translate-y-2',
      isFocal: false,
    },
    {
      id: 'active_requests',
      label: 'ACTIVE REQUESTS',
      value: activeRequests,
      subtext: 'Action Required',
      icon: HeartPulse,
      iconColor: 'text-brand-red',
      backplateBg: 'bg-rose-200',
      desktopClasses: 'lg:z-30 lg:rotate-1 lg:scale-105', 
      isFocal: true,
    },
    {
      id: 'units_needed',
      label: 'UNITS NEEDED',
      value: totalUnitsNeeded,
      subtext: 'Total Requirement',
      icon: Droplet,
      iconColor: 'text-blue-600',
      backplateBg: 'bg-blue-200',
      desktopClasses: 'lg:z-20 lg:rotate-2 lg:-translate-y-1',
      isFocal: false,
    },
    {
      id: 'units_fulfilled',
      label: 'UNITS FULFILLED',
      value: totalUnitsFulfilled,
      subtext: 'Successfully received',
      icon: CheckCircle2,
      iconColor: 'text-emerald-600',
      backplateBg: 'bg-emerald-200',
      desktopClasses: 'lg:z-10 lg:-rotate-2 lg:translate-y-2',
      isFocal: false,
    },
  ];

  return <FloatingStatCluster cards={cards} />;
}
