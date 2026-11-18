import React, { useEffect, useState } from 'react';
import {
  uploadCattleImageApi,
  getCattleImageUrlApi,
} from '../../services/fileService';
import { useFarmStore } from '../../store/useFarmStore';
import { useAuthStore } from '../../store/useAuthStore';
import { Cattle, CattleGender, CattleStatus } from '../../types';
import { X, Sparkles, Tag } from 'lucide-react';

interface CattleFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  cattleToEdit?: Cattle | null;
}

const BREED_OPTIONS = [
  { value: 'Black Angus', label: 'Black Angus (Úc / Mỹ)' },
  { value: 'Blanc Bleu Belge (3B)', label: 'Blanc Bleu Belge (3B Siêu Thịt)' },
  { value: 'Brahman Red', label: 'Brahman Đỏ Nhiệt Đới' },
  { value: 'Wagyu Cross F1', label: 'Wagyu Lai F1 Nhật Bản' },
  { value: 'Senepol', label: 'Senepol Giống Thuần' },
  { value: 'Holstein Friesian (HF)', label: 'Holstein Friesian (HF Bò Sữa)' },
];

export const CattleFormModal: React.FC<CattleFormModalProps> = ({ isOpen, onClose, cattleToEdit }) => {
  const { barns, addCattle, updateCattle } = useFarmStore();
  const { currentUser } = useAuthStore();

  const [isOtherBreed, setIsOtherBreed] = useState(
    Boolean(
      cattleToEdit?.breed &&
      !BREED_OPTIONS.some((breed) => breed.value === cattleToEdit.breed)
    )
  );

  const [customBreed, setCustomBreed] = useState(
    cattleToEdit?.breed &&
    !BREED_OPTIONS.some((breed) => breed.value === cattleToEdit.breed)
      ? cattleToEdit.breed
      : ''
  );

  const [formData, setFormData] = useState({
    name: cattleToEdit?.name || '',
    rfidTag: cattleToEdit?.rfidTag || `982.000.${Math.floor(100 + Math.random() * 900)}.${Math.floor(100 + Math.random() * 900)}`,
    earTagNumber: cattleToEdit?.earTagNumber || `#0${Math.floor(100 + Math.random() * 900)}`,
    breed: cattleToEdit?.breed || 'Black Angus',
    gender: cattleToEdit?.gender || ('MALE' as CattleGender),
    dob: cattleToEdit?.dob || '2024-05-01',
    ageMonths: cattleToEdit?.ageMonths || 24,
    weight: cattleToEdit?.weight || 450,
    initialWeight: cattleToEdit?.initialWeight || 240,
    penId: cattleToEdit?.penId || (barns[0]?.id || 'PEN-01'),
    status: cattleToEdit?.status || ('HEALTHY' as CattleStatus),
    origin: cattleToEdit?.origin || 'Trại giống Ba Vì',
    entryDate: cattleToEdit?.entryDate || new Date().toISOString().split('T')[0],
    targetMarketWeight: cattleToEdit?.targetMarketWeight || 550,
    withdrawalDaysRemaining: cattleToEdit?.withdrawalDaysRemaining || 0,
    photoUrl:
      cattleToEdit?.photoUrl ||
      'https://images.unsplash.com/photo-1546445317-29f4545e9d53?auto=format&fit=crop&w=500&q=80',
    qrCodeData: cattleToEdit?.qrCodeData || 'https://bovsmart.vn/verify',
    notes: cattleToEdit?.notes || '',
  });

    // Quản lý ảnh bò được chọn từ máy tính
  const [selectedImage, setSelectedImage] = useState<File | null>(null);

  const [previewImage, setPreviewImage] = useState(
    cattleToEdit?.photoUrl ||
    'https://images.unsplash.com/photo-1546445317-29f4545e9d53?auto=format&fit=crop&w=500&q=80'
  );

  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const loadPreviewImage = async () => {
      setSelectedImage(null);

      const photoUrl = cattleToEdit?.photoUrl?.trim();

      if (!photoUrl) {
        setPreviewImage(
          'https://images.unsplash.com/photo-1546445317-29f4545e9d53?auto=format&fit=crop&w=500&q=80'
        );
        setSelectedImage(null);
        return;
      }

      if (!photoUrl.startsWith('minio:')) {
        setPreviewImage(photoUrl);
        return;
      }

      try {
        const response = await getCattleImageUrlApi(photoUrl.slice(6));

        if (!cancelled) {
          setPreviewImage(response.url);
        }
      } catch (error) {
        console.error('Không thể tải ảnh MinIO:', error);

        if (!cancelled) {
          setPreviewImage('/assets/aiStudio/cattle-default.png');
        }
      }
    };

    loadPreviewImage();

    return () => {
      cancelled = true;
    };
  }, [cattleToEdit?.photoUrl]);

  useEffect(() => {
    if (!isOpen) return;

    const breed = cattleToEdit?.breed || 'Black Angus';
    const isCustom = !BREED_OPTIONS.some((item) => item.value === breed);

    setFormData({
      name: cattleToEdit?.name || '',
      rfidTag: cattleToEdit?.rfidTag || `982.000.${Math.floor(100 + Math.random() * 900)}.${Math.floor(100 + Math.random() * 900)}`,
      earTagNumber: cattleToEdit?.earTagNumber || `#0${Math.floor(100 + Math.random() * 900)}`,
      breed: isCustom ? 'Black Angus' : breed,
      gender: cattleToEdit?.gender || ('MALE' as CattleGender),
      dob: cattleToEdit?.dob || '2024-05-01',
      ageMonths: cattleToEdit?.ageMonths || 24,
      weight: cattleToEdit?.weight || 450,
      initialWeight: cattleToEdit?.initialWeight || 240,
      penId: cattleToEdit?.penId || (barns[0]?.id || 'PEN-01'),
      status: cattleToEdit?.status || ('HEALTHY' as CattleStatus),
      origin: cattleToEdit?.origin || 'Trại giống Ba Vì',
      entryDate: cattleToEdit?.entryDate || new Date().toISOString().split('T')[0],
      targetMarketWeight: cattleToEdit?.targetMarketWeight || 550,
      withdrawalDaysRemaining: cattleToEdit?.withdrawalDaysRemaining || 0,
      photoUrl: cattleToEdit?.photoUrl ||
        'https://images.unsplash.com/photo-1546445317-29f4545e9d53?auto=format&fit=crop&w=500&q=80',
      qrCodeData: cattleToEdit?.qrCodeData || 'https://bovsmart.vn/verify',
      notes: cattleToEdit?.notes || '',
    });

    setIsOtherBreed(isCustom);
    setCustomBreed(isCustom ? breed : '');
    setSelectedImage(null);
}, [isOpen, cattleToEdit?.id]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      alert('Phiên đăng nhập không hợp lệ. Vui lòng đăng nhập lại!');
      return;
    }

    const trimmedName = formData.name.trim();
    const finalBreed = isOtherBreed ? customBreed.trim() : formData.breed;

    if (!trimmedName) {
      alert('Vui lòng nhập tên gọi của bò!');
      return;
    }

    if (!finalBreed) {
      alert('Vui lòng nhập tên giống bò!');
      return;
    }

    try {
      setIsUploading(true);

      let photoUrl = formData.photoUrl;

      // Nếu người dùng chọn ảnh mới thì tải lên MinIO trước
      if (selectedImage) {
        const uploadedFile = await uploadCattleImageApi(selectedImage);
        photoUrl = `minio:${uploadedFile.id}`;
      }

      const cattleData = {
        ...formData,
        name: trimmedName,
        breed: finalBreed,
        photoUrl,
      };

      if (cattleToEdit) {
       await updateCattle(
          cattleToEdit.id,
          cattleData,
          currentUser.name,
          currentUser.role
       );
      } else {
        await addCattle(
          cattleData,
          currentUser.name,
          currentUser.role
        );
      }

      onClose();
      } catch (error) {
        console.error('Lỗi lưu hồ sơ bò:', error);

        alert(
          error instanceof Error
            ? error.message
            : 'Không thể tải ảnh hoặc lưu hồ sơ bò!'
        );
      } finally {
        setIsUploading(false);
      }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-100 my-8 animate-in fade-in zoom-in-95">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Tag className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                {cattleToEdit ? `Chỉnh Sửa Hồ Sơ Bò: ${cattleToEdit.id}` : 'Thêm Cá Thể Bò Mới Vào Đàn'}
              </h2>
              <p className="text-xs text-slate-500">Tự động cấp mã RFID và ghi nhận khối xuất xứ trên Blockchain</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Mã thẻ tai RFID</label>
              <input
                type="text"
                required
                value={formData.rfidTag}
                onChange={(e) => setFormData({ ...formData, rfidTag: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Số tai bấm (Visual Tag)</label>
              <input
                type="text"
                required
                value={formData.earTagNumber}
                onChange={(e) => setFormData({ ...formData, earTagNumber: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Tên gọi / Biệt danh</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Angus Đỏ..."
                className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Giống bò
              </label>

              <select
                value={isOtherBreed ? '__OTHER__' : formData.breed}
                onChange={(e) => {
                  if (e.target.value === '__OTHER__') {
                    setIsOtherBreed(true);
                    setCustomBreed('');
                  } else {
                    setIsOtherBreed(false);
                    setCustomBreed('');
                    setFormData({ ...formData, breed: e.target.value });
                  }
                }}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-semibold"
              >
                {BREED_OPTIONS.map((breed) => (
                  <option key={breed.value} value={breed.value}>
                    {breed.label}
                  </option>
                ))}
                <option value="__OTHER__">Khác</option>
              </select>

              {isOtherBreed && (
                <input
                  type="text"
                  required
                  value={customBreed}
                  onChange={(e) => setCustomBreed(e.target.value)}
                  placeholder="Nhập tên giống bò mới..."
                  className="w-full mt-2 px-3 py-2 rounded-xl border border-emerald-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              )}
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Giới tính</label>
              <select
                value={formData.gender}
                onChange={(e) => setFormData({ ...formData, gender: e.target.value as CattleGender })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="MALE">Đực</option>
                <option value="FEMALE">Cái</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Chuồng nuôi</label>
              <select
                value={formData.penId}
                onChange={(e) => setFormData({ ...formData, penId: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-semibold"
              >
                {barns.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name} ({b.currentCount}/{b.capacity})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Trọng lượng hiện tại (kg)</label>
              <input
                type="number"
                step="0.5"
                required
                value={formData.weight}
                onChange={(e) => setFormData({ ...formData, weight: Number(e.target.value) })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500 font-bold"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Mục tiêu xuất bán (kg)</label>
              <input
                type="number"
                step="5"
                value={formData.targetMarketWeight}
                onChange={(e) => setFormData({ ...formData, targetMarketWeight: Number(e.target.value) })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Trạng thái sức khỏe</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as CattleStatus })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500">
                  <option value="HEALTHY">Khỏe mạnh</option>
                  <option value="CAN_THEO_DOI">Đang theo dõi thích nghi</option>
                  <option value="TREATMENT">Đang điều trị</option>
                  <option value="QUARANTINE">Cách ly thú y</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Nguồn gốc xuất xứ
              </label>

              <select
                value={
                  [
                    'Trại giống Ba Vì',
                    'Trang trại Hà Nam',
                    'Trang trại Hòa Bình',
                    'Trang trại Sơn La',
                    'Trang trại Nghệ An',
                    'Cơ sở chăn nuôi nhập khẩu',
                  ].includes(formData.origin)
                    ? formData.origin
                    : 'Khác'
                }
                onChange={(e) => {
                  setFormData({
                    ...formData,
                    origin: e.target.value === 'Khác' ? '' : e.target.value,
                  });
                }}
                required
                className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="">-- Chọn nguồn gốc --</option>
                <option value="Trại giống Ba Vì">Trại giống Ba Vì</option>
                <option value="Trang trại Hà Nam">Trang trại Hà Nam</option>
                <option value="Trang trại Hòa Bình">Trang trại Hòa Bình</option>
                <option value="Trang trại Sơn La">Trang trại Sơn La</option>
                <option value="Trang trại Nghệ An">Trang trại Nghệ An</option>
                <option value="Cơ sở chăn nuôi nhập khẩu">
                  Cơ sở chăn nuôi nhập khẩu
                </option>
                <option value="Khác">Khác (nhập nguồn gốc mới)</option>
              </select>

              {(![
                'Trại giống Ba Vì',
                'Trang trại Hà Nam',
                'Trang trại Hòa Bình',
                'Trang trại Sơn La',
                'Trang trại Nghệ An',
                'Cơ sở chăn nuôi nhập khẩu',
              ].includes(formData.origin)) && (
                <input
                  type="text"
                  required
                  value={formData.origin}
                  onChange={(e) =>
                    setFormData({ ...formData, origin: e.target.value })
                  }
                  placeholder="Nhập nguồn gốc xuất xứ..."
                  className="w-full mt-2 px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              )}
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Ngày nhập trại</label>
              <input
                type="date"
                required
                value={formData.entryDate}
                onChange={(e) => setFormData({ ...formData, entryDate: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          
          <div>
            <label className="block font-semibold text-slate-700 mb-2">
              Ảnh cá thể bò
            </label>

            <div className="flex flex-col sm:flex-row gap-4 items-start">
              <div className="w-36 h-36 rounded-xl border border-slate-200 overflow-hidden bg-slate-50 flex items-center justify-center">
                {previewImage ? (
                  <img
                    src={previewImage}
                    alt="Ảnh xem trước bò"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-slate-400">Chưa có ảnh</span>
                )}
              </div>

              <div className="flex-1 space-y-2">
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/gif"
                  onChange={(e) => {
                    const file = e.target.files?.[0];

                    if (!file) return;

                    if (file.size > 5 * 1024 * 1024) {
                      alert('Ảnh không được vượt quá 5MB!');
                      e.target.value = '';
                      return;
                    }

                    setSelectedImage(file);
                    setPreviewImage(URL.createObjectURL(file));
                  }}
                  className="block w-full text-xs text-slate-600 file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:bg-emerald-50 file:text-emerald-700 file:font-semibold"
                />

                <p className="text-[11px] text-slate-500">
                  Chấp nhận JPG, PNG, GIF. Dung lượng tối đa 5MB.
                </p>

                {selectedImage && (
                  <p className="text-[11px] text-emerald-600 font-semibold">
                    Đã chọn: {selectedImage.name}
                  </p>
                )}
              </div>
            </div>
          </div>


          <div>
            <label className="block font-semibold text-slate-700 mb-1">Ghi chú đặc điểm nhận dạng</label>
            <textarea
              rows={2}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Vết bớt trán, tính tình hiền lành, móng guốc chắc khỏe..."
              className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-semibold"
            >
              Hủy
            </button>
            
            <button
              type="submit"
              disabled={isUploading}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-bold shadow-md shadow-emerald-600/20 flex items-center gap-1.5"
            >
              {isUploading ? (
                <span>Đang tải ảnh...</span>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>
                    {cattleToEdit ? 'Lưu Hồ Sơ' : 'Xác Thực & Thêm Vào Đàn'}
                  </span>
                </>
              )}
            </button>

          </div>
        </form>
      </div>
    </div>
  );
};
