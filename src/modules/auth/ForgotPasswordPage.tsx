import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, ArrowLeft, CheckCircle2, Lock, KeyRound, Clock, RefreshCw, AlertCircle } from 'lucide-react';

type ResetStep = 'ENTER_EMAIL' | 'ENTER_OTP' | 'RESET_PASSWORD' | 'SUCCESS';

export const ForgotPasswordPage: React.FC = () => {
  const navigate = useNavigate();

  const [step, setStep] = useState<ResetStep>('ENTER_EMAIL');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Bộ đếm ngược 10 phút (600 giây) cho OTP
  const [timeLeft, setTimeLeft] = useState(600);
  const [isTimerActive, setIsTimerActive] = useState(false);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isTimerActive && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isTimerActive, timeLeft]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  
  // Bước 1: Gửi email yêu cầu OTP thật từ backend
  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!email.trim() || !email.includes('@')) {
      setErrorMessage('Vui lòng nhập địa chỉ email hợp lệ.');
      return;
    }

    try {
      const response = await fetch(
        'http://localhost:8081/api/auth/forgot-password',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: email.trim(),
          }),
        }
      );

      const result = await response.json();

      if (!response.ok || result.success !== 1) {
        throw new Error(
          result.message || 'Không thể gửi mã OTP.'
        );
      }

      // Backend gửi thành công thì mới chuyển sang nhập OTP
      setOtp('');
      setTimeLeft(600);
      setIsTimerActive(true);
      setStep('ENTER_OTP');

      setSuccessMessage(
        `Mã xác minh đã được gửi đến email ${email}. Vui lòng kiểm tra hộp thư!`
      );

    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Không thể kết nối đến máy chủ.'
      );
    }
  };


  // Bước 2: Xác minh OTP thật từ backend
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (timeLeft <= 0) {
      setErrorMessage(
        'Mã xác minh đã hết hạn 10 phút. Vui lòng gửi lại mã mới.'
      );
      return;
    }

    if (!otp.trim() || !/^\d{6}$/.test(otp.trim())) {
      setErrorMessage('Mã xác minh phải gồm đúng 6 chữ số.');
      return;
    }

    try {
      const response = await fetch(
        'http://localhost:8081/api/auth/verify-reset-code',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: email.trim(),
            code: otp.trim(),
          }),
        }
      );

      const result = await response.json();

      if (!response.ok || result.success !== 1) {
        throw new Error(
          result.message || 'Mã OTP không hợp lệ.'
        );
      }

      // Chỉ chuyển bước khi backend xác minh OTP thành công
      setStep('RESET_PASSWORD');

      setSuccessMessage(
        'Mã xác minh hợp lệ. Vui lòng tạo mật khẩu mới.'
      );

    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Không thể xác minh mã OTP.'
      );
    }
  };


  // Gửi lại mã OTP thật
  const handleResendOtp = async () => {
    setOtp('');
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const response = await fetch(
        'http://localhost:8081/api/auth/forgot-password',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: email.trim(),
          }),
        }
      );

      const result = await response.json();

      if (!response.ok || result.success !== 1) {
        throw new Error(
          result.message || 'Không thể gửi lại mã OTP.'
        );
      }

      setTimeLeft(600);
      setIsTimerActive(true);

      setSuccessMessage(
        `Đã gửi mã xác minh mới đến ${email}. Hiệu lực trong 10 phút.`
      );

    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Không thể kết nối đến máy chủ.'
      );
    }
  };


  // Bước 3: Đặt lại mật khẩu mới
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!newPassword || newPassword.length < 6) {
      setErrorMessage('Mật khẩu mới phải có tối thiểu 6 ký tự.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage('Xác nhận mật khẩu mới không trùng khớp.');
      return;
    }

    try {
      const response = await fetch(
        'http://localhost:8081/api/auth/reset-password',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: email.trim(),
            code: otp.trim(),
            newPassword: newPassword,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok || result.success !== 1) {
        throw new Error(
          result.message || 'Không thể đặt lại mật khẩu. Vui lòng thử lại.'
        );
      }

      // Chỉ báo thành công khi Backend đã lưu mật khẩu
      setStep('SUCCESS');
      setIsTimerActive(false);
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Có lỗi xảy ra khi đặt lại mật khẩu.'
      );
    }
  };


  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center items-center p-4 relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl border border-slate-100 p-8 relative z-10 animate-in fade-in zoom-in-95 duration-300">
        <Link
          to="/login"
          className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 mb-6 font-medium transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Quay lại đăng nhập
        </Link>

        {errorMessage && (
          <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-500 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && step !== 'SUCCESS' && (
          <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 mt-0.5" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* BƯỚC 1: NHẬP EMAIL */}
        {step === 'ENTER_EMAIL' && (
          <div>
            <h1 className="text-xl font-bold text-slate-900">Khôi Phục Mật Khẩu</h1>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Nhập địa chỉ email tài khoản trang trại của bạn để nhận mã xác minh OTP 6 chữ số qua Gmail.
            </p>

            <form onSubmit={handleRequestOtp} className="mt-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Email tài khoản</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="ten@bovsmart.vn"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-emerald-600/20 cursor-pointer"
              >
                Gửi Mã Khôi Phục (OTP)
              </button>
            </form>
          </div>
        )}

        {/* BƯỚC 2: NHẬP MÃ OTP 6 CHỮ SỐ */}
        {step === 'ENTER_OTP' && (
          <div>
            <div className="flex items-center justify-between">
              <h1 className="text-xl font-bold text-slate-900">Nhập Mã Xác Minh</h1>
              <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 text-xs font-semibold border border-amber-200">
                <Clock className="w-3.5 h-3.5" />
                <span>{formatTime(timeLeft)}</span>
              </div>
            </div>

            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Vui lòng nhập mã OTP 6 chữ số đã được gửi đến <strong>{email}</strong>. Mã có hiệu lực trong 10 phút.
            </p>

            <form onSubmit={handleVerifyOtp} className="mt-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Mã OTP (6 chữ số)</label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    maxLength={6}
                    required
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                    placeholder="123456"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-center tracking-[8px] text-base font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={timeLeft <= 0}
                className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-emerald-600/20 cursor-pointer disabled:cursor-not-allowed"
              >
                Xác Minh Mã OTP
              </button>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={handleResendOtp}
                  className="text-xs text-emerald-600 hover:text-emerald-700 font-semibold inline-flex items-center gap-1 cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> Gửi lại mã mới
                </button>
              </div>
            </form>
          </div>
        )}

        {/* BƯỚC 3: ĐẶT MẬT KHẨU MỚI */}
        {step === 'RESET_PASSWORD' && (
          <div>
            <h1 className="text-xl font-bold text-slate-900">Đặt Lại Mật Khẩu</h1>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Thiết lập mật khẩu mới an toàn cho tài khoản <strong>{email}</strong>.
            </p>

            <form onSubmit={handleResetPassword} className="mt-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Mật khẩu mới</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Tối thiểu 6 ký tự..."
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Xác nhận mật khẩu mới</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Nhập lại mật khẩu mới..."
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-emerald-600/20 cursor-pointer"
              >
                Cập Nhật Mật Khẩu Mới
              </button>
            </form>
          </div>
        )}

        {/* BƯỚC 4: THÀNH CÔNG */}
        {step === 'SUCCESS' && (
          <div className="text-center py-4 space-y-3">
            <div className="w-14 h-14 mx-auto rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center animate-bounce">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h2 className="text-lg font-bold text-slate-900">Đổi Mật Khẩu Thành Công!</h2>
            <p className="text-xs text-slate-500 leading-relaxed">
              Mật khẩu cho tài khoản <strong>{email}</strong> đã được cập nhật an toàn. Bạn có thể sử dụng mật khẩu mới để đăng nhập ngay bây giờ.
            </p>
            <div className="pt-4">
              <button
                onClick={() => navigate('/login')}
                className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-emerald-600/20 cursor-pointer"
              >
                Về Trang Đăng Nhập
              </button>
            </div>
          </div>
        )}
      </div>

      <p className="text-center text-xs text-slate-500 mt-6">
        © 2026 BovSmart AgriTech • An toàn thông tin chuẩn doanh nghiệp
      </p>
    </div>
  );
};
