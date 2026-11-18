import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useFarmStore } from '../../store/useFarmStore';
import { useAuthStore } from '../../store/useAuthStore';
import { getCattleImageUrlApi } from '../../services/fileService';
import { CattleFormModal } from './CattleFormModal';
import { QRCodeSVG } from 'qrcode.react';
import {
  ArrowLeft,
  Radio,
  Scale,
  Calendar,
  Warehouse,
  ShieldCheck,
  QrCode,
  Link2,
  HeartPulse,
  TrendingUp,
  Clock,
  Edit2,
  Share2,
  Printer,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';

export const CattleDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { cattle, barns, healthRecords, vaccinations, simulateScanRfid, addToast, assignRfidTag, updateCattle } = useFarmStore();
  const { currentUser } = useAuthStore();

  const [activeTab, setActiveTab] = useState<'info' | 'weight' | 'health' | 'blockchain'>('info');
  const [minioImageUrl, setMinioImageUrl] = useState<string | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);
  const [showRfidModal, setShowRfidModal] = useState(false);

  const cow = cattle.find((c) => c.id === id);

  const cattleTraceUrl = cow
    ? `${window.location.origin}/trace/${encodeURIComponent(cow.id)}`
    : '';

  useEffect(() => {
    let cancelled = false;

    const loadImage = async () => {
      const photoUrl = cow?.photoUrl?.trim();

      if (!photoUrl?.startsWith('minio:')) {
        setMinioImageUrl(photoUrl || null);
        return;
      }

      const fileId = photoUrl.slice(6);

      try {
        const response = await getCattleImageUrlApi(fileId);

        if (!cancelled) {
          setMinioImageUrl(response.url);
        }
      } catch (error) {
        console.error('Không thể tải ảnh MinIO:', error);

        if (!cancelled) {
          setMinioImageUrl(null);
        }
      }
    };

    loadImage();

    return () => {
      cancelled = true;
    };
  }, [cow?.photoUrl]);

  const [newRfid, setNewRfid] = useState(cow?.rfidTag || '');

  if (!cow) {
    return (
      <div className="text-center py-16 space-y-3">
        <p className="text-base font-bold text-slate-800">Không tìm thấy hồ sơ cá thể bò này!</p>
        <button
          onClick={() => navigate('/cattle')}
          className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-semibold"
        >
          Quay lại danh sách
        </button>
      </div>
    );
  }

  const barn = barns.find((b) => b.id === cow.penId);
  const cowHealthLogs = healthRecords.filter((h) => h.cattleId === cow.id);

  // Calculate ADG (Average Daily Gain)
  const history = cow.weightHistory;
  const initial = cow.initialWeight;
  const totalGain = cow.weight - initial;
  const adg = history.length > 1 ? (totalGain / (history.length * 30)).toFixed(2) : '1.10';

  const handleSimulateWeigh = () => {
    simulateScanRfid(cow.rfidTag);
    navigate('/simulation');
    addToast('info', 'Chuyển Đến Trạm Cân', `Đã tải thẻ RFID ${cow.rfidTag} vào bàn cân điện tử mô phỏng.`);
  };

  const handleAssignRfid = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRfid.trim()) {
      addToast('warning', 'Thiếu Mã RFID', 'Vui lòng nhập mã RFID hợp lệ.');
      return;
    }
    const res = assignRfidTag(cow.id, newRfid.trim(), currentUser?.name || 'Quản lý');
    if (res.success) {
      setShowRfidModal(false);
    }
  };

  const handleStatusChange = (newStatus: string) => {
    updateCattle(
      cow.id,
      { status: newStatus as any },
      currentUser?.name || 'Quản lý',
      currentUser?.role || 'FARM_MANAGER'
    );
    addToast('success', 'Cập Nhật Trạng Thái (FR-COW-06)', `Đã chuyển trạng thái bò ${cow.id} sang ${newStatus}.`);
  };

  return (
    <div className="space-y-6">
      {/* Top back button & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <button
          onClick={() => navigate('/cattle')}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft className="w-4 h-4" /> Quay lại danh sách bò
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={handleSimulateWeigh}
            className="px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
          >
            <Scale className="w-4 h-4 text-emerald-600" />
            <span>Đưa Vào Cân Mô Phỏng (FR-IOT-02)</span>
          </button>

          <button
            onClick={() => setShowRfidModal(true)}
            className="px-3 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-semibold rounded-xl flex items-center gap-1.5"
            title="Gán hoặc đổi mã RFID cho bò (FR-COW-07)"
          >
            <Radio className="w-4 h-4 text-emerald-600" />
            <span>Gán RFID (FR-COW-07)</span>
          </button>

          <button
            onClick={() => setShowQrModal(true)}
            className="px-3 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-semibold rounded-xl flex items-center gap-1.5"
          >
            <QrCode className="w-4 h-4 text-slate-500" />
            <span>Mã QR Truy Xuất</span>
          </button>

          <button
            onClick={() => setIsEditModalOpen(true)}
            className="px-3 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-semibold rounded-xl flex items-center gap-1.5"
          >
            <Edit2 className="w-4 h-4 text-slate-500" />
            <span>Sửa Hồ Sơ</span>
          </button>
        </div>
      </div>

      {/* Hero Profile Header */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs overflow-hidden">
        <div className="flex flex-col lg:flex-row gap-6">
          <div className="w-full lg:w-72 aspect-video lg:aspect-square rounded-2xl overflow-hidden bg-slate-100 shrink-0 relative">
            <img
              src={minioImageUrl || '/assets/aiStudio/cattle-default.png'}
              alt={cow.name}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.currentTarget.src = '/assets/aiStudio/cattle-default.png';
              }}
      />
            <div className="absolute top-3 left-3 bg-slate-900/80 backdrop-blur-md text-white text-[10px] font-mono font-bold px-2.5 py-1 rounded-lg">
              {cow.id}
            </div>
            <div className="absolute bottom-3 left-3 right-3 bg-white/90 backdrop-blur-md rounded-xl p-2 text-center text-xs">
              <span className="font-bold text-slate-900">{cow.weight} kg</span>
              <span className="text-[10px] text-slate-500 block">Mục tiêu: {cow.targetMarketWeight} kg</span>
            </div>
          </div>

          <div className="flex-1 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900">{cow.name}</h1>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    {cow.breed}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Nguồn gốc: <span className="font-semibold text-slate-700">{cow.origin}</span> • Nhập chuồng: {cow.entryDate}
                </p>
              </div>

              {/* Status Badge & Selector (FR-COW-06) */}
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl">
                  <span className="text-[11px] text-slate-500 font-semibold">Trạng thái (FR-COW-06):</span>
                  <select
                    value={cow.status}
                    onChange={(e) => handleStatusChange(e.target.value)}
                    className="text-xs font-bold bg-white text-slate-800 border border-slate-200 rounded-lg px-2 py-1 outline-hidden focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                  >
                    <option value="DANG_NUOI">Đang Nuôi Vỗ Béo</option>
                    <option value="CAN_THEO_DOI">Cần Theo Dõi</option>
                    <option value="DANG_DIEU_TRI">Đang Điều Trị Y Tế</option>
                    <option value="DU_DIEU_KIEN_XUAT_BAN">Đủ Điều Kiện Xuất Bán</option>
                    <option value="DA_XUAT_BAN">Đã Xuất Bán</option>
                  </select>
                </div>

                {cow.status === 'DU_DIEU_KIEN_XUAT_BAN' && (
                  <span className="px-3 py-1.5 bg-emerald-600 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5 animate-pulse">
                    <Sparkles className="w-3.5 h-3.5" />
                    Đạt Tiêu Chuẩn Xuất Bán
                  </span>
                )}
                {cow.status === 'DA_XUAT_BAN' && (
                  <span className="px-3 py-1.5 bg-slate-700 text-white font-bold text-xs rounded-xl shadow-xs">
                    Đã Xuất Bán
                  </span>
                )}
              </div>
            </div>

            {/* Quick Stat Tags */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-[10px] text-slate-400 uppercase font-semibold">Thẻ Tai RFID</span>
                <p className="text-xs font-mono font-extrabold text-slate-800 truncate mt-0.5">{cow.rfidTag}</p>
                <span className="text-[10px] text-slate-400">Số tai: {cow.earTagNumber}</span>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-[10px] text-slate-400 uppercase font-semibold">Vị Trí Chuồng</span>
                <p className="text-xs font-bold text-slate-800 truncate mt-0.5">{barn?.name || cow.penId}</p>
                <span className="text-[10px] text-emerald-600 font-medium">Vi khí hậu đạt chuẩn</span>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-[10px] text-slate-400 uppercase font-semibold">Tăng Trọng ADG</span>
                <p className="text-xs font-mono font-extrabold text-emerald-700 truncate mt-0.5">+{adg} kg/ngày</p>
                <span className="text-[10px] text-slate-400">Tăng tổng: {totalGain} kg</span>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-[10px] text-slate-400 uppercase font-semibold">Tồn Dư Kháng Sinh</span>
                <p
                  className={`text-xs font-bold truncate mt-0.5 ${
                    cow.withdrawalDaysRemaining > 0 ? 'text-rose-600' : 'text-emerald-700'
                  }`}
                >
                  {cow.withdrawalDaysRemaining > 0 ? `Còn ${cow.withdrawalDaysRemaining} ngày` : '0 ngày (An toàn)'}
                </p>
                <span className="text-[10px] text-slate-400">
                  {cow.withdrawalDaysRemaining === 0 ? 'Đã thanh thải 100%' : 'Chờ phân hủy'}
                </span>
              </div>
            </div>

            {/* Blockchain Verification Mini Bar */}
            <div className="p-3 rounded-xl bg-indigo-50/70 border border-indigo-200/80 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 truncate">
                <ShieldCheck className="w-4 h-4 text-indigo-600 shrink-0" />
                <span className="text-indigo-900 font-semibold truncate">
                  Xác thực Chuỗi Khối: <span className="font-mono text-indigo-700">{cow.blockchainHash?.slice(0, 24)}...</span>
                </span>
              </div>
              <button
                onClick={() => setActiveTab('blockchain')}
                className="text-indigo-600 font-bold hover:underline shrink-0 ml-2"
              >
                Chi tiết khối →
              </button>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 mt-6 border-b border-slate-200 overflow-x-auto text-xs font-bold">
          <button
            onClick={() => setActiveTab('info')}
            className={`py-2.5 px-4 border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'info'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            Thông Tin Phả Hệ & Nhận Dạng
          </button>
          <button
            onClick={() => setActiveTab('weight')}
            className={`py-2.5 px-4 border-b-2 transition-colors whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'weight'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            Lịch Sử Cân & Tăng Trọng ({history.length})
          </button>
          <button
            onClick={() => setActiveTab('health')}
            className={`py-2.5 px-4 border-b-2 transition-colors whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'health'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <HeartPulse className="w-3.5 h-3.5" />
            Bệnh Án & Tiêm Phòng ({cowHealthLogs.length})
          </button>
          <button
            onClick={() => setActiveTab('blockchain')}
            className={`py-2.5 px-4 border-b-2 transition-colors whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'blockchain'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Link2 className="w-3.5 h-3.5" />
            Hộ Chiếu Blockchain & QR
          </button>
        </div>

        {/* Tab Contents */}
        <div className="pt-5 text-xs">
          {activeTab === 'info' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3 bg-slate-50/70 p-4 rounded-2xl border border-slate-100">
                <h3 className="font-bold text-slate-900 uppercase text-[11px] tracking-wider">Thông số cá thể</h3>
                <div className="divide-y divide-slate-100 space-y-2 text-slate-600">
                  <div className="flex justify-between pt-1">
                    <span>Mã định danh:</span>
                    <strong className="text-slate-900 font-mono">{cow.id}</strong>
                  </div>
                  <div className="flex justify-between pt-2">
                    <span>Giống:</span>
                    <strong className="text-slate-900">{cow.breed}</strong>
                  </div>
                  <div className="flex justify-between pt-2">
                    <span>Giới tính:</span>
                    <strong className="text-slate-900">{cow.gender === 'MALE' ? 'Bò Đực (Thịt)' : 'Bò Cái (Giống)'}</strong>
                  </div>
                  <div className="flex justify-between pt-2">
                    <span>Ngày sinh (DOB):</span>
                    <strong className="text-slate-900">{cow.dob} ({cow.ageMonths} tháng tuổi)</strong>
                  </div>
                  <div className="flex justify-between pt-2 gap-4">
                    <span>Nguồn gốc xuất xứ:</span>
                    <strong className="text-slate-900 text-right">
                      {cow.origin?.trim() || 'Chưa cập nhật'}
                    </strong>
                  </div>
                  <div className="flex justify-between pt-2">
                    <span>Trọng lượng ban đầu lúc nhập trại:</span>
                    <strong className="text-slate-900 font-mono">{cow.initialWeight} kg</strong>
                  </div>
                  <div className="flex justify-between pt-2">
                    <span>Trọng lượng hiện tại:</span>
                    <strong className="text-emerald-700 font-mono font-bold">{cow.weight} kg</strong>
                  </div>
                </div>
              </div>

              <div className="space-y-3 bg-slate-50/70 p-4 rounded-2xl border border-slate-100">
                <h3 className="font-bold text-slate-900 uppercase text-[11px] tracking-wider">Đặc điểm sinh học & Nhận dạng</h3>
                <p className="text-slate-700 leading-relaxed italic bg-white p-3 rounded-xl border border-slate-200">
                  "{cow.notes || 'Không có ghi chú bất thường. Bò phản xạ nhanh nhẹn, móng chân khô ráo, ăn đều đặn theo khẩu phần TMR.'}"
                </p>

                <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-1.5">
                  <span className="text-[11px] font-bold text-slate-900 block">Điều kiện xuất bán:</span>
                  <div className="flex items-center gap-2 text-slate-600 text-[11px]">
                    <span className={`w-2 h-2 rounded-full ${cow.weight >= cow.targetMarketWeight ? 'bg-emerald-500' : 'bg-slate-300'}`}></span>
                    Trọng lượng đạt mục tiêu: {cow.weight}/{cow.targetMarketWeight} kg
                  </div>
                  <div className="flex items-center gap-2 text-slate-600 text-[11px]">
                    <span className={`w-2 h-2 rounded-full ${cow.withdrawalDaysRemaining === 0 ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
                    Thời gian ngưng sử dụng kháng sinh: {cow.withdrawalDaysRemaining === 0 ? 'Đã đạt' : `Còn ${cow.withdrawalDaysRemaining} ngày`}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'weight' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-slate-900">Biểu Đồ Lịch Sử Tăng Trọng (FR-COW-08)</h3>
                  <p className="text-slate-500 text-[11px]">Ghi nhận tự động từ Trạm cân điện tử IoT và Thẻ tai RFID</p>
                </div>
                <button
                  onClick={handleSimulateWeigh}
                  className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg font-bold text-xs flex items-center gap-1 cursor-pointer hover:bg-emerald-700"
                >
                  <Scale className="w-3.5 h-3.5" /> Ghi Nhận Cân Mới (FR-IOT-02)
                </button>
              </div>

              {/* Visual weight growth bar chart */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <div className="h-44 flex items-end justify-around gap-2 pt-6">
                  {history.map((h, idx) => {
                    const heightPercent = Math.min(100, Math.round((h.weight / 600) * 100));
                    return (
                      <div key={idx} className="flex-1 flex flex-col items-center gap-1 group">
                        <span className="text-[10px] font-mono font-bold text-slate-700 opacity-90 group-hover:text-emerald-700">
                          {h.weight} kg
                        </span>
                        <div className="w-full max-w-[48px] bg-slate-200 rounded-t-lg relative overflow-hidden h-32 flex items-end">
                          <div
                            className="w-full bg-emerald-500 group-hover:bg-emerald-600 transition-all rounded-t-lg"
                            style={{ height: `${heightPercent}%` }}
                          ></div>
                        </div>
                        <span className="text-[10px] text-slate-500 font-mono mt-1">{h.date.slice(5)}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Records Table with Source */}
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-3">Ngày cân</th>
                      <th className="py-2.5 px-3">Khối lượng</th>
                      <th className="py-2.5 px-3">Nguồn Dữ Liệu (FR-IOT-04)</th>
                      <th className="py-2.5 px-3">Phương thức</th>
                      <th className="py-2.5 px-3">Người ghi nhận</th>
                      <th className="py-2.5 px-3">Ghi chú</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {history.map((rec, i) => (
                      <tr key={i} className="hover:bg-slate-50">
                        <td className="py-2 px-3 font-mono text-slate-800">{rec.date}</td>
                        <td className="py-2 px-3 font-mono font-bold text-emerald-800">{rec.weight} kg</td>
                        <td className="py-2 px-3">
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full inline-flex items-center gap-1 ${
                              rec.source === 'SIMULATED'
                                ? 'bg-cyan-50 text-cyan-700 border border-cyan-200'
                                : 'bg-slate-100 text-slate-700 border border-slate-200'
                            }`}
                          >
                            {rec.source === 'SIMULATED' ? 'Mô phỏng IoT' : 'Nhập tay (Manual)'}
                          </span>
                        </td>
                        <td className="py-2 px-3">
                          <span className="bg-slate-100 text-slate-700 text-[10px] px-2 py-0.5 rounded font-mono">
                            {rec.method}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-slate-700">{rec.recordedBy}</td>
                        <td className="py-2 px-3 text-slate-500">{rec.note || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'health' && (
            <div className="space-y-4">
              <h3 className="font-bold text-slate-900">Hồ Sơ Y Tế & Điều Trị Thú Y</h3>
              {cowHealthLogs.length === 0 ? (
                <div className="p-8 text-center text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                  <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-500 mb-2" />
                  <p className="font-bold text-slate-800 text-xs">Không có bệnh án điều trị nào gần đây!</p>
                  <p className="text-[11px] text-slate-500">Cá thể bò hoàn toàn khỏe mạnh, phát triển bình thường.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {cowHealthLogs.map((log) => (
                    <div key={log.id} className="p-4 rounded-xl border border-slate-200 bg-white shadow-xs space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900">{log.diagnosis}</span>
                          <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-mono">
                            {log.date}
                          </span>
                        </div>
                        <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                          {log.status === 'ONGOING' ? 'Đang điều trị' : 'Đã hồi phục'}
                        </span>
                      </div>
                      <p className="text-slate-600">{log.treatment}</p>
                      <div className="text-[11px] text-slate-500 flex flex-wrap gap-4 pt-1 border-t border-slate-100">
                        <span>Thuốc: <strong>{log.medication}</strong> ({log.dose})</span>
                        <span>Bác sĩ phụ trách: <strong>{log.veterinarian}</strong></span>
                        {log.withdrawalPeriodDays > 0 && (
                          <span className="text-rose-600 font-bold">Thời gian cách ly thuốc: {log.withdrawalPeriodDays} ngày</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'blockchain' && (
            <div className="space-y-4">
              <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 rounded-2xl border border-indigo-900 shadow-lg">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Link2 className="w-5 h-5 text-indigo-400" />
                    <span className="font-bold text-sm tracking-wide">Hộ Chiếu Điện Tử Chuỗi Khối (Blockchain Passport)</span>
                  </div>
                  <span className="text-[10px] font-mono bg-indigo-500/30 text-indigo-300 border border-indigo-400/30 px-2.5 py-0.5 rounded-full">
                    IMMUTABLE LEDGER
                  </span>
                </div>

                <div className="space-y-3 font-mono text-xs">
                  <div>
                    <span className="text-slate-400 text-[10px] uppercase block">Block Hash Chứng Nhận:</span>
                    <p className="text-emerald-400 font-bold break-all bg-black/40 p-2.5 rounded-xl border border-slate-800">
                      {cow.blockchainHash || '0x3b128fd01e8a94628d7a6e5b4c3a210987fecba9876543210123456789ab'}
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-[11px]">
                    <div>
                      <span className="text-slate-400 block">Tiêu chuẩn:</span>
                      <span className="text-white">VietGAP Livestock 2026</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Thời gian đúc khối:</span>
                      <span className="text-white">{cow.entryDate}T08:00:00Z</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* QR Code Presentation */}
              <div className="p-6 bg-white rounded-2xl border border-slate-200 text-center space-y-3">
                <h4 className="font-bold text-slate-900">Mã QR Truy Xuất Nguồn Gốc Người Tiêu Dùng</h4>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  Quét mã QR bằng điện thoại để xem toàn bộ hành trình sống, thức ăn, cân nặng và chứng chỉ kiểm dịch thú y.
                </p>
                <div className="w-40 h-40 mx-auto bg-white p-2 rounded-2xl shadow-md border border-slate-200 flex items-center justify-center">
               <QRCodeSVG
                  value={cattleTraceUrl}
                  size={240}
                  level="M"
                  includeMargin={true}
                  bgColor="#FFFFFF"
                  fgColor="#000000"
                />
                </div>
                <p className="text-[11px] font-mono text-slate-500">{cattleTraceUrl}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* QR Modal */}
      {showQrModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 text-center space-y-4 shadow-2xl">
            <h3 className="font-bold text-base text-slate-900">Mã QR Định Danh Bò: {cow.id}</h3>
           <div className="w-48 h-48 mx-auto bg-white p-3 rounded-2xl border border-slate-200 flex items-center justify-center">
             <QRCodeSVG
                value={cattleTraceUrl}
                size={240}
                level="M"
                includeMargin={true}
                bgColor="#FFFFFF"
                fgColor="#000000"
              />
            </div>
            <p className="text-xs text-slate-600 font-mono break-all">{cattleTraceUrl}</p>
            <button
              onClick={() => setShowQrModal(false)}
              className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl font-semibold text-xs cursor-pointer"
            >
              Đóng Cửa Sổ
            </button>
          </div>
        </div>
      )}

      {/* RFID Tag Assignment Modal (FR-COW-07) */}
      {showRfidModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Radio className="w-5 h-5 text-emerald-600" />
                <h3 className="font-bold text-base text-slate-900">Gán / Đổi Thẻ Tai RFID (FR-COW-07)</h3>
              </div>
              <button
                onClick={() => setShowRfidModal(false)}
                className="text-slate-400 hover:text-slate-600 text-xs font-bold"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-500">
              Gán mã chíp RFID điện tử mới cho bò <strong>{cow.name}</strong> ({cow.id}). Thẻ RFID cho phép đầu đọc tự động ghi nhận khi bò bước vào trạm cân IoT.
            </p>

            <form onSubmit={handleAssignRfid} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Mã RFID Mới (15 ký tự chuẩn ISO 11784/11785)</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newRfid}
                    onChange={(e) => setNewRfid(e.target.value)}
                    placeholder="VD: 982000412891234"
                    className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-mono font-bold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setNewRfid(`982000${Math.floor(100000000 + Math.random() * 900000000)}`)}
                    className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl"
                    title="Sinh mã ngẫu nhiên"
                  >
                    Tạo Ngẫu Nhiên
                  </button>
                </div>
              </div>

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs space-y-1 text-slate-600">
                <div className="flex justify-between">
                  <span>Mã hiện tại:</span>
                  <strong className="font-mono text-slate-800">{cow.rfidTag}</strong>
                </div>
                <div className="flex justify-between">
                  <span>Số tai vật lý:</span>
                  <strong className="text-slate-800">{cow.earTagNumber}</strong>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowRfidModal(false)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold text-xs"
                >
                  Hủy Bỏ
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs shadow-xs"
                >
                  Lưu Thẻ RFID Mới
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      <CattleFormModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        cattleToEdit={cow}
      />
    </div>
  );
};
