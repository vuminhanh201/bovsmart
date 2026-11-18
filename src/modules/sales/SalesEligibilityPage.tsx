
import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFarmStore } from '../../store/useFarmStore';
import { useAuthStore } from '../../store/useAuthStore';
import { getCattleImageUrlApi } from '../../services/fileService';
import {
  getCattleSaleEligibilityApi,
  SaleEligibilityResponse,
} from '../../services/cattleService';
import {
  BadgeDollarSign,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Sparkles,
  Search,
  RefreshCw,
} from 'lucide-react';

const DEFAULT_PRICE_PER_KG = 92000;

interface EvaluatedCattle {
  cow: any;
  eligibility: SaleEligibilityResponse | null;
  loading: boolean;
  error: string | null;
  estimatedValue: number;
}

export const SalesEligibilityPage: React.FC = () => {
  const navigate = useNavigate();
  const { cattle, addToast, fetchCattle } = useFarmStore();
  const { currentUser } = useAuthStore();
  const canCreateSalesOrder = currentUser.role === 'STAFF' ||
    currentUser.role === 'FARM_MANAGER';

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [eligibilityMap, setEligibilityMap] = useState<
    Record<string, SaleEligibilityResponse>
  >({});
  const [loadingIds, setLoadingIds] = useState<string[]>([]);
  const [errorMap, setErrorMap] = useState<Record<string, string>>({});
  const [minioImageUrls, setMinioImageUrls] = useState<
    Record<string, string | null>
  >({});

  useEffect(() => {
    fetchCattle().catch((error) => {
      console.error('Không thể tải danh sách bò từ MongoDB:', error);

      addToast(
        'error',
        'Lỗi tải danh sách bò',
        error instanceof Error
          ? error.message
          : 'Không thể tải dữ liệu bò từ máy chủ.'
      );
    });
  }, [fetchCattle, addToast]);

  useEffect(() => {
    let cancelled = false;

    const fileIds = Array.from(
      new Set(
        cattle
          .map((cow) =>
            cow.photoUrl?.startsWith('minio:')
              ? cow.photoUrl.slice(6)
              : ''
          )
          .filter(Boolean)
      )
    ).filter((id) => !(id in minioImageUrls));

    if (fileIds.length === 0) return;

    const loadImages = async () => {
      const results = await Promise.all(
        fileIds.map(async (id) => {
          try {
            const response = await getCattleImageUrlApi(id);
            return [id, response.url] as const;
          } catch (error) {
            console.error(`Không thể tải ảnh MinIO ${id}:`, error);
            return [id, null] as const;
          }
        })
      );

      if (cancelled) return;

      setMinioImageUrls((prev) => ({
        ...prev,
        ...Object.fromEntries(results),
      }));
    };

    loadImages();

    return () => {
      cancelled = true;
    };
  }, [cattle, minioImageUrls]);

  const loadEligibility = async () => {
    setLoadingIds(cattle.map((cow) => cow.id));
    setErrorMap({});

    const results = await Promise.all(
      cattle.map(async (cow) => {
        try {
          const result = await getCattleSaleEligibilityApi(cow.id);
          return { id: cow.id, result, error: null };
        } catch (error) {
          return {
            id: cow.id,
            result: null,
            error:
              error instanceof Error
                ? error.message
                : 'Không thể kiểm tra điều kiện xuất bán.',
          };
        }
      })
    );

    const nextEligibility: Record<string, SaleEligibilityResponse> = {};
    const nextErrors: Record<string, string> = {};

    results.forEach(({ id, result, error }) => {
      if (result) {
        nextEligibility[id] = result;
      } else if (error) {
        nextErrors[id] = error;
      }
    });

    setEligibilityMap(nextEligibility);
    setErrorMap(nextErrors);
    setLoadingIds([]);
  };

  useEffect(() => {
    loadEligibility();
    // Chỉ tải lại khi danh sách bò thay đổi.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cattle]);

  const evaluatedCattle: EvaluatedCattle[] = useMemo(
    () =>
      cattle.map((cow) => ({
        cow,
        eligibility: eligibilityMap[cow.id] || null,
        loading: loadingIds.includes(cow.id),
        error: errorMap[cow.id] || null,
        estimatedValue: cow.weight * DEFAULT_PRICE_PER_KG,
      })),
    [cattle, eligibilityMap, loadingIds, errorMap]
  );

  const eligibleCows = evaluatedCattle.filter(
    (item) => item.eligibility?.eligible === true
  );

  const totalWeight = eligibleCows.reduce(
    (sum, item) => sum + item.eligibility!.currentWeight,
    0
  );

  const totalValue = eligibleCows.reduce(
    (sum, item) =>
      sum + item.eligibility!.currentWeight * DEFAULT_PRICE_PER_KG,
    0
  );

  const filtered = evaluatedCattle.filter(({ cow }) => {
    const keyword = searchTerm.toLowerCase();

    return (
      cow.id.toLowerCase().includes(keyword) ||
      cow.name.toLowerCase().includes(keyword) ||
      cow.rfidTag.toLowerCase().includes(keyword)
    );
  });

  const toggleSelect = (id: string) => {
    if (!canCreateSalesOrder) {
      addToast(
        'warning',
        'Không có quyền thao tác',
        'ADMIN chỉ được xem kết quả kiểm tra điều kiện xuất bán.'
      );
      return;
    }

    const eligibility = eligibilityMap[id];

    if (!eligibility?.eligible || loadingIds.includes(id) || errorMap[id]) {
      addToast(
        'warning',
        'Không thể chọn bò',
        'Bò chưa đáp ứng đầy đủ điều kiện xuất bán hoặc chưa kiểm tra xong.'
      );
      return;
    }

    setSelectedIds((prev) =>
      prev.includes(id)
        ? prev.filter((item) => item !== id)
        : [...prev, id]
    );
  };

  const selectAllEligible = () => {
    if (!canCreateSalesOrder) return;

    setSelectedIds(
      eligibleCows
        .filter(
          (item) =>
            !item.loading &&
            !item.error &&
            item.eligibility?.eligible === true
        )
        .map((item) => item.cow.id)
    );
  };

  const handleCreateOrderWithSelected = () => {
    if (!canCreateSalesOrder) {
      addToast(
        'warning',
        'Không có quyền lập phiếu',
        'Chỉ STAFF và FARM_MANAGER được lập phiếu xuất bán.'
      );
      return;
    }

    if (loadingIds.length > 0) {
      addToast(
        'warning',
        'Đang kiểm tra dữ liệu',
        'Vui lòng chờ hệ thống kiểm tra điều kiện xuất bán.'
      );
      return;
    }

    if (selectedIds.length === 0) {
      addToast(
        'warning',
        'Chưa chọn bò',
        'Vui lòng chọn ít nhất một cá thể bò đủ điều kiện xuất bán!'
      );
      return;
    }

    const invalidIds = selectedIds.filter(
      (id) => eligibilityMap[id]?.eligible !== true
    );

    if (invalidIds.length > 0) {
      addToast(
        'error',
        'Điều kiện xuất bán đã thay đổi',
        'Vui lòng kiểm tra lại danh sách bò trước khi lập phiếu.'
      );
      setSelectedIds([]);
      loadEligibility();
      return;
    }

    navigate('/sales/orders', {
      state: { preSelectedIds: selectedIds },
    });
  };


  const getWithdrawalLabel = (status: string) => {
    switch (status) {
      case 'WAITING':
        return 'Đang chờ hết thời gian ngừng thuốc';
      case 'COMPLETED':
        return 'Đã xác nhận hoàn thành';
      case 'NO_WITHDRAWAL_REQUIRED':
        return 'Đã xác nhận không cần ngừng thuốc';
      default:
        return 'Chưa xác nhận hồ sơ thuốc';
    }
  };

  const getCattleImageSrc = (cow: any): string => {
    const photoUrl = cow.photoUrl?.trim();

    if (!photoUrl) {
      return '/assets/aiStudio/cattle-default.png';
    }

    if (photoUrl.startsWith('minio:')) {
      const fileId = photoUrl.slice(6);
      return (
        minioImageUrls[fileId] ||
        '/assets/aiStudio/cattle-default.png'
      );
    }

    return photoUrl;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900">
              Danh Sách Bò & Điều Kiện Xuất Bán
            </h1>
            <span className="text-xs bg-emerald-50 text-emerald-800 border border-emerald-200 px-2.5 py-0.5 rounded-full font-bold">
              {eligibleCows.length} con đủ chuẩn
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Kết quả được lấy trực tiếp từ hệ thống kiểm tra điều kiện xuất bán.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadEligibility}
            disabled={loadingIds.length > 0}
            className="px-3.5 py-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl flex items-center gap-2 disabled:opacity-50"
          >
            <RefreshCw className="w-4 h-4" />
            Làm mới
          </button>

          {canCreateSalesOrder && (
            <>
              <button
                onClick={selectAllEligible}
                className="px-3.5 py-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl"
              >
                Chọn tất cả ({eligibleCows.length})
              </button>

              <button
                onClick={handleCreateOrderWithSelected}
                disabled={selectedIds.length === 0}
                className={`px-4 py-2 font-bold text-xs rounded-xl flex items-center gap-1.5 ${
                  selectedIds.length > 0
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                }`}
              >
                <BadgeDollarSign className="w-4 h-4" />
                Lập Phiếu Xuất Bán ({selectedIds.length} con)
              </button>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200">
          <span className="text-xs font-semibold text-slate-500">
            Cá thể sẵn sàng xuất bán
          </span>
          <div className="text-2xl font-extrabold text-emerald-700 mt-1">
            {eligibleCows.length} cá thể bò
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200">
          <span className="text-xs font-semibold text-slate-500">
            Tổng trọng lượng thương phẩm
          </span>
          <div className="text-2xl font-extrabold text-slate-900 mt-1">
            {totalWeight.toLocaleString('vi-VN')} kg
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200">
          <span className="text-xs font-semibold text-slate-500">
            Giá trị thương phẩm ước tính
          </span>
          <div className="text-2xl font-extrabold text-indigo-950 mt-1">
            {totalValue.toLocaleString('vi-VN')} đ
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Đơn giá tham chiếu: 92.000 đ/kg
          </p>
        </div>
      </div>

      <div className="bg-white p-4 rounded-2xl border border-slate-200">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Tìm theo mã bò, RFID hoặc tên..."
            className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold">
                <th className="py-3 px-4">Chọn</th>
                <th className="py-3 px-4">Cá thể bò</th>
                <th className="py-3 px-4">Trọng lượng / Mục tiêu</th>
                <th className="py-3 px-4">Cân nặng</th>
                <th className="py-3 px-4">Ngừng thuốc</th>
                <th className="py-3 px-4">Sức khỏe</th>
                <th className="py-3 px-4">Kết luận</th>
                <th className="py-3 px-4 text-right">Ước tính giá trị</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {filtered.map(
                ({ cow, eligibility, loading, error, estimatedValue }) => {
                  const isChecked = selectedIds.includes(cow.id);
                  const isEligible = eligibility?.eligible === true;

                  return (
                    <tr
                      key={cow.id}
                      className={`hover:bg-slate-50 ${
                        isChecked ? 'bg-emerald-50/40' : ''
                      }`}
                    >
                      <td className="py-3.5 px-4 text-center">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleSelect(cow.id)}
                          disabled={
                            !canCreateSalesOrder ||
                            !isEligible ||
                            loading ||
                            !!error
                          }
                          className="rounded w-4 h-4 text-emerald-600"
                        />
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={getCattleImageSrc(cow)}
                            alt={cow.name}
                            className="w-10 h-10 rounded-xl object-cover ring-1 ring-slate-200"
                            onError={(e) => {
                              e.currentTarget.src = '/assets/aiStudio/cattle-default.png';
                            }}
                          />
                          <div>
                            <span className="font-bold text-slate-900 block">
                              {cow.name}
                            </span>
                            <span className="text-[11px] font-mono text-slate-500">
                              {cow.earTagNumber} • {cow.breed}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 font-mono">
                        <span className="font-extrabold text-sm text-slate-900">
                          {eligibility
                            ? `${eligibility.currentWeight} kg`
                            : `${cow.weight} kg`}
                        </span>
                        <span className="text-[10px] text-slate-400 block">
                          Mục tiêu: {cow.targetMarketWeight} kg
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        {loading ? (
                          <span>Đang kiểm tra...</span>
                        ) : error ? (
                          <span className="text-rose-600">Lỗi kiểm tra</span>
                        ) : eligibility?.weightEligible ? (
                          <span className="text-emerald-700 font-bold flex items-center gap-1">
                            <CheckCircle2 className="w-4 h-4" />
                            Đạt chuẩn
                          </span>
                        ) : (
                          <span className="text-rose-600 font-semibold flex items-center gap-1">
                            <XCircle className="w-4 h-4" />
                            Thiếu{' '}
                            {Math.max(
                              0,
                              (eligibility?.targetMarketWeight ??
                                cow.targetMarketWeight) -
                                (eligibility?.currentWeight ?? cow.weight)
                            )}{' '}
                            kg
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 min-w-52">
                        {loading ? (
                          <span className="text-slate-400">Đang kiểm tra...</span>
                        ) : error ? (
                          <span className="text-rose-600">{error}</span>
                        ) : (
                          <>
                            <span
                              className={`font-bold flex items-center gap-1 ${
                                eligibility?.withdrawalEligible
                                  ? 'text-emerald-700'
                                  : 'text-rose-600'
                              }`}
                            >
                              {eligibility?.withdrawalEligible ? (
                                <CheckCircle2 className="w-4 h-4" />
                              ) : (
                                <AlertTriangle className="w-4 h-4" />
                              )}
                              {getWithdrawalLabel(
                                eligibility?.withdrawalStatus || ''
                              )}
                            </span>

                            {eligibility?.withdrawalEndDate && (
                              <span className="block text-[10px] text-slate-500 mt-1">
                                Ngày kết thúc:{' '}
                                {eligibility.withdrawalEndDate}
                              </span>
                            )}
                          </>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        {eligibility?.statusEligible ? (
                          <span className="text-emerald-700 flex items-center gap-1">
                            <CheckCircle2 className="w-4 h-4" />
                            Đạt
                          </span>
                        ) : (
                          <span className="text-rose-600 flex items-center gap-1">
                            <XCircle className="w-4 h-4" />
                            {eligibility?.status || cow.status}
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 min-w-64">
                        {loading ? (
                          <span className="text-slate-400">
                            Đang tải kết quả...
                          </span>
                        ) : error ? (
                          <span className="text-rose-600">{error}</span>
                        ) : isEligible ? (
                          <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 font-bold rounded-full flex items-center gap-1 w-max">
                            <Sparkles className="w-3 h-3" />
                            ĐỦ ĐIỀU KIỆN
                          </span>
                        ) : (
                          <div>
                            <span className="px-2 py-1 bg-rose-50 text-rose-700 font-semibold rounded-full border border-rose-200">
                              Chưa đủ điều kiện
                            </span>
                            <p className="text-[10px] text-rose-600 mt-1 max-w-xs whitespace-normal">
                              {eligibility?.message}
                            </p>
                          </div>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900">
                        {estimatedValue.toLocaleString('vi-VN')} đ
                      </td>
                    </tr>
                  );
                }
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
