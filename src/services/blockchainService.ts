
export interface BlockchainBlock {
  id: string;
  index: number;
  timestamp: string;
  action: string;
  data: Record<string, unknown>;
  operator: string;
  role: string;
  previousHash: string;
  hash: string;
}

interface ApiResponse<T> {
  success: boolean | number;
  data: T;
  message: string;
}

const API_URL = '/api/blockchain';

const getAuthHeaders = (): HeadersInit => {
  const token = localStorage.getItem('bovsmart_auth_token');

  if (!token) {
    throw new Error('Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.');
  }

  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };
};

const handleResponse = async <T>(
  response: Response
): Promise<ApiResponse<T>> => {
  const result = await response.json();

  if (!response.ok) {
    throw new Error(
      result.message || `Yêu cầu Blockchain thất bại. HTTP ${response.status}`
    );
  }

  if (
    result.success !== true &&
    result.success !== 1
  ) {
    throw new Error(result.message || 'API Blockchain trả về kết quả không hợp lệ.');
  }

  return result as ApiResponse<T>;
};

// Lấy danh sách block từ Spring Boot
export const getBlockchainBlocksApi = async (): Promise<BlockchainBlock[]> => {
  const response = await fetch(`${API_URL}/blocks`, {
    method: 'GET',
    headers: getAuthHeaders(),
  });

  const result = await handleResponse<BlockchainBlock[]>(response);

  if (!Array.isArray(result.data)) {
    throw new Error('Dữ liệu danh sách Blockchain không đúng định dạng.');
  }

  return result.data;
};

// Kiểm tra tính toàn vẹn chuỗi
export const verifyBlockchainApi = async (): Promise<boolean> => {
  const response = await fetch(`${API_URL}/verify`, {
    method: 'GET',
    headers: getAuthHeaders(),
  });

  const result = await handleResponse<boolean>(response);

  return result.data;
};

// Tạo block - giữ export để các file đang sử dụng không bị lỗi
export const createBlockchainBlockApi = async (
  action: string,
  data: Record<string, unknown>
): Promise<BlockchainBlock> => {
  const response = await fetch(`${API_URL}/blocks`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ action, data }),
  });

  const result = await handleResponse<BlockchainBlock>(response);

  return result.data;
};
