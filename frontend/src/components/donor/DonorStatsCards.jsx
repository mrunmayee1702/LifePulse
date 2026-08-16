import React from 'react';
import { HeartPulse, Award, ShieldCheck, MapPin } from 'lucide-react';
import FloatingStatCluster from '../common/FloatingStatCluster';

export default function DonorStatsCards({ profile, historyCount = 0 }) {
  const totalDonations = profile?.totalDonationsCount !== undefined ? profile.totalDonationsCount : (historyCount || 1);
  const livesSaved = profile?.livesSavedCount || totalDonations * 3;
  const eligibility = profile?.eligibilityStatus || 'ELIGIBLE';
  const radius = profile?.preferredRadiusKm || 25;

  const cards = [
    {
      id: 'match_radius',
      label: 'MATCH RADIUS',
      value: radius,
      subtext: 'Coverage Area',
      icon: MapPin,
      iconColor: 'text-purple-600',
      backplateBg: 'bg-purple-200',
      desktopClasses: 'lg:z-10 lg:-rotate-2 lg:-translate-y-2',
      isFocal: false,
    },
    {
      id: 'total_donations',
      label: 'TOTAL DONATIONS',
      value: totalDonations,
      subtext: 'Units Contributed',
      icon: HeartPulse,
      iconColor: 'text-brand-red',
      backplateBg: 'bg-rose-200',
      desktopClasses: 'lg:z-30 lg:rotate-1 lg:scale-105',
      isFocal: true,
    },
    {
      id: 'lives_saved',
      label: 'LIVES SAVED',
      value: livesSaved,
      prefix: '~',
      subtext: 'Patients Helped',
      icon: Award,
      iconColor: 'text-blue-600',
      backplateBg: 'bg-blue-200',
      desktopClasses: 'lg:z-20 lg:rotate-2 lg:-translate-y-1',
      isFocal: false,
    },
    {
      id: 'eligibility',
      label: 'STATUS',
      // For string values or specific custom display, since AnimatedCounter expects a number,
      // we'll pass the string to a prop if we need to, but AnimatedCounter only works with numbers.
      // Wait, eligibility is a string. The FloatingStatCluster expects `value` to be a number.
      // I'll update FloatingStatCluster to allow value to be a string or React Node.
      value: eligibility === 'ELIGIBLE' ? 'READY' : 'DEFERRED',
      subtext: 'Medical Clearance',
      icon: ShieldCheck,
      iconColor: 'text-emerald-600',
      backplateBg: 'bg-emerald-200',
      desktopClasses: 'lg:z-10 lg:-rotate-2 lg:translate-y-2',
      isFocal: false,
    },
  ];

  return <FloatingStatCluster cards={cards} />;
}
