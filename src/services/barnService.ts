
import { Barn } from '../types';

const API_URL = 'http://localhost:8081/api/barns';

interface BarnResponse {
  success: number;
  data: Barn[];
  message: string;
}

export interface BarnCleaningLog {
  id: string;
  barnCode: string;
  barnName: string;
  cleaningDate: string;
  cleaningType: string;
  description?: string;
  cleanedBy: string;
  createdAt: string;
}

export interface BarnCleaningRequest {
  cleaningDate: string;
  cleaningType: string;
  description: string;
}

interface CleaningLogResponse {
  success: number;
  data: BarnCleaningLog[];
  message: string;
}

interface SingleCleaningLogResponse {
  success: number;
  data: BarnCleaningLog;
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

export const getAllBarnsApi = async (): Promise<Barn[]> => {
  const response = await fetch(API_URL, {
    method: 'GET',
    headers: getAuthHeaders(),
  });

  const result: BarnResponse = await response.json();

  if (!response.ok || result.success !== 1) {
    throw new Error(
      result.message || `Không thể lấy danh sách chuồng. HTTP ${response.status}`
    );
  }

  return result.data || [];
};

// Lấy lịch sử vệ sinh của một chuồng
export const getBarnCleaningLogsApi = async (
  barnCode: string
): Promise<BarnCleaningLog[]> => {
  const response = await fetch(
    `${API_URL}/${encodeURIComponent(barnCode)}/cleaning-logs`,
    {
      method: 'GET',
      headers: getAuthHeaders(),
    }
  );

  const result: CleaningLogResponse = await response.json();

  if (!response.ok || result.success !== 1) {
    throw new Error(
      result.message || `Không thể lấy lịch sử vệ sinh. HTTP ${response.status}`
    );
  }

  return result.data || [];
};

// Ghi nhận vệ sinh chuồng
export const createBarnCleaningLogApi = async (
  barnCode: string,
  request: BarnCleaningRequest
): Promise<BarnCleaningLog> => {
  const response = await fetch(
    `${API_URL}/${encodeURIComponent(barnCode)}/cleaning-logs`,
    {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(request),
    }
  );

  const result: SingleCleaningLogResponse = await response.json();

  if (!response.ok || result.success !== 1) {
    throw new Error(
      result.message || `Không thể ghi nhận vệ sinh. HTTP ${response.status}`
    );
  }

  return result.data;
};

export interface CattleTransferRequest {
  toBarnCode: string;
  note?: string;
}

interface CattleTransferResponse {
  success: number;
  data: unknown;
  message: string;
}

// Điều chuyển bò sang chuồng khác
export const transferCattleApi = async (
  cattleId: string,
  request: CattleTransferRequest
): Promise<void> => {
  const response = await fetch(
    `${API_URL}/cattle/${encodeURIComponent(cattleId)}/transfer`,
    {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(request),
    }
  );

  const result: CattleTransferResponse = await response.json();

  if (!response.ok || result.success !== 1) {
    throw new Error(
      result.message || `Không thể điều chuyển bò. HTTP ${response.status}`
    );
  }
};
