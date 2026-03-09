import { GoogleGenAI, Type } from "@google/genai";

const aiApiKey = import.meta.env.VITE_GEMINI_API_KEY || "";
const ai = new GoogleGenAI({ apiKey: aiApiKey });

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
  const recentHistory = currentState.history.slice(-2);
  const pathSummary = currentState.history.length > 2 
    ? `[Path Summary: ${currentState.history.slice(0, -2).join(", ")}]` 
    : "";

  const prompt = `
    Game: 나락의 삶~도파민걸~ (Life in the Abyss ~Dopamine Girl~)
    Character: 20-year-old male exploring the chaotic fringes of queer life.
    Stage: ${currentState.stage} / 10 | Current Abyss Gauge: ${currentState.abyssGauge}%
    
    [Context]
    ${pathSummary}
    User's Last Action: "${recentHistory[recentHistory.length - 1]}"
    Previous Scene: "${currentState.story}"

    [Task: Break the Pattern]
    1. Expand the Map: Move the story to specific vibes—the humid, crowded Jongno-3ga pojangmacha (street stalls), a neon-soaked Nonhyeon karaoke, or a sophisticated yet underground queer cocktail bar.
    2. Diverse Encounters: Introduce strong characters like a charismatic lesbian "Unnie" (leader type), a mysterious transgender performer, or a seasoned stall owner who knows everyone's secrets.
    3. Narrative: 2-3 punchy Korean sentences. It must feel like an immediate consequence of the "Last Action."
    4. Chaotic Choices: Avoid repetitive "drink more" options. Provide 3 ABSURD, NON-LOGICAL impulses: 
       - e.g., "Join a stranger's breakup argument," "Declare yourself a diva and hijack the karaoke stage," "Ask a trans sister to rename you on the spot," or "Throw your phone into a glass of cocktail."

    [Rules]
    - Language: Korean (Use authentic slang: 이반, 일반, 부치, 팸, 끼순이, etc.)
    - NO physical violence/gore. Focus on social, emotional, and identity-based chaos.
    - Impacts: Unpredictable (-30 to +30).
  `;

  const response = await ai.models.generateContent({
    model: "gemini-3.1-pro-preview",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: GAME_SCHEMA,
      systemInstruction: `You are a Manic Game Master for a queer adult adventure. 
      Your goal is to maximize variety. Every stage should feel different:
      - Integrate Jongno-3ga stalls, karaokes, and cocktail bars.
      - Feature lesbians, transgender characters, and drag queens as key NPCs.
      - Choices must be unpredictable "Dopamine Impulses" that defy social norms.
      - Maintain a tone that is intense, immersive, and unapologetically queer.`
    },
  });

  try {
    return JSON.parse(response.text || "{}");
  } catch (e) {
    console.error("Failed to parse Gemini response", e);
    throw new Error("AI response parsing failed");
  }
}
