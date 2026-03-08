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
      }
    }
  },
  required: ["story", "choices"]
};

export async function generateNextStage(currentState: GameState): Promise<{ story: string; choices: GameChoice[] }> {
  if (!API_KEY) throw new Error("API Key Missing");

  try {
    // [해결책] 모델명을 'gemini-1.5-flash'로 고정하고 불필요한 경로 생성을 막습니다.
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash", 
    });

    const prompt = `나락의 삶~도파민걸~ 게임.
      현재 스테이지: ${currentState.stage}/10, 게이지: ${currentState.abyssGauge}%.
      마지막 행동: ${currentState.history[currentState.history.length - 1] || "시작"}.
      다음 스토리와 선택지 3개를 한국어로 생성해줘.`;

    // [중요] 호출 방식을 가장 단순한 형태로 변경하여 v1beta 이슈를 회피합니다.
    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: GAME_SCHEMA,
      }
    });

    const response = await result.response;
    return JSON.parse(response.text());

  } catch (e: any) {
    console.error("🚨 최종 에러 디버깅:", e);
    
    // 에러 발생 시 게임이 멈추지 않게 함
    return {
      story: "데이터 연결이 지연되고 있습니다. (네트워크 상태를 확인하세요)",
      choices: [
        { text: "다시 시도", impact: 0, consequence: "연결을 재시도합니다." },
        { text: "평정심 유지", impact: -5, consequence: "차분하게 기다립니다." },
        { text: "나락 수용", impact: 10, consequence: "흐름에 몸을 맡깁니다." }
      ]
    };
  }
}
