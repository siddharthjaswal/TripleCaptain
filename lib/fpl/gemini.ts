import "server-only";
import Anthropic from "@anthropic-ai/sdk";

/**
 * AI client for Triple Captain's tactical features (The Gaffer audit, Chief
 * Scout differentials, league insights). Built on the official Anthropic SDK.
 *
 * Set ANTHROPIC_API_KEY in the environment to enable. When it's absent every
 * AI feature degrades gracefully (callers check `isAIConfigured()`), so the
 * app never throws on a missing key.
 *
 * The function is still named `callGemini` for backwards-compatibility with the
 * existing call sites; it now talks to Claude, not Gemini.
 */

const MODEL = "claude-opus-4-8";

let _client: Anthropic | null = null;

function getClient(): Anthropic {
  if (!_client) {
    _client = new Anthropic(); // reads ANTHROPIC_API_KEY from env
  }
  return _client;
}

export function isAIConfigured(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

export async function callGemini(prompt: string): Promise<string> {
  if (!isAIConfigured()) {
    throw new Error(
      "AI is not configured — set ANTHROPIC_API_KEY to enable Triple Captain's AI features.",
    );
  }

  const client = getClient();

  const message = await client.messages.create({
    model: MODEL,
    max_tokens: 2048,
    messages: [{ role: "user", content: prompt }],
  });

  return message.content
    .filter((block): block is Anthropic.TextBlock => block.type === "text")
    .map((block) => block.text)
    .join("\n")
    .trim();
}
