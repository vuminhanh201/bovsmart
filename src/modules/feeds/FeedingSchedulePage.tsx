import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuthStore } from '../../store/useAuthStore';
import { getAllFeedsApi } from '../../services/feedService';
import {
  createDailyRationApi,
  getAllShiftSchedulesApi,
  getMyShiftSchedulesApi,
  createShiftRecordApi,
  getAllShiftRecordsApi,
  getMyShiftRecordsApi,
  approveShiftRecordApi,
  rejectShiftRecordApi,
} from '../../services/dailyFeedingService';
import {
  Clock,
  CheckCircle2,
  AlertCircle,
  Wheat,
  Warehouse,
  Check,
  X,
  Sparkles,
  Plus,
  RefreshCw,
  ClipboardCheck,
  Send,
} from 'lucide-react';


type FeedItem = Awaited<ReturnType<typeof getAllFeedsApi>>[number];
type ScheduleItem = Awaited<ReturnType<typeof getAllShiftSchedulesApi>>[number];
type RecordItem = Awaited<ReturnType<typeof getAllShiftRecordsApi>>[number];

interface RationFeedDraft {
  feedId: string;
  dailyQuantityPerHead: string;
}

type RationGroup = 'A' | 'B' | 'C';
type PeriodType = 'DAY' | 'WEEK';

const RATION_PRESETS: Record<
  RationGroup,
  {
    name: string;
    feeds: {
      feedName: string;
      quantity: number;
    }[];
  }
> = {
  A: {
    name: 'Bò vỗ béo',
    feeds: [
      { feedName: 'Cỏ voi tươi', quantity: 5 },
      { feedName: 'Cỏ VA06', quantity: 2 },
      { feedName: 'Thân cây ngô ủ chua', quantity: 5 },
      { feedName: 'Ngô hạt', quantity: 1.5 },
      { feedName: 'Cám gạo', quantity: 1 },
      { feedName: 'Bột đậu tương', quantity: 0.3 },
      { feedName: 'Bã bia ướt', quantity: 1 },
    ],
  },

  B: {
    name: 'Bò mới nhập',
    feeds: [
      { feedName: 'Cỏ voi tươi', quantity: 7 },
      { feedName: 'Cỏ VA06', quantity: 2 },
      { feedName: 'Thân cây ngô ủ chua', quantity: 2 },
      { feedName: 'Ngô hạt', quantity: 0.5 },
      { feedName: 'Cám gạo', quantity: 0.5 },
      { feedName: 'Bột đậu tương', quantity: 0.2 },
    ],
  },

  C: {
    name: 'Bò cách ly',
    feeds: [
      { feedName: 'Cỏ voi tươi', quantity: 7 },
      { feedName: 'Cỏ VA06', quantity: 2 },
      { feedName: 'Rơm khô', quantity: 0.5 },
      { feedName: 'Thân cây ngô ủ chua', quantity: 2 },
      { feedName: 'Cám gạo', quantity: 0.5 },
      { feedName: 'Bột đậu tương', quantity: 0.2 },
    ],
  },
};

const getToday = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const shiftColors: Record<string, string> = {
  MORNING: 'bg-amber-50 text-amber-800',
  NOON: 'bg-sky-50 text-sky-800',
  EVENING: 'bg-indigo-50 text-indigo-800',
};

const getShiftLabel = (code: string, name?: string) => {
  if (name) return name;

  const labels: Record<string, string> = {
    MORNING: 'Ca sáng',
    NOON: 'Ca trưa',
    EVENING: 'Ca chiều',
  };

  return labels[code] || code;
};

const getStatusLabel = (status?: string) => {
  const labels: Record<string, string> = {
    PENDING: 'Chờ xử lý',
    COMPLETED: 'Đã hoàn thành',
    APPROVED: 'Đã duyệt',
    REJECTED: 'Bị từ chối',
  };

  return labels[status || ''] || status || 'Chưa xác định';
};

