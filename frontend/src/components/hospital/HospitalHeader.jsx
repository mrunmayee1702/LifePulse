import React, { useState } from 'react';
import LifePulseLogo from '../../assets/logo/LifePulseLogo';
import NotificationBell from '../notifications/NotificationBell';
import { Button } from '../Button';
import { Badge } from '../Badge';
import { Hospital, PlusCircle, LogOut, ShieldCheck, Menu, X } from 'lucide-react';

export default function HospitalHeader({
  user,
  profile,
  onLogout,
  onToggleSidebar,
  currentPath = '/hospital/dashboard',
}) {
  const status = profile?.verificationStatus || (profile?.isVerified ? 'VERIFIED' : 'PENDING');
  const hospitalName = profile?.hospitalName || user?.hospitalName || 'LifePulse City Hospital';

  const getBadgeVariant = (st) => {
    if (st === 'VERIFIED') return 'success';
    if (st === 'REJECTED') return 'danger';
    return 'warning';
  };

  const getBadgeText = (st) => {
    if (st === 'VERIFIED') return 'VERIFIED HOSPITAL';
    if (st === 'REJECTED') return 'VERIFICATION REJECTED';
    return 'VERIFICATION PENDING';
  };

  return (
    <header className="bg-white/90 backdrop-blur-md border-b border-slate-200/80 sticky top-0 z-[60] shadow-xs select-none">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between gap-4">
        {/* Left Side: Logo & Hospital Identity */}
        <div className="flex items-center gap-4">
          {onToggleSidebar && (
            <button
              onClick={onToggleSidebar}
              className="p-2 rounded-2xl border border-slate-200 text-slate-600 hover:text-brand-red hover:bg-rose-50 transition-all lg:hidden"
              title="Toggle Navigation Menu"
            >
              <Menu className="w-5 h-5" />
            </button>
          )}

          <a href="/" className="focus:outline-none shrink-0">
            <LifePulseLogo size="md" />
          </a>

          <div className="h-7 w-px bg-slate-200 hidden md:block" />

          {/* Hospital Identity Badge */}
          <div className="hidden md:flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-brand-navy text-white flex items-center justify-center font-bold text-xs shadow-xs shrink-0">
              <Hospital className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm font-extrabold text-brand-navy leading-tight">
                  {hospitalName}
                </h1>
                <Badge variant={getBadgeVariant(status)} className="text-[10px] font-bold py-0.5 uppercase">
                  {getBadgeText(status)}
                </Badge>
              </div>
              <span className="text-xs text-slate-500 font-medium block">
                Healthcare Institution Portal
              </span>
            </div>
          </div>
        </div>

        {/* Right Side: Notification Bell & Quick Actions */}
        <div className="flex items-center gap-3">
          <NotificationBell />

          <Button
            variant="primary"
            size="sm"
            disabled={profile && !profile.isVerified}
            onClick={() => { window.location.href = '/hospital/requests/new'; }}
            className="hidden sm:inline-flex bg-brand-red hover:bg-brand-crimson text-white font-bold rounded-2xl px-4 py-2 text-xs shadow-sm"
          >
            + New Blood Request
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={onLogout}
            icon={LogOut}
            className="text-slate-600 border-slate-200 hover:text-brand-red hover:border-brand-red rounded-2xl text-xs font-semibold"
          >
            Sign Out
          </Button>
        </div>
      </div>
    </header>
  );
}
