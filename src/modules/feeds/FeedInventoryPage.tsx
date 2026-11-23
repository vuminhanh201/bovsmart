
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useFarmStore } from '../../store/useFarmStore';
import { useAuthStore } from '../../store/useAuthStore';
import type { FeedItem } from '../../types';
import {
  getAllFeedsApi,
  getAllFeedCategoriesApi,
  getAllFeedTransactionsApi,
  createFeedApi,
  updateFeedApi,
  deleteFeedApi,
  createFeedTransactionApi,
  approveFeedTransactionApi,
  rejectFeedTransactionApi,
  type BackendFeed,
  type BackendFeedCategory,
  type BackendFeedTransaction,
  type UpdateFeedRequest,
} from '../../services/feedService';
import {
  Wheat,
  Plus,
  AlertTriangle,
  ArrowDownLeft,
  ArrowUpRight,
  X,
  FileText,
  RefreshCw,
  CheckCircle,
  Ban,
  Clock,
} from 'lucide-react';

type FeedCategoryCode = FeedItem['category'];
type TransactionType = 'IMPORT' | 'EXPORT';
type UserRole = 'ADMIN' | 'FARM_MANAGER' | 'STAFF';

const CATEGORY_LABELS: Record<
  FeedCategoryCode,
  { label: string; color: string }
> = {
  ROUGHAGE: {
    label: 'Thức ăn thô xanh',
    color: 'bg-emerald-50 text-emerald-800',
  },
  CONCENTRATE: {
    label: 'Thức ăn tinh',
    color: 'bg-indigo-50 text-indigo-800',
  },
  MINERAL: {
    label: 'Khoáng vi lượng',
    color: 'bg-amber-50 text-amber-800',
  },
  SILAGE: {
    label: 'Ủ chua lên men',
    color: 'bg-sky-50 text-sky-800',
  },
};

const getCategoryCode = (value?: string): FeedCategoryCode => {
  const normalized = (value || '').toLowerCase();

  if (
    normalized.includes('concentrate') ||
    normalized.includes('tinh')
  ) {
    return 'CONCENTRATE';
  }

  if (
    normalized.includes('mineral') ||
    normalized.includes('khoáng')
  ) {
    return 'MINERAL';
  }

  if (
    normalized.includes('silage') ||
    normalized.includes('ủ chua')
  ) {
    return 'SILAGE';
  }

  return 'ROUGHAGE';
};

// Lấy ID thật của danh mục từ Backend/MongoDB.
const getCategoryValue = (category: BackendFeedCategory): string => {
  const item = category as unknown as Record<string, unknown>;

  return String(item.id ?? item.categoryId ?? '');
};

const getCategoryName = (category: BackendFeedCategory): string => {
  const item = category as unknown as Record<string, unknown>;

  return String(item.categoryName ?? item.name ?? '');
};

const formatDate = (value?: string) => {
  if (!value) return '-';

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleString('vi-VN');
};

const getErrorMessage = (error: unknown, fallback: string) => {
  return error instanceof Error ? error.message : fallback;
};

interface TransactionView {
  id: string;
  type: TransactionType;
  feedItemId: string;
  feedItemName: string;
  quantity: number;
  date: string;
  rawDate: string;
  performedBy: string;
  note: string;
  status: string;
  reviewedBy?: string;
  reviewNote?: string;
}

