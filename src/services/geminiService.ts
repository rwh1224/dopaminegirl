import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";

// [수정 1] Vite 환경에 맞게 환경 변수 호출 방식을 변경했습니다.
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY || "";
const genAI = new GoogleGenerativeAI(API_KEY);

export interface GameChoice {
  text: string;
  impact: number;
  consequence: string;
}

export interface GameState {
  stage: number;
  abyssGauge: number;
  story: string;
  choices: GameChoice[];
  history: string[];
}

// [수정 2] SchemaType 정의 방식을 최신 라이브러리 규격에 맞췄습니다.
const GAME_SCHEMA = {
  type: SchemaType.OBJECT,
  properties: {
    story: {
      type: SchemaType.STRING,
      description: "The current segment of the story. Keep it around 2-3 punchy sentences.",
    },
    choices: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          text: { type: SchemaType.STRING, description: "Descriptive choice text (max 15 words)." },
          impact: { type: SchemaType.NUMBER, description: "The impact on the abyss gauge (integer between -30 and 30)." },
          consequence: { type: SchemaType.STRING, description: "Brief summary of the result." }
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
  if (!API_KEY) {
    throw new Error("Vite 환경 변수(VITE_GEMINI_API_KEY)가 설정되지 않았습니다.");
  }

  // [수정 3] 모델 명칭을 안정적인 'gemini-1.5-flash'로 변경 (Vercel 무료 티어 권장)
  const model = genAI.getGenerativeModel({ 
    model: "gemini-1.5-flash",
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: GAME_SCHEMA,
    },
    systemInstruction: "You are a chaotic game master for a queer-themed adult adventure. The story (Scene) should be logical and grounded in the gay/queer subculture (Itaewon, Jongno, IvanCity, etc.). However, the choices must be unpredictable, extreme, and non-logical impulses. Focus on raw dopamine, identity shifts, and shocking actions. IMPORTANT: Avoid any gory, bloody, or physically violent content in the choices."
  });

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
    Language: Korean (한국어)
  `;

  const result = await model.generateContent(prompt);
  const response = await result.response;
  
  try {
    return JSON.parse(response.text());
  } catch (e) {
    console.error("Failed to parse Gemini response", e);
    throw new Error("AI response parsing failed");
  }
}
