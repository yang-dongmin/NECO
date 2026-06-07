// AI가 생성한 설명 문장에 언어별 주석 기호를 붙여 반환

import { getCommentPrefix } from './commentPrefix';

export function formatCommentText(commentText: string, languageId: string): string {
  const commentPrefix = getCommentPrefix(languageId);
  return `${commentPrefix}${commentText.trim()}\n`;
}