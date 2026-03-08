import OpenAI from "openai";

const API_KEY = (import.meta.env.VITE_OPENAI_API_KEY as string) || "";

const openai = new OpenAI({
  apiKey: API_KEY,
  dangerouslyAllowBrowser: true 
});

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

interface OpenAIResponse {
  story: string;
  choices: GameChoice[];
}

export async function generateNextStage(currentState: GameState): Promise<OpenAIResponse> {
  const prompt = `
    게임: 나락의 삶~도파민걸~
    캐릭터: 20세 남성, 자극적인 경험을 쫓는 퀴어 청년.
    현재 스테이지: ${currentState.stage} / 10
    현재 나락 게이지: ${currentState.abyssGauge}%
    마지막 행동: "${currentState.history[currentState.history.length - 1] || "시작"}"
    이전 장면: "${currentState.story}"

    태스크: 다음 스토리와 선택지 3개를 생성해라.
    규칙: 반드시 JSON 형식으로만 답변하며, story와 3개의 choices를 포함해야 합니다.
  `;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { 
          role: "system", 
          content: "당신은 퀴어 게임마스터입니다. 반드시 JSON으로만 답변하세요." 
        },
        { role: "user", content: prompt }
      ],
      response_format: { type: "json_object" }
    });

    const content = response.choices[0].message.content;
    if (!content) throw new Error("Empty response");

    return JSON.parse(content) as OpenAIResponse;

  } catch (e) {
    console.error("OpenAI Error:", e);
    return {
      story: "시스템 오류가 발생했습니다. 다시 시도해주세요.",
      choices: [
        { text: "다시 시도", impact: 0, consequence: "재접속합니다." },
        { text: "현실 복귀", impact: -10, consequence: "안정을 찾습니다." },
        { text: "운명 수용", impact: 5, consequence: "받아들입니다." }
      ]
    };
  }
}
