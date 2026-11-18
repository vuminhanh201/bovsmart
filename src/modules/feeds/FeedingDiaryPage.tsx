
import React, { useCallback, useEffect, useState } from 'react';
import { getAllBarnsApi } from '../../services/barnService';
import { Barn } from '../../types';
import {
  Search,
  RefreshCw,
  CalendarDays,
  ClipboardList,
  CheckCircle2,
  Clock,
  User,
  Warehouse,
  FileText,
} from 'lucide-react';

import {
  getFeedingDiaryApi,
  FeedingShiftRecord,
} from '../../services/dailyFeedingService';

export default function FeedingDiaryPage() {
  const [records, setRecords] = useState<FeedingShiftRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [barns, setBarns] = useState<Barn[]>([]);
  const [barnsLoading, setBarnsLoading] = useState(false);

  const [barnId, setBarnId] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [keyword, setKeyword] = useState('');

  const loadDiary = useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      const data = await getFeedingDiaryApi({
        barnId: barnId.trim() || undefined,
        fromDate: fromDate || undefined,
        toDate: toDate || undefined,
        keyword: keyword.trim() || undefined,
      });

      // Chỉ hiển thị kết quả đã được quản lý duyệt.
      setRecords(
        (data || []).filter(
          (record) => record.recordStatus === 'APPROVED'
        )
      );
    } catch (err) {
      setRecords([]);
      setError(
        err instanceof Error
          ? err.message
          : 'Không thể tải nhật ký cho ăn.'
      );
    } finally {
      setLoading(false);
    }
  }, [barnId, fromDate, toDate, keyword]);

  useEffect(() => {
    loadDiary();
  }, [loadDiary]);

  const formatDate = (value?: string) => {
    if (!value) return '—';

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;

    return date.toLocaleDateString('vi-VN');
  };

  const formatDateTime = (value?: string) => {
    if (!value) return '—';

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;

    return date.toLocaleString('vi-VN');
  };

  useEffect(() => {
    const loadBarns = async () => {
        try {
        setBarnsLoading(true);
        const data = await getAllBarnsApi();
        setBarns(data);
        } catch (err) {
        console.error('Không thể tải danh sách chuồng:', err);
        } finally {
        setBarnsLoading(false);
        }
    };

    loadBarns();
    }, []);

  const formatQuantity = (value: number) =>
    Number(value || 0).toLocaleString('vi-VN', {
      maximumFractionDigits: 2,
    });

  return (
    <div className="space-y-6">
      {/* Tiêu đề */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <ClipboardList className="text-emerald-600" size={26} />
            <h1 className="text-2xl font-bold text-slate-800">
              Nhật Ký Cho Ăn
            </h1>
          </div>

          <p className="mt-1 text-sm text-slate-500">
            Theo dõi kết quả cho ăn thực tế đã được quản lý xác nhận.
          </p>
        </div>

        <button
          type="button"
          onClick={loadDiary}
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <RefreshCw
            size={16}
            className={loading ? 'animate-spin' : ''}
          />
          Làm mới
        </button>
      </div>

      {/* Bộ lọc */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="mb-4 font-semibold text-slate-700">
          Bộ lọc nhật ký
        </h2>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
         <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-600">
                Tên chuồng
            </label>

            <div className="relative">
                <Warehouse
                size={17}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <select
                value={barnId}
                onChange={(e) => setBarnId(e.target.value)}
                disabled={barnsLoading}
                className="w-full rounded-lg border border-slate-300 bg-white py-2.5 pl-10 pr-3 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                >
                <option value="">
                    {barnsLoading ? 'Đang tải danh sách chuồng...' : 'Tất cả chuồng'}
                </option>

                {barns.map((barn) => (
                    <option key={barn.id} value={barn.id}>
                    {barn.name} ({barn.code})
                    </option>
                ))}
                </select>
            </div>
            </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-600">
              Từ ngày
            </label>
            <div className="relative">
              <CalendarDays
                size={17}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="date"
                value={fromDate}
                max={toDate || undefined}
                onChange={(e) => setFromDate(e.target.value)}
                className="w-full rounded-lg border border-slate-300 py-2.5 pl-10 pr-3 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-600">
              Đến ngày
            </label>
            <div className="relative">
              <CalendarDays
                size={17}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="date"
                value={toDate}
                min={fromDate || undefined}
                onChange={(e) => setToDate(e.target.value)}
                className="w-full rounded-lg border border-slate-300 py-2.5 pl-10 pr-3 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-600">
              Tìm kiếm
            </label>
            <div className="relative">
              <Search
                size={17}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder="Mã chuồng, ca, nhân viên..."
                className="w-full rounded-lg border border-slate-300 py-2.5 pl-10 pr-3 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
              />
            </div>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={loadDiary}
            disabled={loading}
            className="rounded-lg bg-emerald-600 px-5 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-60"
          >
            Áp dụng bộ lọc
          </button>

          <button
            type="button"
            onClick={() => {
              setBarnId('');
              setFromDate('');
              setToDate('');
              setKeyword('');
            }}
            className="rounded-lg border border-slate-300 px-5 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
          >
            Xóa bộ lọc
          </button>
        </div>
      </div>

      {/* Thống kê */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">
                Tổng số ca đã duyệt
              </p>
              <p className="mt-2 text-2xl font-bold text-slate-800">
                {records.length}
              </p>
            </div>
            <div className="rounded-full bg-emerald-50 p-3 text-emerald-600">
              <CheckCircle2 size={24} />
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">
                Tổng số loại thức ăn ghi nhận
              </p>
              <p className="mt-2 text-2xl font-bold text-slate-800">
                {records.reduce(
                  (total, record) => total + (record.feeds?.length || 0),
                  0
                )}
              </p>
            </div>
            <div className="rounded-full bg-blue-50 p-3 text-blue-600">
              <FileText size={24} />
            </div>
          </div>
        </div>
      </div>

      {/* Thông báo */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
          {error.includes('403') && (
            <p className="mt-1">
              Tài khoản hiện tại không có quyền xem nhật ký cho ăn.
            </p>
          )}
        </div>
      )}

      {/* Danh sách */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-2 border-b border-slate-200 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="font-semibold text-slate-800">
            Danh sách kết quả cho ăn
          </h2>
          <span className="text-sm text-slate-500">
            {records.length} kết quả
          </span>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-14 text-slate-500">
            <RefreshCw size={28} className="mb-3 animate-spin text-emerald-600" />
            <p className="text-sm">Đang tải nhật ký cho ăn...</p>
          </div>
        ) : records.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-4 py-14 text-center">
            <ClipboardList size={42} className="mb-3 text-slate-300" />
            <p className="font-medium text-slate-600">
              Chưa có nhật ký cho ăn
            </p>
            <p className="mt-1 text-sm text-slate-400">
              Kết quả sẽ xuất hiện sau khi quản lý duyệt ca cho ăn.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {records.map((record) => (
              <div
                key={record.id}
                className="p-4 transition hover:bg-slate-50"
              >
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-semibold text-slate-800">
                        {record.barnCode || 'Chưa xác định chuồng'}
                      </h3>

                      <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-700">
                        Đã duyệt
                      </span>

                      <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-600">
                        {record.shiftName || 'Chưa xác định ca'}
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-slate-500">
                      <span className="inline-flex items-center gap-1.5">
                        <CalendarDays size={15} />
                        {formatDate(record.feedingDate)}
                      </span>

                      <span className="inline-flex items-center gap-1.5">
                        <User size={15} />
                        Người thực hiện: {record.performedBy || '—'}
                      </span>

                      <span className="inline-flex items-center gap-1.5">
                        <Clock size={15} />
                        Ghi nhận: {formatDateTime(record.performedAt)}
                      </span>
                    </div>

                    <p className="text-xs text-slate-400">
                      Mã lịch: {record.scheduleCode || '—'}
                    </p>
                  </div>

                  <div className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
                    <p className="font-medium">
                      Người duyệt: {record.reviewedBy || '—'}
                    </p>
                    <p className="mt-1 text-xs">
                      {formatDateTime(record.reviewedAt)}
                    </p>
                  </div>
                </div>

                {/* Chi tiết thức ăn */}
                <div className="mt-4 overflow-x-auto rounded-lg border border-slate-200">
                  <table className="w-full min-w-[520px] text-left text-sm">
                    <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                      <tr>
                        <th className="px-4 py-3 font-medium">
                          Tên thức ăn
                        </th>
                        <th className="px-4 py-3 text-right font-medium">
                          Lượng dự kiến
                        </th>
                        <th className="px-4 py-3 text-right font-medium">
                          Lượng thực tế
                        </th>
                        <th className="px-4 py-3 text-center font-medium">
                          Đơn vị
                        </th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-slate-100">
                      {(record.feeds || []).map((feed, index) => (
                        <tr key={`${feed.feedId}-${index}`}>
                          <td className="px-4 py-3 font-medium text-slate-700">
                            {feed.feedName || 'Chưa có tên'}
                          </td>
                          <td className="px-4 py-3 text-right text-slate-600">
                            {formatQuantity(feed.plannedQuantity)}
                          </td>
                          <td className="px-4 py-3 text-right font-semibold text-emerald-700">
                            {formatQuantity(feed.actualQuantity)}
                          </td>
                          <td className="px-4 py-3 text-center text-slate-500">
                            {feed.unit || '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Ghi chú */}
                {(record.note || record.reviewNote) && (
                  <div className="mt-3 grid grid-cols-1 gap-2 text-sm md:grid-cols-2">
                    {record.note && (
                      <div className="rounded-lg bg-slate-50 p-3">
                        <p className="mb-1 font-medium text-slate-600">
                          Ghi chú của nhân viên
                        </p>
                        <p className="whitespace-pre-wrap text-slate-500">
                          {record.note}
                        </p>
                      </div>
                    )}

                    {record.reviewNote && (
                      <div className="rounded-lg bg-blue-50 p-3">
                        <p className="mb-1 font-medium text-blue-700">
                          Ghi chú của quản lý
                        </p>
                        <p className="whitespace-pre-wrap text-blue-600">
                          {record.reviewNote}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
