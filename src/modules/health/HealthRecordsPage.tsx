
import React, { useEffect, useMemo, useState } from 'react';
import { useFarmStore } from '../../store/useFarmStore';
import { useAuthStore } from '../../store/useAuthStore';
import { getAllBarnsApi } from '../../services/barnService';
import { Cattle } from '../../types';
import {
  HealthRecord,
  HealthRecordRequest,
  VeterinaryStaffOption,
  getAllHealthRecordsApi,
  getHealthRecordsByCattleIdApi,
  createHealthRecordApi,
  updateHealthRecordApi,
  confirmWithdrawalStatusApi,
  getAvailableVeterinariansApi,
  assignVeterinarianApi,
  getMyAssignedHealthRecordsApi,
} from '../../services/healthService';
import { getAllCattleApi } from '../../services/cattleService';
import {
  HeartPulse,
  Plus,
  AlertTriangle,
  Search,
  X,
  RefreshCw,
  ClipboardCheck,
  Stethoscope,
} from 'lucide-react';

export const HealthRecordsPage: React.FC = () => {
  const { addToast } = useFarmStore();
  const { currentUser } = useAuthStore();

  const [healthRecords, setHealthRecords] = useState<HealthRecord[]>([]);
  const [cattleList, setCattleList] = useState<Cattle[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<HealthRecord | null>(null);
  const [selectedSymptom, setSelectedSymptom] = useState('');

  const [veterinaryStaff, setVeterinaryStaff] = useState<VeterinaryStaffOption[]>([]);
  const [selectedVetIds, setSelectedVetIds] = useState<Record<string, string>>({});
  const [assigningRecordId, setAssigningRecordId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    cattleId: '',
    date: new Date().toISOString().split('T')[0],
    diagnosis: '',
    symptoms: '',
    treatment: '',
    medication: '',
    dose: '',
    treatmentStartDate: '',
    treatmentEndDate: '',
    followUpDate: '',
    withdrawalPeriodDays: 0,
    notes: '',
  });

  const normalizeDepartment = (value: string = '') =>
    value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/Đ/g, 'D')
      .toLowerCase()
      .trim();

  const isStaff = currentUser?.role === 'STAFF';

  const isCareStaff =
    isStaff &&
    normalizeDepartment(currentUser?.department || '') === 'cham soc bo';

  const isVeterinary =
    isStaff &&
    normalizeDepartment(currentUser?.department || '') === 'thu y';

  const isManager = currentUser?.role === 'FARM_MANAGER';
  const isAdmin = currentUser?.role === 'ADMIN';

  const canCreate = isCareStaff || isVeterinary;
  const canUpdate = isVeterinary;
  const canConfirm = isManager;

  const getCattleInfo = (cattleId: string) =>
    cattleList.find((cow) => String(cow.id) === String(cattleId));

  
  const loadHealthRecords = async () => {
    setIsLoading(true);

    try {
      const cattleFromApi = await getAllCattleApi();

      let visibleCattle = cattleFromApi;
      let records: HealthRecord[] = [];

      if (isVeterinary) {
        // Thú y chỉ tải hồ sơ được quản lý phân công.
        records = await getMyAssignedHealthRecordsApi();

        // Bổ sung thông tin bò để hiển thị tên, RFID.
        const cattleIds = new Set(records.map((record) => record.cattleId));
        visibleCattle = cattleFromApi.filter((cow) =>
          cattleIds.has(String(cow.id))
        );
      } else if (isCareStaff) {
        const barnsFromApi = await getAllBarnsApi();
        const assignedBarnIds = currentUser?.assignedPens ?? [];

        const assignedBarnCodes = barnsFromApi
          .filter((barn) => assignedBarnIds.includes(String(barn.id)))
          .map((barn) => barn.code);

        visibleCattle = cattleFromApi.filter((cow) =>
          assignedBarnCodes.includes(cow.penId || '')
        );

        const results = await Promise.all(
          visibleCattle.map((cow) => getHealthRecordsByCattleIdApi(cow.id))
        );

        records = results.flat();
      } else {
        // FARM_MANAGER và ADMIN xem toàn bộ.
        records = await getAllHealthRecordsApi();
      }

      setCattleList(visibleCattle);

      const sortedRecords = [...records].sort((a, b) => {
        const dateA = a.createdAt
          ? new Date(a.createdAt).getTime()
          : new Date(a.examinationDate || 0).getTime();

        const dateB = b.createdAt
          ? new Date(b.createdAt).getTime()
          : new Date(b.examinationDate || 0).getTime();

        return dateB - dateA;
      });

      setHealthRecords(sortedRecords);

      if (isManager) {
        const vets = await getAvailableVeterinariansApi();
        setVeterinaryStaff(vets);
      }

      setFormData((previous) => ({
        ...previous,
        cattleId: visibleCattle.some(
          (cow) => String(cow.id) === String(previous.cattleId)
        )
          ? previous.cattleId
          : visibleCattle[0]?.id || '',
      }));
    } catch (error) {
      addToast(
        'error',
        'Lỗi tải dữ liệu',
        error instanceof Error
          ? error.message
          : 'Không thể tải hồ sơ sức khỏe!'
      );
    } finally {
      setIsLoading(false);
    }
  };


  useEffect(() => {
    loadHealthRecords();
  }, [currentUser?.role, currentUser?.department]);

  const resetForm = () => {
    setFormData({
      cattleId: cattleList[0]?.id || '',
      date: new Date().toISOString().split('T')[0],
      diagnosis: '',
      symptoms: '',
      treatment: '',
      medication: '',
      dose: '',
      treatmentStartDate: '',
      treatmentEndDate: '',
      followUpDate: '',
      withdrawalPeriodDays: 0,
      notes: '',
    });

    setSelectedSymptom('');
    setEditingRecord(null);
  };

  const openCreateModal = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const openUpdateModal = (record: HealthRecord) => {
    setEditingRecord(record);

    setFormData({
      cattleId: record.cattleId || '',
      date: record.examinationDate || new Date().toISOString().split('T')[0],
      symptoms: record.symptoms || '',
      diagnosis: record.diagnosis || '',
      treatment: record.treatment || '',
      medication: record.medicine || '',
      dose: record.dosage || '',
      treatmentStartDate: record.treatmentStartDate || '',
      treatmentEndDate: record.treatmentEndDate || '',
      followUpDate: record.followUpDate || '',
      withdrawalPeriodDays: record.withdrawalPeriodDays ?? 0,
      notes: record.notes || '',
    });

    setSelectedSymptom('');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const combinedSymptoms = [
      selectedSymptom.trim(),
      formData.symptoms.trim(),
    ]
      .filter(Boolean)
      .join('. ');

    if (!combinedSymptoms) {
      addToast(
        'error',
        'Thiếu thông tin',
        'Vui lòng nhập triệu chứng hoặc dấu hiệu quan sát!'
      );
      return;
    }

    if (canUpdate && !formData.diagnosis.trim()) {
      addToast(
        'error',
        'Thiếu thông tin',
        'Vui lòng nhập kết luận chuyên môn!'
      );
      return;
    }

    if (
      canUpdate &&
      formData.medication.trim() &&
      (formData.withdrawalPeriodDays < 0 ||
        (formData.withdrawalPeriodDays > 0 &&
          !formData.treatmentEndDate))
    ) {
      addToast(
        'error',
        'Thiếu thông tin',
        'Vui lòng nhập ngày kết thúc điều trị và số ngày ngừng thuốc hợp lệ!'
      );
      return;
    }

    setIsSaving(true);

    try {
      const payload: HealthRecordRequest = {
        cattleId: formData.cattleId,
        examinationDate: formData.date,
        symptoms: combinedSymptoms,
        diagnosis: canUpdate ? formData.diagnosis.trim() : '',
        treatment: canUpdate ? formData.treatment : undefined,
        medicine: canUpdate ? formData.medication : undefined,
        dosage: canUpdate ? formData.dose : undefined,
        treatmentStartDate: canUpdate
          ? formData.treatmentStartDate || undefined
          : undefined,
        treatmentEndDate: canUpdate
          ? formData.treatmentEndDate || undefined
          : undefined,
        followUpDate: formData.followUpDate || undefined,
       withdrawalPeriodDays: canUpdate
        ? Number(formData.withdrawalPeriodDays)
        : undefined,
        notes: formData.notes,
      };

      if (editingRecord) {
        const updated = await updateHealthRecordApi(
          editingRecord.id,
          payload
        );

        setHealthRecords((previous) =>
          previous.map((item) =>
            item.id === updated.id ? updated : item
          )
        );

        addToast(
          'success',
          'Cập nhật thành công',
          'Thú y đã cập nhật hồ sơ. Hồ sơ đang chờ quản lý xác nhận.'
        );
      } else {
        const saved = await createHealthRecordApi(payload);

        setHealthRecords((previous) => [saved, ...previous]);

        addToast(
          'success',
          'Lưu thành công',
          'Hồ sơ quan sát đã được gửi đến bộ phận Thú y.'
        );
      }

      setIsModalOpen(false);
      resetForm();
    } catch (error) {
      addToast(
        'error',
        'Không thể lưu hồ sơ',
        error instanceof Error ? error.message : 'Đã xảy ra lỗi!'
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleAssignVeterinarian = async (record: HealthRecord) => {
    const vetId = selectedVetIds[record.id];

    if (!vetId) {
      addToast('error', 'Chưa chọn nhân viên', 'Vui lòng chọn nhân viên thú y!');
      return;
    }

    if (!window.confirm('Bạn có chắc chắn muốn phân công nhân viên thú y này?')) {
      return;
    }

    setAssigningRecordId(record.id);

    try {
      const updated = await assignVeterinarianApi(record.id, vetId);

      setHealthRecords((previous) =>
        previous.map((item) =>
          item.id === updated.id ? updated : item
        )
      );

      addToast(
        'success',
        'Phân công thành công',
        `Đã giao hồ sơ cho ${updated.assignedVetName || 'nhân viên thú y'}.`
      );
    } catch (error) {
      addToast(
        'error',
        'Không thể phân công',
        error instanceof Error ? error.message : 'Đã xảy ra lỗi!'
      );
    } finally {
      setAssigningRecordId(null);
    }
  };

  const handleConfirmWithdrawal = async (
    record: HealthRecord,
    status: string
  ) => {
    const messages: Record<string, string> = {
      WAITING: 'Xác nhận hồ sơ đang trong thời gian ngừng thuốc?',
      COMPLETED: 'Xác nhận đã hoàn thành thời gian ngừng thuốc?',
      NO_WITHDRAWAL_REQUIRED: 'Xác nhận hồ sơ không cần thời gian ngừng thuốc?',
    };

    if (!window.confirm(messages[status])) {
      return;
    }

    try {
      const updated = await confirmWithdrawalStatusApi(
        record.id,
        status
      );

      setHealthRecords((previous) =>
        previous.map((item) =>
          item.id === updated.id ? updated : item
        )
      );

      addToast(
        'success',
        'Xác nhận thành công',
        'Trạng thái hồ sơ sức khỏe đã được cập nhật.'
      );
    } catch (error) {
      addToast(
        'error',
        'Không thể xác nhận',
        error instanceof Error ? error.message : 'Đã xảy ra lỗi!'
      );
    }
  };

 const getRecordStatusLabel = (
    status?: string,
    withdrawalStatus?: string
  ) => {
    if (withdrawalStatus === 'WAITING') {
      return 'Đang ngừng thuốc';
    }

    if (withdrawalStatus === 'COMPLETED') {
      return 'Đã hết thời gian ngừng thuốc';
    }

    if (withdrawalStatus === 'NO_WITHDRAWAL_REQUIRED') {
      return 'Không yêu cầu ngừng thuốc';
    }

    switch (status) {
      case 'PENDING_VET_REVIEW':
        return 'Chờ thú y kiểm tra';

      case 'WAITING_MANAGER_CONFIRMATION':
        return 'Chờ quản lý xác nhận';

      case 'IN_TREATMENT':
        return 'Đang điều trị';

      case 'COMPLETED':
        return 'Đã hoàn thành';

      default:
        return 'Chưa xác định trạng thái';
    }
  };

  const getRecordStatusClass = (
    status?: string,
    withdrawalStatus?: string
  ) => {
    if (withdrawalStatus === 'WAITING') {
      return 'bg-orange-100 text-orange-800 border-orange-200';
    }

    if (
      withdrawalStatus === 'COMPLETED' ||
      withdrawalStatus === 'NO_WITHDRAWAL_REQUIRED'
    ) {
      return 'bg-emerald-100 text-emerald-800 border-emerald-200';
    }

    switch (status) {
      case 'PENDING_VET_REVIEW':
        return 'bg-blue-100 text-blue-800 border-blue-200';

      case 'WAITING_MANAGER_CONFIRMATION':
        return 'bg-amber-100 text-amber-800 border-amber-200';

      case 'IN_TREATMENT':
        return 'bg-orange-100 text-orange-800 border-orange-200';

      case 'COMPLETED':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';

      default:
        return 'bg-slate-100 text-slate-600 border-slate-200';
    }
  };

  const filtered = useMemo(() => {
    return healthRecords.filter((record) => {
      const keyword = searchTerm.toLowerCase();
      const cow = getCattleInfo(record.cattleId);

      const matchesSearch =
        (cow?.name || '').toLowerCase().includes(keyword) ||
        (record.cattleId || '').toLowerCase().includes(keyword) ||
        (record.rfidTag || '').toLowerCase().includes(keyword) ||
        (record.diagnosis || '').toLowerCase().includes(keyword) ||
        (record.medicine || '').toLowerCase().includes(keyword);

      const matchesStatus =
        filterStatus === 'ALL' ||
        record.withdrawalStatus === filterStatus ||
        record.recordStatus === filterStatus;

      return matchesSearch && matchesStatus;
    });
  }, [healthRecords, searchTerm, filterStatus, cattleList]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));

  const paginatedRecords = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filtered.slice(startIndex, startIndex + pageSize);
  }, [filtered, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterStatus]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900">
              Hồ Sơ Sức Khỏe, Điều Trị & Tiêm Phòng
            </h1>
            <span className="text-xs bg-rose-50 text-rose-700 border border-rose-200 px-2.5 py-0.5 rounded-full font-bold">
              {healthRecords.length} hồ sơ
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Theo dõi quan sát, khám thú y, điều trị và thời gian ngừng thuốc
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={loadHealthRecords}
            className="px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Làm mới
          </button>

          {canCreate && (
            <button
              onClick={openCreateModal}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              Ghi nhận quan sát
            </button>
          )}
        </div>
      </div>

      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm theo mã bò, RFID, chẩn đoán hoặc tên thuốc..."
            className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-slate-200"
          />
        </div>

        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="py-2 px-3 text-xs rounded-xl border border-slate-200 bg-white font-semibold"
        >
          <option value="ALL">Tất cả trạng thái</option>
          <option value="PENDING_VET_REVIEW">Chờ thú y kiểm tra</option>
          <option value="WAITING_MANAGER_CONFIRMATION">Chờ quản lý xác nhận</option>
          <option value="IN_TREATMENT">Đang điều trị / ngừng thuốc</option>
          <option value="COMPLETED">Đã hoàn thành</option>
          <option value="NOT_CONFIRMED">Chưa xác nhận ngừng thuốc</option>
          <option value="WAITING">Đang ngừng thuốc</option>
          <option value="NO_WITHDRAWAL_REQUIRED">Không cần ngừng thuốc</option>
        </select>
      </div>

      {isLoading ? (
        <div className="bg-white rounded-2xl p-10 text-center text-sm text-slate-500">
          Đang tải hồ sơ sức khỏe...
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center text-sm text-slate-500">
              Không tìm thấy hồ sơ sức khỏe phù hợp.
            </div>
          ) : (
            paginatedRecords.map((record) => {
            // Xác định ngày kết thúc ngừng thuốc
            const endDate = record.withdrawalEndDate
              ? new Date(`${record.withdrawalEndDate}T00:00:00`)
              : null;

            const today = new Date();
            today.setHours(0, 0, 0, 0);

            // Chỉ được xác nhận hoàn thành khi đã qua ngày kết thúc
            const canCompleteWithdrawal =
              !!endDate && today > endDate;

            const canVetUpdate =
              canUpdate &&
              record.recordStatus === 'PENDING_VET_REVIEW';

            // Quản lý xác nhận kết quả khám lần đầu
            const needsInitialManagerConfirm =
              canConfirm &&
              record.recordStatus === 'WAITING_MANAGER_CONFIRMATION';

            // Quản lý xác nhận hết thời gian ngừng thuốc
            const canManagerCompleteWithdrawal =
              canConfirm &&
              record.recordStatus === 'IN_TREATMENT' &&
              record.withdrawalStatus === 'WAITING' &&
              canCompleteWithdrawal;

            const canManagerConfirm =
              needsInitialManagerConfirm || canManagerCompleteWithdrawal;

            return (
                <div
                  key={record.id}
                  className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
                        <HeartPulse className="w-5 h-5" />
                      </div>

                      <div>
                        <span className="font-extrabold text-slate-900 text-sm">
                          {getCattleInfo(record.cattleId)?.name || 'Chưa xác định tên bò'}
                        </span>
                        <p className="text-xs text-slate-500">
                          Mã bò: {record.cattleId}
                        </p>
                        <p className="font-mono text-xs text-slate-500">
                          RFID: {record.rfidTag || 'Chưa có'}
                        </p>
                        <span className="text-[11px] text-slate-400">
                          Ngày khám: {record.examinationDate || 'Chưa xác định'}
                        </span>

                        <p className="text-[11px] text-emerald-700 font-semibold mt-1">
                          Tạo lúc:{' '}
                          {record.createdAt
                            ? new Date(record.createdAt).toLocaleString('vi-VN', {
                                day: '2-digit',
                                month: '2-digit',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                                second: '2-digit',
                              })
                            : 'Chưa có thời gian tạo'}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-col items-start sm:items-end gap-1">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getRecordStatusClass(
                                                                                            record.recordStatus,
                                                                                            record.withdrawalStatus
                                                                                          )}`}>
                        {getRecordStatusLabel(
                          record.recordStatus,
                          record.withdrawalStatus
                        )}
                      </span>
                      <span className="text-[11px] text-slate-500">
                        Ngừng thuốc: {
                          record.withdrawalStatus === 'NOT_CONFIRMED'
                            ? 'Chưa xác nhận'
                            : record.withdrawalStatus === 'WAITING'
                              ? 'Đang ngừng thuốc'
                              : record.withdrawalStatus === 'COMPLETED'
                                ? 'Đã hoàn thành'
                                : record.withdrawalStatus === 'NO_WITHDRAWAL_REQUIRED'
                                  ? 'Không cần ngừng thuốc'
                                  : 'Chưa cập nhật'
                        }
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    <div className="space-y-1.5">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">
                        Chẩn đoán & Triệu chứng
                      </span>
                      <p className="font-bold text-slate-900">
                        {record.diagnosis || 'Chưa có kết luận chuyên môn'}
                      </p>
                      <p className="text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                        {record.symptoms}
                      </p>
                    </div>

                    <div className="space-y-1.5">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">
                        Điều trị & Thuốc
                      </span>
                      <p className="text-slate-800 font-medium">
                        {record.treatment || 'Chưa cập nhật'}
                      </p>
                      <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
                        <p className="text-slate-700">
                          Thuốc: <strong>{record.medicine || 'Chưa cập nhật'}</strong>
                        </p>
                        <p className="text-slate-700">
                          Liều lượng: {record.dosage || 'Chưa cập nhật'}
                        </p>
                        <p className="text-slate-500">
                          Người ghi nhận: <strong>{record.recordedBy || 'Không rõ'}</strong>
                        </p>
                        {record.vetReviewedBy && (
                          <p className="text-slate-500">
                            Thú y cập nhật: <strong>{record.vetReviewedBy}</strong>
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {record.withdrawalPeriodDays != null &&
                    record.withdrawalPeriodDays > 0 ? (
                      <div className="p-3 bg-amber-50/70 border border-amber-200/80 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                          <span className="text-amber-900 font-semibold">
                            Thời gian ngừng thuốc: {record.withdrawalPeriodDays} ngày
                          </span>
                        </div>
                        <span className="text-amber-800">
                          Ngày kết thúc: {record.withdrawalEndDate || 'Chưa xác định'}
                        </span>
                      </div>
                    ) : (
                      <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600">
                        {record.withdrawalStatus === 'NO_WITHDRAWAL_REQUIRED'
                          ? 'Hồ sơ không yêu cầu thời gian ngừng thuốc.'
                          : 'Không có thời gian ngừng thuốc.'}
                      </div>
                    )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                    <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl">
                      <p className="text-blue-700 font-bold mb-1">
                        Ngày tái khám
                      </p>
                      <p className="text-slate-700">
                        {record.followUpDate || 'Chưa có lịch tái khám'}
                      </p>
                    </div>

                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                      <p className="text-slate-500 font-bold mb-1">
                        Ghi chú
                      </p>
                      <p className="text-slate-700">
                        {record.notes || 'Không có ghi chú'}
                      </p>
                    </div>
                  </div>

                  {isManager && record.recordStatus === 'PENDING_VET_REVIEW' && (
                    <div className="pt-3 border-t border-slate-100 space-y-3">
                      <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
                        <Stethoscope className="w-4 h-4 text-blue-600" />
                        Phân công nhân viên thú y
                      </div>

                      <div className="flex flex-col sm:flex-row gap-2">
                        <select
                          value={selectedVetIds[record.id] || record.assignedVetId || ''}
                          onChange={(e) =>
                            setSelectedVetIds((previous) => ({
                              ...previous,
                              [record.id]: e.target.value,
                            }))
                          }
                          className="flex-1 px-3 py-2 border border-slate-200 rounded-xl text-xs bg-white"
                        >
                          <option value="">-- Chọn nhân viên thú y --</option>

                          {veterinaryStaff.map((vet) => (
                            <option key={vet.id} value={vet.id}>
                              {vet.fullName} ({vet.email})
                            </option>
                          ))}
                        </select>

                        <button
                          onClick={() => handleAssignVeterinarian(record)}
                          disabled={assigningRecordId === record.id || veterinaryStaff.length === 0}
                          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold"
                        >
                          {assigningRecordId === record.id
                            ? 'Đang phân công...'
                            : 'Phân công thú y'}
                        </button>
                      </div>

                      {veterinaryStaff.length === 0 && (
                        <p className="text-xs text-amber-600">
                          Chưa có nhân viên thú y đang hoạt động trong hệ thống.
                        </p>
                      )}
                    </div>
                  )}

                  {record.assignedVetName && (
                    <div className="text-xs text-blue-700 bg-blue-50 border border-blue-100 rounded-xl p-3">
                      Nhân viên thú y phụ trách: <strong>{record.assignedVetName}</strong>
                      {record.assignedVetEmail && (
                        <span> ({record.assignedVetEmail})</span>
                      )}
                    </div>
                  )}

                  {canVetUpdate && (
                    <div className="pt-2 border-t border-slate-100">
                      <button
                        onClick={() => openUpdateModal(record)}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-2"
                      >
                        <Stethoscope className="w-4 h-4" />
                        Kiểm tra và cập nhật hồ sơ
                      </button>
                    </div>
                  )}

                  {canManagerConfirm && (
                  <div className="pt-3 border-t border-slate-100 space-y-2">
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
                      <ClipboardCheck className="w-4 h-4" />
                      Xác nhận của quản lý
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {needsInitialManagerConfirm && (
                        <>
                          {record.withdrawalPeriodDays != null &&
                            record.withdrawalPeriodDays > 0 && (
                              <button
                                onClick={() =>
                                  handleConfirmWithdrawal(record, 'WAITING')
                                }
                                className="px-3 py-2 bg-amber-100 text-amber-800 border border-amber-200 rounded-xl text-xs font-bold"
                              >
                                Xác nhận đang ngừng thuốc
                              </button>
                            )}

                          {(record.withdrawalPeriodDays == null ||
                            record.withdrawalPeriodDays === 0) && (
                            <button
                              onClick={() =>
                                handleConfirmWithdrawal(
                                  record,
                                  'NO_WITHDRAWAL_REQUIRED'
                                )
                              }
                              className="px-3 py-2 bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold"
                            >
                              Xác nhận không yêu cầu ngừng thuốc
                            </button>
                          )}
                        </>
                      )}

                      {canManagerCompleteWithdrawal && (
                        <button
                          onClick={() =>
                            handleConfirmWithdrawal(record, 'COMPLETED')
                          }
                          className="px-3 py-2 bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold"
                        >
                          Xác nhận đã hết thời gian ngừng thuốc
                        </button>
                      )}
                    </div>
                  </div>
                )}

                  {isAdmin && (
                    <p className="text-[11px] text-slate-400 border-t border-slate-100 pt-2">
                      Chế độ quản trị: chỉ xem dữ liệu, không thao tác nghiệp vụ.
                    </p>
                  )}
                </div>
              );
            })
          )}

          {filtered.length > 0 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white border border-slate-200 rounded-2xl px-4 py-3">
              <p className="text-xs text-slate-500">
                Đang hiển thị{' '}
                <strong className="text-slate-800">
                  {(currentPage - 1) * pageSize + 1}
                  {' - '}
                  {Math.min(currentPage * pageSize, filtered.length)}
                </strong>
                {' / '}
                <strong className="text-slate-800">
                  {filtered.length}
                </strong>{' '}
                hồ sơ
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
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-100 space-y-4 my-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-base text-slate-900">
                  {editingRecord
                    ? 'Thú y kiểm tra và cập nhật hồ sơ'
                    : 'Ghi nhận quan sát sức khỏe'}
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  {editingRecord
                    ? 'Cập nhật trên hồ sơ đã được nhân viên chăm sóc tạo.'
                    : 'Ghi lại dấu hiệu quan sát được của cá thể bò.'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsModalOpen(false);
                  resetForm();
                }}
                className="p-1 text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Cá thể bò
                </label>
                <select
                  required
                  disabled={!!editingRecord}
                  value={formData.cattleId}
                  onChange={(e) =>
                    setFormData({ ...formData, cattleId: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white disabled:bg-slate-100"
                >
                  <option value="">-- Chọn bò --</option>
                  {cattleList.map((cow) => (
                    <option key={cow.id} value={cow.id}>
                      {cow.name} - {cow.id} ({cow.breed}) • RFID: {cow.rfidTag}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Ngày khám
                </label>
                <input
                  type="date"
                  required
                  value={formData.date}
                  onChange={(e) =>
                    setFormData({ ...formData, date: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-xl border border-slate-200"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Triệu chứng / Dấu hiệu quan sát
                </label>
                <input
                  list="symptomSuggestions"
                  value={selectedSymptom}
                  onChange={(e) => setSelectedSymptom(e.target.value)}
                  placeholder="Chọn hoặc nhập dấu hiệu..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200"
                />

                <datalist id="symptomSuggestions">
                  <option value="Bỏ ăn hoặc ăn ít" />
                  <option value="Uống nước ít" />
                  <option value="Ít vận động" />
                  <option value="Đi lại khó khăn" />
                  <option value="Ho hoặc chảy nước mũi" />
                  <option value="Phân bất thường" />
                  <option value="Da có dấu hiệu bất thường" />
                  <option value="Chưa phát hiện dấu hiệu bất thường" />
                </datalist>

                <textarea
                  rows={3}
                  value={formData.symptoms}
                  onChange={(e) =>
                    setFormData({ ...formData, symptoms: e.target.value })
                  }
                  placeholder="Mô tả chi tiết biểu hiện quan sát được..."
                  className="w-full p-2 mt-2 rounded-xl border border-slate-200"
                />
              </div>

              {canUpdate && (
                <>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Chẩn đoán chuyên môn
                    </label>

                    <input
                      list="diagnosisSuggestions"
                      required
                      value={formData.diagnosis}
                      onChange={(e) =>
                        setFormData({ ...formData, diagnosis: e.target.value })
                      }
                      placeholder="Chọn gợi ý hoặc nhập chẩn đoán..."
                      className="w-full px-3 py-2 rounded-xl border border-slate-200"
                    />

                    <datalist id="diagnosisSuggestions">
                      <option value="Chưa phát hiện bất thường" />
                      <option value="Rối loạn tiêu hóa" />
                      <option value="Nghi viêm đường hô hấp" />
                      <option value="Nghi viêm da" />
                      <option value="Nghi nhiễm ký sinh trùng" />
                      <option value="Nghi viêm vú" />
                      <option value="Chấn thương" />
                      <option value="Nghi mắc bệnh truyền nhiễm" />
                      <option value="Khác - cần đánh giá thêm" />
                    </datalist>

                    <p className="text-[10px] text-slate-400 mt-1">
                      Có thể chọn nội dung gợi ý hoặc nhập kết luận chuyên môn riêng.
                    </p>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Phương pháp điều trị
                    </label>

                    <input
                      list="treatmentSuggestions"
                      value={formData.treatment}
                      onChange={(e) =>
                        setFormData({ ...formData, treatment: e.target.value })
                      }
                      placeholder="Chọn gợi ý hoặc nhập phương pháp điều trị..."
                      className="w-full px-3 py-2 rounded-xl border border-slate-200"
                    />

                    <datalist id="treatmentSuggestions">
                      <option value="Theo dõi và chăm sóc hỗ trợ" />
                      <option value="Điều chỉnh chế độ dinh dưỡng" />
                      <option value="Vệ sinh và sát trùng khu vực bị ảnh hưởng" />
                      <option value="Điều trị theo phác đồ thú y" />
                      <option value="Cách ly để theo dõi" />
                      <option value="Chăm sóc và tái khám định kỳ" />
                      <option value="Kết hợp các biện pháp theo chỉ định thú y" />
                      <option value="Khác - nhập phương pháp cụ thể" />
                    </datalist>

                    <p className="text-[10px] text-slate-400 mt-1">
                      Nhân viên thú y có thể nhập phương pháp điều trị phù hợp với kết quả kiểm tra.
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">
                        Tên thuốc
                      </label>
                      <input
                        list="medicineSuggestions"
                        value={formData.medication}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            medication: e.target.value,
                          })
                        }
                        placeholder="Nhập theo chỉ định..."
                        className="w-full px-3 py-2 rounded-xl border border-slate-200"
                      />
                      <datalist id="medicineSuggestions">
                        <option value="Thuốc theo chỉ định thú y" />
                        <option value="Thuốc kháng sinh theo chỉ định thú y" />
                        <option value="Thuốc chống viêm theo chỉ định thú y" />
                        <option value="Thuốc điều trị ký sinh trùng theo chỉ định thú y" />
                        <option value="Thuốc sát trùng theo chỉ định thú y" />
                        <option value="Vitamin và khoáng chất theo chỉ định thú y" />
                      </datalist>
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">
                        Liều lượng theo chỉ định
                      </label>
                      <input
                        value={formData.dose}
                        onChange={(e) =>
                          setFormData({ ...formData, dose: e.target.value })
                        }
                        placeholder="Nhập thông tin chỉ định..."
                        className="w-full px-3 py-2 rounded-xl border border-slate-200"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">
                        Ngày bắt đầu điều trị
                      </label>
                      <input
                        type="date"
                        value={formData.treatmentStartDate}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            treatmentStartDate: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 rounded-xl border border-slate-200"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">
                        Ngày kết thúc điều trị
                      </label>
                      <input
                        type="date"
                        required={
                          !!formData.medication.trim() &&
                          formData.withdrawalPeriodDays > 0
                        }
                        value={formData.treatmentEndDate}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            treatmentEndDate: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 rounded-xl border border-slate-200"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Thời gian ngừng thuốc (ngày)
                    </label>
                    <input
                      type="number"
                      min="0"
                      required={!!formData.medication.trim()}
                      value={formData.withdrawalPeriodDays}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          withdrawalPeriodDays: Number(e.target.value),
                        })
                      }
                      className="w-full px-3 py-2 rounded-xl border border-slate-200"
                    />
                  </div>
                </>
              )}

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Ngày tái khám
                </label>
                <input
                  type="date"
                  value={formData.followUpDate}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      followUpDate: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 rounded-xl border border-slate-200"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Ghi chú
                </label>
                <textarea
                  rows={2}
                  value={formData.notes}
                  onChange={(e) =>
                    setFormData({ ...formData, notes: e.target.value })
                  }
                  className="w-full p-2 rounded-xl border border-slate-200"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    resetForm();
                  }}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 font-semibold"
                >
                  Hủy
                </button>

                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2 bg-emerald-600 disabled:opacity-50 text-white rounded-xl font-bold"
                >
                  {isSaving
                    ? 'Đang lưu...'
                    : editingRecord
                      ? 'Cập nhật hồ sơ'
                      : 'Lưu hồ sơ quan sát'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
