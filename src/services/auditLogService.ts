
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

interface AuditLogListResponse {
  success: number;
  data: BackendAuditLog[];
  message: string;
}

const API_URL = 'http://localhost:8081/api/audit-logs';

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

// Lấy danh sách nhật ký thao tác từ MongoDB
export const getAllAuditLogsApi = async (): Promise<BackendAuditLog[]> => {
  const response = await fetch(API_URL, {
    method: 'GET',
    headers: getAuthHeaders(),
  });

  const result: AuditLogListResponse = await response.json();

  if (!response.ok || result.success !== 1) {
    throw new Error(
      result.message ||
        `Không thể lấy nhật ký thao tác. HTTP ${response.status}`
    );
  }

  return result.data || [];
};
