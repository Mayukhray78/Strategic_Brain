import { GoogleGenAI, Type, ThinkingLevel } from "@google/genai";
import { GoalConstraints, Scenario } from "@/src/types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export async function generateStrategies(goal: string, constraints: GoalConstraints, historicalContext: any[] = []): Promise<Scenario[]> {
  const prompt = `
    You are a Strategic Brain AI Decision Engine. 
    Goal: ${goal}
    Constraints: ${JSON.stringify({ budget: constraints.budget, timeline: constraints.timeline, risk: constraints.riskTolerance })}
    Historical Successful Context: ${JSON.stringify((historicalContext || []).map(c => ({ goal: c.title, outcome: c.outcome_met ? 'Success' : 'Partial' })))}

    Task:
    1. Break this goal into logical sub-goals (max 4 per scenario).
    2. Generate 2 distinct strategy scenarios.
    3. For each scenario, provide:
       - A roadmap of sub-goals (title, time, cost only).
       - Trade-offs (max 2).
       - Score, Risk, Success Prob.
       - Simplified decision tree (max 2 options).

    IMPORTANT: Use ultra-concise text. No descriptions for sub-goals. 
    Each string field MUST be under 100 characters.
    The entire JSON response MUST be under 8000 characters.
    Return the response in strict JSON format.
  `;

  const response = await ai.models.generateContent({
    model: "gemini-3.1-pro-preview",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      maxOutputTokens: 8192,
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING, description: "Max 50 chars" },
            description: { type: Type.STRING, description: "Max 100 chars" },
            roadmap: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  title: { type: Type.STRING, description: "Max 50 chars" },
                  estimatedTime: { type: Type.STRING },
                  estimatedCost: { type: Type.NUMBER },
                  dependencies: { type: Type.ARRAY, items: { type: Type.STRING } }
                },
                required: ["id", "title", "estimatedTime", "estimatedCost"]
              }
            },
            tradeOffs: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Max 2 items, 50 chars each" },
            score: { type: Type.NUMBER },
            risk: { type: Type.NUMBER },
            probabilityOfSuccess: { type: Type.NUMBER },
            decisionTree: { type: Type.OBJECT, properties: {
              root: { type: Type.STRING, description: "Max 50 chars" },
              options: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: {
                choice: { type: Type.STRING, description: "Max 50 chars" },
                outcome: { type: Type.STRING, description: "Max 100 chars" },
                probability: { type: Type.NUMBER }
              }}}
            }}
          },
          required: ["name", "description", "roadmap", "score", "risk", "probabilityOfSuccess"]
        }
      }
    }
  });

  try {
    let text = response.text || "";
    // Basic cleaning
    text = text.trim();
    if (text.startsWith("```json")) {
      text = text.replace(/^```json\n?/, "").replace(/\n?```$/, "");
    }

    // Attempt to repair truncated JSON if it looks like it's cut off
    if (!text.endsWith("]") && !text.endsWith("}")) {
      console.warn("AI response appears truncated, attempting repair...");
      // Simple repair: close open brackets/braces
      let openBraces = (text.match(/\{/g) || []).length - (text.match(/\}/g) || []).length;
      let openBrackets = (text.match(/\[/g) || []).length - (text.match(/\]/g) || []).length;
      
      // If we are inside a string, close it first
      const lastQuoteIndex = text.lastIndexOf('"');
      const secondLastQuoteIndex = text.substring(0, lastQuoteIndex).lastIndexOf('"');
      // This is a very naive check for an open string
      if (lastQuoteIndex > -1 && (text.match(/"/g) || []).length % 2 !== 0) {
        text += '"';
      }

      while (openBraces > 0) {
        text += "}";
        openBraces--;
      }
      while (openBrackets > 0) {
        text += "]";
        openBrackets--;
      }
    }

    return JSON.parse(text);
  } catch (e) {
    console.error("Failed to parse AI response. Raw text length:", response.text?.length);
    console.error("Error details:", e);
    // If it's still failing, try to return a partial result if possible or an empty array
    return [];
  }
}
