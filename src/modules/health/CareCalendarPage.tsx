
import React, { useCallback, useEffect, useState } from 'react';
import {
  CalendarCheck,
  Plus,
  CheckCircle2,
  Clock,
  Syringe,
  X,
  Users,
  ClipboardList,
  RefreshCw,
  AlertCircle,
  UserCheck,
} from 'lucide-react';

import { useFarmStore } from '../../store/useFarmStore';
import { useAuthStore } from '../../store/useAuthStore';

import {
  VaccinationSchedule,
  VaccinationScheduleRequest,
  createVaccinationScheduleApi,
  getAllVaccinationSchedulesApi,
  getMyVaccinationSchedulesApi,
  updateVaccinationScheduleStatusApi,
} from '../../services/vaccinationScheduleService';

import {
  getVeterinarianOptionsApi,
  StaffOption,
} from '../../services/staffService';

import {
  createVaccinationRecordApi,
  getVaccinationRecordsByCattleApi,
  VaccinationRecord,
} from '../../services/vaccinationService';

const today = new Date().toISOString().slice(0, 10);

const VACCINE_NAME_OPTIONS = [
  'Vaccine Lở mồm long móng (FMD)',
  'Vaccine Viêm da nổi cục',
  'Vaccine Tụ huyết trùng',
  'Vaccine Viêm phổi truyền nhiễm',
  'Vaccine Clostridial đa giá',
];

const VACCINE_TYPE_OPTIONS = [
  'Tiêm phòng định kỳ',
  'Tiêm phòng bổ sung',
  'Tiêm phòng theo kế hoạch',
  'Tiêm phòng khi có nguy cơ dịch bệnh',
];

const VACCINE_DOSAGE_OPTIONS = [
  'Theo hướng dẫn của nhà sản xuất',
  'Theo chỉ định của bác sĩ thú y',
  'Theo nhãn vaccine',
];

const VACCINE_BATCH_OPTIONS = [
  'LOT-2026-001',
  'LOT-2026-002',
  'LOT-2026-003',
];

const VACCINE_MANUFACTURER_OPTIONS = [
  'NAVETCO',
  'HANVET',
  'AVAC',
  'VETVACO',
  'Khác',
];

