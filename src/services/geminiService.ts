import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = (import.meta.env.VITE_GEMINI_API_KEY as string) || "";
const genAI = new GoogleGenerativeAI(API_KEY);

export interface GameChoice {
  text: string;
  impact: number; // How much the abyss gauge changes (-20 to +30)
  consequence: string; // Brief description of what happens
}

export interface GameState {
  stage: number;
  abyssGauge: number;
  story: string;
  choices: GameChoice[];
  history: string[];
}

const GAME_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    story: {
      type: Type.STRING,
      description: "The current segment of the story. Keep it around 2-3 punchy sentences.",
    },
    choices: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          text: { type: Type.STRING, description: "Descriptive choice text (max 15 words)." },
          impact: { type: Type.NUMBER, description: "The impact on the abyss gauge (integer between -30 and 30)." },
          consequence: { type: Type.STRING, description: "Brief summary of the result." }
        },
        required: ["text", "impact", "consequence"]
      },
      minItems: 3,
      maxItems: 3,
    }
  },
  required: ["story", "choices"]
};

export async function generateNextStage(currentState: GameState): Promise<{ story: string; choices: GameChoice[] }> {
  // Token optimization: Only use the last 2 history items and a summary of the path
  const recentHistory = currentState.history.slice(-2);
  const pathSummary = currentState.history.length > 2 
    ? `[Path Summary: ${currentState.history.slice(0, -2).join(", ")}]` 
    : "";

  const prompt = `
    Game: 나락의 삶~도파민걸~ (Life in the Abyss ~Dopamine Girl~)
    Character: A 20-year-old male diving into extreme experiences.
    Current Stage: ${currentState.stage} / 10
    Current Abyss Gauge: ${currentState.abyssGauge}%
    
    Context:
    ${pathSummary}
    The User's Last Action: "${recentHistory[recentHistory.length - 1]}"
    The Previous Scene: "${currentState.story}"

    Task: Generate the next part of the story and 3 choices. 
    
    CRITICAL: The next story segment MUST be a direct, logical, and immediate consequence of the "User's Last Action". 
    It should feel like a continuous narrative where the user's choice just happened.
    
    - Story: Exactly 2-3 punchy, descriptive sentences.
    - Choices: Descriptive but concise (max 10 words).
    
    The STORY (Scene) MUST be logical, coherent, and grounded in the character's life as a 20-year-old gay male. 
    Focus on specific queer contexts: Itaewon clubs, Jongno-3ga, IvanCity encounters, meeting strangers, identity shifts, and the underground gay scene.

    The CHOICES MUST be ABSURD, EXTREME, and NON-LOGICAL impulses that arise from the situation.
    They should represent sudden, shocking, or life-altering decisions related to identity, sex, or social chaos.

    Abyss Gauge Impact Rules (CHAOS MODE):
    - Impacts are UNPREDICTABLE (-30 to +30). 
    - Extreme actions can crash the dopamine or skyrocket it.
    - DO NOT follow moral or logical patterns.

    Language: Korean (한국어)
    Tone: Intense, queer-focused, chaotic, and immersive.
    
    CONSTRAINT: DO NOT include any gory, bloody, or physically violent choices (e.g., "피투성이가 된다"). Focus on social, emotional, or identity-based chaos instead.
  `;

  const response = await ai.models.generateContent({
    model: "gemini-3.1-pro-preview",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: GAME_SCHEMA,
      systemInstruction: "You are a chaotic game master for a queer-themed adult adventure. The story (Scene) should be logical and grounded in the gay/queer subculture (Itaewon, Jongno, IvanCity, etc.). However, the choices must be unpredictable, extreme, and non-logical impulses. Focus on raw dopamine, identity shifts, and shocking actions. IMPORTANT: Avoid any gory, bloody, or physically violent content in the choices."
    },
  });

  try {
    return JSON.parse(response.text || "{}");
  } catch (e) {
    console.error("Failed to parse Gemini response", e);
    throw new Error("AI response parsing failed");
  }
}
