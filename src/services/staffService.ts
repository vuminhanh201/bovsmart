
const API_URL = 'http://localhost:8081/api/auth/staff-options';

const getToken = () => localStorage.getItem('bovsmart_auth_token');

export interface StaffOption {
  id: string;
  username?: string;
  fullName?: string;
  email: string;
  department?: string;
  enabled?: boolean;
}

export const getVeterinarianOptionsApi = async (): Promise<StaffOption[]> => {
  const token = getToken();

  if (!token) {
    throw new Error('Vui lòng đăng nhập lại!');
  }

  const response = await fetch(API_URL, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  const result = await response.json();

  if (!response.ok || result.success === 0) {
    throw new Error(
      result.message || 'Không thể tải danh sách nhân viên Thú y!'
    );
  }

  return result.data || [];
};
