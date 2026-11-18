
const FEED_API_URL = '/api/feeds';
const CATEGORY_API_URL = '/api/feed-categories';
const TRANSACTION_API_URL = '/api/feed-transactions';

export interface BackendFeed {
  id: string;
  feedCode: string;
  feedName: string;
  categoryId: string;
  categoryName: string;
  unit: string;
  quantity: number;
  minStock: number;
  unitPrice: number;
  description?: string;
  status: string;
}

export interface BackendFeedCategory {
  id: string;
  categoryName: string;
  description?: string;
  status: string;
}

export interface BackendFeedTransaction {
  id: string;
  feedId: string;
  feedCode: string;
  feedName: string;
  transactionType: 'IMPORT' | 'EXPORT';
  quantity: number;
  unit: string;
  unitPrice?: number;
  totalAmount?: number;
  note?: string;
  createdBy: string;
  reviewedBy?: string;
  transactionStatus: 'PENDING' | 'APPROVED' | 'REJECTED';
  reviewNote?: string;
  transactionDate: string;
  reviewedAt?: string;
}

export interface CreateFeedRequest {
  feedCode: string;
  feedName: string;
  categoryId: string;
  unit: string;
  quantity: number;
  minStock: number;
  unitPrice: number;
  description?: string;
  status?: string;
}

export interface CreateFeedTransactionRequest {
  feedId: string;
  transactionType: 'IMPORT' | 'EXPORT';
  quantity: number;
  unitPrice?: number;
  note?: string;
}

interface ApiResponse<T> {
  success: number;
  data: T;
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

const handleApiResponse = async <T>(
  response: Response,
  defaultMessage: string,
): Promise<T> => {
  let result: ApiResponse<T>;

  try {
    result = await response.json();
  } catch {
    throw new Error(defaultMessage);
  }

  if (!response.ok || result.success !== 1) {
    throw new Error(result.message || `${defaultMessage} (HTTP ${response.status})`);
  }

  return result.data;
};

// ==================== DANH MỤC THỨC ĂN ====================

export const getAllFeedCategoriesApi = async (): Promise<BackendFeedCategory[]> => {
  const response = await fetch(CATEGORY_API_URL, {
    method: 'GET',
    headers: getAuthHeaders(),
  });

  return handleApiResponse(
    response,
    'Không thể tải danh mục thức ăn.',
  );
};

// ==================== THỨC ĂN ====================

export const getAllFeedsApi = async (): Promise<BackendFeed[]> => {
  const response = await fetch(FEED_API_URL, {
    method: 'GET',
    headers: getAuthHeaders(),
  });

  return handleApiResponse(
    response,
    'Không thể tải danh sách thức ăn.',
  );
};

export const createFeedApi = async (
  request: CreateFeedRequest,
): Promise<BackendFeed> => {
  const response = await fetch(FEED_API_URL, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(request),
  });

  return handleApiResponse(
    response,
    'Không thể tạo thức ăn mới.',
  );
};

// ==================== PHIẾU NHẬP / XUẤT ====================

export const createFeedTransactionApi = async (
  request: CreateFeedTransactionRequest,
): Promise<BackendFeedTransaction> => {
  const response = await fetch(TRANSACTION_API_URL, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(request),
  });

  return handleApiResponse(
    response,
    'Không thể tạo phiếu nhập/xuất thức ăn.',
  );
};

export const getAllFeedTransactionsApi = async (): Promise<BackendFeedTransaction[]> => {
  const response = await fetch(TRANSACTION_API_URL, {
    method: 'GET',
    headers: getAuthHeaders(),
  });

  return handleApiResponse(
    response,
    'Không thể tải lịch sử nhập/xuất thức ăn.',
  );
};

export const approveFeedTransactionApi = async (
  id: string,
  reviewNote?: string,
): Promise<BackendFeedTransaction> => {
  const params = new URLSearchParams();

  if (reviewNote) {
    params.set('reviewNote', reviewNote);
  }

  const query = params.toString();
  const url = `${TRANSACTION_API_URL}/${id}/approve${query ? `?${query}` : ''}`;

  const response = await fetch(url, {
    method: 'PUT',
    headers: getAuthHeaders(),
  });

  return handleApiResponse(
    response,
    'Không thể duyệt phiếu nhập/xuất.',
  );
};

export const rejectFeedTransactionApi = async (
  id: string,
  reviewNote?: string,
): Promise<BackendFeedTransaction> => {
  const params = new URLSearchParams();

  if (reviewNote) {
    params.set('reviewNote', reviewNote);
  }

  const query = params.toString();
  const url = `${TRANSACTION_API_URL}/${id}/reject${query ? `?${query}` : ''}`;

  const response = await fetch(url, {
    method: 'PUT',
    headers: getAuthHeaders(),
  });

  return handleApiResponse(
    response,
    'Không thể từ chối phiếu nhập/xuất.',
  );
};
