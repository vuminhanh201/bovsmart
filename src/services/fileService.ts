
const API_URL = 'http://localhost:8081/api/files';

const getAuthToken = (): string => {
  const token = localStorage.getItem('bovsmart_auth_token');

  if (!token) {
    throw new Error('Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.');
  }

  return token;
};

export interface FileUploadResponse {
  id: string;
  originalName: string;
  contentType: string;
  fileSize: number;
  message: string;
}

export interface FileUrlResponse {
  id: string;
  url: string;
  expiresInSeconds: number;
}

interface ApiResponse<T> {
  success: number;
  data: T;
  message: string;
}

// 1. Upload ảnh bò lên MinIO
export const uploadCattleImageApi = async (
  file: File
): Promise<FileUploadResponse> => {
  const token = getAuthToken();

  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${API_URL}/upload/image`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  const result: ApiResponse<FileUploadResponse> = await response.json();

  if (!response.ok || result.success !== 1) {
    throw new Error(
      result.message || `Không thể tải ảnh lên. HTTP ${response.status}`
    );
  }

  return result.data;
};

// 2. Lấy URL xem ảnh bò
export const getCattleImageUrlApi = async (
  fileId: string
): Promise<FileUrlResponse> => {
  const token = getAuthToken();

  const response = await fetch(`${API_URL}/${fileId}/url`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const result: ApiResponse<FileUrlResponse> = await response.json();

  if (!response.ok || result.success !== 1) {
    throw new Error(
      result.message || `Không thể lấy URL ảnh. HTTP ${response.status}`
    );
  }

  return result.data;
};

// 3. Lấy danh sách ảnh của người đăng nhập
export const getMyCattleImagesApi = async (): Promise<FileUploadResponse[]> => {
  const token = getAuthToken();

  const response = await fetch(`${API_URL}/my-images`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const result: ApiResponse<FileUploadResponse[]> = await response.json();

  if (!response.ok || result.success !== 1) {
    throw new Error(
      result.message || `Không thể lấy danh sách ảnh. HTTP ${response.status}`
    );
  }

  return result.data || [];
};
