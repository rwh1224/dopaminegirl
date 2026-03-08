/// <reference types="vite/client" />

interface ImportMetaEnv {
  // 기존 변수
  readonly VITE_GAME_PASSWORD: string;
  // 새로 추가할 OpenAI API 키
  readonly VITE_OPENAI_API_KEY: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
