import React, { useState } from 'react';
import { User, UserRole } from '../types';
import { LogOut, Bell, User as UserIcon, Shield, Truck, Sparkles, ChevronDown } from 'lucide-react';

interface HeaderProps {
  currentUser: User | null;
  onLogout: () => void;
  onOpenHelp: () => void;
  onSwitchRole?: (role: UserRole) => void;
  unreadCount?: number;
  isSaralMode?: boolean;
  onToggleSaral?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentUser,
  onLogout,
  onOpenHelp,
  onSwitchRole,
  unreadCount: initialUnreadCount = 3,
  isSaralMode = false,
  onToggleSaral,
}) => {
  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(initialUnreadCount);
  const [notifications, setNotifications] = useState([
    {
      id: 'notif-1',
      title: 'Bin NN-BIN-1401 now critical',
      detail: 'Fill level reached 92% at Community Center Market. Compactor alert dispatched.',
      time: '5 min ago',
      urgent: true,
    },
    {
      id: 'notif-2',
      title: 'You were outbid on Lot 2026-081',
      detail: 'Vikas Polymers placed a higher bid of ₹37,000/Ton on Baled PET Bottles.',
      time: '18 min ago',
      urgent: false,
    },
    {
      id: 'notif-3',
      title: 'Tipper Van #DL-04-AB En Route',
      detail: 'Collection vehicle arriving in your residential sector lane in ~12 minutes.',
      time: '24 min ago',
      urgent: false,
    },
  ]);

  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case 'citizen':
        return { label: 'Citizen Portal', icon: 'person', bg: 'bg-[#f2f4f6]', text: 'text-[#154212]' };
      case 'simple_citizen':
        return { label: 'Saral Mode', icon: 'elderly', bg: 'bg-[#ffdad6]', text: 'text-[#93000a]' };
      case 'staff':
        return { label: 'Nagar Nigam Staff', icon: 'badge', bg: 'bg-[#d5e3fd]', text: 'text-[#0d1c2f]' };
      case 'worker':
        return { label: 'Crew Driver / Collector', icon: 'local_shipping', bg: 'bg-[#bcf0ae]', text: 'text-[#154212]' };
      case 'recycler':
        return { label: 'Recycling Partner', icon: 'local_shipping', bg: 'bg-[#ffd9e4]', text: 'text-[#60233e]' };
    }
  };

  const badge = currentUser ? getRoleBadge(currentUser.role) : null;

  return (
    <header className="w-full top-0 sticky bg-[#f7f9fb] border-b border-[#c2c9bb] flex justify-between items-center px-4 md:px-12 py-3 z-40">
      {/* Brand */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => setShowRoleMenu(!showRoleMenu)}>
          <span className="material-symbols-outlined text-[#154212] text-3xl font-bold">recycling</span>
          <div>
            <span className="font-bold text-xl md:text-2xl text-[#154212] tracking-tight">SwachhConnect</span>
            <span className="hidden sm:inline-block ml-2 text-[11px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-[#e0e3e5] text-[#42493e] font-semibold">
              Civic Utility OS
            </span>
          </div>
        </div>

        {/* Current Active Role Pill & Switcher */}
        {currentUser && (
          <div className="relative">
            <button
              onClick={() => setShowRoleMenu(!showRoleMenu)}
              className={`hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-semibold border border-[#c2c9bb] ${badge?.bg} ${badge?.text} hover:opacity-90 transition-opacity`}
              title="Switch role for testing"
            >
              <span className="material-symbols-outlined text-[16px]">{badge?.icon}</span>
              <span>{badge?.label}</span>
              <ChevronDown className="w-3.5 h-3.5 opacity-70" />
            </button>

            {/* Quick Role Switch Dropdown */}
            {showRoleMenu && (
              <div className="absolute left-0 mt-2 w-56 bg-white border border-[#c2c9bb] rounded-md shadow-lg py-1 z-50 animate-in fade-in zoom-in-95">
                <div className="px-3 py-1.5 text-[11px] font-semibold text-[#515f74] border-b border-[#eceef0] uppercase tracking-wider">
                  Switch Active Persona (Demo)
                </div>
                <button
                  onClick={() => {
                    onSwitchRole?.('citizen');
                    setShowRoleMenu(false);
                  }}
                  className={`w-full px-3 py-2 text-left text-xs flex items-center gap-2 hover:bg-[#f2f4f6] ${
                    currentUser.role === 'citizen' || currentUser.role === 'simple_citizen' ? 'font-bold text-[#154212] bg-[#f7f9fb]' : 'text-[#191c1e]'
                  }`}
                >
                  <span className="material-symbols-outlined text-[18px] text-[#154212]">person</span>
                  <div>
                    <div>Citizen Dashboard</div>
                    <div className="text-[10px] text-[#515f74] font-normal">Report, Track Bins & Green Credits</div>
                  </div>
                </button>
                <button
                  onClick={() => {
                    onSwitchRole?.('staff');
                    setShowRoleMenu(false);
                  }}
                  className={`w-full px-3 py-2 text-left text-xs flex items-center gap-2 hover:bg-[#f2f4f6] ${
                    currentUser.role === 'staff' ? 'font-bold text-[#154212] bg-[#f7f9fb]' : 'text-[#191c1e]'
                  }`}
                >
                  <span className="material-symbols-outlined text-[18px] text-[#515f74]">badge</span>
                  <div>
                    <div>Nagar Nigam Operations Hub</div>
                    <div className="text-[10px] text-[#515f74] font-normal">Fleet telemetry, IoT bins, Grievance SLA</div>
                  </div>
                </button>
                <button
                  onClick={() => {
                    onSwitchRole?.('worker');
                    setShowRoleMenu(false);
                  }}
                  className={`w-full px-3 py-2 text-left text-xs flex items-center gap-2 hover:bg-[#f2f4f6] ${
                    currentUser.role === 'worker' ? 'font-bold text-[#154212] bg-[#f7f9fb]' : 'text-[#191c1e]'
                  }`}
                >
                  <span className="material-symbols-outlined text-[18px] text-[#154212]">local_shipping</span>
                  <div>
                    <div>Sanitation Worker & Driver Portal</div>
                    <div className="text-[10px] text-[#515f74] font-normal">Truck navigation, task lists & incidents</div>
                  </div>
                </button>
                <button
                  onClick={() => {
                    onSwitchRole?.('recycler');
                    setShowRoleMenu(false);
                  }}
                  className={`w-full px-3 py-2 text-left text-xs flex items-center gap-2 hover:bg-[#f2f4f6] ${
                    currentUser.role === 'recycler' ? 'font-bold text-[#154212] bg-[#f7f9fb]' : 'text-[#191c1e]'
                  }`}
                >
                  <span className="material-symbols-outlined text-[18px] text-[#60233e]">local_shipping</span>
                  <div>
                    <div>Recycling Partner Exchange</div>
                    <div className="text-[10px] text-[#515f74] font-normal">Bulk scrap auctions & e-manifests</div>
                  </div>
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-3 sm:gap-4">
        {/* Notification Bell */}
        {currentUser && (
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="p-1.5 rounded-full text-[#515f74] hover:text-[#154212] hover:bg-[#eceef0] transition-colors relative"
              aria-label="Notifications"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-0 right-0 w-4 h-4 bg-[#ba1a1a] text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Notification Dropdown */}
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-72 sm:w-80 bg-white border border-[#c2c9bb] rounded-md shadow-lg py-2 z-50 animate-in fade-in zoom-in-95">
                <div className="px-3 py-1.5 border-b border-[#eceef0] flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-[#191c1e]">Civic Alerts</span>
                    {unreadCount > 0 && (
                      <span className="text-[10px] bg-[#ba1a1a] text-white px-1.5 py-0.2 rounded-full font-semibold">
                        {unreadCount} new
                      </span>
                    )}
                  </div>
                  {unreadCount > 0 && (
                    <button
                      onClick={() => setUnreadCount(0)}
                      className="text-[10px] text-[#154212] hover:underline font-semibold cursor-pointer"
                    >
                      Mark all read
                    </button>
                  )}
                </div>
                <div className="divide-y divide-[#eceef0] max-h-72 overflow-y-auto">
                  {notifications.map((n) => (
                    <div key={n.id} className="p-3 text-xs hover:bg-[#f7f9fb] transition-colors">
                      <div className="flex items-start justify-between gap-2">
                        <div className={`font-semibold flex items-center gap-1.5 ${n.urgent ? 'text-[#ba1a1a]' : 'text-[#154212]'}`}>
                          <span className={`w-2 h-2 rounded-full shrink-0 ${n.urgent ? 'bg-[#ba1a1a] animate-ping' : 'bg-[#154212]'}`} />
                          <span>{n.title}</span>
                        </div>
                        <span className="text-[10px] text-[#72796e] shrink-0">{n.time}</span>
                      </div>
                      <p className="text-[11px] text-[#42493e] mt-1 pl-3.5 leading-snug">{n.detail}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Saral Mode Toggle (Only visible for logged-in citizens, excluded on Staff Portal and Login Screen) */}
        {currentUser && currentUser.role !== 'staff' && (
          <button
            onClick={onToggleSaral}
            className={`font-semibold text-xs md:text-sm px-2.5 py-1.5 rounded transition-all flex items-center gap-1.5 cursor-pointer border ${
              isSaralMode
                ? 'bg-[#154212] text-white border-[#154212] shadow-xs'
                : 'text-[#515f74] border-[#c2c9bb] hover:text-[#154212] hover:bg-[#eceef0]'
            }`}
            title={isSaralMode ? 'Saral Mode is active' : 'Switch to Saral Mode (सरल उपयोग)'}
          >
            <span className="material-symbols-outlined text-[18px]">accessibility</span>
            <span>Saral Mode</span>
            {isSaralMode ? (
              <span className="text-[9px] bg-white text-[#154212] px-1 py-0.2 rounded font-bold uppercase">
                ON
              </span>
            ) : (
              <span className="text-[10px] text-[#72796e] hidden sm:inline">(सरल)</span>
            )}
          </button>
        )}

        {/* Help Link */}
        <button
          onClick={onOpenHelp}
          className="font-semibold text-xs md:text-sm text-[#515f74] hover:text-[#154212] transition-colors flex items-center gap-1"
        >
          <span className="material-symbols-outlined text-[18px]">help_outline</span>
          <span>Help</span>
        </button>

        {/* User Profile & Logout */}
        {currentUser ? (
          <div className="flex items-center gap-2 pl-2 border-l border-[#c2c9bb]">
            <div className="text-right hidden sm:block">
              <div className="text-xs font-bold text-[#191c1e]">
                {currentUser.firstName} {currentUser.lastName}
              </div>
              <div className="text-[10px] text-[#515f74]">
                {currentUser.role === 'citizen'
                  ? `${currentUser.greenPoints || 0} Green Pts`
                  : currentUser.role === 'simple_citizen'
                  ? 'Saral User'
                  : currentUser.role === 'staff'
                  ? 'Ward 14 Officer'
                  : 'CPCB Partner'}
              </div>
            </div>
            <button
              onClick={onLogout}
              className="p-1.5 rounded text-[#515f74] hover:text-[#ba1a1a] hover:bg-[#ffdad6]/40 transition-colors"
              title="Sign Out"
              aria-label="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="text-xs font-medium text-[#515f74]">Civic Portal</div>
        )}
      </div>
    </header>
  );
};
