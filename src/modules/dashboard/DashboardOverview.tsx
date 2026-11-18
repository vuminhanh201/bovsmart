import React, { useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFarmStore } from '../../store/useFarmStore';
import { useAuthStore } from '../../store/useAuthStore';
import {
  CircleDot,
  BadgeDollarSign,
  TrendingUp,
  Warehouse,
  Radio,
  Scale,
  HeartPulse,
  Clock,
  Sparkles,
  Link2,
  ArrowUpRight,
  ShieldCheck,
  Wheat,
  AlertTriangle,
  ChevronRight,
} from 'lucide-react';

export const DashboardOverview: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuthStore();
  const {
    cattle,
    barns,
    feedingSchedules,
    healthRecords,
    blockchainBlocks,
    activeScaleWeight,
      fetchCattle,
    fetchBarns,
    fetchHealthRecords,
    fetchSalesOrders,
    fetchFeedingSchedules,
    fetchBlockchainBlocks,
    addToast,
    scannedRfidTag,
    scaleIsStable,
  } = useFarmStore();

    useEffect(() => {
      const loadDashboardData = async () => {
        const results = await Promise.allSettled([
          fetchCattle(),
          fetchBarns(),
          fetchSalesOrders(),
          fetchHealthRecords(),
          fetchFeedingSchedules(),
          fetchBlockchainBlocks(),
        ]);

        if (results[0].status === 'rejected') {
          addToast(
            'error',
            'Lỗi tải dữ liệu đàn bò',
            'Không thể tải danh sách bò từ máy chủ.'
          );
        }
      };

      loadDashboardData();
    }, [
      fetchCattle,
      fetchBarns,
      fetchSalesOrders,
      fetchHealthRecords,
      fetchFeedingSchedules,
      fetchBlockchainBlocks,
      addToast,
    ]);

  const totalCattle = cattle.length;
  const readyForSale = cattle.filter(
    (c) => c.status === 'DU_DIEU_KIEN_XUAT_BAN'
  );

  const quarantineCount = cattle.filter(
    (c) =>
      c.status === 'DANG_DIEU_TRI' ||
      c.status === 'CAN_THEO_DOI'
  ).length;
  const totalWeight = cattle.reduce((sum, c) => sum + c.weight, 0);
  const avgWeight = totalCattle > 0 ? (totalWeight / totalCattle).toFixed(1) : 0;

  const totalBarnCapacity = barns.reduce((sum, b) => sum + b.capacity, 0);
  const totalOccupied = barns.reduce((sum, b) => sum + b.currentCount, 0);
  const occupancyPercent = totalBarnCapacity > 0 ? Math.round((totalOccupied / totalBarnCapacity) * 100) : 0;

  const lastBlock = blockchainBlocks[blockchainBlocks.length - 1];

  const today = useMemo(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  }, []);

  const todayFeedingSchedules = useMemo(() => {
    return feedingSchedules
      .filter(
        (item) => item.feedingDate?.slice(0, 10) === today
      )
      .sort((a, b) =>
        a.scheduledTime.localeCompare(b.scheduledTime)
      )
      .slice(0, 3);
  }, [feedingSchedules, today]);

  const latestHealthRecords = useMemo(() => {
    return [...healthRecords]
      .sort(
        (a, b) =>
          new Date(b.date).getTime() -
          new Date(a.date).getTime()
      )
      .slice(0, 3);
  }, [healthRecords]);

  return (
    <div className="space-y-6">
      {/* Top Banner with Role Context & Status */}
      <div className="bg-gradient-to-r from-emerald-900 via-slate-900 to-emerald-950 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-emerald-500/20 via-transparent to-transparent pointer-events-none"></div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-mono font-semibold text-emerald-400 bg-emerald-500/20 border border-emerald-400/30 px-2.5 py-1 rounded-full flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                Trang Trại Thông Minh Đang Trực Tuyến
              </span>
              <span className="text-xs text-slate-300">
                Vai trò hiện hành: <strong className="text-white">{currentUser.role}</strong>
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Xin chào, {currentUser.name}! 👋
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm mt-1 max-w-2xl leading-relaxed">
              Theo dõi toàn diện đàn bò thịt, chuồng trại vi khí hậu, cân điện tử RFID tự động và bảo chứng chuỗi khối Blockchain.
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              onClick={() => navigate('/simulation')}
              className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl shadow-lg transition-transform active:scale-95 flex items-center gap-2 cursor-pointer"
            >
              <Radio className="w-4 h-4 animate-pulse" />
              <span>Chạy Cân & Quét RFID</span>
            </button>
            <button
              onClick={() => navigate('/cattle')}
              className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white font-semibold text-xs rounded-xl border border-white/20 transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <span>Xem Đàn Bò</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Primary KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div
          onClick={() => navigate('/cattle')}
          className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-xs hover:border-emerald-300 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CircleDot className="w-5 h-5" />
            </div>
            <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full flex items-center gap-1">
              +100% RFID
            </span>
          </div>
          <p className="text-xs font-semibold text-slate-500">Tổng Đàn Bò</p>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900">{totalCattle}</span>
            <span className="text-xs text-slate-400">cá thể</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500 flex items-center justify-between">
            <span>Trọng lượng TB:</span>
            <span className="font-bold text-slate-700">{avgWeight} kg</span>
          </div>
        </div>

        <div
          onClick={() => navigate('/sales/eligibility')}
          className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-xs hover:border-emerald-300 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <BadgeDollarSign className="w-5 h-5" />
            </div>
            <span className="text-[11px] font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full">
              Sẵn sàng xuất
            </span>
          </div>
          <p className="text-xs font-semibold text-slate-500">Đủ Chuẩn Xuất Bán</p>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl sm:text-3xl font-extrabold text-indigo-950">{readyForSale.length}</span>
            <span className="text-xs text-slate-400">con đạt chuẩn</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500 flex items-center justify-between">
            <span>Ước tính giá trị:</span>
            <span className="font-bold text-emerald-700">
              {(readyForSale.reduce((acc, c) => acc + c.weight, 0) * 92000).toLocaleString('vi-VN')} đ
            </span>
          </div>
        </div>

        <div
          onClick={() => navigate('/reports')}
          className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-xs hover:border-emerald-300 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <TrendingUp className="w-5 h-5" />
            </div>
            <span className="text-[11px] font-semibold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full">
              ADG: 1.15 kg/ngày
            </span>
          </div>
          <p className="text-xs font-semibold text-slate-500">Hiệu Quả FCR</p>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900">6.2</span>
            <span className="text-xs text-slate-400">kg TĂ / 1 kg tăng trọng</span>
          </div>
          <div className="mt-2 text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>Tối ưu hơn 8.5% so với TB</span>
          </div>
        </div>

        <div
          onClick={() => navigate('/barns')}
          className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-xs hover:border-emerald-300 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <Warehouse className="w-5 h-5" />
            </div>
            <span className="text-[11px] font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-full">
              {barns.length} chuồng
            </span>
          </div>
          <p className="text-xs font-semibold text-slate-500">Tỷ Lệ Lấp Đầy Chuồng</p>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900">{occupancyPercent}%</span>
            <span className="text-xs text-slate-400">
              ({totalOccupied}/{totalBarnCapacity} chỗ)
            </span>
          </div>
          <div className="mt-2 w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
            <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: `${occupancyPercent}%` }}></div>
          </div>
        </div>
      </div>

      {/* Grid: Barn Environmental Sensors & Live Hardware Simulation */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Barns Environmental Sensors */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Giám Sát Vi Khí Hậu Chuồng Trại (IoT Sensors)</h2>
              <p className="text-xs text-slate-500">Cảm biến nhiệt độ, độ ẩm và khí Amoniac (NH3) cập nhật mỗi 5 giây</p>
            </div>
            <button
              onClick={() => navigate('/barns')}
              className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
            >
              <span>Xem chi tiết chuồng</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {barns.map((barn) => {
              const isTempHigh = barn.temperature > 30;
              const isAmmoniaHigh = barn.ammonia > 12;

              return (
                <div
                  key={barn.id}
                  onClick={() => navigate('/barns/transfer')}
                  className="p-4 rounded-xl border border-slate-200/90 bg-slate-50/50 hover:bg-slate-50 hover:border-slate-300 transition-all cursor-pointer"
                >
                  <div className="flex items-center justify-between mb-2.5">
                    <div>
                      <span className="text-xs font-bold text-slate-900">{barn.name}</span>
                      <p className="text-[11px] text-slate-500">Phụ trách: {barn.assignedStaff}</p>
                    </div>
                    <span className="text-[11px] font-mono font-bold bg-white px-2 py-0.5 rounded border text-slate-700">
                      {barn.currentCount}/{barn.capacity} con
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-200/70 text-center">
                    <div className="bg-white p-2 rounded-lg border border-slate-100">
                      <span className="text-[10px] text-slate-400 block">Nhiệt độ</span>
                      <span className={`text-xs font-extrabold ${isTempHigh ? 'text-rose-600' : 'text-slate-800'}`}>
                        {barn.temperature}°C
                      </span>
                    </div>
                    <div className="bg-white p-2 rounded-lg border border-slate-100">
                      <span className="text-[10px] text-slate-400 block">Độ ẩm</span>
                      <span className="text-xs font-extrabold text-slate-800">{barn.humidity}%</span>
                    </div>
                    <div className="bg-white p-2 rounded-lg border border-slate-100">
                      <span className="text-[10px] text-slate-400 block">Khí NH3</span>
                      <span className={`text-xs font-extrabold ${isAmmoniaHigh ? 'text-amber-600' : 'text-emerald-700'}`}>
                        {barn.ammonia} ppm
                      </span>
                    </div>
                  </div>

                  <div className="mt-2.5 flex items-center justify-between text-[11px]">
                    <span className="text-slate-500">Quạt thông gió:</span>
                    <span className="font-semibold text-emerald-700 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-spin"></span>
                      Tự động ({barn.fanStatus})
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Live Blockchain & Hardware Status */}
        <div className="space-y-4">
          {/* Hardware mini panel */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <Scale className="w-4 h-4 text-emerald-600" />
                Trạm Cân & Đầu Đọc RFID
              </h3>
              <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                SẴN SÀNG
              </span>
            </div>

            <div className="bg-slate-900 text-emerald-400 p-4 rounded-xl text-center border border-slate-800">
              <p className="text-[10px] text-slate-400 uppercase tracking-wider">
                Trọng Lượng Mô Phỏng
              </p>

              <div className="text-3xl font-mono font-extrabold text-white my-1">
                {activeScaleWeight.toFixed(1)}{' '}
                <span className="text-xs text-emerald-400 font-sans">KG</span>
              </div>

              <p className="text-[11px] text-slate-400">
                Thẻ RFID gần nhất:{' '}
                <span className="text-emerald-300 font-mono">
                  {scannedRfidTag || 'Chưa quét thẻ'}
                </span>
              </p>

              <p className={`text-[10px] mt-2 font-semibold ${
                scaleIsStable ? 'text-emerald-400' : 'text-amber-400'
              }`}>
                {scaleIsStable ? '● CÂN ỔN ĐỊNH' : '● ĐANG CHỜ DỮ LIỆU'}
              </p>
            </div>

            <button
              onClick={() => navigate('/simulation')}
              className="mt-3 w-full py-2 px-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-semibold text-xs rounded-xl border border-emerald-200 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <span>Mở Bảng Điều Khiển Cân Mô Phỏng</span>
              <ArrowUpRight className="w-4 h-4" />
            </button>
          </div>

          {/* Blockchain Ledger Snapshot */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <Link2 className="w-4 h-4 text-indigo-600" />
                Chuỗi Khối Blockchain
              </h3>
              <span className="text-[10px] bg-indigo-50 text-indigo-700 font-semibold px-2 py-0.5 rounded-full">
                {lastBlock?.index ?? 0}
              </span>
            </div>
            <p className="text-xs text-slate-500 mb-2 leading-relaxed">
              Mọi sự kiện cân nặng, tiêm chủng và xuất bán được mã hóa bất biến:
            </p>
            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 font-mono text-[11px] text-slate-600 break-all">
              <p className="text-[10px] text-slate-400 uppercase">Block Hash:</p>
              {lastBlock?.hash?.slice(0, 32) ?? 'Chưa có dữ liệu'}
            </div>
            <button
              onClick={() => navigate('/blockchain')}
              className="mt-3 w-full py-1.5 text-center text-xs font-semibold text-indigo-700 hover:text-indigo-800"
            >
              Xem toàn bộ sổ cái chuỗi khối →
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Row: Upcoming feeding & Medical Alerts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Feeding Shifts */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-600" />
              Lịch Cho Ăn Trong Ngày
            </h3>
            <button
              onClick={() => navigate('/feeds/schedule')}
              className="text-xs font-semibold text-emerald-600 hover:text-emerald-700"
            >
              Tất cả ca →
            </button>
          </div>

          <div className="space-y-2">
            {todayFeedingSchedules.length > 0 ? (
              todayFeedingSchedules.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-3 rounded-xl border border-slate-100 bg-slate-50/50 text-xs"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900">
                        {item.scheduledTime}
                      </span>
                      <span className="font-medium text-slate-700">
                        {item.penName}
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {item.rationName} ({item.amountTotalKg} kg)
                    </p>
                  </div>

                  <span
                    className={`px-2 py-0.5 rounded-full font-semibold text-[10px] ${
                      item.status === 'COMPLETED'
                        ? 'bg-emerald-100 text-emerald-800'
                        : item.status === 'DELAYED'
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {item.status === 'COMPLETED'
                      ? 'Đã hoàn thành'
                      : item.status === 'DELAYED'
                        ? 'Bị trễ'
                        : 'Đang chờ'}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-500 text-center py-5">
                Không có lịch cho ăn trong ngày hôm nay.
              </p>
            )}
          </div>
        </div>

        {/* Health & Quarantine alerts */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <HeartPulse className="w-4 h-4 text-rose-600" />
              Hồ Sơ Điều Trị & Tiêm Phòng Gần Nhất
            </h3>
            <button
              onClick={() => navigate('/health/records')}
              className="text-xs font-semibold text-emerald-600 hover:text-emerald-700"
            >
              Xem bệnh án →
            </button>
          </div>

          <div className="space-y-2">
            {latestHealthRecords.length > 0 ? (
              latestHealthRecords.map((record) => (
                <div
                  key={record.id}
                  className="p-3 rounded-xl border border-slate-100 bg-slate-50/50 text-xs space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900">
                      Bò {record.cattleId} ({record.rfidTag})
                    </span>

                    <span
                      className={`px-2 py-0.5 rounded-full font-semibold text-[10px] ${
                        record.quarantineRequired
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {record.status === 'ONGOING'
                        ? 'Đang điều trị'
                        : record.status === 'RECOVERED'
                          ? 'Đã hồi phục'
                          : 'Đang theo dõi'}
                    </span>
                  </div>

                  <p className="text-slate-600 text-[11px]">
                    {record.diagnosis}
                  </p>

                  <div className="flex items-center justify-between text-[10px] text-slate-400 pt-0.5">
                    <span>Bác sĩ: {record.veterinarian}</span>

                    {record.withdrawalPeriodDays > 0 && (
                      <span className="text-amber-600 font-bold">
                        Thời gian ngừng thuốc: {record.withdrawalPeriodDays} ngày
                      </span>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-500 text-center py-5">
                Chưa có hồ sơ sức khỏe.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
