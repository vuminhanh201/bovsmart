
import React, { useEffect, useRef, useState } from 'react';
import {
  Bot,
  X,
  Send,
  MessageCircle,
  Loader2,
  BookOpen,
  Sparkles,
} from 'lucide-react';

import { useAuthStore } from '../store/useAuthStore';
import { askChatbotApi } from '../services/chatbotService';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  sources?: string[];
}

const ChatbotWidget: React.FC = () => {
  const token = useAuthStore((state) => state.token);
  const isAuthenticated = useAuthStore(
    (state) => state.isAuthenticated
  );

  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content:
        'Xin chào! Tôi là trợ lý AI BovSmart. Tôi có thể hỗ trợ bạn tìm hiểu kiến thức về chăn nuôi bò, dinh dưỡng, TMR và chăm sóc sức khỏe đàn bò.',
      sources: [],
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: 'smooth',
    });
  }, [messages, isLoading, isOpen]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => textareaRef.current?.focus(), 100);
    }
  }, [isOpen]);

  if (!isAuthenticated) {
    return null;
  }

  const handleSend = async () => {
    const question = input.trim();

    if (!question || isLoading) {
      return;
    }

    if (!token) {
      setMessages((previous) => [
        ...previous,
        {
          id: `error-${Date.now()}`,
          role: 'assistant',
          content: 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.',
        },
      ]);
      return;
    }

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: question,
    };

    setMessages((previous) => [...previous, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const result = await askChatbotApi(question, token);

      const assistantMessage: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: result.answer,
        sources: result.sources || [],
      };

      setMessages((previous) => [
        ...previous,
        assistantMessage,
      ]);
    } catch (error) {
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
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (
    event: React.KeyboardEvent<HTMLTextAreaElement>
  ) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      void handleSend();
    }
  };

  return (
    <>
      {isOpen && (
        <div className="fixed bottom-24 right-4 sm:bottom-24 sm:right-6 z-[100] flex flex-col w-[calc(100vw-2rem)] sm:w-[390px] h-[min(600px,calc(100dvh-8rem))] bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-emerald-700 to-emerald-600 text-white">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white/15 flex items-center justify-center">
                <Bot size={23} />
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

          {/* Chat messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
            <div className="flex justify-center">
              <span className="text-[11px] text-slate-400 bg-white border border-slate-200 px-3 py-1 rounded-full">
                Trợ lý AI BovSmart
              </span>
            </div>

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
                  <div className="w-8 h-8 shrink-0 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mr-2">
                    <Bot size={17} />
                  </div>
                )}

                <div
                  className={`max-w-[85%] rounded-2xl px-3.5 py-3 text-sm leading-relaxed whitespace-pre-wrap break-words ${
                    message.role === 'user'
                      ? 'bg-emerald-600 text-white rounded-br-md'
                      : 'bg-white text-slate-700 border border-slate-200 rounded-bl-md shadow-sm'
                  }`}
                >
                  {message.content}

                  {message.role === 'assistant' &&
                    message.sources &&
                    message.sources.length > 0 && (
                      <div className="mt-3 pt-2 border-t border-slate-100">
                        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 mb-2">
                          <BookOpen size={13} />
                          Nguồn tài liệu
                        </div>

                        <div className="flex flex-wrap gap-1.5">
                          {message.sources.map((source, index) => (
                            <span
                              key={`${source}-${index}`}
                              className="text-[11px] bg-emerald-50 text-emerald-700 border border-emerald-100 px-2 py-1 rounded-md"
                            >
                              {source}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                </div>
              </div>
            ))}

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
          <div className="p-3 bg-white border-t border-slate-200">
            <div className="flex items-center gap-2 mb-2 text-[11px] text-slate-400">
              <Sparkles size={13} className="text-emerald-600" />
              Câu trả lời dựa trên tài liệu kiến thức BovSmart
            </div>

            <div className="flex items-end gap-2 bg-slate-50 border border-slate-200 rounded-xl p-2 focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-100 transition">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Nhập câu hỏi của bạn..."
                rows={1}
                disabled={isLoading}
                className="flex-1 resize-none bg-transparent outline-none text-sm text-slate-700 placeholder:text-slate-400 px-2 py-2 max-h-24 disabled:opacity-60"
              />

              <button
                type="button"
                onClick={() => void handleSend()}
                disabled={!input.trim() || isLoading}
                className="w-9 h-9 shrink-0 rounded-lg bg-emerald-600 text-white flex items-center justify-center hover:bg-emerald-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition"
                aria-label="Gửi câu hỏi"
              >
                {isLoading ? (
                  <Loader2 size={17} className="animate-spin" />
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
      )}

      {/* Floating button */}
      <button
        type="button"
        onClick={() => setIsOpen((previous) => !previous)}
        className="fixed bottom-5 right-5 sm:bottom-6 sm:right-6 z-[100] w-14 h-14 rounded-full bg-emerald-600 text-white shadow-lg shadow-emerald-900/20 flex items-center justify-center hover:bg-emerald-700 hover:scale-105 active:scale-95 transition-all"
        aria-label={isOpen ? 'Đóng trợ lý AI' : 'Mở trợ lý AI'}
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
