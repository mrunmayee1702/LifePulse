import React from 'react';
import NotificationBell from '../notifications/NotificationBell';
import { Button } from '../Button';
import { ShieldCheck, LogOut, Menu, Search, Calendar, UserCheck } from 'lucide-react';

export default function AdminHeader({ user, onLogout, onToggleSidebar, searchPlaceholder = 'Search anything...' }) {
  // Format current date e.g. "May 20, 2026"
  const formattedDate = new Date().toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <header className="bg-white border-b border-slate-200/80 sticky top-0 z-[60] shadow-sm select-none">
      <div className="px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Left Side: Sidebar Toggle & Quick Search */}
        <div className="flex items-center gap-3 flex-1 max-w-md">
          {onToggleSidebar && (
            <button
              onClick={onToggleSidebar}
              className="p-2 rounded-xl text-slate-500 hover:text-brand-navy hover:bg-slate-100 transition-colors"
              title="Toggle Navigation Menu"
            >
              <Menu className="w-5 h-5" />
            </button>
          )}

          {/* Top Search Input */}
          <div className="relative w-full hidden sm:block">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder={searchPlaceholder}
              readOnly
              className="w-full bg-slate-50 border border-slate-200/80 rounded-2xl pl-10 pr-4 py-2 text-xs font-medium text-brand-navy placeholder:text-slate-400 focus:outline-none focus-red-glow"
            />
          </div>
        </div>

        {/* Right Side: Date Badge, Notification Bell & Admin Identity */}
        <div className="flex items-center gap-3">
          {/* Current Date Badge */}
          <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-200/80 rounded-xl text-xs font-bold text-slate-600">
            <Calendar className="w-3.5 h-3.5 text-brand-red" />
            <span>{formattedDate}</span>
          </div>

          <NotificationBell />

          {/* Admin User Profile Pill */}
          <div className="flex items-center gap-2.5 px-3 py-1.5 bg-slate-50 border border-slate-200/80 rounded-2xl">
            <div className="w-7 h-7 rounded-xl bg-brand-red text-white flex items-center justify-center font-bold text-xs shadow-sm">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div className="text-left text-xs hidden md:block">
              <span className="block font-black text-brand-navy leading-tight">
                {user?.name || 'Admin'}
              </span>
              <span className="block text-[10px] text-slate-500 font-bold">
                Super Administrator
              </span>
            </div>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={onLogout}
            icon={LogOut}
            className="text-slate-600 hover:text-brand-red border-slate-200"
          >
            Sign Out
          </Button>
        </div>
      </div>
    </header>
  );
}
