
import React, { useState, useEffect } from 'react';
import { User, UserRole } from '../../types';
import { useAuthStore } from '../../store/useAuthStore';
import { useFarmStore } from '../../store/useFarmStore';
import {
  uploadCattleImageApi,
  getCattleImageUrlApi,
} from '../../services/fileService';
import { RoleBadge } from '../../components/layout/RoleBadge';
import { RoleGuard } from '../../components/common/RoleGuard';
import {
  UserPlus,
  Search,
  Edit2,
  X,
  Lock,
  Unlock,
} from 'lucide-react';

export const UserManagementPage: React.FC = () => {
  const {
    users,
    currentUser,
    addUser,
    updateUser,
    deleteUser,
    unlockUser,
    loadUsers,
  } = useAuthStore();

  const { barns, addToast, fetchBarns } = useFarmStore();

  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState<string>('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [showInitialPassword, setShowInitialPassword] = useState(false);

  // Trạng thái ảnh đại diện
  const [selectedAvatarFile, setSelectedAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState('');
  const [avatarUrls, setAvatarUrls] = useState<Record<string, string>>({});

  // Tự động tải danh sách nhân sự từ backend
  useEffect(() => {
    loadUsers().catch((error) => {
      addToast(
        'error',
        'Không thể tải nhân sự',
        error instanceof Error ? error.message : 'Lỗi kết nối máy chủ.'
      );
    });
  }, [loadUsers, addToast]);

  // Tự động tải danh sách chuồng từ backend
  useEffect(() => {
    fetchBarns();
  }, [fetchBarns]);

  // Lấy URL ảnh đại diện từ MinIO
  useEffect(() => {
    let cancelled = false;

    const loadAvatarUrls = async () => {
      const usersWithMinioAvatar = users.filter(
        (user) =>
          user.avatar &&
          user.avatar.startsWith('minio:')
      );

      const results = await Promise.all(
        usersWithMinioAvatar.map(async (user) => {
          try {
            const fileId = user.avatar!.replace('minio:', '');
            const response = await getCattleImageUrlApi(fileId);

            return {
              userId: user.id,
              url: response.url,
            };
          } catch (error) {
            console.error(
              `Không thể tải ảnh đại diện của ${user.name}:`,
              error
            );

            return null;
          }
        })
      );

      if (cancelled) return;

      setAvatarUrls((previous) => {
        const updated = { ...previous };

        results.forEach((result) => {
          if (result) {
            updated[result.userId] = result.url;
          }
        });

        return updated;
      });
    };

    loadAvatarUrls();

    return () => {
      cancelled = true;
    };
  }, [users]);

  // Form states
  const [formData, setFormData] = useState({
    username: '',
    name: '',
    email: '',
    password: '',
    phone: '',
    department: 'Tổ Vận Hành & Cho Ăn',
    role: 'STAFF' as UserRole,
    avatar: '',
    status: 'ACTIVE' as 'ACTIVE' | 'INACTIVE',
    lastLogin: 'Chưa đăng nhập',
    assignedPens: [] as string[],
  });

  // Mở form thêm tài khoản
  const handleOpenAdd = () => {
    setEditingUser(null);

    setFormData({
      name: '',
      email: '',
      username: '',
      password: '',
      phone: '',
      department: 'Tổ Vận Hành & Cho Ăn',
      role: 'STAFF',
      avatar: '',
      status: 'ACTIVE',
      lastLogin: 'Chưa đăng nhập',
      assignedPens: [],
    });

    setSelectedAvatarFile(null);
    setAvatarPreview('');
    setIsAddModalOpen(true);
  };

  // Mở form chỉnh sửa tài khoản
  const handleOpenEdit = (user: User) => {
    setEditingUser(user);

    setFormData({
      name: user.name,
      email: user.email,
      username: user.username || '',
      password: '',
      phone: user.phone || '',
      department: user.department || '',
      role: user.role,
      avatar: user.avatar || '',
      status: user.status,
      lastLogin: user.lastLogin,
      assignedPens: user.assignedPens || [],
    });

    setSelectedAvatarFile(null);
    setAvatarPreview('');
    setIsAddModalOpen(true);
  };

  // Chọn ảnh đại diện
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];

    if (!file) return;

    if (!['image/jpeg', 'image/png', 'image/gif'].includes(file.type)) {
      addToast(
        'error',
        'Ảnh không hợp lệ',
        'Chỉ chấp nhận JPG, PNG hoặc GIF.'
      );
      e.target.value = '';
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      addToast(
        'error',
        'Ảnh quá lớn',
        'Dung lượng ảnh không được vượt quá 5MB.'
      );
      e.target.value = '';
      return;
    }

    if (avatarPreview.startsWith('blob:')) {
      URL.revokeObjectURL(avatarPreview);
    }

    setSelectedAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  // Tạo hoặc cập nhật tài khoản
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.username.trim()) {
      addToast(
        'error',
        'Thiếu tên đăng nhập',
        'Vui lòng nhập tên đăng nhập.'
      );
      return;
    }

    if (!/^0\d{9}$/.test(formData.phone.trim())) {
      addToast(
        'error',
        'Số điện thoại không hợp lệ',
        'Số điện thoại phải gồm đúng 10 chữ số và bắt đầu bằng số 0.'
      );
      return;
    }

    try {
      let avatarToSave = formData.avatar;

      // Nếu chọn ảnh mới thì tải ảnh lên MinIO
      if (selectedAvatarFile) {
        const uploaded = await uploadCattleImageApi(selectedAvatarFile);
        avatarToSave = `minio:${uploaded.id}`;
      }

      const accountData = {
        username: formData.username.trim(),
        fullName: formData.name,
        email: formData.email,
        phone: formData.phone,
        role: formData.role,
        department: formData.department,
        assignedBarns: formData.assignedPens,
        enabled: formData.status === 'ACTIVE',
        avatar: avatarToSave,
      };

      if (editingUser) {
        await updateUser(editingUser.id, accountData);

        addToast(
          'success',
          'Cập nhật thành công',
          `Đã cập nhật tài khoản ${formData.name}.`
        );
      } else {
        if (!formData.password || formData.password.length < 6) {
          addToast(
            'error',
            'Mật khẩu không hợp lệ',
            'Mật khẩu ban đầu phải có ít nhất 6 ký tự.'
          );
          return;
        }

        await addUser({
          ...accountData,
          password: formData.password,
        });

        addToast(
          'success',
          'Tạo tài khoản thành công',
          `Đã tạo tài khoản cho ${formData.name}.`
        );
      }

      setIsAddModalOpen(false);

      if (avatarPreview.startsWith('blob:')) {
        URL.revokeObjectURL(avatarPreview);
      }

      setSelectedAvatarFile(null);
      setAvatarPreview('');

      // Tải lại danh sách để cập nhật dữ liệu mới
      await loadUsers();
    } catch (error) {
      addToast(
        'error',
        'Thao tác thất bại',
        error instanceof Error ? error.message : 'Không thể kết nối máy chủ.'
      );
    }
  };

  // Khóa hoặc mở khóa tài khoản
  const handleToggleStatus = async (user: User) => {
    if (user.id === currentUser.id) {
      addToast(
        'error',
        'Không thể thực hiện',
        'Không thể khóa tài khoản đang đăng nhập.'
      );
      return;
    }

    const action = user.status === 'ACTIVE' ? 'khóa' : 'mở khóa';

    if (!confirm(`Bạn có chắc chắn muốn ${action} tài khoản ${user.name}?`)) {
      return;
    }

    try {
      if (user.status === 'ACTIVE') {
        await deleteUser(user.id);
      } else {
        await unlockUser(user.id);
      }

      addToast(
        'success',
        'Thành công',
        `Đã ${action} tài khoản ${user.name}.`
      );

      await loadUsers();
    } catch (error) {
      addToast(
        'error',
        'Thao tác thất bại',
        error instanceof Error ? error.message : 'Không thể kết nối máy chủ.'
      );
    }
  };

  // Lấy ảnh đại diện để hiển thị trong bảng
  const getUserAvatar = (user: User) => {
    if (user.avatar?.startsWith('minio:')) {
      return (
        avatarUrls[user.id] ||
        `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || 'User')}`
      );
    }

    return (
      user.avatar ||
      `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || 'User')}`
    );
  };

  // Lấy ảnh đại diện để hiển thị trong form
  const getFormAvatar = () => {
    if (selectedAvatarFile && avatarPreview) {
      return avatarPreview;
    }

    if (editingUser?.avatar?.startsWith('minio:')) {
      return (
        avatarUrls[editingUser.id] ||
        `https://ui-avatars.com/api/?name=${encodeURIComponent(formData.name || 'User')}`
      );
    }

    if (formData.avatar && !formData.avatar.startsWith('minio:')) {
      return formData.avatar;
    }

    return `https://ui-avatars.com/api/?name=${encodeURIComponent(formData.name || 'User')}`;
  };

  // Tìm kiếm và lọc nhân sự
  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      (u.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (u.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (u.department || '').toLowerCase().includes(searchTerm.toLowerCase());

    const matchesRole = filterRole === 'ALL' || u.role === filterRole;

    return matchesSearch && matchesRole;
  });

  // Phân trang danh sách nhân sự
  const totalUsers = filteredUsers.length;
  const totalPages = Math.ceil(totalUsers / itemsPerPage);

  const startIndex = (currentPage - 1) * itemsPerPage;

  const paginatedUsers = filteredUsers.slice(
    startIndex,
    startIndex + itemsPerPage
  );

  // Tự động đưa về trang hợp lệ khi tìm kiếm hoặc lọc
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterRole]);

  useEffect(() => {
    if (totalPages > 0 && currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  return (
    <RoleGuard allowedRoles={['ADMIN']}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-900">
                Quản Lý Tài Khoản & Nhân Sự
              </h1>

              <span className="text-xs bg-indigo-50 text-indigo-700 border border-indigo-200 px-2.5 py-0.5 rounded-full font-semibold">
                Phân Quyền ADMIN
              </span>
            </div>

            <p className="text-xs text-slate-500 mt-0.5">
              Tạo tài khoản, phân quyền RBAC và phân công chuồng trại cho nhân sự trang trại
            </p>
          </div>

          <button
            onClick={handleOpenAdd}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition-all shadow-md shadow-emerald-600/20 flex items-center gap-2 cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>Thêm Tài Khoản / Nhân Sự</span>
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />

            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm theo tên, email hoặc phòng ban..."
              className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 whitespace-nowrap">
              Lọc vai trò:
            </span>

            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="py-2 px-3 text-xs rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="ALL">Tất cả ({users.length})</option>
              <option value="ADMIN">ADMIN</option>
              <option value="FARM_MANAGER">FARM_MANAGER</option>
              <option value="STAFF">STAFF</option>
            </select>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold">
                  <th className="py-3 px-4">Nhân sự</th>
                  <th className="py-3 px-4">Vai trò (RBAC)</th>
                  <th className="py-3 px-4">Phòng ban</th>
                  <th className="py-3 px-4">Liên hệ</th>
                  <th className="py-3 px-4">Chuồng phụ trách</th>
                  <th className="py-3 px-4">Trạng thái</th>
                  <th className="py-3 px-4 text-right">Thao tác</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {paginatedUsers.map((user) => (
                  <tr
                    key={user.id}
                    className="hover:bg-slate-50/60 transition-colors"
                  >
                    {/* Nhân sự */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={getUserAvatar(user)}
                          alt={user.name}
                          onError={(e) => {
                            e.currentTarget.src =
                              `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || 'User')}`;
                          }}
                          className="w-10 h-10 rounded-full object-cover border border-slate-200"
                        />

                        <div>
                          <p className="font-semibold text-slate-800">
                            {user.name}
                          </p>
                          <p className="text-[10px] text-slate-400">
                            {user.id}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Vai trò */}
                    <td className="py-3.5 px-4">
                      <RoleBadge role={user.role} />
                    </td>

                    {/* Phòng ban */}
                    <td className="py-3.5 px-4">
                      <span className="text-slate-600">
                        {user.department || 'Chưa cập nhật'}
                      </span>
                    </td>

                    {/* Liên hệ */}
                    <td className="py-3.5 px-4">
                      <div className="space-y-1">
                        <p className="text-slate-700">{user.email}</p>
                        <p className="text-slate-400">
                          {user.phone || 'Chưa cập nhật'}
                        </p>
                      </div>
                    </td>

                    {/* Chuồng phụ trách */}
                    <td className="py-3.5 px-4">
                      {user.role === 'ADMIN' ? (
                        <span className="text-slate-400 italic text-[11px]">
                          Không áp dụng
                        </span>
                      ) : user.role === 'FARM_MANAGER' ? (
                        <span className="text-emerald-700 font-semibold text-[11px]">
                          Toàn trại
                        </span>
                      
                        ) : user.assignedPens && user.assignedPens.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {user.assignedPens.map((penId) => {
                              const barn = barns.find((b) => b.id === penId);

                              return (
                                <span
                                  key={penId}
                                  className="text-[10px] font-medium bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded border border-slate-200"
                                >
                                  {barn?.name || 'Chưa xác định'}
                                </span>
                              );
                            })}
                          </div>

                      ) : (
                        <span className="text-slate-400 italic text-[11px]">
                          Chưa phân công
                        </span>
                      )}
                    </td>

                    {/* Trạng thái */}
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          user.status === 'ACTIVE'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            user.status === 'ACTIVE'
                              ? 'bg-emerald-500'
                              : 'bg-slate-400'
                          }`}
                        />

                        {user.status === 'ACTIVE' ? 'Hoạt động' : 'Tạm khóa'}
                      </span>
                    </td>

                    {/* Thao tác */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleOpenEdit(user)}
                          className="p-1.5 text-slate-600 hover:text-emerald-700 hover:bg-slate-100 rounded-lg transition-colors"
                          title="Sửa thông tin"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => handleToggleStatus(user)}
                          disabled={user.id === currentUser.id}
                          className={`p-1.5 rounded-lg transition-colors ${
                            user.id === currentUser.id
                              ? 'text-slate-300 cursor-not-allowed'
                              : user.status === 'ACTIVE'
                                ? 'text-slate-400 hover:text-rose-600 hover:bg-rose-50'
                                : 'text-emerald-600 hover:bg-emerald-50'
                          }`}
                          title={
                            user.id === currentUser.id
                              ? 'Không thể khóa chính mình'
                              : user.status === 'ACTIVE'
                                ? 'Khóa tài khoản'
                                : 'Mở khóa tài khoản'
                          }
                        >
                          {user.status === 'ACTIVE' ? (
                            <Lock className="w-4 h-4" />
                          ) : (
                            <Unlock className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

                {filteredUsers.length === 0 && (
                  <tr>
                    <td
                      colSpan={7}
                      className="py-8 text-center text-slate-400"
                    >
                      Không tìm thấy nhân sự phù hợp.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
        {totalUsers > 0 && (
          <div className="bg-white rounded-2xl border border-slate-200 px-4 py-3 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-xs text-slate-500">
              Hiển thị{' '}
              <span className="font-semibold text-slate-800">
                {startIndex + 1}
              </span>
              {' - '}
              <span className="font-semibold text-slate-800">
                {Math.min(startIndex + itemsPerPage, totalUsers)}
              </span>
              {' trong tổng số '}
              <span className="font-semibold text-slate-800">
                {totalUsers}
              </span>
              {' nhân sự'}
            </p>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                disabled={currentPage === 1}
                className="px-3 py-2 text-xs font-semibold rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Trước
              </button>

              {Array.from({ length: totalPages }, (_, index) => index + 1).map(
                (page) => (
                  <button
                    key={page}
                    type="button"
                    onClick={() => setCurrentPage(page)}
                    className={`min-w-8 px-2.5 py-2 text-xs font-semibold rounded-lg border transition-colors ${
                      currentPage === page
                        ? 'bg-emerald-600 text-white border-emerald-600'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {page}
                  </button>
                )
              )}

              <button
                type="button"
                onClick={() =>
                  setCurrentPage((page) => Math.min(totalPages, page + 1))
                }
                disabled={currentPage === totalPages}
                className="px-3 py-2 text-xs font-semibold rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Sau
              </button>
            </div>
          </div>
        )}

        {/* Add/Edit Modal */}
        {isAddModalOpen && (
          <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white rounded-3xl max-w-lg w-full max-h-[90vh] p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 flex flex-col overflow-hidden">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
                <h3 className="text-base font-bold text-slate-900">
                  {editingUser ? 'Cập Nhật Nhân Sự' : 'Thêm Nhân Sự Mới'}
                </h3>

                <button
                  onClick={() => {
                    setIsAddModalOpen(false);

                    if (avatarPreview.startsWith('blob:')) {
                      URL.revokeObjectURL(avatarPreview);
                    }

                    setSelectedAvatarFile(null);
                    setAvatarPreview('');
                  }}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
                <div className="flex-1 min-h-0 overflow-y-auto pr-2 space-y-4 text-xs">
                  {/* Ảnh đại diện */}
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Ảnh đại diện
                    </label>

                    <div className="flex items-center gap-4">
                      <img
                        src={getFormAvatar()}
                        alt="Ảnh đại diện"
                        onError={(e) => {
                          e.currentTarget.src =
                            `https://ui-avatars.com/api/?name=${encodeURIComponent(formData.name || 'User')}`;
                        }}
                        className="w-16 h-16 rounded-full object-cover border border-slate-200"
                      />

                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/gif"
                        onChange={handleAvatarChange}
                        className="text-xs"
                      />
                    </div>

                    <p className="text-[10px] text-slate-400 mt-1">
                      JPG, PNG hoặc GIF. Tối đa 5MB.
                    </p>
                  </div>

                  {/* Họ và tên */}
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Họ và tên
                    </label>

                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      placeholder="Nguyễn Văn A"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  {/* Mật khẩu ban đầu */}
                  {!editingUser && (
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">
                        Mật khẩu ban đầu
                      </label>

                      <div className="relative">
                        <input
                          type={showInitialPassword ? 'text' : 'password'}
                          required
                          minLength={6}
                          value={formData.password}
                          onChange={(e) =>
                            setFormData({ ...formData, password: e.target.value })
                          }
                          placeholder="Nhập mật khẩu (ít nhất 6 ký tự)"
                          className="w-full px-3 py-2 pr-16 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        />

                        <button
                          type="button"
                          onClick={() => setShowInitialPassword(!showInitialPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-medium text-emerald-600 hover:text-emerald-700"
                        >
                          {showInitialPassword ? 'Ẩn' : 'Hiện'}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Email và số điện thoại */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">
                        Email
                      </label>

                      <input
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) =>
                          setFormData({ ...formData, email: e.target.value })
                        }
                        placeholder="ten@bovsmart.vn"
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">
                        Số điện thoại
                      </label>

                      <input
                        type="text"
                        required
                        value={formData.phone}
                        maxLength={10}
                        inputMode="numeric"
                        pattern="0[0-9]{9}"
                        onChange={(e) =>
                          setFormData({ ...formData, phone: e.target.value })
                        }
                        placeholder="0912 345 678"
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                  </div>

                  {/* Tên đăng nhập */}
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Tên đăng nhập <span className="text-red-500">*</span>
                    </label>

                    <input
                      type="text"
                      required
                      value={formData.username}
                      onChange={(e) =>
                        setFormData({ ...formData, username: e.target.value })
                      }
                      placeholder="Ví dụ: cuong.le"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                    />
                  </div>

                  {/* Vai trò và phòng ban */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">
                        Vai trò hệ thống
                      </label>

                      <select
                        value={formData.role}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            role: e.target.value as UserRole,
                          })
                        }
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-semibold"
                      >
                        <option value="STAFF">STAFF (Nhân viên)</option>
                        <option value="FARM_MANAGER">FARM_MANAGER (Quản lý)</option>
                        <option value="ADMIN">ADMIN (Quản trị viên)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">
                        Phòng ban
                      </label>

                      <select
                        value={
                          ['Quản trị hệ thống', 'Chăm sóc bò', 'Quản lý trang trại', 'Thú y'].includes(
                            formData.department
                          )
                            ? formData.department
                            : 'Khác'
                        }
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            department: e.target.value === 'Khác' ? '' : e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      >
                        <option value="Chăm sóc bò">Chăm sóc bò</option>
                        <option value="Quản lý trang trại">Quản lý trang trại</option>
                        <option value="Thú y">Thú y</option>
                        <option value="Quản trị hệ thống">Quản trị hệ thống</option>
                        <option value="Khác">Khác</option>
                      </select>

                      {![
                        'Quản trị hệ thống',
                        'Chăm sóc bò',
                        'Quản lý trang trại',
                        'Thú y',
                      ].includes(formData.department) && (
                        <input
                          type="text"
                          value={formData.department}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              department: e.target.value,
                            })
                          }
                          placeholder="Nhập tên phòng ban khác"
                          className="w-full mt-2 px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                      )}
                    </div>
                  </div>

                  {/* Phân công chuồng */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Chuồng phụ trách
                    </label>

                    <div className="grid grid-cols-2 gap-2 p-2.5 bg-white rounded-xl border border-slate-200 max-h-40 overflow-y-auto">
                      {barns.map((b) => {
                        const isChecked = formData.assignedPens.includes(b.id);

                        return (
                          <label key={b.id} className="flex items-center gap-2 p-2 rounded-lg border cursor-pointer text-xs">
                            <input
                              type="radio"
                              name="assignedPen"
                              checked={isChecked}
                              onChange={() =>
                                setFormData({
                                  ...formData,
                                  assignedPens: [b.id],
                                })
                              }
                              className="text-emerald-600 focus:ring-emerald-500"
                            />
                            <span className="truncate font-medium">{b.name}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>

                  {/* Trạng thái tài khoản */}
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Trạng thái tài khoản
                    </label>

                    <select
                      value={formData.status}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          status: e.target.value as 'ACTIVE' | 'INACTIVE',
                        })
                      }
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                      <option value="ACTIVE">Hoạt động (Active)</option>
                      <option value="INACTIVE">Khóa tạm thời (Inactive)</option>
                    </select>
                  </div>

                </div>

                {/* Nút thao tác */}
                <div className="shrink-0 pt-3 border-t border-slate-100 flex items-center justify-end gap-2 bg-white">
                  <button
                    type="button"
                    onClick={() => {
                      setIsAddModalOpen(false);

                      if (avatarPreview.startsWith('blob:')) {
                        URL.revokeObjectURL(avatarPreview);
                      }

                      setSelectedAvatarFile(null);
                      setAvatarPreview('');
                    }}
                    className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-semibold"
                  >
                    Hủy
                  </button>

                  <button
                    type="submit"
                    className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-md shadow-emerald-600/20"
                  >
                    {editingUser ? 'Lưu Thay Đổi' : 'Tạo Tài Khoản'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </RoleGuard>
  );
};
