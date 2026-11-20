
import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';

import {
  Bot,
  X,
  Send,
  MessageCircle,
  Loader2,
  BookOpen,
  Sparkles,
  Plus,
  Trash2,
  MessageSquare,
  PanelLeftClose,
  PanelLeftOpen,
  FileText,
  Image as ImageIcon,
} from 'lucide-react';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useAuthStore } from '../store/useAuthStore';

import {
  askChatbotApi,
  uploadChatAttachmentApi,
  createConversationApi,
  getConversationsApi,
  getConversationMessagesApi,
  deleteConversationApi,
  ChatConversation,
  ChatMessageHistory,
} from '../services/chatbotService';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  sources?: string[];
  attachments?: {
    name: string;
    isImage: boolean;
  }[];
  createdAt?: string;
  isError?: boolean;
}

const WELCOME_MESSAGE: ChatMessage = {
  id: 'welcome',
  role: 'assistant',
  content:
    'Xin chào! Tôi là trợ lý AI BovSmart. Tôi có thể hỗ trợ bạn tìm hiểu kiến thức về chăn nuôi bò, dinh dưỡng, TMR và chăm sóc sức khỏe đàn bò.',
  sources: [],
};

const QUICK_PROMPTS = [
  'TMR trong chăn nuôi bò là gì và có mục đích gì?',
  'Các thành phần thường gặp trong khẩu phần TMR?',
  'Lưu ý gì khi phối trộn và thay đổi khẩu phần TMR?',
  'Cách theo dõi hiệu quả khẩu phần cho đàn bò?',
];

const MAX_ATTACHMENTS = 5;
const MAX_FILE_SIZE_MB = 10;

