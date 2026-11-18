import { create } from 'zustand';
import { User, UserRole } from '../types';
import {
  loginApi,
  getAccountsApi,
  createAccountApi,
  updateAccountApi,
  lockAccountApi,
  unlockAccountApi,
  changePasswordApi,
  CreateAccountRequest,
} from '../services/authService';

interface AuthState {
  currentUser: User;
  users: User[];
  isAuthenticated: boolean;
  token: string | null;
  failedLoginAttempts: number;
  lockoutUntil: number | null;

  login: (
    email: string,
    role?: UserRole,
    password?: string
  ) => Promise<{ success: boolean; message?: string }>;

  logout: () => void;
  switchRole: (newRole: UserRole) => void;
  updateProfile: (updatedData: Partial<User>) => void;

  changePassword: (
    oldPass: string,
    newPass: string,
    confirmPass: string
  ) => Promise<{ success: boolean; message: string }>;

 loadUsers: () => Promise<void>;
  addUser: (user: CreateAccountRequest) => Promise<void>;
  updateUser: (
    id: string,
    user: Omit<CreateAccountRequest, 'password'> & { password?: string }
  ) => Promise<void>;
  deleteUser: (id: string) => Promise<void>;
  unlockUser: (id: string) => Promise<void>;
  }

const STORAGE_KEY_TOKEN = 'bovsmart_auth_token';
const STORAGE_KEY_USER = 'bovsmart_auth_user';

const EMPTY_USER: User = {
  id: '',
  username: '',
  name: '',
  email: '',
  avatar: '',
  role: 'STAFF',
  phone: '',
  department: '',
  status: 'INACTIVE',
  lastLogin: '',
};

// Không tự đăng nhập khi mở ứng dụng.
// Người dùng phải đăng nhập lại qua backend.
const loadInitialAuth = (): {
  user: User;
  isAuthenticated: boolean;
  token: string | null;
} => {
  return {
    user: EMPTY_USER,
    isAuthenticated: false,
    token: null,
  };
};

const initialAuth = loadInitialAuth();

