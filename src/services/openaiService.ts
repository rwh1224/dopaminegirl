import OpenAI from "openai";

// Vercel 환경 변수에서 OpenAI 키를 가져옵니다.
const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true // 브라우저 직접 호출 허용
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

export async function generateNextStage(currentState: GameState): Promise<{ story: string; choices: GameChoice[] }> {
  // 환경 변수 체크
  if (!import.meta.env.VITE_OPENAI_API_KEY) {
    console.error("OpenAI API Key is missing in Environment Variables");
  }

  const prompt = `
    게임: 나락의 삶~도파민걸~
    캐릭터: 20세 남성, 자극적인 경험을 쫓는 퀴어 청년.
    현재 스테이지: ${currentState.stage} / 10
    현재 나락 게이지: ${currentState.abyssGauge}%
    마지막 행동: "${currentState.history[currentState.history.length - 1] || "시작"}"
    이전 장면: "${currentState.story}"

    태스크: 다음 스토리 세그먼트와 선택지 3개를 생성해라.
    
    [규칙]
    - 스토리: 이태원, 종로 등 실제 퀴어 서사를 기반으로 한 논리적이고 감각적인 2-3문장.
    - 선택지: 논리를 벗어난 충동적이고 극단적인 결정들.
    - 언어: 한국어 (강렬하고 몰입감 있는 톤)
    - 반드시 아래 JSON 구조로만 응답할 것.
  `;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini", // 빠르고 가성비 좋은 최신 모델
      messages: [
        { 
          role: "system", 
          content: "당신은 퀴어 어드벤처 게임의 혼돈스러운 게임마스터입니다. 모든 응답은 반드시 JSON 형식이어야 합니다." 
        },
        { role: "user", content: prompt }
      ],
      response_format: { type: "json_object" } // JSON 출력 강제 (에러 방지 핵심)
    });

    const content = response.choices[0].message.content;
    
    if (!content) throw new Error("응답 내용이 비어있습니다.");
    
    return JSON.parse(content);

  } catch (e: any) {
    console.error("🚨 OpenAI 호출 에러:", e);
    
    // 에러 발생 시 부드러운 진행을 위한 기본 데이터
    return {
      story: "시스템에 과부하가 걸려 잠시 나락의 시공간이 뒤틀렸습니다.",
      choices: [
        { text: "다시 숨 고르기", impact: -5, consequence: "안정을 찾습니다." },
        { text: "흐름에 몸 던지기", impact: 10, consequence: "다시 나아갑니다." },
        { text: "운명 받아들이기", impact: 5, consequence: "받아들입니다." }
      ]
    };
  }
}
