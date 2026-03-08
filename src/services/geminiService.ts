import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";

// 환경 변수 로드
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

// JSON 스키마 정의 (Vercel 빌드 및 런타임 안정성 강화)
const GAME_SCHEMA = {
  description: "Dopamine Girl Game Stage Schema",
  type: SchemaType.OBJECT,
  properties: {
    story: {
      type: SchemaType.STRING,
      description: "The current story segment (2-3 sentences).",
    },
    choices: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          text: { type: SchemaType.STRING, description: "Choice text." },
          impact: { type: SchemaType.NUMBER, description: "Gauge change (-30 to 30)." },
          consequence: { type: SchemaType.STRING, description: "Brief outcome." }
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
  // 키 확인 (런타임 에러 방지)
  if (!API_KEY) {
    throw new Error("API Key가 없습니다. Vercel 환경 변수를 확인하세요.");
  }

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
    Game: 나락의 삶~도파민걸~
    Current Stage: ${currentState.stage} / 10
    Abyss Gauge: ${currentState.abyssGauge}%
    Context: ${pathSummary}
    User's Last Action: "${recentHistory[recentHistory.length - 1] || "Start"}"
    Previous Scene: "${currentState.story}"
    
    Task: Generate the next story segment and 3 choices in Korean.
  `;

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    
    // JSON 파싱 전 유효성 검사
    if (!text) throw new Error("AI가 빈 응답을 반환했습니다.");
    
    return JSON.parse(text);
  } catch (e) {
    console.error("Gemini API Error:", e);
    // 에러 발생 시 사용자에게 보여줄 기본값 (Fallback)
    return {
      story: "알 수 없는 나락의 기운이 몰려옵니다. 다시 시도해보세요.",
      choices: [
        { text: "정신 차리기", impact: -10, consequence: "간신히 이성을 되찾습니다." },
        { text: "운명에 맡기기", impact: 20, consequence: "나락으로 한 발짝 더 다가갑니다." },
        { text: "도망치기", impact: 0, consequence: "아무 일도 일어나지 않았습니다." }
      ]
    };
  }
}
