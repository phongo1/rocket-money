import dotenv from 'dotenv';

dotenv.config();

interface OpenRouterMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface OpenRouterChoice {
  message: OpenRouterMessage;
}

interface OpenRouterResponse {
  choices?: OpenRouterChoice[];
  error?: { message?: string };
}

const SYSTEM_PROMPT =
  'You are a cautious, plain-language financial advisor chatbot for Rocket Money. ' +
  'Always include disclaimers and encourage users to consult licensed professionals for major decisions.';

export async function callLLM(prompt: string): Promise<string> {
  if (!process.env.OPENROUTER_API_KEY) {
    throw new Error('Missing OPENROUTER_API_KEY in environment');
  }

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'deepseek/deepseek-chat-v3.1:free',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: prompt },
      ] satisfies OpenRouterMessage[],
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenRouter request failed (${response.status}): ${await response.text()}`);
  }

  const data = (await response.json()) as OpenRouterResponse;

  if (data.error?.message) {
    throw new Error(`OpenRouter error: ${data.error.message}`);
  }

  const assistantMessage = data.choices?.[0]?.message?.content?.trim();
  if (!assistantMessage) {
    throw new Error('OpenRouter: no assistant response found');
  }

  return assistantMessage;
}