export const useAuthStore = create<AuthState>((set) => ({
  currentUser: initialAuth.user,
  users: [],
  isAuthenticated: initialAuth.isAuthenticated,
  token: initialAuth.token,
  failedLoginAttempts: 0,
  lockoutUntil: null,

  // Đăng nhập bằng Spring Boot
  login: async (email, role, password) => {
    try {
      if (!email || !password) {
        return {
          success: false,
          message: 'Vui lòng nhập email và mật khẩu.',
        };
      }

      // Gọi API backend
      const result = await loginApi(email, password);

      const data = result.data;

      // Lấy quyền từ backend
      const backendRole = data.roles?.[0] || '';

      let userRole: UserRole;

      if (backendRole === 'ROLE_ADMIN') {
        userRole = 'ADMIN';
      } else if (backendRole === 'ROLE_FARM_MANAGER') {
        userRole = 'FARM_MANAGER';
      } else if (backendRole === 'ROLE_STAFF') {
        userRole = 'STAFF';
      } else {
        throw new Error('Tài khoản chưa được phân quyền hợp lệ.');
      }

      // Tạo thông tin người dùng từ backend
      const loggedUser: User = {
        id: data.id,
        username: data.username,
        name: data.fullName || data.username,
        email: data.email,
        avatar: data.avatar || '',
        role: userRole,
        phone: data.phone || '',
        department: data.department || '',
        assignedPens: data.assignedBarns || [],
        status: 'ACTIVE',
        lastLogin: new Date().toLocaleString('vi-VN'),
      };

      // Lưu token thật từ backend
      localStorage.setItem(
        STORAGE_KEY_TOKEN,
        data.accessToken
      );

      localStorage.setItem(
        STORAGE_KEY_USER,
        JSON.stringify(loggedUser)
      );

      // Cập nhật trạng thái đăng nhập
      set({
        currentUser: loggedUser,
        isAuthenticated: true,
        token: data.accessToken,
        failedLoginAttempts: 0,
        lockoutUntil: null,
      });

      return {
        success: true,
        message: result.message || 'Đăng nhập thành công.',
      };
    } catch (error) {
      // Đảm bảo đăng nhập thất bại thì không được vào Dashboard
      localStorage.removeItem(STORAGE_KEY_TOKEN);
      localStorage.removeItem(STORAGE_KEY_USER);

      set({
        isAuthenticated: false,
        token: null,
        currentUser:EMPTY_USER,
      });

      return {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : 'Không thể kết nối máy chủ đăng nhập.',
      };
    }
  },

  // Đăng xuất
  logout: () => {
    try {
      localStorage.removeItem(STORAGE_KEY_TOKEN);
      localStorage.removeItem(STORAGE_KEY_USER);
      sessionStorage.clear();
    } catch (error) {
      console.warn('Không thể xóa phiên đăng nhập:', error);
    }

    set({
      isAuthenticated: false,
      token: null,
      currentUser: EMPTY_USER,
      failedLoginAttempts: 0,
      lockoutUntil: null,
    });
  },

  // Không cho phép tự đổi quyền đăng nhập
  switchRole: (newRole: UserRole) => {
    console.warn(
      'Không thể tự thay đổi quyền. Quyền phải được cấp từ backend.'
    );
  },

  // Cập nhật hồ sơ cá nhân
  updateProfile: (updatedData: Partial<User>) => {
    set((state) => {
      const updatedUser = {
        ...state.currentUser,
        ...updatedData,
      };

      try {
        if (state.isAuthenticated) {
          localStorage.setItem(
            STORAGE_KEY_USER,
            JSON.stringify(updatedUser)
          );
        }
      } catch (error) {
        console.warn('Không thể lưu hồ sơ:', error);
      }

      return {
        currentUser: updatedUser,
        users: state.users.map((user) =>
          user.id === updatedUser.id ? updatedUser : user
        ),
      };
    });
  },

  // Đổi mật khẩu
  changePassword: async (
    oldPass: string,
    newPass: string,
    confirmPass: string
  ) => {
    if (!oldPass) {
      return {
        success: false,
        message: 'Vui lòng nhập mật khẩu hiện tại.',
      };
    }

    if (newPass.length < 6) {
      return {
        success: false,
        message: 'Mật khẩu mới phải có ít nhất 6 ký tự.',
      };
    }

    if (newPass !== confirmPass) {
      return {
        success: false,
        message: 'Xác nhận mật khẩu không trùng khớp.',
      };
    }

    try {
      await changePasswordApi({
        currentPassword: oldPass,
        newPassword: newPass,
        confirmPassword: confirmPass,
      });

      return {
        success: true,
        message: 'Đổi mật khẩu thành công.',
      };
    } catch (error) {
      return {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : 'Đổi mật khẩu thất bại.',
      };
    }
  },

  
  // Lấy danh sách nhân sự từ backend
  loadUsers: async () => {
    try {
      const users = await getAccountsApi();
      set({ users });
    } catch (error) {
      throw error;
    }
  },

  // Thêm nhân sự
  addUser: async (userData) => {
    const newUser = await createAccountApi(userData);

    set((state) => ({
      users: [...state.users, newUser],
    }));
  },

  // Cập nhật nhân sự
  updateUser: async (id, data) => {
    const updatedUser = await updateAccountApi(id, data);

    set((state) => {
      const updatedUsers = state.users.map((user) =>
        user.id === id ? updatedUser : user
      );

      const updatedCurrent =
        state.currentUser.id === id
          ? { ...state.currentUser, ...updatedUser }
          : state.currentUser;

      if (state.isAuthenticated && updatedCurrent.id === id) {
        localStorage.setItem(
          STORAGE_KEY_USER,
          JSON.stringify(updatedCurrent)
        );
      }

      return {
        users: updatedUsers,
        currentUser: updatedCurrent,
      };
    });
  },

  // Khóa tài khoản (không xóa khỏi database)
  deleteUser: async (id) => {
    await lockAccountApi(id);

    set((state) => ({
      users: state.users.map((user) =>
        user.id === id
          ? { ...user, status: 'INACTIVE' as const }
          : user
      ),
    }));
  },

  // Mở khóa tài khoản
  unlockUser: async (id) => {
    await unlockAccountApi(id);

    set((state) => ({
      users: state.users.map((user) =>
        user.id === id
          ? { ...user, status: 'ACTIVE' as const }
          : user
      ),
    }));
  },
}));


