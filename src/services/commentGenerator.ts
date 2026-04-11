// 선택한 코드에서 실제 주석 문자열을 생성

import { getCommentPrefix } from './commentPrefix';

export function generateComment(selectedText: string, languageId: string): string {
  const commentPrefix = getCommentPrefix(languageId);
  const firstLine = selectedText.split('\n')[0].trim().slice(0, 60);

  return `${commentPrefix}${firstLine}${firstLine.length >= 60 ? '...' : ''}\n`;
}

export function formatCommentText(commentText: string, languageId: string): string {
  const commentPrefix = getCommentPrefix(languageId);
  return `${commentPrefix}${commentText.trim()}\n`;
}