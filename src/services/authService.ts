
import { User } from '../types';

const API_URL = '/api/auth';

export interface LoginResponse {
  success: number;
  data: {
    accessToken: string;
    refreshToken: string;
    tokenType: string;
    id: string;
    username: string;
    email: string;
    roles: string[];
    avatar: string | null;
    fullName: string | null;
    phone: string | null;
    department: string | null;
    assignedBarns: string[];
  };
  message: string;
}

export const loginApi = async (
  email: string,
  password: string
): Promise<LoginResponse> => {
  const response = await fetch(`${API_URL}/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: email,
      password,
    }),
  });

  const responseText = await response.text();

  let result: any;

  try {
    result = JSON.parse(responseText);
  } catch {
    throw new Error(
      `Server không trả về JSON. HTTP ${response.status}: ${responseText}`
    );
  }

  console.log('HTTP STATUS:', response.status);
  console.log('LOGIN RESPONSE:', result);

  if (!response.ok || result.success !== 1) {
    throw new Error(
      result.message || `Đăng nhập thất bại. HTTP ${response.status}`
    );
  }

  if (!result.data?.accessToken) {
    throw new Error('Backend không trả về accessToken.');
  }

  return result as LoginResponse;
};

export interface ProfileResponse {
  id: string;
  username: string;
  email: string;
  roles: string[];
  createdAt: string;
  avatar: string | null;
  fullName: string | null;
  phone: string | null;
  department: string | null;
}


export const updateProfileApi = async (
  username: string,
  email: string,
  avatar: string | null,
  fullName: string,
  phone: string,
  department: string
): Promise<ProfileResponse> => {
  const token = localStorage.getItem('bovsmart_auth_token');

  if (!token) {
    throw new Error('Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.');
  }

  const response = await fetch(`${API_URL}/profile`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      username,
      email,
      avatar,
      fullName,
      phone,
      department,
    }),
  });

  const result = await response.json();

  if (!response.ok || result.success !== 1) {
    throw new Error(result.message || 'Không thể cập nhật hồ sơ.');
  }

  return result.data as ProfileResponse;
};

// ===============================
// ĐỔI MẬT KHẨU
// ===============================

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export const changePasswordApi = async (
  data: ChangePasswordRequest
): Promise<void> => {
  const token = localStorage.getItem('bovsmart_auth_token');

  if (!token) {
    throw new Error('Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.');
  }

  const response = await fetch(`${API_URL}/change-password`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });

  const responseText = await response.text();

  let result: any;

  try {
    result = JSON.parse(responseText);
  } catch {
    throw new Error(
      `Server không trả về JSON. HTTP ${response.status}: ${responseText}`
    );
  }

  if (!response.ok || result.success !== 1) {
    throw new Error(
      result.message || `Đổi mật khẩu thất bại. HTTP ${response.status}`
    );
  }
};



// ===============================
// QUẢN LÝ TÀI KHOẢN NHÂN SỰ
// ===============================

export interface AccountResponse {
  id: string;
  username: string;
  fullName: string;
  email: string;
  phone: string;
  roles: string[];
  department: string;
  assignedBarns: string[];
  enabled: boolean;
  avatar: string | null;
}

export interface CreateAccountRequest {
  fullName: string;
  email: string;
  phone: string;
  role: User['role'];
  department: string;
  assignedBarns: string[];
  enabled: boolean;
  password: string;
  avatar?: string | null;
}

// Chuyển dữ liệu tài khoản backend thành User frontend
const mapAccountToUser = (account: AccountResponse): User => {
  const backendRole = account.roles?.[0] || '';

  let role: User['role'];

  if (backendRole === 'ROLE_ADMIN' || backendRole === 'ADMIN') {
    role = 'ADMIN';
  } else if (
    backendRole === 'ROLE_FARM_MANAGER' ||
    backendRole === 'FARM_MANAGER'
  ) {
    role = 'FARM_MANAGER';
  } else if (backendRole === 'ROLE_STAFF' || backendRole === 'STAFF') {
    role = 'STAFF';
  } else {
    throw new Error(`Tài khoản ${account.email} chưa có quyền hợp lệ.`);
  }

  return {
    id: account.id,
    username: account.username,
    name: account.fullName || account.username,
    email: account.email,
    avatar: account.avatar || '',
    role,
    phone: account.phone || '',
    department: account.department || '',
    status: account.enabled ? 'ACTIVE' : 'INACTIVE',
    lastLogin: 'Chưa có thông tin',
    assignedPens: account.assignedBarns || [],
  };
};

// Hàm gọi API dùng chung cho quản lý tài khoản
const accountRequest = async <T>(
  endpoint: string,
  method: string = 'GET',
  body?: unknown
): Promise<T> => {
  const token = localStorage.getItem('bovsmart_auth_token');

  if (!token) {
    throw new Error('Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.');
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    ...(body !== undefined
      ? { body: JSON.stringify(body) }
      : {}),
  });

  const responseText = await response.text();

  let result: any;

  try {
    result = JSON.parse(responseText);
  } catch {
    throw new Error(
      `Server không trả về JSON. HTTP ${response.status}: ${responseText}`
    );
  }

  if (!response.ok || result.success !== 1) {
    throw new Error(
      result.message || `Yêu cầu thất bại. HTTP ${response.status}`
    );
  }

  return result.data as T;
};

// Lấy danh sách tài khoản
export const getAccountsApi = async (): Promise<User[]> => {
  const accounts = await accountRequest<AccountResponse[]>(
    '/accounts'
  );

  return accounts.map(mapAccountToUser);
};

// Tạo tài khoản
export const createAccountApi = async (
  data: CreateAccountRequest
): Promise<User> => {
  const account = await accountRequest<AccountResponse>(
    '/accounts',
    'POST',
    data
  );

  return mapAccountToUser(account);
};

// Cập nhật tài khoản

// Cập nhật tài khoản
export const updateAccountApi = async (
  userId: string,
  data: Omit<CreateAccountRequest, 'password'> & {
    password?: string;
  }
): Promise<User> => {
  const requestData = { ...data };

  // Backend update hiện tại không hỗ trợ đổi mật khẩu
  delete (requestData as Partial<CreateAccountRequest>).password;

  const account = await accountRequest<AccountResponse | null>(
    `/accounts/${encodeURIComponent(userId)}`,
    'PUT',
    requestData
  );

  // Trường hợp backend có trả về dữ liệu tài khoản
  if (account) {
    return mapAccountToUser(account);
  }

  // Trường hợp backend trả data: null,
  // tải lại danh sách để lấy tài khoản vừa cập nhật
  const users = await getAccountsApi();

  const updatedUser = users.find(
    (user) => user.id === userId
  );

  if (!updatedUser) {
    throw new Error(
      'Cập nhật thành công nhưng không tìm thấy tài khoản trong danh sách.'
    );
  }

  return updatedUser;
};


// Khóa tài khoản
export const lockAccountApi = async (
  userId: string
): Promise<void> => {
  await accountRequest<unknown>(
    `/accounts/${encodeURIComponent(userId)}/lock`,
    'PUT'
  );
};

// Mở khóa tài khoản
export const unlockAccountApi = async (
  userId: string
): Promise<void> => {
  await accountRequest<unknown>(
    `/accounts/${encodeURIComponent(userId)}/unlock`,
    'PUT'
  );
};

// Lấy danh sách nhân viên đang hoạt động để phân công
export const getStaffOptionsApi = async (): Promise<AccountResponse[]> => {
  return accountRequest<AccountResponse[]>('/staff-options');
};

