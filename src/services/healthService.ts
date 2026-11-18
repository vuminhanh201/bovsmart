
const API_URL = '/api/health';

const getToken = () => localStorage.getItem('bovsmart_auth_token');

export interface HealthRecord {
  id: string;
  cattleId: string;
  rfidTag?: string;
  earTagNumber?: string;

  examinationDate: string;
  symptoms: string;
  diagnosis: string;

  treatment?: string;
  medicine?: string;
  dosage?: string;

  treatmentStartDate?: string;
  treatmentEndDate?: string;
  followUpDate?: string;

  withdrawalPeriodDays?: number;
  withdrawalEndDate?: string;
  withdrawalStatus?: string;

  recordStatus?: string;

  vetReviewedBy?: string;
  vetReviewedAt?: string;

  managerConfirmedBy?: string;
  managerConfirmedAt?: string;

  notes?: string;
  recordedBy?: string;
  createdAt?: string;

  assignedVetId?: string;
  assignedVetEmail?: string;
  assignedVetName?: string;
  assignedBy?: string;
  assignedAt?: string;
}

export interface HealthRecordRequest {
  cattleId: string;
  examinationDate: string;
  symptoms: string;
  diagnosis: string;

  treatment?: string;
  medicine?: string;
  dosage?: string;

  treatmentStartDate?: string;
  treatmentEndDate?: string;
  followUpDate?: string;

  withdrawalPeriodDays?: number;
  notes?: string;

  assignedVetId?: string;
  assignedVetEmail?: string;
  assignedVetName?: string;
  assignedBy?: string;
  assignedAt?: string;
}

interface ResponseModel<T> {
  success: number;
  data: T;
  message: string;
}

const getHeaders = () => {
  const token = getToken();

  if (!token) {
    throw new Error('Bạn chưa đăng nhập hoặc phiên đăng nhập đã hết hạn!');
  }

  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };
};

// Lấy toàn bộ hồ sơ khám
export const getAllHealthRecordsApi = async (): Promise<HealthRecord[]> => {
  const response = await fetch(API_URL, {
    method: 'GET',
    headers: getHeaders(),
  });

  const result: ResponseModel<HealthRecord[]> = await response.json();

  if (!response.ok || result.success !== 1) {
    throw new Error(result.message || 'Không thể tải danh sách hồ sơ sức khỏe!');
  }

  return result.data;
};

// Lấy lịch sử khám theo bò
export const getHealthRecordsByCattleIdApi = async (
  cattleId: string
): Promise<HealthRecord[]> => {
  const response = await fetch(`${API_URL}/cattle/${cattleId}`, {
    method: 'GET',
    headers: getHeaders(),
  });

  const result: ResponseModel<HealthRecord[]> = await response.json();

  if (!response.ok || result.success !== 1) {
    throw new Error(result.message || 'Không thể tải lịch sử khám của bò!');
  }

  return result.data;
};

// Ghi nhận khám sức khỏe
export const createHealthRecordApi = async (
  data: HealthRecordRequest
): Promise<HealthRecord> => {
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(data),
  });

  const result: ResponseModel<HealthRecord> = await response.json();

  if (!response.ok || result.success !== 1) {
    throw new Error(result.message || 'Không thể lưu hồ sơ khám sức khỏe!');
  }

  return result.data;
};

export interface VeterinaryStaffOption {
  id: string;
  fullName: string;
  email: string;
  department: string;
}

// THÚ Y cập nhật hồ sơ đã được nhân viên chăm sóc ghi nhận
export const updateHealthRecordApi = async (
  id: string,
  data: HealthRecordRequest
): Promise<HealthRecord> => {
  const response = await fetch(`${API_URL}/${id}`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify(data),
  });

  const result: ResponseModel<HealthRecord> = await response.json();

  if (!response.ok || result.success !== 1) {
    throw new Error(result.message || 'Không thể cập nhật hồ sơ sức khỏe!');
  }

  return result.data;
};

// FARM_MANAGER xác nhận tình trạng ngừng thuốc
export const confirmWithdrawalStatusApi = async (
  id: string,
  withdrawalStatus: string
): Promise<HealthRecord> => {
  const response = await fetch(`${API_URL}/${id}/withdrawal-status`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify({ withdrawalStatus }),
  });

  const result: ResponseModel<HealthRecord> = await response.json();

  if (!response.ok || result.success !== 1) {
    throw new Error(result.message || 'Không thể xác nhận tình trạng ngừng thuốc!');
  }

  return result.data;
};

// FARM_MANAGER lấy danh sách nhân viên thú y
export const getAvailableVeterinariansApi = async (): Promise<VeterinaryStaffOption[]> => {
  const response = await fetch(`${API_URL}/veterinarians`, {
    method: 'GET',
    headers: getHeaders(),
  });

  const result: ResponseModel<VeterinaryStaffOption[]> =
    await response.json();

  if (!response.ok || result.success !== 1) {
    throw new Error(result.message || 'Không thể tải danh sách nhân viên thú y!');
  }

  return result.data;
};

// FARM_MANAGER phân công thú y xử lý hồ sơ
export const assignVeterinarianApi = async (
  id: string,
  vetId: string
): Promise<HealthRecord> => {
  const response = await fetch(`${API_URL}/${id}/assign-vet`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify({ vetId }),
  });

  const result: ResponseModel<HealthRecord> = await response.json();

  if (!response.ok || result.success !== 1) {
    throw new Error(result.message || 'Không thể phân công nhân viên thú y!');
  }

  return result.data;
};

// STAFF Thú y lấy các hồ sơ được quản lý phân công
export const getMyAssignedHealthRecordsApi = async (): Promise<HealthRecord[]> => {
  const response = await fetch(`${API_URL}/my-assigned`, {
    method: 'GET',
    headers: getHeaders(),
  });

  const result: ResponseModel<HealthRecord[]> = await response.json();

  if (!response.ok || result.success !== 1) {
    throw new Error(result.message || 'Không thể tải hồ sơ được phân công!');
  }

  return result.data;
};
