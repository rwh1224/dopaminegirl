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
  // 프롬프트에 구체적인 JSON 구조 예시를 추가하여 GPT가 딴소리 못하게 합니다.
  const prompt = `
    게임: 나락의 삶~도파민걸~
    캐릭터: 20세 남성, 자극적인 경험을 쫓는 퀴어 청년.
    현재 상황: 스테이지 ${currentState.stage}/10, 나락 게이지 ${currentState.abyssGauge}%
    마지막 로그: "${currentState.history[currentState.history.length - 1] || "시작"}"
    이전 장면: "${currentState.story}"

    [임무]
    위 상황을 이어받아 다음 스토리와 3개의 선택지를 생성하라.
    
    [응답 형식 예시]
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
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { 
          role: "system", 
          content: "당신은 퀴어 어드벤처 게임의 혼돈스러운 게임마스터입니다. 반드시 'story'와 3개의 'choices' 배열을 포함한 JSON 객체로만 응답하십시오." 
        },
        { role: "user", content: prompt }
      ],
      // JSON 모드 활성화 (반드시 system 메시지에 JSON 단어가 포함되어야 함)
      response_format: { type: "json_object" }
    });

    const content = response.choices[0].message.content;
    console.log("GPT 원본 응답 확인:", content); // 로그를 찍어 실제 데이터 구조를 확인하세요.

    if (!content) throw new Error("Empty response");

    const parsed = JSON.parse(content) as OpenAIResponse;

    // 만약 GPT가 응답을 제대로 못 만들었을 때를 대비한 최소한의 방어 로직
    if (!parsed.choices || !Array.isArray(parsed.choices)) {
      throw new Error("Invalid choices format");
    }

    return parsed;

  } catch (e) {
    console.error("OpenAI Error:", e);
    return {
      story: "나락의 흐름이 잠시 끊겼습니다. 도파민이 부족합니다.",
      choices
