import React from 'react';
import AvailabilityToggle from './AvailabilityToggle';
import NotificationBell from '../notifications/NotificationBell';
import { Button } from '../Button';
import { LogOut, HeartPulse, ShieldCheck, Menu } from 'lucide-react';

export default function DonorHeader({
  user,
  profile,
  onToggleAvailability,
  isUpdatingAvailability,
  onLogout,
  onToggleSidebar,
}) {
  const bloodGroup = user?.bloodGroup || profile?.bloodGroup || 'A+';
  const name = user?.name || 'Verified Donor';

  return (
    <header className="bg-white/80 backdrop-blur-md border border-slate-200/80 rounded-3xl p-4 shadow-xs mb-6 select-none relative z-[60]">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Left Side: Mobile Hamburger & Donor Identity */}
        <div className="flex items-center gap-3">
          {onToggleSidebar && (
            <button
              onClick={onToggleSidebar}
              className="p-2 rounded-2xl border border-slate-200 text-slate-600 hover:text-brand-red hover:bg-rose-50 transition-all lg:hidden"
              title="Toggle Menu"
            >
              <Menu className="w-5 h-5" />
            </button>
          )}

          {/* Blood Group Pill */}
          <div className="w-10 h-10 rounded-2xl bg-brand-red text-white font-black text-sm shadow-sm flex items-center justify-center gap-0.5 shrink-0">
            <HeartPulse className="w-4 h-4" />
            <span>{bloodGroup}</span>
          </div>

          <div>
            <h1 className="text-base sm:text-lg font-black text-brand-navy leading-tight flex items-center gap-1.5">
              <span>{name}</span>
            </h1>
            <span className="text-xs font-semibold text-slate-500 block">
              Verified Blood Donor
            </span>
          </div>
        </div>

        {/* Right Side: Availability Toggle, Notifications & Sign Out */}
        <div className="flex items-center gap-3 justify-between sm:justify-end">
          <AvailabilityToggle
            isAvailable={profile?.isAvailable ?? true}
            onToggle={onToggleAvailability}
            isUpdating={isUpdatingAvailability}
          />

          <NotificationBell />

          <Button
            variant="outline"
            size="sm"
            onClick={onLogout}
            icon={LogOut}
            className="text-slate-600 border-slate-200 hover:text-brand-red hover:border-brand-red rounded-2xl"
          >
            Sign Out
          </Button>
        </div>
      </div>
    </header>
  );
}
