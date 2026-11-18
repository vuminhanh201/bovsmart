import React, { useState } from 'react';
import { useNavigate, useLocation, Navigate, Link } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';
import {
  Sparkles,
  Lock,
  Mail,
  ArrowRight,
  Eye,
  EyeOff
} from 'lucide-react';

const LoginPage = () => {
  const { login, isAuthenticated } = useAuthStore();

  const navigate = useNavigate();
  const location = useLocation();

  const from = (location.state as any)?.from?.pathname || '/';

  // Khai báo tất cả Hook trước điều kiện return
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Kiểm tra trạng thái đăng nhập sau khi khai báo Hook
  if (isAuthenticated) {
    return <Navigate to={from} replace />;
  }
  // Xử lý đăng nhập
  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    setErrorMessage(null);

    // Kiểm tra email
    if (!email.trim()) {
      setErrorMessage('Vui lòng nhập email tài khoản.');
      return;
    }

    // Kiểm tra mật khẩu
    if (!password) {
      setErrorMessage('Vui lòng nhập mật khẩu.');
      return;
    }

    try {
      setIsLoading(true);

      // Gọi login từ useAuthStore
      const result = await login(email.trim(), undefined, password);

      if (result.success) {
        navigate(from, { replace: true });
      } else {
        setErrorMessage(result.message || 'Đăng nhập thất bại');
      }
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Không thể kết nối đến máy chủ.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center items-center p-4 relative overflow-hidden">

      {/* Background radial gradient */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden relative z-10 animate-in fade-in zoom-in-95 duration-300">

        {/* Header */}
        <div className="p-8 text-center bg-gradient-to-b from-emerald-50/70 to-transparent border-b border-slate-100">

          <div className="w-14 h-14 mx-auto rounded-2xl bg-emerald-600 flex items-center justify-center text-white shadow-lg shadow-emerald-600/30 mb-4">
            <Sparkles className="w-7 h-7" />
          </div>

          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            BovSmart AgriTech
          </h1>

          <p className="text-xs text-slate-500 mt-1">
            Hệ Thống Quản Lý Trang Trại Bò & Chuỗi Khối IoT
          </p>

        </div>

        {/* Form */}
        <form onSubmit={handleLogin} className="p-8 space-y-4">

          {/* Thông báo lỗi */}
          {errorMessage && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-start gap-2">
              <span className="font-bold shrink-0">
                Lỗi:
              </span>

              <span>{errorMessage}</span>
            </div>
          )}

          {/* Email */}
          <div>

            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Email tài khoản
            </label>

            <div className="relative">

              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />

              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ten@bovsmart.vn"
                disabled={isLoading}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
              />

            </div>

          </div>

          {/* Password */}
          <div>

            <div className="flex items-center justify-between mb-1.5">

              <label className="block text-xs font-semibold text-slate-700">
                Mật khẩu
              </label>

              <Link
                to="/forgot-password"
                className="text-xs text-emerald-600 hover:text-emerald-700 font-medium"
              >
                Quên mật khẩu?
              </Link>

            </div>

            <div className="relative">

              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />

              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Nhập mật khẩu..."
                disabled={isLoading}
                autoComplete="current-password"
                className="w-full pl-10 pr-11 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
              />

              {/* Nút hiện / ẩn mật khẩu */}
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                disabled={isLoading}
                aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-emerald-600 transition-colors disabled:cursor-not-allowed"
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>

            </div>

          </div>

          {/* Login button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 disabled:cursor-not-allowed text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 group cursor-pointer"
          >

            <span>
              {isLoading
                ? 'Đang đăng nhập...'
                : 'Đăng Nhập Hệ Thống'}
            </span>

            {!isLoading && (
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            )}

          </button>

        </form>

      </div>

      {/* Footer */}
      <p className="text-center text-xs text-slate-500 mt-6">
        © 2026 BovSmart AgriTech • Giải pháp số hóa chăn nuôi chuẩn VietGAP & Blockchain
      </p>

    </div>
  );
};

export default LoginPage;