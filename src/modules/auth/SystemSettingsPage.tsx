import React, { useState, useEffect } from 'react';
import { useFarmStore } from '../../store/useFarmStore';
import { useAuthStore } from '../../store/useAuthStore';
import { RoleGuard } from '../../components/common/RoleGuard';
import {
  Settings,
  Radio,
  Scale,
  Thermometer,
  ShieldAlert,
  Server,
  Save,
  CheckCircle2,
  RefreshCw,
  Cpu,
} from 'lucide-react';

export const SystemSettingsPage: React.FC = () => {
  const { systemConfig, updateSystemConfig, addToast } = useFarmStore();
  const { currentUser } = useAuthStore();

  const [form, setForm] = useState({ ...systemConfig });
  const [apiStatus, setApiStatus] = useState<any>(null);
  const [isTestingServer, setIsTestingServer] = useState(false);

  const fetchServerStatus = async () => {
    setIsTestingServer(true);
    try {
      const res = await fetch('/api/server-status');
      if (res.ok) {
        const data = await res.json();
        setApiStatus(data);
        addToast('success', 'Kết Nối Backend Thành Công', `Máy chủ Node.js & IoT Hub phản hồi: ${data.status}`);
      } else {
        setApiStatus({ status: 'offline', error: 'Lỗi phản hồi HTTP' });
      }
    } catch (err: any) {
      setApiStatus({ status: 'offline', error: err.message });
    } finally {
      setIsTestingServer(false);
    }
  };

  useEffect(() => {
    fetchServerStatus();
  }, []);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateSystemConfig(form, currentUser.name, currentUser.role);
  };

  return (
    <RoleGuard allowedRoles={['ADMIN', 'FARM_MANAGER']}>
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Cài Đặt Hệ Thống & Cấu Hình IoT</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Thiết lập tham số trang trại, tần số đầu đọc RFID, cân điện tử và ngưỡng cảnh báo môi trường
          </p>
        </div>

        {/* Backend & IoT Server Connection Status Card */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Server className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-900">Node.js Server & IoT Gateway</span>
                <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.2 rounded-full">
                  Cổng 3000
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                {apiStatus?.status === 'online'
                  ? `Máy chủ: ${apiStatus.system} • Uptime: ${Math.round(apiStatus.uptime || 0)}s`
                  : 'Đang kết nối cổng dịch vụ Express...'}
              </p>
            </div>
          </div>

          <button
            onClick={fetchServerStatus}
            disabled={isTestingServer}
            className="px-3.5 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors flex items-center gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isTestingServer ? 'animate-spin' : ''}`} />
            <span>Kiểm Tra Ping API</span>
          </button>
        </div>

        <form onSubmit={handleSave} className="space-y-6 text-xs">
          {/* General Farm Information */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider pb-2 border-b border-slate-100">
              1. Thông Tin Pháp Lý & Định Danh Trang Trại
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Tên trang trại</label>
                <input
                  type="text"
                  required
                  value={form.farmName}
                  onChange={(e) => setForm({ ...form, farmName: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Mã định danh VietGAP / Cục Chăn Nuôi</label>
                <input
                  type="text"
                  required
                  value={form.farmCode}
                  onChange={(e) => setForm({ ...form, farmCode: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Địa chỉ trang trại</label>
                <input
                  type="text"
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Hotline / Đường dây nóng</label>
                <input
                  type="text"
                  value={form.hotline}
                  onChange={(e) => setForm({ ...form, hotline: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>
          </div>

          {/* IoT & RFID / Scale Hardware Parameters */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider pb-2 border-b border-slate-100 flex items-center gap-1.5">
              <Cpu className="w-4 h-4 text-emerald-600" />
              2. Tham Số Phần Cứng IoT & Cảm Biến Cân
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Giao thức thẻ tai RFID</label>
                <input
                  type="text"
                  value={form.rfidReaderFrequency}
                  onChange={(e) => setForm({ ...form, rfidReaderFrequency: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                />
                <span className="text-[10px] text-slate-400 mt-0.5 block">Chuẩn thẻ tai động vật quốc tế</span>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Tốc độ cổng truyền Baud Rate (Cân điện tử)</label>
                <select
                  value={form.scaleBaudRate}
                  onChange={(e) => setForm({ ...form, scaleBaudRate: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                >
                  <option value={4800}>4800 bps</option>
                  <option value={9600}>9600 bps (Tiêu chuẩn RS-232/USB)</option>
                  <option value={19200}>19200 bps</option>
                  <option value={115200}>115200 bps (Tốc độ cao)</option>
                </select>
              </div>

              <div>
                <label className="flex items-center gap-2 cursor-pointer mt-2">
                  <input
                    type="checkbox"
                    checked={form.scaleAutoTare}
                    onChange={(e) => setForm({ ...form, scaleAutoTare: e.target.checked })}
                    className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                  />
                  <div>
                    <span className="font-semibold text-slate-800">Tự động trừ bì (Auto-Tare)</span>
                    <p className="text-[10px] text-slate-500">Tự động cân bằng về 0.00 kg sau khi bò rời khỏi sàn cân</p>
                  </div>
                </label>
              </div>

              <div>
                <label className="flex items-center gap-2 cursor-pointer mt-2">
                  <input
                    type="checkbox"
                    checked={form.blockchainSync}
                    onChange={(e) => setForm({ ...form, blockchainSync: e.target.checked })}
                    className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                  />
                  <div>
                    <span className="font-semibold text-slate-800">Đồng bộ chuỗi khối thời gian thực</span>
                    <p className="text-[10px] text-slate-500">Đào khối Blockchain ngay khi phát sinh sự kiện cân hoặc xuất bán</p>
                  </div>
                </label>
              </div>
            </div>
          </div>

          {/* Environmental Thresholds */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider pb-2 border-b border-slate-100 flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4 text-amber-600" />
              3. Ngưỡng Cảnh Báo Vi Khí Hậu Chuồng Nuôi
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Ngưỡng cảnh báo nhiệt độ cao (°C)
                </label>
                <input
                  type="number"
                  value={form.alertHighTempThreshold}
                  onChange={(e) => setForm({ ...form, alertHighTempThreshold: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                />
                <span className="text-[10px] text-slate-400 mt-0.5 block">Kích hoạt quạt làm mát công suất tối đa nếu vượt ngưỡng</span>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Ngưỡng cảnh báo khí độc Amoniac NH3 (ppm)
                </label>
                <input
                  type="number"
                  value={form.alertHighAmmoniaThreshold}
                  onChange={(e) => setForm({ ...form, alertHighAmmoniaThreshold: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                />
                <span className="text-[10px] text-slate-400 mt-0.5 block">Cảnh báo vệ sinh chuồng và rắc chế phẩm vi sinh phân giải</span>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="submit"
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition-all shadow-md shadow-emerald-600/20 flex items-center gap-1.5 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>Lưu Cài Đặt Hệ Thống</span>
            </button>
          </div>
        </form>
      </div>
    </RoleGuard>
  );
};