const FeedingSchedulePage: React.FC = () => {
  const { currentUser } = useAuthStore();

  const isManager = currentUser?.role === 'FARM_MANAGER';
  const isStaff = currentUser?.role === 'STAFF';
  const canOperate = isManager || isStaff;

  const [feeds, setFeeds] = useState<FeedItem[]>([]);
  const [schedules, setSchedules] = useState<ScheduleItem[]>([]);
  const [records, setRecords] = useState<RecordItem[]>([]);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const [selectedShift, setSelectedShift] = useState('ALL');
  const [selectedDate, setSelectedDate] = useState(getToday());


  // Form lập khẩu phần dành cho quản lý
  const [rationGroup, setRationGroup] =
    useState<RationGroup>('A');

  const [periodType, setPeriodType] =
    useState<PeriodType>('DAY');

  const [rationDate, setRationDate] = useState(getToday());
  const [rationEndDate, setRationEndDate] = useState('');

  const [rationFeeds, setRationFeeds] = useState<RationFeedDraft[]>([
    { feedId: '', dailyQuantityPerHead: '' },
  ]);

  useEffect(() => {
    if (periodType !== 'WEEK' || !rationDate) return;

    const startDate = new Date(`${rationDate}T00:00:00`);
    startDate.setDate(startDate.getDate() + 6);

    const year = startDate.getFullYear();
    const month = String(startDate.getMonth() + 1).padStart(2, '0');
    const day = String(startDate.getDate()).padStart(2, '0');

    setRationEndDate(`${year}-${month}-${day}`);
  }, [periodType, rationDate]);


  // Form ghi nhận thức ăn thực tế dành cho nhân viên
  const [recordSchedule, setRecordSchedule] = useState<ScheduleItem | null>(null);
  const [actualQuantities, setActualQuantities] = useState<Record<string, string>>({});
  const [recordNote, setRecordNote] = useState(
    'Đã hoàn thành cho ăn, đàn bò ăn uống bình thường.',
  );

  // Ghi chú khi quản lý duyệt hoặc từ chối
  const [reviewNotes, setReviewNotes] = useState<Record<string, string>>({});

  const loadData = useCallback(async () => {
    if (!canOperate) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError('');

      const [feedData, scheduleData, recordData] = await Promise.all([
        getAllFeedsApi(),
        isManager ? getAllShiftSchedulesApi() : getMyShiftSchedulesApi(),
        isManager ? getAllShiftRecordsApi() : getMyShiftRecordsApi(),
      ]);

      setFeeds(feedData || []);
      setSchedules(scheduleData || []);
      setRecords(recordData || []);

    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Không thể tải dữ liệu lịch cho ăn.',
      );
    } finally {
      setLoading(false);
    }
  }, [canOperate, isManager]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filteredSchedules = useMemo(() => {
    return schedules.filter((schedule) => {
      const matchesShift =
        selectedShift === 'ALL' || schedule.shiftCode === selectedShift;

      const matchesDate =
        !selectedDate || schedule.feedingDate === selectedDate;

      return matchesShift && matchesDate;
    });
  }, [schedules, selectedShift, selectedDate]);

  const completedCount = filteredSchedules.filter(
    (schedule) => schedule.status === 'COMPLETED',
  ).length;

  const totalCount = filteredSchedules.length;

  const progressPercent =
    totalCount > 0
      ? Math.round((completedCount / totalCount) * 100)
      : 0;

  const totalPlannedQuantity = filteredSchedules
    .filter((schedule) => schedule.status === 'COMPLETED')
    .reduce((sum, schedule) => {
      return (
        sum +
        (schedule.feeds || []).reduce(
          (feedSum, feed) => feedSum + (feed.plannedQuantity || 0),
          0,
        )
      );
    }, 0);

  const addRationFeed = () => {
    setRationFeeds((current) => [
      ...current,
      { feedId: '', dailyQuantityPerHead: '' },
    ]);
  };

  const removeRationFeed = (index: number) => {
    setRationFeeds((current) =>
      current.filter((_, itemIndex) => itemIndex !== index),
    );
  };

  const updateRationFeed = (
    index: number,
    field: keyof RationFeedDraft,
    value: string,
  ) => {
    setRationFeeds((current) =>
      current.map((item, itemIndex) =>
        itemIndex === index ? { ...item, [field]: value } : item,
      ),
    );
  };

  const applyRationPreset = () => {
    const preset = RATION_PRESETS[rationGroup];

    const missingFeeds = preset.feeds.filter(
      (presetFeed) =>
        !feeds.some(
          (feed) =>
            feed.feedName.trim().toLowerCase() ===
            presetFeed.feedName.trim().toLowerCase()
        )
    );

    if (missingFeeds.length > 0) {
      setError(
        `Kho thức ăn chưa có: ${missingFeeds
          .map((item) => item.feedName)
          .join(', ')}. Vui lòng kiểm tra danh mục thức ăn.`
      );
      return;
    }

    const mappedFeeds = preset.feeds.map((presetFeed) => {
      const matchedFeed = feeds.find(
        (feed) =>
          feed.feedName.trim().toLowerCase() ===
          presetFeed.feedName.trim().toLowerCase()
      );

      return {
        feedId: matchedFeed!.id,
        dailyQuantityPerHead: String(presetFeed.quantity),
      };
    });

    setRationFeeds(mappedFeeds);
    setError('');
    setSuccessMessage(
      `Đã điền khẩu phần tham khảo cho nhóm ${preset.name}. Bạn có thể điều chỉnh trước khi tạo.`
    );
  };


  const handleCreateRation = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!rationDate) {
      setError('Vui lòng chọn ngày bắt đầu áp dụng khẩu phần.');
      return;
    }

    if (periodType === 'WEEK') {
      if (!rationEndDate) {
        setError('Vui lòng chọn ngày kết thúc tuần.');
        return;
      }

      const start = new Date(`${rationDate}T00:00:00`);
      const end = new Date(`${rationEndDate}T00:00:00`);

      const days = Math.round(
        (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24),
      );

      if (days !== 6) {
        setError('Khoảng thời gian lập khẩu phần phải gồm đúng 7 ngày.');
        return;
      }
    }

    if (
      rationFeeds.some(
        (item) =>
          !item.feedId ||
          !Number.isFinite(Number(item.dailyQuantityPerHead)) ||
          Number(item.dailyQuantityPerHead) <= 0
      )
    ) {
      setError('Vui lòng nhập đầy đủ loại thức ăn và số lượng hợp lệ cho tất cả các dòng.');
      return;
    }

    const validFeeds = rationFeeds.filter(
      (item) =>
        item.feedId &&
        Number.isFinite(Number(item.dailyQuantityPerHead)) &&
        Number(item.dailyQuantityPerHead) > 0,
    );

    if (validFeeds.length === 0) {
      setError('Vui lòng chọn ít nhất một loại thức ăn và nhập số lượng hợp lệ.');
      return;
    }

    const duplicateFeedIds = validFeeds
      .map((item) => item.feedId)
      .filter((feedId, index, array) => array.indexOf(feedId) !== index);

    if (duplicateFeedIds.length > 0) {
      setError('Không được chọn trùng một loại thức ăn trong khẩu phần.');
      return;
    }

    try {
      setSubmitting(true);
      setError('');
      setSuccessMessage('');

      await createDailyRationApi({
        groupCode: rationGroup,
        periodType,
        startDate: rationDate,
        endDate: periodType === 'WEEK' ? rationEndDate : undefined,
        feeds: validFeeds.map((item) => ({
          feedId: item.feedId,
          dailyQuantityPerHead: Number(item.dailyQuantityPerHead),
        })),
      });

      setSuccessMessage(
        periodType === 'DAY'
          ? 'Đã tạo khẩu phần trong ngày và tự động sinh 2 ca cho ăn.'
          : 'Đã tạo khẩu phần trong 7 ngày và tự động sinh lịch ca cho ăn.',
      );

      setRationFeeds([
        { feedId: '', dailyQuantityPerHead: '' },
      ]);

      if (periodType === 'DAY') {
        setRationEndDate('');
      }

      await loadData();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Không thể tạo khẩu phần.',
      );
    } finally {
      setSubmitting(false);
    }
  };

  const openRecordForm = (schedule: ScheduleItem) => {
    setRecordSchedule(schedule);

    const initialQuantities: Record<string, string> = {};

    (schedule.feeds || []).forEach((feed) => {
      initialQuantities[feed.feedId] = String(feed.plannedQuantity ?? '');
    });

    setActualQuantities(initialQuantities);
    setRecordNote('');
    setError('');
    setSuccessMessage('');
  };

  const handleSubmitRecord = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!recordSchedule) return;

    const actualFeeds = (recordSchedule.feeds || []).map((feed) => ({
      feedId: feed.feedId,
      actualQuantity: Number(actualQuantities[feed.feedId]),
    }));

    if (
      actualFeeds.some(
        (feed) =>
          !Number.isFinite(feed.actualQuantity) ||
          feed.actualQuantity <= 0
      )
    ) {
      setError('Vui lòng nhập lượng thức ăn thực tế hợp lệ cho tất cả loại thức ăn.');
      return;
    }

    try {
      setSubmitting(true);
      setError('');

      await createShiftRecordApi({
        shiftScheduleId: recordSchedule.id,
        note: recordNote.trim(),
        feeds: actualFeeds,
      });

      setRecordSchedule(null);
      setSuccessMessage(
        'Đã gửi kết quả ca cho ăn. Vui lòng chờ quản lý xác nhận.',
      );

      await loadData();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Không thể gửi kết quả ca cho ăn.',
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleReview = async (
    recordId: string,
    action: 'APPROVE' | 'REJECT',
  ) => {
    const reviewNote = reviewNotes[recordId] || '';

    try {
      setSubmitting(true);
      setError('');
      setSuccessMessage('');

      if (action === 'APPROVE') {
        await approveShiftRecordApi(recordId, reviewNote);
        setSuccessMessage(
          'Đã duyệt kết quả. Backend đã xử lý cập nhật tồn kho theo kết quả được duyệt.',
        );
      } else {
        await rejectShiftRecordApi(recordId, reviewNote);
        setSuccessMessage('Đã từ chối kết quả ca cho ăn.');
      }

      await loadData();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Không thể xử lý kết quả ca cho ăn.',
      );
    } finally {
      setSubmitting(false);
    }
  };

  const getRecordForSchedule = (scheduleId: string) => {
    return records
      .filter((record) => record.shiftScheduleId === scheduleId)
      .sort(
        (a, b) =>
          new Date(b.performedAt).getTime() -
          new Date(a.performedAt).getTime(),
      )[0];
  };

  const getFeedName = (feedId: string) => {
    return feeds.find((feed) => feed.id === feedId)?.feedName || feedId;
  };

  if (!canOperate) {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center">
        <AlertCircle className="w-10 h-10 text-amber-500 mx-auto mb-3" />
        <h2 className="text-lg font-bold text-slate-900">
          Không có quyền thực hiện nghiệp vụ
        </h2>
        <p className="text-sm text-slate-500 mt-2">
          Chức năng lập khẩu phần, ghi nhận và duyệt kết quả cho ăn chỉ dành
          cho Quản lý trang trại và Nhân viên được phân công.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl font-bold text-slate-900">
              Lịch Cho Ăn & Khẩu Phần Hằng Ngày
            </h1>

            <span className="text-xs bg-emerald-50 text-emerald-800 border border-emerald-200 px-2.5 py-0.5 rounded-full font-bold">
              {completedCount}/{totalCount} ca hoàn thành
            </span>
          </div>

          <p className="text-xs text-slate-500 mt-1">
            {isManager
              ? 'Lập khẩu phần, theo dõi và duyệt kết quả cho ăn.'
              : 'Theo dõi ca được giao và ghi nhận lượng thức ăn thực tế.'}
          </p>
        </div>

        <button
          type="button"
          onClick={loadData}
          disabled={loading}
          className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl border border-slate-200 bg-white text-xs font-semibold hover:bg-slate-50 disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Làm mới dữ liệu
        </button>
      </div>

      {/* Messages */}
      {error && (
        <div className="flex items-start gap-2 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{error}</span>
          <button
            type="button"
            onClick={() => setError('')}
            className="ml-auto"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {successMessage && (
        <div className="flex items-start gap-2 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs">
          <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{successMessage}</span>
          <button
            type="button"
            onClick={() => setSuccessMessage('')}
            className="ml-auto"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {loading ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center">
          <RefreshCw className="w-6 h-6 animate-spin text-emerald-600 mx-auto mb-3" />
          <p className="text-sm text-slate-500">Đang tải dữ liệu từ máy chủ...</p>
        </div>
      ) : (
        <>
          {/* Manager: Create daily ration */}
          {isManager && (
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">

              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-emerald-50">
                  <Sparkles className="w-5 h-5 text-emerald-600" />
                </div>

                <div>
                  <h2 className="font-bold text-sm text-slate-900">
                    Lập khẩu phần ăn cho đàn bò
                  </h2>

                  <p className="text-xs text-slate-500 mt-0.5">
                    Chọn nhóm chuồng, thời gian áp dụng và lượng thức ăn mỗi con trong ngày.
                  </p>
                </div>
              </div>

              <form onSubmit={handleCreateRation} className="space-y-4">

                {/* Chọn nhóm chuồng */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-2">
                    Nhóm chuồng áp dụng
                  </label>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">

                    {([
                      ['A', 'Bò vỗ béo', 'Chuồng A1 – A5'],
                      ['B', 'Bò mới nhập', 'Chuồng B1 – B3'],
                      ['C', 'Bò cách ly', 'Chuồng C1 – C2'],
                    ] as const).map(([value, label, description]) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setRationGroup(value)}
                        className={`p-3 rounded-xl border text-left transition ${rationGroup === value
                            ? 'border-emerald-500 bg-emerald-50 text-emerald-800'
                            : 'border-slate-200 bg-white hover:bg-slate-50'
                          }`}
                      >
                        <p className="text-xs font-bold">{label}</p>
                        <p className="text-[11px] mt-1 text-slate-500">
                          {description}
                        </p>
                      </button>
                    ))}

                  </div>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-xl bg-emerald-50 border border-emerald-100">
                  <div>
                    <p className="text-xs font-bold text-emerald-800">
                      Khẩu phần tham khảo: {RATION_PRESETS[rationGroup].name}
                    </p>
                    <p className="text-[11px] text-emerald-700 mt-1">
                      Tự điền danh sách thức ăn và số lượng theo từng nhóm chuồng.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={applyRationPreset}
                    className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold"
                  >
                    Áp dụng khẩu phần
                  </button>
                </div>

                {/* Chọn thời gian */}
                <div className="space-y-3">

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-2">
                      Thời gian lập khẩu phần
                    </label>

                    <div className="grid grid-cols-2 gap-3">

                      <button
                        type="button"
                        onClick={() => setPeriodType('DAY')}
                        className={`p-3 rounded-xl border text-xs font-bold ${periodType === 'DAY'
                            ? 'border-emerald-500 bg-emerald-50 text-emerald-800'
                            : 'border-slate-200 hover:bg-slate-50'
                          }`}
                      >
                        Theo ngày
                      </button>

                      <button
                        type="button"
                        onClick={() => setPeriodType('WEEK')}
                        className={`p-3 rounded-xl border text-xs font-bold ${periodType === 'WEEK'
                            ? 'border-emerald-500 bg-emerald-50 text-emerald-800'
                            : 'border-slate-200 hover:bg-slate-50'
                          }`}
                      >
                        Theo tuần (7 ngày)
                      </button>

                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                        Ngày bắt đầu
                      </label>

                      <input
                        type="date"
                        value={rationDate}
                        min={getToday()}
                        onChange={(event) => setRationDate(event.target.value)}
                        required
                        className="w-full p-2.5 text-xs rounded-xl border border-slate-200"
                      />
                    </div>

                    {periodType === 'WEEK' && (
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                          Ngày kết thúc
                        </label>

                       <input
                          type="date"
                          value={rationEndDate}
                          min={rationDate}
                          readOnly
                          required
                          className="w-full p-2.5 text-xs rounded-xl border border-slate-200 bg-slate-100 text-slate-500 cursor-not-allowed"
/>
                      </div>
                    )}

                  </div>

                  {periodType === 'WEEK' && (
                    <p className="text-[11px] text-slate-500">
                      Một tuần gồm đúng 7 ngày, tính cả ngày bắt đầu và ngày kết thúc.
                    </p>
                  )}

                </div>

                {/* Danh sách thức ăn */}
                <div className="space-y-3">

                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold text-slate-800">
                      Danh sách thức ăn trong khẩu phần
                    </h3>

                    <button
                      type="button"
                      onClick={addRationFeed}
                      className="flex items-center gap-1 text-xs font-bold text-emerald-700 hover:text-emerald-800"
                    >
                      <Plus className="w-4 h-4" />
                      Thêm thức ăn
                    </button>
                  </div>

                  {rationFeeds.map((item, index) => {
                    const selectedFeed = feeds.find(
                      (feed) => feed.id === item.feedId,
                    );

                    return (
                      <div
                        key={index}
                        className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto] gap-2 p-3 rounded-xl bg-slate-50 border border-slate-100"
                      >

                        <div>
                          <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                            Loại thức ăn
                          </label>

                          <select
                            value={item.feedId}
                            onChange={(event) =>
                              updateRationFeed(index, 'feedId', event.target.value)
                            }
                            required
                            className="w-full p-2.5 text-xs rounded-lg border border-slate-200 bg-white"
                          >
                            <option value="">-- Chọn thức ăn --</option>

                            {feeds.map((feed) => (
                              <option key={feed.id} value={feed.id}>
                                {feed.feedName} (Tồn: {feed.quantity} {feed.unit})
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                            Lượng mỗi con / ngày
                          </label>

                          <div className="relative">
                            <input
                              type="number"
                              min="0.01"
                              step="0.01"
                              value={item.dailyQuantityPerHead}
                              onChange={(event) =>
                                updateRationFeed(
                                  index,
                                  'dailyQuantityPerHead',
                                  event.target.value,
                                )
                              }
                              required
                              placeholder="Nhập số lượng"
                              className="w-full p-2.5 pr-14 text-xs rounded-lg border border-slate-200"
                            />

                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-slate-400">
                              {selectedFeed?.unit || 'kg'}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-end">
                          <button
                            type="button"
                            onClick={() => removeRationFeed(index)}
                            disabled={rationFeeds.length === 1}
                            className="w-full sm:w-auto p-2.5 rounded-lg border border-red-100 text-red-500 hover:bg-red-50 disabled:opacity-30"
                            title="Xóa thức ăn"
                          >
                            <X className="w-4 h-4 mx-auto" />
                          </button>
                        </div>

                      </div>
                    );
                  })}

                </div>

                {/* Lịch chia ca */}
                <div className="p-3 rounded-xl bg-sky-50 border border-sky-100 space-y-2">

                  <p className="text-xs font-bold text-sky-800">
                    Lịch cho ăn tự động
                  </p>

                  <div className="grid grid-cols-2 gap-3 text-xs text-sky-800">
                    <div>
                      <strong>06:00 – Ca sáng</strong>
                      <p>50% khẩu phần ngày</p>
                    </div>

                    <div>
                      <strong>18:00 – Ca chiều</strong>
                      <p>50% khẩu phần ngày</p>
                    </div>
                  </div>

                  <p className="text-[11px] text-sky-700">
                    12:00: kiểm tra máng ăn và nước uống, không tạo ca cấp thức ăn.
                  </p>

                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-slate-100">

                  <p className="text-[11px] text-slate-500">
                    Hệ thống tự tìm các chuồng thuộc nhóm và nhân viên được phân công.
                  </p>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold disabled:opacity-50"
                  >
                    <Plus className="w-4 h-4" />
                    {submitting ? 'Đang tạo...' : 'Tạo khẩu phần'}
                  </button>

                </div>

              </form>
            </div>
          )}

          {/* Progress */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="w-full sm:w-2/3 space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="text-slate-700">
                  Tiến độ hoàn thành các ca:
                </span>
                <span className="text-emerald-700 font-bold font-mono">
                  {progressPercent}%
                </span>
              </div>

              <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                <div
                  className="bg-emerald-500 h-2.5 rounded-full transition-all duration-500"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>

              <p className="text-[11px] text-slate-400">
                Tiến độ được tính theo trạng thái lịch ca từ Backend.
              </p>
            </div>

            <div className="text-right shrink-0">
              <span className="text-xs text-slate-500 block">
                Tổng lượng thức ăn dự kiến của các ca hoàn thành:
              </span>
              <span className="text-lg font-extrabold text-slate-900 font-mono">
                {totalPlannedQuantity.toLocaleString('vi-VN')}
              </span>
              <span className="text-xs text-slate-500 block">
                Tổng theo đơn vị thức ăn tương ứng
              </span>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3 justify-between">
            <div className="flex items-center gap-2">
              <Warehouse className="w-4 h-4 text-slate-400" />
              <span className="text-xs font-bold text-slate-700">
                Danh sách lịch cho ăn
              </span>
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="date"
                value={selectedDate}
                onChange={(event) => setSelectedDate(event.target.value)}
                className="py-2 px-3 text-xs rounded-xl border border-slate-200 bg-white"
              />

              <select
                value={selectedShift}
                onChange={(event) => setSelectedShift(event.target.value)}
                className="py-2 px-3 text-xs rounded-xl border border-slate-200 bg-white font-semibold"
              >
                <option value="ALL">Tất cả các ca</option>
                <option value="MORNING">Ca sáng</option>
                <option value="EVENING">Ca chiều</option>
              </select>
            </div>
          </div>

          {/* Schedule cards */}
          {filteredSchedules.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center">
              <Wheat className="w-9 h-9 text-slate-300 mx-auto mb-3" />
              <p className="text-sm font-semibold text-slate-700">
                Chưa có lịch cho ăn
              </p>
              <p className="text-xs text-slate-400 mt-1">
                {isManager
                  ? 'Hãy tạo khẩu phần để hệ thống tự động sinh 2 ca sáng và chiều.'
                  : 'Hiện chưa có ca cho ăn nào được phân công cho bạn trong ngày đã chọn.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredSchedules.map((schedule) => {
                const isDone = schedule.status === 'COMPLETED';
                const shiftLabel = getShiftLabel(
                  schedule.shiftCode,
                  schedule.shiftName,
                );
                const record = getRecordForSchedule(schedule.id);

                const canSubmitRecord =
                  isStaff &&
                  (!record || record.recordStatus === 'REJECTED') &&
                  schedule.status !== 'COMPLETED';

                return (
                  <div
                    key={schedule.id}
                    className={`p-5 rounded-2xl border transition-all flex flex-col justify-between space-y-4 ${isDone
                        ? 'bg-white border-emerald-200'
                        : 'bg-white border-slate-200'
                      }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <span
                          className={`text-[10px] font-bold px-2 py-1 rounded-md ${shiftColors[schedule.shiftCode] ||
                            'bg-slate-100 text-slate-700'
                            }`}
                        >
                          {shiftLabel}
                        </span>

                        <span
                          className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${isDone
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-amber-50 text-amber-800 border-amber-200'
                            }`}
                        >
                          {getStatusLabel(schedule.status)}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-slate-400" />
                        <span className="text-lg font-extrabold text-slate-900 font-mono">
                          {schedule.feedingTime}
                        </span>
                        <span className="text-xs text-slate-500 font-semibold">
                          • Chuồng {schedule.barnCode}
                        </span>
                      </div>

                      <p className="text-[11px] text-slate-400 mt-1">
                        Ngày: {schedule.feedingDate}
                      </p>

                      {isManager && (
                        <div className="flex items-center gap-2 mt-2 text-xs">
                          <span className="text-slate-500">Nhân viên phụ trách:</span>
                          <span className="font-semibold text-emerald-700">
                            {(schedule as ScheduleItem & { assignedTo?: string }).assignedTo ||
                              'Chưa phân công'}
                          </span>
                        </div>
                      )}

                      <div className="mt-3 p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-2">
                        <p className="text-[11px] font-bold text-slate-700">
                          Khẩu phần trong ca
                        </p>

                        {(schedule.feeds || []).map((feed) => (
                          <div
                            key={feed.feedId}
                            className="flex justify-between gap-2 text-xs"
                          >
                            <span className="text-slate-500">
                              {feed.feedName || getFeedName(feed.feedId)}
                            </span>
                            <strong className="text-emerald-700 font-mono">
                              {feed.plannedQuantity} {feed.unit}
                            </strong>
                          </div>
                        ))}
                      </div>

                      {record && (
                        <div className="mt-3 p-3 rounded-xl border border-slate-100 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-bold text-slate-700">
                              Kết quả nhân viên
                            </span>
                            <span
                              className={`text-[10px] font-bold ${record.recordStatus === 'APPROVED'
                                  ? 'text-emerald-700'
                                  : record.recordStatus === 'REJECTED'
                                    ? 'text-red-600'
                                    : 'text-amber-700'
                                }`}
                            >
                              {getStatusLabel(record.recordStatus)}
                            </span>
                          </div>

                          {(record.feeds || []).map((feed) => (
                            <div
                              key={feed.feedId}
                              className="flex justify-between gap-2 text-xs"
                            >
                              <span className="text-slate-500">
                                {feed.feedName || getFeedName(feed.feedId)}
                              </span>
                              <strong className="text-slate-800 font-mono">
                                {feed.actualQuantity} {feed.unit}
                              </strong>
                            </div>
                          ))}

                          {record.note && (
                            <p className="text-[11px] text-slate-500 border-t border-slate-100 pt-2">
                              Ghi chú: {record.note}
                            </p>
                          )}

                          {record.reviewNote && (
                            <p className="text-[11px] text-slate-500">
                              Phản hồi quản lý: {record.reviewNote}
                            </p>
                          )}
                        </div>
                      )}
                    </div>

                    {canSubmitRecord && (
                      <button
                        type="button"
                        onClick={() => openRecordForm(schedule)}
                        className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2"
                      >
                        <ClipboardCheck className="w-4 h-4" />
                        Ghi nhận kết quả ca
                      </button>
                    )}

                    {isStaff && record && record.recordStatus === 'PENDING' && (
                      <div className="w-full py-2.5 bg-amber-50 text-amber-800 text-center font-bold text-xs rounded-xl">
                        Đã gửi kết quả - Chờ quản lý duyệt
                      </div>
                    )}

                    {isDone && (
                      <div className="w-full py-2.5 bg-emerald-50 text-emerald-800 text-center font-bold text-xs rounded-xl flex items-center justify-center gap-2">
                        <CheckCircle2 className="w-4 h-4" />
                        Đã hoàn thành và được xác nhận
                      </div>
                    )}

                    {isManager && record?.recordStatus === 'PENDING' && (
                      <div className="space-y-2">
                        <textarea
                          rows={2}
                          value={reviewNotes[record.id] || ''}
                          onChange={(event) =>
                            setReviewNotes((current) => ({
                              ...current,
                              [record.id]: event.target.value,
                            }))
                          }
                          placeholder="Ghi chú duyệt hoặc từ chối..."
                          className="w-full p-2.5 text-xs rounded-xl border border-slate-200"
                        />

                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            disabled={submitting}
                            onClick={() => handleReview(record.id, 'REJECT')}
                            className="py-2.5 rounded-xl bg-red-50 text-red-700 border border-red-200 text-xs font-bold disabled:opacity-50"
                          >
                            <X className="w-4 h-4 inline mr-1" />
                            Từ chối
                          </button>

                          <button
                            type="button"
                            disabled={submitting}
                            onClick={() => handleReview(record.id, 'APPROVE')}
                            className="py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-bold disabled:opacity-50"
                          >
                            <Check className="w-4 h-4 inline mr-1" />
                            Duyệt kết quả
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* Staff: Actual feeding record modal */}
      {recordSchedule && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 space-y-4 my-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-sm text-slate-900">
                  Ghi nhận kết quả cho ăn
                </h3>
                <p className="text-[11px] text-slate-500 mt-1">
                  {getShiftLabel(
                    recordSchedule.shiftCode,
                    recordSchedule.shiftName,
                  )}{' '}
                  - Chuồng {recordSchedule.barnCode}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setRecordSchedule(null)}
                className="p-1 text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitRecord} className="space-y-4">
              <div className="space-y-3">
                {(recordSchedule.feeds || []).map((feed) => (
                  <div key={feed.feedId}>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      {feed.feedName || getFeedName(feed.feedId)}
                    </label>

                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="0.01"
                        step="0.01"
                        required
                        value={actualQuantities[feed.feedId] ?? ''}
                        onChange={(event) =>
                          setActualQuantities((current) => ({
                            ...current,
                            [feed.feedId]: event.target.value,
                          }))
                        }
                        className="flex-1 p-2.5 text-xs rounded-xl border border-slate-200"
                        placeholder="Nhập lượng thực tế"
                      />

                      <span className="text-xs text-slate-500 w-12">
                        {feed.unit}
                      </span>
                    </div>

                    <p className="text-[10px] text-slate-400 mt-1">
                      Dự kiến: {feed.plannedQuantity} {feed.unit}
                    </p>
                  </div>
                ))}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Ghi chú tình trạng cho ăn
                </label>
                <textarea
                  rows={3}
                  value={recordNote}
                  onChange={(event) => setRecordNote(event.target.value)}
                  placeholder="Nhập tình trạng ăn uống hoặc vấn đề phát sinh..."
                  className="w-full p-2.5 text-xs rounded-xl border border-slate-200"
                />
              </div>

              <div className="p-3 bg-amber-50 border border-amber-100 rounded-xl text-[11px] text-amber-800">
                Gửi kết quả chỉ tạo phiếu chờ duyệt. Tồn kho chưa bị trừ cho
                đến khi quản lý xác nhận.
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setRecordSchedule(null)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold"
                >
                  Hủy
                </button>

                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold flex items-center gap-2 disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                  {submitting ? 'Đang gửi...' : 'Gửi kết quả'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default FeedingSchedulePage;