const ChatbotWidget: React.FC = () => {
  const token = useAuthStore((state) => state.token);
  const isAuthenticated = useAuthStore(
    (state) => state.isAuthenticated
  );

  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [currentConversationId, setCurrentConversationId] =
    useState<string | null>(null);

  const [messages, setMessages] = useState<ChatMessage[]>([
    WELCOME_MESSAGE,
  ]);

  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [bannerError, setBannerError] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Theo dõi yêu cầu tải lịch sử để bỏ qua kết quả cũ.
  const historyRequestRef = useRef(0);

  // Theo dõi yêu cầu tải tin nhắn để tránh ghi đè hội thoại mới.
  const messagesRequestRef = useRef(0);

  // Nhận biết tài khoản hiện tại.
  const accountKeyRef = useRef<string | null>(token);

  // Cuộn xuống cuối danh sách tin nhắn.
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: 'smooth',
    });
  }, [messages, isLoading, isOpen]);

  // Focus ô nhập khi mở chatbot.
  useEffect(() => {
    if (!isOpen) return;

    const timer = window.setTimeout(() => {
      textareaRef.current?.focus();
    }, 100);

    return () => window.clearTimeout(timer);
  }, [isOpen]);

  // Xóa dữ liệu giao diện khi đăng xuất hoặc đổi tài khoản.
  useEffect(() => {
    if (accountKeyRef.current === token) return;

    accountKeyRef.current = token;

    historyRequestRef.current += 1;
    messagesRequestRef.current += 1;

    setConversations([]);
    setCurrentConversationId(null);
    setMessages([WELCOME_MESSAGE]);
    setSelectedFiles([]);
    setInput('');
    setBannerError(null);

    setIsLoading(false);
    setIsHistoryLoading(false);
    setDeletingId(null);
  }, [token]);

  // Tải danh sách cuộc trò chuyện.
  const loadConversations = useCallback(async () => {
    if (!token || !isAuthenticated) return;

    const requestId = ++historyRequestRef.current;
    const accountKey = token;

    setIsHistoryLoading(true);
    setBannerError(null);

    try {
      const result = await getConversationsApi(token);

      if (
        requestId !== historyRequestRef.current ||
        accountKeyRef.current !== accountKey
      ) {
        return;
      }

      setConversations(Array.isArray(result) ? result : []);
    } catch (error) {
      if (
        requestId !== historyRequestRef.current ||
        accountKeyRef.current !== accountKey
      ) {
        return;
      }

      console.error('Không thể tải lịch sử chatbot:', error);

      setBannerError(
        error instanceof Error
          ? error.message
          : 'Không thể tải lịch sử trò chuyện.'
      );
    } finally {
      if (
        requestId === historyRequestRef.current &&
        accountKeyRef.current === accountKey
      ) {
        setIsHistoryLoading(false);
      }
    }
  }, [token, isAuthenticated]);

  // Tự động tải lịch sử khi mở chatbot.
  useEffect(() => {
    if (isOpen && isAuthenticated && token) {
      void loadConversations();
    }
  }, [isOpen, isAuthenticated, token, loadConversations]);

  // Chọn tệp đính kèm.
  const handleFileChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = Array.from(event.target.files || []);

    // Cho phép chọn lại cùng một tệp.
    event.target.value = '';

    if (files.length === 0) return;

    const validFiles: File[] = [];

    for (const file of files) {
      if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
        alert(
          `Tệp "${file.name}" vượt quá giới hạn ${MAX_FILE_SIZE_MB}MB.`
        );
        continue;
      }

      validFiles.push(file);
    }

    setSelectedFiles((previous) => {
      const remainingSlots = MAX_ATTACHMENTS - previous.length;

      if (remainingSlots <= 0) {
        alert(
          `Chỉ được đính kèm tối đa ${MAX_ATTACHMENTS} tệp mỗi tin nhắn.`
        );
        return previous;
      }

      if (validFiles.length > remainingSlots) {
        alert(
          `Bạn chỉ có thể thêm tối đa ${remainingSlots} tệp nữa.`
        );
      }

      return [
        ...previous,
        ...validFiles.slice(0, remainingSlots),
      ];
    });
  };

  // Xóa tệp đã chọn.
  const handleRemoveFile = (indexToRemove: number) => {
    setSelectedFiles((previous) =>
      previous.filter((_, index) => index !== indexToRemove)
    );
  };

  // Tạo cuộc trò chuyện mới.
  const handleNewConversation = () => {
    if (isLoading || isHistoryLoading) return;

    messagesRequestRef.current += 1;

    setBannerError(null);
    setCurrentConversationId(null);
    setMessages([WELCOME_MESSAGE]);
    setInput('');
    setSelectedFiles([]);

    textareaRef.current?.focus();
  };

  // Chọn một cuộc trò chuyện trong lịch sử.
  const handleSelectConversation = async (
    conversationId: string
  ) => {
    if (
      !token ||
      isLoading ||
      isHistoryLoading ||
      currentConversationId === conversationId
    ) {
      return;
    }

    const requestId = ++messagesRequestRef.current;
    const accountKey = token;

    setIsHistoryLoading(true);
    setBannerError(null);
    setCurrentConversationId(conversationId);
    setMessages([]);
    setSelectedFiles([]);
    setInput('');

    try {
      const result = await getConversationMessagesApi(
        conversationId,
        token
      );

      if (
        requestId !== messagesRequestRef.current ||
        accountKeyRef.current !== accountKey
      ) {
        return;
      }

      const historyMessages: ChatMessage[] = (result || []).map(
        (message: ChatMessageHistory) => ({
          id: message.id,
          role: message.role === 'USER' ? 'user' : 'assistant',
          content: message.content,
          sources: message.sources || [],
          createdAt: message.createdAt,
        })
      );

      setMessages(
        historyMessages.length > 0
          ? historyMessages
          : [WELCOME_MESSAGE]
      );
    } catch (error) {
      if (
        requestId !== messagesRequestRef.current ||
        accountKeyRef.current !== accountKey
      ) {
        return;
      }

      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Không thể tải lịch sử trò chuyện.';

      setMessages([
        {
          id: `error-${Date.now()}`,
          role: 'assistant',
          content: errorMessage,
          isError: true,
        },
      ]);
    } finally {
      if (
        requestId === messagesRequestRef.current &&
        accountKeyRef.current === accountKey
      ) {
        setIsHistoryLoading(false);
      }
    }
  };

  // Xóa cuộc trò chuyện.
  const handleDeleteConversation = async (
    event: React.MouseEvent,
    conversationId: string
  ) => {
    event.stopPropagation();

    if (!token || deletingId || isLoading) return;

    const confirmed = window.confirm(
      'Bạn có chắc chắn muốn xóa cuộc trò chuyện này không?'
    );

    if (!confirmed) return;

    const accountKey = token;

    setDeletingId(conversationId);
    setBannerError(null);

    try {
      await deleteConversationApi(conversationId, token);

      if (accountKeyRef.current !== accountKey) return;

      setConversations((previous) =>
        previous.filter((item) => item.id !== conversationId)
      );

      if (currentConversationId === conversationId) {
        messagesRequestRef.current += 1;

        setCurrentConversationId(null);
        setMessages([WELCOME_MESSAGE]);
        setSelectedFiles([]);
      }
    } catch (error) {
      if (accountKeyRef.current !== accountKey) return;

      alert(
        error instanceof Error
          ? error.message
          : 'Không thể xóa cuộc trò chuyện.'
      );
    } finally {
      if (accountKeyRef.current === accountKey) {
        setDeletingId(null);
      }
    }
  };

  // Gửi câu hỏi và tệp đính kèm.
  const sendQuestion = async (
    rawQuestion: string,
    filesOverride?: File[]
  ) => {
    const question = rawQuestion.trim();

    const filesToSend = filesOverride
      ? [...filesOverride]
      : [...selectedFiles];

    if (
      (!question && filesToSend.length === 0) ||
      isLoading ||
      isHistoryLoading
    ) {
      return;
    }

    if (!token) {
      setMessages((previous) => [
        ...previous,
        {
          id: `error-${Date.now()}`,
          role: 'assistant',
          content: 'Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.',
          isError: true,
        },
      ]);
      return;
    }

    if (filesToSend.length > MAX_ATTACHMENTS) {
      setBannerError(
        `Chỉ được đính kèm tối đa ${MAX_ATTACHMENTS} tệp.`
      );
      return;
    }

    const accountKey = token;

    const promptText =
      question ||
      `Phân tích tệp đính kèm: ${filesToSend
        .map((file) => file.name)
        .join(', ')}`;

    setInput('');
    setSelectedFiles([]);
    setBannerError(null);
    setIsLoading(true);

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: promptText,
      attachments: filesToSend.map((file) => ({
        name: file.name,
        isImage: file.type.startsWith('image/'),
      })),
      createdAt: new Date().toISOString(),
    };

    setMessages((previous) => [...previous, userMessage]);

    try {
      // Tạo cuộc trò chuyện nếu chưa có.
      let conversationId = currentConversationId;

      if (!conversationId) {
        const conversation = await createConversationApi(token);

        if (accountKeyRef.current !== accountKey) return;

        conversationId = conversation.id;

        setCurrentConversationId(conversationId);

        setConversations((previous) => [
          conversation,
          ...previous.filter(
            (item) => item.id !== conversation.id
          ),
        ]);
      }

      // Upload từng tệp lên backend và nhận attachmentId.
      const uploadedFiles = await Promise.all(
        filesToSend.map((file) =>
          uploadChatAttachmentApi(file, token)
        )
      );

      if (accountKeyRef.current !== accountKey) return;

      const attachmentIds = uploadedFiles.map(
        (file) => file.id
      );

      // Gửi câu hỏi cùng danh sách attachmentIds.
      const result = await askChatbotApi(
        promptText,
        conversationId,
        token,
        attachmentIds
      );

      if (accountKeyRef.current !== accountKey) return;

      const assistantMessage: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: result.answer,
        sources: result.sources || [],
        createdAt: new Date().toISOString(),
      };

      setMessages((previous) => [
        ...previous,
        assistantMessage,
      ]);

      // Cập nhật lại danh sách lịch sử.
      await loadConversations();
    } catch (error) {
      if (accountKeyRef.current !== accountKey) return;

      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Không thể kết nối với trợ lý AI. Vui lòng thử lại.';

      setMessages((previous) => [
        ...previous,
        {
          id: `error-${Date.now()}`,
          role: 'assistant',
          content: errorMessage,
          isError: true,
        },
      ]);

      await loadConversations();
    } finally {
      if (accountKeyRef.current === accountKey) {
        setIsLoading(false);
      }
    }
  };

  // Gửi nội dung trong ô nhập.
  const handleSend = async () => {
    await sendQuestion(input);
  };

  // Enter để gửi, Shift + Enter để xuống dòng.
  const handleKeyDown = (
    event: React.KeyboardEvent<HTMLTextAreaElement>
  ) => {
    if (
      event.key === 'Enter' &&
      !event.shiftKey &&
      !event.nativeEvent.isComposing
    ) {
      event.preventDefault();
      void handleSend();
    }
  };

  if (!isAuthenticated || !token) {
    return null;
  }

  return (
    <>
      {isOpen && (
        <div className="fixed bottom-24 right-4 sm:bottom-24 sm:right-6 z-[100] flex flex-col w-[calc(100vw-2rem)] sm:w-[680px] h-[min(650px,calc(100dvh-8rem))] bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">

          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-emerald-700 to-emerald-600 text-white shrink-0">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() =>
                  setIsSidebarOpen((previous) => !previous)
                }
                className="p-2 rounded-lg hover:bg-white/15 transition"
                title={
                  isSidebarOpen
                    ? 'Thu gọn lịch sử'
                    : 'Mở lịch sử'
                }
              >
                {isSidebarOpen ? (
                  <PanelLeftClose size={19} />
                ) : (
                  <PanelLeftOpen size={19} />
                )}
              </button>

              <div className="w-9 h-9 rounded-full bg-white/15 flex items-center justify-center">
                <Bot size={21} />
              </div>

              <div>
                <h3 className="font-semibold text-sm">
                  Trợ lý AI BovSmart
                </h3>
                <p className="text-xs text-emerald-100">
                  Hỗ trợ kiến thức chăn nuôi
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="p-2 rounded-lg hover:bg-white/15 transition"
              aria-label="Đóng chatbot"
            >
              <X size={20} />
            </button>
          </div>

          {/* Thông báo lỗi */}
          {bannerError && (
            <div className="px-4 py-2 bg-amber-50 border-b border-amber-200 text-amber-800 text-xs flex items-center justify-between gap-2 shrink-0">
              <span>{bannerError}</span>

              <button
                type="button"
                onClick={() => setBannerError(null)}
                className="text-amber-700 hover:text-amber-950 font-medium shrink-0"
              >
                Đóng
              </button>
            </div>
          )}

          {/* Main content */}
          <div className="flex flex-1 min-h-0">

            {/* Sidebar lịch sử */}
            {isSidebarOpen && (
              <aside className="w-[195px] sm:w-[225px] shrink-0 border-r border-slate-200 bg-slate-50 flex flex-col min-h-0">

                <div className="p-3">
                  <button
                    type="button"
                    onClick={handleNewConversation}
                    disabled={isLoading || isHistoryLoading}
                    className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 disabled:opacity-50 transition"
                  >
                    <Plus size={17} />
                    Cuộc trò chuyện mới
                  </button>
                </div>

                <div className="px-3 pb-2">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                    Lịch sử trò chuyện
                  </p>
                </div>

                <div className="flex-1 overflow-y-auto px-2 pb-3 space-y-1">

                  {isHistoryLoading &&
                  conversations.length === 0 ? (
                    <div className="flex justify-center py-6">
                      <Loader2
                        className="animate-spin text-emerald-600"
                        size={19}
                      />
                    </div>
                  ) : conversations.length === 0 ? (
                    <div className="text-center px-2 py-6">
                      <MessageSquare
                        size={23}
                        className="mx-auto text-slate-300 mb-2"
                      />
                      <p className="text-xs text-slate-400">
                        Chưa có lịch sử trò chuyện
                      </p>
                    </div>
                  ) : (
                    conversations.map((conversation) => (
                      <div
                        key={conversation.id}
                        onClick={() =>
                          void handleSelectConversation(
                            conversation.id
                          )
                        }
                        className={`group flex items-center gap-1 rounded-lg px-2 py-2 cursor-pointer transition ${
                          currentConversationId === conversation.id
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'hover:bg-slate-200 text-slate-600'
                        }`}
                      >
                        <MessageSquare
                          size={15}
                          className="shrink-0"
                        />

                        <span className="flex-1 min-w-0 text-xs truncate">
                          {conversation.title ||
                            'Cuộc trò chuyện mới'}
                        </span>

                        <button
                          type="button"
                          onClick={(event) =>
                            void handleDeleteConversation(
                              event,
                              conversation.id
                            )
                          }
                          disabled={
                            deletingId === conversation.id ||
                            isLoading
                          }
                          className="shrink-0 p-1 rounded hover:bg-red-100 hover:text-red-600 opacity-0 group-hover:opacity-100 focus:opacity-100 transition disabled:opacity-50"
                          title="Xóa cuộc trò chuyện"
                          aria-label="Xóa cuộc trò chuyện"
                        >
                          {deletingId === conversation.id ? (
                            <Loader2
                              size={13}
                              className="animate-spin"
                            />
                          ) : (
                            <Trash2 size={13} />
                          )}
                        </button>
                      </div>
                    ))
                  )}
                </div>

                <div className="p-3 border-t border-slate-200">
                  <p className="text-[10px] text-slate-400 text-center">
                    BovSmart AI Assistant
                  </p>
                </div>
              </aside>
            )}

            {/* Chat area */}
            <div className="flex-1 min-w-0 flex flex-col min-h-0">

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-4 bg-slate-50">

                <div className="flex justify-center">
                  <span className="text-[11px] text-slate-400 bg-white border border-slate-200 px-3 py-1 rounded-full">
                    Trợ lý AI BovSmart
                  </span>
                </div>

                {isHistoryLoading &&
                  currentConversationId && (
                    <div className="flex justify-center py-2">
                      <Loader2
                        size={18}
                        className="animate-spin text-emerald-600"
                      />
                    </div>
                  )}

                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${
                      message.role === 'user'
                        ? 'justify-end'
                        : 'justify-start'
                    }`}
                  >
                    {message.role === 'assistant' && (
                      <div
                        className={`w-8 h-8 shrink-0 rounded-full flex items-center justify-center mr-2 ${
                          message.isError
                            ? 'bg-red-100 text-red-600'
                            : 'bg-emerald-100 text-emerald-700'
                        }`}
                      >
                        <Bot size={17} />
                      </div>
                    )}

                    <div
                      className={`max-w-[88%] rounded-2xl px-3.5 py-3 text-sm leading-relaxed whitespace-pre-wrap break-words ${
                        message.role === 'user'
                          ? 'bg-emerald-600 text-white rounded-br-md'
                          : message.isError
                          ? 'bg-red-50 text-red-700 border border-red-200 rounded-bl-md shadow-sm'
                          : 'bg-white text-slate-700 border border-slate-200 rounded-bl-md shadow-sm'
                      }`}
                   >
                    {message.role === 'assistant' && !message.isError ? (
                      <div className="chat-markdown">
                        <ReactMarkdown
                          remarkPlugins={[remarkGfm]}
                          components={{
                            strong: ({ children }) => (
                              <strong className="font-bold text-slate-800">
                                {children}
                              </strong>
                            ),
                            p: ({ children }) => (
                              <p className="mb-2 last:mb-0">
                                {children}
                              </p>
                            ),
                            ul: ({ children }) => (
                              <ul className="list-disc pl-5 mb-2 space-y-1">
                                {children}
                              </ul>
                            ),
                            ol: ({ children }) => (
                              <ol className="list-decimal pl-5 mb-2 space-y-1">
                                {children}
                              </ol>
                            ),
                            li: ({ children }) => (
                              <li>{children}</li>
                            ),
                            h1: ({ children }) => (
                              <h1 className="font-bold text-base mb-2">
                                {children}
                              </h1>
                            ),
                            h2: ({ children }) => (
                              <h2 className="font-bold text-sm mb-2">
                                {children}
                              </h2>
                            ),
                            h3: ({ children }) => (
                              <h3 className="font-semibold mb-1">
                                {children}
                              </h3>
                            ),
                          }}
                        >
                          {message.content}
                        </ReactMarkdown>
                      </div>
                    ) : (
                      message.content
                    )}

                    {message.attachments &&
                        message.attachments.length > 0 && (
                          <div className="mt-2 pt-2 border-t border-white/20 flex flex-wrap gap-1.5">
                            {message.attachments.map(
                              (attachment, index) => (
                                <span
                                  key={`${attachment.name}-${index}`}
                                  className="inline-flex items-center gap-1 text-[11px] bg-black/15 px-2 py-0.5 rounded-md"
                                >
                                  {attachment.isImage ? (
                                    <ImageIcon size={12} />
                                  ) : (
                                    <FileText size={12} />
                                  )}

                                  {attachment.name}
                                </span>
                              )
                            )}
                          </div>
                        )}

                      {message.role === 'assistant' &&
                        !message.isError &&
                        message.sources &&
                        message.sources.length > 0 && (
                          <div className="mt-3 pt-2 border-t border-slate-100">
                            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 mb-2">
                              <BookOpen size={13} />
                              Nguồn tài liệu
                            </div>

                            <div className="flex flex-wrap gap-1.5">
                              {message.sources.map(
                                (source, index) => (
                                  <span
                                    key={`${source}-${index}`}
                                    className="text-[11px] bg-emerald-50 text-emerald-700 border border-emerald-100 px-2 py-1 rounded-md"
                                  >
                                    {source}
                                  </span>
                                )
                              )}
                            </div>
                          </div>
                        )}
                    </div>
                  </div>
                ))}

                {!currentConversationId &&
                  messages.length === 1 &&
                  !isLoading &&
                  !isHistoryLoading && (
                    <div className="pt-1">
                      <p className="text-[11px] font-medium text-slate-400 mb-2">
                        Câu hỏi gợi ý về TMR:
                      </p>

                      <div className="flex flex-wrap gap-1.5">
                        {QUICK_PROMPTS.map((prompt) => (
                          <button
                            key={prompt}
                            type="button"
                            onClick={() =>
                              void sendQuestion(prompt)
                            }
                            disabled={isLoading || isHistoryLoading}
                            className="text-left text-xs bg-white hover:bg-emerald-50 text-slate-600 hover:text-emerald-700 border border-slate-200 hover:border-emerald-300 rounded-xl px-3 py-1.5 transition disabled:opacity-50"
                          >
                            {prompt}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                {isLoading && (
                  <div className="flex justify-start">
                    <div className="w-8 h-8 shrink-0 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mr-2">
                      <Bot size={17} />
                    </div>

                    <div className="bg-white border border-slate-200 rounded-2xl rounded-bl-md px-4 py-3 shadow-sm flex items-center gap-2">
                      <Loader2
                        size={16}
                        className="animate-spin text-emerald-600"
                      />
                      <span className="text-xs text-slate-500">
                        Đang tìm kiếm kiến thức...
                      </span>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="p-3 bg-white border-t border-slate-200 shrink-0">

                <div className="flex items-center gap-2 mb-2 text-[11px] text-slate-400">
                  <Sparkles
                    size={13}
                    className="text-emerald-600"
                  />
                  Câu trả lời dựa trên tài liệu kiến thức BovSmart
                </div>

                {/* Tệp đã chọn */}
                {selectedFiles.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {selectedFiles.map((file, index) => (
                      <span
                        key={`${file.name}-${index}`}
                        className="inline-flex items-center gap-1.5 text-xs bg-emerald-50 text-emerald-800 border border-emerald-200 px-2.5 py-1 rounded-lg"
                      >
                        {file.type.startsWith('image/') ? (
                          <ImageIcon
                            size={13}
                            className="shrink-0"
                          />
                        ) : (
                          <FileText
                            size={13}
                            className="shrink-0"
                          />
                        )}

                        <span className="max-w-[160px] truncate">
                          {file.name}
                        </span>

                        <button
                          type="button"
                          onClick={() =>
                            handleRemoveFile(index)
                          }
                          disabled={isLoading}
                          className="hover:text-red-600 transition disabled:opacity-50"
                          aria-label={`Xóa tệp ${file.name}`}
                        >
                          <X size={13} />
                        </button>
                      </span>
                    ))}
                  </div>
                )}

                <div className="flex items-end gap-2 bg-slate-50 border border-slate-200 rounded-xl p-2 focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-100 transition">

                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept="image/*,.pdf,.doc,.docx,.txt,.md"
                    onChange={handleFileChange}
                    className="hidden"
                  />

                  {/* Nút đính kèm */}
                  <button
                    type="button"
                    onClick={() =>
                      fileInputRef.current?.click()
                    }
                    disabled={isLoading || isHistoryLoading}
                    className="w-9 h-9 shrink-0 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-300 disabled:opacity-50 flex items-center justify-center transition"
                    title="Thêm ảnh hoặc tài liệu"
                    aria-label="Thêm ảnh hoặc tài liệu"
                  >
                    <Plus size={18} />
                  </button>

                  {/* Ô nhập câu hỏi */}
                  <textarea
                    ref={textareaRef}
                    value={input}
                    onChange={(event) =>
                      setInput(event.target.value)
                    }
                    onKeyDown={handleKeyDown}
                    placeholder="Nhập câu hỏi của bạn..."
                    rows={1}
                    maxLength={2000}
                    disabled={isLoading || isHistoryLoading}
                    className="flex-1 resize-none bg-transparent outline-none text-sm text-slate-700 placeholder:text-slate-400 px-2 py-2 max-h-24 disabled:opacity-60"
                  />

                  {/* Nút gửi */}
                  <button
                    type="button"
                    onClick={() => void handleSend()}
                    disabled={
                      (!input.trim() &&
                        selectedFiles.length === 0) ||
                      isLoading ||
                      isHistoryLoading
                    }
                    className="w-9 h-9 shrink-0 rounded-lg bg-emerald-600 text-white flex items-center justify-center hover:bg-emerald-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition"
                    aria-label="Gửi câu hỏi"
                  >
                    {isLoading ? (
                      <Loader2
                        size={17}
                        className="animate-spin"
                      />
                    ) : (
                      <Send size={17} />
                    )}
                  </button>
                </div>

                <p className="text-[10px] text-slate-400 text-center mt-2">
                  Enter để gửi · Shift + Enter để xuống dòng
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Floating button */}
      <button
        type="button"
        onClick={() => setIsOpen((previous) => !previous)}
        className="fixed bottom-5 right-5 sm:bottom-6 sm:right-6 z-[100] w-14 h-14 rounded-full bg-emerald-600 text-white shadow-lg shadow-emerald-900/20 flex items-center justify-center hover:bg-emerald-700 hover:scale-105 active:scale-95 transition-all"
        aria-label={
          isOpen ? 'Đóng trợ lý AI' : 'Mở trợ lý AI'
        }
      >
        {isOpen ? (
          <X size={25} />
        ) : (
          <MessageCircle size={26} />
        )}
      </button>
    </>
  );
};

export default ChatbotWidget;
