
import React, { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useFarmStore } from '../../store/useFarmStore';
import { useAuthStore } from '../../store/useAuthStore';
import { SalesOrder } from '../../types';
import {
  getCattleSaleEligibilityApi,
  SaleEligibilityResponse,
} from '../../services/cattleService';
import {
  FileSpreadsheet,
  Plus,
  CheckCircle2,
  Printer,
  ShieldCheck,
  X,
  Sparkles,
} from 'lucide-react';

export const SalesOrderPage: React.FC = () => {
  const location = useLocation();

  const preSelected: string[] =
    (location.state as { preSelectedIds?: string[] } | null)
      ?.preSelectedIds || [];

  const {
    salesOrders,
    cattle,
    createSalesOrder,
    approveSalesOrder,
    fetchSalesOrders,
    addToast,
  } = useFarmStore();

  const { currentUser } = useAuthStore();

  // Quyền thao tác
  const canCreateSalesOrder =
    currentUser.role === 'STAFF' ||
    currentUser.role === 'FARM_MANAGER';

  const canApproveSalesOrder =
    currentUser.role === 'FARM_MANAGER';

  // Danh sách khách hàng đã từng giao dịch.
  // Nếu một khách có nhiều phiếu, lấy thông tin từ phiếu gần nhất trong danh sách.
  const existingBuyers = useMemo(() => {
    const buyerMap = new Map<string, SalesOrder>();

    salesOrders.forEach((order) => {
      const name = order.buyerName?.trim();

      if (name) {
        buyerMap.set(name.toLowerCase(), order);
      }
    });

    return Array.from(buyerMap.values());
  }, [salesOrders]);

  // Danh sách doanh nghiệp từng giao dịch
  const buyerCompanySuggestions = useMemo(() => {
    return Array.from(
      new Set(
        salesOrders
          .map((order) => order.buyerCompany?.trim())
          .filter((company): company is string => Boolean(company))
      )
    );
  }, [salesOrders]);

  // Trạng thái modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(
    preSelected.length > 0 && canCreateSalesOrder
  );

  const [selectedOrderForInvoice, setSelectedOrderForInvoice] =
    useState<SalesOrder | null>(null);

  // Dữ liệu kiểm tra điều kiện xuất bán từ backend
  const [saleEligibility, setSaleEligibility] = useState<
    Record<string, SaleEligibilityResponse>
  >({});

  const [isCheckingEligibility, setIsCheckingEligibility] =
    useState(false);

  const [eligibilityError, setEligibilityError] = useState('');

  // Form lập phiếu
  const [formData, setFormData] = useState({
    buyerName: '',
    buyerPhone: '',
    buyerCompany: '',
    selectedCattleIds: preSelected,
    pricePerKgVND: 92000,
    paymentStatus: 'PARTIAL' as SalesOrder['paymentStatus'],
    notes: '',
  });

  // Tải danh sách phiếu xuất bán từ backend
  useEffect(() => {
    fetchSalesOrders().catch((error) => {
      console.error('Lỗi tải danh sách phiếu xuất bán:', error);

      addToast(
        'error',
        'Không thể tải dữ liệu',
        'Không tải được danh sách phiếu xuất bán từ máy chủ.'
      );
    });
  }, [fetchSalesOrders, addToast]);

  // Kiểm tra điều kiện xuất bán của từng cá thể
  useEffect(() => {
    if (!isAddModalOpen || cattle.length === 0) {
      return;
    }

    let cancelled = false;

    const checkEligibility = async () => {
      setIsCheckingEligibility(true);
      setEligibilityError('');
      setSaleEligibility({});

      const eligibilityMap: Record<
        string,
        SaleEligibilityResponse
      > = {};

      const failedCattleIds: string[] = [];

      try {
        for (const cow of cattle) {
          if (cancelled) return;

          try {
            const result = await getCattleSaleEligibilityApi(cow.id);

            if (
              result &&
              result.cattleId === cow.id &&
              typeof result.eligible === 'boolean'
            ) {
              eligibilityMap[cow.id] = result;
            } else {
              failedCattleIds.push(cow.id);
            }
          } catch (error) {
            console.error(
              `Không kiểm tra được điều kiện bò ${cow.id}:`,
              error
            );

            failedCattleIds.push(cow.id);
          }
        }

        if (cancelled) return;

        setSaleEligibility(eligibilityMap);

        if (Object.keys(eligibilityMap).length === 0) {
          setEligibilityError(
            'Máy chủ không trả về kết quả kiểm tra hợp lệ. Vui lòng kiểm tra đăng nhập và API điều kiện xuất bán.'
          );

          setFormData((prev) => ({
            ...prev,
            selectedCattleIds: [],
          }));

          return;
        }

        // Chỉ giữ lại bò được backend xác nhận đủ điều kiện
        setFormData((prev) => ({
          ...prev,
          selectedCattleIds: prev.selectedCattleIds.filter(
            (id) => eligibilityMap[id]?.eligible === true
          ),
        }));

        if (failedCattleIds.length > 0) {
          console.warn(
            'Các cá thể chưa kiểm tra được:',
            failedCattleIds
          );
        }
      } catch (error) {
        console.error(
          'Lỗi kiểm tra điều kiện xuất bán:',
          error
        );

        if (!cancelled) {
          setEligibilityError(
            'Đã xảy ra lỗi khi kiểm tra điều kiện xuất bán.'
          );
        }
      } finally {
        if (!cancelled) {
          setIsCheckingEligibility(false);
        }
      }
    };

    checkEligibility();

    return () => {
      cancelled = true;
    };
  }, [cattle, isAddModalOpen]);

  // Danh sách bò đủ điều kiện do backend xác nhận
  const eligibleCows = cattle.filter(
    (cow) => saleEligibility[cow.id]?.eligible === true
  );

  // Danh sách bò đã chọn
  const selectedCowsList = cattle.filter((cow) =>
    formData.selectedCattleIds.includes(cow.id)
  );

  const totalWeightKg = selectedCowsList.reduce(
    (sum, cow) => sum + cow.weight,
    0
  );

  const totalRevenueVND =
    totalWeightKg * formData.pricePerKgVND;

  // Khi nhập/chọn tên khách hàng
  const handleBuyerNameChange = (value: string) => {
    const matchedBuyer = existingBuyers.find(
      (order) =>
        order.buyerName?.trim().toLowerCase() ===
        value.trim().toLowerCase()
    );

    setFormData((prev) => ({
      ...prev,
      buyerName: value,
      buyerPhone: matchedBuyer ? matchedBuyer.buyerPhone || '' : '',
      buyerCompany: matchedBuyer ? matchedBuyer.buyerCompany || '' : '',
    }));
  };

  // Tạo phiếu xuất bán
  const handleCreateOrder = async (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();

    if (!canCreateSalesOrder) {
      addToast(
        'error',
        'Không có quyền',
        'Bạn không có quyền lập phiếu xuất bán.'
      );
      return;
    }

    if (isCheckingEligibility) {
      addToast(
        'warning',
        'Đang kiểm tra',
        'Vui lòng chờ hệ thống kiểm tra điều kiện xuất bán.'
      );
      return;
    }

    if (eligibilityError) {
      addToast(
        'error',
        'Chưa xác minh được điều kiện',
        'Không thể tạo phiếu khi máy chủ chưa xác nhận điều kiện xuất bán.'
      );
      return;
    }

    if (formData.selectedCattleIds.length === 0) {
      addToast(
        'warning',
        'Chưa chọn bò',
        'Vui lòng chọn ít nhất một cá thể bò đủ điều kiện xuất bán.'
      );
      return;
    }

    const allSelectedEligible = formData.selectedCattleIds.every(
      (id) => saleEligibility[id]?.eligible === true
    );

    if (!allSelectedEligible) {
      addToast(
        'error',
        'Bò chưa đủ điều kiện',
        'Có cá thể chưa được backend xác nhận đủ điều kiện xuất bán.'
      );
      return;
    }

    if (!formData.buyerName.trim()) {
      addToast(
        'warning',
        'Thiếu thông tin',
        'Vui lòng nhập tên khách hàng.'
      );
      return;
    }

    if (!formData.buyerPhone.trim()) {
      addToast(
        'warning',
        'Thiếu thông tin',
        'Vui lòng nhập số điện thoại khách hàng.'
      );
      return;
    }

    if (!formData.buyerCompany.trim()) {
      addToast(
        'warning',
        'Thiếu thông tin',
        'Vui lòng chọn hoặc nhập đơn vị/doanh nghiệp thu mua.'
      );
      return;
    }

    if (
      !Number.isFinite(formData.pricePerKgVND) ||
      formData.pricePerKgVND <= 0
    ) {
      addToast(
        'warning',
        'Đơn giá không hợp lệ',
        'Đơn giá phải lớn hơn 0.'
      );
      return;
    }

    try {
      await createSalesOrder(
        {
          buyerName: formData.buyerName.trim(),
          buyerPhone: formData.buyerPhone.trim(),
          buyerCompany: formData.buyerCompany.trim(),
          selectedCattleIds: formData.selectedCattleIds,
          totalHeads: formData.selectedCattleIds.length,
          totalWeightKg,
          pricePerKgVND: formData.pricePerKgVND,
          totalRevenueVND,
          paymentStatus: formData.paymentStatus,
          notes: formData.notes,
        },
        currentUser.name,
        currentUser.role
      );

      setIsAddModalOpen(false);

      setFormData({
        buyerName: '',
        buyerPhone: '',
        buyerCompany: '',
        selectedCattleIds: [],
        pricePerKgVND: 92000,
        paymentStatus: 'PARTIAL',
        notes: '',
      });
    } catch (error) {
      console.error('Không thể tạo phiếu xuất bán:', error);
    }
  };

  // Phê duyệt phiếu xuất bán
  const handleApprove = (order: SalesOrder) => {
    if (!canApproveSalesOrder) {
      addToast(
        'error',
        'Chưa có quyền',
        'Chỉ FARM_MANAGER được phép phê duyệt phiếu xuất bán.'
      );
      return;
    }

    approveSalesOrder(
      order.id,
      currentUser.name,
      currentUser.role
    );
  };

  // Đóng modal lập phiếu
  const handleCloseCreateModal = () => {
    setIsAddModalOpen(false);
  };

  // Mở modal lập phiếu
  const handleOpenCreateModal = () => {
    if (!canCreateSalesOrder) {
      addToast(
        'error',
        'Không có quyền',
        'Bạn không có quyền lập phiếu xuất bán.'
      );
      return;
    }

    setEligibilityError('');
    setSaleEligibility({});
    setFormData((prev) => ({
      ...prev,
      buyerName: '',
      buyerPhone: '',
      buyerCompany: '',
      selectedCattleIds: [],
      notes: '',
    }));
    setIsAddModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900">
              Phiếu Xuất Bán Bò & Chi Tiết Giao Dịch
            </h1>

            <span className="text-xs bg-indigo-50 text-indigo-700 border border-indigo-200 px-2.5 py-0.5 rounded-full font-bold">
              {salesOrders.length} phiếu
            </span>
          </div>

          <p className="text-xs text-slate-500 mt-0.5">
            Lập phiếu xuất bán, kiểm tra điều kiện và chờ quản lý phê duyệt.
          </p>
        </div>

        {canCreateSalesOrder && (
          <button
            onClick={handleOpenCreateModal}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition-all shadow-md shadow-emerald-600/20 flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Lập Phiếu Xuất Mới</span>
          </button>
        )}
      </div>

      {/* Danh sách phiếu xuất bán */}
      <div className="space-y-4">
        {salesOrders.length === 0 ? (
          <div className="bg-white rounded-3xl border border-slate-200 p-10 text-center">
            <FileSpreadsheet className="w-10 h-10 text-slate-300 mx-auto mb-3" />

            <p className="font-semibold text-slate-700">
              Chưa có phiếu xuất bán
            </p>

            <p className="text-xs text-slate-500 mt-1">
              Các phiếu xuất bán được tạo sẽ hiển thị tại đây.
            </p>
          </div>
        ) : (
          salesOrders.map((order) => {
            const isApproved =
              order.status === 'APPROVED' ||
              order.status === 'COMPLETED';

            const isPending =
              order.status === 'PENDING_APPROVAL';

            return (
              <div
                key={order.id}
                className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs hover:border-slate-300 transition-all space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                      <FileSpreadsheet className="w-5 h-5" />
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-slate-900 text-sm font-mono">
                          {order.orderNumber}
                        </span>

                        <span
                          className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                            isApproved
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                              : isPending
                                ? 'bg-amber-50 text-amber-800 border-amber-200'
                                : 'bg-rose-50 text-rose-800 border-rose-200'
                          }`}
                        >
                          {isApproved
                            ? 'ĐÃ PHÊ DUYỆT'
                            : isPending
                              ? 'CHỜ QUẢN LÝ DUYỆT'
                              : order.status}
                        </span>
                      </div>

                      <span className="text-[11px] text-slate-400 font-mono">
                        Tạo lúc: {order.createdAt}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setSelectedOrderForInvoice(order)}
                      className="px-3 py-1.5 border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl transition-colors flex items-center gap-1"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>Xem Phiếu</span>
                    </button>

                    {canApproveSalesOrder && isPending && (
                      <button
                        onClick={() => handleApprove(order)}
                        className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1 cursor-pointer"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Phê Duyệt Xuất Bán</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Nội dung phiếu */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                  <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block">
                      Khách hàng / Thương lái:
                    </span>

                    <p className="font-bold text-slate-900">
                      {order.buyerName}
                    </p>

                    <p className="text-slate-600">
                      {order.buyerCompany || 'Chưa có thông tin đơn vị'}
                    </p>

                    <p className="text-slate-500 font-mono">
                      {order.buyerPhone || 'Chưa có số điện thoại'}
                    </p>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block">
                      Quy mô lô xuất:
                    </span>

                    <p className="font-bold text-slate-900 font-mono">
                      {order.totalHeads} con (
                      {order.totalWeightKg.toLocaleString('vi-VN')} kg)
                    </p>

                    <p className="text-slate-600 font-mono">
                      Đơn giá:{' '}
                      {order.pricePerKgVND.toLocaleString('vi-VN')} đ/kg
                    </p>

                    <div className="flex flex-wrap gap-1 pt-1">
                      {order.selectedCattleIds.map((cattleId) => (
                        <span
                          key={cattleId}
                          className="font-mono text-[10px] bg-white px-1.5 py-0.5 rounded border"
                        >
                          {cattleId}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="p-3 bg-emerald-50/60 rounded-2xl border border-emerald-200/80 space-y-1 text-right sm:text-left">
                    <span className="text-[10px] text-emerald-800 uppercase font-semibold block">
                      Tổng Giá Trị Phiếu:
                    </span>

                    <div className="text-xl font-extrabold text-emerald-900 font-mono">
                      {order.totalRevenueVND.toLocaleString('vi-VN')}{' '}
                      <span className="text-xs font-sans text-emerald-700">
                        VND
                      </span>
                    </div>

                    <span className="text-[10px] font-bold text-slate-600 bg-white px-2 py-0.5 rounded border border-slate-200 inline-block">
                      Thanh toán: Chưa cập nhật
                    </span>
                  </div>
                </div>

                {order.approvedBy && (
                  <div className="p-3 bg-slate-50 rounded-xl flex items-center justify-between text-[11px] text-slate-500">
                    <span className="flex items-center gap-1.5 text-emerald-700 font-semibold">
                      <ShieldCheck className="w-4 h-4" />
                      Đã phê duyệt bởi: {order.approvedBy}
                      {order.approvalDate
                        ? ` lúc ${order.approvalDate}`
                        : ''}
                    </span>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Modal lập phiếu */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-100 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="font-bold text-base text-slate-900">
                Lập Phiếu Xuất Bán Bò Thương Phẩm
              </h3>

              <button
                onClick={handleCloseCreateModal}
                className="p-1 text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={handleCreateOrder}
              className="space-y-4 text-xs"
            >
              {/* Thông tin bên thu mua */}
              <div className="space-y-3">
                <h4 className="font-bold text-slate-800 text-sm">
                  Thông tin bên thu mua
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Tên khách hàng */}
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Tên khách hàng / Đại diện
                    </label>

                    <input
                      type="text"
                      list="buyer-name-list"
                      required
                      value={formData.buyerName}
                      onChange={(e) =>
                        handleBuyerNameChange(e.target.value)
                      }
                      placeholder="Chọn khách cũ hoặc nhập tên mới"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200"
                    />

                    <datalist id="buyer-name-list">
                      {existingBuyers.map((buyer) => (
                        <option
                          key={buyer.id}
                          value={buyer.buyerName}
                        />
                      ))}
                    </datalist>

                    <p className="text-[10px] text-slate-500 mt-1">
                      Chọn khách đã giao dịch hoặc nhập khách hàng mới.
                    </p>
                  </div>

                  {/* Số điện thoại */}
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Số điện thoại liên hệ
                    </label>

                    <input
                      type="tel"
                      required
                      value={formData.buyerPhone}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          buyerPhone: e.target.value,
                        }))
                      }
                      placeholder="Nhập số điện thoại liên hệ"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200"
                    />

                    <p className="text-[10px] text-slate-500 mt-1">
                      Tự điền khi chọn khách hàng đã từng giao dịch.
                    </p>
                  </div>
                </div>

                {/* Đơn vị thu mua */}
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Đơn vị / Doanh nghiệp thu mua
                  </label>

                  <input
                    type="text"
                    list="buyer-company-list"
                    required
                    value={formData.buyerCompany}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        buyerCompany: e.target.value,
                      }))
                    }
                    placeholder="Chọn hoặc nhập tên doanh nghiệp thu mua"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200"
                  />

                  <datalist id="buyer-company-list">
                    {buyerCompanySuggestions.map((company) => (
                      <option key={company} value={company} />
                    ))}
                  </datalist>

                  <p className="text-[10px] text-slate-500 mt-1">
                    Danh sách lấy từ các đơn vị đã từng giao dịch. Có thể nhập đơn vị mới.
                  </p>
                </div>
              </div>

              {/* Chọn bò đủ điều kiện */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Chọn cá thể xuất bán trong lô (
                  {formData.selectedCattleIds.length} đã chọn):
                </label>

                <div className="max-h-44 overflow-y-auto p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-1.5">
                  {isCheckingEligibility ? (
                    <p className="text-center text-slate-500 py-4">
                      Đang kiểm tra điều kiện xuất bán từ máy chủ...
                    </p>
                  ) : eligibilityError ? (
                    <p className="text-center text-rose-600 py-4">
                      {eligibilityError}
                    </p>
                  ) : eligibleCows.length === 0 ? (
                    <p className="text-center text-amber-600 py-4">
                      Không có cá thể bò nào đủ điều kiện xuất bán.
                    </p>
                  ) : (
                    eligibleCows.map((cow) => {
                      const isChecked =
                        formData.selectedCattleIds.includes(cow.id);

                      return (
                        <label
                          key={cow.id}
                          className={`flex items-center justify-between p-2 rounded-xl border cursor-pointer transition-colors ${
                            isChecked
                              ? 'bg-emerald-50 border-emerald-300'
                              : 'bg-white border-slate-200 hover:bg-slate-50'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={(e) => {
                                setFormData((prev) => ({
                                  ...prev,
                                  selectedCattleIds: e.target.checked
                                    ? [
                                        ...prev.selectedCattleIds,
                                        cow.id,
                                      ]
                                    : prev.selectedCattleIds.filter(
                                        (id) => id !== cow.id
                                      ),
                                }));
                              }}
                              className="rounded text-emerald-600 focus:ring-emerald-500"
                            />

                            <span className="font-bold text-slate-900">
                              {cow.name}
                            </span>

                            <span className="font-mono text-slate-500">
                              ({cow.id})
                            </span>

                            <span className="text-slate-400">
                              • {cow.breed}
                            </span>
                          </div>

                          <span className="font-mono font-bold text-emerald-700">
                            {cow.weight} kg
                          </span>
                        </label>
                      );
                    })
                  )}
                </div>

                <p className="text-[10px] text-slate-500 mt-1">
                  Danh sách chỉ hiển thị bò được máy chủ xác nhận đủ điều kiện
                  về trạng thái, khối lượng và thời gian ngừng thuốc.
                </p>
              </div>

              {/* Đơn giá */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Đơn giá thỏa thuận (VND/kg)
                </label>

                <input
                  type="number"
                  min={1}
                  step={1}
                  required
                  value={formData.pricePerKgVND}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      pricePerKgVND: Number(e.target.value),
                    }))
                  }
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 font-mono font-bold"
                />
              </div>

              {/* Tổng tiền */}
              <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-2xl flex items-center justify-between">
                <div>
                  <span className="text-[11px] text-emerald-800 font-medium block">
                    Tổng: {formData.selectedCattleIds.length} con •{' '}
                    {totalWeightKg.toLocaleString('vi-VN')} kg bò hơi
                  </span>

                  <span className="text-base font-extrabold text-emerald-950 font-mono">
                    {totalRevenueVND.toLocaleString('vi-VN')} VND
                  </span>
                </div>

                <span className="text-[10px] text-slate-600 text-right">
                  Phiếu sẽ chuyển FARM_MANAGER phê duyệt
                </span>
              </div>

              {/* Ghi chú */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Ghi chú phiếu xuất
                </label>

                <textarea
                  rows={2}
                  value={formData.notes}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      notes: e.target.value,
                    }))
                  }
                  className="w-full p-2.5 rounded-xl border border-slate-200"
                />
              </div>

              {/* Nút thao tác */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={handleCloseCreateModal}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 font-semibold"
                >
                  Hủy
                </button>

                <button
                  type="submit"
                  disabled={
                    isCheckingEligibility ||
                    !!eligibilityError ||
                    eligibleCows.length === 0
                  }
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-xl font-bold shadow-md shadow-emerald-600/20"
                >
                  Xác Nhận Tạo Phiếu Xuất
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal xem phiếu */}
      {selectedOrderForInvoice && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-emerald-600" />

                <span className="font-extrabold text-slate-900">
                  PHIẾU XUẤT BÁN BÒ THƯƠNG PHẨM
                </span>
              </div>

              <button
                onClick={() => setSelectedOrderForInvoice(null)}
                className="p-1 text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs space-y-2 font-mono">
              <div className="flex justify-between">
                <span>Số phiếu:</span>
                <strong>
                  {selectedOrderForInvoice.orderNumber}
                </strong>
              </div>

              <div className="flex justify-between">
                <span>Khách hàng:</span>
                <strong>
                  {selectedOrderForInvoice.buyerName}
                </strong>
              </div>

              <div className="flex justify-between">
                <span>Số điện thoại:</span>
                <strong>
                  {selectedOrderForInvoice.buyerPhone || 'Chưa cập nhật'}
                </strong>
              </div>

              <div className="flex justify-between">
                <span>Đơn vị:</span>
                <strong>
                  {selectedOrderForInvoice.buyerCompany ||
                    'Chưa cập nhật'}
                </strong>
              </div>

              <div className="flex justify-between">
                <span>Số lượng bò:</span>
                <strong>
                  {selectedOrderForInvoice.totalHeads} con
                </strong>
              </div>

              <div className="flex justify-between">
                <span>Tổng trọng lượng:</span>
                <strong>
                  {selectedOrderForInvoice.totalWeightKg} kg
                </strong>
              </div>

              <div className="flex justify-between">
                <span>Đơn giá:</span>
                <strong>
                  {selectedOrderForInvoice.pricePerKgVND.toLocaleString(
                    'vi-VN'
                  )}{' '}
                  đ/kg
                </strong>
              </div>

              <div className="flex justify-between pt-2 border-t border-slate-300 text-sm font-extrabold text-emerald-900">
                <span>TỔNG CỘNG:</span>

                <span>
                  {selectedOrderForInvoice.totalRevenueVND.toLocaleString(
                    'vi-VN'
                  )}{' '}
                  VND
                </span>
              </div>

              <div className="pt-2 border-t border-slate-200">
                Trạng thái:{' '}
                {selectedOrderForInvoice.status}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => window.print()}
                className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold flex items-center gap-1.5"
              >
                <Printer className="w-4 h-4" />
                In Phiếu Xuất
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
