import React, { useEffect, useMemo, useState } from 'react';
import { useFarmStore } from '../../store/useFarmStore';
import {
  BarChart3,
  TrendingUp,
  Download,
  Calendar,
  DollarSign,
  Wheat,
  PieChart,
  CircleDot,
  ArrowUpRight,
  Sparkles,
} from 'lucide-react';

export const AnalyticsReportsPage: React.FC = () => {
  const {
  cattle,
  salesOrders,
  addToast,
  fetchCattle,
  fetchSalesOrders,
} = useFarmStore();

useEffect(() => {
  fetchCattle();
  fetchSalesOrders();
}, [fetchCattle, fetchSalesOrders]);

  const [timeRange, setTimeRange] = useState<'MONTH' | 'QUARTER' | 'YEAR'>('MONTH');

  // Breed breakdown
 const breedCounts = useMemo(() => {
    const counts: Record<string, number> = {};

    cattle.forEach((c) => {
      const breed = c.breed || 'Chưa phân loại';
      counts[breed] = (counts[breed] || 0) + 1;
    });

    return counts;
  }, [cattle]);

  const totalRevenue = salesOrders.reduce(
    (sum, order) =>
      sum +
      (order.status === 'APPROVED'
        ? Number(order.totalRevenueVND || 0)
        : 0),
    0
  );

  const totalCattle = cattle.length;


  // Khoảng thời gian thống kê
  const rangeStart = useMemo(() => {
    const now = new Date();

    if (timeRange === 'MONTH') {
      return new Date(now.getFullYear(), now.getMonth(), 1);
    }

    if (timeRange === 'QUARTER') {
      const quarterStartMonth = Math.floor(now.getMonth() / 3) * 3;
      return new Date(now.getFullYear(), quarterStartMonth, 1);
    }

    return new Date(now.getFullYear(), 0, 1);
  }, [timeRange]);

  // Tính ADG trung bình theo từng giống bò
  const adgByBreed = useMemo(() => {
    const groups: Record<
      string,
      { totalAdg: number; cattleCount: number }
    > = {};

    const now = new Date();

    cattle.forEach((cow) => {
      const records = (cow.weightHistory || [])
        .map((record) => ({
          date: new Date(record.date),
          weight: Number(record.weight),
        }))
        .filter(
          (record) =>
            Number.isFinite(record.date.getTime()) &&
            Number.isFinite(record.weight) &&
            record.weight > 0 &&
            record.date <= now
        )
        .sort((a, b) => a.date.getTime() - b.date.getTime());

      const beforePeriod = records.filter(
        (record) => record.date < rangeStart
      );

      const inPeriod = records.filter(
        (record) => record.date >= rangeStart
      );

      let firstRecord;
      let lastRecord;

      if (beforePeriod.length > 0 && inPeriod.length > 0) {
        firstRecord = beforePeriod[beforePeriod.length - 1];
        lastRecord = inPeriod[inPeriod.length - 1];
      } else if (inPeriod.length >= 2) {
        firstRecord = inPeriod[0];
        lastRecord = inPeriod[inPeriod.length - 1];
      } else {
        return;
      }

      const days =
        (lastRecord.date.getTime() - firstRecord.date.getTime()) /
        (1000 * 60 * 60 * 24);

      if (days <= 0) return;

      const adg =
        (lastRecord.weight - firstRecord.weight) / days;

      const breed = cow.breed || 'Chưa phân loại';

      if (!groups[breed]) {
        groups[breed] = {
          totalAdg: 0,
          cattleCount: 0,
        };
      }

      groups[breed].totalAdg += adg;
      groups[breed].cattleCount += 1;
    });

    return Object.entries(groups).map(([breed, data]) => ({
      breed,
      adg: data.totalAdg / data.cattleCount,
      cattleCount: data.cattleCount,
    }));
  }, [cattle, rangeStart]);

  // ADG trung bình toàn đàn (chỉ tính bò đủ dữ liệu)
  const overallAdg = useMemo(() => {
    const total = adgByBreed.reduce(
      (sum, item) => sum + item.adg * item.cattleCount,
      0
    );

    const count = adgByBreed.reduce(
      (sum, item) => sum + item.cattleCount,
      0
    );

    return count > 0 ? total / count : null;
  }, [adgByBreed]);

  const cattleWithAdg = adgByBreed.reduce(
    (sum, item) => sum + item.cattleCount,
    0
  );


  const activeCattle = cattle.filter(
    (c) => c.status !== 'DA_XUAT_BAN'
  ).length;

  const soldCattle = cattle.filter(
    (c) => c.status === 'DA_XUAT_BAN'
  ).length;

  const healthyRate =
    totalCattle > 0
      ? ((totalCattle - cattle.filter(
          (c) =>
            c.status === 'DANG_DIEU_TRI' ||
            c.status === 'CAN_THEO_DOI'
        ).length) /
          totalCattle) *
        100
      : null;
  const handleExportReport = () => {
    addToast(
      'warning',
      'Chưa hỗ trợ xuất file',
      'Chức năng tạo file Excel/PDF sẽ được hoàn thiện sau khi kết nối đầy đủ dữ liệu báo cáo.'
    );
  };
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900">Báo Cáo Thống Kê & Phân Tích Hiệu Suất Chăn Nuôi</h1>
            <span className="text-xs bg-indigo-50 text-indigo-700 border border-indigo-200 px-2.5 py-0.5 rounded-full font-bold">
              Chỉ số ADG & FCR
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Phân tích tốc độ tăng trọng bình quân, hệ số chuyển hóa thức ăn và hiệu quả tài chính kinh doanh
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200 text-xs font-semibold">
           <button
              onClick={() => setTimeRange('QUARTER')}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                timeRange === 'QUARTER'
                  ? 'bg-emerald-600 text-white'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Quý Hiện Tại
            </button>
            <button
              onClick={() => setTimeRange('YEAR')}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                timeRange === 'YEAR' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600'
              }`}
            >
              Cả Năm 
            </button>
          </div>

          <button
            onClick={handleExportReport}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md shadow-emerald-600/20 flex items-center gap-1.5 cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Xuất Báo Cáo</span>
          </button>
        </div>
      </div>

      {/* Top Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs font-semibold text-slate-500">
            Tăng Trọng TB Ngày (ADG)
          </span>

          <div className="text-2xl font-extrabold text-slate-900 mt-1 font-mono">
            {overallAdg !== null ? (
              <>
                {overallAdg.toFixed(3)}
                <span className="text-xs font-sans text-slate-400">
                  {' '}kg/ngày/con
                </span>
              </>
            ) : (
              <span className="text-lg">Chưa đủ dữ liệu</span>
            )}
          </div>

          <p className="mt-2 text-[11px] text-slate-500">
            {cattleWithAdg}/{totalCattle} cá thể có đủ lịch sử cân
          </p>
        </div>


        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs font-semibold text-slate-500">Hệ Số Chuyển Đổi Thức Ăn (FCR)</span>
          <div className="text-2xl font-extrabold text-indigo-900 mt-1 font-mono">
            Chưa đủ dữ liệu <span className="text-xs font-sans text-slate-400">kg thức ăn / kg tăng trọng</span>
          </div>
          <div className="mt-2 text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
            <span>Tiết kiệm 450,000 đ/con chi phí TMR</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs font-semibold text-slate-500">Doanh Thu Xuất Bán Đã Duyệt</span>
          <div className="text-2xl font-extrabold text-emerald-700 mt-1 font-mono">
            {totalRevenue.toLocaleString('vi-VN')} <span className="text-xs font-sans text-slate-400">VND</span>
          </div>
          <p className="mt-2 text-[11px] text-slate-500">Hợp đồng thịt sạch VietGAP</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs font-semibold text-slate-500">Tỷ Lệ Bò Không Cần Theo Dõi/Điều Trị</span>
          <div className="text-2xl font-extrabold text-slate-900 mt-1 font-mono">
            {healthyRate !== null
            ? `${healthyRate.toFixed(1)}%`
            : 'Chưa đủ dữ liệu'} 
            <span className="text-xs font-sans text-slate-400">không điều trị/theo dõi</span>
          </div>
          <p className="mt-2 text-[11px] text-emerald-600 font-semibold">{totalCattle} cá thể trong dữ liệu đàn bò</p>
        </div>
      </div>

      
      {/* ADG Comparison Chart & Herd Composition */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* ADG by Breed */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                Tốc Độ Tăng Trọng ADG Theo Giống Bò
              </h2>
              <p className="text-xs text-slate-500">
                Tính toán từ lịch sử cân nặng của từng cá thể trong kỳ thống kê
              </p>
            </div>

            <span className="text-xs font-mono font-bold bg-slate-100 px-2 py-0.5 rounded text-slate-700">
              Đơn vị: kg/ngày
            </span>
          </div>

          <div className="space-y-4 pt-2">
            {adgByBreed.length > 0 ? (
              adgByBreed.map((item) => (
                <div key={item.breed} className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-800">
                      {item.breed}
                    </span>

                    <span className="font-mono font-bold text-emerald-700">
                      {item.adg.toFixed(3)} kg/ngày
                    </span>
                  </div>

                  <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 rounded-full"
                      style={{
                        width: `${
                          Math.max(
                            0,
                            Math.min(
                              100,
                              (item.adg /
                                Math.max(
                                  ...adgByBreed.map((x) => Math.max(0, x.adg)),
                                  1
                                )) *
                                100
                            )
                          )
                        }%`,
                      }}
                    />
                  </div>

                  <p className="text-[10px] text-slate-400">
                    {item.cattleCount} cá thể đủ dữ liệu cân
                  </p>
                </div>
              ))
            ) : (
              <div className="py-8 text-center">
                <p className="text-sm font-semibold text-slate-500">
                  Chưa đủ dữ liệu lịch sử cân nặng
                </p>

                <p className="text-xs text-slate-400 mt-2">
                  Cần tối thiểu hai lần cân ở hai ngày khác nhau
                  trong khoảng thời gian thống kê.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Herd Structure & Pen Efficiency */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                Cơ Cấu Đàn Bò & Tỷ Lệ Chiếm Chỗ
              </h2>
              <p className="text-xs text-slate-500">
                Phân bố cá thể theo giống và chức năng chăn nuôi
              </p>
            </div>
          </div>

          <div className="space-y-3 pt-2">
            {Object.keys(breedCounts).length > 0 ? (
              Object.entries(breedCounts).map(([breed, count], idx) => {
                const percent =
                  cattle.length > 0
                    ? Math.round((count / cattle.length) * 100)
                    : 0;

                return (
                  <div
                    key={idx}
                    className="p-3 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between text-xs"
                  >
                    <div>
                      <span className="font-bold text-slate-900">
                        {breed}
                      </span>
                      <span className="text-slate-400 text-[11px] block">
                        {count} cá thể
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="font-mono font-extrabold text-slate-900 text-sm">
                        {percent}%
                      </span>
                      <span className="text-[10px] text-slate-400 block">
                        Tổng quy mô đàn
                      </span>
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-center text-sm text-slate-400 py-8">
                Chưa có dữ liệu đàn bò
              </p>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
