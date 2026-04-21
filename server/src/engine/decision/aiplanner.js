/**
 * aiplanner.js
 * AI-powered logistics route planner for DelayShield AI.
 * Supports Gemini and OpenAI-compatible providers (for example Ollama/Groq).
 */

import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const AI_PROVIDER = (process.env.AI_PROVIDER || "gemini").toLowerCase();
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-3.1-flash-lite-preview";
const LLM_BASE_URL = (process.env.LLM_BASE_URL || "http://localhost:11434/v1")
  .replace(/\/+$/, "");
const LLM_MODEL = process.env.LLM_MODEL || "llama3.2";
const LLM_API_KEY = process.env.LLM_API_KEY || "";

const OPENAI_COMPAT_PROVIDERS = new Set([
  "ollama",
  "openai_compat",
  "groq",
  "anthropic_compat",
]);

const gemini = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

const toKm = (meters) => Math.round((meters / 1000) * 100) / 100;
const toHours = (seconds) => Math.round((seconds / 3600) * 100) / 100;

const buildPrompt = ({ risk, decision, route, cost }) => {
  const routeSection = route
    ? `- Distance : ${toKm(route.distance)} km
- Duration : ${toHours(route.duration)} hours`
    : "- Route data : Not available";

  const costSection = cost
    ? `- No-action cost : INR ${cost.noActionCost}
- Reroute cost   : ${cost.rerouteCost !== null ? `INR ${cost.rerouteCost}` : "Not available"
    }
- Savings        : ${cost.savings !== null ? `INR ${cost.savings}` : "Not available"
    }`
    : "- Cost data : Not available";

  return `
You are an expert logistics AI planner for "DelayShield AI".

Analyze the shipment data and generate an optimal routing strategy.

SHIPMENT CONDITIONS:
- Risk Level  : ${risk.level}
- Risk Score  : ${risk.score}
- Traffic     : ${risk.traffic ?? "N/A"}
- Delay       : ${risk.delay ?? "N/A"}
- Decision    : ${decision.action}

ROUTE DATA:
${routeSection}

COST ANALYSIS:
${costSection}

RULES:
1. HIGH risk: MUST REROUTE and choose fastest highway route.
2. MEDIUM risk: compare savings, suggest REROUTE or MONITOR, include alternatives.
3. LOW risk: CONTINUE current route unless a clear benefit exists.
4. If savings > 0, prefer REROUTE and explain why.
5. If reroute cost is higher, explain the trade-off clearly.
6. MUST prioritize specific, named Indian highways (e.g., "NH44", "NH52", "Eastern Peripheral Expressway") and explicitly mention relevant city bypasses.
7. Under NO circumstances should you return generic terms like "Indian highway route" or "alternative route 1". You must output realistic Indian Highway names and bypasses if the exact route isn't known.

Return ONLY valid JSON. Do not return markdown or extra text.

{
  "suggestedRoute": "string",
  "alternatives": ["string", "string"],
  "decision": "REROUTE | MONITOR | CONTINUE",
  "reason": "string",
  "tradeOff": "string",
  "priorityAction": "string",
  "confidence": "High | Medium | Low"
}
`.trim();
};

const parseResponse = (rawText) => {
  const cleaned = String(rawText || "")
    .replace(/```json\s*/gi, "")
    .replace(/```\s*/g, "")
    .trim();

  try {
    return JSON.parse(cleaned);
  } catch {
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");
    if (start === -1 || end === -1 || end <= start) {
      throw new Error("AI response did not include valid JSON");
    }
    return JSON.parse(cleaned.slice(start, end + 1));
  }
};

const validateInput = (input) => {
  if (!input?.risk?.level || typeof input.risk.score !== "number") {
    throw new Error("Invalid risk input");
  }
  if (!input?.decision?.action) {
    throw new Error("Invalid decision input");
  }
};

const validateOutput = (parsed) => {
  if (
    !parsed?.suggestedRoute ||
    !parsed?.decision ||
    !parsed?.reason ||
    !parsed?.confidence
  ) {
    throw new Error("Invalid AI output format");
  }
};

