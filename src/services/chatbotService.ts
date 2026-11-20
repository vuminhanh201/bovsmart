
const CHATBOT_API_URL = '/api/chatbot';
const FILE_API_URL = '/api/files';

export interface ChatbotResponse {
  answer: string;
  sources: string[];
}

export interface ChatConversation {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
}

export interface ChatMessageHistory {
  id: string;
  conversationId: string;
  userId: string;
  role: 'USER' | 'ASSISTANT';
  content: string;
  sources?: string[];
  createdAt: string;
}

export interface FileUploadResponse {
  id: string;
  originalName: string;
  contentType: string;
  fileSize: number;
  message: string;
}

interface ChatbotApiResponse<T> {
  success: number;
  data: T;
  message: string;
}

const request = async <T>(
  url: string,
  token: string,
  options: RequestInit = {}
): Promise<T> => {
  if (!token) {
    throw new Error('Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.');
  }

  const headers = new Headers(options.headers);

  headers.set('Authorization', `Bearer ${token}`);

  // Không tự đặt Content-Type cho FormData.
  // Trình duyệt cần tự tạo multipart boundary.
  if (options.body instanceof FormData) {
    headers.delete('Content-Type');
  } else if (!headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  const responseText = await response.text();

  let result: ChatbotApiResponse<T> | null = null;

  if (responseText) {
    try {
      result = JSON.parse(responseText);
    } catch {
      if (response.status === 401) {
        throw new Error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
      }

      if (response.status === 403) {
        throw new Error('Bạn không có quyền truy cập chức năng này.');
      }

      throw new Error(`Server không trả về JSON. HTTP ${response.status}`);
    }
  }

  if (response.status === 401) {
    throw new Error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
  }

  if (response.status === 403) {
    throw new Error('Bạn không có quyền truy cập chức năng này.');
  }

  if (response.status === 429) {
    throw new Error(
      result?.message ||
      'Bạn đã đạt giới hạn câu hỏi. Vui lòng thử lại sau.'
    );
  }

  if (!response.ok || !result || result.success !== 1) {
    throw new Error(
      result?.message || `Yêu cầu thất bại. HTTP ${response.status}`
    );
  }

  return result.data;
};

// Upload một tệp đính kèm chatbot.
export const uploadChatAttachmentApi = async (
  file: File,
  token: string
): Promise<FileUploadResponse> => {
  const formData = new FormData();
  formData.append('file', file);

  return request<FileUploadResponse>(
    `${FILE_API_URL}/upload/chat-attachment`,
    token,
    {
      method: 'POST',
      body: formData,
    }
  );
};

// Gửi câu hỏi cùng danh sách ID tệp đã upload.
export const askChatbotApi = async (
  question: string,
  conversationId: string,
  token: string,
  attachmentIds: string[] = []
): Promise<ChatbotResponse> => {
  return request<ChatbotResponse>(
    `${CHATBOT_API_URL}/ask`,
    token,
    {
      method: 'POST',
      body: JSON.stringify({
        question,
        conversationId,
        attachmentIds,
      }),
    }
  );
};

export const createConversationApi = async (
  token: string
): Promise<ChatConversation> => {
  return request<ChatConversation>(
    `${CHATBOT_API_URL}/conversations`,
    token,
    { method: 'POST' }
  );
};

export const getConversationsApi = async (
  token: string
): Promise<ChatConversation[]> => {
  return request<ChatConversation[]>(
    `${CHATBOT_API_URL}/conversations`,
    token
  );
};

export const getConversationMessagesApi = async (
  conversationId: string,
  token: string
): Promise<ChatMessageHistory[]> => {
  return request<ChatMessageHistory[]>(
    `${CHATBOT_API_URL}/conversations/${encodeURIComponent(conversationId)}/messages`,
    token
  );
};

export const deleteConversationApi = async (
  conversationId: string,
  token: string
): Promise<void> => {
  await request<unknown>(
    `${CHATBOT_API_URL}/conversations/${encodeURIComponent(conversationId)}`,
    token,
    { method: 'DELETE' }
  );
};
