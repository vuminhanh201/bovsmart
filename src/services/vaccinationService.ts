
const API_URL = 'http://localhost:8081/api/vaccinations';

const getToken = () => localStorage.getItem('bovsmart_auth_token');

export interface VaccinationRecordRequest {
  cattleId: string;
  vaccineName: string;
  vaccineType?: string;
  dosage: string;
  vaccinationDate: string;
  nextVaccinationDate?: string;
  batchNumber?: string;
  manufacturer?: string;
  notes?: string;
}

export interface VaccinationRecord {
  id: string;
  cattleId: string;
  vaccineName: string;
  vaccineType?: string;
  dosage: string;
  vaccinationDate: string;
  nextVaccinationDate?: string;
  batchNumber?: string;
  manufacturer?: string;
  administeredBy?: string;
  notes?: string;
  createdAt?: string;
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

  const result: ApiResponse<T> = await response.json();

  if (!response.ok || result.success === 0) {
    throw new Error(
      result.message || 'Không thể lưu hồ sơ tiêm phòng.'
    );
  }

  return result.data;
};

// STAFF phòng Thú y hoặc FARM_MANAGER ghi nhận tiêm thực tế
export const createVaccinationRecordApi = (
  data: VaccinationRecordRequest
): Promise<VaccinationRecord> => {
  return request<VaccinationRecord>(API_URL, {
    method: 'POST',
    body: JSON.stringify(data),
  });
};

// Lấy hồ sơ tiêm phòng theo từng con bò
export const getVaccinationRecordsByCattleApi = (
  cattleId: string
): Promise<VaccinationRecord[]> => {
  return request<VaccinationRecord[]>(
    `${API_URL}/cattle/${encodeURIComponent(cattleId)}`
  );
};
