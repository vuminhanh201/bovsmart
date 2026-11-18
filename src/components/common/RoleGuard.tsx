import React from 'react';
import { useAuthStore } from '../../store/useAuthStore';
import { UserRole } from '../../types';
import { ShieldAlert, ArrowLeft, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface RoleGuardProps {
  allowedRoles: UserRole[];
  children: React.ReactNode;
}

export const RoleGuard: React.FC<RoleGuardProps> = ({ allowedRoles, children }) => {
  const { currentUser, switchRole } = useAuthStore();
  const navigate = useNavigate();

  const hasAccess = allowedRoles.includes(currentUser.role);

  if (hasAccess) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl border border-slate-200 shadow-sm p-6 text-center space-y-4">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center">
          <ShieldAlert className="w-8 h-8" />
        </div>

        <div>
          <h2 className="text-lg font-bold text-slate-900">Giới Hạn Quyền Truy Cập</h2>
          <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
            Vai trò hiện tại của bạn là <span className="font-bold text-slate-800">{currentUser.role}</span>. Chức năng này yêu cầu quyền{' '}
            <span className="font-bold text-emerald-700">{allowedRoles.join(' hoặc ')}</span> theo chính sách bảo mật trang trại.
          </p>
        </div>

        <div className="p-3 bg-slate-50 rounded-xl text-left border border-slate-100 text-xs space-y-1">
          <p className="font-semibold text-slate-700">Chi tiết phân quyền:</p>
          <ul className="list-disc list-inside text-slate-500 text-[11px] space-y-0.5">
            <li><strong>ADMIN</strong>: Toàn quyền cấu hình và quản trị tài khoản.</li>
            <li><strong>FARM_MANAGER</strong>: Toàn quyền điều hành trang trại & phê duyệt.</li>
            <li><strong>STAFF</strong>: Giới hạn tác nghiệp tại chuồng, cho ăn & ghi nhật ký.</li>
          </ul>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 pt-2">
          <button
            onClick={() => navigate('/')}
            className="flex-1 px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors flex items-center justify-center gap-1.5"
          >
            <ArrowLeft className="w-4 h-4" />
            Về Dashboard
          </button>
          <button
            onClick={() => switchRole(allowedRoles[0])}
            className="flex-1 px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-colors shadow-xs flex items-center justify-center gap-1.5"
          >
            <RefreshCw className="w-4 h-4" />
            Chuyển sang {allowedRoles[0]}
          </button>
        </div>
      </div>
    </div>
  );
};
