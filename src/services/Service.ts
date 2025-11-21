import { GoogleGenAI } from "@google/genai";
import { DashboardStats, LogisticsProvider } from "../types";

const resolveApiKey = (): string | undefined => {
  const g: any = globalThis as any;
  // Try several common injection points (Node-style, parcel/vite import.meta, or an explicit global)
  return (
    g?.process?.env?.API_KEY ??
    (typeof import.meta !== 'undefined' ? (import.meta as any).env?.VITE_GEMINI_API_KEY : undefined) ??
    g?.__GEMINI_API_KEY
  );
};

export const analyzeDeliveryPerformance = async (
  stats: DashboardStats,
  currentRadius: number,
  provider: LogisticsProvider
): Promise<string> => {
  const apiKey = resolveApiKey();
  if (!apiKey) {
    return "Please configure your Gemini API Key to receive AI insights.";
  }

  try {
    const ai = new GoogleGenAI({ apiKey });

    const prompt = `
      You are a logistics optimization expert. Analyze the following delivery scenario and provide a short, actionable recommendation (max 50 words).
      
      Current Provider: ${provider.name} (Speed: ${provider.speed} km/h, Max Range: ${provider.maxRange} km)
      Current Radius Setting: ${currentRadius.toFixed(1)} km
      
      Performance Stats:
      - Total Orders: ${stats.total}
      - Deliverable: ${stats.deliverable}
      - Out of Range: ${stats.outOfRange}
      - Time Risks: ${stats.risk}
      
      Give advice on whether to adjust the radius, change providers, or if the current setup is efficient.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    // Some SDK responses may place text in different fields; guard defensively
    return (response as any).text ?? (response as any).output_text ?? "Unable to generate analysis.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "AI service temporarily unavailable.";
  }
};
