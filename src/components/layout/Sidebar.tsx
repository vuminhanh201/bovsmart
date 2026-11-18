import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';
import { useFarmStore } from '../../store/useFarmStore';
import {
  LayoutDashboard,
  UserCheck,
  Users,
  Settings,
  CircleDot,
  Warehouse,
  ArrowLeftRight,
  Wheat,
  Clock,
  HeartPulse,
  CalendarCheck,
  BookOpen,
  Radio,
  Scale,
  BadgeDollarSign,
  FileSpreadsheet,
  BarChart3,
  Link2,
  FileClock,
  Lock,
  ChevronRight,
  X,
  Sparkles,
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

interface MenuItem {
  name: string;
  path: string;
  icon: any;
  allowedRoles: string[];
  moduleNo: number;
  badge?: string | number;
  badgeColor?: string;
  restrictedBadge?: string;
  highlight?: boolean;
}

interface MenuSection {
  title: string;
  items: MenuItem[];
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const location = useLocation();
  const { currentUser } = useAuthStore();
  const { cattle, salesOrders, healthRecords, feedingSchedules } = useFarmStore();

  const role = currentUser.role;

  // Badges
  const readySaleCount = cattle.filter((c) => c.status === 'READY_FOR_SALE').length;
  const pendingOrders = salesOrders.filter((o) => o.status === 'PENDING_APPROVAL').length;
  const quarantineCows = cattle.filter((c) => c.status === 'QUARANTINE').length;
  const pendingFeeds = feedingSchedules.filter((s) => s.status === 'PENDING').length;

  // Groups and routes
  // Groups and routes matching 9 Modules & FRs
  const menuSections: MenuSection[] = [
    {
      title: 'Thống Kê & Báo Cáo',
      items: [
        {
          name: 'Dashboard Tổng Quan ',
          path: '/',
          icon: LayoutDashboard,
          allowedRoles: ['ADMIN', 'FARM_MANAGER', 'STAFF'],
          moduleNo: 8,
        },
        {
          name: 'Báo Cáo & Phân Tích',
          path: '/reports',
          icon: BarChart3,
          allowedRoles: ['ADMIN', 'FARM_MANAGER', 'STAFF'],
          moduleNo: 8,
        },
      ],
    },
    {
      title: 'Mô Phỏng RFID & Cân Điện Tử',
      items: [
        {
           name: 'Trạm Cân & Quét RFID',
          path: '/simulation',
          icon: Radio,
          highlight: true,
          allowedRoles: ['FARM_MANAGER', 'STAFF'],
          restrictedBadge: 'Manager / Staff',
          moduleNo: 9,
        },
      ],
    },
    {
      title: 'Quản Lý Đàn Bò',
      items: [
        {
          name: 'Danh Sách & Hồ Sơ Bò',
          path: '/cattle',
          icon: CircleDot,
          badge: cattle.length,
          allowedRoles: ['ADMIN', 'FARM_MANAGER', 'STAFF'],
          moduleNo: 2,
        },
      ],
    },
    {
      title: 'Quản Lý Chuồng Trại',
      items: [
        {
          name: 'Danh Sách Chuồng',
          path: '/barns',
          icon: Warehouse,
          allowedRoles: ['ADMIN', 'FARM_MANAGER', 'STAFF'],
          moduleNo: 3,
        },
        {
          name: 'Điều Chuyển Bò',
          path: '/barns/transfer',
          icon: ArrowLeftRight,
          allowedRoles: ['FARM_MANAGER'],
          restrictedBadge: 'Chỉ Quản lý trang trại',
          moduleNo: 3,
        },
      ],
    },
    {
      title: 'Quản Lý Thức Ăn',
      items: [
        {
          name: 'Kho Thức Ăn & Nhập/Xuất',
          path: '/feeds',
          icon: Wheat,
          allowedRoles: ['ADMIN', 'FARM_MANAGER', 'STAFF'],
          moduleNo: 4,
        },
        {
          name: 'Lịch Cho Ăn ',
          path: '/feeds/schedule',
          icon: Clock,
          badge: pendingFeeds > 0 ? `${pendingFeeds} ca` : undefined,
          badgeColor: 'bg-amber-100 text-amber-800',
          allowedRoles: ['ADMIN', 'FARM_MANAGER', 'STAFF'],
          moduleNo: 4,
        },
        {
          name: 'Nhật Ký Cho Ăn',
          path: '/feeds/diary',
          icon: FileClock,
          allowedRoles: ['ADMIN', 'FARM_MANAGER'],
          restrictedBadge: 'Admin / Manager',
          moduleNo: 4,
        },
      ],
    },
    {
      title: 'Chăm Sóc Sức Khỏe',
      items: [
        {
          name: 'Khám, Điều Trị & Ngừng Thuốc',
          path: '/health/records',
          icon: HeartPulse,
          badge: quarantineCows > 0 ? `${quarantineCows} theo dõi` : undefined,
          badgeColor: 'bg-rose-100 text-rose-700',
          allowedRoles: ['ADMIN', 'FARM_MANAGER', 'STAFF'],
          moduleNo: 5,
        },
        {
          name: 'Lịch Tiêm Phòng Vaccine',
          path: '/health/calendar',
          icon: CalendarCheck,
          allowedRoles: ['ADMIN', 'FARM_MANAGER', 'STAFF'],
          moduleNo: 5,
        },
      ],
    },
    {
      title: 'Nhật Ký Chăn Nuôi',
      items: [
        {
          name: 'Nhật Ký Hằng Ngày',
          path: '/diary',
          icon: BookOpen,
          allowedRoles: ['ADMIN', 'FARM_MANAGER', 'STAFF'],
          moduleNo: 6,
        },
      ],
    },
    {
      title: 'Quản Lý Xuất Bán Bò',
      items: [
        {
          name: 'Điều Kiện An Toàn Xuất Bán',
          path: '/sales/eligibility',
          icon: BadgeDollarSign,
          badge: readySaleCount > 0 ? `${readySaleCount} con` : undefined,
          badgeColor: 'bg-emerald-100 text-emerald-800',
          allowedRoles: ['ADMIN', 'FARM_MANAGER', 'STAFF'],
          moduleNo: 7,
        },
        {
          name: 'Lập & Quản Lý Phiếu Xuất',
          path: '/sales/orders',
          icon: FileSpreadsheet,
          badge: pendingOrders > 0 ? `${pendingOrders} chờ duyệt` : undefined,
          badgeColor: 'bg-indigo-100 text-indigo-700',
          allowedRoles: ['ADMIN', 'FARM_MANAGER', 'STAFF'],
          moduleNo: 7,
        },
      ],
    },
    {
      title: 'Hệ Thống Chung & Tài Khoản',
      items: [
        {
          name: 'Hồ Sơ & Đổi Mật Khẩu',
          path: '/profile',
          icon: UserCheck,
          allowedRoles: ['ADMIN', 'FARM_MANAGER', 'STAFF'],
          moduleNo: 1,
        },
        {
          name: 'Quản Trị Người Dùng & Phân Quyền',
          path: '/users',
          icon: Users,
          allowedRoles: ['ADMIN'],
          restrictedBadge: 'Chỉ Admin',
          moduleNo: 1,
        },
        {
          name: 'Cài Đặt Hệ Thống & Cổng Kết Nối',
          path: '/settings',
          icon: Settings,
          allowedRoles: ['ADMIN', 'FARM_MANAGER'],
          restrictedBadge: 'Admin / Manager',
          moduleNo: 1,
        },
        {
          name: 'Sổ Cái Blockchain',
          path: '/blockchain',
          icon: Link2,
          allowedRoles: ['ADMIN', 'FARM_MANAGER'],
          restrictedBadge: 'Admin / Manager',
          moduleNo: 1,
        },
      ],
    },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-xs lg:hidden transition-opacity"
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-72 bg-white border-r border-slate-200/90 flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand header */}
        <div className="h-16 px-5 border-b border-slate-100 flex items-center justify-between shrink-0 bg-gradient-to-r from-emerald-900 via-slate-900 to-emerald-950 text-white">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-300 shadow-inner">
              <Sparkles className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <span className="font-extrabold text-base tracking-tight text-white flex items-center gap-1.5">
                BovSmart <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 px-1.5 py-0.2 rounded font-mono">v2.4</span>
              </span>
              <p className="text-[10px] text-slate-300">Trang Trại Bò Thông Minh</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Navigation */}
        <div className="flex-1 overflow-y-auto px-3.5 py-4 space-y-6">
          {menuSections.map((section, idx) => (
            <div key={idx} className="space-y-1">
              <p className="px-2.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                {section.title}
              </p>
              <div className="space-y-0.5">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const isAllowed = item.allowedRoles.includes(role);
                  const isActive = location.pathname === item.path;

                  if (!isAllowed) {
                    return (
                      <div
                        key={item.path}
                        className="flex items-center justify-between px-2.5 py-2 rounded-xl text-xs text-slate-400 bg-slate-50/50 cursor-not-allowed select-none group"
                        title={`Vai trò ${role} không có quyền truy cập mục này (${item.restrictedBadge})`}
                      >
                        <div className="flex items-center gap-2.5 truncate">
                          <Icon className="w-4 h-4 text-slate-300 shrink-0" />
                          <span className="truncate">{item.name}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-[10px] bg-slate-200/60 text-slate-500 px-1.5 py-0.5 rounded font-mono">
                            Khóa
                          </span>
                          <Lock className="w-3 h-3 text-slate-400" />
                        </div>
                      </div>
                    );
                  }

                  return (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      onClick={() => onClose()}
                      className={`group flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-semibold transition-all duration-150 ${
                        isActive
                          ? 'bg-emerald-600 text-white shadow-sm'
                          : item.highlight
                          ? 'bg-emerald-50 text-emerald-900 hover:bg-emerald-100/70 border border-emerald-200/50'
                          : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 truncate">
                        <Icon
                          className={`w-4 h-4 shrink-0 transition-transform group-hover:scale-105 ${
                            isActive ? 'text-white' : item.highlight ? 'text-emerald-600' : 'text-slate-500'
                          }`}
                        />
                        <span className="truncate">{item.name}</span>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {item.badge !== undefined && (
                          <span
                            className={`px-1.5 py-0.5 text-[10px] font-bold rounded-md ${
                              isActive
                                ? 'bg-white/20 text-white'
                                : item.badgeColor || 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {item.badge}
                          </span>
                        )}
                        <ChevronRight
                          className={`w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity ${
                            isActive ? 'text-white' : 'text-slate-400'
                          }`}
                        />
                      </div>
                    </NavLink>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Bottom Current Role Indicator */}
        <div className="p-3 border-t border-slate-100 bg-slate-50/70">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500">Quyền hiện hành:</span>
            <span
              className={`font-mono font-bold text-[11px] px-2 py-0.5 rounded-full ${
                role === 'ADMIN'
                  ? 'bg-indigo-100 text-indigo-700'
                  : role === 'FARM_MANAGER'
                  ? 'bg-emerald-100 text-emerald-700'
                  : 'bg-amber-100 text-amber-700'
              }`}
            >
              {role}
            </span>
          </div>
        </div>
      </aside>
    </>
  );
};
