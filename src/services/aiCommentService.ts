import { GoogleGenerativeAI } from '@google/generative-ai';

/*
  - Gemini API를 사용해서 선택한 코드에 대한 AI 주석 문장을 만든다.
  - 여기서는 "주석 기호 없는 순수 설명 문장"만 생성한다.
  - 실제 //, # 같은 주석 기호는 다른 서비스에서 붙인다.
  - API 키는 process.env.GEMINI_API_KEY 에서 읽는다 -> .env 폴더로 경로 수직 변경
*/

export async function generateAiComment(
  code: string,
  languageId: string
): Promise<{ success: boolean; comment?: string; message?: string }> {
  // 현재 실행 환경에 Gemini API 키가 들어왔는지 확인하는 디버그 로그
  console.log('[NECO] GEMINI_API_KEY exists:', !!process.env.GEMINI_API_KEY);

  // 환경변수에서 API 키를 읽는다.
  const apiKey = process.env.GEMINI_API_KEY;

  // 키가 없으면 요청을 보내지 않고 바로 실패 처리한다.
  if (!apiKey) {
    return {
      success: false,
      message: 'GEMINI_API_KEY 환경변수가 설정되어 있지 않아요.',
    };
  }

  // 선택된 코드가 비어 있으면 요청할 내용이 없으므로 중단한다.
  if (!code.trim()) {
    return {
      success: false,
      message: '선택된 코드가 없어요.',
    };
  }

  try {
    // Gemini 클라이언트를 생성한다.
    const genAI = new GoogleGenerativeAI(apiKey);

    // 사용할 모델을 지정한다.
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    /*
      프롬프트 역할:
      - 선택한 코드가 어떤 언어인지 전달
      - 코드 바로 위에 들어갈 한 줄 설명만 만들도록 제한
      - 코드 블록, 따옴표, 번호 없이 결과만 반환하도록 지시
      - //, # 같은 주석 기호는 붙이지 말라고 명시
    */
    const prompt =
      `언어: ${languageId}\n` +
      `선택 코드:\n${code}\n\n` +
      `해야 할 일:\n` +
      `- 이 코드 바로 위에 들어갈 한국어 주석 한 줄만 만들어라.\n` +
      `- 짧고 자연스럽게 설명해라.\n` +
      `- 코드 블록, 따옴표, 번호, 불릿 없이 결과 문장만 반환해라.\n` +
      `- 주석 기호(//, #, /* */)는 붙이지 마라. 설명 문장만 반환해라.`;

    // Gemini에 프롬프트를 보내고 응답을 받는다.
    const result = await model.generateContent(prompt);
    const response = await result.response;

    // 최종 텍스트만 꺼내서 공백을 정리한다.
    const text = response.text().trim();

    // 응답이 비어 있으면 실패로 처리한다.
    if (!text) {
      return {
        success: false,
        message: 'Gemini가 비어 있는 응답을 반환했어요.',
      };
    }

    // 성공 시 comment 필드에 생성된 설명 문장을 담아 반환한다.
    return {
      success: true,
      comment: text,
    };
  } catch (error) {
    // API 호출 실패 시 디버그용 로그를 남긴다.
    console.error('[NECO] Gemini error full:', error);
    console.log('[NECO] using model: gemini-2.5-flash');
    console.log('[NECO] api key exists:', !!apiKey);

    // 화면에 보여줄 에러 메시지를 정리한다.
    const message =
      error instanceof Error
        ? `${error.name}: ${error.message}`
        : 'Gemini 주석 생성 중 오류가 발생했어요.';

    return {
      success: false,
      message,
    };
  }
}