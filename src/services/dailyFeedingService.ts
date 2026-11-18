
const API_URL = '/api/feeding';

export interface ApiResponse<T> {
  success: number;
  data: T;
  message: string;
}

export interface RationFeedItem {
  feedId: string;
  feedName: string;
  dailyQuantityPerHead: number;
  unit: string;
}

export interface DailyRation {
  id: string;
  rationCode: string;
  barnId: string;
  barnCode: string;
  feedingDate: string;
  cattleCount: number;
  feeds: RationFeedItem[];
  status: string;
  createdBy: string;
  createdAt: string;
}

export interface ShiftFeedItem {
  feedId: string;
  feedName: string;
  plannedQuantity: number;
  unit: string;
}

export interface FeedingShiftSchedule {
  id: string;
  dailyRationId: string;
  scheduleCode: string;
  barnId: string;
  barnCode: string;
  feedingDate: string;
  shiftCode: string;
  shiftName: string;
  feedingTime: string;
  ratio: number;
  feeds: ShiftFeedItem[];
  assignedTo: string;
  status: string;
  createdBy: string;
  createdAt: string;
}

export interface ShiftActualFeedItem {
  feedId: string;
  feedName: string;
  plannedQuantity: number;
  actualQuantity: number;
  unit: string;
}

export interface FeedingShiftRecord {
  id: string;
  shiftScheduleId: string;
  dailyRationId: string;
  scheduleCode: string;
  barnId: string;
  barnCode: string;
  feedingDate: string;
  shiftCode: string;
  shiftName: string;
  performedBy: string;
  note: string;
  feeds: ShiftActualFeedItem[];
  recordStatus: string;
  reviewedBy?: string;
  reviewNote?: string;
  reviewedAt?: string;
  performedAt: string;
}

export interface CreateDailyRationRequest {
  groupCode: 'A' | 'B' | 'C';
  periodType: 'DAY' | 'WEEK';
  startDate: string;
  endDate?: string;
  feeds: {
    feedId: string;
    dailyQuantityPerHead: number;
  }[];
}

export interface CreateShiftRecordRequest {
  shiftScheduleId: string;
  note: string;
  feeds: {
    feedId: string;
    actualQuantity: number;
  }[];
}

async function dailyFeedingRequest<T>(
  endpoint: string,
  method: string = 'GET',
  body?: unknown
): Promise<T> {
  const token = localStorage.getItem('bovsmart_auth_token');

  if (!token) {
    throw new Error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    ...(body !== undefined
      ? { body: JSON.stringify(body) }
      : {}),
  });

  const responseText = await response.text();

  let result: ApiResponse<T>;

  try {
    result = JSON.parse(responseText);
  } catch {
    throw new Error(
      responseText || `Lỗi máy chủ (${response.status})`
    );
  }

  if (!response.ok || result.success !== 1) {
    throw new Error(
      result.message || `Yêu cầu thất bại (${response.status})`
    );
  }

  return result.data;
}

// 1. Tạo khẩu phần ăn tổng trong ngày
export const createDailyRationApi = (
  data: CreateDailyRationRequest
) =>
  dailyFeedingRequest<DailyRation>(
    '/daily-rations',
    'POST',
    data
  );

// 2. Lấy toàn bộ khẩu phần ăn
export const getAllDailyRationsApi = () =>
  dailyFeedingRequest<DailyRation[]>('/daily-rations');

// 3. Lấy toàn bộ lịch cho ăn theo ca
export const getAllShiftSchedulesApi = () =>
  dailyFeedingRequest<FeedingShiftSchedule[]>('/shift-schedules');

// 4. Nhân viên lấy lịch được phân công
export const getMyShiftSchedulesApi = () =>
  dailyFeedingRequest<FeedingShiftSchedule[]>(
    '/my-shift-schedules'
  );

// 5. Lấy lịch cho ăn theo chuồng
export const getShiftSchedulesByBarnApi = (barnId: string) =>
  dailyFeedingRequest<FeedingShiftSchedule[]>(
    `/shift-schedules/barn/${encodeURIComponent(barnId)}`
  );

// 6. Nhân viên gửi kết quả cho ăn thực tế
export const createShiftRecordApi = (
  data: CreateShiftRecordRequest
) =>
  dailyFeedingRequest<FeedingShiftRecord>(
    '/shift-records',
    'POST',
    data
  );

// 7. Quản lý lấy toàn bộ kết quả cho ăn
export const getAllShiftRecordsApi = () =>
  dailyFeedingRequest<FeedingShiftRecord[]>('/shift-records');

// 8. Nhân viên xem kết quả đã ghi nhận
export const getMyShiftRecordsApi = () =>
  dailyFeedingRequest<FeedingShiftRecord[]>(
    '/my-shift-records'
  );

// 9. Quản lý xác nhận kết quả cho ăn
export const approveShiftRecordApi = (
  id: string,
  reviewNote: string = ''
) =>
  dailyFeedingRequest<FeedingShiftRecord>(
    `/shift-records/${encodeURIComponent(id)}/approve`,
    'PUT',
    { reviewNote }
  );

// 10. Quản lý từ chối kết quả cho ăn
export const rejectShiftRecordApi = (
  id: string,
  reviewNote: string
) =>
  dailyFeedingRequest<FeedingShiftRecord>(
    `/shift-records/${encodeURIComponent(id)}/reject`,
    'PUT',
    { reviewNote }
  );

export const getFeedingDiaryApi = (
  params?: {
    barnId?: string;
    fromDate?: string;
    toDate?: string;
    keyword?: string;
  }
): Promise<FeedingShiftRecord[]> => {
  const query = new URLSearchParams();

  if (params?.barnId) query.set('barnId', params.barnId);
  if (params?.fromDate) query.set('fromDate', params.fromDate);
  if (params?.toDate) query.set('toDate', params.toDate);
  if (params?.keyword) query.set('keyword', params.keyword);

  const queryString = query.toString();

  return dailyFeedingRequest<FeedingShiftRecord[]>(
    `/diary${queryString ? `?${queryString}` : ''}`
  );
};
