
import { create } from 'zustand';
import {
  getAllBarnsApi,
  transferCattleApi,
} from '../services/barnService';
import { useAuthStore } from './useAuthStore';
import {
  getBlockchainBlocksApi,
  createBlockchainBlockApi,
} from '../services/blockchainService';
import {
  getAllCattleApi,
  createCattleApi,
  updateCattleApi,
  deleteCattleApi,
  recordCattleWeightApi,
} from '../services/cattleService';
import {
  getAllShiftSchedulesApi,
  getMyShiftSchedulesApi,
  FeedingShiftSchedule,
} from '../services/dailyFeedingService';
import {
  Cattle,
  Barn,
  FeedItem,
  FeedRation,
  FeedingSchedule,
  HealthRecord,
  VaccinationSchedule,
  DailyDiary,
  SalesOrder,
  BlockchainBlock,
  AuditLog,
  SystemConfig,
  UserRole,
  HygieneRecord,
  FeedTransaction,
} from '../types';
import {
  createDailyDiaryApi,
  getAllDailyDiariesApi,
  getMyDailyDiariesApi,
  verifyDailyDiaryApi,
} from '../services/dailyDiaryService';
import {
  getAllHealthRecordsApi,
  getHealthRecordsByCattleIdApi,
  HealthRecord as ApiHealthRecord,
} from '../services/healthService';
import {
  getAllSalesOrdersApi,
  createSalesOrderApi,
  approveSalesOrderApi,
  rejectSalesOrderApi,
  SalesOrder as ApiSalesOrder,
} from '../services/salesOrderService';
import {
  mockCattle,
  mockBarns,
  mockFeedItems,
  mockFeedRations,
  mockVaccinations,
  mockAuditLogs,
  mockSystemConfig,
} from '../data/mockData';

export const initialHygieneRecords: HygieneRecord[] = [
  {
    id: 'HYG-01',
    penId: 'PEN-01',
    penName: 'Chuồng A1',
    date: '2026-10-24 07:30',
    content: 'Xịt rửa sàn chuồng áp lực cao, rắc vôi bột lối đi và phun sát trùng Benkocid',
    performedBy: 'Lê Văn Thắng',
    note: 'Định kỳ hằng ngày',
  },
  {
    id: 'HYG-02',
    penId: 'PEN-04',
    penName: 'Chuồng C1 (Cách ly)',
    date: '2026-10-24 06:45',
    content: 'Sát trùng vô trùng áp lực âm, thay khay khử trùng ủng lối vào',
    performedBy: 'BSTY. Trần Thị Loan',
    note: 'Khu vực cách ly kiểm dịch nghiêm ngặt',
  },
];

export const initialFeedTransactions: FeedTransaction[] = [
  {
    id: 'TRX-IN-01',
    type: 'IMPORT',
    feedItemId: 'FEED-01',
    feedItemName: 'Cỏ Voi Pakchong ủ chua lên men vi sinh',
    quantity: 5000,
    date: '2026-10-22 09:00',
    supplier: 'HTX Nông Nghiệp Xanh Củ Chi',
    performedBy: 'Lê Văn Thắng',
    note: 'Nhập cỏ đợt 2 tháng 10',
  },
  {
    id: 'TRX-OUT-01',
    type: 'EXPORT',
    feedItemId: 'FEED-02',
    feedItemName: 'Cám viên hỗn hợp chuyên bò vỗ béo (CP 9005)',
    quantity: 250,
    date: '2026-10-24 07:15',
    purpose: 'Cấp thức ăn ca sáng cho Chuồng A1 & A2',
    penId: 'PEN-01',
    performedBy: 'Lê Văn Thắng',
  },
];

interface ToastNotification {
  id: string;
  type: 'success' | 'info' | 'warning' | 'error';
  title: string;
  message: string;
}

const mapApiSalesOrderToUi = (order: ApiSalesOrder): SalesOrder => {
  const details = order.cattleDetails ?? [];

  const selectedCattleIds =
    details.length > 0
      ? details.map((cattle) => cattle.cattleId)
      : order.cattleId
        ? [order.cattleId]
        : [];

  return {
    id: order.id,
    orderNumber: order.orderCode,
    createdAt: order.createdAt,
    buyerName: order.buyerName,
    buyerPhone: order.buyerPhone ?? '',
    buyerCompany: '',
    selectedCattleIds,
    totalHeads: selectedCattleIds.length,
    totalWeightKg: Number(order.totalWeight ?? order.weightAtSale ?? 0),
    pricePerKgVND: Number(order.pricePerKg ?? 0),
    totalRevenueVND: Number(order.totalAmount ?? 0),
    status: order.status === 'REJECTED'
      ? 'CANCELLED'
      : order.status as SalesOrder['status'],
    approvedBy: order.approvedBy,
    approvalDate: order.approvedAt,
    notes: order.rejectionReason
      ? `Lý do từ chối: ${order.rejectionReason}`
      : order.notes,
    paymentStatus: 'UNPAID',
  };
};

const mapApiHealthRecordToUi = (
  record: ApiHealthRecord
): HealthRecord => {
  let status: HealthRecord['status'] = 'MONITORING';

  if (record.recordStatus === 'IN_TREATMENT') {
    status = 'ONGOING';
  } else if (record.recordStatus === 'COMPLETED') {
    status = 'RECOVERED';
  }

  return {
    id: record.id,
    cattleId: record.cattleId,
    rfidTag: record.rfidTag ?? '',
    date: record.examinationDate,
    diagnosis: record.diagnosis ?? '',
    symptoms: record.symptoms ?? '',
    treatment: record.treatment ?? '',
    medication: record.medicine ?? '',
    dose: record.dosage ?? '',
    veterinarian: record.vetReviewedBy ?? record.recordedBy ?? '',
    status,
    quarantineRequired: false,
    withdrawalPeriodDays: record.withdrawalPeriodDays ?? 0,
  };
};

const mapApiFeedingScheduleToUi = (
  schedule: FeedingShiftSchedule
): FeedingSchedule => {
  const shiftCode = schedule.shiftCode?.toUpperCase();

  const shift: FeedingSchedule['shift'] =
    shiftCode === 'NOON'
      ? 'NOON'
      : shiftCode === 'EVENING'
        ? 'EVENING'
        : 'MORNING';

  const status: FeedingSchedule['status'] =
    schedule.status === 'COMPLETED'
      ? 'COMPLETED'
      : schedule.status === 'DELAYED'
        ? 'DELAYED'
        : 'PENDING';

  return {
    id: schedule.id,
    penId: schedule.barnId,
    penName: schedule.barnCode,
    feedingDate: schedule.feedingDate,
    shift,
    scheduledTime: schedule.feedingTime,
    rationId: schedule.dailyRationId,
    rationName: schedule.feeds
      .map((feed) => feed.feedName)
      .join(', '),
    amountTotalKg: schedule.feeds.reduce(
      (total, feed) =>
        total + Number(feed.plannedQuantity || 0),
      0
    ),
    status,
  };
};