const VACCINATION_NOTE_OPTIONS = [
  'Đã tiêm, chưa ghi nhận phản ứng bất thường',
  'Bò ổn định sau tiêm',
  'Cần tiếp tục theo dõi sau tiêm',
  'Có biểu hiện cần báo bác sĩ thú y đánh giá',
];
const normalizeText = (value?: string) =>
  (value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();

export const CareCalendarPage: React.FC = () => {
  const { cattle, fetchCattle, addToast } = useFarmStore();
  const [veterinarians, setVeterinarians] = useState<StaffOption[]>([]);
  const { currentUser } = useAuthStore();

  const role = currentUser?.role;
  const isManager = role === 'FARM_MANAGER';
  const isAdmin = role === 'ADMIN';
  const isVeterinarian =
    role === 'STAFF' &&
    normalizeText(currentUser?.department) === 'thu y';

  const [schedules, setSchedules] = useState<VaccinationSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const [selectedCattleIds, setSelectedCattleIds] = useState<string[]>([]);

  const [formData, setFormData] = useState({
    vaccineName: VACCINE_NAME_OPTIONS[0],
    vaccineType: VACCINE_TYPE_OPTIONS[0],
    dosage: VACCINE_DOSAGE_OPTIONS[0],
    scheduledDate: today,
    assignedVeterinarianEmail: '',
    notes: 'Tiêm nhắc lại định kỳ 6 tháng',
  });

  const [customVaccineName, setCustomVaccineName] = useState(false);
  const [customVaccineType, setCustomVaccineType] = useState(false);
  const [customDosage, setCustomDosage] = useState(false);

  const [recordModal, setRecordModal] = useState<{
    schedule: VaccinationSchedule;
    cattleId: string;
  } | null>(null);

  const [recordForm, setRecordForm] = useState({
    vaccinationDate: today,
    nextVaccinationDate: '',
    batchNumber: '',
    manufacturer: '',
    notes: '',
  });
  const [customBatchNumber, setCustomBatchNumber] = useState(false);
const [customManufacturer, setCustomManufacturer] = useState(false);
const [customRecordNote, setCustomRecordNote] = useState(false);

  const [recordedCattleIds, setRecordedCattleIds] = useState<
    Record<string, string[]>
  >({});

  const [checkingRecords, setCheckingRecords] = useState(false);

  const [recordsModal, setRecordsModal] = useState<{
    schedule: VaccinationSchedule;
    records: {
      cattleId: string;
      cattleName: string;
      record: VaccinationRecord;
    }[];
  } | null>(null);

  const loadSchedules = useCallback(async () => {
    if (!currentUser) return;

    setLoading(true);
    setError('');

    try {
      let data: VaccinationSchedule[] = [];

      if (isManager || isAdmin) {
        data = await getAllVaccinationSchedulesApi();
      } else if (isVeterinarian) {
        data = await getMyVaccinationSchedulesApi();
      }

      setSchedules(data || []);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Không thể tải lịch tiêm phòng.';

      setError(message);
      addToast('error', 'Lỗi tải dữ liệu', message);
    } finally {
      setLoading(false);
    }
  }, [currentUser, isManager, isAdmin, isVeterinarian, addToast]);

  useEffect(() => {
    fetchCattle();
    loadSchedules();

    if (isManager) {
      getVeterinarianOptionsApi()
        .then((data) => {
          setVeterinarians(data);
        })
        .catch((error) => {
          addToast(
            'error',
            'Lỗi tải nhân viên',
            error.message || 'Không thể tải danh sách nhân viên Thú y!'
          );
        });
    }
  }, [fetchCattle, loadSchedules, isManager, addToast]);

  const toggleCattle = (cattleId: string) => {
    setSelectedCattleIds((previous) =>
      previous.includes(cattleId)
        ? previous.filter((id) => id !== cattleId)
        : [...previous, cattleId]
    );
  };

  const handleCreateSchedule = async (e: React.FormEvent) => {
    e.preventDefault();

    if (selectedCattleIds.length === 0) {
      addToast('error', 'Thiếu thông tin', 'Vui lòng chọn ít nhất một con bò.');
      return;
    }

    if (!formData.assignedVeterinarianEmail) {
      addToast('error', 'Thiếu nhân sự', 'Vui lòng phân công nhân viên Thú y.');
      return;
    }

    const requestData: VaccinationScheduleRequest = {
      targetGroup: `Danh sách ${selectedCattleIds.length} con bò`,
      cattleIds: selectedCattleIds,
      vaccineName: formData.vaccineName.trim(),
      vaccineType: formData.vaccineType.trim(),
      dosage: formData.dosage.trim(),
      scheduledDate: formData.scheduledDate,
      assignedVeterinarianEmail: formData.assignedVeterinarianEmail,
      notes: formData.notes.trim(),
    };

    setSubmitting(true);

    try {
      await createVaccinationScheduleApi(requestData);

      addToast(
        'success',
        'Tạo lịch thành công',
        'Lịch tiêm đã được lưu và phân công cho nhân viên Thú y.'
      );

      setIsAddModalOpen(false);
      setSelectedCattleIds([]);

      setFormData({
        vaccineName: 'Vaccine Lở Mồm Long Móng (FMD Nhị giá O+A)',
        vaccineType: 'Tiêm phòng định kỳ',
        dosage: '5ml tiêm dưới da',
        scheduledDate: today,
        assignedVeterinarianEmail: '',
        notes: 'Tiêm nhắc lại định kỳ 6 tháng',
      });

      await loadSchedules();
    } catch (err) {
      addToast(
        'error',
        'Tạo lịch thất bại',
        err instanceof Error ? err.message : 'Không thể tạo lịch tiêm.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const openRecordModal = async (
    schedule: VaccinationSchedule,
    cattleId: string
  ) => {
    setRecordModal({ schedule, cattleId });

    setRecordForm({
      vaccinationDate: today,
      nextVaccinationDate: '',
      batchNumber: '',
      manufacturer: '',
      notes: '',
    });
    setCustomBatchNumber(false);
    setCustomManufacturer(false);
    setCustomRecordNote(false);
  };

  const handleSaveVaccinationRecord = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!recordModal) return;

    const { schedule, cattleId } = recordModal;

    setSubmitting(true);

    try {
      await createVaccinationRecordApi({
        cattleId,
        vaccineName: schedule.vaccineName,
        vaccineType: schedule.vaccineType,
        dosage: schedule.dosage,
        vaccinationDate: recordForm.vaccinationDate,
        nextVaccinationDate: recordForm.nextVaccinationDate || undefined,
        batchNumber: recordForm.batchNumber.trim() || undefined,
        manufacturer: recordForm.manufacturer.trim() || undefined,
        notes: recordForm.notes.trim() || undefined,
      });

      setRecordedCattleIds((previous) => ({
        ...previous,
        [schedule.id]: [
          ...(previous[schedule.id] || []),
          cattleId,
        ],
      }));

      addToast(
        'success',
        'Đã lưu kết quả tiêm',
        'Hồ sơ tiêm thực tế đã được lưu thành công.'
      );

      setRecordModal(null);
    } catch (err) {
      addToast(
        'error',
        'Ghi nhận thất bại',
        err instanceof Error ? err.message : 'Không thể lưu hồ sơ tiêm.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const checkScheduleRecords = async (schedule: VaccinationSchedule) => {
  setCheckingRecords(true);

  try {
    const results = await Promise.all(
      schedule.cattleIds.map(async (cattleId) => {
        const records: VaccinationRecord[] =
          await getVaccinationRecordsByCattleApi(cattleId);

        const matchedRecords = records.filter(
          (record) =>
            normalizeText(record.vaccineName) ===
              normalizeText(schedule.vaccineName) &&
            record.vaccinationDate >= schedule.scheduledDate
        );

        return matchedRecords.map((record) => ({
          cattleId,
          cattleName: getCattleName(cattleId),
          record,
        }));
      })
    );

    const allRecords = results.flat();

    setRecordedCattleIds((previous) => ({
      ...previous,
      [schedule.id]: [
        ...new Set(allRecords.map((item) => item.cattleId)),
      ],
    }));

    setRecordsModal({
      schedule,
      records: allRecords,
    });
  } catch (err) {
    addToast(
      'error',
      'Không kiểm tra được hồ sơ',
      err instanceof Error
        ? err.message
        : 'Không thể tải hồ sơ tiêm của đàn bò.'
    );
  } finally {
    setCheckingRecords(false);
  }
};

  const handleConfirmSchedule = async (schedule: VaccinationSchedule) => {
    const confirmed = window.confirm(
      `Bạn muốn xác nhận hoàn thành lịch tiêm "${schedule.vaccineName}"? Hệ thống sẽ kiểm tra hồ sơ tiêm thực tế của toàn bộ bò trong lịch.`
    );

    if (!confirmed) return;

    setSubmitting(true);

    try {
      await updateVaccinationScheduleStatusApi(schedule.id, 'COMPLETED');

      addToast(
        'success',
        'Hoàn thành lịch tiêm',
        'Lịch tiêm đã được xác nhận hoàn tất.'
      );

      await loadSchedules();
    } catch (err) {
      addToast(
        'error',
        'Chưa thể hoàn thành',
        err instanceof Error
          ? err.message
          : 'Vui lòng kiểm tra hồ sơ tiêm của các con bò.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const getCattleName = (cattleId: string) => {
    const item = cattle.find((cow) => cow.id === cattleId);

    return item
      ? `${item.name} (${item.rfidTag || item.id})`
      : cattleId;
  };

  const getStatusLabel = (status: VaccinationSchedule['status']) => {
    switch (status) {
      case 'COMPLETED':
        return 'Đã hoàn thành';
      case 'IN_PROGRESS':
        return 'Đang thực hiện';
      case 'CANCELLED':
        return 'Đã hủy';
      default:
        return 'Đã lên lịch';
    }
  };

  const getStatusClass = (status: VaccinationSchedule['status']) => {
    switch (status) {
      case 'COMPLETED':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'IN_PROGRESS':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'CANCELLED':
        return 'bg-slate-100 text-slate-600 border-slate-200';
      default:
        return 'bg-indigo-50 text-indigo-700 border-indigo-200';
    }
  };

  if (role === 'STAFF' && !isVeterinarian) {
    return (
      <div className="p-6 bg-white rounded-2xl border border-slate-200">
        <div className="flex items-center gap-3 text-amber-700">
          <AlertCircle className="w-6 h-6" />
          <h2 className="font-bold">Không có quyền truy cập</h2>
        </div>
        <p className="text-sm text-slate-500 mt-2">
          Chức năng lịch tiêm phòng dành cho nhân viên thuộc bộ phận Thú y.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900">
              Lịch Chăm Sóc & Tiêm Phòng Định Kỳ
            </h1>

            <span className="text-xs bg-emerald-50 text-emerald-800 border border-emerald-200 px-2.5 py-0.5 rounded-full font-bold">
              {schedules.length} lịch tiêm
            </span>
          </div>

          <p className="text-xs text-slate-500 mt-1">
            Quản lý kế hoạch tiêm phòng và kết quả tiêm thực tế của đàn bò.
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={loadSchedules}
            disabled={loading}
            className="px-3 py-2 border border-slate-200 text-slate-600 rounded-xl text-xs font-bold flex items-center gap-2 hover:bg-slate-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Làm mới
          </button>

          {isManager && (
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              Lên Lịch Tiêm Mới
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="p-10 text-center text-slate-500 text-sm">
          Đang tải dữ liệu lịch tiêm...
        </div>
      ) : schedules.length === 0 ? (
        <div className="p-10 bg-white rounded-2xl border border-slate-200 text-center">
          <CalendarCheck className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="font-bold text-slate-700">
            Chưa có lịch tiêm phòng
          </p>
          <p className="text-xs text-slate-500 mt-1">
            {isVeterinarian
              ? 'Hiện tại bạn chưa được phân công lịch tiêm nào.'
              : 'Các lịch tiêm phòng được tạo sẽ hiển thị tại đây.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {schedules.map((schedule) => {
            const isDone = schedule.status === 'COMPLETED';
            const recordedIds = recordedCattleIds[schedule.id] || [];

            return (
              <div
                key={schedule.id}
                className="p-5 rounded-2xl border border-slate-200 bg-white shadow-sm flex flex-col justify-between gap-4"
              >
                <div>
                  <div className="flex items-center justify-between mb-3 gap-2">
                    <span
                      className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${getStatusClass(schedule.status)}`}
                    >
                      {getStatusLabel(schedule.status)}
                    </span>

                    <span className="text-xs font-mono font-bold text-slate-600 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {schedule.scheduledDate}
                    </span>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                      <Syringe className="w-5 h-5" />
                    </div>

                    <div>
                      <h3 className="font-bold text-sm text-slate-900 leading-snug">
                        {schedule.vaccineName}
                      </h3>
                      <p className="text-[11px] text-slate-500 mt-1">
                        {schedule.targetGroup}
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs space-y-2">
                    <div className="flex justify-between gap-2">
                      <span className="text-slate-500">Loại vaccine:</span>
                      <strong className="text-slate-800 text-right">
                        {schedule.vaccineType || 'Chưa cập nhật'}
                      </strong>
                    </div>

                    <div className="flex justify-between gap-2">
                      <span className="text-slate-500">Liều dùng:</span>
                      <strong className="text-slate-800 text-right">
                        {schedule.dosage}
                      </strong>
                    </div>

                    <div className="flex justify-between gap-2">
                      <span className="text-slate-500">Nhân viên Thú y:</span>
                      <strong className="text-slate-800 text-right">
                        {schedule.assignedVeterinarianName ||
                          schedule.assignedVeterinarianEmail}
                      </strong>
                    </div>

                    <div className="flex justify-between gap-2">
                      <span className="text-slate-500">Số bò:</span>
                      <strong className="text-slate-800">
                        {schedule.cattleIds.length} con
                      </strong>
                    </div>
                  </div>

                  {schedule.notes && (
                    <p className="mt-2 text-[11px] text-slate-500 italic">
                      Ghi chú: {schedule.notes}
                    </p>
                  )}

                  <div className="mt-4 border-t border-slate-100 pt-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-slate-700">
                        Danh sách bò trong lịch
                      </span>

                      {isVeterinarian && !isDone && (
                        <button
                          onClick={() => checkScheduleRecords(schedule)}
                          disabled={checkingRecords}
                          className="text-[10px] text-indigo-600 font-bold hover:underline"
                        >
                          Kiểm tra hồ sơ
                        </button>
                      )}
                    </div>

                    <div className="space-y-2 max-h-44 overflow-y-auto">
                      {schedule.cattleIds.map((cattleId) => {
                        const hasRecord = recordedIds.includes(cattleId);

                        return (
                          <div
                            key={cattleId}
                            className="flex items-center justify-between gap-2 text-xs"
                          >
                            <span className="text-slate-600 truncate">
                              {getCattleName(cattleId)}
                            </span>

                            {isVeterinarian && !isDone && (
                              hasRecord ? (
                                <span className="text-emerald-700 font-bold flex items-center gap-1 shrink-0">
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  Đã ghi nhận
                                </span>
                              ) : (
                                <button
                                  onClick={() =>
                                    openRecordModal(schedule, cattleId)
                                  }
                                  className="text-indigo-600 font-bold hover:underline shrink-0"
                                >
                                  Ghi nhận tiêm
                                </button>
                              )
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {isManager && !isDone && schedule.status !== 'CANCELLED' && (
                  <button
                    onClick={() => handleConfirmSchedule(schedule)}
                    disabled={submitting}
                    className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Xác Nhận Hoàn Thành
                  </button>
                )}

                {isDone && (
                  <div className="w-full py-2 bg-emerald-50 text-emerald-800 text-center font-bold text-xs rounded-xl flex items-center justify-center gap-1">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    Đã hoàn tất
                    {schedule.completedAt
                      ? ` (${schedule.completedAt.slice(0, 10)})`
                      : ''}
                  </div>
                )}

                {isAdmin && (
                  <div className="text-[10px] text-slate-400 text-center">
                    Chế độ xem — không có quyền thao tác nghiệp vụ
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Modal tạo lịch tiêm - FARM_MANAGER */}
      {isAddModalOpen && isManager && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-base text-slate-900">
                Lên Lịch Tiêm Phòng Vaccine Mới
              </h3>

              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSchedule} className="space-y-4 mt-4 text-xs">  
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Tên Vaccine
              </label>
              <select
                value={customVaccineName ? 'OTHER' : formData.vaccineName}
                onChange={(e) => {
                  const value = e.target.value;
                  setCustomVaccineName(value === 'OTHER');
                  setFormData({
                    vaccineName: VACCINE_NAME_OPTIONS[0],
                    vaccineType: VACCINE_TYPE_OPTIONS[0],
                    dosage: VACCINE_DOSAGE_OPTIONS[0],
                    scheduledDate: today,
                    assignedVeterinarianEmail: '',
                    notes: 'Tiêm nhắc lại định kỳ 6 tháng',
                  });

                  setCustomVaccineName(false);
                  setCustomVaccineType(false);
                  setCustomDosage(false);
                }
              }
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white"
              >
                {VACCINE_NAME_OPTIONS.map((item) => (
                  <option key={item} value={item}>{item}</option>
                ))}
                <option value="OTHER">Khác – Nhập thủ công</option>
              </select>

              {customVaccineName && (
                <input
                  type="text"
                  required
                  value={formData.vaccineName}
                  onChange={(e) =>
                    setFormData({ ...formData, vaccineName: e.target.value })
                  }
                  placeholder="Nhập tên vaccine..."
                  className="w-full mt-2 px-3 py-2 rounded-xl border border-slate-200"
                />
              )}
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Loại Vaccine / Mục đích
              </label>
              <select
                value={customVaccineType ? 'OTHER' : formData.vaccineType}
                onChange={(e) => {
                  const value = e.target.value;
                  setCustomVaccineType(value === 'OTHER');
                  setFormData({
                    ...formData,
                    vaccineType: value === 'OTHER' ? '' : value,
                  });
                }}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white"
              >
                {VACCINE_TYPE_OPTIONS.map((item) => (
                  <option key={item} value={item}>{item}</option>
                ))}
                <option value="OTHER">Khác – Nhập thủ công</option>
              </select>

              {customVaccineType && (
                <input
                  type="text"
                  required
                  value={formData.vaccineType}
                  onChange={(e) =>
                    setFormData({ ...formData, vaccineType: e.target.value })
                  }
                  placeholder="Nhập loại vaccine hoặc mục đích..."
                  className="w-full mt-2 px-3 py-2 rounded-xl border border-slate-200"
                />
              )}
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Liều lượng và đường tiêm
              </label>
              <select
                value={customDosage ? 'OTHER' : formData.dosage}
                onChange={(e) => {
                  const value = e.target.value;
                  setCustomDosage(value === 'OTHER');
                  setFormData({
                    ...formData,
                    dosage: value === 'OTHER' ? '' : value,
                  });
                }}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white"
              >
                {VACCINE_DOSAGE_OPTIONS.map((item) => (
                  <option key={item} value={item}>{item}</option>
                ))}
                <option value="OTHER">Khác – Nhập thủ công</option>
              </select>

              {customDosage && (
                <input
                  type="text"
                  required
                  value={formData.dosage}
                  onChange={(e) =>
                    setFormData({ ...formData, dosage: e.target.value })
                  }
                  placeholder="Nhập theo hướng dẫn chuyên môn..."
                  className="w-full mt-2 px-3 py-2 rounded-xl border border-slate-200"
                />
              )}
            </div>




                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Ngày tiêm dự kiến
                  </label>
                  <input
                    type="date"
                    required
                    min={today}
                    value={formData.scheduledDate}
                    onChange={(e) =>
                      setFormData({ ...formData, scheduledDate: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-200"
                  />
                </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Phân công nhân viên Thú y
                </label>
                <select
                  required
                  value={formData.assignedVeterinarianEmail}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      assignedVeterinarianEmail: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white"
                >
                  <option value="">-- Chọn nhân viên Thú y --</option>
                  {veterinarians.map((vet) => (
                    <option key={vet.id} value={vet.email}>
                      {vet.fullName || vet.username || vet.email} - {vet.email}
                    </option>
                  ))}
                </select>

                {veterinarians.length === 0 && (
                  <p className="text-amber-700 mt-1">
                    Chưa tìm thấy nhân viên STAFF thuộc bộ phận Thú y đang hoạt động.
                  </p>
                )}
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="font-semibold text-slate-700">
                    Chọn bò cần tiêm
                  </label>
                  <span className="text-emerald-700 font-bold">
                    Đã chọn: {selectedCattleIds.length} con
                  </span>
                </div>

                <div className="border border-slate-200 rounded-xl p-3 max-h-48 overflow-y-auto space-y-2">
                  {cattle.length === 0 ? (
                    <p className="text-slate-500">
                      Chưa có dữ liệu bò. Vui lòng tải lại trang.
                    </p>
                  ) : (
                    cattle.map((cow) => (
                      <label
                        key={cow.id}
                        className="flex items-center gap-2 p-2 rounded-lg hover:bg-slate-50 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={selectedCattleIds.includes(cow.id)}
                          onChange={() => toggleCattle(cow.id)}
                          className="accent-emerald-600"
                        />

                        <span className="flex-1 text-slate-700">
                          {cow.name} — {cow.rfidTag || cow.id}
                        </span>

                        <span className="text-slate-400">
                          {cow.penId || ''}
                        </span>
                      </label>
                    ))
                  )}
                </div>

                <div className="flex gap-2 mt-2">
                  <button
                    type="button"
                    onClick={() => setSelectedCattleIds(cattle.map((cow) => cow.id))}
                    className="text-indigo-600 font-semibold hover:underline"
                  >
                    Chọn tất cả
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedCattleIds([])}
                    className="text-slate-500 font-semibold hover:underline"
                  >
                    Bỏ chọn
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Ghi chú hướng dẫn
                </label>
                <textarea
                  rows={3}
                  value={formData.notes}
                  onChange={(e) =>
                    setFormData({ ...formData, notes: e.target.value })
                  }
                  className="w-full p-3 rounded-xl border border-slate-200"
                  placeholder="Ghi chú cho nhân viên thực hiện..."
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 font-semibold"
                >
                  Hủy
                </button>

                <button
                  type="submit"
                  disabled={submitting || veterinarians.length === 0}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl font-bold"
                >
                  {submitting ? 'Đang tạo...' : 'Tạo và phân công lịch'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal ghi nhận tiêm thực tế - STAFF Thú y */}
      {recordModal && isVeterinarian && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-base text-slate-900">
                  Ghi Nhận Kết Quả Tiêm
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  {getCattleName(recordModal.cattleId)}
                </p>
              </div>

              <button
                onClick={() => setRecordModal(null)}
                className="p-1 text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={handleSaveVaccinationRecord}
              className="space-y-3 mt-4 text-xs"
            >
              <div className="p-3 bg-indigo-50 rounded-xl">
                <p className="font-bold text-indigo-800">
                  {recordModal.schedule.vaccineName}
                </p>
                <p className="text-indigo-700 mt-1">
                  Liều dùng: {recordModal.schedule.dosage}
                </p>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Ngày tiêm thực tế
                </label>
                <input
                  type="date"
                  required
                  min={recordModal.schedule.scheduledDate}
                  value={recordForm.vaccinationDate}
                  onChange={(e) =>
                    setRecordForm({
                      ...recordForm,
                      vaccinationDate: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 rounded-xl border border-slate-200"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Ngày tiêm nhắc lại (nếu có)
                </label>
                <input
                  type="date"
                  value={recordForm.nextVaccinationDate}
                  onChange={(e) =>
                    setRecordForm({
                      ...recordForm,
                      nextVaccinationDate: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 rounded-xl border border-slate-200"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Số lô vaccine
                  </label>
                  <select
                    value={customBatchNumber ? 'OTHER' : recordForm.batchNumber}
                    onChange={(e) => {
                      const value = e.target.value;
                      setCustomBatchNumber(value === 'OTHER');
                      setRecordForm({
                        ...recordForm,
                        batchNumber: value === 'OTHER' ? '' : value,
                      });
                    }}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white"
                  >
                    <option value="">-- Chọn số lô --</option>
                    {VACCINE_BATCH_OPTIONS.map((item) => (
                      <option key={item} value={item}>{item}</option>
                    ))}
                    <option value="OTHER">Khác – Nhập thủ công</option>
                  </select>

                  {customBatchNumber && (
                    <input
                      type="text"
                      value={recordForm.batchNumber}
                      onChange={(e) =>
                        setRecordForm({ ...recordForm, batchNumber: e.target.value })
                      }
                      placeholder="Nhập số lô trên nhãn vaccine..."
                      className="w-full mt-2 px-3 py-2 rounded-xl border border-slate-200"
                    />
                  )}
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Nhà sản xuất
                  </label>
                  <select
                    value={customManufacturer ? 'OTHER' : recordForm.manufacturer}
                    onChange={(e) => {
                      const value = e.target.value;
                      setCustomManufacturer(value === 'OTHER');
                      setRecordForm({
                        ...recordForm,
                        manufacturer: value === 'OTHER' ? '' : value,
                      });
                    }}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white"
                  >
                    <option value="">-- Chọn nhà sản xuất --</option>
                    {VACCINE_MANUFACTURER_OPTIONS
                      .filter((item) => item !== 'Khác')
                      .map((item) => (
                        <option key={item} value={item}>{item}</option>
                      ))}
                    <option value="OTHER">Khác – Nhập thủ công</option>
                  </select>

                  {customManufacturer && (
                    <input
                      type="text"
                      value={recordForm.manufacturer}
                      onChange={(e) =>
                        setRecordForm({ ...recordForm, manufacturer: e.target.value })
                      }
                      placeholder="Nhập tên nhà sản xuất..."
                      className="w-full mt-2 px-3 py-2 rounded-xl border border-slate-200"
                    />
                  )}
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Ghi chú kết quả
                  </label>
                  <select
                    value={customRecordNote ? 'OTHER' : recordForm.notes}
                    onChange={(e) => {
                      const value = e.target.value;
                      setCustomRecordNote(value === 'OTHER');
                      setRecordForm({
                        ...recordForm,
                        notes: value === 'OTHER' ? '' : value,
                      });
                    }}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white"
                  >
                    <option value="">-- Chọn ghi chú --</option>
                    {VACCINATION_NOTE_OPTIONS.map((item) => (
                      <option key={item} value={item}>{item}</option>
                    ))}
                    <option value="OTHER">Khác – Nhập thủ công</option>
                  </select>

                  {customRecordNote && (
                    <textarea
                      rows={3}
                      value={recordForm.notes}
                      onChange={(e) =>
                        setRecordForm({ ...recordForm, notes: e.target.value })
                      }
                      placeholder="Nhập ghi chú kết quả tiêm..."
                      className="w-full mt-2 p-3 rounded-xl border border-slate-200"
                    />
                  )}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setRecordModal(null)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 font-semibold"
                >
                  Hủy
                </button>

                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-emerald-600 text-white rounded-xl font-bold disabled:opacity-50"
                >
                  {submitting ? 'Đang lưu...' : 'Lưu kết quả tiêm'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

            {/* Modal kiểm tra hồ sơ tiêm */}
      {recordsModal && (
        <div className="fixed inset-0 z-[60] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[85vh] overflow-y-auto p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-base text-slate-900">
                  Hồ Sơ Tiêm Chủng Thực Tế
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  {recordsModal.schedule.vaccineName}
                </p>
              </div>

              <button
                onClick={() => setRecordsModal(null)}
                className="p-1 text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4">
              <p className="text-xs text-slate-600 mb-3">
                Tổng số bò: {recordsModal.schedule.cattleIds.length} |
                Đã có hồ sơ: {recordsModal.records.length}
              </p>

              {recordsModal.records.length === 0 ? (
                <div className="p-6 text-center bg-slate-50 rounded-xl">
                  <AlertCircle className="w-8 h-8 text-amber-500 mx-auto mb-2" />
                  <p className="font-bold text-slate-700">
                    Chưa tìm thấy hồ sơ tiêm phù hợp
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    Chưa có hồ sơ trùng tên vaccine và ngày tiêm của lịch này.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {recordsModal.records.map(({ cattleId, cattleName, record }) => (
                    <div
                      key={record.id}
                      className="p-4 border border-slate-200 rounded-xl"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <strong className="text-sm text-slate-800">
                          {cattleName}
                        </strong>
                        <span className="text-xs text-emerald-700 font-bold">
                          Đã ghi nhận
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3 text-xs">
                        <div>
                          <span className="text-slate-500">Ngày tiêm:</span>
                          <p className="font-semibold text-slate-800">
                            {record.vaccinationDate || 'Chưa cập nhật'}
                          </p>
                        </div>

                        <div>
                          <span className="text-slate-500">Số lô vaccine:</span>
                          <p className="font-semibold text-slate-800">
                            {record.batchNumber || 'Chưa cập nhật'}
                          </p>
                        </div>

                        <div>
                          <span className="text-slate-500">Nhà sản xuất:</span>
                          <p className="font-semibold text-slate-800">
                            {record.manufacturer || 'Chưa cập nhật'}
                          </p>
                        </div>

                        <div>
                          <span className="text-slate-500">Người thực hiện:</span>
                          <p className="font-semibold text-slate-800">
                            {record.administeredBy || 'Chưa cập nhật'}
                          </p>
                        </div>

                        <div className="sm:col-span-2">
                          <span className="text-slate-500">Ghi chú:</span>
                          <p className="font-semibold text-slate-800">
                            {record.notes || 'Không có ghi chú'}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end mt-5">
              <button
                onClick={() => setRecordsModal(null)}
                className="px-5 py-2 bg-slate-800 text-white rounded-xl text-xs font-bold"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
