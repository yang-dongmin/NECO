// 파서가 코드를 분석한 결과를 담는 타입

export interface ParsedParam {
    name: string;
    type?: string;
}

export interface ParsedCode {
    functionName?: string;       // 함수명 (없으면 undefined - 함수가 아닌 코드 선택 시)
    params: ParsedParam[];       // 매개변수 목록
    returnType?: string;         // 반환 타입
    calledFunctions: string[];   // 호출 함수
    languageId: string;          // 언어 id (typescript, python 등)
    raw: string;                 // 원본 선택 코드
}

// 파서 결과 - 성공/실패 래퍼
export type ParseResult =
    | { success: true; parsed: ParsedCode }
    | { success: false; reason: string };