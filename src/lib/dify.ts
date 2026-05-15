const API_BASE_URL = import.meta.env.VITE_DIFY_API_URL || "https://your-dify-domain.com";
const API_KEY = import.meta.env.VITE_DIFY_API_KEY || "app-xxxxxxxxxxxx";

interface DifyMessage {
  role: "user" | "assistant";
  content: string;
}

interface DifyResponse {
  event: string;
  message_id?: string;
  conversation_id?: string;
  mode?: string;
  answer?: string;
  created_at?: number;
}

export async function sendChatMessage(
  messages: DifyMessage[],
  onChunk?: (content: string) => void,
  conversationId?: string
): Promise<{ answer: string; conversationId: string }> {
  const url = `/api/dify/chat-messages`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${API_KEY}`,
    },
    body: JSON.stringify({
      inputs: {},
      query: messages[messages.length - 1].content,
      response_mode: "streaming",
      conversation_id: conversationId || "",
      user: "web-user",
    }),
  });

  if (!response.ok) {
    throw new Error(`API request failed: ${response.status}`);
  }

  const reader = response.body?.getReader();
  if (!reader) {
    throw new Error("Failed to get response reader");
  }

  const decoder = new TextDecoder();
  let fullAnswer = "";
  let newConversationId = conversationId || "";

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split("\n").filter((line) => line.trim() !== "");

      for (const line of lines) {
        if (line.startsWith("data: ")) {
          try {
            const data: DifyResponse = JSON.parse(line.slice(6));

            if (data.event === "conversation_created" || data.event === "generated_title") {
              if (data.conversation_id) {
                newConversationId = data.conversation_id;
              }
            }

            if (data.event === "message" && data.answer) {
              fullAnswer += data.answer;
              onChunk?.(data.answer);
            }

            if (data.event === "message_end" && data.conversation_id) {
              newConversationId = data.conversation_id;
            }
          } catch {
            // Skip invalid JSON lines
          }
        }
      }
    }
  } finally {
    reader.releaseLock();
  }

  return {
    answer: fullAnswer,
    conversationId: newConversationId,
  };
}

export function isDifyConfigured(): boolean {
  return (
    API_BASE_URL !== "https://your-dify-domain.com" &&
    API_KEY !== "app-xxxxxxxxxxxx" &&
    API_KEY.startsWith("app-")
  );
}