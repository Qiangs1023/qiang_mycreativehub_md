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
  id?: string;
  task_id?: string;
  position?: number;
  thought?: string;
}

export async function sendChatMessage(
  messages: DifyMessage[],
  onChunk?: (content: string) => void,
  conversationId?: string
): Promise<{ answer: string; conversationId: string }> {
  const url = import.meta.env.DEV
    ? "/api/dify/chat-messages"
    : `${API_BASE_URL}/v1/chat-messages`;

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
    const errorText = await response.text();
    throw new Error(`API request failed: ${response.status} - ${errorText}`);
  }

  const reader = response.body?.getReader();
  if (!reader) {
    throw new Error("Failed to get response reader");
  }

  const decoder = new TextDecoder();
  let buffer = "";
  let fullAnswer = "";
  let newConversationId = conversationId || "";

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      while (buffer.includes("\n\n")) {
        const eventEnd = buffer.indexOf("\n\n");
        const eventData = buffer.slice(0, eventEnd);
        buffer = buffer.slice(eventEnd + 2);

        if (eventData.startsWith("data: ")) {
          try {
            const jsonStr = eventData.slice(6);
            const data: DifyResponse = JSON.parse(jsonStr);

            if (data.event === "conversation_created") {
              if (data.conversation_id) {
                newConversationId = data.conversation_id;
              }
              continue;
            }

            if (data.event === "agent_message" || data.event === "message") {
              if (data.answer !== undefined) {
                fullAnswer = data.answer;
                onChunk?.(data.answer);
              }
              if (data.conversation_id) {
                newConversationId = data.conversation_id;
              }
              continue;
            }

            if (data.event === "message_end") {
              if (data.conversation_id) {
                newConversationId = data.conversation_id;
              }
              continue;
            }

            if (data.event === "error") {
              console.error("Dify error:", data);
            }
          } catch (e) {
            console.error("Failed to parse event data:", eventData, e);
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