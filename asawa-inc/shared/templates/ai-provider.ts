/**
 * Asawa Shared AI Provider Template
 *
 * Copy this file to your company's project at: src/lib/ai.ts
 * Then configure the provider and model for your use case.
 *
 * RULES (from asawa-inc/shared/AI-PROVIDERS.md):
 * 1. Only use approved providers (see AI-PROVIDERS.md)
 * 2. API keys in env vars only — never in code
 * 3. All AI calls server-side only — never from the browser
 * 4. Define a free fallback model for every use case
 *
 * OVERRIDE: Companies can change the provider and model below.
 * They CANNOT change the security rules above.
 */

import { streamText, generateText, Output } from "ai";

// ============================================================
// PROVIDER CONFIGURATION — Companies override this section
// ============================================================

// Pick ONE provider. Uncomment the one you need.
// All are approved by Asawa (see AI-PROVIDERS.md).

// --- Google Gemini (FREE — default for most use cases) ---
import { google } from "@ai-sdk/google";
const defaultModel = google("gemini-2.0-flash");
// Env var: GOOGLE_GENERATIVE_AI_API_KEY

// --- Anthropic Claude (PAID — for complex reasoning) ---
// import { anthropic } from "@ai-sdk/anthropic";
// const defaultModel = anthropic("claude-haiku-4.5");
// Env var: ANTHROPIC_API_KEY

// --- DeepSeek (NEAR-FREE — for batch processing) ---
// import { deepseek } from "@ai-sdk/deepseek";
// const defaultModel = deepseek("deepseek-chat");
// Env var: DEEPSEEK_API_KEY

// --- Groq (FREE — for ultra-low latency) ---
// import { groq } from "@ai-sdk/groq";
// const defaultModel = groq("llama-3.3-70b-versatile");
// Env var: GROQ_API_KEY

// --- OpenAI (PAID — for embeddings, specific GPT use cases) ---
// import { openai } from "@ai-sdk/openai";
// const defaultModel = openai("gpt-4o-mini");
// Env var: OPENAI_API_KEY

// ============================================================
// SHARED UTILITIES — Don't modify unless extending
// ============================================================

/**
 * Stream text from AI. Use in API routes for real-time UI.
 *
 * Usage:
 *   const result = stream("Write a joke about cats");
 *   return result.toTextStreamResponse();
 */
export function stream(prompt: string, options?: {
  system?: string;
  maxOutputTokens?: number;
}) {
  return streamText({
    model: defaultModel,
    prompt,
    system: options?.system,
    maxOutputTokens: options?.maxOutputTokens ?? 1024,
  });
}

/**
 * Generate text (blocking). Use when you need the full response before continuing.
 *
 * Usage:
 *   const { text } = await generate("Summarize this article");
 */
export async function generate(prompt: string, options?: {
  system?: string;
  maxOutputTokens?: number;
}) {
  return generateText({
    model: defaultModel,
    prompt,
    system: options?.system,
    maxOutputTokens: options?.maxOutputTokens ?? 1024,
  });
}

/**
 * Generate structured output. Use when you need typed JSON back.
 *
 * Usage:
 *   import { z } from "zod";
 *   const { output } = await generateStructured(
 *     "Extract the person's name and age",
 *     z.object({ name: z.string(), age: z.number() })
 *   );
 */
export async function generateStructured<T>(
  prompt: string,
  schema: import("zod").ZodType<T>,
  options?: {
    system?: string;
    maxOutputTokens?: number;
  }
) {
  return generateText({
    model: defaultModel,
    prompt,
    system: options?.system,
    maxOutputTokens: options?.maxOutputTokens ?? 1024,
    output: Output.object({ schema }),
  });
}

/**
 * The model instance, exported for direct use when the helpers above
 * don't cover your case.
 */
export { defaultModel as model };
