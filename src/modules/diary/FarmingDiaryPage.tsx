import React, { useEffect, useState } from 'react';
import { useFarmStore } from '../../store/useFarmStore';
import { useAuthStore } from '../../store/useAuthStore';
import { DailyDiary } from '../../types';
import {
  BookOpen,
  Plus,
  CheckCircle2,
  Calendar,
  Thermometer,
  CloudSun,
  ShieldCheck,
  X,
  Sparkles,
} from 'lucide-react';

const DIARY_OBSERVATION_OPTIONS = [
  'Đàn bò khỏe mạnh, hoạt động bình thường',
  'Bò ăn uống tốt, sức ăn ổn định',
  'Một số bò ăn ít hơn bình thường',
  'Có bò cần tiếp tục theo dõi sức khỏe',
  'Chuồng trại sạch sẽ, khô ráo',
  'Chuồng trại cần vệ sinh bổ sung',
  'Máng nước sạch, nguồn nước đảm bảo',
  'Đã kiểm tra và bổ sung thức ăn',
  'Thời tiết thuận lợi cho việc chăm sóc',
  'Thời tiết ảnh hưởng đến hoạt động chăn nuôi',
  'Có vấn đề phát sinh cần bàn giao ca sau',
  'Không có vấn đề bất thường trong ca trực',
];

