import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, CircleDot, Radio, Clock, Menu } from 'lucide-react';

interface MobileBottomNavProps {
  onOpenMenu: () => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({ onOpenMenu }) => {
  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-md border-t border-slate-200 px-2 py-1.5 flex items-center justify-around shadow-lg">
      <NavLink
        to="/"
        className={({ isActive }) =>
          `flex flex-col items-center py-1 px-3 text-[10px] font-medium transition-colors ${
            isActive ? 'text-emerald-600 font-bold' : 'text-slate-500 hover:text-slate-900'
          }`
        }
      >
        <LayoutDashboard className="w-5 h-5 mb-0.5" />
        <span>Tổng quan</span>
      </NavLink>

      <NavLink
        to="/cattle"
        className={({ isActive }) =>
          `flex flex-col items-center py-1 px-3 text-[10px] font-medium transition-colors ${
            isActive ? 'text-emerald-600 font-bold' : 'text-slate-500 hover:text-slate-900'
          }`
        }
      >
        <CircleDot className="w-5 h-5 mb-0.5" />
        <span>Đàn bò</span>
      </NavLink>

      {/* Primary Center Action - RFID & Scale Simulator */}
      <NavLink
        to="/simulation"
        className={({ isActive }) =>
          `flex flex-col items-center -mt-5 p-2 rounded-full border-2 shadow-md transition-transform active:scale-95 ${
            isActive
              ? 'bg-emerald-600 text-white border-white ring-4 ring-emerald-500/20'
              : 'bg-emerald-500 text-white border-white'
          }`
        }
      >
        <Radio className="w-5 h-5 animate-pulse" />
        <span className="text-[9px] font-bold mt-0.5">Cân/RFID</span>
      </NavLink>

      <NavLink
        to="/feeds/schedule"
        className={({ isActive }) =>
          `flex flex-col items-center py-1 px-3 text-[10px] font-medium transition-colors ${
            isActive ? 'text-emerald-600 font-bold' : 'text-slate-500 hover:text-slate-900'
          }`
        }
      >
        <Clock className="w-5 h-5 mb-0.5" />
        <span>Cho ăn</span>
      </NavLink>

      <button
        onClick={onOpenMenu}
        className="flex flex-col items-center py-1 px-3 text-[10px] font-medium text-slate-500 hover:text-slate-900 transition-colors"
      >
        <Menu className="w-5 h-5 mb-0.5" />
        <span>Tất cả</span>
      </button>
    </nav>
  );
};