interface FarmState {
  // Data entities
  cattle: Cattle[];
  barns: Barn[];
  feedItems: FeedItem[];
  feedRations: FeedRation[];
  feedingSchedules: FeedingSchedule[];
  fetchFeedingSchedules: () => Promise<void>;
  healthRecords: HealthRecord[];
  vaccinations: VaccinationSchedule[];
  diaries: DailyDiary[];
  salesOrders: SalesOrder[];
  blockchainBlocks: BlockchainBlock[];
  fetchBlockchainBlocks: () => Promise<void>;
  auditLogs: AuditLog[];
  systemConfig: SystemConfig;
  hygieneRecords: HygieneRecord[];
  feedTransactions: FeedTransaction[];
  fetchCattle: () => Promise<void>;
  fetchBarns: () => Promise<void>;
  fetchSalesOrders: () => Promise<void>;
  fetchHealthRecords: () => Promise<void>;

  // Simulator Hardware state
  scannedRfidTag: string | null;
  activeScaleWeight: number;
  scaleIsStable: boolean;
  scaleTare: number;
  isRfidScanning: boolean;

  // Global Toasts
  toasts: ToastNotification[];
  addToast: (type: 'success' | 'info' | 'warning' | 'error', title: string, message: string) => void;
  removeToast: (id: string) => void;

  // Cattle actions
  addCattle: (
    newCow: Omit<Cattle, 'id' | 'weightHistory'>,
    operator: string,
    role: UserRole
  ) => Promise<void>;

  updateCattle: (
    id: string,
    updatedData: Partial<Cattle>,
    operator: string,
    role: UserRole
  ) => Promise<void>;

  deleteCattle: (
    id: string,
    operator: string,
    role: UserRole
  ) => Promise<void>;

   recordCattleWeight: (
      cattleId: string,
      newWeight: number,
      recordedBy: string,
      method?: 'RFID_AUTO_SCALE' | 'MANUAL',
      source?: 'SIMULATED' | 'MANUAL'
    ) => Promise<void>;

  assignRfidTag: (
    cattleId: string,
    newRfid: string,
    operator: string
  ) => { success: boolean; message: string };

  // Barn actions
  addBarn: (barn: Omit<Barn, 'id' | 'currentCount'>) => void;
  updateBarn: (id: string, barn: Partial<Barn>) => void;

  transferCattle: (
    cattleId: string,
    targetPenId: string,
    operator: string,
    role: UserRole,
    reason?: string
  ) => Promise<void>;

  addHygieneRecord: (record: Omit<HygieneRecord, 'id'>) => void;

  // Feed & Ration actions
  updateFeedStock: (feedId: string, changeKg: number) => void;
  addFeedItem: (item: Omit<FeedItem, 'id'>) => void;
  updateFeedItem: (id: string, item: Partial<FeedItem>) => void;

  recordFeedImport: (data: {
    feedItemId: string;
    quantity: number;
    date: string;
    supplier: string;
    performedBy: string;
    note?: string;
  }) => void;

  recordFeedExport: (data: {
    feedItemId: string;
    quantity: number;
    date: string;
    purpose: string;
    penId?: string;
    performedBy: string;
    note?: string;
  }) => void;

  addFeedRation: (ration: Omit<FeedRation, 'id'>) => void;
  completeFeedingSchedule: (scheduleId: string, completedBy: string, notes?: string) => void;

  // Health actions
  addHealthRecord: (record: Omit<HealthRecord, 'id'>, operator: string, role: UserRole) => void;
  updateHealthRecord: (id: string, update: Partial<HealthRecord>) => void;
  completeVaccination: (vacId: string, completedBy: string) => void;
  addVaccination: (vac: Omit<VaccinationSchedule, 'id'>) => void;

  // Diary actions
  fetchDailyDiaries: (role: UserRole) => Promise<void>;

  addDailyDiary: (
    diary: Omit<DailyDiary, 'id'>,
    operator: string,
    role: UserRole
  ) => Promise<void>;

  verifyDailyDiary: (
    diaryId: string,
    managerName: string
  ) => Promise<void>;

  // Sales actions
  createSalesOrder: (
    order: Omit<SalesOrder, 'id' | 'orderNumber' | 'createdAt' | 'status'>,
    operator: string,
    role: UserRole
  ) => Promise<void>;

  approveSalesOrder: (
    orderId: string,
    approver: string,
    role: UserRole
  ) => Promise<void>;

  rejectSalesOrder: (
    orderId: string,
    reason: string,
    role: UserRole
  ) => Promise<void>;

  cancelSalesOrder: (
    orderId: string,
    reason: string
  ) => Promise<void>;

  // Blockchain & Audit actions
  mineBlock: (
    action: string,
    data: Record<string, unknown>,
    operator: string,
    role: UserRole
  ) => Promise<BlockchainBlock>;

  addAuditLog: (
    action: string,
    module: string,
    details: string,
    user: { id: string; name: string; role: UserRole }
  ) => void;

  // Hardware Simulation actions
  simulateScanRfid: (rfidTag: string) => void;
  setSimulatedScaleWeight: (weight: number) => void;
  tareScale: () => void;
  resetSimulation: () => void;

  // Config actions
  updateSystemConfig: (
    config: Partial<SystemConfig>,
    operator: string,
    role: UserRole
  ) => void;
}

/**
 * Ghi Blockchain sau khi nghiệp vụ đã được backend lưu thành công.
 * Nếu ghi block thất bại thì không làm nghiệp vụ chính bị báo thất bại.
 */
const recordBlockchainSafely = async (
  getState: () => FarmState,
  action: string,
  data: Record<string, unknown>,
  operator: string,
  role: UserRole
): Promise<BlockchainBlock | null> => {
  try {
    return await getState().mineBlock(
      action,
      data,
      operator,
      role
    );
  } catch (error) {
    console.error(
      `Không thể ghi Blockchain cho ${action}:`,
      error
    );

    getState().addToast(
      'warning',
      'Nghiệp vụ đã lưu nhưng Blockchain chưa cập nhật',
      error instanceof Error
        ? error.message
        : 'Dữ liệu đã lưu nhưng chưa thể ghi block Blockchain.'
    );

    return null;
  }
};

