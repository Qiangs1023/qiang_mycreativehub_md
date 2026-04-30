import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const SYSTEM_PROMPTS: Record<string, string> = {
  article: `你是一位独立创作者，擅长撰写有深度、有温度的技术和个人成长类文章。
你的写作风格是：真诚、不装、有洞察力。语言简洁有力，避免营销感和废话。
文章结构清晰，善用标题、列表和引用。使用 Markdown 格式输出。

请根据用户提供的话题或大纲，撰写一篇完整的文章。内容包括：
- 一个吸引人的开篇
- 2-4 个核心论点或故事段落
- 一个有力的结尾
- 适当使用小标题、加粗、列表等 Markdown 格式`,

  video_script: `你是一位视频创作者，擅长撰写自然、流畅的口播文案。
你的风格是：口语化、有节奏感、真诚不做作。像是在和朋友聊天，而不是在念稿。
文案需要考虑视频的节奏——开头要抓人，中间有起伏，结尾有行动号召。

请根据用户提供的话题，撰写一份口播文案。要求：
- 开头前 5 秒要有钩子（hook），抓住观众注意力
- 正文分段，每段之间用自然过渡
- 标注语气提示（如 [停顿]、[强调]、[语速放慢]）
- 总时长控制在 3-8 分钟（约 500-1500 字）
- 结尾要有明确的总结和互动引导`,
};

const schema = z.object({
  prompt: z.string().min(1, "请输入话题或要求"),
  type: z.enum(["article", "video_script"]),
});

export const generateContent = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => schema.parse(data))
  .handler(async ({ data }) => {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error("未配置 OPENAI_API_KEY 环境变量，请在 .env 中设置");
    }

    const baseURL = process.env.OPENAI_BASE_URL || "https://api.openai.com/v1";
    const model = process.env.OPENAI_MODEL || "gpt-4o-mini";

    const response = await fetch(`${baseURL}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: SYSTEM_PROMPTS[data.type] },
          { role: "user", content: data.prompt },
        ],
        temperature: 0.8,
        max_tokens: 4096,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`AI API 调用失败: ${response.status} ${err}`);
    }

    const json = (await response.json()) as {
      choices: Array<{ message: { content: string } }>;
    };

    const text = json.choices?.[0]?.message?.content;
    if (!text) {
      throw new Error("AI 未返回有效内容");
    }

    return { content: text };
  });
