
const CHATBOT_API_URL = '/api/chatbot/ask';

export interface ChatbotResponse {
  answer: string;
  sources: string[];
}

interface ChatbotApiResponse {
  success: number;
  data: ChatbotResponse;
  message: string;
}

export const askChatbotApi = async (
  question: string,
  token: string
): Promise<ChatbotResponse> => {
  if (!token) {
    throw new Error('Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.');
  }

  const response = await fetch(CHATBOT_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ question }),
  });

  const responseText = await response.text();

  let result: ChatbotApiResponse;

  try {
    result = JSON.parse(responseText);
  } catch {
    throw new Error(
      `Server không trả về JSON. HTTP ${response.status}`
    );
  }

  if (response.status === 401 || response.status === 403) {
    throw new Error(
      'Bạn không có quyền truy cập hoặc phiên đăng nhập đã hết hạn.'
    );
  }

  if (!response.ok || result.success !== 1 || !result.data) {
    throw new Error(
      result.message || `Chatbot gặp lỗi. HTTP ${response.status}`
    );
  }

  return result.data;
};
