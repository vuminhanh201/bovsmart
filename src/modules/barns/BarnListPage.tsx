import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFarmStore } from '../../store/useFarmStore';
import { useAuthStore } from '../../store/useAuthStore';
import { Barn } from '../../types';
import {
  getBarnCleaningLogsApi,
  createBarnCleaningLogApi,
  BarnCleaningLog,
} from '../../services/barnService';
import {
  Warehouse,
  Plus,
  Thermometer,
  Droplets,
  Wind,
  ArrowRight,
  X,
  Sparkles,
} from 'lucide-react';

export const BarnListPage: React.FC = () => {
  const navigate = useNavigate();

    const {
    barns,
    addBarn,
    addToast,
    fetchBarns,
  } = useFarmStore();

  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const totalPages = Math.max(1, Math.ceil(barns.length / pageSize));

  const paginatedBarns = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return barns.slice(startIndex, startIndex + pageSize);
  }, [barns, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [barns.length]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const { currentUser } = useAuthStore();
  console.log('CURRENT USER:', currentUser);
  console.log('ASSIGNED PENS:', currentUser?.assignedPens);

  const isStaff = currentUser.role === 'STAFF';

  const assignedBarnIds: string[] = currentUser.assignedPens ?? [];

  const hygieneBarns = isStaff
    ? barns.filter((barn) => assignedBarnIds.includes(barn.id))
    : barns;

  const [hygieneRecords, setHygieneRecords] = useState<BarnCleaningLog[]>([]);
  const [isLoadingHygiene, setIsLoadingHygiene] = useState(false);
  const [isSubmittingHygiene, setIsSubmittingHygiene] = useState(false);

  useEffect(() => {
    fetchBarns();
  }, [fetchBarns]);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isHygieneModalOpen, setIsHygieneModalOpen] = useState(false);

  const [hygieneForm, setHygieneForm] = useState({
    penId: '',
    date: new Date().toISOString().split('T')[0],
    content: 'Vệ sinh chuồng, quét dọn nền',
    otherCleaningType: '',
    note: 'Đã hoàn thành đúng quy trình an toàn sinh học VietGAP.',
  });

  useEffect(() => {
    if (hygieneBarns.length === 0) return;

    const currentBarnIsValid = hygieneBarns.some(
      (barn) => barn.code === hygieneForm.penId
    );

    if (!currentBarnIsValid) {
      setHygieneForm((prev) => ({
        ...prev,
        penId: hygieneBarns[0].code,
      }));
    }
  }, [hygieneBarns, hygieneForm.penId]);

  const fetchHygieneRecords = async () => {
    if (barns.length === 0) {
      setHygieneRecords([]);
      return;
    }

    setIsLoadingHygiene(true);

    try {
      const results = await Promise.all(
        barns
          .filter((barn) => barn.code)
          .map((barn) => getBarnCleaningLogsApi(barn.code))
      );

      const allRecords = results
        .flat()
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

      setHygieneRecords(allRecords);
    } catch (error) {
      addToast(
        'error',
        'Lỗi tải nhật ký vệ sinh',
        error instanceof Error ? error.message : 'Không thể tải lịch sử vệ sinh.'
      );
    } finally {
      setIsLoadingHygiene(false);
    }
  };

  useEffect(() => {
    if (barns.length > 0) {
      fetchHygieneRecords();
    }
  }, [barns]);

  const [formData, setFormData] = useState({
    code: '',
    name: '',
    type: 'FATTENING' as Barn['type'],
    capacity: 25,
    assignedStaff: currentUser.name,
    temperature: 27.5,
    humidity: 70,
    ammonia: 7.0,
    fanStatus: 'AUTO' as Barn['fanStatus'],
    waterSystem: 'NORMAL' as Barn['waterSystem'],
    lastCleaned: 'Hôm nay, 08:00',
    notes: '',
  });

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    addBarn(formData);
    setIsAddModalOpen(false);
  };

    const handleAddHygiene = async (e: React.FormEvent) => {
      e.preventDefault();

      if (isSubmittingHygiene) return;

      const targetBarn = hygieneBarns.find(
        (b) => b.code === hygieneForm.penId
      );

      if (!targetBarn) {
        addToast('error', 'Không tìm thấy chuồng', 'Vui lòng chọn lại khu chuồng.');
        return;
      }

      try {
        setIsSubmittingHygiene(true);

       const cleaningType =
        hygieneForm.content === 'Công việc khác'
          ? hygieneForm.otherCleaningType.trim()
          : hygieneForm.content;

      if (!cleaningType) {
        addToast('error', 'Thiếu nội dung công việc', 'Vui lòng nhập công việc cần thực hiện.');
        return;
      }

      await createBarnCleaningLogApi(targetBarn.code, {
        cleaningDate: hygieneForm.date,
        cleaningType,
        description: hygieneForm.note,
      });
        addToast(
          'success',
          'Ghi nhận thành công',
          `Nhật ký vệ sinh ${targetBarn.name} đã được lưu vào MongoDB.`
        );

        setIsHygieneModalOpen(false);

        await fetchHygieneRecords();
        await fetchBarns();
      } catch (error) {
        addToast(
          'error',
          'Không thể ghi nhận vệ sinh',
          error instanceof Error ? error.message : 'Đã xảy ra lỗi.'
        );
      } finally {
        setIsSubmittingHygiene(false);
      }
  };

  const openHygieneForBarn = (barnCode: string) => {
    const targetBarn = isStaff
      ? hygieneBarns[0]
      : hygieneBarns.find((barn) => barn.code === barnCode) ?? hygieneBarns[0];

    if (!targetBarn) {
      addToast(
        'error',
        'Chưa được phân công chuồng',
        'Tài khoản STAFF chưa được phân công chuồng để thực hiện vệ sinh.'
      );
      return;
    }

    setHygieneForm((prev) => ({
      ...prev,
      penId: targetBarn.code,
      date: new Date().toISOString().split('T')[0],
    }));

    setIsHygieneModalOpen(true);
  };

  const typeLabels: Record<Barn['type'], { label: string; color: string }> = {
    FATTENING: {
      label: 'Khu bò vỗ béo',
      color: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    },
    ADAPTATION: {
      label: 'Khu bò mới nhập - theo dõi thích nghi',
      color: 'bg-indigo-50 text-indigo-800 border-indigo-200',
    },
    QUARANTINE: {
      label: 'Khu cách ly thú y',
      color: 'bg-rose-50 text-rose-800 border-rose-200',
    },
    CALF: {
      label: 'Khu bò con',
      color: 'bg-sky-50 text-sky-800 border-sky-200',
    },
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900">Quản Lý Chuồng Trại & Vi Khí Hậu</h1>
            <span className="text-xs bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-full font-bold">
              {barns.length} phân khu chuồng
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Giám sát sức chứa , vi khí hậu IoT, nhật ký vệ sinh và điều phối đàn bò
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
        {['STAFF', 'FARM_MANAGER'].includes(currentUser.role) && (
          <button
            onClick={() => {
              if (barns.length > 0) {
                openHygieneForBarn(barns[0].code);
              }
            }}
            disabled={barns.length === 0}
            className="px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold rounded-xl cursor-pointer disabled:opacity-50"
          >
            <Sparkles className="w-4 h-4 inline mr-1" />
            Ghi Nhận Vệ Sinh
          </button>
        )}

          {currentUser.role === 'FARM_MANAGER' && (
            <button
              onClick={() => navigate('/barns/transfer')}
              className="px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <span>Điều Chuyển Bò</span>
              <ArrowRight className="w-4 h-4 text-slate-500" />
            </button>
          )}

         {currentUser.role === 'FARM_MANAGER' && (
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition-all shadow-md shadow-emerald-600/20 flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Thêm Chuồng</span>
            </button>
          )}
        </div>
      </div>

      {/* Barn Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {paginatedBarns.map((barn) => {
          const typeInfo = typeLabels[barn.type] || typeLabels.FATTENING;
          const occupancyPercent = Math.round((barn.currentCount / barn.capacity) * 100);

          return (
            <div
              key={barn.id}
              className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs hover:border-emerald-300 transition-all flex flex-col justify-between space-y-4"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block">
                      Phân Khu: {barn.code}
                    </span>
                    <h2 className="text-base font-extrabold text-slate-900 mt-0.5">{barn.name}</h2>
                  </div>
                  <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${typeInfo.color}`}>
                    {typeInfo.label}
                  </span>
                </div>

                <p className="text-xs text-slate-500">{barn.notes || 'Chuồng đạt chuẩn an toàn sinh học.'}</p>

                {/* Capacity Progress Bar */}
                <div className="mt-4 p-3 bg-slate-50 rounded-2xl border border-slate-100">
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="font-semibold text-slate-700">Mật độ nuôi dưỡng:</span>
                    <span className="font-mono font-bold text-slate-900">
                      {barn.currentCount} / {barn.capacity} con ({occupancyPercent}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-2 rounded-full transition-all ${
                        occupancyPercent > 90
                          ? 'bg-rose-500'
                          : occupancyPercent > 70
                          ? 'bg-amber-500'
                          : 'bg-emerald-500'
                      }`}
                      style={{ width: `${Math.min(100, occupancyPercent)}%` }}
                    ></div>
                  </div>
                </div>

                {/* IoT Microclimate Sensors */}
                <div className="grid grid-cols-3 gap-2.5 mt-3 text-center">
                  <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                    <div className="flex items-center justify-center gap-1 text-[10px] text-slate-400 mb-0.5">
                      <Thermometer className="w-3.5 h-3.5 text-amber-500" />
                      <span>Nhiệt độ</span>
                    </div>
                    <span className="text-sm font-extrabold text-slate-900 font-mono">{barn.temperature}°C</span>
                  </div>

                  <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                    <div className="flex items-center justify-center gap-1 text-[10px] text-slate-400 mb-0.5">
                      <Droplets className="w-3.5 h-3.5 text-sky-500" />
                      <span>Độ ẩm</span>
                    </div>
                    <span className="text-sm font-extrabold text-slate-900 font-mono">{barn.humidity}%</span>
                  </div>

                  <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                    <div className="flex items-center justify-center gap-1 text-[10px] text-slate-400 mb-0.5">
                      <Wind className="w-3.5 h-3.5 text-emerald-500" />
                      <span>Khí NH3</span>
                    </div>
                    <span className="text-sm font-extrabold text-slate-900 font-mono">{barn.ammonia} ppm</span>
                  </div>
                </div>

                {/* Additional Stats */}
                <div className="mt-3 flex flex-wrap items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-100">
                  <span>Nhân viên phụ trách: <strong className="text-slate-800">{barn.assignedStaff}</strong></span>
                  <span>Vệ sinh: {barn.lastCleaned}</span>
                </div>
              </div>

             {/* Action Buttons */}
              {currentUser.role === 'FARM_MANAGER' && (
                <div className="flex items-center justify-end pt-2 border-t border-slate-100">
                  <button
                    onClick={() => navigate('/barns/transfer')}
                    className="px-3.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold rounded-xl transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <span>Xem & Chuyển bò</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {barns.length > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white border border-slate-200 rounded-2xl px-4 py-3">
          <p className="text-xs text-slate-500">
            Đang hiển thị{' '}
            <strong className="text-slate-800">
              {(currentPage - 1) * pageSize + 1}
              {' - '}
              {Math.min(currentPage * pageSize, barns.length)}
            </strong>
            {' / '}
            <strong className="text-slate-800">{barns.length}</strong>
            {' '}chuồng
          </p>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={currentPage === 1}
              onClick={() =>
                setCurrentPage((previous) => Math.max(1, previous - 1))
              }
              className="px-3 py-2 text-xs font-semibold rounded-lg border border-slate-200 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50"
            >
              Trang trước
            </button>

            <span className="text-xs font-bold text-slate-700 px-2">
              Trang {currentPage} / {totalPages}
            </span>

            <button
              type="button"
              disabled={currentPage >= totalPages}
              onClick={() =>
                setCurrentPage((previous) =>
                  Math.min(totalPages, previous + 1)
                )
              }
              className="px-3 py-2 text-xs font-semibold rounded-lg border border-slate-200 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50"
            >
              Trang sau
            </button>
          </div>
        </div>
      )}

      {/* Hygiene Records Section (FR-PEN-06) */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-600" />
              <h2 className="text-base font-bold text-slate-900">Nhật Ký Vệ Sinh & Tiêu Độc Khử Trùng</h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Lưu trữ lịch sử tiêu độc khử trùng, quét rửa máng ăn, xử lý chất thải theo tiêu chuẩn an toàn sinh học
            </p>
          </div>
          {['STAFF', 'FARM_MANAGER'].includes(currentUser.role) && (
            <button
              onClick={() => {
                if (barns.length > 0) {
                  openHygieneForBarn(barns[0].code);
                }
              }}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer"
            >
              + Ghi Nhận Mới
            </button>
          )}
        </div>

        {isLoadingHygiene ? (
          <div className="text-center py-8 text-slate-500 text-xs">
            Đang tải nhật ký vệ sinh...
          </div>
        ) : hygieneRecords.length === 0 ? (
          <div className="text-center py-8 text-slate-400 text-xs">
            Chưa có nhật ký vệ sinh nào được ghi nhận.
          </div>
        ) : (
          <div className="overflow-x-auto border border-slate-100 rounded-2xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">Ngày thực hiện</th>
                  <th className="py-2.5 px-3">Khu chuồng</th>
                  <th className="py-2.5 px-3">Nội dung công việc</th>
                  <th className="py-2.5 px-3">Người thực hiện</th>
                  <th className="py-2.5 px-3">Ghi chú</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {hygieneRecords.map((rec) => (
                  <tr key={rec.id} className="hover:bg-slate-50">
                    <td className="py-2.5 px-3 font-mono font-bold text-slate-800">
                      {rec.cleaningDate}
                    </td>
                    <td className="py-2.5 px-3 font-semibold text-emerald-800">
                      {rec.barnName}
                    </td>
                    <td className="py-2.5 px-3 text-slate-700">
                      {rec.cleaningType}
                    </td>
                    <td className="py-2.5 px-3 text-slate-600">
                      {rec.cleanedBy}
                    </td>
                    <td className="py-2.5 px-3 text-slate-400">
                      {rec.description || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Barn Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="text-base font-bold text-slate-900">Khởi Tạo Khu Chuồng Mới</h3>
              <button onClick={() => setIsAddModalOpen(false)} className="p-1 rounded-lg text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAdd} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Mã chuồng
                </label>
                <input
                  type="text"
                  required
                  value={formData.code}
                  onChange={(e) =>
                    setFormData({ ...formData, code: e.target.value.toUpperCase() })
                  }
                  placeholder="Ví dụ: A3"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Loại chuồng</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as Barn['type'] })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-semibold"
                  >
                    <option value="FATTENING">Khu bò vỗ béo</option>
                    <option value="ADAPTATION">Khu bò mới nhập - theo dõi thích nghi</option>
                    <option value="QUARANTINE">Khu cách ly thú y</option>
                    <option value="CALF">Khu bò con</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Sức chứa tối đa (con)</label>
                  <input
                    type="number"
                    required
                    value={formData.capacity}
                    onChange={(e) => setFormData({ ...formData, capacity: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nhân sự phụ trách chuồng</label>
                <input
                  type="text"
                  required
                  value={formData.assignedStaff}
                  onChange={(e) => setFormData({ ...formData, assignedStaff: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Ghi chú vận hành</label>
                <textarea
                  rows={2}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Quy trình thông gió, vệ sinh máng nước..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-semibold cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-md shadow-emerald-600/20 cursor-pointer"
                >
                  Tạo Chuồng Trại
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Hygiene Recording Modal (FR-PEN-06) */}
      {isHygieneModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-emerald-600" />
                <h3 className="text-base font-bold text-slate-900">Ghi Nhận Vệ Sinh Chuồng</h3>
              </div>
              <button onClick={() => setIsHygieneModalOpen(false)} className="p-1 rounded-lg text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddHygiene} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Khu Chuồng Thực Hiện</label>
                <select
                  value={hygieneForm.penId}
                  onChange={(e) =>
                    setHygieneForm({ ...hygieneForm, penId: e.target.value })
                  }
                  disabled={isStaff}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-semibold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 disabled:bg-slate-100 disabled:cursor-not-allowed"
                >
                  {hygieneBarns.map((b) => (
                    <option key={b.id} value={b.code}>
                      {b.name} ({b.code})
                    </option>
                  ))}
                </select>

                {isStaff && (
                  <p className="mt-1 text-[11px] text-slate-500">
                    Chuồng được tự động chọn theo phân công của nhân viên.
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Ngày thực hiện</label>
                  <input
                    type="date"
                    required
                    value={hygieneForm.date}
                    onChange={(e) => setHygieneForm({ ...hygieneForm, date: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 font-mono text-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Loại công việc
                </label>

                <select
                  value={hygieneForm.content}
                  onChange={(e) =>
                    setHygieneForm({
                      ...hygieneForm,
                      content: e.target.value,
                      otherCleaningType: '',
                    })
                  }
                  required
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-800"
                >
                  <option value="Vệ sinh chuồng, quét dọn nền">
                    Vệ sinh chuồng, quét dọn nền
                  </option>
                  <option value="Phun thuốc sát trùng">
                    Phun thuốc sát trùng
                  </option>
                  <option value="Rắc vôi bột khử trùng">
                    Rắc vôi bột khử trùng
                  </option>
                  <option value="Vệ sinh máng ăn, máng uống">
                    Vệ sinh máng ăn, máng uống
                  </option>
                  <option value="Thu gom và xử lý chất thải">
                    Thu gom và xử lý chất thải
                  </option>
                  <option value="Khử trùng toàn bộ khu chuồng">
                    Khử trùng toàn bộ khu chuồng
                  </option>
                  <option value="Công việc khác">
                    Công việc khác
                  </option>
                </select>

                {hygieneForm.content === 'Công việc khác' && (
                  <input
                    type="text"
                    required
                    autoFocus
                    value={hygieneForm.otherCleaningType}
                    onChange={(e) =>
                      setHygieneForm({
                        ...hygieneForm,
                        otherCleaningType: e.target.value,
                      })
                    }
                    placeholder="Nhập nội dung công việc khác..."
                    className="w-full mt-2 px-3 py-2 rounded-xl border border-emerald-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800"
                  />
                )}
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Ghi chú thêm</label>
                <input
                  type="text"
                  value={hygieneForm.note}
                  onChange={(e) => setHygieneForm({ ...hygieneForm, note: e.target.value })}
                  placeholder="Hóa chất sử dụng, tình trạng máng uống..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-800"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsHygieneModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-semibold cursor-pointer"
                >
                  Hủy Bỏ
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingHygiene}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-md shadow-emerald-600/20 cursor-pointer disabled:opacity-50"
                >
                  {isSubmittingHygiene ? 'Đang lưu...' : 'Lưu Nhật Ký Vệ Sinh'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
