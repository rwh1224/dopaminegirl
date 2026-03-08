import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";

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

const GAME_SCHEMA = {
  type: SchemaType.OBJECT,
  properties: {
    story: { type: SchemaType.STRING },
    choices: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          text: { type: SchemaType.STRING },
          impact: { type: SchemaType.NUMBER },
          consequence: { type: SchemaType.STRING }
        },
        required: ["text", "impact", "consequence"]
      },
      minItems: 3,
      maxItems: 3
    }
  },
  required: ["story", "choices"]
};

export async function generateNextStage(currentState: GameState): Promise<{ story: string; choices: GameChoice[] }> {
  if (!API_KEY) throw new Error("API Key Missing");

  // [핵심 수정] 모델명을 'models/gemini-1.5-flash'로 명시적으로 적어줍니다.
  const model = genAI.getGenerativeModel({
    model: "models/gemini-1.5-flash", 
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: GAME_SCHEMA,
    }
  });

  const prompt = `나락의 삶~도파민걸~ 게임.
    현재 스테이지: ${currentState.stage}/10, 게이지: ${currentState.abyssGauge}%.
    마지막 행동: ${currentState.history[currentState.history.length - 1] || "시작"}.
    다음 스토리와 선택지 3개를 한국어로 생성해줘.`;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    return JSON.parse(text);
  } catch (e: any) {
    console.error("🚨 상세 에러 발생:", e);
    
    // 에러가 나면 다음 단계로 강제 진행을 위해 기본값 반환
    return {
      story: "서버 연결이 불안정하여 잠시 나락의 기운이 흩어졌습니다.",
      choices: [
        { text: "다시 정신 차리기", impact: -5, consequence: "간신히 현실로 돌아옵니다." },
        { text: "심호흡하기", impact: 0, consequence: "평정심을 되찾습니다." },
        { text: "운명에 맡기기", impact: 10, consequence: "다시 흐름에 몸을 던집니다." }
      ]
    };
  }
}
