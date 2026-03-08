import OpenAI from "openai";

// Vite 환경 변수 타입 안전성 확보
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

// 응답 스키마 타입 정의
interface OpenAIResponse {
  story: string;
  choices: GameChoice[];
}

export async function generateNextStage(currentState: GameState): Promise<OpenAIResponse> {
  if (!API_KEY) {
    console.error("🚨 VITE_OPENAI_API_KEY가 설정되지 않았습니다.");
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
    - 선택지: 논리를 벗어난 충동적이고 극단적인 결정들 (최대 10단어).
    - 언어: 한국어 (강렬하고 몰입감 있는 톤)
    - 응답 형식: 반드시 story(문자열)와 choices(배열)를 포함한 JSON 객체.
  `;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { 
          role: "system", 
          content: "당신은 퀴어 어드벤처 게임의 혼돈스러운 게임마스터입니다. 반드시 JSON 형식으로만 답변하며, story와 3개의 choices를 포함해야 합니다." 
        },
        { role: "user", content: prompt }
      ],
      response_format: { type: "json_object" }
    });

    const content = response.choices[0].message.content;
    
    if (!content) {
      throw new Error("OpenAI 응답 내용이 비어있습니다.");
    }

    // 파싱된 데이터가 OpenAIResponse 인터페이스를 따르는지 확인
    const parsedData: OpenAIResponse = JSON.parse(content);
    return parsedData;

  } catch (e: unknown) {
    console.error("🚨 OpenAI 호출 에러:", e);
    
    // 에러 발생 시 빌드 및 실행을 방해하지 않는 기본값 반환
    return {
      story: "시스템 오류로 인해 일시적으로 현실감이 멀어집니다. 다시 시도해 주세요.",
      choices: [
        { text: "정