export const FarmingDiaryPage: React.FC = () => {
  const {
    diaries,
    barns,
    addDailyDiary,
    verifyDailyDiary,
    fetchDailyDiaries,
    fetchBarns,
    addToast,
  } = useFarmStore();

  const { currentUser } = useAuthStore();

  // STAFF chỉ xem chuồng được phân công.
  // FARM_MANAGER và ADMIN được xem toàn bộ chuồng.
  const visibleBarns =
    currentUser.role === 'STAFF'
      ? barns.filter((barn) =>
          (currentUser.assignedPens || []).some(
            (assignedBarn) =>
              assignedBarn === barn.code ||
              assignedBarn === barn.id
          )
        )
      : barns;

  // Tải nhật ký và danh sách chuồng từ Backend khi mở trang
  useEffect(() => {
    fetchDailyDiaries(currentUser.role).catch((error) => {
      console.error('Lỗi tải nhật ký:', error);
    });

    fetchBarns();
  }, [currentUser.role, fetchDailyDiaries, fetchBarns]);

  // Cập nhật danh sách chuồng vào biểu mẫu sau khi tải dữ liệu
  useEffect(() => {
    setFormData((prev) => ({
      ...prev,
      penActivities: visibleBarns.map((barn) => ({
        penId: barn.id,
        penName: barn.name.split('-')[0].trim(),
        cleaned: true,
        waterChecked: true,
        feedEatenPercentage: 95,
        unusualBehavior: '',
      })),
    }));
  }, [barns, currentUser.role, currentUser.assignedPens]);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedObservations, setSelectedObservations] = useState<string[]>([]);
  const [customObservation, setCustomObservation] = useState('');
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    shift: (new Date().getHours() < 12
    ? 'CA_SANG'
    : new Date().getHours() < 18
      ? 'CA_CHIEU'
      : 'CA_TOI') as DailyDiary['shift'],
    authorName: currentUser.name,
    authorRole: currentUser.role,
    generalObservations: 'Toàn đàn nhanh nhẹn, chuồng khô ráo, quạt thông gió chạy êm.',
    weather: 'Nang_Rao' as DailyDiary['weather'],
    tempAvg: 28.5,
    penActivities: barns.map((b) => ({
      penId: b.id,
      penName: b.name.split('-')[0].trim(),
      cleaned: true,
      waterChecked: true,
      feedEatenPercentage: 95,
      unusualBehavior: '',
    })),
  });

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const observations = [
      ...selectedObservations,
      customObservation.trim(),
    ].filter(Boolean);

    if (observations.length === 0) {
      addToast(
        'error',
        'Thiếu nhận xét',
        'Vui lòng chọn ít nhất một nhận xét hoặc nhập nhận xét bổ sung.'
      );
      return;
    }

    const diaryData = {
      ...formData,
      generalObservations: observations
        .map((item) => `- ${item}`)
        .join('\n'),
    };
    console.log('DỮ LIỆU NHẬT KÝ GỬI BACKEND:', diaryData);
    
    try {
      await addDailyDiary(
        diaryData,
        currentUser.name,
        currentUser.role
      );

      setSelectedObservations([]);
      setCustomObservation('');
      setIsAddModalOpen(false);
    } catch (error) {
      console.error('Lỗi lưu nhật ký:', error);
    }
  };

  const handleVerify = async (diaryId: string) => {
    if (currentUser.role !== 'FARM_MANAGER') {
      addToast(
        'error',
        'Không có quyền',
        'Chỉ Quản lý trang trại mới được xác nhận nhật ký.'
      );
      return;
    }

    try {
      await verifyDailyDiary(diaryId, currentUser.name);
    } catch (error) {
      console.error('Lỗi xác nhận nhật ký:', error);
    }
  };

  const shiftMap = {
    CA_SANG: 'Ca Sáng (06:00 - 12:00)',
    CA_CHIEU: 'Ca Chiều (12:00 - 18:00)',
    CA_DEM: 'Ca Đêm (18:00 - 06:00)',
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900">Nhật Ký Chăn Nuôi Hằng Ngày</h1>
            <span className="text-xs bg-emerald-50 text-emerald-800 border border-emerald-200 px-2.5 py-0.5 rounded-full font-bold">
              {diaries.length} bản ghi
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Ghi nhận tình trạng dọn dẹp vệ sinh chuồng, kiểm tra máng nước, sức ăn và phê duyệt của Quản lý trang trại
          </p>
        </div>

        {(currentUser.role === 'STAFF' || currentUser.role === 'FARM_MANAGER') && (
          <button
            onClick={() => {
              const hour = new Date().getHours();

              const currentShift: DailyDiary['shift'] =
                hour < 12
                  ? 'CA_SANG'
                  : hour < 18
                    ? 'CA_CHIEU'
                    : 'CA_DEM';

              setFormData((prev) => ({
                ...prev,
                date: new Date().toLocaleDateString('en-CA'),
                shift: currentShift,
              }));

              setIsAddModalOpen(true);
            }}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition-all shadow-md shadow-emerald-600/20 flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Ghi Nhật Ký Ca Trực</span>
          </button>
        )}
      </div>

      {/* Diary Entries List */}
      <div className="space-y-5">
        {diaries.map((diary) => (
          <div key={diary.id} className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-slate-900 text-sm">
                      {shiftMap[diary.shift] || diary.shift}
                    </span>
                    <span className="text-xs text-slate-500 font-mono">({diary.date})</span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Người lập: <strong className="text-slate-800">{diary.authorName}</strong> ({diary.authorRole})
                  </p>
                </div>
              </div>

              {/* Manager Approval Status */}
              <div className="flex items-center gap-2">
                {diary.verifiedByManager ? (
                  <span className="px-3 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold rounded-full flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    Đã Duyệt Bởi: {diary.verifiedByManager}
                  </span>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full font-semibold border border-amber-200">
                      Chờ Quản lý duyệt
                    </span>
                    {currentUser.role === 'FARM_MANAGER' && (
                      <button
                        onClick={() => handleVerify(diary.id)}
                        className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors"
                      >
                        Ký Duyệt Ngay
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* General observations & Weather */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center gap-2">
                <CloudSun className="w-4 h-4 text-amber-500 shrink-0" />
                <div>
                  <span className="text-[10px] text-slate-400 block">Thời tiết ca trực:</span>
                  <strong className="text-slate-800">{diary.weather === 'Nang_Rao' ? 'Nắng ráo thoáng mát' : diary.weather}</strong>
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center gap-2">
                <Thermometer className="w-4 h-4 text-rose-500 shrink-0" />
                <div>
                  <span className="text-[10px] text-slate-400 block">Nhiệt độ trung bình:</span>
                  <strong className="text-slate-800 font-mono">{diary.tempAvg}°C</strong>
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-indigo-500 shrink-0" />
                <div>
                  <span className="text-[10px] text-slate-400 block">Ghi chú chung:</span>
                  <span className="text-slate-700 line-clamp-1">{diary.generalObservations}</span>
                </div>
              </div>
            </div>

            {/* Pen by Pen checklist table */}
            <div className="border border-slate-200 rounded-2xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/80 text-slate-500 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3.5">Khu vực chuồng</th>
                    <th className="py-2.5 px-3.5">Dọn rửa vệ sinh</th>
                    <th className="py-2.5 px-3.5">Kiểm tra nước uống</th>
                    <th className="py-2.5 px-3.5">Tỷ lệ ăn sạch máng</th>
                    <th className="py-2.5 px-3.5">Ghi nhận bất thường</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {diary.penActivities.map((act, i) => (
                    <tr key={i} className="hover:bg-slate-50/50">
                      <td className="py-2.5 px-3.5 font-bold text-slate-900">{act.penName}</td>
                      <td className="py-2.5 px-3.5">
                        {act.cleaned ? (
                          <span className="text-emerald-700 font-semibold flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Đã dọn
                          </span>
                        ) : (
                          <span className="text-slate-400">Chưa dọn</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3.5">
                        {act.waterChecked ? (
                          <span className="text-emerald-700 font-semibold flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Đạt chuẩn
                          </span>
                        ) : (
                          <span className="text-slate-400">Chưa kiểm tra</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3.5 font-mono font-bold text-slate-800">
                        {act.feedEatenPercentage}%
                      </td>
                      <td className="py-2.5 px-3.5 text-slate-600">
                        {act.unusualBehavior || <span className="text-slate-400 italic">Bình thường</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </div>

      {/* Add Diary Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-base text-slate-900">Ghi Nhật Ký Ca Trực Chăn Nuôi</h3>
              <button onClick={() => setIsAddModalOpen(false)} className="p-1 text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Ca trực</label>
                  <select
                    value={formData.shift}
                    onChange={(e) => setFormData({ ...formData, shift: e.target.value as DailyDiary['shift'] })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-semibold"
                  >
                    <option value="CA_SANG">Ca Sáng (06:00 - 12:00)</option>
                    <option value="CA_CHIEU">Ca Chiều (12:00 - 18:00)</option>
                    <option value="CA_DEM">Ca Đêm (18:00 - 06:00)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Ngày ghi nhật ký</label>
                  <input
                    type="date"
                    required
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200"
                  />
                </div>
              </div>

              
              <div className="space-y-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-2">
                    Nhận xét tổng quát ca trực
                  </label>

                  <p className="text-[11px] text-slate-500 mb-2">
                    Chọn một hoặc nhiều nội dung phù hợp với tình hình thực tế.
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-3 rounded-xl border border-slate-200 bg-slate-50">
                    {DIARY_OBSERVATION_OPTIONS.map((option) => (
                      <label
                        key={option}
                        className="flex items-start gap-2 p-2 rounded-lg hover:bg-white cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={selectedObservations.includes(option)}
                          onChange={(e) => {
                            setSelectedObservations((prev) =>
                              e.target.checked
                                ? [...prev, option]
                                : prev.filter((item) => item !== option)
                            );
                          }}
                          className="mt-0.5 accent-emerald-600"
                        />

                        <span className="text-slate-700 leading-5">
                          {option}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Nhận xét bổ sung
                    <span className="font-normal text-slate-400"> (Không bắt buộc)</span>
                  </label>

                  <textarea
                    rows={3}
                    value={customObservation}
                    onChange={(e) => setCustomObservation(e.target.value)}
                    placeholder="Nhập tình hình thực tế hoặc vấn đề phát sinh trong ca trực..."
                    className="w-full p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>


              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 font-semibold"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 text-white rounded-xl font-bold shadow-md shadow-emerald-600/20"
                >
                  Lưu Nhật Ký Ca Trực
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
