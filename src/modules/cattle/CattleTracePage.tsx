
import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  Activity,
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Clock,
  HeartPulse,
  Loader2,
  MapPin,
  Scale,
  ShieldCheck,
  Syringe,
  Tag,
  AlertCircle,
} from 'lucide-react';

import {
  getPublicCattleTraceApi,
  getPublicCattleHealthApi,
  getPublicCattleVaccinationsApi,
  PublicCattleTrace,
  PublicHealthRecord,
  PublicVaccinationRecord,
} from '../../services/cattleService';

const formatDate = (value?: string) => {
  if (!value) return 'Chưa cập nhật';

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleDateString('vi-VN');
};

const getCattleStatus = (status?: string) => {
  const statuses: Record<string, string> = {
    DANG_NUOI: 'Đang nuôi',
    CAN_THEO_DOI: 'Cần theo dõi',
    DANG_DIEU_TRI: 'Đang điều trị',
    DU_DIEU_KIEN_XUAT_BAN: 'Đủ điều kiện xuất bán',
    DA_XUAT_BAN: 'Đã xuất bán',
    PREGNANT: 'Mang thai',
    QUARANTINE: 'Cách ly thú y',
  };

  return statuses[status || ''] || status || 'Chưa cập nhật';
};

const getWithdrawalStatus = (status?: string) => {
  const statuses: Record<string, string> = {
    NOT_CONFIRMED: 'Chưa xác nhận',
    WAITING: 'Đang trong thời gian ngừng thuốc',
    COMPLETED: 'Đã hoàn thành ngừng thuốc',
  };

  return statuses[status || ''] || status || 'Chưa cập nhật';
};

const CattleTracePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  const [cattle, setCattle] = useState<PublicCattleTrace | null>(null);
  const [healthRecords, setHealthRecords] = useState<PublicHealthRecord[]>([]);
  const [vaccinations, setVaccinations] = useState<PublicVaccinationRecord[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) {
      setError('Không tìm thấy mã hồ sơ bò.');
      setLoading(false);
      return;
    }

    const loadTraceData = async () => {
      try {
        setLoading(true);
        setError('');

        const [cattleData, healthData, vaccinationData] = await Promise.all([
          getPublicCattleTraceApi(id),
          getPublicCattleHealthApi(id),
          getPublicCattleVaccinationsApi(id),
        ]);

        setCattle(cattleData);
        setHealthRecords(healthData);
        setVaccinations(vaccinationData);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : 'Không thể tải thông tin truy xuất nguồn gốc.'
        );
      } finally {
        setLoading(false);
      }
    };

    loadTraceData();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-9 h-9 animate-spin text-emerald-600" />
        <p className="text-sm text-slate-500">
          Đang tải thông tin truy xuất nguồn gốc...
        </p>
      </div>
    );
  }

  if (error || !cattle) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-5">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-7 max-w-md w-full text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
          <h1 className="text-xl font-bold text-slate-800">
            Không thể truy xuất hồ sơ
          </h1>
          <p className="text-sm text-slate-500 mt-2">
            {error || 'Không tìm thấy thông tin bò.'}
          </p>
          <Link
            to="/"
            className="inline-flex items-center gap-2 mt-5 text-emerald-700 font-semibold"
          >
            <ArrowLeft size={17} />
            Quay lại
          </Link>
        </div>
      </div>
    );
  }

  const status = getCattleStatus(cattle.status);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      <header className="bg-emerald-800 text-white">
        <div className="max-w-5xl mx-auto px-5 py-7">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-white/15 flex items-center justify-center">
              <ShieldCheck size={25} />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold">
                BOVSMART
              </h1>
              <p className="text-emerald-100 text-sm">
                Truy xuất nguồn gốc vật nuôi
              </p>
            </div>
          </div>
          <p className="text-sm text-emerald-100 mt-5">
            Thông tin truy xuất được cung cấp từ hệ thống quản lý trang trại.
          </p>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-7 space-y-6">
        {/* Thông tin cơ bản */}
        <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-5 sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-sm text-slate-500">Hồ sơ vật nuôi</p>
                <h2 className="text-2xl font-bold mt-1">
                  {cattle.name || 'Chưa đặt tên'}
                </h2>
                <p className="text-sm text-slate-500 mt-1">
                  Mã thẻ: {cattle.earTagNumber || 'Chưa cập nhật'}
                </p>
              </div>

              <span className="px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-700 text-sm font-semibold">
                {status}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-6">
              <div className="bg-slate-50 rounded-xl p-4">
                <Tag className="text-emerald-700 mb-2" size={20} />
                <p className="text-xs text-slate-500">Giống bò</p>
                <p className="font-semibold mt-1">
                  {cattle.breed || 'Chưa cập nhật'}
                </p>
              </div>

              <div className="bg-slate-50 rounded-xl p-4">
                <HeartPulse className="text-emerald-700 mb-2" size={20} />
                <p className="text-xs text-slate-500">Giới tính</p>
                <p className="font-semibold mt-1">
                  {cattle.gender === 'MALE'
                    ? 'Đực'
                    : cattle.gender === 'FEMALE'
                      ? 'Cái'
                      : cattle.gender || 'Chưa cập nhật'}
                </p>
              </div>

              <div className="bg-slate-50 rounded-xl p-4">
                <Scale className="text-emerald-700 mb-2" size={20} />
                <p className="text-xs text-slate-500">Cân nặng hiện tại</p>
                <p className="font-semibold mt-1">
                  {cattle.weight != null ? `${cattle.weight} kg` : 'Chưa cập nhật'}
                </p>
              </div>

              <div className="bg-slate-50 rounded-xl p-4">
                <MapPin className="text-emerald-700 mb-2" size={20} />
                <p className="text-xs text-slate-500">Nguồn gốc xuất xứ</p>
                <p className="font-semibold mt-1">
                  {cattle.origin || 'Chưa cập nhật'}
                </p>
              </div>

              <div className="bg-slate-50 rounded-xl p-4">
                <CalendarDays className="text-emerald-700 mb-2" size={20} />
                <p className="text-xs text-slate-500">Ngày nhập trại</p>
                <p className="font-semibold mt-1">
                  {formatDate(cattle.entryDate)}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Lịch sử cân nặng */}
        <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 sm:p-6">
          <div className="flex items-center gap-2 mb-4">
            <Scale className="text-emerald-700" size={22} />
            <h2 className="text-lg font-bold">Lịch sử cân nặng</h2>
          </div>

          {cattle.weightHistory && cattle.weightHistory.length > 0 ? (
            <div className="space-y-3">
              {[...cattle.weightHistory]
                .sort(
                  (a, b) =>
                    new Date(b.date || '').getTime() -
                    new Date(a.date || '').getTime()
                )
                .map((item, index) => (
                  <div
                    key={`${item.date}-${index}`}
                    className="flex justify-between items-center border-b border-slate-100 pb-3 last:border-0"
                  >
                    <div>
                      <p className="font-medium">
                        {formatDate(item.date)}
                      </p>
                    </div>
                    <p className="font-bold text-emerald-700">
                      {item.weight != null ? `${item.weight} kg` : '—'}
                    </p>
                  </div>
                ))}
            </div>
          ) : (
            <p className="text-sm text-slate-500">
              Chưa có lịch sử cân nặng được ghi nhận.
            </p>
          )}
        </section>

        {/* Lịch sử sức khỏe */}
        <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 sm:p-6">
          <div className="flex items-center gap-2 mb-4">
            <Activity className="text-emerald-700" size={22} />
            <h2 className="text-lg font-bold">Lịch sử khám và điều trị</h2>
          </div>

          <p className="text-xs text-slate-500 mb-4">
            Chỉ hiển thị hồ sơ đã được thú y cập nhật và quản lý xác nhận.
          </p>

          {healthRecords.length > 0 ? (
            <div className="space-y-4">
              {healthRecords.map((record, index) => (
                <div
                  key={`${record.examinationDate}-${index}`}
                  className="border border-slate-200 rounded-xl p-4"
                >
                  <div className="flex flex-wrap justify-between gap-2">
                    <h3 className="font-semibold">
                      {record.diagnosis || 'Thông tin khám sức khỏe'}
                    </h3>
                    <span className="text-xs text-slate-500">
                      {formatDate(record.examinationDate)}
                    </span>
                  </div>

                  {record.treatment && (
                    <p className="text-sm mt-3">
                      <span className="text-slate-500">Phương pháp điều trị: </span>
                      {record.treatment}
                    </p>
                  )}

                  {record.medicine && (
                    <p className="text-sm mt-2">
                      <span className="text-slate-500">Thuốc sử dụng: </span>
                      {record.medicine}
                    </p>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4 text-sm">
                    <div>
                      <p className="text-slate-500">Thời gian điều trị</p>
                      <p className="font-medium mt-1">
                        {formatDate(record.treatmentStartDate)}
                        {' – '}
                        {formatDate(record.treatmentEndDate)}
                      </p>
                    </div>

                    <div>
                      <p className="text-slate-500">Ngày tái khám</p>
                      <p className="font-medium mt-1">
                        {formatDate(record.followUpDate)}
                      </p>
                    </div>

                    <div>
                      <p className="text-slate-500">Thời gian ngừng thuốc</p>
                      <p className="font-medium mt-1">
                        {record.withdrawalPeriodDays != null
                          ? `${record.withdrawalPeriodDays} ngày`
                          : 'Không có thông tin'}
                      </p>
                    </div>

                    <div>
                      <p className="text-slate-500">Kết thúc ngừng thuốc</p>
                      <p className="font-medium mt-1">
                        {formatDate(record.withdrawalEndDate)}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                    <span className="text-xs text-slate-500">
                      Trạng thái ngừng thuốc
                    </span>
                    <span className="text-xs font-semibold text-emerald-700">
                      {getWithdrawalStatus(record.withdrawalStatus)}
                    </span>
                  </div>

                  <div className="mt-2 flex items-center gap-1.5 text-xs text-emerald-700">
                    <CheckCircle2 size={15} />
                    Hồ sơ đã được xác nhận
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-500">
              Chưa có hồ sơ sức khỏe đã được xác nhận để công khai.
            </p>
          )}
        </section>

        {/* Lịch sử tiêm phòng */}
        <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 sm:p-6">
          <div className="flex items-center gap-2 mb-4">
            <Syringe className="text-emerald-700" size={22} />
            <h2 className="text-lg font-bold">Lịch sử tiêm phòng</h2>
          </div>

          <p className="text-xs text-slate-500 mb-4">
            Lịch sử tiêm phòng được ghi nhận trên hệ thống trang trại.
          </p>

          {vaccinations.length > 0 ? (
            <div className="space-y-3">
              {vaccinations.map((item, index) => (
                <div
                  key={`${item.vaccineName}-${item.vaccinationDate}-${index}`}
                  className="border border-slate-200 rounded-xl p-4"
                >
                  <div className="flex flex-wrap justify-between gap-2">
                    <h3 className="font-semibold">
                      {item.vaccineName || 'Vaccine'}
                    </h3>
                    <span className="text-xs text-slate-500">
                      {formatDate(item.vaccinationDate)}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3 text-sm">
                    <div>
                      <p className="text-slate-500">Loại vaccine</p>
                      <p className="font-medium mt-1">
                        {item.vaccineType || 'Chưa cập nhật'}
                      </p>
                    </div>

                    <div>
                      <p className="text-slate-500">Ngày tiêm nhắc lại</p>
                      <p className="font-medium mt-1">
                        {formatDate(item.nextVaccinationDate)}
                      </p>
                    </div>

                    <div>
                      <p className="text-slate-500">Số lô</p>
                      <p className="font-medium mt-1">
                        {item.batchNumber || 'Chưa cập nhật'}
                      </p>
                    </div>

                    <div>
                      <p className="text-slate-500">Nhà sản xuất</p>
                      <p className="font-medium mt-1">
                        {item.manufacturer || 'Chưa cập nhật'}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-500">
              Chưa có lịch sử tiêm phòng được ghi nhận.
            </p>
          )}
        </section>

        {/* Thông tin cuối trang */}
        <div className="text-center py-4">
          <div className="inline-flex items-center gap-2 text-sm text-emerald-700 font-semibold">
            <ShieldCheck size={18} />
            Thông tin truy xuất từ hệ thống BovSmart
          </div>
          <p className="text-xs text-slate-400 mt-2">
            Dữ liệu phản ánh thông tin được ghi nhận trên hệ thống tại thời điểm truy cập.
          </p>
        </div>
      </main>
    </div>
  );
};

export default CattleTracePage;
