
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFarmStore } from '../../store/useFarmStore';
import { useAuthStore } from '../../store/useAuthStore';
import { Cattle, CattleStatus, Barn } from '../../types';
import { CattleFormModal } from './CattleFormModal';
import { getCattleImageUrlApi } from '../../services/fileService';
import {
  Search,
  Plus,
  Radio,
  Scale,
  Eye,
  Edit2,
  Trash2,
  LayoutGrid,
  List,
  Download,
  AlertCircle,
} from 'lucide-react';

const DEFAULT_CATTLE_IMAGE = '/assets/aiStudio/cattle-default.png';

type BarnWithCode = Barn & {
  code?: string;
  barnCode?: string;
};

const getBarnCode = (barn: Barn): string => {
  const item = barn as BarnWithCode;

  if (item.code) return item.code;
  if (item.barnCode) return item.barnCode;

  const match = barn.name.match(/Chuồng\s+([A-Z]\d+)/i);

  return match ? match[1].toUpperCase() : barn.id;
};

export const CattleListPage: React.FC = () => {
  const navigate = useNavigate();

  const [minioImageUrls, setMinioImageUrls] = useState<
    Record<string, string | null>
  >({});

  const {
    cattle,
    barns,
    deleteCattle,
    addToast,
    fetchCattle,
  } = useFarmStore();

  const { currentUser } = useAuthStore();
  const isFarmManager = currentUser?.role === 'FARM_MANAGER';

  // Tải ảnh bò từ MinIO
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

  const getCattleImageSrc = (cow: Cattle): string => {
    const photoUrl = cow.photoUrl?.trim();

    if (!photoUrl) {
      return DEFAULT_CATTLE_IMAGE;
    }

    if (photoUrl.startsWith('minio:')) {
      const fileId = photoUrl.slice(6);
      return minioImageUrls[fileId] || DEFAULT_CATTLE_IMAGE;
    }

    return photoUrl;
  };

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBreed, setSelectedBreed] = useState('ALL');
  const [selectedPen, setSelectedPen] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('table');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingCattle, setEditingCattle] = useState<Cattle | null>(null);

  // Danh sách giống bò lấy từ dữ liệu thực tế
  const breeds = Array.from(
    new Set(cattle.map((cow) => cow.breed).filter(Boolean))
  );

  // Các trạng thái được hỗ trợ
  const statusStyles: Partial<
    Record<CattleStatus, { label: string; color: string; dot: string }>
  > = {
    DANG_NUOI: {
      label: 'Đang nuôi',
      color: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      dot: 'bg-emerald-500',
    },
    CAN_THEO_DOI: {
      label: 'Cần theo dõi',
      color: 'bg-amber-50 text-amber-700 border-amber-200',
      dot: 'bg-amber-500',
    },
    DANG_DIEU_TRI: {
      label: 'Đang điều trị thú y',
      color: 'bg-rose-50 text-rose-700 border-rose-200',
      dot: 'bg-rose-500',
    },
    DU_DIEU_KIEN_XUAT_BAN: {
      label: 'Đủ điều kiện xuất bán',
      color: 'bg-indigo-50 text-indigo-700 border-indigo-200',
      dot: 'bg-indigo-500',
    },
    DA_XUAT_BAN: {
      label: 'Đã xuất bán',
      color: 'bg-slate-100 text-slate-600 border-slate-200',
      dot: 'bg-slate-400',
    },
    HEALTHY: {
      label: 'Khỏe mạnh',
      color: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      dot: 'bg-emerald-500',
    },
    QUARANTINE: {
      label: 'Cách ly thú y',
      color: 'bg-rose-50 text-rose-700 border-rose-200',
      dot: 'bg-rose-500',
    },
  };

  // Tìm thông tin chuồng theo mã chuồng hoặc ID
  const getBarn = (penId?: string) => {
    if (!penId) return undefined;

    const normalizedPenId = penId.trim().toUpperCase();

    return barns.find((barn) => {
      return (
        barn.id?.trim().toUpperCase() === normalizedPenId ||
        getBarnCode(barn).trim().toUpperCase() === normalizedPenId
      );
    });
  };

  // Hiển thị thông tin chuồng
  const getBarnLabel = (penId?: string) => {
    if (!penId) return 'Chưa xếp chuồng';

    const barn = getBarn(penId);

    return barn
      ? `${getBarnCode(barn)} - ${barn.name}`
      : `Chuồng ${penId}`;
  };

  // Tự động lấy tất cả mã chuồng từ dữ liệu bò và danh sách chuồng
  const barnOptions = barns
    .filter((barn) => barn.id && barn.name)
    .map((barn) => getBarnCode(barn));

  // Lấy thông tin trạng thái
  const getStatusInfo = (status: CattleStatus) => {
    return statusStyles[status] || {
      label: 'Chưa xác định',
      color: 'bg-slate-100 text-slate-600 border-slate-200',
      dot: 'bg-slate-400',
    };
  };

  // Tìm kiếm và lọc bò
  const filteredCattle = cattle.filter((cow) => {
    const search = searchTerm.toLowerCase();

    const matchesSearch =
      (cow.id || '').toLowerCase().includes(search) ||
      (cow.rfidTag || '').toLowerCase().includes(search) ||
      (cow.earTagNumber || '').toLowerCase().includes(search) ||
      (cow.name || '').toLowerCase().includes(search);

    const matchesBreed =
      selectedBreed === 'ALL' || cow.breed === selectedBreed;

    const selectedBarn = getBarn(selectedPen);
    const cowPenId = (cow.penId || '').trim().toUpperCase();

    const matchesPen =
      selectedPen === 'ALL' ||
      cowPenId === selectedPen.trim().toUpperCase() ||
      cowPenId === selectedBarn?.id?.trim().toUpperCase() ||
      cowPenId ===
        getBarnCode(selectedBarn || ({} as Barn)).trim().toUpperCase();

    const matchesStatus =
      selectedStatus === 'ALL' || cow.status === selectedStatus;

    return (
      matchesSearch &&
      matchesBreed &&
      matchesPen &&
      matchesStatus
    );
  });

  const totalPages = Math.ceil(filteredCattle.length / pageSize);

  const safeCurrentPage = Math.min(
    currentPage,
    Math.max(totalPages, 1)
  );

  const paginatedCattle = filteredCattle.slice(
    (safeCurrentPage - 1) * pageSize,
    safeCurrentPage * pageSize
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedBreed, selectedPen, selectedStatus]);

  // Mở form thêm bò
  const handleOpenAdd = () => {
    setEditingCattle(null);
    setIsFormModalOpen(true);
  };

  // Mở form sửa bò
  const handleOpenEdit = (cow: Cattle) => {
    setEditingCattle(cow);
    setIsFormModalOpen(true);
  };

  // Xóa bò
  const handleDelete = (cow: Cattle) => {
    if (!currentUser) return;

    if (
      confirm(`Bạn có chắc muốn xóa/lưu trữ bò ${cow.id} (${cow.name})?`)
    ) {
      deleteCattle(cow.id, currentUser.name, currentUser.role);
    }
  };

  // Xuất danh sách bò CSV
  const handleExportCSV = () => {
    const headers =
      'Mã Bò,Mã RFID,Số Tai,Tên,Giống,Giới Tính,Trọng Lượng(kg),Chuồng,Trạng Thái\n';

    const rows = filteredCattle
      .map((cow) =>
        `"${cow.id}","${cow.rfidTag}","${cow.earTagNumber}","${cow.name}","${cow.breed}","${cow.gender}",${cow.weight},"${cow.penId}","${cow.status}"`
      )
      .join('\n');

    const blob = new Blob(['\uFEFF' + headers + rows], {
      type: 'text/csv;charset=utf-8;',
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');

    link.href = url;
    link.download = `Danh_Sach_Dan_Bo_BovSmart_${new Date()
      .toISOString()
      .split('T')[0]}.csv`;
    link.click();

    URL.revokeObjectURL(url);

    addToast(
      'success',
      'Xuất File Thành Công',
      'Đã tải xuống danh sách đàn bò định dạng CSV.'
    );
  };

  // Nếu ảnh bò bị lỗi thì chuyển sang ảnh mặc định
  const handleImageError = (
    e: React.SyntheticEvent<HTMLImageElement>
  ) => {
    const image = e.currentTarget;

    if (!image.src.endsWith(DEFAULT_CATTLE_IMAGE)) {
      image.src = DEFAULT_CATTLE_IMAGE;
    }
  };

  // Tải dữ liệu bò từ Backend
  useEffect(() => {
    fetchCattle().catch((error) => {
      addToast(
        'error',
        'Lỗi tải dữ liệu',
        error instanceof Error
          ? error.message
          : 'Không thể tải danh sách bò từ máy chủ.'
      );
    });
  }, [fetchCattle, addToast]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900">
              Danh Sách Quản Lý Đàn Bò
            </h1>

            <span className="text-xs bg-emerald-50 text-emerald-800 border border-emerald-200 px-2.5 py-0.5 rounded-full font-bold">
              {filteredCattle.length} cá thể
            </span>
          </div>

          <p className="text-xs text-slate-500 mt-1">
            Quản lý RFID, cân nặng, chuồng trại và trạng thái xuất bán
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-slate-700 text-xs font-semibold flex items-center gap-1.5"
          >
            <Download className="w-4 h-4" />
            Xuất CSV
          </button>

          {isFarmManager && (
            <button
              onClick={handleOpenAdd}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              Thêm Bò Mới
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 space-y-3">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />

            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm theo mã bò, RFID, số tai, tên..."
              className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-slate-200"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Lọc giống bò */}
            <select
              value={selectedBreed}
              onChange={(e) => setSelectedBreed(e.target.value)}
              className="py-2 px-3 text-xs rounded-xl border border-slate-200 bg-white"
            >
              <option value="ALL">Tất cả giống ({breeds.length})</option>

              {breeds.map((breed) => (
                <option key={breed} value={breed}>
                  {breed}
                </option>
              ))}
            </select>

            {/* Lọc chuồng */}
            <select
              value={selectedPen}
              onChange={(e) => setSelectedPen(e.target.value)}
              className="py-2 px-3 text-xs rounded-xl border border-slate-200 bg-white"
            >
              <option value="ALL">Tất cả chuồng</option>

              {barnOptions.map((code) => {
                const barn = getBarn(code);

                return (
                  <option key={code} value={code}>
                    {barn ? `${code} - ${barn.name}` : `Chuồng ${code}`}
                  </option>
                );
              })}
            </select>

            {/* Lọc trạng thái */}
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="py-2 px-3 text-xs rounded-xl border border-slate-200 bg-white"
            >
              <option value="ALL">Tất cả trạng thái</option>
              <option value="DANG_NUOI">Đang nuôi</option>
              <option value="CAN_THEO_DOI">Cần theo dõi</option>
              <option value="DANG_DIEU_TRI">Đang điều trị</option>
              <option value="DU_DIEU_KIEN_XUAT_BAN">
                Đủ điều kiện xuất bán
              </option>
              <option value="DA_XUAT_BAN">Đã xuất bán</option>
            </select>

            {/* Chuyển đổi dạng hiển thị */}
            <div className="flex items-center bg-slate-100 p-0.5 rounded-xl">
              <button
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-lg ${
                  viewMode === 'table'
                    ? 'bg-white text-slate-900 shadow'
                    : 'text-slate-500'
                }`}
                title="Dạng bảng"
              >
                <List className="w-4 h-4" />
              </button>

              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg ${
                  viewMode === 'grid'
                    ? 'bg-white text-slate-900 shadow'
                    : 'text-slate-500'
                }`}
                title="Dạng lưới"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      {viewMode === 'table' ? (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500">
                  <th className="py-3 px-4">Cá thể bò</th>
                  <th className="py-3 px-4">RFID & Số tai</th>
                  <th className="py-3 px-4">Giống & Giới tính</th>
                  <th className="py-3 px-4">Trọng lượng</th>
                  <th className="py-3 px-4">Chuồng nuôi</th>
                  <th className="py-3 px-4">Trạng thái</th>
                  <th className="py-3 px-4 text-right">Thao tác</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {paginatedCattle.map((cow) => {
                  const statusInfo = getStatusInfo(cow.status);

                  return (
                    <tr
                      key={cow.id}
                      className="hover:bg-slate-50 group cursor-pointer"
                      onClick={() => navigate(`/cattle/${cow.id}`)}
                    >
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={getCattleImageSrc(cow)}
                            alt={cow.name || 'Ảnh bò'}
                            onError={handleImageError}
                            className="w-12 h-12 rounded-xl object-cover ring-1 ring-slate-200"
                          />

                          <div>
                            <span className="font-bold text-slate-900 block">
                              {cow.id}
                            </span>
                            <span className="text-[11px] text-slate-500">
                              {cow.name}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5 font-mono">
                          <Radio className="w-3.5 h-3.5 text-emerald-600" />
                          {cow.rfidTag || 'Chưa có RFID'}
                        </div>
                        <span className="text-[10px] text-slate-400">
                          Tai: {cow.earTagNumber || 'Chưa có'}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="font-semibold block">
                          {cow.breed || 'Chưa cập nhật'}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {cow.gender === 'MALE'
                            ? 'Đực'
                            : cow.gender === 'FEMALE'
                              ? 'Cái'
                              : 'Chưa rõ'}{' '}
                          • {cow.ageMonths ?? 0} tháng
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1">
                          <Scale className="w-3.5 h-3.5 text-slate-400" />
                          <b>{cow.weight ?? 0} kg</b>
                        </div>
                        <span className="text-[10px] text-slate-400">
                          Mục tiêu: {cow.targetMarketWeight ?? 0} kg
                        </span>
                      </td>

                      <td className="py-3.5 px-4 font-medium text-slate-700">
                        {getBarnLabel(cow.penId)}
                      </td>

                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${statusInfo.color}`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${statusInfo.dot}`}
                          />
                          {statusInfo.label}
                        </span>
                      </td>

                      <td
                        className="py-3.5 px-4 text-right"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex justify-end gap-1">
                          <button
                            onClick={() => navigate(`/cattle/${cow.id}`)}
                            className="p-1.5 text-slate-500 hover:text-emerald-700 rounded-lg"
                            title="Xem chi tiết"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {isFarmManager && (
                            <>
                              <button
                                onClick={() => handleOpenEdit(cow)}
                                className="p-1.5 text-slate-500 hover:text-indigo-600 rounded-lg"
                                title="Sửa hồ sơ"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>

                              <button
                                onClick={() => handleDelete(cow)}
                                className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg"
                                title="Xóa/Loại đàn"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Grid */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {paginatedCattle.map((cow) => {
            const statusInfo = getStatusInfo(cow.status);

            return (
              <div
                key={cow.id}
                onClick={() => navigate(`/cattle/${cow.id}`)}
                className="bg-white rounded-2xl border border-slate-200 p-4 cursor-pointer"
              >
                <div className="relative rounded-xl overflow-hidden aspect-video mb-3 bg-slate-100">
                  <img
                    src={getCattleImageSrc(cow)}
                    alt={cow.name || 'Ảnh bò'}
                    onError={handleImageError}
                    className="w-full h-full object-cover"
                  />

                  <div className="absolute top-2 left-2">
                    <span className="text-xs bg-slate-900/80 text-white px-2 py-1 rounded">
                      {cow.id}
                    </span>
                  </div>

                  <div className="absolute top-2 right-2">
                    <span
                      className={`text-[10px] px-2 py-1 rounded-full border ${statusInfo.color}`}
                    >
                      {statusInfo.label}
                    </span>
                  </div>
                </div>

                <h3 className="font-bold text-sm">{cow.name}</h3>
                <p className="text-xs text-slate-500">{cow.breed}</p>

                <div className="mt-3 p-2.5 bg-slate-50 rounded-xl text-xs space-y-2">
                  <div className="flex justify-between">
                    <span>RFID:</span>
                    <b>{cow.rfidTag || 'Chưa có'}</b>
                  </div>

                  <div className="flex justify-between">
                    <span>Cân nặng:</span>
                    <b>{cow.weight ?? 0} kg</b>
                  </div>

                  <div className="flex justify-between">
                    <span>Chuồng:</span>
                    <b>{getBarnLabel(cow.penId)}</b>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex justify-between text-xs">
                  <span className="text-slate-400">
                    {cow.earTagNumber}
                  </span>
                  <span className="text-emerald-600 font-semibold">
                    Chi tiết hồ sơ →
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Phân trang */}
      {filteredCattle.length > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200">
          <div className="flex items-center gap-2 text-xs text-slate-600">
            <span>Hiển thị</span>

            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="px-2 py-1.5 border border-slate-200 rounded-lg bg-white"
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>

            <span>con mỗi trang</span>
            <span className="ml-2">
              Tổng: <b>{filteredCattle.length}</b> con bò
            </span>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage(1)}
              disabled={safeCurrentPage === 1}
              className="px-3 py-2 text-xs border rounded-lg disabled:opacity-40"
            >
              Đầu
            </button>

            <button
              onClick={() =>
                setCurrentPage((prev) => Math.max(1, prev - 1))
              }
              disabled={safeCurrentPage === 1}
              className="px-3 py-2 text-xs border rounded-lg disabled:opacity-40"
            >
              Trước
            </button>

            {Array.from(
              { length: totalPages },
              (_, index) => index + 1
            ).map((page) => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`min-w-9 px-3 py-2 text-xs border rounded-lg ${
                  safeCurrentPage === page
                    ? 'bg-emerald-600 text-white border-emerald-600'
                    : 'bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                {page}
              </button>
            ))}

            <button
              onClick={() =>
                setCurrentPage((prev) =>
                  Math.min(totalPages, prev + 1)
                )
              }
              disabled={safeCurrentPage === totalPages}
              className="px-3 py-2 text-xs border rounded-lg disabled:opacity-40"
            >
              Sau
            </button>

            <button
              onClick={() => setCurrentPage(totalPages)}
              disabled={safeCurrentPage === totalPages}
              className="px-3 py-2 text-xs border rounded-lg disabled:opacity-40"
            >
              Cuối
            </button>
          </div>
        </div>
      )}

      {/* Không có kết quả */}
      {filteredCattle.length === 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center">
          <AlertCircle className="w-8 h-8 text-slate-400 mx-auto mb-2" />
          <p className="text-sm font-semibold text-slate-700">
            Không tìm thấy bò phù hợp
          </p>
          <p className="text-xs text-slate-500 mt-1">
            Hãy thử thay đổi từ khóa hoặc bộ lọc.
          </p>
        </div>
      )}

      {/* Form thêm và sửa bò */}
      {isFarmManager && (
        <CattleFormModal
          isOpen={isFormModalOpen}
          onClose={() => setIsFormModalOpen(false)}
          cattleToEdit={editingCattle}
        />
      )}
    </div>
  );
};
