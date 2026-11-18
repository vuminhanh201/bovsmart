import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';
import { useFarmStore } from '../../store/useFarmStore';
import {
  Menu,
  Bell,
  Scale,
  Radio,
  ChevronDown,
  User as UserIcon,
  LogOut,
  Thermometer,
  Droplets,
  ExternalLink,
} from 'lucide-react';

interface HeaderProps {
  onToggleSidebar: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onToggleSidebar }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser, logout, token } = useAuthStore();
  const { cattle, salesOrders, activeScaleWeight, scannedRfidTag } = useFarmStore();

  const [avatarUrl, setAvatarUrl] = useState('');

  useEffect(() => {
    let cancelled = false;

    const loadAvatar = async () => {
      const avatar = currentUser?.avatar;

      if (!avatar) {
        setAvatarUrl('');
        return;
      }

      // Nếu avatar đã là URL thì sử dụng trực tiếp.
      if (/^https?:\/\//i.test(avatar)) {
        setAvatarUrl(avatar);
        return;
      }

      // Lấy ID từ chuỗi minio:<fileId>.
      const fileId = avatar.startsWith('minio:')
        ? avatar.slice(6)
        : avatar;

      if (!fileId || !token) {
        setAvatarUrl('');
        return;
      }

      try {
        const response = await fetch(
          `/api/files/${encodeURIComponent(fileId)}/url`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const result = await response.json();

        if (!response.ok || !result?.data?.url) {
          throw new Error('Không lấy được đường dẫn ảnh đại diện');
        }

        if (!cancelled) {
          setAvatarUrl(result.data.url);
        }
      } catch (error) {
        console.error('Lỗi tải ảnh đại diện:', error);

        if (!cancelled) {
          setAvatarUrl('');
        }
      }
    };

    loadAvatar();

    return () => {
      cancelled = true;
    };
  }, [currentUser?.avatar, token]);

  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [notifDropdownOpen, setNotifDropdownOpen] = useState(false);

  // Dynamic alerts
  const readyForSaleCount = cattle.filter((c) => c.status === 'READY_FOR_SALE').length;
  const pendingOrdersCount = salesOrders.filter((o) => o.status === 'PENDING_APPROVAL').length;
  const quarantineCount = cattle.filter((c) => c.status === 'QUARANTINE' || c.status === 'TREATMENT').length;

  const totalAlerts = readyForSaleCount + pendingOrdersCount + quarantineCount;

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-4 lg:px-6 py-2.5 transition-all">
      <div className="flex items-center justify-between gap-3">
        {/* Left: Mobile Toggle & Breadcrumb / Search */}
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleSidebar}
            className="lg:hidden p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
            aria-label="Mở Menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="hidden sm:flex items-center gap-2">
            <span className="text-xs font-semibold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200/60 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              BovSmart IoT Hub
            </span>
            <div className="hidden md:flex items-center gap-3 text-xs text-slate-500 pl-2">
              <span className="flex items-center gap-1">
                <Thermometer className="w-3.5 h-3.5 text-amber-500" />
                27.8°C Chuồng A1
              </span>
              <span className="flex items-center gap-1">
                <Droplets className="w-3.5 h-3.5 text-sky-500" />
                71% Ẩm độ
              </span>
            </div>
          </div>
        </div>

        {/* Center/Right: RFID & Scale shortcut, Role switcher, Notifications, User */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Quick simulator widget / shortcut */}
          <button
            onClick={() => navigate('/simulation')}
            className={`flex items-center gap-2 px-2.5 py-1.5 rounded-xl border text-xs font-medium transition-all ${
              location.pathname === '/simulation'
                ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                : 'bg-emerald-50/70 border-emerald-200/80 text-emerald-800 hover:bg-emerald-100/70'
            }`}
            title="Mở bảng điều khiển Mô phỏng RFID & Cân điện tử"
          >
            <div className="flex items-center gap-1">
              <Radio className="w-3.5 h-3.5 animate-pulse text-emerald-600" />
              <Scale className="w-3.5 h-3.5" />
            </div>
            <span className="hidden md:inline font-semibold">Cân & RFID:</span>
            <span className="font-mono font-bold text-slate-900 bg-white/80 px-1.5 py-0.5 rounded shadow-2xs">
              {activeScaleWeight > 0 ? `${activeScaleWeight.toFixed(1)} kg` : 'Sẵn sàng'}
            </span>
          </button>

          {/* Notifications */}
          <div className="relative">
            <button
              onClick={() => setNotifDropdownOpen(!notifDropdownOpen)}
              className="relative p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
              aria-label="Thông báo trang trại"
            >
              <Bell className="w-5 h-5" />
              {totalAlerts > 0 && (
                <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {totalAlerts}
                </span>
              )}
            </button>

            {notifDropdownOpen && (
<div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in">
                <div className="px-4 py-2 border-b border-slate-100 flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900 uppercase">Thông Báo Vận Hành</span>
                  <span className="text-[11px] bg-rose-50 text-rose-600 px-2 py-0.5 rounded-full font-semibold">
                    {totalAlerts} cần chú ý
                  </span>
                </div>
                <div className="max-h-64 overflow-y-auto divide-y divide-slate-100 text-xs">
                  {readyForSaleCount > 0 && (
                    <div
                      onClick={() => {
                        navigate('/sales/eligibility');
                        setNotifDropdownOpen(false);
                      }}
                      className="p-3 hover:bg-slate-50 cursor-pointer transition-colors"
                    >
                      <p className="font-semibold text-emerald-800">Cá thể đủ điều kiện xuất bán</p>
                      <p className="text-slate-500 text-[11px] mt-0.5">
                        Có {readyForSaleCount} bò đạt trọng lượng mục tiêu và hết tồn dư kháng sinh.
                      </p>
                    </div>
                  )}
                  {pendingOrdersCount > 0 && (
                    <div
                      onClick={() => {
                        navigate('/sales/orders');
                        setNotifDropdownOpen(false);
                      }}
                      className="p-3 hover:bg-slate-50 cursor-pointer transition-colors"
                    >
                      <p className="font-semibold text-indigo-700">Phiếu xuất bán chờ phê duyệt</p>
                      <p className="text-slate-500 text-[11px] mt-0.5">
                        Có {pendingOrdersCount} phiếu xuất chờ FARM_MANAGER ký duyệt.
                      </p>
                    </div>
                  )}
                  {quarantineCount > 0 && (
                    <div
                      onClick={() => {
                        navigate('/health/records');
                        setNotifDropdownOpen(false);
                      }}
                      className="p-3 hover:bg-slate-50 cursor-pointer transition-colors"
                    >
                      <p className="font-semibold text-amber-700">Cá thể cách ly thú y</p>
                      <p className="text-slate-500 text-[11px] mt-0.5">
                        Có {quarantineCount} cá thể đang điều trị tại Chuồng C1 (Cách ly).
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* User profile dropdown */}
          <div className="relative">
            <button
              onClick={() => setUserDropdownOpen(!userDropdownOpen)}
className="flex items-center gap-2 p-1 pl-1.5 sm:pr-2.5 rounded-xl hover:bg-slate-100 transition-colors border border-transparent hover:border-slate-200"
            >
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={currentUser.name}
                  className="w-8 h-8 rounded-full object-cover ring-2 ring-emerald-500/30"
                  onError={() => setAvatarUrl('')}
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-semibold ring-2 ring-emerald-500/30">
                  {currentUser.name?.charAt(0)?.toUpperCase() || 'U'}
                </div>
              )}
                          <div className="hidden lg:block text-left">
                <p className="text-xs font-bold text-slate-900 leading-tight truncate max-w-[120px]">{currentUser.name}</p>
                <p className="text-[10px] text-slate-500 font-medium">{currentUser.department}</p>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
            </button>

            {userDropdownOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-200 py-2 z-50">
                <div className="px-4 py-2 border-b border-slate-100">
                  <p className="text-xs font-bold text-slate-900 truncate">{currentUser.name}</p>
                  <p className="text-[11px] text-slate-500 truncate">{currentUser.email}</p>
                  <p className="text-[10px] text-emerald-600 font-semibold mt-1">Vai trò: {currentUser.role}</p>
                </div>
                <div className="py-1">
                  <button
                    onClick={() => {
                      navigate('/profile');
                      setUserDropdownOpen(false);
                    }}
                    className="w-full text-left px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                  >
                    <UserIcon className="w-4 h-4 text-slate-400" />
                    Hồ sơ cá nhân
                  </button>
                  <button
                    onClick={() => {
                      logout();
                      navigate('/login');
                      setUserDropdownOpen(false);
                    }}
                    className="w-full text-left px-4 py-2 text-xs text-rose-600 hover:bg-rose-50 flex items-center gap-2"
                  >
                    <LogOut className="w-4 h-4 text-rose-500" />
                    Đăng xuất
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};