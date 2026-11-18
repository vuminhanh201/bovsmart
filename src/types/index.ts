export type UserRole = 'ADMIN' | 'FARM_MANAGER' | 'STAFF';

export interface User {
  id: string;
  username?: string;
  name: string;
  email: string;
  avatar: string;
  role: UserRole;
  phone: string;
  department: string;
  status: 'ACTIVE' | 'INACTIVE';
  lastLogin: string;
  assignedPens?: string[];
}

export type CattleStatus =
  | 'DANG_NUOI'              // Đang nuôi
  | 'CAN_THEO_DOI'           // Cần theo dõi
  | 'DANG_DIEU_TRI'          // Đang điều trị
  | 'DU_DIEU_KIEN_XUAT_BAN'  // Đủ điều kiện xuất bán
  | 'DA_XUAT_BAN'            // Đã xuất bán
  | 'HEALTHY'                // Compatible alias for Đang nuôi
  | 'TREATMENT'              // Compatible alias for Đang điều trị
  | 'READY_FOR_SALE'         // Compatible alias for Đủ điều kiện xuất bán
  | 'SOLD'                   // Compatible alias for Đã xuất bán
  | 'QUARANTINE'             // Compatible alias for Cần theo dõi / cách ly
  | 'PREGNANT';

export type CattleGender = 'MALE' | 'FEMALE';

export interface WeightRecord {
  id?: string;
  date: string;
  weight: number; // in kg
  recordedBy: string;
  note?: string;
  method?: 'RFID_AUTO_SCALE' | 'MANUAL';
  source?: 'SIMULATED' | 'MANUAL'; // Theo yêu cầu FR-IOT-04
}

export interface HygieneRecord {
  id: string;
  penId: string;
  penName: string;
  date: string;
  content: string; // Nội dung vệ sinh (tiêu độc khử trùng, rắc vôi bột, thông cống rãnh)
  performedBy: string;
  note?: string;
}

export interface FeedTransaction {
  id: string;
  type: 'IMPORT' | 'EXPORT'; // Nhập kho (FR-FEED-02) hoặc Xuất kho (FR-FEED-03)
  feedItemId: string;
  feedItemName: string;
  quantity: number; // in kg
  date: string;
  supplier?: string; // Nhà cung cấp (cho phiếu nhập)
  purpose?: string;  // Mục đích sử dụng (cho phiếu xuất)
  penId?: string;    // Chuồng liên quan (cho phiếu xuất)
  performedBy: string;
  note?: string;
}

export interface Cattle {
  id: string; // e.g., VN-BOV-001
  rfidTag: string; // e.g., 982.000.412.899
  earTagNumber: string; // Visual tag on ear e.g., #0142
  name: string;
  breed: string; // e.g., Angus, Wagyu, Brahman, Holstein Friesian, 3B
  gender: CattleGender;
  dob: string; // Date of birth
  ageMonths: number;
  weight: number; // Current weight in kg
  initialWeight: number;
  penId: string; // Barn/Pen ID
  status: CattleStatus;
  motherId?: string;
  fatherId?: string;
  origin: string; // e.g., Trại giống Ba Vì, Nhập khẩu Úc
  entryDate: string;
  photoUrl: string;
  withdrawalDaysRemaining: number; // Days remaining for antibiotic clearance (0 = safe to sell)
  targetMarketWeight: number; // Target weight for sale e.g. 550kg
  qrCodeData: string;
  blockchainHash?: string;
  weightHistory: WeightRecord[];
  notes?: string;
}


export interface Barn {
  id: string;
  code: string;
  name: string; // Tên chuồng
  type: 'FATTENING' | 'ADAPTATION' | 'QUARANTINE' | 'CALF';
  capacity: number; // Sức chứa tối đa
  currentCount: number; // Số bò hiện tại
  assignedStaff: string; // Nhân viên phụ trách
  temperature: number; // Nhiệt độ (°C)
  humidity: number; // Độ ẩm (%)
  ammonia: number; // Nồng độ ammonia (ppm)
  fanStatus: 'ON' | 'OFF' | 'AUTO';
  waterSystem: 'NORMAL' | 'LOW_PRESSURE';
  lastCleaned: string;
  notes?: string;
}


