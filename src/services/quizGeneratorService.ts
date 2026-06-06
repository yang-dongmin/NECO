// 공개 노트 저장 시 AI가 핵심 부분을 찾아 빈칸 문제로 변환

import { GoogleGenerativeAI } from '@google/generative-ai';

interface QuizResult {
  success: boolean;
  blankedCode?: string; // 빈칸이 [___]로 표시된 코드
  answer?: string;      // 정답
  hint?: string;        // 힌트
  message?: string;
}

export async function generateQuiz(
  code: string,
  comment: string,
  languageId: string
): Promise<QuizResult> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return { success: false, message: 'API 키가 없어요.' };
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const prompt = `
다음 ${languageId} 코드에서 핵심이 되는 부분 하나를 골라 빈칸 문제를 만들어라.

코드 해설: ${comment}

코드:
${code}

규칙:
- 핵심 키워드나 표현 하나만 [___]로 바꿔라
- 너무 쉬운 것(변수명 등)은 피해라
- 반드시 아래 JSON 형식으로만 응답해라 (다른 텍스트 없이)

{
  "blankedCode": "빈칸이 [___]로 표시된 전체 코드",
  "answer": "정답 단어나 표현",
  "hint": "한 줄 힌트"
}`;

    const result = await model.generateContent(prompt);
    const text = result.response.text().trim();

    // JSON 파싱
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return { success: false, message: 'AI 응답 파싱 실패' };
    }

    const parsed = JSON.parse(jsonMatch[0]);

    if (!parsed.blankedCode || !parsed.answer) {
      return { success: false, message: 'AI 응답 형식 오류' };
    }

    return {
      success: true,
      blankedCode: parsed.blankedCode,
      answer: parsed.answer,
      hint: parsed.hint ?? '',
    };
  } catch (error) {
    console.error('[NECO] 퀴즈 생성 오류:', error);
    return { success: false, message: '퀴즈 생성 중 오류가 발생했어요.' };
  }
}