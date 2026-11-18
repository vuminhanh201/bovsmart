
const API_URL = '/api/vaccination-schedules';

const getToken = () => localStorage.getItem('bovsmart_auth_token');

export interface VaccinationSchedule {
  id: string;
  targetGroup: string;
  cattleIds: string[];
  vaccineName: string;
  vaccineType?: string;
  dosage: string;
  scheduledDate: string;
  assignedVeterinarianEmail: string;
  assignedVeterinarianName?: string;
  status: 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  notes?: string;
  createdBy?: string;
  createdAt?: string;
  completedAt?: string;
}

export interface VaccinationScheduleRequest {
  targetGroup: string;
  cattleIds: string[];
  vaccineName: string;
  vaccineType?: string;
  dosage: string;
  scheduledDate: string;
  assignedVeterinarianEmail: string;
  notes?: string;
}

interface ApiResponse<T> {
  success: number;
  data: T;
  message: string;
}

const request = async <T>(
  url: string,
  options: RequestInit = {}
): Promise<T> => {
  const token = getToken();

  if (!token) {
    throw new Error('Bạn cần đăng nhập để thực hiện thao tác này.');
  }

  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  });

  const result = await response.json();

  if (!response.ok || result.success === 0) {
    throw new Error(result.message || 'Có lỗi xảy ra khi kết nối máy chủ.');
  }

  return result.data as T;
};

// FARM_MANAGER tạo lịch tiêm và phân công nhân viên Thú y
export const createVaccinationScheduleApi = (
  data: VaccinationScheduleRequest
) => {
  return request<VaccinationSchedule>(API_URL, {
    method: 'POST',
    body: JSON.stringify(data),
  });
};

// FARM_MANAGER và ADMIN xem toàn bộ lịch
export const getAllVaccinationSchedulesApi = () => {
  return request<VaccinationSchedule[]>(API_URL);
};

// STAFF Thú y chỉ xem lịch được phân công
export const getMyVaccinationSchedulesApi = () => {
  return request<VaccinationSchedule[]>(
    `${API_URL}/my-schedules`
  );
};

// Xem chi tiết lịch tiêm
export const getVaccinationScheduleByIdApi = (id: string) => {
  return request<VaccinationSchedule>(
    `${API_URL}/${encodeURIComponent(id)}`
  );
};

// FARM_MANAGER cập nhật trạng thái lịch
export const updateVaccinationScheduleStatusApi = (
  id: string,
  status: VaccinationSchedule['status']
) => {
  return request<VaccinationSchedule>(
    `${API_URL}/${encodeURIComponent(id)}/status?status=${encodeURIComponent(status)}`,
    {
      method: 'PUT',
    }
  );
};
