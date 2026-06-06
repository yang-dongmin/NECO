"use strict";
// 선택한 코드에서 실제 주석 문자열을 생성
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateComment = generateComment;
exports.formatCommentText = formatCommentText;
const commentPrefix_1 = require("./commentPrefix");
function generateComment(selectedText, languageId) {
    const commentPrefix = (0, commentPrefix_1.getCommentPrefix)(languageId);
    const firstLine = selectedText.split('\n')[0].trim().slice(0, 60);
    return `${commentPrefix}${firstLine}${firstLine.length >= 60 ? '...' : ''}\n`;
}
function formatCommentText(commentText, languageId) {
    const commentPrefix = (0, commentPrefix_1.getCommentPrefix)(languageId);
    return `${commentPrefix}${commentText.trim()}\n`;
}
//# sourceMappingURL=commentGenerator.js.map