import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = (import.meta.env.VITE_GEMINI_API_KEY as string) || "";
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

interface GeminiResponse {
  story: string;
  choices: GameChoice[];
}

export async function generateNextStage(currentState: GameState): Promise<GeminiResponse> {
  const prompt = `
    게임: 나락의 삶~도파민걸~
    캐릭터: 20세 남성, 자극적인 경험을 쫓는 퀴어 청년.
    현재 상황: 스테이지 ${currentState.stage}/10, 나락 게이지 ${currentState.abyssGauge}%
    마지막 로그: "${currentState.history[currentState.history.length - 1] || "시작"}"
    이전 장면: "${currentState.story}"

    [임무]
    위 상황을 이어받아 다음 스토리와 3개의 선택지를 생성하라.
    
    [응답 형식 - 반드시 JSON만 출력, 마크다운 블록 없이]
    {
      "story": "다음 스토리 내용...",
      "choices": [
        { "text": "강렬한 선택 1", "impact": 10, "consequence": "결과 설명" },
        { "text": "위험한 선택 2", "impact": 20, "consequence": "결과 설명" },
        { "text": "차분한 선택 3", "impact": -10, "consequence": "결과 설명" }
      ]
    }
  `;

  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-3.1-pro-preview",
      systemInstruction:
        "당신은 퀴어 어드벤처 게임의 혼돈스러운 게임마스터입니다. 반드시 'story'와 3개의 'choices' 배열을 포함한 순수 JSON 객체로만 응답하십시오. 마크다운 코드블록(```)을 절대 사용하지 마십시오.",
      generationConfig: {
        responseMimeType: "application/json",
      },
    });

    const result = await model.generateContent(prompt);
    const content = result.response.text();

    if (!content) throw new Error("Empty response");

    // 혹시 모를 마크다운 펜스 제거
    const cleaned = content.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(cleaned) as GeminiResponse;

    if (!parsed.choices || !Array.isArray(parsed.choices)) {
      throw new Error("Invalid choices format");
    }

    return parsed;
  } catch (e) {
    console.error("Gemini Error:", e);
    return {
      story: "나락의 흐름이 잠시 끊겼습니다. 도파민이 부족합니다.",
      choices: [
        { text: "다시 숨 고르기", impact: 0, consequence: "정신을 가다듬습니다." },
        { text: "심연으로 뛰어들기", impact: 10, consequence: "운명에 맡깁니다." },
        { text: "새로고침", impact: -5, consequence: "현실로 돌아옵니다." },
      ],
    };
  }
}
