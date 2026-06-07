"use strict";
// AI가 생성한 설명 문장에 언어별 주석 기호를 붙여 반환
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatCommentText = formatCommentText;
const commentPrefix_1 = require("./commentPrefix");
function formatCommentText(commentText, languageId) {
    const commentPrefix = (0, commentPrefix_1.getCommentPrefix)(languageId);
    return `${commentPrefix}${commentText.trim()}\n`;
}
//# sourceMappingURL=commentGenerator.js.map