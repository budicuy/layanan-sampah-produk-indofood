import type { Buffer } from "node:buffer";

export interface AIAnalysisResult {
  berat_terbaca: number | null;
  satuan: string | null;
  terbaca: boolean;
  alasan_gagal: string | null;
}

/**
 * Attempts to extract the first valid JSON object from a string.
 * Handles cases where models prepend reasoning text or wrap JSON in markdown.
 */
function extractJson(text: string): string | null {
  // 1. Try to find a JSON block inside markdown code fences (```json ... ```)
  const fenceMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenceMatch?.[1]) {
    const candidate = fenceMatch[1].trim();
    try {
      JSON.parse(candidate);
      return candidate;
    } catch {
      // fall through
    }
  }

  // 2. Find the first '{' and extract a balanced JSON object
  const start = text.indexOf("{");
  if (start === -1) return null;

  let depth = 0;
  let inString = false;
  let isEscaped = false;

  for (let i = start; i < text.length; i++) {
    const ch = text[i];

    if (isEscaped) {
      isEscaped = false;
      continue;
    }
    if (ch === "\\" && inString) {
      isEscaped = true;
      continue;
    }
    if (ch === '"') {
      inString = !inString;
      continue;
    }
    if (inString) continue;

    if (ch === "{") depth++;
    else if (ch === "}") {
      depth--;
      if (depth === 0) {
        return text.slice(start, i + 1);
      }
    }
  }

  return null;
}

export async function analyzeScaleImage(
  imageBuffer: Buffer,
  mimeType: string,
): Promise<AIAnalysisResult> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured");
  }

  const base64Image = imageBuffer.toString("base64");
  const models = [
    process.env.GEMINI_MODEL_1,
    process.env.GEMINI_MODEL_2,
    process.env.GEMINI_MODEL_3,
  ].filter(Boolean) as string[];

  if (models.length === 0) {
    throw new Error("No Gemini models configured in environment variables");
  }

  const prompt = `Lihat foto ini. Baca angka yang tertera di display timbangan digital.
PENTING: Balas HANYA dengan objek JSON berikut, tidak ada kata-kata lain, tidak ada penjelasan:
{"berat_terbaca": 350, "satuan": "gram", "terbaca": true, "alasan_gagal": null}

Aturan:
- berat_terbaca: angka numerik dari display (tanpa satuan), atau null jika tidak terbaca
- satuan: "gram" atau "kg" sesuai yang tertera di timbangan, atau null
- terbaca: true jika display terlihat jelas, false jika tidak
- alasan_gagal: string penjelasan jika terbaca=false, atau null jika terbaca=true`;

  for (let i = 0; i < models.length; i++) {
    const model = models[i];
    console.log(`🤖 Attempting Gemini analysis using Model ${i + 1}: ${model}`);
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      const payload = {
        contents: [
          {
            parts: [
              { text: prompt },
              {
                inlineData: {
                  mimeType,
                  data: base64Image,
                },
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0,
          responseMimeType: "application/json",
        },
      };

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout (reduced from 20s)

      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(
          `HTTP Error ${response.status}: ${response.statusText}`,
        );
      }

      const resBody = await response.json();
      const text = resBody?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) {
        throw new Error("No text content returned from Gemini model");
      }

      console.log(`🤖 Model ${i + 1} Raw Response:`, text);

      // Robustly extract JSON from the response (handles reasoning text before/after JSON)
      const jsonStr = extractJson(text);
      if (!jsonStr) {
        throw new Error("Could not find valid JSON object in model response");
      }

      const parsed: AIAnalysisResult = JSON.parse(jsonStr);
      console.log(`✅ Model ${i + 1} (${model}) parsed successfully:`, parsed);
      return parsed;
    } catch (err) {
      console.warn(`⚠️ Model ${i + 1} (${model}) failed:`, err);
      // Continue to next model
    }
  }

  // If all models failed
  throw new Error("All Gemini models failed to process the request");
}
