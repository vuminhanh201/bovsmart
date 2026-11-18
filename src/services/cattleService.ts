
import { Cattle } from '../types';

const API_URL = 'http://localhost:8081/api/cattle';

interface CattleResponse {
  success: number;
  data: Cattle;
  message: string;
}

interface CattleListResponse {
  success: number;
  data: Cattle[];
  message: string;
}

interface DeleteCattleResponse {
  success: number;
  data: string | null;
  message: string;
}

const getAuthHeaders = () => {
  const token = localStorage.getItem('bovsmart_auth_token');

  if (!token) {
    throw new Error('Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.');
  }

  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };
};

// 1. Lấy danh sách bò
export const getAllCattleApi = async (): Promise<Cattle[]> => {
  const response = await fetch(API_URL, {
    method: 'GET',
    headers: getAuthHeaders(),
  });

  const result: CattleListResponse = await response.json();

  if (!response.ok || result.success !== 1) {
    throw new Error(
      result.message || `Không thể lấy danh sách bò. HTTP ${response.status}`
    );
  }

  return result.data || [];
};

// 2. Thêm hồ sơ bò
export const createCattleApi = async (
  cattle: Partial<Cattle>
): Promise<Cattle> => {
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(cattle),
  });

  const result: CattleResponse = await response.json();

  if (!response.ok || result.success !== 1) {
    throw new Error(
      result.message || `Không thể thêm hồ sơ bò. HTTP ${response.status}`
    );
  }

  return result.data;
};

// 3. Cập nhật hồ sơ bò
export const updateCattleApi = async (
  id: string,
  cattle: Partial<Cattle>
): Promise<Cattle> => {
  const response = await fetch(`${API_URL}/${encodeURIComponent(id)}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(cattle),
  });

  const result: CattleResponse = await response.json();

  if (!response.ok || result.success !== 1) {
    throw new Error(
      result.message || `Không thể cập nhật hồ sơ bò. HTTP ${response.status}`
    );
  }

  return result.data;
};

// 4. Xóa hồ sơ bò
export const deleteCattleApi = async (id: string): Promise<void> => {
  const response = await fetch(`${API_URL}/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });

  const result: DeleteCattleResponse = await response.json();

  if (!response.ok || result.success !== 1) {
    throw new Error(
      result.message || `Không thể xóa hồ sơ bò. HTTP ${response.status}`
    );
  }
};

// 5. Kiểm tra điều kiện xuất bán
export interface SaleEligibilityResponse {
  cattleId: string;
  rfidTag: string;
  earTagNumber: string;
  cattleName: string;
  status: string;
  currentWeight: number;
  targetMarketWeight: number;
  statusEligible: boolean;
  weightEligible: boolean;
  withdrawalEligible: boolean;
  eligible: boolean;
  withdrawalEndDate: string | null;
  withdrawalStatus: string;
  message: string;
}

interface SaleEligibilityApiResponse {
  success: number;
  data: SaleEligibilityResponse;
  message: string;
}

export const getCattleSaleEligibilityApi = async (
  cattleId: string
): Promise<SaleEligibilityResponse> => {
  const response = await fetch(
    `${API_URL}/${encodeURIComponent(cattleId)}/sale-eligibility`,
    {
      method: 'GET',
      headers: getAuthHeaders(),
    }
  );

  const result: SaleEligibilityApiResponse = await response.json();

  if (!response.ok || result.success !== 1) {
    throw new Error(
      result.message ||
        `Không thể kiểm tra điều kiện xuất bán. HTTP ${response.status}`
    );
  }

  return result.data;
};

// 6. Ghi nhận lịch sử cân nặng
export interface RecordCattleWeightRequest {
  weight: number;
  note?: string;
  method?: 'RFID_AUTO_SCALE' | 'MANUAL';
  source?: 'SIMULATED' | 'MANUAL';
}

export const recordCattleWeightApi = async (
  cattleId: string,
  data: RecordCattleWeightRequest
): Promise<Cattle> => {
  const response = await fetch(
    `${API_URL}/${encodeURIComponent(cattleId)}/weight-history`,
    {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    }
  );

  const result: CattleResponse = await response.json();

  if (!response.ok || result.success !== 1) {
    throw new Error(
      result.message ||
        `Không thể lưu lịch sử cân nặng. HTTP ${response.status}`
    );
  }

  return result.data;
};


// 7. Kiểu dữ liệu truy xuất nguồn gốc công khai
export interface PublicCattleTrace {
  id: string;
  name?: string;
  earTagNumber?: string;
  breed?: string;
  gender?: string;
  origin?: string;
  entryDate?: string;
  weight?: number;
  status?: string;
  weightHistory?: {
    date?: string;
    weight?: number;
  }[];
}

// 8. Lấy thông tin truy xuất công khai bằng QR
export const getPublicCattleTraceApi = async (
  cattleId: string
): Promise<PublicCattleTrace> => {
  const response = await fetch(
    `http://localhost:8081/api/public/trace/${encodeURIComponent(cattleId)}`,
    { method: 'GET' }
  );

  const result = await response.json();

  if (!response.ok || result.success !== 1 || !result.data) {
    throw new Error(
      result.message ||
        `Không thể lấy thông tin truy xuất. HTTP ${response.status}`
    );
  }

  return result.data as PublicCattleTrace;
};


export interface PublicVaccinationRecord {
  vaccineName?: string;
  vaccineType?: string;
  vaccinationDate?: string;
  nextVaccinationDate?: string;
  batchNumber?: string;
  manufacturer?: string;
}

export const getPublicCattleVaccinationsApi = async (
  cattleId: string
): Promise<PublicVaccinationRecord[]> => {
  const response = await fetch(
    `http://localhost:8081/api/public/trace/${encodeURIComponent(cattleId)}/vaccinations`,
    { method: 'GET' }
  );

  const result = await response.json();

  if (!response.ok || result.success !== 1) {
    throw new Error(
      result.message || `Không thể lấy lịch sử tiêm phòng. HTTP ${response.status}`
    );
  }

  return result.data || [];
};

export interface PublicHealthRecord {
  examinationDate?: string;
  diagnosis?: string;
  treatment?: string;
  medicine?: string;
  treatmentStartDate?: string;
  treatmentEndDate?: string;
  followUpDate?: string;
  withdrawalPeriodDays?: number;
  withdrawalEndDate?: string;
  withdrawalStatus?: string;
  recordStatus?: string;
  vetReviewedAt?: string;
  managerConfirmedAt?: string;
}

export const getPublicCattleHealthApi = async (
  cattleId: string
): Promise<PublicHealthRecord[]> => {
  const response = await fetch(
    `http://localhost:8081/api/public/trace/${encodeURIComponent(cattleId)}/health`,
    { method: 'GET' }
  );

  const result = await response.json();

  if (!response.ok || result.success !== 1) {
    throw new Error(result.message || 'Không thể tải lịch sử sức khỏe của bò');
  }

  return result.data || [];
};


