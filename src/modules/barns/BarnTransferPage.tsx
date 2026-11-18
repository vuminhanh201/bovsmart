import React, { useEffect, useState } from 'react';
import { useFarmStore } from '../../store/useFarmStore';
import { useAuthStore } from '../../store/useAuthStore';
import {
  ArrowLeftRight,
  Warehouse,
  CheckCircle2,
  AlertCircle,
  Radio,
  Scale,
  Sparkles,
  Link2,
} from 'lucide-react';

export const BarnTransferPage: React.FC = () => {
  const {
    barns,
    cattle,
    fetchCattle,
    fetchBarns,
    transferCattle,
    auditLogs,
    addToast,
  } = useFarmStore();

  const { currentUser } = useAuthStore();

  const [selectedCattleId, setSelectedCattleId] = useState('');
  const [targetPenId, setTargetPenId] = useState('');
  const [reason, setReason] = useState('Chuyển sang chuồng vỗ béo tăng tốc');

  useEffect(() => {
    fetchCattle();
    fetchBarns();
  }, [fetchCattle, fetchBarns]);

  useEffect(() => {
    if (
      cattle.length > 0 &&
      !cattle.some((cow) => cow.id === selectedCattleId)
    ) {
      setSelectedCattleId(cattle[0].id);
    }
  }, [cattle, selectedCattleId]);

  const selectedCow = cattle.find((c) => c.id === selectedCattleId);

  useEffect(() => {
    if (
      barns.length > 0 &&
      !barns.some((barn) => barn.code === targetPenId)
    ) {
      const availableBarn = barns.find(
        (barn) => barn.code !== selectedCow?.penId
      );

      if (availableBarn) {
        setTargetPenId(availableBarn.code);
      }
    }
  }, [barns, targetPenId, selectedCow?.penId]);

  const currentBarn = selectedCow
    ? barns.find((b) => b.code === selectedCow.penId)
    : null;

  const targetBarn = barns.find((b) => b.code === targetPenId);

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedCow || !targetBarn) return;

    if (selectedCow.penId === targetBarn.code) {
      addToast('warning', 'Trùng Chuồng', 'Bò hiện đã ở trong chuồng bạn chọn!');
      return;
    }

    if (targetBarn.currentCount >= targetBarn.capacity) {
      addToast(
        'error',
        'Chuồng Đã Đầy',
        `${targetBarn.name} đã đạt công suất tối đa (${targetBarn.capacity} con).`
      );
      return;
    }

    try {
      await transferCattle(
        selectedCow.id,
        targetBarn.code,
        currentUser.name,
        currentUser.role,
        reason
      );
    } catch (error) {
      console.error('Lỗi điều chuyển bò:', error);
    }
  };

  const transferLogs = auditLogs.filter(
    (l) => l.action === 'TRANSFER_CATTLE'
  );

  const canTransfer = currentUser.role === 'FARM_MANAGER';

  if (!canTransfer) {
    return (
      <div className="bg-white rounded-3xl border border-slate-200 p-8 text-center">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-rose-50 text-rose-500 flex items-center justify-center">
          <AlertCircle className="w-7 h-7" />
        </div>

        <h2 className="mt-4 text-base font-bold text-slate-900">
          Không có quyền truy cập
        </h2>

        <p className="mt-2 text-sm text-slate-500">
          Chỉ Quản lý trang trại mới được truy cập chức năng điều chuyển bò.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Chi Tiết Chuồng & Điều Chuyển Đàn Bò</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Quy trình điều động bò giữa các phân khu chuồng với lưu vết bất biến trên sổ cái Blockchain
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Transfer Form */}
        <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-5">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <ArrowLeftRight className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">Lập Lệnh Điều Chuyển Chuồng Nuôi</h2>
              <p className="text-[11px] text-slate-500">Cập nhật mật độ chuồng tự động và ghi nhận nhật ký thao tác</p>
            </div>
          </div>

          {canTransfer ? (
            <form onSubmit={handleTransfer} className="space-y-4 text-xs">
            {/* Step 1: Pick Cattle */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1.5">1. Chọn cá thể bò cần điều chuyển</label>
              <select
                value={selectedCattleId}
                onChange={(e) => setSelectedCattleId(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                {cattle.map((c) => {
                  const b = barns.find((bn) => bn.code === c.penId);
                  return (
                    <option key={c.id} value={c.id}>
                      {c.id} - {c.name} ({c.breed}, {c.weight} kg) • Đang ở: {b ? b.name : c.penId}
                    </option>
                  );
                })}
              </select>
            </div>

            {/* Visual Movement representation */}
            {selectedCow && (
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 grid grid-cols-1 sm:grid-cols-3 gap-3 items-center text-center">
                <div className="p-3 bg-white rounded-xl border border-slate-200">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">Chuồng Hiện Tại</span>
                  <p className="font-bold text-slate-900 mt-0.5 truncate">{currentBarn?.name || 'Không xác định'}</p>
                  <span className="text-[10px] text-slate-500 font-mono">
                    Sức chứa: {currentBarn?.currentCount}/{currentBarn?.capacity} con
                  </span>
                </div>

                <div className="flex flex-col items-center justify-center text-emerald-600">
                  <ArrowLeftRight className="w-6 h-6 animate-pulse" />
                  <span className="text-[10px] font-bold mt-1">Điều chuyển sang</span>
                </div>

                <div className="p-3 bg-white rounded-xl border border-emerald-200 shadow-2xs">
                  <span className="text-[10px] text-emerald-700 uppercase font-semibold block">Chuồng Đích</span>
                  <p className="font-bold text-emerald-950 mt-0.5 truncate">{targetBarn?.name || 'Chọn chuồng đích'}</p>
                  <span className="text-[10px] text-emerald-600 font-mono">
                    Hiện có: {targetBarn?.currentCount}/{targetBarn?.capacity} con
                  </span>
                </div>
              </div>
            )}

            {/* Step 2: Pick Target Barn */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1.5">2. Chọn phân khu chuồng đến</label>
              <select
                value={targetPenId}
                onChange={(e) => setTargetPenId(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                {barns.map((b) => (
                  <option
                    key={b.id}
                    value={b.code}
                    disabled={b.code === selectedCow?.penId}
                  >
                    {b.name} ({b.code}) - {b.currentCount}/{b.capacity}
                  </option>
                ))}
              </select>
            </div>

            {/* Reason */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1.5">3. Lý do điều chuyển</label>
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 mb-2"
              >
                <option value="Chuyển sang chuồng vỗ béo tăng tốc">Chuyển sang chuồng vỗ béo tăng tốc</option>
                <option value="Cách ly điều trị bệnh thú y">Cách ly điều trị bệnh thú y (Chuồng C1)</option>
                <option value="Bò đạt chuẩn xuất bán, chuyển sang chuồng tập kết A1">
                  Bò đạt chuẩn xuất bán, chuyển sang chuồng tập kết A1
                </option>
                <option value="Phân loại theo lứa tuổi và trọng lượng">Phân loại theo lứa tuổi và trọng lượng</option>
                <option value="Khác (Ghi chú tùy chọn)">Khác (Ghi chú tùy chọn)</option>
              </select>
            </div>

            {/* Confirm button */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[11px] text-slate-500">
                Người thực hiện: <strong className="text-slate-800">{currentUser.name}</strong> ({currentUser.role})
              </span>
              <button
                type="submit"
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition-all shadow-md shadow-emerald-600/20 flex items-center gap-1.5 cursor-pointer"
              >
                <Sparkles className="w-4 h-4" />
                <span>Thực Hiện Điều Chuyển</span>
              </button>
            </div>
          </form>
          ) : (
            <div className="rounded-xl bg-slate-50 border border-slate-200 p-4 text-sm text-slate-600">
              Bạn không có quyền điều chuyển bò. Chỉ Quản lý trang trại mới được thực hiện nghiệp vụ này.
            </div>
          )}
          </div>

        {/* Right: Transfer History Log */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Lịch Sử Điều Chuyển Gần Đây</h3>
            <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-mono">
              {transferLogs.length} lần
            </span>
          </div>

          {transferLogs.length === 0 ? (
            <p className="text-xs text-slate-400 py-6 text-center">Chưa có lệnh điều chuyển nào phát sinh.</p>
          ) : (
            <div className="space-y-3">
              {transferLogs.slice(0, 5).map((log) => (
                <div key={log.id} className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900">{log.userName}</span>
                    <span className="text-[10px] text-slate-400 font-mono">{log.timestamp}</span>
                  </div>
                  <p className="text-slate-600 text-[11px] leading-relaxed">{log.details}</p>
                  <div className="flex items-center gap-1 text-[10px] text-indigo-600 pt-0.5 font-semibold">
                    <Link2 className="w-3 h-3" />
                    <span>Đã ký chứng nhận chuỗi khối</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
