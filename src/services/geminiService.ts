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
  const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
  
  // 1. 라이브러리 대신 직접 구글 API 주소를 사용합니다. (v1beta 대신 v1 사용)
  const API_URL = `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${API_KEY}`;

  const prompt = `나락의 삶~도파민걸~ 게임.
    현재 스테이지: ${currentState.stage}/10, 게이지: ${currentState.abyssGauge}%.
    마지막 행동: ${currentState.history[currentState.history.length - 1] || "시작"}.
    다음 스토리와 선택지 3개를 한국어로 생성해줘. JSON 형식으로만 응답해.`;

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          responseMimeType: "application/json"
        }
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(JSON.stringify(errorData));
    }

    const data = await response.json();
    const text = data.candidates[0].content.parts[0].text;
    
    return JSON.parse(text);

  } catch (e: any) {
    console.error("🚨 수동 호출 에러:", e);
    return {
      story: "나락의 심연에서 연결이 끊겼습니다. 다시 시도해주세요.",
      choices: [
        { text: "정신 차리기", impact: -10, consequence: "간신히 현실로 돌아옵니다." },
        { text: "운명 수용", impact: 10, consequence: "나락에 몸을 맡깁니다." },
        { text: "새로고침", impact: 0, consequence: "시간을 되돌립니다." }
      ]
    };
  }
}
