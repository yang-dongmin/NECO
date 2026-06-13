import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai';
import { ParsedCode } from './parser/types';

/*
  - Gemini API를 사용해서 선택한 코드에 대한 AI 주석 문장을 만든다.
  - 여기서는 "주석 기호 없는 순수 설명 문장"만 생성한다.
  - 실제 //, # 같은 주석 기호는 다른 서비스에서 붙인다.
  - API 키는 process.env.GEMINI_API_KEY 에서 읽는다.
*/

// 싱글턴: 모듈 로드 시 한 번만 생성
let _model: GenerativeModel | null = null;

function getModel(): GenerativeModel | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  if (!_model) {
    const genAI = new GoogleGenerativeAI(apiKey);
    _model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
  }
  return _model;
}

export async function generateAiComment(
  code: string,
  languageId: string,
  parsedCode?: ParsedCode | null
): Promise<{ success: boolean; comment?: string; message?: string }> {
  const model = getModel();

  if (!model) {
    return {
      success: false,
      message: 'GEMINI_API_KEY 환경변수가 설정되어 있지 않아요.',
    };
  }

  if (!code.trim()) {
    return {
      success: false,
      message: '선택된 코드가 없어요.',
    };
  }

  try {
    const contextPart = parsedCode?.functionName ? `
    코드 분석 정보:
    - 함수명: ${parsedCode.functionName}
    - 매개변수: ${parsedCode.params.map(p => p.type ? `${p.name}: ${p.type}` : p.name).join(', ') || '없음'}
    - 반환타입: ${parsedCode.returnType ?? '없음'}
    - 호출 함수: ${parsedCode.calledFunctions.slice(0, 5).join(', ') || '없음'}
    ` : '';

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
      (contextPart ? `${contextPart}\n` : '') +
      `해야 할 일:\n` +
      `- 이 코드 바로 위에 들어갈 한국어 주석 한 줄만 만들어라.\n` +
      `- 함수명, 매개변수, 반환타입 정보가 있으면 적극 활용해라.\n` +
      `- 짧고 자연스럽게 설명해라.\n` +
      `- 코드 블록, 따옴표, 번호, 불릿 없이 결과 문장만 반환해라.\n` +
      `- 주석 기호(//, #, /* */)는 붙이지 마라. 설명 문장만 반환해라.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text().trim();

    if (!text) {
      return {
        success: false,
        message: 'Gemini가 비어 있는 응답을 반환했어요.',
      };
    }

    return { success: true, comment: text };
  } catch (error) {
    console.error('[NECO] Gemini error:', error);

    const message =
      error instanceof Error
        ? `${error.name}: ${error.message}`
        : 'Gemini 주석 생성 중 오류가 발생했어요.';

    return { success: false, message };
  }
}
