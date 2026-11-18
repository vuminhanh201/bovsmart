
const API_URL = '/api/sales-orders';

export interface SalesOrderCattle {
  cattleId: string;
  earTagNumber: string;
  cattleName: string;
  weightAtSale: number;
}

export interface SalesOrder {
  id: string;
  orderCode: string;
  cattleId: string;
  earTagNumber: string;
  cattleName: string;
  cattleDetails: SalesOrderCattle[];
  buyerName: string;
  buyerPhone?: string;
  buyerAddress?: string;
  saleDate: string;
  weightAtSale: number;
  totalWeight: number;
  pricePerKg: number;
  totalAmount: number;
  status: string;
  createdBy: string;
  approvedBy?: string;
  approvedAt?: string;
  rejectedBy?: string;
  rejectedAt?: string;
  rejectionReason?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSalesOrderRequest {
  cattleIds: string[];
  buyerName: string;
  buyerPhone?: string;
  buyerAddress?: string;
  saleDate: string;
  pricePerKg: number;
  notes?: string;
}

interface ApiResponse<T> {
  success: number;
  data: T;
  message: string;
}

const getHeaders = (): HeadersInit => {
  const token = localStorage.getItem('bovsmart_auth_token');

  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

const handleResponse = async <T>(
  response: Response
): Promise<T> => {
  let result: ApiResponse<T>;

  try {
    result = await response.json();
  } catch {
    throw new Error(`Lỗi phản hồi từ máy chủ. HTTP ${response.status}`);
  }

  if (!response.ok || result.success !== 1) {
    throw new Error(
      result.message || `Yêu cầu thất bại. HTTP ${response.status}`
    );
  }

  return result.data;
};

// Lấy danh sách phiếu xuất bán
export const getAllSalesOrdersApi = async (): Promise<SalesOrder[]> => {
  const response = await fetch(API_URL, {
    method: 'GET',
    headers: getHeaders(),
  });

  return handleResponse<SalesOrder[]>(response);
};

// Lấy chi tiết phiếu xuất bán
export const getSalesOrderByIdApi = async (
  id: string
): Promise<SalesOrder> => {
  const response = await fetch(`${API_URL}/${encodeURIComponent(id)}`, {
    method: 'GET',
    headers: getHeaders(),
  });

  return handleResponse<SalesOrder>(response);
};

// Lấy lịch sử xuất bán của bò
export const getSalesOrdersByCattleIdApi = async (
  cattleId: string
): Promise<SalesOrder[]> => {
  const response = await fetch(
    `${API_URL}/cattle/${encodeURIComponent(cattleId)}`,
    {
      method: 'GET',
      headers: getHeaders(),
    }
  );

  return handleResponse<SalesOrder[]>(response);
};

// Lập phiếu xuất bán
export const createSalesOrderApi = async (
  request: CreateSalesOrderRequest
): Promise<SalesOrder> => {
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(request),
  });

  return handleResponse<SalesOrder>(response);
};

// Phê duyệt phiếu xuất bán
export const approveSalesOrderApi = async (
  id: string
): Promise<SalesOrder> => {
  const response = await fetch(
    `${API_URL}/${encodeURIComponent(id)}/approve`,
    {
      method: 'PUT',
      headers: getHeaders(),
    }
  );

  return handleResponse<SalesOrder>(response);
};

// Từ chối phiếu xuất bán
export const rejectSalesOrderApi = async (
  id: string,
  reason: string
): Promise<SalesOrder> => {
  const response = await fetch(
    `${API_URL}/${encodeURIComponent(id)}/reject`,
    {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify({ reason }),
    }
  );

  return handleResponse<SalesOrder>(response);
};