export const useFarmStore = create<FarmState>((set, get) => ({
  fetchHealthRecords: async () => {
    try {
      const currentUser = useAuthStore.getState().currentUser;

      let records: ApiHealthRecord[];

      if (currentUser?.role === 'STAFF') {
        const cattleList = await getAllCattleApi();

        const recordLists = await Promise.all(
          cattleList.map((cow) =>
            getHealthRecordsByCattleIdApi(cow.id)
          )
        );

        records = recordLists.flat();
      } else {
        records = await getAllHealthRecordsApi();
      }

      const mappedRecords = records.map(mapApiHealthRecordToUi);

      set({
        healthRecords: mappedRecords,
      });

      console.log(
        'Đã tải hồ sơ sức khỏe từ MongoDB:',
        mappedRecords.length
      );
    } catch (error) {
      console.error('Lỗi tải hồ sơ sức khỏe:', error);

      get().addToast(
        'error',
        'Lỗi tải hồ sơ sức khỏe',
        error instanceof Error
          ? error.message
          : 'Không thể tải dữ liệu sức khỏe.'
      );

      throw error;
    }
  },

  // Tải lịch cho ăn từ MongoDB theo quyền tài khoản
  fetchFeedingSchedules: async () => {
    try {
      const currentUser = useAuthStore.getState().currentUser;

      const schedules =
        currentUser?.role === 'STAFF'
          ? await getMyShiftSchedulesApi()
          : await getAllShiftSchedulesApi();

      const mappedSchedules = schedules.map(
        mapApiFeedingScheduleToUi
      );

      set({
        feedingSchedules: mappedSchedules,
      });

      console.log(
        'Đã tải lịch cho ăn từ MongoDB:',
        mappedSchedules.length
      );
    } catch (error) {
      console.error('Lỗi tải lịch cho ăn:', error);

      get().addToast(
        'error',
        'Lỗi tải lịch cho ăn',
        error instanceof Error
          ? error.message
          : 'Không thể tải lịch cho ăn từ máy chủ.'
      );

      throw error;
    }
  },

  fetchCattle: async () => {
    try {
      const cattleList = await getAllCattleApi();

      set({
        cattle: cattleList,
      });

      console.log(
        'Đã tải dữ liệu bò từ MongoDB:',
        cattleList.length
      );
    } catch (error) {
      console.error('Lỗi tải dữ liệu bò:', error);
      throw error;
    }
  },

  fetchBarns: async () => {
    try {
      const barnList = await getAllBarnsApi();

      set({
        barns: barnList,
      });

      console.log(
        'Đã tải dữ liệu chuồng từ MongoDB:',
        barnList.length
      );
    } catch (error) {
      console.error('Lỗi tải dữ liệu chuồng:', error);

      get().addToast(
        'error',
        'Lỗi tải danh sách chuồng',
        error instanceof Error
          ? error.message
          : 'Không thể tải dữ liệu chuồng.'
      );
    }
  },

  fetchBlockchainBlocks: async () => {
    try {
      const blocks = await getBlockchainBlocksApi();

      set({
        blockchainBlocks: blocks.map((block) => ({
          ...block,
          role: block.role as UserRole,
        })),
      });

      console.log(
        'Đã tải sổ cái Blockchain từ backend:',
        blocks.length
      );
    } catch (error) {
      console.error('Lỗi tải sổ cái Blockchain:', error);

      get().addToast(
        'error',
        'Lỗi tải Blockchain',
        error instanceof Error
          ? error.message
          : 'Không thể tải dữ liệu sổ cái Blockchain.'
      );

      throw error;
    }
  },

  fetchSalesOrders: async () => {
    try {
      const orders = await getAllSalesOrdersApi();

      set({
        salesOrders: orders.map(mapApiSalesOrderToUi),
      });
    } catch (error) {
      get().addToast(
        'error',
        'Lỗi tải phiếu xuất bán',
        error instanceof Error
          ? error.message
          : 'Không thể tải danh sách phiếu xuất bán.'
      );

      throw error;
    }
  },

  cattle: mockCattle,
  barns: mockBarns,
  feedItems: mockFeedItems,
  feedRations: mockFeedRations,
  feedingSchedules: [],
  healthRecords: [],
  vaccinations: mockVaccinations,
  diaries: [],
  salesOrders: [],
  blockchainBlocks: [],
  auditLogs: mockAuditLogs,
  systemConfig: mockSystemConfig,
  hygieneRecords: initialHygieneRecords,
  feedTransactions: initialFeedTransactions,

  scannedRfidTag: null,
  activeScaleWeight: 0,
  scaleIsStable: false,
  scaleTare: 0,
  isRfidScanning: false,

  toasts: [],

  addToast: (type, title, message) => {
    const id = `toast-${Date.now()}-${Math.random()}`;

    set((state) => ({
      toasts: [
        ...state.toasts,
        { id, type, title, message },
      ],
    }));

    setTimeout(() => {
      get().removeToast(id);
    }, 4500);
  },

  removeToast: (id) => {
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    }));
  },

  // Tạo block thông qua API backend.
  // Backend phải tự lấy operator và role từ JWT.
  mineBlock: async (action, data, _operator, _role) => {
    const savedBlock = await createBlockchainBlockApi(
      action,
      data
    );

    const newBlock: BlockchainBlock = {
      ...savedBlock,
      role: savedBlock.role as UserRole,
    };

    set((state) => ({
      blockchainBlocks: [
        ...state.blockchainBlocks.filter(
          (block) => block.id !== newBlock.id
        ),
        newBlock,
      ].sort((a, b) => a.index - b.index),
    }));

    return newBlock;
  },

  addAuditLog: (action, module, details, user) => {
    const newLog: AuditLog = {
      id: `LOG-${Date.now().toString().slice(-6)}`,
      timestamp: new Date().toLocaleString('vi-VN'),
      userId: user.id,
      userName: user.name,
      role: user.role,
      action,
      module,
      details,
      ipAddress: '192.168.1.100',
    };

    set((state) => ({
      auditLogs: [newLog, ...state.auditLogs],
    }));
  },

  addCattle: async (newCowData, operator, role) => {
    if (role !== 'FARM_MANAGER') {
      get().addToast(
        'error',
        'Không có quyền',
        'Chỉ Quản lý trang trại được thêm hồ sơ bò.'
      );

      throw new Error(
        'Bạn không có quyền thêm hồ sơ bò.'
      );
    }

    try {
      const weightRecord = {
        date: new Date().toISOString(),
        weight: newCowData.weight,
        recordedBy: operator,
        method: 'MANUAL' as const,
        note: 'Trọng lượng nhập trại ban đầu',
      };

      // Lưu hồ sơ bò vào MongoDB trước.
      const savedCow = await createCattleApi({
        ...newCowData,
        weightHistory: [weightRecord],
      });

      if (!savedCow?.id) {
        throw new Error(
          'Backend không trả về ID của bò vừa tạo.'
        );
      }

      // Chỉ ghi block sau khi backend đã lưu bò.
      const block = await recordBlockchainSafely(
        get,
        'CATTLE_INTAKE',
        {
          cattleId: savedCow.id,
          rfidTag: savedCow.rfidTag,
          breed: savedCow.breed,
          weight: savedCow.weight,
          penId: savedCow.penId,
        },
        operator,
        role
      );

      const newCow: Cattle = {
        ...savedCow,
        qrCodeData: `https://bovsmart.vn/verify/${savedCow.id}/${savedCow.rfidTag}`,
        blockchainHash:
          block?.hash ?? savedCow.blockchainHash ?? '',
        weightHistory:
          savedCow.weightHistory || [weightRecord],
      };

      // Đồng bộ QR và Blockchain hash lên MongoDB.
      try {
        const updatedCow = await updateCattleApi(
          savedCow.id,
          newCow
        );

        Object.assign(newCow, updatedCow);
      } catch (error) {
        console.error(
          'Không thể cập nhật QR/Blockchain hash:',
          error
        );

        get().addToast(
          'warning',
          'Đã thêm bò nhưng thiếu đồng bộ',
          'Hồ sơ đã lưu nhưng QR và Blockchain hash chưa đồng bộ đầy đủ lên MongoDB.'
        );
      }

      set((state) => ({
        cattle: [newCow, ...state.cattle],
        barns: state.barns.map((barn) =>
          barn.id === newCow.penId
            ? {
                ...barn,
                currentCount: barn.currentCount + 1,
              }
            : barn
        ),
      }));

      get().addAuditLog(
        'ADD_CATTLE',
        'Quản lý đàn bò',
        `Tiếp nhận cá thể bò mới ${newCow.id} (${newCow.breed})`,
        {
          id: 'USR-CURR',
          name: operator,
          role,
        }
      );

      get().addToast(
        'success',
        'Nhập Đàn Thành Công',
        `Bò ${newCow.id} (${newCow.breed}) đã được lưu vào MongoDB.`
      );
    } catch (error) {
      get().addToast(
        'error',
        'Không thể thêm bò',
        error instanceof Error
          ? error.message
          : 'Đã xảy ra lỗi khi thêm bò.'
      );

      throw error;
    }
  },

  updateCattle: async (id, updatedData, operator, role) => {
    if (role !== 'FARM_MANAGER') {
      get().addToast(
        'error',
        'Không có quyền',
        'Chỉ Quản lý trang trại được sửa hồ sơ bò.'
      );

      throw new Error(
        'Bạn không có quyền sửa hồ sơ bò.'
      );
    }

    try {
      const existingCow = get().cattle.find(
        (cow) => cow.id === id
      );

      if (!existingCow) {
        throw new Error(
          'Không tìm thấy hồ sơ bò cần cập nhật.'
        );
      }

      const payload: Cattle = {
        ...existingCow,
        ...updatedData,
        id: existingCow.id,
        weightHistory: existingCow.weightHistory,
      };

      const savedCow = await updateCattleApi(id, payload);

      set((state) => ({
        cattle: state.cattle.map((cow) =>
          cow.id === id ? savedCow : cow
        ),
      }));

      await recordBlockchainSafely(
        get,
        'CATTLE_UPDATE',
        {
          cattleId: id,
          changes: updatedData,
        },
        operator,
        role
      );

      get().addAuditLog(
        'UPDATE_CATTLE',
        'Quản lý đàn bò',
        `Cập nhật thông tin bò ${id}`,
        {
          id: 'USR-CURR',
          name: operator,
          role,
        }
      );

      get().addToast(
        'success',
        'Đã Cập Nhật',
        `Hồ sơ cá thể ${id} đã được lưu vào MongoDB.`
      );
    } catch (error) {
      get().addToast(
        'error',
        'Không thể cập nhật bò',
        error instanceof Error
          ? error.message
          : 'Đã xảy ra lỗi khi cập nhật bò.'
      );

      throw error;
    }
  },

  deleteCattle: async (id, operator, role) => {
    if (role !== 'FARM_MANAGER') {
      get().addToast(
        'error',
        'Không có quyền',
        'Chỉ Quản lý trang trại được xóa hồ sơ bò.'
      );

      throw new Error(
        'Bạn không có quyền xóa hồ sơ bò.'
      );
    }

    try {
      const cow = get().cattle.find(
        (item) => item.id === id
      );

      if (!cow) {
        throw new Error(
          'Không tìm thấy hồ sơ bò cần xóa.'
        );
      }

      await deleteCattleApi(id);

      set((state) => ({
        cattle: state.cattle.filter(
          (item) => item.id !== id
        ),
        barns: state.barns.map((barn) =>
          barn.id === cow.penId
            ? {
                ...barn,
                currentCount: Math.max(
                  0,
                  barn.currentCount - 1
                ),
              }
            : barn
        ),
      }));

      await recordBlockchainSafely(
        get,
        'CATTLE_ARCHIVE',
        {
          cattleId: id,
          reason: 'Xuất hoặc loại đàn',
        },
        operator,
        role
      );

      get().addAuditLog(
        'DELETE_CATTLE',
        'Quản lý đàn bò',
        `Xóa hồ sơ bò ${id}`,
        {
          id: 'USR-CURR',
          name: operator,
          role,
        }
      );

      get().addToast(
        'success',
        'Đã Xóa Cá Thể',
        `Hồ sơ bò ${id} đã được xóa khỏi MongoDB.`
      );
    } catch (error) {
      get().addToast(
        'error',
        'Không thể xóa bò',
        error instanceof Error
          ? error.message
          : 'Đã xảy ra lỗi khi xóa bò.'
      );

      throw error;
    }
  },

     // Ghi nhận cân nặng vào MongoDB thông qua backend.
  // Backend tự lấy người ghi nhận từ JWT và tự tạo Blockchain block.
  recordCattleWeight: async (
    cattleId,
    newWeight,
    _recordedBy,
    method = 'RFID_AUTO_SCALE',
    source = 'SIMULATED'
  ) => {
    if (newWeight <= 0 || !Number.isFinite(newWeight)) {
      get().addToast(
        'error',
        'Cân nặng không hợp lệ',
        'Cân nặng phải là số lớn hơn 0.'
      );

      throw new Error('Cân nặng phải lớn hơn 0.');
    }

    const existingCow = get().cattle.find(
      (c) => c.id === cattleId
    );

    if (!existingCow) {
      get().addToast(
        'error',
        'Không tìm thấy bò',
        `Không tìm thấy hồ sơ bò ${cattleId}.`
      );

      throw new Error('Không tìm thấy hồ sơ bò cần cân.');
    }

    const note =
      source === 'SIMULATED'
        ? 'Cân tự động mô phỏng qua cổng RFID (FR-IOT-04)'
        : 'Cân thủ công định kỳ';

    try {
      // Gửi dữ liệu cân lên backend để lưu MongoDB.
      const savedCow = await recordCattleWeightApi(
        cattleId,
        {
          weight: newWeight,
          note,
          method,
          source,
        }
      );

      if (!savedCow) {
        throw new Error(
          'Backend không trả về dữ liệu bò sau khi ghi nhận cân.'
        );
      }

      // Cập nhật Zustand bằng dữ liệu backend trả về.
      const updatedCow: Cattle = {
        ...existingCow,
        ...savedCow,
        weight: savedCow.weight,
        weightHistory:
          savedCow.weightHistory ??
          existingCow.weightHistory,
      };

      set((state) => ({
        cattle: state.cattle.map((c) =>
          c.id === cattleId ? updatedCow : c
        ),
      }));

      // Backend đã tự ghi Blockchain block.
      // Chỉ tải lại sổ cái, tuyệt đối không gọi mineBlock() ở đây.
      try {
        await get().fetchBlockchainBlocks();
      } catch (blockError) {
        console.error(
          'Cân nặng đã lưu nhưng chưa tải lại được Blockchain:',
          blockError
        );
      }

      get().addToast(
        'success',
        'Đã Ghi Nhận Cân Nặng',
        `Bò ${cattleId}: ${savedCow.weight} kg. Lịch sử cân đã được lưu vào MongoDB. Nguồn cân: ${source}.`
      );
    } catch (error) {
      console.error(
        'Lỗi lưu lịch sử cân nặng:',
        error
      );

      get().addToast(
        'error',
        'Không thể lưu cân nặng',
        error instanceof Error
          ? error.message
          : 'Đã xảy ra lỗi khi lưu lịch sử cân.'
      );

      throw error;
    }
  },

  // Gán RFID hiện chỉ cập nhật Zustand, chưa lưu MongoDB.
  // Vì vậy không tạo block Blockchain ở bước này.
  assignRfidTag: (cattleId, newRfid, _operator) => {
    if (!newRfid || newRfid.trim() === '') {
      return {
        success: false,
        message:
          'Mã RFID không được để trống (FR-COW-07).',
      };
    }

    const cleanRfid = newRfid.trim();

    const existing = get().cattle.find(
      (c) =>
        c.rfidTag === cleanRfid &&
        c.id !== cattleId
    );

    if (existing) {
      return {
        success: false,
        message: `Mã RFID ${cleanRfid} đã được gán cho con bò khác (${existing.id} - ${existing.name}).`,
      };
    }

    set((state) => ({
      cattle: state.cattle.map((c) =>
        c.id === cattleId
          ? { ...c, rfidTag: cleanRfid }
          : c
      ),
    }));

    get().addToast(
      'success',
      'Gán Mã RFID Thành Công (FR-COW-07)',
      `Bò ${cattleId} đã được cập nhật mã RFID trên giao diện: ${cleanRfid}.`
    );

    return {
      success: true,
      message: 'Gán mã RFID thành công trên giao diện.',
    };
  },

  addBarn: (barnData) => {
    const newBarn: Barn = {
      ...barnData,
      id: `PEN-0${get().barns.length + 1}`,
      currentCount: 0,
    };

    set((state) => ({
      barns: [...state.barns, newBarn],
    }));

    get().addToast(
      'success',
      'Tạo Chuồng Mới',
      `Chuồng ${newBarn.name} đã được khởi tạo.`
    );
  },

  updateBarn: (id, barnData) => {
    const barn = get().barns.find(
      (b) => b.id === id
    );

    if (
      barn &&
      barnData.capacity !== undefined &&
      barnData.capacity < barn.currentCount
    ) {
      get().addToast(
        'error',
        'Lỗi Sức Chứa',
        `Không được giảm sức chứa (${barnData.capacity}) xuống thấp hơn số bò hiện tại (${barn.currentCount} con).`
      );

      return;
    }

    set((state) => ({
      barns: state.barns.map((b) =>
        b.id === id
          ? { ...b, ...barnData }
          : b
      ),
    }));

    get().addToast(
      'info',
      'Cập Nhật Chuồng',
      `Thông số chuồng ${id} đã được cập nhật trên giao diện.`
    );
  },

  addHygieneRecord: (record) => {
    const newRec = {
      ...record,
      id: `HYG-0${get().hygieneRecords.length + 1}`,
    };

    set((state) => ({
      hygieneRecords: [
        newRec,
        ...state.hygieneRecords,
      ],
      barns: state.barns.map((b) =>
        b.id === record.penId
          ? { ...b, lastCleaned: record.date }
          : b
      ),
    }));

    get().addToast(
      'success',
      'Đã Ghi Nhận Vệ Sinh',
      `Đã cập nhật phiếu vệ sinh trên giao diện cho ${record.penName}.`
    );
  },

  transferCattle: async (
    cattleId,
    targetPenId,
    operator,
    role,
    reason
  ) => {
    if (role !== 'FARM_MANAGER') {
      get().addToast(
        'error',
        'Không có quyền',
        'Chỉ Quản lý trang trại được điều chuyển bò.'
      );

      throw new Error(
        'Bạn không có quyền điều chuyển bò.'
      );
    }

    const cow = get().cattle.find(
      (c) => c.id === cattleId
    );

    const targetBarn = get().barns.find(
      (b) =>
        b.id === targetPenId ||
        b.code === targetPenId
    );

    if (!cow) {
      get().addToast(
        'error',
        'Không tìm thấy dữ liệu',
        'Không tìm thấy hồ sơ bò cần điều chuyển.'
      );

      throw new Error(
        'Không tìm thấy hồ sơ bò.'
      );
    }

    if (!targetBarn || !targetBarn.code) {
      get().addToast(
        'error',
        'Không tìm thấy dữ liệu',
        'Không tìm thấy mã chuồng đích.'
      );

      throw new Error(
        'Không tìm thấy chuồng đích.'
      );
    }

    const oldPenCode = cow.penId;
    const targetBarnCode = targetBarn.code;

    if (oldPenCode === targetBarnCode) {
      get().addToast(
        'warning',
        'Không thể điều chuyển',
        'Bò hiện đang ở chuồng này.'
      );

      return;
    }

    try {
      await transferCattleApi(cattleId, {
        toBarnCode: targetBarnCode,
        note: reason || 'Điều phối nuôi dưỡng',
      });

      set((state) => ({
        cattle: state.cattle.map((c) =>
          c.id === cattleId
            ? { ...c, penId: targetBarnCode }
            : c
        ),
      }));

      await get().fetchBarns();

      await recordBlockchainSafely(
        get,
        'CATTLE_TRANSFER',
        {
          cattleId,
          fromPen: oldPenCode,
          toPen: targetBarnCode,
          reason: reason || 'Điều phối nuôi dưỡng',
        },
        operator,
        role
      );

      get().addAuditLog(
        'TRANSFER_CATTLE',
        'Quản lý chuồng trại',
        `Điều chuyển bò ${cattleId} từ chuồng ${oldPenCode} sang chuồng ${targetBarn.name}. Lý do: ${reason || 'Điều phối nuôi dưỡng'}`,
        {
          id: 'USR-CURR',
          name: operator,
          role,
        }
      );

      get().addToast(
        'success',
        'Điều Chuyển Thành Công',
        `Bò ${cattleId} đã chuyển sang ${targetBarn.name}.`
      );
    } catch (error) {
      get().addToast(
        'error',
        'Điều chuyển thất bại',
        error instanceof Error
          ? error.message
          : 'Không thể điều chuyển bò.'
      );

      throw error;
    }
  },

  updateFeedStock: (feedId, changeKg) => {
    set((state) => ({
      feedItems: state.feedItems.map((item) =>
        item.id === feedId
          ? {
              ...item,
              stockQuantity: Math.max(
                0,
                item.stockQuantity + changeKg
              ),
            }
          : item
      ),
    }));
  },

  addFeedItem: (item) => {
    const newItem: FeedItem = {
      ...item,
      id: `FEED-0${get().feedItems.length + 1}`,
      lastRestocked: new Date()
        .toISOString()
        .split('T')[0],
    };

    set((state) => ({
      feedItems: [...state.feedItems, newItem],
    }));

    get().addToast(
      'success',
      'Thêm Thức Ăn',
      `Đã thêm ${newItem.name} vào kho thức ăn trên giao diện.`
    );
  },

  updateFeedItem: (id, item) => {
    set((state) => ({
      feedItems: state.feedItems.map((f) =>
        f.id === id
          ? { ...f, ...item }
          : f
      ),
    }));

    get().addToast(
      'info',
      'Cập Nhật Kho',
      'Đã cập nhật mục thức ăn trên giao diện.'
    );
  },

  recordFeedImport: (data) => {
    if (data.quantity <= 0) {
      get().addToast(
        'error',
        'Lỗi Nhập Kho',
        'Số lượng nhập phải lớn hơn 0 (FR-FEED-02).'
      );

      return;
    }

    const feed = get().feedItems.find(
      (f) => f.id === data.feedItemId
    );

    if (!feed) return;

    const trx: FeedTransaction = {
      id: `TRX-IN-${Date.now().toString().slice(-4)}`,
      type: 'IMPORT',
      feedItemId: data.feedItemId,
      feedItemName: feed.name,
      quantity: data.quantity,
      date: data.date,
      supplier: data.supplier,
      performedBy: data.performedBy,
      note: data.note,
    };

    set((state) => ({
      feedTransactions: [
        trx,
        ...state.feedTransactions,
      ],
      feedItems: state.feedItems.map((f) =>
        f.id === data.feedItemId
          ? {
              ...f,
              stockQuantity:
                f.stockQuantity + data.quantity,
              lastRestocked: data.date,
            }
          : f
      ),
    }));

    get().addToast(
      'success',
      'Đã Nhập Kho',
      `Đã nhập +${data.quantity.toLocaleString('vi-VN')} kg ${feed.name}. Tồn kho đã tăng trên giao diện.`
    );
  },

  recordFeedExport: (data) => {
    if (data.quantity <= 0) {
      get().addToast(
        'error',
        'Lỗi Xuất Kho',
        'Số lượng xuất phải lớn hơn 0 (FR-FEED-03).'
      );

      return;
    }

    const feed = get().feedItems.find(
      (f) => f.id === data.feedItemId
    );

    if (!feed) return;

    if (data.quantity > feed.stockQuantity) {
      get().addToast(
        'error',
        'Không Đủ Tồn Kho',
        `Không thể xuất ${data.quantity} kg. Tồn kho hiện chỉ còn ${feed.stockQuantity} kg.`
      );

      return;
    }

    const trx: FeedTransaction = {
      id: `TRX-OUT-${Date.now().toString().slice(-4)}`,
      type: 'EXPORT',
      feedItemId: data.feedItemId,
      feedItemName: feed.name,
      quantity: data.quantity,
      date: data.date,
      purpose: data.purpose,
      penId: data.penId,
      performedBy: data.performedBy,
      note: data.note,
    };

    set((state) => ({
      feedTransactions: [
        trx,
        ...state.feedTransactions,
      ],
      feedItems: state.feedItems.map((f) =>
        f.id === data.feedItemId
          ? {
              ...f,
              stockQuantity:
                f.stockQuantity - data.quantity,
            }
          : f
      ),
    }));

    get().addToast(
      'success',
      'Đã Xuất Kho',
      `Đã xuất -${data.quantity.toLocaleString('vi-VN')} kg ${feed.name}. Tồn kho đã giảm trên giao diện.`
    );
  },

  addFeedRation: (ration) => {
    const newRation: FeedRation = {
      ...ration,
      id: `RAT-0${get().feedRations.length + 1}`,
    };

    set((state) => ({
      feedRations: [...state.feedRations, newRation],
    }));

    get().addToast(
      'success',
      'Tạo Khẩu Phần',
      `Đã tạo công thức ${newRation.rationName} trên giao diện.`
    );
  },

  completeFeedingSchedule: (
    scheduleId,
    completedBy,
    notes
  ) => {
    const sch = get().feedingSchedules.find(
      (s) => s.id === scheduleId
    );

    if (!sch) return;

    set((state) => ({
      feedingSchedules: state.feedingSchedules.map((s) =>
        s.id === scheduleId
          ? {
              ...s,
              status: 'COMPLETED',
              completedAt: new Date().toLocaleTimeString(
                'vi-VN',
                {
                  hour: '2-digit',
                  minute: '2-digit',
                }
              ),
              completedBy,
              notes: notes || s.notes,
            }
          : s
      ),
    }));

    get().addToast(
      'success',
      'Đã Ghi Nhận Cho Ăn',
      `Đã cập nhật trạng thái ca cho ăn tại ${sch.penName} trên giao diện.`
    );
  },

  // Hồ sơ sức khỏe hiện chỉ cập nhật Zustand.
  // Chưa có API tạo hồ sơ trong các service đang import.
  addHealthRecord: (record, _operator, _role) => {
    const newRecord: HealthRecord = {
      ...record,
      id: `HLT-0${get().healthRecords.length + 1}`,
    };

    set((state) => ({
      healthRecords: [
        newRecord,
        ...state.healthRecords,
      ],
      cattle: state.cattle.map((c) => {
        if (c.id === record.cattleId) {
          return {
            ...c,
            status: record.quarantineRequired
              ? 'QUARANTINE'
              : 'TREATMENT',
            withdrawalDaysRemaining:
              record.withdrawalPeriodDays,
            penId: record.quarantineRequired
              ? 'PEN-04'
              : c.penId,
          };
        }

        return c;
      }),
    }));

    get().addToast(
      'warning',
      'Hồ Sơ Sức Khỏe Mới',
      `Đã cập nhật hồ sơ điều trị ${record.cattleId} trên giao diện. Dữ liệu chưa được lưu vào MongoDB.`
    );
  },

  updateHealthRecord: (id, update) => {
    set((state) => ({
      healthRecords: state.healthRecords.map((h) =>
        h.id === id
          ? { ...h, ...update }
          : h
      ),
    }));

    get().addToast(
      'info',
      'Cập Nhật Bệnh Án',
      'Đã cập nhật thông tin điều trị trên giao diện.'
    );
  },

  completeVaccination: (vacId, completedBy) => {
    const today = new Date()
      .toISOString()
      .split('T')[0];

    set((state) => ({
      vaccinations: state.vaccinations.map((v) =>
        v.id === vacId
          ? {
              ...v,
              status: 'COMPLETED',
              completedDate: today,
              notes: `Hoàn tất bởi ${completedBy}`,
            }
          : v
      ),
    }));

    get().addToast(
      'success',
      'Đã Tiêm Phòng',
      'Đã cập nhật trạng thái lịch tiêm phòng trên giao diện.'
    );
  },

  addVaccination: (vac) => {
    const newVac: VaccinationSchedule = {
      ...vac,
      id: `VAC-0${get().vaccinations.length + 1}`,
    };

    set((state) => ({
      vaccinations: [
        ...state.vaccinations,
        newVac,
      ],
    }));

    get().addToast(
      'success',
      'Lên Lịch Tiêm Phòng',
      `Đã tạo lịch vaccine ${newVac.vaccineName} trên giao diện.`
    );
  },

  // Tải nhật ký từ MongoDB theo quyền tài khoản.
  fetchDailyDiaries: async (role) => {
    try {
      const diaryList =
        role === 'STAFF'
          ? await getMyDailyDiariesApi()
          : await getAllDailyDiariesApi();

      set({
        diaries: diaryList,
      });

      console.log(
        'Đã tải nhật ký chăn nuôi từ MongoDB:',
        diaryList.length
      );
    } catch (error) {
      get().addToast(
        'error',
        'Lỗi tải nhật ký',
        error instanceof Error
          ? error.message
          : 'Không thể tải danh sách nhật ký.'
      );

      throw error;
    }
  },

  // Thêm nhật ký vào MongoDB.
  addDailyDiary: async (diary, operator, role) => {
    if (
      role !== 'STAFF' &&
      role !== 'FARM_MANAGER'
    ) {
      throw new Error(
        'Bạn không có quyền tạo nhật ký chăn nuôi.'
      );
    }

    try {
      const {
        authorName,
        authorRole,
        verifiedByManager,
        ...requestData
      } = diary;

      // Lưu nhật ký vào MongoDB trước.
      const savedDiary = await createDailyDiaryApi(
        requestData
      );

      set((state) => ({
        diaries: [
          savedDiary,
          ...state.diaries,
        ],
      }));

      await recordBlockchainSafely(
        get,
        'DAILY_DIARY_ENTRY',
        {
          diaryId: savedDiary.id,
          shift: savedDiary.shift,
          date: savedDiary.date,
        },
        operator,
        role
      );

      get().addToast(
        'success',
        'Đã Lưu Nhật Ký',
        'Nhật ký chăn nuôi đã được lưu vào MongoDB.'
      );
    } catch (error) {
      get().addToast(
        'error',
        'Không thể lưu nhật ký',
        error instanceof Error
          ? error.message
          : 'Đã xảy ra lỗi khi lưu nhật ký.'
      );

      throw error;
    }
  },

  // FARM_MANAGER xác nhận nhật ký trên MongoDB.
  verifyDailyDiary: async (diaryId, managerName) => {
    try {
      const verifiedDiary = await verifyDailyDiaryApi(
        diaryId
      );

      set((state) => ({
        diaries: state.diaries.map((diary) =>
          diary.id === diaryId
            ? verifiedDiary
            : diary
        ),
      }));

      const currentUser =
        useAuthStore.getState().currentUser;

      await recordBlockchainSafely(
        get,
        'DAILY_DIARY_VERIFIED',
        {
          diaryId: verifiedDiary.id,
          date: verifiedDiary.date,
          shift: verifiedDiary.shift,
        },
        managerName ||
          currentUser?.name ||
          'Quản lý trang trại',
        currentUser?.role ?? 'FARM_MANAGER'
      );

      get().addToast(
        'success',
        'Đã Xác Nhận Nhật Ký',
        'Nhật ký đã được quản lý xác nhận thành công.'
      );
    } catch (error) {
      get().addToast(
        'error',
        'Không thể xác nhận nhật ký',
        error instanceof Error
          ? error.message
          : 'Đã xảy ra lỗi khi xác nhận nhật ký.'
      );

      throw error;
    }
  },

  // Tạo phiếu xuất bán trên MongoDB.
  createSalesOrder: async (
    orderData,
    operator,
    role
  ) => {
    if (
      role !== 'STAFF' &&
      role !== 'FARM_MANAGER'
    ) {
      get().addToast(
        'error',
        'Không có quyền',
        'ADMIN không được tạo phiếu xuất bán.'
      );

      throw new Error(
        'Bạn không có quyền tạo phiếu xuất bán.'
      );
    }

    if (!orderData.selectedCattleIds?.length) {
      throw new Error(
        'Vui lòng chọn ít nhất một con bò.'
      );
    }

    try {
      const now = new Date();

      const saleDate =
        `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}` +
        `T${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;

      const savedOrder = await createSalesOrderApi({
        cattleIds: orderData.selectedCattleIds,
        buyerName: orderData.buyerName,
        buyerPhone:
          orderData.buyerPhone || undefined,
        saleDate,
        pricePerKg: Number(
          orderData.pricePerKgVND
        ),
        notes: orderData.notes || undefined,
      });

      const newOrder =
        mapApiSalesOrderToUi(savedOrder);

      set((state) => ({
        salesOrders: [
          newOrder,
          ...state.salesOrders.filter(
            (order) => order.id !== newOrder.id
          ),
        ],
      }));

      await recordBlockchainSafely(
        get,
        'SALES_ORDER_CREATED',
        {
          salesOrderId: newOrder.id,
          orderNumber: newOrder.orderNumber,
          buyerName: newOrder.buyerName,
          totalHeads: newOrder.totalHeads,
          totalWeightKg: newOrder.totalWeightKg,
          totalRevenueVND: newOrder.totalRevenueVND,
        },
        operator,
        role
      );

      get().addAuditLog(
        'CREATE_SALES_ORDER',
        'Quản lý xuất bán',
        `Tạo phiếu ${newOrder.orderNumber} gồm ${newOrder.totalHeads} con bò`,
        {
          id: 'USR-CURR',
          name: operator,
          role,
        }
      );

      get().addToast(
        'success',
        'Tạo Phiếu Xuất Thành Công',
        `Phiếu ${newOrder.orderNumber} đã được lưu. Trạng thái: Chờ quản lý phê duyệt.`
      );
    } catch (error) {
      get().addToast(
        'error',
        'Không thể tạo phiếu xuất bán',
        error instanceof Error
          ? error.message
          : 'Đã xảy ra lỗi khi tạo phiếu.'
      );

      throw error;
    }
  },

  // Quản lý phê duyệt phiếu xuất bán.
  approveSalesOrder: async (
    orderId,
    approver,
    role
  ) => {
    if (role !== 'FARM_MANAGER') {
      get().addToast(
        'error',
        'Không có quyền',
        'Chỉ Quản lý trang trại được phê duyệt phiếu xuất bán.'
      );

      throw new Error(
        'Bạn không có quyền phê duyệt phiếu xuất bán.'
      );
    }

    try {
      const savedOrder =
        await approveSalesOrderApi(orderId);

      const updatedOrder =
        mapApiSalesOrderToUi(savedOrder);

      set((state) => ({
        salesOrders: state.salesOrders.map((order) =>
          order.id === orderId
            ? updatedOrder
            : order
        ),
      }));

      await get().fetchCattle();

      await recordBlockchainSafely(
        get,
        'SALES_ORDER_APPROVED',
        {
          salesOrderId: updatedOrder.id,
          orderNumber: updatedOrder.orderNumber,
          cattleIds: updatedOrder.selectedCattleIds,
          totalHeads: updatedOrder.totalHeads,
          totalWeightKg: updatedOrder.totalWeightKg,
          totalRevenueVND: updatedOrder.totalRevenueVND,
        },
        approver,
        role
      );

      get().addAuditLog(
        'APPROVE_SALES_ORDER',
        'Quản lý xuất bán',
        `Phê duyệt phiếu ${updatedOrder.orderNumber}`,
        {
          id: 'USR-CURR',
          name: approver,
          role,
        }
      );

      get().addToast(
        'success',
        'Đã phê duyệt xuất bán',
        `Phiếu ${updatedOrder.orderNumber} đã được backend xác nhận.`
      );
    } catch (error) {
      get().addToast(
        'error',
        'Không thể phê duyệt phiếu',
        error instanceof Error
          ? error.message
          : 'Đã xảy ra lỗi khi phê duyệt.'
      );

      throw error;
    }
  },

  // Quản lý từ chối phiếu xuất bán.
  rejectSalesOrder: async (
    orderId,
    reason,
    role
  ) => {
    if (role !== 'FARM_MANAGER') {
      get().addToast(
        'error',
        'Không có quyền',
        'Chỉ Quản lý trang trại được từ chối phiếu xuất bán.'
      );

      throw new Error(
        'Bạn không có quyền từ chối phiếu xuất bán.'
      );
    }

    if (!reason.trim()) {
      throw new Error(
        'Vui lòng nhập lý do từ chối phiếu.'
      );
    }

    try {
      const savedOrder =
        await rejectSalesOrderApi(orderId, reason);

      const updatedOrder =
        mapApiSalesOrderToUi(savedOrder);

      set((state) => ({
        salesOrders: state.salesOrders.map((order) =>
          order.id === orderId
            ? updatedOrder
            : order
        ),
      }));

      await recordBlockchainSafely(
        get,
        'SALES_ORDER_REJECTED',
        {
          salesOrderId: updatedOrder.id,
          orderNumber: updatedOrder.orderNumber,
          reason,
        },
        'Quản lý trang trại',
        role
      );

      get().addAuditLog(
        'REJECT_SALES_ORDER',
        'Quản lý xuất bán',
        `Từ chối phiếu ${updatedOrder.orderNumber}. Lý do: ${reason}`,
        {
          id: 'USR-CURR',
          name: 'Quản lý trang trại',
          role,
        }
      );

      get().addToast(
        'success',
        'Đã từ chối phiếu',
        `Phiếu ${updatedOrder.orderNumber} đã được backend cập nhật.`
      );
    } catch (error) {
      get().addToast(
        'error',
        'Không thể từ chối phiếu',
        error instanceof Error
          ? error.message
          : 'Đã xảy ra lỗi khi từ chối phiếu.'
      );

      throw error;
    }
  },

  // Hàm này hiện dùng API từ chối phiếu để hủy.
  cancelSalesOrder: async (orderId, reason) => {
    if (!reason.trim()) {
      throw new Error(
        'Vui lòng nhập lý do hủy phiếu.'
      );
    }

    try {
      const savedOrder =
        await rejectSalesOrderApi(orderId, reason);

      const updatedOrder =
        mapApiSalesOrderToUi(savedOrder);

      set((state) => ({
        salesOrders: state.salesOrders.map((order) =>
          order.id === orderId
            ? updatedOrder
            : order
        ),
      }));

      const currentUser =
        useAuthStore.getState().currentUser;

      await recordBlockchainSafely(
        get,
        'SALES_ORDER_CANCELLED',
        {
          salesOrderId: updatedOrder.id,
          orderNumber: updatedOrder.orderNumber,
          reason,
        },
        currentUser?.name ?? '',
        currentUser?.role ?? 'STAFF'
      );

      get().addToast(
        'success',
        'Đã hủy phiếu',
        `Phiếu ${updatedOrder.orderNumber} đã được backend cập nhật.`
      );
    } catch (error) {
      get().addToast(
        'error',
        'Không thể hủy phiếu',
        error instanceof Error
          ? error.message
          : 'Đã xảy ra lỗi khi hủy phiếu.'
      );

      throw error;
    }
  },

  simulateScanRfid: (rfidTag) => {
    set({
      isRfidScanning: true,
    });

    setTimeout(() => {
      const cow = get().cattle.find(
        (c) =>
          c.rfidTag === rfidTag ||
          c.id === rfidTag
      );

      const simulatedWeight = cow
        ? Number(
            (
              cow.weight +
              (Math.random() * 2 - 0.5)
            ).toFixed(1)
          )
        : 520.0;

      set({
        scannedRfidTag: cow
          ? cow.rfidTag
          : rfidTag,
        activeScaleWeight: simulatedWeight,
        scaleIsStable: true,
        isRfidScanning: false,
      });

      get().addToast(
        'info',
        'Phát Hiện Thẻ RFID',
        `Trạm quét RFID nhận diện thẻ: ${cow ? cow.name : rfidTag} - Cân mô phỏng: ${simulatedWeight} kg`
      );
    }, 400);
  },

  setSimulatedScaleWeight: (weight) => {
    set({
      activeScaleWeight: weight,
      scaleIsStable: true,
    });
  },

  tareScale: () => {
    set({
      scaleTare: get().activeScaleWeight,
      activeScaleWeight: 0.0,
    });

    get().addToast(
      'info',
      'Đã Cân Bằng (Tare)',
      'Cân điện tử mô phỏng đã được chuẩn về 0.00 kg.'
    );
  },

  resetSimulation: () => {
    set({
      scannedRfidTag: null,
      activeScaleWeight: 0.0,
      scaleIsStable: false,
      scaleTare: 0,
    });
  },

  // Cấu hình hiện chỉ cập nhật Zustand, chưa lưu MongoDB.
  // Không ghi Blockchain để tránh tạo block cho dữ liệu chưa được lưu thật.
  updateSystemConfig: (config, _operator, _role) => {
    set((state) => ({
      systemConfig: {
        ...state.systemConfig,
        ...config,
      },
    }));

    get().addToast(
      'info',
      'Cài Đặt Hệ Thống',
      'Thông số đã được cập nhật trên giao diện. Chức năng lưu cấu hình vào MongoDB chưa được kết nối.'
    );
  },
}));
