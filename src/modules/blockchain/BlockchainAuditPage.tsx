import React, { useEffect, useState } from 'react';
import { useFarmStore } from '../../store/useFarmStore';
import {
  getBlockchainBlocksApi,
  verifyBlockchainApi,
} from '../../services/blockchainService';
import type { BlockchainBlock } from '../../services/blockchainService';
import {
  getAllAuditLogsApi,
  type BackendAuditLog,
} from '../../services/auditLogService';
import { useAuthStore } from '../../store/useAuthStore';
import {
  Link2,
  FileClock,
  ShieldCheck,
  CheckCircle2,
  Search,
} from 'lucide-react';

export const BlockchainAuditPage: React.FC = () => {
  const { addToast } = useFarmStore();
  const { currentUser } = useAuthStore();
  const isAdmin = currentUser?.role === 'ADMIN';
  const [blockchainBlocks, setBlockchainBlocks] = useState<BlockchainBlock[]>([]);
  const [isLoadingBlocks, setIsLoadingBlocks] = useState(true);
  const [ledgerValid, setLedgerValid] = useState<boolean | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);

  const [backendAuditLogs, setBackendAuditLogs] = useState<BackendAuditLog[]>([]);
  const [isLoadingAuditLogs, setIsLoadingAuditLogs] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const [activeTab, setActiveTab] = useState<'blockchain' | 'audit'>('blockchain');

  const filteredLogs = backendAuditLogs.filter((log) => {
    const keyword = searchTerm.toLowerCase().trim();

    if (!keyword) return true;

    return (
      log.username?.toLowerCase().includes(keyword) ||
      log.role?.toLowerCase().includes(keyword) ||
      log.action?.toLowerCase().includes(keyword) ||
      log.targetType?.toLowerCase().includes(keyword) ||
      log.targetId?.toLowerCase().includes(keyword) ||
      log.description?.toLowerCase().includes(keyword) ||
      JSON.stringify(log.details || {}).toLowerCase().includes(keyword)
    );
  });

  useEffect(() => {
    let mounted = true;

    const loadBlocks = async () => {
      try {
        const blocks = await getBlockchainBlocksApi();

        if (mounted) {
          setBlockchainBlocks(blocks);
          setLedgerValid(null);
        }
      } catch (error) {
        if (mounted) {
          addToast(
            'error',
            'Lỗi tải Blockchain',
            error instanceof Error
              ? error.message
              : 'Không thể tải dữ liệu sổ cái.'
          );
        }
      } finally {
        if (mounted) {
          setIsLoadingBlocks(false);
        }
      }
    };

    loadBlocks();

    return () => {
      mounted = false;
    };
  }, [addToast]);

  // Chỉ ADMIN được tải và xem nhật ký thao tác.
  useEffect(() => {
    let mounted = true;

    if (!isAdmin) {
      setBackendAuditLogs([]);
      setIsLoadingAuditLogs(false);
      return () => {
        mounted = false;
      };
    }

    const loadAuditLogs = async () => {
      try {
        setIsLoadingAuditLogs(true);

        const logs = await getAllAuditLogsApi();

        if (mounted) {
          setBackendAuditLogs(logs);
        }
      } catch (error) {
        if (mounted) {
          addToast(
            'error',
            'Lỗi tải nhật ký thao tác',
            error instanceof Error
              ? error.message
              : 'Không thể tải nhật ký từ máy chủ.'
          );
        }
      } finally {
        if (mounted) {
          setIsLoadingAuditLogs(false);
        }
      }
    };

    loadAuditLogs();

    return () => {
      mounted = false;
    };
  }, [isAdmin, addToast]);



  const handleVerifyLedger = async () => {
    setIsVerifying(true);

    try {
      const isValid = await verifyBlockchainApi();

      setLedgerValid(isValid);

      addToast(
        isValid ? 'success' : 'error',
        'Xác Thực Sổ Cái Blockchain',
        isValid
          ? `Tất cả ${blockchainBlocks.length} khối dữ liệu đều hợp lệ.`
          : 'Phát hiện dữ liệu không hợp lệ hoặc liên kết khối bị sai!'
      );
    } catch (error) {
      addToast(
        'error',
        'Lỗi xác thực Blockchain',
        error instanceof Error
          ? error.message
          : 'Không thể xác thực sổ cái.'
      );
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900">Lịch Sử Blockchain & Nhật Ký Thao Tác Hệ Thống</h1>
            <span className="text-xs bg-indigo-50 text-indigo-700 border border-indigo-200 px-2.5 py-0.5 rounded-full font-bold">
              Bảo Chứng Bất Biến
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Sổ cái phân tán theo dõi nguồn gốc thịt bò, cân nặng, tiêm phòng và toàn bộ lịch sử truy vết người dùng
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleVerifyLedger}
            disabled={isVerifying}
            className="px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-800 border border-indigo-200 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <ShieldCheck className={`w-4 h-4 text-indigo-600 ${isVerifying ? 'animate-spin' : ''}`} />
            <span>{isVerifying ? 'Đang Kiểm Tra...' : 'Kiểm Tra Toàn Vẹn Chuỗi'}</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 text-xs font-bold">
        <button
          onClick={() => setActiveTab('blockchain')}
          className={`py-3 px-4 border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'blockchain'
              ? 'border-indigo-600 text-indigo-700'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Link2 className="w-4 h-4" />
          <span>Sổ Cái Chuỗi Khối Blockchain ({blockchainBlocks.length} khối)</span>
        </button>

        {isAdmin && (
          <button
            onClick={() => setActiveTab('audit')}
            className={`py-3 px-4 border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'audit'
                ? 'border-indigo-600 text-indigo-700'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <FileClock className="w-4 h-4" />
            <span>
              Nhật Ký Thao Tác Audit Log ({backendAuditLogs.length} ghi nhận)
            </span>
          </button>
        )}
      </div>

      {/* Tab 1: Blockchain Explorer */}
      {activeTab === 'blockchain' && (
        <div className="space-y-4">
          {ledgerValid === true && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between text-xs text-emerald-900">
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <span>
                  <strong>Chuỗi Khối Đạt Chuẩn Toàn Vẹn 100%:</strong> Mọi mã băm SHA liên kết từ Khối Khởi Sinh (Genesis Block) đến khối mới nhất đều khớp chuẩn xác.
                </span>
              </div>
              <span className="font-mono text-[11px] font-bold text-emerald-700">SHA-256</span>
            </div>
          )}

          <div className="space-y-4">
            {isLoadingBlocks ? (
              <div className="text-center py-10 text-slate-500">
                Đang tải dữ liệu Blockchain...
              </div>
            ) : blockchainBlocks.length === 0 ? (
              <div className="text-center py-10 text-slate-500">
                Chưa có dữ liệu Blockchain.
              </div>
            ) : (
              blockchainBlocks.slice().reverse().map((block) => (
                <div
                  key={block.index}
                className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs hover:border-indigo-300 transition-all space-y-3 relative overflow-hidden"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <span className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-700 flex items-center justify-center font-mono font-extrabold text-xs">
                      #{block.index}
                    </span>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 text-sm">{block.action}</span>
                        <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-semibold font-mono">
                          {block.role}
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-400 font-mono">Thời gian: {block.timestamp}</span>
                    </div>
                  </div>

                  <span className="text-xs text-slate-500">
                    Người ký số: <strong className="text-slate-800">{block.operator}</strong>
                  </span>
                </div>

                {/* Hashes */}
                <div className="p-3 bg-slate-900 text-emerald-400 font-mono rounded-2xl text-[11px] space-y-1.5 break-all">
                  <div>
                    <span className="text-slate-500 uppercase text-[9px] block">Block Hash:</span>
                    <span className="font-bold text-emerald-300">{block.hash}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 uppercase text-[9px] block">Previous Hash (Mã Khối Trước):</span>
                    <span className="text-slate-400">{block.previousHash}</span>
                  </div>
                </div>

                {/* Data payload */}
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block mb-1">
                    Payload Dữ Liệu Bất Biến:
                  </span>
                  <pre className="text-[11px] font-mono text-slate-700 whitespace-pre-wrap">
                    {JSON.stringify(block.data, null, 2)}
                  </pre>
                </div>
                </div>
                ))
              )}
            </div>
        </div>
      )}

      {/* Tab 2: Audit Log */}
      {isAdmin && activeTab === 'audit' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Tìm kiếm nhật ký thao tác theo hành động, nhân sự, phân hệ..."
                className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase">Thời gian</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase">Người thực hiện</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase">Vai trò</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase">Hành động</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase">Đối tượng</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase">Chi tiết</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-[11px]">
                {isLoadingAuditLogs ? (
                  <tr>
                    <td colSpan={6} className="py-10 text-center text-slate-500">
                      Đang tải nhật ký từ máy chủ...
                    </td>
                  </tr>
                ) : filteredLogs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-10 text-center text-slate-500">
                      {backendAuditLogs.length === 0
                        ? 'Chưa có nhật ký thao tác trên máy chủ.'
                        : 'Không tìm thấy nhật ký phù hợp.'}
                    </td>
                  </tr>
                ) : (
                  filteredLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50">
                      <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                        {log.timestamp?.replace('T', ' ')}
                      </td>

                      <td className="py-3 px-4 font-sans font-bold text-slate-900">
                        {log.username}
                      </td>

                      <td className="py-3 px-4">
                        <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[10px] font-bold">
                          {log.role}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-indigo-700 font-bold">
                        {log.action}
                      </td>

                      <td className="py-3 px-4 font-sans text-slate-600">
                        {log.targetType}
                        {log.targetId ? ` - ${log.targetId}` : ''}
                      </td>

                      <td className="py-3 px-4 font-sans text-slate-700">
                        <div>{log.description}</div>
                        {log.details && Object.keys(log.details).length > 0 && (
                          <pre className="mt-1 whitespace-pre-wrap break-all text-[10px] text-slate-400">
                            {JSON.stringify(log.details, null, 2)}
                          </pre>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
