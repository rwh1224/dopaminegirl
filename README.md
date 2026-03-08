# 나락의 삶 ~도파민걸~

이 프로젝트는 Vite + React + Tailwind CSS로 구축된 텍스트 어드벤처 게임입니다. Gemini AI를 사용하여 실시간으로 시나리오를 생성합니다.

## 🚀 Vercel 배포 방법

이 프로젝트는 Vercel에 최적화되어 있습니다.

1. **GitHub 저장소 연결**: GitHub에 코드를 푸시하고 Vercel 대시보드에서 해당 저장소를 연결합니다.
2. **환경 변수 설정**: Vercel 프로젝트 설정의 'Environment Variables' 섹션에 다음 변수를 추가합니다.
   - `GEMINI_API_KEY`: [Google AI Studio](https://aistudio.google.com/app/apikey)에서 발급받은 API 키
   - `VITE_GAME_PASSWORD`: 게임 입장 시 필요한 패스워드 (선택 사항)
3. **배포**: Vercel이 자동으로 빌드 및 배포를 수행합니다.

## 🛠 기술 스택

- **Frontend**: React 19, Vite, Tailwind CSS 4
- **Animation**: Motion (Framer Motion)
- **AI**: Google Gemini 3.1 Pro (via `@google/genai`)
- **Icons**: Lucide React

## 📁 프로젝트 구조

- `src/App.tsx`: 메인 게임 로직 및 UI
- `src/services/geminiService.ts`: Gemini API 연동 로직
- `vercel.json`: Vercel SPA 라우팅 설정
