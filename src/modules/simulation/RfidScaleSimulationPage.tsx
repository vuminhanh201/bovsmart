import React, { useState, useEffect } from 'react';
import { useFarmStore } from '../../store/useFarmStore';
import { useAuthStore } from '../../store/useAuthStore';
import { getCattleImageUrlApi } from '../../services/fileService';
import {
  Radio,
  Scale,
  Sparkles,
  CheckCircle2,
  ImageOff,
  AlertTriangle,
  RotateCcw,
  Zap,
  Volume2,
  VolumeX,
  Link2,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';

export const RfidScaleSimulationPage: React.FC = () => {
  const {
    cattle,
    barns,
    fetchCattle,
    scannedRfidTag,
    activeScaleWeight,
    scaleIsStable,
    scaleTare,
    isRfidScanning,
    simulateScanRfid,
    setSimulatedScaleWeight,
    tareScale,
    resetSimulation,
    recordCattleWeight,
    addToast,
  } = useFarmStore();

  const { currentUser } = useAuthStore();

  useEffect(() => {
    fetchCattle().catch((error) => {
      console.error('Không thể tải danh sách bò từ MongoDB:', error);
      addToast(
        'error',
        'Lỗi tải danh sách bò',
        error instanceof Error
          ? error.message
          : 'Không thể tải dữ liệu bò từ máy chủ.'
      );
    });
  }, [fetchCattle, addToast]);

  const [soundEnabled, setSoundEnabled] = useState(true);
  const [selectedCowId, setSelectedCowId] = useState(cattle[0]?.id || '');
  const [weightOffset, setWeightOffset] = useState<number>(0);
  const [isWeighingPlatformActive, setIsWeighingPlatformActive] = useState(false);
  const [minioImageUrl, setMinioImageUrl] = useState<string | null>(null);

  const selectedCow = cattle.find((c) => c.rfidTag === scannedRfidTag || c.id === selectedCowId);

  // Play realistic RFID beep using Web Audio API
  const playBeep = (freq = 1200, duration = 0.15) => {
    if (!soundEnabled) return;
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
      gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + duration);
    } catch (e) {
      // Audio might be blocked until user gesture
    }
  };

  const handleScanCattle = (cowId: string) => {
    const cow = cattle.find((c) => c.id === cowId);
    if (!cow) return;

    setSelectedCowId(cow.id);
    setIsWeighingPlatformActive(true);
    simulateScanRfid(cow.rfidTag);
    playBeep(1800, 0.1);
    setTimeout(() => playBeep(2400, 0.15), 120);
  };

  const handleRandomWalkIn = () => {
    const randomCow = cattle[Math.floor(Math.random() * cattle.length)];
    if (randomCow) {
      handleScanCattle(randomCow.id);
    }
  };

  const handleSaveWeight = () => {
    if (!selectedCow) {
      addToast('warning', 'Chưa Quét Thẻ', 'Vui lòng quét thẻ tai RFID của bò trước khi ghi nhận trọng lượng!');
      return;
    }

    playBeep(880, 0.3);
    recordCattleWeight(selectedCow.id, Number(activeScaleWeight.toFixed(1)), currentUser.name, 'RFID_AUTO_SCALE');
  };

  const currentBarn = selectedCow ? barns.find((b) => b.id === selectedCow.penId) : null;

  useEffect(() => {
    let cancelled = false;

    const loadImage = async () => {
      const photoUrl = selectedCow?.photoUrl?.trim();

      if (!photoUrl) {
        setMinioImageUrl(null);
        return;
      }

      if (!photoUrl.startsWith('minio:')) {
        setMinioImageUrl(photoUrl);
        return;
      }

      try {
        const response = await getCattleImageUrlApi(photoUrl.slice(6));

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
  }, [selectedCow?.photoUrl]);
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900">Mô Phỏng Trạm Cân Điện Tử & Đầu Đọc RFID</h1>
            <span className="text-xs bg-emerald-50 text-emerald-800 border border-emerald-200 px-2.5 py-0.5 rounded-full font-bold">
              IoT Hardware Simulator
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Mô phỏng quy trình bò qua cổng đọc thẻ tai tự động, sàn cân điện tử số hóa và chứng thực Blockchain
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`p-2 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-colors ${
              soundEnabled
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : 'bg-slate-100 border-slate-200 text-slate-500'
            }`}
            title="Bật/Tắt âm thanh bíp bíp mô phỏng RFID"
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-600" /> : <VolumeX className="w-4 h-4" />}
            <span className="hidden sm:inline">{soundEnabled ? 'Âm thanh: BẬT' : 'Âm thanh: TẮT'}</span>
          </button>

          <button
            onClick={handleRandomWalkIn}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition-all shadow-md shadow-emerald-600/20 flex items-center gap-1.5 cursor-pointer"
          >
            <Zap className="w-4 h-4" />
            <span>Mô Phỏng Bò Bước Vào Cân</span>
          </button>
        </div>
      </div>

      {/* Main Simulator Deck */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (7 cols): Digital Indicator Display & Controls */}
        <div className="lg:col-span-7 space-y-4">
          {/* Industrial Weighing Indicator Box */}
          <div className="bg-slate-900 rounded-3xl p-6 border-4 border-slate-800 shadow-2xl relative overflow-hidden">
            {/* Screws look */}
            <div className="absolute top-3 left-3 w-2 h-2 rounded-full bg-slate-700 border border-slate-600"></div>
            <div className="absolute top-3 right-3 w-2 h-2 rounded-full bg-slate-700 border border-slate-600"></div>
            <div className="absolute bottom-3 left-3 w-2 h-2 rounded-full bg-slate-700 border border-slate-600"></div>
            <div className="absolute bottom-3 right-3 w-2 h-2 rounded-full bg-slate-700 border border-slate-600"></div>

            {/* Top Indicator Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 text-slate-400 text-xs font-mono">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></span>
                <span className="text-white font-bold tracking-wider">BOVSMART DIGITAL LOADCELL v4.0</span>
              </div>
              <span className="bg-slate-800 px-2 py-0.5 rounded text-[10px] text-slate-300">PORT: RS-232 / 9600 BPS</span>
            </div>

            {/* LED Status Indicators */}
            <div className="flex items-center justify-between py-3 px-2 text-[10px] font-mono tracking-wider">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5">
                  <span className={`w-2.5 h-2.5 rounded-full ${scaleIsStable ? 'bg-emerald-400 shadow-emerald-500/50 shadow-md' : 'bg-slate-700'}`}></span>
                  <span className={scaleIsStable ? 'text-emerald-400 font-bold' : 'text-slate-600'}>STABLE (ỔN ĐỊNH)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className={`w-2.5 h-2.5 rounded-full ${scaleTare > 0 ? 'bg-amber-400 shadow-amber-500/50 shadow-md' : 'bg-slate-700'}`}></span>
                  <span className={scaleTare > 0 ? 'text-amber-400 font-bold' : 'text-slate-600'}>TARE (TRỪ BÌ)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-emerald-500/50 shadow-md"></span>
                  <span className="text-emerald-400 font-bold">NET (TRỌNG LƯỢNG TỊNH)</span>
                </div>
              </div>
              <span className="text-slate-500">MAX: 2000 KG</span>
            </div>

            {/* Huge 7-segment digital weight readout */}
            <div className="bg-black/90 p-6 rounded-2xl border-2 border-slate-800 my-2 text-right relative flex items-baseline justify-end shadow-inner">
              <div className="absolute left-6 top-6 text-left">
                <span className="text-slate-500 text-[11px] font-mono block">CẢM BIẾN TẢI:</span>
                <span className="text-emerald-400 text-xs font-mono font-bold">4x LOADCELL S-BEAM</span>
              </div>
              <span className="text-6xl sm:text-7xl font-mono font-extrabold text-emerald-400 tracking-wider drop-shadow-[0_0_20px_rgba(52,211,153,0.6)]">
                {activeScaleWeight > 0 ? activeScaleWeight.toFixed(1) : '0.0'}
              </span>
              <span className="text-xl sm:text-2xl font-mono font-bold text-emerald-500 ml-3">KG</span>
            </div>

            {/* Industrial Button Controls */}
            <div className="grid grid-cols-4 gap-2.5 pt-4">
              <button
                onClick={tareScale}
                className="py-2.5 px-3 bg-slate-800 hover:bg-slate-700 text-white font-mono font-bold text-xs rounded-xl border border-slate-700 transition-all active:scale-95 text-center cursor-pointer shadow-xs"
              >
                TARE (Trừ Bì)
              </button>

              <button
                onClick={() => {
                  setSimulatedScaleWeight(0);
                  playBeep(600, 0.1);
                }}
                className="py-2.5 px-3 bg-slate-800 hover:bg-slate-700 text-white font-mono font-bold text-xs rounded-xl border border-slate-700 transition-all active:scale-95 text-center cursor-pointer shadow-xs"
              >
                ZERO (Về 0)
              </button>

              <button
                onClick={() => {
                  const newW = Math.max(100, activeScaleWeight + 5);
                  setSimulatedScaleWeight(newW);
                  playBeep(1200, 0.05);
                }}
                className="py-2.5 px-3 bg-slate-800 hover:bg-slate-700 text-emerald-400 font-mono font-bold text-xs rounded-xl border border-slate-700 transition-all active:scale-95 text-center cursor-pointer shadow-xs"
              >
                +5.0 KG
              </button>

              <button
                onClick={resetSimulation}
                className="py-2.5 px-3 bg-rose-950/60 hover:bg-rose-900/60 text-rose-300 font-mono font-bold text-xs rounded-xl border border-rose-800 transition-all active:scale-95 text-center cursor-pointer shadow-xs"
              >
                RESET
              </button>
            </div>
          </div>

          {/* Quick Cattle Picker Platform */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center justify-between">
              <span>Mô Phỏng Thẻ Tai Bò Qua Ăng-Ten RFID</span>
              <span className="text-[11px] text-emerald-600 font-mono font-semibold">FDX-B 134.2 kHz</span>
            </h3>

            <p className="text-[11px] text-slate-500">
              Tổng số bò: <strong>{cattle.length}</strong> • Chọn bò để mô phỏng quét RFID.
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-96 overflow-y-auto">
              {cattle.map((c) => {
                const isSelected = selectedCow?.id === c.id;
                return (
                  <button
                    key={c.id}
                    onClick={() => handleScanCattle(c.id)}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-emerald-50 border-emerald-500 ring-2 ring-emerald-500/20'
                        : 'bg-slate-50/70 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-slate-900">{c.id}</span>
                      <Radio className={`w-3.5 h-3.5 ${isSelected ? 'text-emerald-600 animate-pulse' : 'text-slate-400'}`} />
                    </div>
                    <p className="text-[11px] text-slate-600 truncate mt-0.5">{c.name}</p>
                      <span className="text-[10px] font-mono text-slate-400 block truncate">
                        {c.rfidTag || 'Chưa gán RFID'}
                      </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column (5 cols): Scanned Cattle Profile & Confirmation */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <Radio className="w-4 h-4 animate-pulse" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900">Cá Thể Đang Trên Sàn Cân</h3>
                  <p className="text-[11px] text-slate-500">Đã nhận diện qua cảm biến RFID không chạm</p>
                </div>
              </div>
            </div>

            {selectedCow ? (
              <div className="space-y-4 text-xs">
                {/* Cattle Card */}
                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-100">
                  {minioImageUrl ? (
                    <img
                      src={minioImageUrl}
                      alt={selectedCow.name}
                      className="w-16 h-16 rounded-xl object-cover ring-2 ring-emerald-500/20"
                      onError={() => setMinioImageUrl(null)}
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400">
                      <ImageOff className="w-7 h-7" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-extrabold text-slate-900 text-sm truncate">{selectedCow.name}</span>
                      <span className="text-[10px] font-mono bg-white px-1.5 py-0.5 rounded border text-slate-700">
                        {selectedCow.id}
                      </span>
                    </div>
                    <p className="text-slate-500 text-[11px] mt-0.5">{selectedCow.breed} • {selectedCow.gender === 'MALE' ? 'Đực' : 'Cái'}</p>
                    <p className="text-[11px] font-mono text-emerald-800 font-bold mt-1">RFID: {selectedCow.rfidTag}</p>
                  </div>
                </div>

                {/* Weight Comparison */}
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">Cân nặng lần trước:</span>
                    <strong className="text-slate-800 font-mono">{selectedCow.weight} kg</strong>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">Cân nặng hiện tại:</span>
                    <strong className="text-emerald-700 font-mono font-extrabold text-sm">
                      {activeScaleWeight.toFixed(1)} kg
                    </strong>
                  </div>
                  <div className="flex justify-between items-center pt-1 border-t border-slate-200">
                    <span className="text-slate-500">Mục tiêu xuất bán:</span>
                    <strong className="text-indigo-900 font-mono">{selectedCow.targetMarketWeight} kg</strong>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">Tồn dư kháng sinh:</span>
                    <strong className={selectedCow.withdrawalDaysRemaining > 0 ? 'text-rose-600' : 'text-emerald-700'}>
                      {selectedCow.withdrawalDaysRemaining > 0 ? `Còn ${selectedCow.withdrawalDaysRemaining} ngày` : '0 ngày (An toàn)'}
                    </strong>
                  </div>
                </div>

                {/* Readiness status evaluation */}
                {activeScaleWeight >= selectedCow.targetMarketWeight && selectedCow.withdrawalDaysRemaining === 0 ? (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-900 flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-emerald-600 shrink-0" />
                    <div>
                      <span className="font-bold block">ĐẠT CHUẨN XUẤT BÁN!</span>
                      <span className="text-[11px] text-emerald-700">Trọng lượng vượt mục tiêu và an toàn tồn dư thuốc.</span>
                    </div>
                  </div>
                ) : (
                  <div className="p-3 bg-slate-100 rounded-2xl text-slate-700 text-[11px]">
                    Bò tiếp tục nuôi theo khẩu phần vỗ béo (còn thiếu{' '}
                    <strong>{Math.max(0, (selectedCow.targetMarketWeight - activeScaleWeight)).toFixed(1)} kg</strong> để đạt mục tiêu).
                  </div>
                )}

                {/* Primary Action Button: Save Weight & Mint Blockchain */}
                <button
                  onClick={handleSaveWeight}
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-lg shadow-emerald-600/25 flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <Link2 className="w-4 h-4" />
                  <span>Ghi Nhận Cân Nặng & Đúc Khối Blockchain</span>
                </button>

                <p className="text-[10px] text-slate-400 text-center leading-tight">
                  Thao tác sẽ tự động ký số bằng tài khoản: {currentUser.name} ({currentUser.role})
                </p>
              </div>
            ) : (
              <div className="py-12 text-center text-slate-400 space-y-2">
                <Radio className="w-8 h-8 mx-auto text-slate-300" />
                <p className="text-xs font-semibold">Chưa phát hiện bò trên bàn cân</p>
                <p className="text-[11px] text-slate-400 max-w-xs mx-auto">
                  Bấm "Mô Phỏng Bò Bước Vào Cân" hoặc chọn một thẻ tai RFID ở cột bên trái để thử nghiệm.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
