
import React, { useEffect, useState } from 'react';
import { useAuthStore } from '../../store/useAuthStore';
import { useFarmStore } from '../../store/useFarmStore';
import { RoleBadge } from '../../components/layout/RoleBadge';
import {
  uploadCattleImageApi,
  getCattleImageUrlApi,
} from '../../services/fileService';
import { updateProfileApi } from '../../services/authService';
import {
  User as UserIcon,
  Mail,
  Phone,
  Building,
  Shield,
  Save,
  CheckCircle,
  KeyRound,
} from 'lucide-react';

export const ProfilePage: React.FC = () => {
  const { currentUser, updateProfile } = useAuthStore();
  console.log('PROFILE CURRENT USER:', currentUser);
  const { addToast } = useFarmStore();

  const [name, setName] = useState(currentUser.name);
  const [phone, setPhone] = useState(currentUser.phone);
  const department = currentUser.department || 'Chưa được phân công';

  // Lưu mã MinIO, không lưu URL tạm thời
  const [avatar, setAvatar] = useState(currentUser.avatar || '');
  const [avatarPreview, setAvatarPreview] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const [savedSuccess, setSavedSuccess] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Tải URL ảnh đại diện từ MinIO khi mở trang hồ sơ
  useEffect(() => {
    const loadAvatar = async () => {
      if (currentUser.avatar?.startsWith('minio:')) {
        try {
          const fileId = currentUser.avatar.replace('minio:', '');
          const result = await getCattleImageUrlApi(fileId);
          setAvatarPreview(result.url);
        } catch (error) {
          console.error('Không thể tải ảnh đại diện:', error);
          setAvatarPreview('');
        }
      } else {
        setAvatarPreview(currentUser.avatar || '');
      }
    };

    loadAvatar();
  }, [currentUser.avatar]);

  // Chọn ảnh từ máy tính
  const handleAvatarChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/gif',
    ];

    if (!allowedTypes.includes(file.type)) {
      addToast(
        'error',
        'Ảnh không hợp lệ',
        'Chỉ chấp nhận ảnh JPG, PNG hoặc GIF.'
      );
      e.target.value = '';
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      addToast(
        'error',
        'Ảnh quá lớn',
        'Dung lượng ảnh tối đa là 5MB.'
      );
      e.target.value = '';
      return;
    }

    setSelectedFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setUploading(true);

      let avatarToSave = avatar;

      // Nếu chọn ảnh mới thì tải lên MinIO
      if (selectedFile) {
        const uploaded = await uploadCattleImageApi(selectedFile);
        avatarToSave = `minio:${uploaded.id}`;
      }

      // Lưu mã ảnh vào MongoDB thông qua API hồ sơ
    const updatedProfile = await updateProfileApi(
      currentUser.username || currentUser.email,
      currentUser.email,
      avatarToSave || null,
      name,
      phone,
      currentUser.department || ''
    );

      setAvatar(updatedProfile.avatar || '');
      setSelectedFile(null);

      // Cập nhật thông tin hiển thị trong Zustand
      updateProfile({
        username: updatedProfile.username,
        name: updatedProfile.fullName || name,
        phone: updatedProfile.phone || '',
        department: updatedProfile.department || '',
        avatar: updatedProfile.avatar || '',
      });

      // Lấy URL ảnh mới để hiển thị
      if (updatedProfile.avatar?.startsWith('minio:')) {
        const fileId = updatedProfile.avatar.replace('minio:', '');
        const result = await getCattleImageUrlApi(fileId);
        setAvatarPreview(result.url);
      }

      setSavedSuccess(true);

      addToast(
        'success',
        'Đã Lưu Hồ Sơ',
        'Thông tin cá nhân và ảnh đại diện đã được cập nhật.'
      );

      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Không thể cập nhật hồ sơ.';

      addToast('error', 'Cập nhật thất bại', message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Title */}
      <div>
        <h1 className="text-xl font-bold text-slate-900">
          Hồ Sơ Cá Nhân & Tài Khoản
        </h1>

        <p className="text-xs text-slate-500 mt-0.5">
          Quản lý thông tin liên hệ và thông tin tài khoản BovSmart
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column: Avatar & Role Summary */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 text-center space-y-4 shadow-xs">
          <div className="relative inline-block">
            {avatarPreview ? (
              <img
                src={avatarPreview}
                alt={name}
                className="w-28 h-28 rounded-full object-cover mx-auto ring-4 ring-emerald-500/20 shadow-md"
              />
            ) : (
              <div className="w-28 h-28 rounded-full bg-slate-100 flex items-center justify-center mx-auto ring-4 ring-emerald-500/20">
                <UserIcon className="w-10 h-10 text-slate-400" />
              </div>
            )}
          </div>

          <div>
            <h2 className="text-base font-bold text-slate-900">
              {name}
            </h2>

            <p className="text-xs text-slate-500">
              {department}
            </p>

            <div className="mt-2">
              <RoleBadge role={currentUser.role} />
            </div>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl text-left border border-slate-100 text-xs space-y-1.5">
            <div className="flex items-center justify-between text-slate-500">
              <span>Mã ID:</span>
              <span className="font-mono font-bold text-slate-800">
                {currentUser.id}
              </span>
            </div>

            <div className="flex items-center justify-between text-slate-500">
              <span>Đăng nhập cuối:</span>
              <span className="text-slate-800">
                {currentUser.lastLogin}
              </span>
            </div>

            <div className="flex items-center justify-between text-slate-500">
              <span>Trạng thái:</span>
              <span className="text-emerald-700 font-semibold">
                Đang hoạt động
              </span>
            </div>
          </div>
        </div>

        {/* Right Column: Editable Profile Details */}
        <div className="md:col-span-2 bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
          <h3 className="text-sm font-bold text-slate-900 mb-4 pb-2 border-b border-slate-100 flex items-center gap-2">
            <UserIcon className="w-4 h-4 text-emerald-600" />
            Chi Tiết Thông Tin Cá Nhân
          </h3>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Họ và tên
                </label>

                <div className="relative">
                  <UserIcon className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />

                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Số điện thoại
                </label>

                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />

                  <input
                    type="text"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Tên đăng nhập
              </label>

              <div className="relative">
                <UserIcon className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />

                <input
                  type="text"
                  value={currentUser.username || ''}
                  readOnly
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 bg-white text-slate-600 cursor-not-allowed"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Địa chỉ Email
                </label>
         
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />

                  <input
                    type="email"
                    disabled
                    value={currentUser.email}
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 text-slate-500 cursor-not-allowed"
                  />
                </div>

                <span className="text-[10px] text-slate-400 mt-0.5 block">
                  Email liên kết với tài khoản hệ thống
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Phòng ban / Bộ phận
                </label>

                <div className="relative">
                  <Building className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />

                  <input
                    type="text"
                    value={department}
                    readOnly
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 text-slate-600 cursor-not-allowed"
                  />
                </div>

                <span className="text-[10px] text-slate-400 mt-1 block">
                  Phòng ban do quản trị viên hệ thống phân công.
                </span>
              </div>
            </div>

            {/* Avatar Upload */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-2">
                Ảnh đại diện tài khoản
              </label>

              <div className="flex flex-col sm:flex-row items-start gap-4">
                <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-emerald-100 bg-slate-100 shrink-0">
                  {avatarPreview ? (
                    <img
                      src={avatarPreview}
                      alt="Ảnh đại diện xem trước"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-400">
                      <UserIcon className="w-8 h-8" />
                    </div>
                  )}
                </div>

                <div className="flex-1 space-y-2">
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/gif"
                    onChange={handleAvatarChange}
                    className="block w-full text-xs text-slate-600 file:mr-3 file:px-4 file:py-2 file:rounded-lg file:border-0 file:bg-emerald-50 file:text-emerald-700 file:font-semibold hover:file:bg-emerald-100"
                  />

                  <p className="text-[10px] text-slate-400">
                    Chọn ảnh JPG, PNG hoặc GIF. Dung lượng tối đa 5MB.
                    Ảnh sẽ được tải lên MinIO khi nhấn Lưu Thay Đổi.
                  </p>
                </div>
              </div>
            </div>

            {/* Save Profile */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              {savedSuccess ? (
                <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
                  <CheckCircle className="w-4 h-4" />
                  Đã cập nhật thành công
                </span>
              ) : (
                <span className="text-[11px] text-slate-400">
                  Dữ liệu được lưu trữ tự động vào phiên làm việc
                </span>
              )}

              <button
                type="submit"
                disabled={uploading}
                className={`px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition-all shadow-md shadow-emerald-600/20 flex items-center gap-1.5 ${
                  uploading
                    ? 'opacity-50 cursor-not-allowed'
                    : 'cursor-pointer'
                }`}
              >
                <Save className="w-4 h-4" />

                <span>
                  {uploading
                    ? 'Đang tải ảnh và lưu...'
                    : 'Lưu Thay Đổi'}
                </span>
              </button>
            </div>
          </form>

          {/* FR-SYS-05: Đổi Mật Khẩu */}
          <div className="mt-6 pt-5 border-t border-slate-100">
            <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-emerald-600" />
              Đổi Mật Khẩu Tài Khoản (FR-SYS-05)
            </h3>

            <PasswordChangeSection />
          </div>

          {/* Role Scope Explainer */}
          <div className="mt-6 p-4 rounded-xl bg-slate-50 border border-slate-200/80">
            <h4 className="text-xs font-bold text-slate-900 mb-1.5 flex items-center gap-1.5">
              <Shield className="w-4 h-4 text-indigo-600" />
              Quyền Hạn Và Phạm Vi Tác Nghiệp: {currentUser.role}
            </h4>

            <p className="text-xs text-slate-600 leading-relaxed">
              {currentUser.role === 'ADMIN' &&
                'ADMIN quản trị hệ thống: quản lý tài khoản, phân quyền, cấu hình kỹ thuật và nhật ký hệ thống. Có thể xem dữ liệu trang trại để giám sát nhưng không trực tiếp thực hiện hoặc phê duyệt nghiệp vụ chăn nuôi.'}

              {currentUser.role === 'FARM_MANAGER' &&
                'FARM_MANAGER quản lý hoạt động trang trại: điều hành đàn bò, chuồng trại, thức ăn, chăm sóc thú y, thực hiện và phê duyệt các nghiệp vụ thuộc phạm vi quản lý.'}

              {currentUser.role === 'STAFF' &&
                'STAFF trực tiếp thực hiện công việc được giao: cho ăn, vệ sinh chuồng, ghi nhật ký, quét RFID và cân trọng lượng. Không có quyền quản lý tài khoản, phân quyền hoặc phê duyệt nghiệp vụ.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};


const PasswordChangeSection: React.FC = () => {
  const { changePassword } = useAuthStore();

  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);

  const [msg, setMsg] = useState<{
    text: string;
    success: boolean;
  } | null>(null);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isSubmitting) return;

    setIsSubmitting(true);
    setMsg(null);

    try {
      // Gọi API đổi mật khẩu và chờ backend xử lý
      const res = await changePassword(
        oldPassword,
        newPassword,
        confirmPassword
      );

      setMsg({
        text: res.message,
        success: res.success,
      });

      // Chỉ xóa các ô nhập khi backend xác nhận thành công
      if (res.success) {
        setOldPassword('');
        setNewPassword('');
        setConfirmPassword('');
      }
    } catch (error) {
      setMsg({
        text:
          error instanceof Error
            ? error.message
            : 'Đổi mật khẩu thất bại.',
        success: false,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleChangePassword}
      className="space-y-3 p-4 bg-slate-50 rounded-2xl border border-slate-200"
    >
      {msg && (
        <div
          className={`p-2.5 rounded-xl text-xs flex items-center gap-2 ${
            msg.success
              ? 'bg-emerald-100 text-emerald-800'
              : 'bg-rose-100 text-rose-800'
          }`}
        >
          {msg.success ? (
            <CheckCircle className="w-4 h-4" />
          ) : (
            <Shield className="w-4 h-4" />
          )}

          <span>{msg.text}</span>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <label className="block text-[11px] font-semibold text-slate-700 mb-1">
            Mật khẩu hiện tại
          </label>

          <input
            type="password"
            required
            value={oldPassword}
            onChange={(e) => setOldPassword(e.target.value)}
            placeholder="••••••••"
            className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-white"
          />
        </div>

        <div>
          <label className="block text-[11px] font-semibold text-slate-700 mb-1">
            Mật khẩu mới (≥ 6 ký tự)
          </label>

          <input
            type="password"
            required
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="••••••••"
            className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-white"
          />
        </div>

        <div>
          <label className="block text-[11px] font-semibold text-slate-700 mb-1">
            Xác nhận mật khẩu
          </label>

          <input
            type="password"
            required
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="••••••••"
            className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-white"
          />
        </div>
      </div>

      <div className="flex justify-between items-center pt-1">
        <span className="text-[10px] text-slate-400">
          Tuân thủ tiêu chuẩn mã hóa bảo mật BCrypt (FR-SYS-05)
        </span>

        <button
          type="submit"
          disabled={isSubmitting}
          className={`px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs ${
            isSubmitting
              ? 'opacity-50 cursor-not-allowed'
              : 'cursor-pointer'
          }`}
        >
          {isSubmitting ? 'Đang cập nhật...' : 'Cập Nhật Mật Khẩu'}
        </button>
      </div>
    </form>
  );
};