export interface FeedItem {
  id: string;
  name: string; // Cỏ Voi Ủ Chua, Cám Hỗn Hợp CP, Rơm Khô, Bột Ngô
  category: 'ROUGHAGE' | 'CONCENTRATE' | 'MINERAL' | 'SILAGE';
  stockQuantity: number; // in kg
  unit: string;
  reorderLevel: number;
  unitPrice: number; // VND per kg
  lastRestocked: string;
  supplier: string;
}

export interface FeedRation {
  id: string;
  rationName: string; // Khẩu phần vỗ béo giai đoạn 2
  targetStage: string;
  crudeProtein: number; // % đạm
  energyMcal: number;
  items: {
    feedItemId: string;
    feedItemName: string;
    amountPerHeadKg: number;
  }[];
}

export interface FeedingSchedule {
  id: string;
  penId: string;
  penName: string;
  feedingDate?: string;
  shift: 'MORNING' | 'NOON' | 'EVENING';
  scheduledTime: string;
  rationId: string;
  rationName: string;
  amountTotalKg: number;
  status: 'PENDING' | 'COMPLETED' | 'DELAYED';
  completedAt?: string;
  completedBy?: string;
  notes?: string;
}

export interface HealthRecord {
  id: string;
  cattleId: string;
  rfidTag: string;
  date: string;
  diagnosis: string;
  symptoms: string;
  treatment: string;
  medication: string;
  dose: string;
  veterinarian: string;
  status: 'ONGOING' | 'RECOVERED' | 'MONITORING';
  quarantineRequired: boolean;
  withdrawalPeriodDays: number; // Days until meat is safe
}

export interface VaccinationSchedule {
  id: string;
  cattleId?: string; // If specific or all in pen
  penId?: string;
  targetGroup: string; // 'Toàn trang trại' | 'Bò vỗ béo Chuồng A1'
  vaccineName: string; // Lở mồm long móng, Tụ huyết trùng, Viêm da nổi cục
  dose: string;
  scheduledDate: string;
  veterinarian: string;
  status: 'SCHEDULED' | 'COMPLETED' | 'CANCELLED';
  completedDate?: string;
  notes?: string;
}

export interface DailyDiary {
  id: string;
  date: string;
  shift: 'CA_SANG' | 'CA_CHIEU' | 'CA_DEM';
  authorName: string;
  authorRole: UserRole;
  penActivities: {
    penId: string;
    penName: string;
    cleaned: boolean;
    waterChecked: boolean;
    feedEatenPercentage: number;
    unusualBehavior?: string;
  }[];
  generalObservations: string;
  weather: 'Nang_Rao' | 'Mua_Am' | 'Gió_Lanh';
  tempAvg: number;
  verifiedByManager?: string;
}

export interface SalesOrder {
  id: string;
  orderNumber: string; // HD-2026-004
  createdAt: string;
  buyerName: string;
  buyerPhone: string;
  buyerCompany: string;
  selectedCattleIds: string[];
  totalHeads: number;
  totalWeightKg: number;
  pricePerKgVND: number;
  totalRevenueVND: number;
  status: 'DRAFT' | 'PENDING_APPROVAL' | 'APPROVED' | 'COMPLETED' | 'CANCELLED';
  approvedBy?: string;
  approvalDate?: string;
  notes?: string;
  paymentStatus: 'PAID' | 'PARTIAL' | 'UNPAID';
}

export interface BlockchainBlock {
  id: string;
  index: number;
  timestamp: string;
  action: string;
  data: any;
  previousHash: string;
  hash: string;
  operator: string;
  role: UserRole;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  role: UserRole;
  action: string;
  module: string;
  details: string;
  ipAddress: string;
}

export interface BackendAuditLog {
  id: string;
  username: string;
  role: string;
  action: string;
  targetType: string;
  targetId: string;
  description: string;
  timestamp: string;
  details?: Record<string, unknown>;
}

export interface SystemConfig {
  farmName: string;
  farmCode: string;
  address: string;
  hotline: string;
  rfidReaderFrequency: string; // e.g. 134.2 kHz ISO 11784/11785 FDX-B
  scaleBaudRate: number; // 9600
  scaleAutoTare: boolean;
  alertHighTempThreshold: number; // 32°C
  alertHighAmmoniaThreshold: number; // 15 ppm
  backupFrequency: 'DAILY' | 'WEEKLY';
  blockchainSync: boolean;
}
