
import { DailyDiary } from '../types';

const API_URL = 'http://localhost:8081/api/daily-diaries';

type DailyDiaryRequest = Omit<
  DailyDiary,
  'id' | 'authorName' | 'authorRole' | 'verifiedByManager'
>;

interface DiaryResponse {
  success: number;
  data: DailyDiary;
  message: string;
}

interface DiaryListResponse {
  success: number;
  data: DailyDiary[];
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

// 1. Tạo nhật ký hằng ngày
export const createDailyDiaryApi = async (
  diary: DailyDiaryRequest
): Promise<DailyDiary> => {
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(diary),
  });

  const result: DiaryResponse = await response.json();

  if (!response.ok || result.success !== 1) {
    throw new Error(
      result.message || `Không thể tạo nhật ký. HTTP ${response.status}`
    );
  }

  return result.data;
};

// 2. FARM_MANAGER và ADMIN lấy toàn bộ nhật ký
export const getAllDailyDiariesApi = async (): Promise<DailyDiary[]> => {
  const response = await fetch(API_URL, {
    method: 'GET',
    headers: getAuthHeaders(),
  });

  const result: DiaryListResponse = await response.json();

  if (!response.ok || result.success !== 1) {
    throw new Error(
      result.message || `Không thể lấy danh sách nhật ký. HTTP ${response.status}`
    );
  }

  return result.data || [];
};

// 3. STAFF lấy nhật ký của mình
export const getMyDailyDiariesApi = async (): Promise<DailyDiary[]> => {
  const response = await fetch(`${API_URL}/my-diaries`, {
    method: 'GET',
    headers: getAuthHeaders(),
  });

  const result: DiaryListResponse = await response.json();

  if (!response.ok || result.success !== 1) {
    throw new Error(
      result.message || `Không thể lấy nhật ký cá nhân. HTTP ${response.status}`
    );
  }

  return result.data || [];
};

// 4. Lấy chi tiết nhật ký
export const getDailyDiaryByIdApi = async (
  id: string
): Promise<DailyDiary> => {
  const response = await fetch(`${API_URL}/${encodeURIComponent(id)}`, {
    method: 'GET',
    headers: getAuthHeaders(),
  });

  const result: DiaryResponse = await response.json();

  if (!response.ok || result.success !== 1) {
    throw new Error(
      result.message || `Không thể lấy chi tiết nhật ký. HTTP ${response.status}`
    );
  }

  return result.data;
};

// 5. FARM_MANAGER xác nhận nhật ký
export const verifyDailyDiaryApi = async (
  id: string
): Promise<DailyDiary> => {
  const response = await fetch(
    `${API_URL}/${encodeURIComponent(id)}/verify`,
    {
      method: 'PUT',
      headers: getAuthHeaders(),
    }
  );

  const result: DiaryResponse = await response.json();

  if (!response.ok || result.success !== 1) {
    throw new Error(
      result.message || `Không thể xác nhận nhật ký. HTTP ${response.status}`
    );
  }

  return result.data;
};