export const FeedInventoryPage: React.FC = () => {
  const { barns, addToast } = useFarmStore();
  const { currentUser } = useAuthStore();

  const role = currentUser.role as UserRole;
  const isAdmin = role === 'ADMIN';
  const isFarmManager = role === 'FARM_MANAGER';
  const canCreateTransaction = role === 'STAFF' || isFarmManager;
  const canManageFeed = isFarmManager;

  const [backendFeedItems, setBackendFeedItems] = useState<BackendFeed[]>([]);
  const [backendFeedCategories, setBackendFeedCategories] = useState<
    BackendFeedCategory[]
  >([]);
  const [backendFeedTransactions, setBackendFeedTransactions] = useState<
    BackendFeedTransaction[]
  >([]);

  const [isLoadingFeeds, setIsLoadingFeeds] = useState(true);
  const [isSavingFeed, setIsSavingFeed] = useState(false);
  const [isSavingTransaction, setIsSavingTransaction] = useState(false);
  const [processingTransactionId, setProcessingTransactionId] = useState<
    string | null
  >(null);

  const [isAddFeedModalOpen, setIsAddFeedModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [importSupplierOption, setImportSupplierOption] = useState('');
  const [newFeedSupplierOption, setNewFeedSupplierOption] = useState('');

  const [transactionSearch, setTransactionSearch] = useState('');
  const [transactionTypeFilter, setTransactionTypeFilter] = useState('ALL');
  const [transactionStatusFilter, setTransactionStatusFilter] = useState('ALL');
  const [transactionFromDate, setTransactionFromDate] = useState('');
  const [transactionToDate, setTransactionToDate] = useState('');

  const [isEditFeedModalOpen, setIsEditFeedModalOpen] = useState(false);
  const [editingFeedId, setEditingFeedId] = useState('');

  const [editFeed, setEditFeed] = useState({
    name: '',
    category: '',
    unit: 'kg',
    reorderLevel: 0,
    unitPrice: 0,
    supplier: '',
    status: 'ACTIVE',
  });

  const [importForm, setImportForm] = useState({
    feedItemId: '',
    quantity: 1000,
    date: new Date().toISOString().slice(0, 10),
    supplier: '',
    noteOption: '',
    note: '',
  });

  const [exportForm, setExportForm] = useState({
    feedItemId: '',
    quantity: 200,
    date: new Date().toISOString().slice(0, 10),
    purposeOption: '',
    purpose: '',
    penId: '',
    noteOption: '',
    note: '',
  });

  const [newFeed, setNewFeed] = useState({
    name: '',
    // Đây là ID danh mục thật trong MongoDB, không phải mã ROUGHAGE.
    category: '',
    stockQuantity: 5000,
    unit: 'kg',
    reorderLevel: 2000,
    unitPrice: 2000,
    supplier: '',
  });

  const loadFeedData = useCallback(async () => {
    try {
      setIsLoadingFeeds(true);

      const [feeds, categories, transactions] = await Promise.all([
        getAllFeedsApi(),
        getAllFeedCategoriesApi(),
        getAllFeedTransactionsApi(),
      ]);

      setBackendFeedItems(feeds || []);
      setBackendFeedCategories(categories || []);
      setBackendFeedTransactions(transactions || []);

      // Tự chọn danh mục đầu tiên nếu chưa có danh mục được chọn.
      const firstCategoryId =
        categories?.length > 0 ? getCategoryValue(categories[0]) : '';

      setNewFeed((previous) => ({
        ...previous,
        category: previous.category || firstCategoryId,
      }));
    } catch (error) {
      addToast(
        'error',
        'Lỗi tải dữ liệu',
        getErrorMessage(error, 'Không thể tải dữ liệu thức ăn!')
      );
    } finally {
      setIsLoadingFeeds(false);
    }
  }, [addToast]);

  useEffect(() => {
    void loadFeedData();
  }, [loadFeedData]);

  const feedItems: FeedItem[] = useMemo(
    () =>
      backendFeedItems.map((feed) => ({
        id: feed.id,
        name: feed.feedName,
        category: getCategoryCode(
          `${feed.categoryId || ''} ${feed.categoryName || ''}`
        ),
        stockQuantity: Number(feed.quantity || 0),
        unit: feed.unit,
        reorderLevel: Number(feed.minStock || 0),
        unitPrice: Number(feed.unitPrice || 0),
        lastRestocked: '',
        supplier: feed.description || 'Chưa cập nhật',
      })),
    [backendFeedItems]
  );

  const feedTransactions: TransactionView[] = useMemo(
    () =>
      backendFeedTransactions.map((tx) => ({
        id: tx.id,
        type: tx.transactionType,
        feedItemId: tx.feedId,
        feedItemName: tx.feedName,
        quantity: Number(tx.quantity || 0),
        date: formatDate(tx.transactionDate),
        rawDate: String(tx.transactionDate || ''),
        performedBy: tx.createdBy || '-',
        note: tx.note || '',
        status: tx.transactionStatus || 'PENDING',
        reviewedBy: tx.reviewedBy,
        reviewNote: tx.reviewNote,
      })),
    [backendFeedTransactions]
  );

  const filteredFeedTransactions = useMemo(() => {
    const keyword = transactionSearch.trim().toLowerCase();

    return feedTransactions.filter((tx) => {
      const matchesSearch =
        !keyword ||
        String(tx.id || '').toLowerCase().includes(keyword) ||
        String(tx.feedItemName || '').toLowerCase().includes(keyword) ||
        String(tx.performedBy || '').toLowerCase().includes(keyword) ||
        String(tx.note || '').toLowerCase().includes(keyword) ||
        (tx.reviewedBy || '').toLowerCase().includes(keyword) ||
        (tx.reviewNote || '').toLowerCase().includes(keyword);

      const matchesType =
        transactionTypeFilter === 'ALL' ||
        tx.type === transactionTypeFilter;

      const matchesStatus =
        transactionStatusFilter === 'ALL' ||
        tx.status === transactionStatusFilter;

      // transactionDate từ backend thường có định dạng ISO.
      const dateKey = tx.rawDate.slice(0, 10);

      const matchesFromDate =
        !transactionFromDate || dateKey >= transactionFromDate;

      const matchesToDate =
        !transactionToDate || dateKey <= transactionToDate;

      return (
        matchesSearch &&
        matchesType &&
        matchesStatus &&
        matchesFromDate &&
        matchesToDate
      );
    });
  }, [
    feedTransactions,
    transactionSearch,
    transactionTypeFilter,
    transactionStatusFilter,
    transactionFromDate,
    transactionToDate,
  ]);

  const resetTransactionFilters = () => {
    setTransactionSearch('');
    setTransactionTypeFilter('ALL');
    setTransactionStatusFilter('ALL');
    setTransactionFromDate('');
    setTransactionToDate('');
  };

  const totalValueVND = feedItems.reduce(
    (total, item) => total + item.stockQuantity * item.unitPrice,
    0
  );

  const lowStockCount = feedItems.filter(
    (item) => item.stockQuantity <= item.reorderLevel
  ).length;

  // Chỉ lấy danh mục thực tế được trả về từ Backend.
  const categoryOptions = useMemo(
    () =>
      backendFeedCategories
        .map((category) => ({
          value: getCategoryValue(category),
          label: getCategoryName(category),
        }))
        .filter((category) => category.value && category.label),
    [backendFeedCategories]
  );

  const resetImportForm = () => {
    setImportForm({
      feedItemId: '',
      quantity: 1000,
      date: new Date().toISOString().slice(0, 10),
      supplier: '',
      noteOption: '',
      note: '',
    });

    setImportSupplierOption('');
  };

  const resetExportForm = () => {
    setExportForm({
      feedItemId: '',
      quantity: 200,
      date: new Date().toISOString().slice(0, 10),
      purposeOption: '',
      purpose: '',
      penId: '',
      noteOption: '',
      note: '',
    });
  };

  const openImportModal = (feedId = '') => {
    if (!canCreateTransaction) return;

    setImportForm((previous) => ({
      ...previous,
      feedItemId: feedId || previous.feedItemId || feedItems[0]?.id || '',
    }));

    setIsImportModalOpen(true);
  };

  const openExportModal = (feedId = '') => {
    if (!canCreateTransaction) return;

    setExportForm((previous) => ({
      ...previous,
      feedItemId: feedId || previous.feedItemId || feedItems[0]?.id || '',
    }));

    setIsExportModalOpen(true);
  };

  const openEditFeedModal = (feed: BackendFeed) => {
    if (!canManageFeed) {
      addToast('error', 'Không có quyền', 'Bạn không có quyền sửa nguyên liệu.');
      return;
    }

    setEditingFeedId(feed.id);

    setEditFeed({
      name: feed.feedName || '',
      category: feed.categoryId || '',
      unit: feed.unit || 'kg',
      reorderLevel: Number(feed.minStock || 0),
      unitPrice: Number(feed.unitPrice || 0),
      supplier: feed.description || '',
      status: feed.status || 'ACTIVE',
    });

    setIsEditFeedModalOpen(true);
  };

  const handleUpdateFeed = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!canManageFeed) {
      addToast('error', 'Không có quyền', 'Bạn không có quyền sửa nguyên liệu.');
      return;
    }

    if (!editingFeedId) {
      addToast('error', 'Không tìm thấy', 'Không xác định được nguyên liệu cần sửa.');
      return;
    }

    if (!editFeed.name.trim()) {
      addToast('error', 'Thiếu thông tin', 'Vui lòng nhập tên nguyên liệu.');
      return;
    }

    if (!editFeed.category) {
      addToast('error', 'Thiếu thông tin', 'Vui lòng chọn danh mục thức ăn.');
      return;
    }

    if (
      !editFeed.unit.trim() ||
      editFeed.reorderLevel < 0 ||
      editFeed.unitPrice < 0
    ) {
      addToast('error', 'Dữ liệu không hợp lệ', 'Vui lòng kiểm tra đơn vị, ngưỡng tồn kho và đơn giá.');
      return;
    }

    const category = categoryOptions.find(
      (item) => item.value === editFeed.category
    );

    if (!category) {
      addToast('error', 'Danh mục không hợp lệ', 'Vui lòng tải lại danh sách danh mục.');
      return;
    }

    try {
      setIsSavingFeed(true);

      const payload: UpdateFeedRequest = {
        feedName: editFeed.name.trim(),
        categoryId: category.value,
        unit: editFeed.unit.trim(),
        minStock: editFeed.reorderLevel,
        unitPrice: editFeed.unitPrice,
        description: editFeed.supplier.trim(),
        status: editFeed.status,
      };

      await updateFeedApi(editingFeedId, payload);

      addToast('success', 'Thành công', 'Cập nhật nguyên liệu thức ăn thành công.');

      setIsEditFeedModalOpen(false);
      setEditingFeedId('');

      await loadFeedData();
    } catch (error) {
      addToast(
        'error',
        'Lỗi cập nhật nguyên liệu',
        getErrorMessage(error, 'Không thể cập nhật nguyên liệu thức ăn.')
      );
    } finally {
      setIsSavingFeed(false);
    }
  };

  const handleDeleteFeed = async (feed: BackendFeed) => {
    if (!canManageFeed) {
      addToast('error', 'Không có quyền', 'Bạn không có quyền xóa nguyên liệu.');
      return;
    }

    const confirmed = window.confirm(
      `Bạn có chắc chắn muốn xóa nguyên liệu "${feed.feedName}" không?`
    );

    if (!confirmed) return;

    try {
      setProcessingTransactionId(feed.id);

      await deleteFeedApi(feed.id);

      addToast('success', 'Thành công', 'Đã xử lý yêu cầu xóa nguyên liệu.');

      await loadFeedData();
    } catch (error) {
      addToast(
        'error',
        'Lỗi xóa nguyên liệu',
        getErrorMessage(error, 'Không thể xóa nguyên liệu thức ăn.')
      );
    } finally {
      setProcessingTransactionId(null);
    }
  };

  const handleAddFeed = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!canManageFeed) {
      addToast('error', 'Không có quyền', 'Bạn không có quyền thêm nguyên liệu thức ăn.');
      return;
    }

    if (!newFeed.name.trim()) {
      addToast('error', 'Thiếu thông tin', 'Vui lòng nhập tên nguyên liệu.');
      return;
    }

    if (!newFeed.category) {
      addToast('error', 'Thiếu thông tin', 'Vui lòng chọn danh mục thức ăn.');
      return;
    }

    if (
      newFeed.stockQuantity < 0 ||
      newFeed.reorderLevel < 0 ||
      newFeed.unitPrice < 0
    ) {
      addToast('error', 'Dữ liệu không hợp lệ', 'Số lượng, ngưỡng tồn kho và đơn giá không hợp lệ.');
      return;
    }

    if (!newFeed.unit.trim()) {
      addToast('error', 'Thiếu thông tin', 'Vui lòng nhập đơn vị tính.');
      return;
    }

    const category = categoryOptions.find(
      (item) => item.value === newFeed.category
    );

    if (!category) {
      addToast('error', 'Danh mục không hợp lệ', 'Vui lòng tải lại danh sách danh mục.');
      return;
    }

    try {
      setIsSavingFeed(true);

      const payload = {
        feedCode: `FEED-${Date.now()}`,
        feedName: newFeed.name.trim(),
        categoryId: category.value,
        categoryName: category.label,
        unit: newFeed.unit.trim(),
        quantity: newFeed.stockQuantity,
        minStock: newFeed.reorderLevel,
        unitPrice: newFeed.unitPrice,
        description: newFeed.supplier.trim(),
        status: 'ACTIVE',
      } as Parameters<typeof createFeedApi>[0];

      await createFeedApi(payload);

      addToast('success', 'Thành công', 'Thêm nguyên liệu thức ăn thành công.');

      setIsAddFeedModalOpen(false);

      setNewFeed({
        name: '',
        category: categoryOptions[0]?.value || '',
        stockQuantity: 5000,
        unit: 'kg',
        reorderLevel: 2000,
        unitPrice: 2000,
        supplier: '',
      });
      setNewFeedSupplierOption('');

      await loadFeedData();
    } catch (error) {
      addToast(
        'error',
        'Lỗi thêm nguyên liệu',
        getErrorMessage(error, 'Không thể thêm nguyên liệu thức ăn.')
      );
    } finally {
      setIsSavingFeed(false);
    }
  };
  const handleImportSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!canCreateTransaction) {
      addToast('error', 'Không có quyền', 'Bạn không có quyền lập phiếu nhập kho.');
      return;
    }

    if (!importForm.feedItemId) {
      addToast('error', 'Thiếu thông tin', 'Vui lòng chọn nguyên liệu cần nhập.');
      return;
    }

    if (!Number.isFinite(importForm.quantity) || importForm.quantity <= 0) {
      addToast('error', 'Dữ liệu không hợp lệ', 'Khối lượng nhập phải lớn hơn 0.');
      return;
    }

    if (!importForm.supplier.trim()) {
      addToast('error', 'Thiếu thông tin', 'Vui lòng nhập nhà cung cấp.');
      return;
    }

    const selectedFeed = backendFeedItems.find(
      (feed) => feed.id === importForm.feedItemId
    );

    if (!selectedFeed) {
      addToast('error', 'Không tìm thấy', 'Không tìm thấy nguyên liệu được chọn.');
      return;
    }

    try {
      setIsSavingTransaction(true);

      const importNote =
        importForm.noteOption === 'OTHER'
          ? importForm.note.trim()
          : importForm.noteOption;

      const note = [
        `Nhà cung cấp: ${importForm.supplier.trim()}`,
        `Ngày nhập theo phiếu: ${importForm.date}`,
        importNote ? `Ghi chú: ${importNote}` : '',
      ]
        .filter(Boolean)
        .join(' | ');

      const payload = {
        feedId: importForm.feedItemId,
        transactionType: 'IMPORT' as TransactionType,
        quantity: importForm.quantity,
        unitPrice: Number(selectedFeed.unitPrice || 0),
        note,
      } as Parameters<typeof createFeedTransactionApi>[0];

      await createFeedTransactionApi(payload);

      addToast(
        'success',
        'Tạo phiếu thành công',
        'Đã tạo phiếu nhập kho. Phiếu đang chờ quản lý xác nhận.'
      );

      setIsImportModalOpen(false);
      resetImportForm();
      await loadFeedData();
    } catch (error) {
      addToast(
        'error',
        'Lỗi nhập kho',
        getErrorMessage(error, 'Không thể tạo phiếu nhập kho.')
      );
    } finally {
      setIsSavingTransaction(false);
    }
  };

  const handleExportSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!canCreateTransaction) {
      addToast('error', 'Không có quyền', 'Bạn không có quyền lập phiếu xuất kho.');
      return;
    }

    if (!exportForm.feedItemId) {
      addToast('error', 'Thiếu thông tin', 'Vui lòng chọn nguyên liệu cần xuất.');
      return;
    }

    if (!Number.isFinite(exportForm.quantity) || exportForm.quantity <= 0) {
      addToast('error', 'Dữ liệu không hợp lệ', 'Khối lượng xuất phải lớn hơn 0.');
      return;
    }

    const exportPurpose =
      exportForm.purposeOption === 'OTHER'
        ? exportForm.purpose.trim()
        : exportForm.purposeOption;

    if (!exportPurpose) {
      addToast('error', 'Thiếu thông tin', 'Vui lòng chọn mục đích sử dụng.');
      return;
    }

    const selectedFeed = backendFeedItems.find(
      (feed) => feed.id === exportForm.feedItemId
    );

    if (!selectedFeed) {
      addToast('error', 'Không tìm thấy', 'Không tìm thấy nguyên liệu được chọn.');
      return;
    }

    if (exportForm.quantity > Number(selectedFeed.quantity || 0)) {
      addToast(
        'error',
        'Không đủ tồn kho',
        `Số lượng xuất vượt tồn kho hiện tại (${selectedFeed.quantity} ${selectedFeed.unit}).`
      );
      return;
    }

    try {
      setIsSavingTransaction(true);

      const selectedBarn = barns.find(
        (barn) => barn.id === exportForm.penId
      );

      const exportNote =
        exportForm.noteOption === 'OTHER'
          ? exportForm.note.trim()
          : exportForm.noteOption;

      const note = [
        `Mục đích: ${exportPurpose}`,
        selectedBarn ? `Chuồng nhận: ${selectedBarn.name}` : '',
        `Ngày xuất theo phiếu: ${exportForm.date}`,
        exportNote ? `Ghi chú: ${exportNote}` : '',
      ]
        .filter(Boolean)
        .join(' | ');

      const payload = {
        feedId: exportForm.feedItemId,
        transactionType: 'EXPORT' as TransactionType,
        quantity: exportForm.quantity,
        note,
      } as Parameters<typeof createFeedTransactionApi>[0];

      await createFeedTransactionApi(payload);

      addToast(
        'success',
        'Tạo phiếu thành công',
        'Đã tạo phiếu xuất kho. Phiếu đang chờ quản lý xác nhận.'
      );

      setIsExportModalOpen(false);
      resetExportForm();
      await loadFeedData();
    } catch (error) {
      addToast(
        'error',
        'Lỗi xuất kho',
        getErrorMessage(error, 'Không thể tạo phiếu xuất kho.')
      );
    } finally {
      setIsSavingTransaction(false);
    }
  };

  const handleReviewTransaction = async (
    transactionId: string,
    action: 'APPROVE' | 'REJECT'
  ) => {
    if (!canManageFeed) {
      addToast(
        'error',
        'Không có quyền',
        'Chỉ quản lý trang trại được xác nhận phiếu.'
      );
      return;
    }

    const transaction = backendFeedTransactions.find(
      (item) => item.id === transactionId
    );

    if (!transaction) {
      addToast(
        'error',
        'Không tìm thấy phiếu',
        'Phiếu không tồn tại hoặc đã được xử lý.'
      );
      return;
    }

    if (transaction.transactionStatus !== 'PENDING') {
      addToast(
        'error',
        'Phiếu đã xử lý',
        'Không thể xử lý phiếu này thêm lần nữa.'
      );
      return;
    }

    try {
      setProcessingTransactionId(transactionId);

      if (action === 'APPROVE') {
        await approveFeedTransactionApi(transactionId);

        addToast(
          'success',
          'Duyệt phiếu thành công',
          'Đã duyệt phiếu. Tồn kho được cập nhật theo giao dịch.'
        );
      } else {
        await rejectFeedTransactionApi(transactionId);

        addToast(
          'success',
          'Từ chối phiếu thành công',
          'Đã từ chối phiếu giao dịch.'
        );
      }

      await loadFeedData();
    } catch (error) {
      const actionText = action === 'APPROVE' ? 'duyệt' : 'từ chối';

      addToast(
        'error',
        'Lỗi xử lý phiếu',
        getErrorMessage(error, `Không thể ${actionText} phiếu.`)
      );
    } finally {
      setProcessingTransactionId(null);
    }
  };

  const getStatusDisplay = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return {
          label: 'Đã duyệt',
          className: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        };
      case 'REJECTED':
        return {
          label: 'Đã từ chối',
          className: 'bg-rose-50 text-rose-700 border-rose-200',
        };
      default:
        return {
          label: 'Chờ duyệt',
          className: 'bg-amber-50 text-amber-700 border-amber-200',
        };
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl font-bold text-slate-900">
              Quản Lý Kho Thức Ăn
            </h1>
            <span className="text-xs bg-emerald-50 text-emerald-800 border border-emerald-200 px-2.5 py-0.5 rounded-full font-bold">
              {feedItems.length} loại nguyên liệu
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Quản lý tồn kho, cảnh báo nguyên liệu và theo dõi phiếu nhập xuất
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => void loadFeedData()}
            disabled={isLoadingFeeds}
            className="px-3 py-2 border border-slate-200 bg-white hover:bg-slate-50 rounded-xl text-xs font-bold flex items-center gap-1.5 disabled:opacity-50"
          >
            <RefreshCw
              className={`w-4 h-4 ${isLoadingFeeds ? 'animate-spin' : ''}`}
            />
            Làm mới
          </button>

          {canCreateTransaction && (
            <>
              <button
                type="button"
                onClick={() => openImportModal()}
                className="px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 font-bold text-xs rounded-xl flex items-center gap-1.5"
              >
                <ArrowDownLeft className="w-4 h-4" />
                Phiếu Nhập Kho
              </button>

              <button
                type="button"
                onClick={() => openExportModal()}
                className="px-3.5 py-2 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 font-bold text-xs rounded-xl flex items-center gap-1.5"
              >
                <ArrowUpRight className="w-4 h-4" />
                Phiếu Xuất Kho
              </button>
            </>
          )}

          {canManageFeed && (
            <button
              type="button"
              onClick={() => setIsAddFeedModalOpen(true)}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              Thêm Mới
            </button>
          )}
        </div>
      </div>

      {isAdmin && (
        <div className="p-3 rounded-xl border border-blue-200 bg-blue-50 text-blue-800 text-xs">
          Tài khoản ADMIN đang ở chế độ chỉ xem dữ liệu kho thức ăn.
        </div>
      )}

      {/* Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200">
          <span className="text-xs font-semibold text-slate-500">
            Tổng Giá Trị Tồn Kho
          </span>
          <div className="text-2xl font-extrabold text-slate-900 mt-1">
            {totalValueVND.toLocaleString('vi-VN')}{' '}
            <span className="text-xs font-normal text-slate-400">VND</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Tính theo số lượng tồn và đơn giá hiện tại
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200">
          <span className="text-xs font-semibold text-slate-500">
            Tổng Số Nguyên Liệu
          </span>
          <div className="text-2xl font-extrabold text-slate-900 mt-1">
            {feedItems.length}{' '}
            <span className="text-xs font-normal text-slate-400">
              loại thức ăn
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Số nguyên liệu đang được quản lý trong kho
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200">
          <span className="text-xs font-semibold text-slate-500">
            Cảnh Báo Sắp Hết Hàng
          </span>
          <div className="text-2xl font-extrabold text-amber-600 mt-1">
            {lowStockCount}{' '}
            <span className="text-xs font-normal text-slate-400">
              nguyên liệu
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Nguyên liệu có tồn kho bằng hoặc thấp hơn ngưỡng tối thiểu
          </p>
        </div>
      </div>

      {/* Inventory */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Wheat className="w-4 h-4 text-emerald-600" />
            Tồn Kho Nguyên Liệu Thức Ăn
          </h2>
          <span className="text-xs text-slate-500">
            Dữ liệu từ Backend
          </span>
        </div>

        {isLoadingFeeds ? (
          <div className="py-10 text-center text-xs text-slate-500">
            Đang tải dữ liệu kho thức ăn...
          </div>
        ) : feedItems.length === 0 ? (
          <div className="py-10 text-center text-xs text-slate-400">
            Chưa có nguyên liệu thức ăn.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold">
                  <th className="py-3 px-4">Tên nguyên liệu</th>
                  <th className="py-3 px-4">Phân loại</th>
                  <th className="py-3 px-4">Tồn kho hiện tại</th>
                  <th className="py-3 px-4">Ngưỡng báo động</th>
                  <th className="py-3 px-4">Đơn giá</th>
                  <th className="py-3 px-4">Thông tin nhà cung cấp</th>
                  {canManageFeed && (
                    <th className="py-3 px-4 text-right">Thao tác</th>
                  )}
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {feedItems.map((item) => {
                  const isLow = item.stockQuantity <= item.reorderLevel;
                  const category = CATEGORY_LABELS[item.category];
                  const backendFeed = backendFeedItems.find(
                    (feed) => feed.id === item.id
                  );

                  return (
                    <tr key={item.id} className="hover:bg-slate-50/60">
                      <td className="py-3.5 px-4 font-bold text-slate-900">
                        {item.name}
                      </td>

                      <td className="py-3.5 px-4">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                            category?.color || 'bg-slate-50 text-slate-700'
                          }`}
                        >
                          {backendFeed?.categoryName ||
                            category?.label ||
                            'Chưa phân loại'}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 font-mono">
                        <span
                          className={`font-bold ${
                            isLow ? 'text-rose-600' : 'text-slate-900'
                          }`}
                        >
                          {item.stockQuantity.toLocaleString('vi-VN')}{' '}
                          {item.unit}
                        </span>
                        {isLow && (
                          <span className="ml-2 inline-flex items-center gap-1 text-[10px] text-rose-600">
                            <AlertTriangle className="w-3 h-3" />
                            Sắp hết
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 font-mono text-slate-500">
                        {item.reorderLevel.toLocaleString('vi-VN')} {item.unit}
                      </td>

                      <td className="py-3.5 px-4 font-mono text-slate-700">
                        {item.unitPrice.toLocaleString('vi-VN')} đ
                      </td>

                      <td className="py-3.5 px-4 text-slate-600">
                        {item.supplier}
                      </td>

                     {canManageFeed && (
                      <td className="py-3.5 px-4">
                       <div className="flex items-center justify-end gap-1.5">
                        <button
                            type="button"
                            onClick={() => {
                              if (backendFeed) openEditFeedModal(backendFeed);
                            }}
                            disabled={!backendFeed || processingTransactionId === item.id}
                            className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg font-bold disabled:opacity-50"
                          >
                            Sửa
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              if (backendFeed) void handleDeleteFeed(backendFeed);
                            }}
                            disabled={!backendFeed || processingTransactionId === item.id}
                            className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg font-bold disabled:opacity-50"
                          >
                            Xóa
                          </button>
                        </div>
                      </td>
                    )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Transaction history */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
        <div className="flex items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <FileText className="w-4 h-4 text-emerald-600" />
              Lịch Sử Giao Dịch Nhập - Xuất Kho
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Theo dõi trạng thái và người xác nhận từng phiếu
            </p>
          </div>
        </div>

        {/* Bộ lọc giao dịch */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <div className="sm:col-span-2 lg:col-span-3">
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Tìm kiếm giao dịch
            </label>
            <input
              type="text"
              value={transactionSearch}
              onChange={(event) => setTransactionSearch(event.target.value)}
              placeholder="Tìm theo mã phiếu, nguyên liệu, người lập, ghi chú..."
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Loại phiếu
            </label>
            <select
              value={transactionTypeFilter}
              onChange={(event) => setTransactionTypeFilter(event.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs"
            >
              <option value="ALL">Tất cả loại phiếu</option>
              <option value="IMPORT">Nhập kho</option>
              <option value="EXPORT">Xuất kho</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Trạng thái
            </label>
            <select
              value={transactionStatusFilter}
              onChange={(event) => setTransactionStatusFilter(event.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs"
            >
              <option value="ALL">Tất cả trạng thái</option>
              <option value="PENDING">Chờ duyệt</option>
              <option value="APPROVED">Đã duyệt</option>
              <option value="REJECTED">Đã từ chối</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Từ ngày
            </label>
            <input
              type="date"
              value={transactionFromDate}
              onChange={(event) => setTransactionFromDate(event.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Đến ngày
            </label>
            <input
              type="date"
              value={transactionToDate}
              onChange={(event) => setTransactionToDate(event.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
            />
          </div>

          <div className="flex items-end">
            <button
              type="button"
              onClick={resetTransactionFilters}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-xs font-semibold text-slate-600"
            >
              Xóa bộ lọc
            </button>
          </div>
        </div>

        <div className="text-xs text-slate-500">
          Hiển thị {filteredFeedTransactions.length} / {feedTransactions.length} giao dịch
        </div>

        {/* Danh sách giao dịch */}
        {filteredFeedTransactions.length === 0 ? (
          <div className="text-center py-8 text-slate-400 text-xs">
            Không tìm thấy giao dịch phù hợp.
          </div>
        ) : (
          <div className="overflow-x-auto border border-slate-100 rounded-2xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">Thời gian</th>
                  <th className="py-2.5 px-3">Loại phiếu</th>
                  <th className="py-2.5 px-3">Nguyên liệu</th>
                  <th className="py-2.5 px-3">Khối lượng</th>
                  <th className="py-2.5 px-3">Người lập</th>
                  <th className="py-2.5 px-3">Trạng thái</th>
                  <th className="py-2.5 px-3">Ghi chú</th>
                  {canManageFeed && (
                    <th className="py-2.5 px-3 text-right">Xử lý</th>
                  )}
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {filteredFeedTransactions.map((tx) => {
                  const status = getStatusDisplay(tx.status);
                  const isPending = tx.status === 'PENDING';
                  const isProcessing = processingTransactionId === tx.id;

                  return (
                    <tr key={tx.id} className="hover:bg-slate-50">
                      <td className="py-2.5 px-3 font-mono text-slate-700 whitespace-nowrap">
                        {tx.date}
                      </td>

                      <td className="py-2.5 px-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            tx.type === 'IMPORT'
                              ? 'bg-emerald-50 text-emerald-700'
                              : 'bg-amber-50 text-amber-700'
                          }`}
                        >
                          {tx.type === 'IMPORT' ? 'NHẬP KHO' : 'XUẤT KHO'}
                        </span>
                      </td>

                      <td className="py-2.5 px-3 font-bold text-slate-900">
                        {tx.feedItemName}
                      </td>

                      <td className="py-2.5 px-3 font-mono font-bold">
                        <span
                          className={
                            tx.type === 'IMPORT'
                              ? 'text-emerald-700'
                              : 'text-amber-700'
                          }
                        >
                          {tx.type === 'IMPORT' ? '+' : '-'}
                          {tx.quantity.toLocaleString('vi-VN')}
                        </span>
                      </td>

                      <td className="py-2.5 px-3 text-slate-600">
                        {tx.performedBy}
                      </td>

                      <td className="py-2.5 px-3">
                        <span
                          className={`px-2 py-1 rounded-full border text-[10px] font-bold inline-flex items-center gap-1 ${status.className}`}
                        >
                          {tx.status === 'APPROVED' ? (
                            <CheckCircle className="w-3 h-3" />
                          ) : tx.status === 'REJECTED' ? (
                            <Ban className="w-3 h-3" />
                          ) : (
                            <Clock className="w-3 h-3" />
                          )}
                          {status.label}
                        </span>
                      </td>

                      <td className="py-2.5 px-3 text-slate-500 min-w-48">
                        <div>{tx.note || '-'}</div>
                        {tx.reviewedBy && (
                          <div className="mt-1 text-[10px] text-slate-400">
                            Người xử lý: {tx.reviewedBy}
                          </div>
                        )}
                        {tx.reviewNote && (
                          <div className="mt-1 text-[10px] text-slate-500">
                            Ý kiến: {tx.reviewNote}
                          </div>
                        )}
                      </td>

                      {canManageFeed && (
                        <td className="py-2.5 px-3">
                          {isPending ? (
                            <div className="flex justify-end gap-1.5">
                              <button
                                type="button"
                                disabled={isProcessing}
                                onClick={() =>
                                  void handleReviewTransaction(tx.id, 'APPROVE')
                                }
                                className="px-2 py-1 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-bold disabled:opacity-50"
                              >
                                Duyệt
                              </button>
                              <button
                                type="button"
                                disabled={isProcessing}
                                onClick={() =>
                                  void handleReviewTransaction(tx.id, 'REJECT')
                                }
                                className="px-2 py-1 rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 font-bold disabled:opacity-50"
                              >
                                Từ chối
                              </button>
                            </div>
                          ) : (
                            <span className="text-slate-400">Đã xử lý</span>
                          )}
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Import modal */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <ArrowDownLeft className="w-5 h-5 text-emerald-600" />
                <h3 className="font-bold text-base text-slate-900">
                  Lập Phiếu Nhập Kho
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsImportModalOpen(false)}
                className="p-1 text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleImportSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Nguyên liệu thức ăn
                </label>
                <select
                  required
                  value={importForm.feedItemId}
                  onChange={(event) =>
                    setImportForm({
                      ...importForm,
                      feedItemId: event.target.value,
                    })
                  }
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white"
                >
                  <option value="">-- Chọn nguyên liệu --</option>
                  {feedItems.map((feed) => (
                    <option key={feed.id} value={feed.id}>
                      {feed.name} (Tồn: {feed.stockQuantity} {feed.unit})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Khối lượng nhập
                  </label>
                  <input
                    type="number"
                    min="0.01"
                    step="any"
                    required
                    value={importForm.quantity}
                    onChange={(event) =>
                      setImportForm({
                        ...importForm,
                        quantity: Number(event.target.value),
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-200"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Ngày nhập theo phiếu
                  </label>
                  <input
                    type="date"
                    required
                    value={importForm.date}
                    onChange={(event) =>
                      setImportForm({
                        ...importForm,
                        date: event.target.value,
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-200"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Nhà cung cấp
                </label>

                <select
                  required
                  value={importSupplierOption}
                  onChange={(event) => {
                    const value = event.target.value;
                    setImportSupplierOption(value);

                    if (value !== 'OTHER') {
                      setImportForm((previous) => ({
                        ...previous,
                        supplier: value,
                      }));
                    } else {
                      setImportForm((previous) => ({
                        ...previous,
                        supplier: '',
                      }));
                    }
                  }}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white"
                >
                  <option value="">-- Chọn nhà cung cấp --</option>
                  <option value="Công ty cung cấp thức ăn chăn nuôi">
                    Công ty cung cấp thức ăn chăn nuôi
                  </option>
                  <option value="Đại lý thức ăn chăn nuôi">
                    Đại lý thức ăn chăn nuôi
                  </option>
                  <option value="Hộ kinh doanh thức ăn chăn nuôi">
                    Hộ kinh doanh thức ăn chăn nuôi
                  </option>
                  <option value="Nhà cung cấp địa phương">
                    Nhà cung cấp địa phương
                  </option>
                  <option value="OTHER">Khác</option>
                </select>

                {importSupplierOption === 'OTHER' && (
                  <input
                    type="text"
                    required
                    value={importForm.supplier}
                    onChange={(event) =>
                      setImportForm((previous) => ({
                        ...previous,
                        supplier: event.target.value,
                      }))
                    }
                    className="w-full mt-2 px-3 py-2 rounded-xl border border-slate-200"
                    placeholder="Nhập tên nhà cung cấp..."
                    autoFocus
                  />
                )}
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Ghi chú
                </label>

                <select
                  value={importForm.noteOption}
                  onChange={(event) =>
                    setImportForm({
                      ...importForm,
                      noteOption: event.target.value,
                      note: '',
                    })
                  }
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white"
                >
                  <option value="">-- Chọn ghi chú (không bắt buộc) --</option>
                  <option value="Nhập hàng theo đơn đặt hàng">
                    Nhập hàng theo đơn đặt hàng
                  </option>
                  <option value="Nhập bổ sung tồn kho">
                    Nhập bổ sung tồn kho
                  </option>
                  <option value="Nhập hàng theo hóa đơn">
                    Nhập hàng theo hóa đơn
                  </option>
                  <option value="OTHER">Khác</option>
                </select>

                {importForm.noteOption === 'OTHER' && (
                  <input
                    type="text"
                    value={importForm.note}
                    onChange={(event) =>
                      setImportForm({
                        ...importForm,
                        note: event.target.value,
                      })
                    }
                    className="w-full mt-2 px-3 py-2 rounded-xl border border-slate-200"
                    placeholder="Nhập ghi chú khác..."
                    autoFocus
                  />
                )}
              </div>

              <p className="text-[11px] text-amber-700 bg-amber-50 rounded-lg p-2">
                Phiếu sau khi lập sẽ ở trạng thái chờ duyệt. Tồn kho chỉ thay
                đổi sau khi quản lý xác nhận.
              </p>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsImportModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 font-semibold"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSavingTransaction}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold disabled:opacity-50"
                >
                  {isSavingTransaction ? 'Đang lưu...' : 'Lưu Phiếu Nhập'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Export modal */}
      {isExportModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <ArrowUpRight className="w-5 h-5 text-amber-600" />
                <h3 className="font-bold text-base text-slate-900">
                  Lập Phiếu Xuất Kho
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsExportModalOpen(false)}
                className="p-1 text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleExportSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Nguyên liệu cần xuất
                </label>
                <select
                  required
                  value={exportForm.feedItemId}
                  onChange={(event) =>
                    setExportForm({
                      ...exportForm,
                      feedItemId: event.target.value,
                    })
                  }
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white"
                >
                  <option value="">-- Chọn nguyên liệu --</option>
                  {feedItems.map((feed) => (
                    <option key={feed.id} value={feed.id}>
                      {feed.name} (Tồn: {feed.stockQuantity} {feed.unit})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Khối lượng xuất
                  </label>
                  <input
                    type="number"
                    min="0.01"
                    step="any"
                    required
                    value={exportForm.quantity}
                    onChange={(event) =>
                      setExportForm({
                        ...exportForm,
                        quantity: Number(event.target.value),
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-200"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Ngày xuất theo phiếu
                  </label>
                  <input
                    type="date"
                    required
                    value={exportForm.date}
                    onChange={(event) =>
                      setExportForm({
                        ...exportForm,
                        date: event.target.value,
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-200"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Chuồng nhận
                </label>
                <select
                  value={exportForm.penId}
                  onChange={(event) =>
                    setExportForm({
                      ...exportForm,
                      penId: event.target.value,
                    })
                  }
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white"
                >
                  <option value="">Không gán chuồng</option>
                  {barns.map((barn) => (
                    <option key={barn.id} value={barn.id}>
                      {barn.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Mục đích sử dụng
                </label>

                <select
                  required
                  value={exportForm.purposeOption}
                  onChange={(event) =>
                    setExportForm({
                      ...exportForm,
                      purposeOption: event.target.value,
                      purpose: '',
                    })
                  }
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white"
                >
                  <option value="">-- Chọn mục đích sử dụng --</option>
                  <option value="Cho bò ăn hằng ngày">Cho bò ăn hằng ngày</option>
                  <option value="Bổ sung thức ăn">Bổ sung thức ăn</option>
                  <option value="Phối trộn thức ăn">Phối trộn thức ăn</option>
                  <option value="Dự trữ thức ăn tại chuồng">
                    Dự trữ thức ăn tại chuồng
                  </option>
                  <option value="OTHER">Khác</option>
                </select>

                {exportForm.purposeOption === 'OTHER' && (
                  <input
                    type="text"
                    required
                    value={exportForm.purpose}
                    onChange={(event) =>
                      setExportForm({
                        ...exportForm,
                        purpose: event.target.value,
                      })
                    }
                    className="w-full mt-2 px-3 py-2 rounded-xl border border-slate-200"
                    placeholder="Nhập mục đích sử dụng khác..."
                    autoFocus
                  />
                )}
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Ghi chú
                </label>

                <select
                  value={exportForm.noteOption}
                  onChange={(event) =>
                    setExportForm({
                      ...exportForm,
                      noteOption: event.target.value,
                      note: '',
                    })
                  }
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white"
                >
                  <option value="">-- Chọn ghi chú (không bắt buộc) --</option>
                  <option value="Xuất theo lịch cho ăn">
                    Xuất theo lịch cho ăn
                  </option>
                  <option value="Xuất theo yêu cầu của quản lý">
                    Xuất theo yêu cầu của quản lý
                  </option>
                  <option value="Xuất bổ sung cho chuồng">
                    Xuất bổ sung cho chuồng
                  </option>
                  <option value="OTHER">Khác</option>
                </select>

                {exportForm.noteOption === 'OTHER' && (
                  <input
                    type="text"
                    value={exportForm.note}
                    onChange={(event) =>
                      setExportForm({
                        ...exportForm,
                        note: event.target.value,
                      })
                    }
                    className="w-full mt-2 px-3 py-2 rounded-xl border border-slate-200"
                    placeholder="Nhập ghi chú khác..."
                    autoFocus
                  />
                )}
              </div>

              <p className="text-[11px] text-amber-700 bg-amber-50 rounded-lg p-2">
                Phiếu sau khi lập sẽ ở trạng thái chờ duyệt. Tồn kho chỉ thay
                đổi sau khi quản lý xác nhận.
              </p>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsExportModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 font-semibold"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSavingTransaction}
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold disabled:opacity-50"
                >
                  {isSavingTransaction ? 'Đang lưu...' : 'Lưu Phiếu Xuất'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit feed modal */}
      {isEditFeedModalOpen && canManageFeed && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="font-bold text-base text-slate-900">
                Sửa Nguyên Liệu Thức Ăn
              </h3>

              <button
                type="button"
                onClick={() => setIsEditFeedModalOpen(false)}
                className="p-1 text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateFeed} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Tên thức ăn
                </label>
                <input
                  type="text"
                  required
                  value={editFeed.name}
                  onChange={(event) =>
                    setEditFeed({ ...editFeed, name: event.target.value })
                  }
                  className="w-full px-3 py-2 rounded-xl border border-slate-200"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Phân loại
                  </label>
                  <select
                    required
                    value={editFeed.category}
                    onChange={(event) =>
                      setEditFeed({ ...editFeed, category: event.target.value })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white"
                  >
                    <option value="">-- Chọn danh mục --</option>
                    {categoryOptions.map((category) => (
                      <option key={category.value} value={category.value}>
                        {category.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Đơn vị tính
                  </label>
                  <input
                    type="text"
                    required
                    value={editFeed.unit}
                    onChange={(event) =>
                      setEditFeed({ ...editFeed, unit: event.target.value })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-200"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Ngưỡng cảnh báo
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={editFeed.reorderLevel}
                    onChange={(event) =>
                      setEditFeed({
                        ...editFeed,
                        reorderLevel: Number(event.target.value),
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-200"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Đơn giá
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={editFeed.unitPrice}
                    onChange={(event) =>
                      setEditFeed({
                        ...editFeed,
                        unitPrice: Number(event.target.value),
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-200"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Nhà cung cấp
                </label>
                <input
                  type="text"
                  value={editFeed.supplier}
                  onChange={(event) =>
                    setEditFeed({ ...editFeed, supplier: event.target.value })
                  }
                  className="w-full px-3 py-2 rounded-xl border border-slate-200"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Trạng thái
                </label>
                <select
                  value={editFeed.status}
                  onChange={(event) =>
                    setEditFeed({ ...editFeed, status: event.target.value })
                  }
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white"
                >
                  <option value="ACTIVE">Đang sử dụng</option>
                  <option value="INACTIVE">Ngừng sử dụng</option>
                </select>
              </div>

              <p className="text-[11px] text-amber-700 bg-amber-50 rounded-lg p-2">
                Số lượng tồn kho không được chỉnh sửa tại đây. Tồn kho chỉ thay đổi
                thông qua phiếu nhập hoặc xuất đã được quản lý xác nhận.
              </p>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsEditFeedModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 font-semibold"
                >
                  Hủy
                </button>

                <button
                  type="submit"
                  disabled={isSavingFeed}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold disabled:opacity-50"
                >
                  {isSavingFeed ? 'Đang lưu...' : 'Lưu thay đổi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add feed modal */}
      {isAddFeedModalOpen && canManageFeed && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="font-bold text-base text-slate-900">
                Thêm Nguyên Liệu Thức Ăn
              </h3>
              <button
                type="button"
                onClick={() => setIsAddFeedModalOpen(false)}
                className="p-1 text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {categoryOptions.length === 0 ? (
              <div className="mb-4 p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs">
                Backend chưa có danh mục thức ăn. Bạn cần tạo danh mục trước
                khi thêm nguyên liệu vào kho.
              </div>
            ) : null}

            <form onSubmit={handleAddFeed} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Tên thức ăn
                </label>
                <input
                  type="text"
                  required
                  value={newFeed.name}
                  onChange={(event) =>
                    setNewFeed({ ...newFeed, name: event.target.value })
                  }
                  placeholder="Nhập tên nguyên liệu..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Phân loại
                  </label>
                  <select
                    required
                    disabled={categoryOptions.length === 0}
                    value={newFeed.category}
                    onChange={(event) =>
                      setNewFeed({
                        ...newFeed,
                        category: event.target.value,
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white disabled:bg-slate-100"
                  >
                    <option value="">-- Chọn danh mục --</option>
                    {categoryOptions.map((category) => (
                      <option key={category.value} value={category.value}>
                        {category.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Đơn vị tính
                  </label>
                  <input
                    type="text"
                    required
                    value={newFeed.unit}
                    onChange={(event) =>
                      setNewFeed({ ...newFeed, unit: event.target.value })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-200"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Tồn kho ban đầu
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={newFeed.stockQuantity}
                    onChange={(event) =>
                      setNewFeed({
                        ...newFeed,
                        stockQuantity: Number(event.target.value),
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-200"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Ngưỡng cảnh báo
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={newFeed.reorderLevel}
                    onChange={(event) =>
                      setNewFeed({
                        ...newFeed,
                        reorderLevel: Number(event.target.value),
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-200"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Đơn giá (đ/{newFeed.unit || 'đơn vị'})
                </label>
                <input
                  type="number"
                  min="0"
                  required
                  value={newFeed.unitPrice}
                  onChange={(event) =>
                    setNewFeed({
                      ...newFeed,
                      unitPrice: Number(event.target.value),
                    })
                  }
                  className="w-full px-3 py-2 rounded-xl border border-slate-200"
                />
              </div>

             <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Nhà cung cấp
              </label>

              <select
                value={newFeedSupplierOption}
                onChange={(event) => {
                  const value = event.target.value;

                  setNewFeedSupplierOption(value);

                  setNewFeed((previous) => ({
                    ...previous,
                    supplier: value === 'OTHER' ? '' : value,
                  }));
                }}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white"
              >
                <option value="">-- Chọn nhà cung cấp --</option>
                <option value="Công ty cung cấp thức ăn chăn nuôi">
                  Công ty cung cấp thức ăn chăn nuôi
                </option>
                <option value="Đại lý thức ăn chăn nuôi">
                  Đại lý thức ăn chăn nuôi
                </option>
                <option value="Hộ kinh doanh thức ăn chăn nuôi">
                  Hộ kinh doanh thức ăn chăn nuôi
                </option>
                <option value="Nhà cung cấp địa phương">
                  Nhà cung cấp địa phương
                </option>
                <option value="OTHER">Khác</option>
              </select>

              {newFeedSupplierOption === 'OTHER' && (
                <input
                  type="text"
                  value={newFeed.supplier}
                  onChange={(event) =>
                    setNewFeed((previous) => ({
                      ...previous,
                      supplier: event.target.value,
                    }))
                  }
                  className="w-full mt-2 px-3 py-2 rounded-xl border border-slate-200"
                  placeholder="Nhập tên nhà cung cấp..."
                />
              )}
            </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddFeedModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 font-semibold"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSavingFeed || categoryOptions.length === 0}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold disabled:opacity-50"
                >
                  {isSavingFeed ? 'Đang lưu...' : 'Lưu Vào Kho'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
