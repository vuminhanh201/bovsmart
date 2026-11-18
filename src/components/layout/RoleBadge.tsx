import React from 'react';
import { UserRole } from '../../types';
import { ShieldCheck, UserCheck, HardHat } from 'lucide-react';

interface RoleBadgeProps {
  role: UserRole;
  showDesc?: boolean;
}

export const RoleBadge: React.FC<RoleBadgeProps> = ({ role, showDesc = false }) => {
  const config = {
    ADMIN: {
      label: 'ADMIN (Quản trị viên)',
      short: 'ADMIN',
      icon: ShieldCheck,
      color: 'bg-indigo-50 text-indigo-700 border-indigo-200',
      tagColor: 'bg-indigo-600 text-white',
      desc: 'Toàn quyền quản trị tài khoản, phân quyền, cấu hình hệ thống và nhật ký.',
    },
    FARM_MANAGER: {
      label: 'FARM_MANAGER (Quản lý trang trại)',
      short: 'QUẢN LÝ TRANG TRẠI',
      icon: UserCheck,
      color: 'bg-emerald-50 text-emerald-800 border-emerald-200',
      tagColor: 'bg-emerald-600 text-white',
      desc: 'Điều hành đàn bò, chuồng trại, thức ăn, sức khỏe, xuất bán và phê duyệt nghiệp vụ.',
    },
    STAFF: {
      label: 'STAFF (Nhân viên kỹ thuật)',
      short: 'NHÂN VIÊN',
      icon: HardHat,
      color: 'bg-amber-50 text-amber-800 border-amber-200',
      tagColor: 'bg-amber-600 text-white',
      desc: 'Chăm sóc bò, cho ăn, vệ sinh chuồng, ghi nhật ký, quét RFID và cân trọng lượng.',
    },
  }[role];

  const Icon = config.icon;

  return (
    <div className="inline-flex items-center gap-1.5">
      <span
        className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-full border shadow-xs transition-all ${config.color}`}
        title={config.desc}
      >
        <Icon className="w-3.5 h-3.5" />
        <span>{config.short}</span>
      </span>
      {showDesc && <span className="text-xs text-slate-500 hidden sm:inline">({config.desc})</span>}
    </div>
  );
};
