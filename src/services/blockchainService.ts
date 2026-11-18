
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

interface BlockchainListResponse {
  success: number;
  data: BlockchainBlock[];
  message: string;
}

interface BlockchainBlockResponse {
  success: number;
  data: BlockchainBlock;
  message: string;
}

interface BlockchainVerifyResponse {
  success: number;
  data: boolean;
  message: string;
}

const API_URL = 'http://localhost:8081/api/blockchain';

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

// Lấy danh sách khối Blockchain
export const getBlockchainBlocksApi = async (): Promise<BlockchainBlock[]> => {
  const response = await fetch(`${API_URL}/blocks`, {
    method: 'GET',
    headers: getAuthHeaders(),
  });

  const result: BlockchainListResponse = await response.json();

  if (!response.ok || result.success !== 1) {
    throw new Error(result.message || `Không thể lấy sổ cái. HTTP ${response.status}`);
  }

  return result.data || [];
};

// Tạo khối Blockchain mới
export const createBlockchainBlockApi = async (
  action: string,
  data: Record<string, unknown>
): Promise<BlockchainBlock> => {
  const response = await fetch(`${API_URL}/blocks`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ action, data }),
  });

  const result: BlockchainBlockResponse = await response.json();

  if (!response.ok || result.success !== 1) {
    throw new Error(result.message || `Không thể tạo khối. HTTP ${response.status}`);
  }

  return result.data;
};

// Kiểm tra tính toàn vẹn chuỗi
export const verifyBlockchainApi = async (): Promise<boolean> => {
  const response = await fetch(`${API_URL}/verify`, {
    method: 'GET',
    headers: getAuthHeaders(),
  });

  const result: BlockchainVerifyResponse = await response.json();

  if (!response.ok || result.success !== 1) {
    throw new Error(result.message || `Không thể kiểm tra chuỗi. HTTP ${response.status}`);
  }

  return result.data;
};