const parseAIError = (error, provider) => {
  const raw = error?.message || String(error) || "Unknown AI error";
  let parsed = null;

  try {
    parsed = JSON.parse(raw);
  } catch {
    parsed = null;
  }

  const err = parsed?.error ?? {};
  const code = err?.code ?? null;
  const status = err?.status ?? null;
  const message = err?.message ?? raw;
  const isQuotaExceeded =
    code === 429 ||
    status === "RESOURCE_EXHAUSTED" ||
    /quota exceeded|rate limit/i.test(message);
  const isNetworkError = /ECONNREFUSED|ENOTFOUND|fetch failed|network/i.test(
    message
  );

  let retryAfter = null;
  const retryInfo = Array.isArray(err?.details)
    ? err.details.find((d) => d?.["@type"]?.includes("RetryInfo"))
    : null;
  if (typeof retryInfo?.retryDelay === "string") {
    retryAfter = retryInfo.retryDelay;
  }

  return {
    provider,
    code,
    status,
    message,
    isQuotaExceeded,
    isNetworkError,
    retryAfter,
  };
};

const fallbackResponse = (input, errorInfo = null) => {
  const provider = errorInfo?.provider || AI_PROVIDER;
  const reason = errorInfo?.isQuotaExceeded
    ? "AI quota exceeded, fallback used"
    : errorInfo?.isNetworkError
      ? "AI endpoint unreachable, fallback used"
      : "AI unavailable, fallback used";

  const tradeOff = errorInfo?.isQuotaExceeded
    ? `${provider} quota exhausted or rate limited`
    : errorInfo?.isNetworkError
      ? `Cannot reach ${provider} endpoint`
      : "No AI analysis available";

  return {
    success: false,
    data: {
      suggestedRoute: "Continue current route",
      alternatives: [],
      decision: input?.decision?.action || "MONITOR",
      reason,
      tradeOff,
      priorityAction: "Monitor conditions manually",
      confidence: "Low",
      fallback: true,
      error: {
        provider,
        code: errorInfo?.code ?? null,
        status: errorInfo?.status ?? null,
        retryAfter: errorInfo?.retryAfter ?? null,
        message: errorInfo?.message ?? "Unknown AI error",
      },
    },
  };
};

const callGemini = async (prompt, retryCount = 0) => {
  try {
    const result = await gemini.models.generateContent({
      model: GEMINI_MODEL,
      contents: prompt,
    });
    return result?.text;
  } catch (error) {
    // If it's a 503 or UNAVAILABLE error, retry up to 2 times with a small delay
    const isRetryable = error?.code === 503 ||
      error?.status === "UNAVAILABLE" ||
      /high demand|overloaded/i.test(error?.message);

    if (isRetryable && retryCount < 2) {
      console.warn(`[aiPlanner] Gemini busy (503). Retrying... (${retryCount + 1}/2)`);
      await new Promise(resolve => setTimeout(resolve, 1500 * (retryCount + 1)));
      return callGemini(prompt, retryCount + 1);
    }
    throw error;
  }
};

const callOpenAICompatible = async (prompt) => {
  const url = `${LLM_BASE_URL}/chat/completions`;
  const headers = {
    "Content-Type": "application/json",
  };

  if (LLM_API_KEY) {
    headers.Authorization = `Bearer ${LLM_API_KEY}`;
  }

  const response = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify({
      model: LLM_MODEL,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.2,
    }),
  });

  const rawText = await response.text();
  let body = null;
  try {
    body = rawText ? JSON.parse(rawText) : null;
  } catch {
    body = null;
  }

  if (!response.ok) {
    throw new Error(
      JSON.stringify({
        error: {
          code: response.status,
          status: body?.error?.type || "HTTP_ERROR",
          message: body?.error?.message || rawText || `HTTP ${response.status}`,
        },
      })
    );
  }

  const text = body?.choices?.[0]?.message?.content;
  if (!text) {
    throw new Error("Empty AI response");
  }

  return text;
};

const runProvider = async (prompt) => {
  if (OPENAI_COMPAT_PROVIDERS.has(AI_PROVIDER)) {
    return callOpenAICompatible(prompt);
  }
  return callGemini(prompt);
};

export const generateAIPlan = async (input = {}) => {
  try {
    validateInput(input);

    const prompt = buildPrompt({
      risk: input.risk,
      decision: input.decision,
      route: input.route ?? null,
      cost: input.cost ?? null,
    });

    const text = await runProvider(prompt);
    const parsed = parseResponse(text);
    validateOutput(parsed);

    return {
      success: true,
      data: parsed,
    };
  } catch (error) {
    const provider = OPENAI_COMPAT_PROVIDERS.has(AI_PROVIDER)
      ? AI_PROVIDER
      : "gemini";
    const errorInfo = parseAIError(error, provider);
    console.error(
      "[aiPlanner] Error:",
      `${errorInfo.status || "UNKNOWN"} (${errorInfo.code || "n/a"}): ${errorInfo.message}`
    );
    return fallbackResponse(input, errorInfo);
  }
};
