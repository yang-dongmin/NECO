"use strict";
// 웹뷰(App.tsx)에서 요청한 "주석 생성" / "주석 삽입" 기능을
// 실제 에디터 로직과 연결해주는 중간 서비스이다.
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateCommentPreview = generateCommentPreview;
exports.generateAiCommentPreview = generateAiCommentPreview;
exports.insertGeneratedComment = insertGeneratedComment;
const vscode = __importStar(require("vscode"));
const commentGenerator_1 = require("./commentGenerator");
const aiCommentService_1 = require("./aiCommentService");
const editorUtils_1 = require("../utils/editorUtils");
/*
  기본 주석 미리보기 생성
  - 선택한 코드를 읽고
  - 규칙 기반 주석 문자열을 만들어서
  - 웹뷰 미리보기에 보여줄 결과를 반환한다.

  현재 구조에서는 AI 주석을 주로 사용하지만,
  기본 주석 기능을 남겨두고 싶을 때 사용할 수 있다.
*/
function generateCommentPreview() {
    // 현재 활성 에디터를 가져온다.
    const editor = (0, editorUtils_1.getActiveEditor)();
    // 열린 파일이 없으면 중단
    if (!editor) {
        return { success: false, message: '열린 파일이 없습니다!' };
    }
    // 사용자가 선택한 코드 영역을 가져온다.
    const selectedText = (0, editorUtils_1.getSelectedText)(editor);
    // 선택된 코드가 없으면 중단
    if (!selectedText.trim()) {
        return { success: false, message: '코드를 선택해주세요!' };
    }
    // 현재 파일의 언어 id
    const languageId = editor.document.languageId;
    // 규칙 기반 주석 문자열 생성
    const comment = (0, commentGenerator_1.generateComment)(selectedText, languageId);
    return { success: true, comment };
}
/*
  AI 주석 미리보기 생성
  - 선택한 코드를 Gemini로 보내 설명 문장을 만든다.
  - AI는 순수 설명 문장만 반환하므로
  - formatCommentText()로 //, # 같은 실제 주석 형식까지 붙여서 반환한다.

  중요 경로:
  App.tsx
    -> generateAiCommentPreview 메시지 전송
    -> NecoViewProvider.ts
    -> 이 함수 호출
*/
async function generateAiCommentPreview() {
    // 현재 활성 에디터를 가져온다.
    const editor = (0, editorUtils_1.getActiveEditor)();
    // 열린 파일이 없으면 중단
    if (!editor) {
        return { success: false, message: '열린 파일이 없습니다!' };
    }
    // 사용자가 선택한 코드 영역을 가져온다.
    const selectedText = (0, editorUtils_1.getSelectedText)(editor);
    // 선택된 코드가 없으면 중단
    if (!selectedText.trim()) {
        return { success: false, message: '코드를 선택해주세요!' };
    }
    // 현재 파일의 언어 id
    const languageId = editor.document.languageId;
    // AI 서비스에 코드와 언어 정보를 보내 설명 문장을 생성한다.
    const aiResult = await (0, aiCommentService_1.generateAiComment)(selectedText, languageId);
    // AI 생성 실패 시 에러 메시지를 그대로 반환
    if (!aiResult.success || !aiResult.comment) {
        return {
            success: false,
            message: aiResult.message ?? 'AI 주석 생성에 실패했어요.',
        };
    }
    // AI는 설명 문장만 만들기 때문에,
    // 실제 코드에 넣을 수 있도록 언어별 주석 기호를 붙여준다.
    const formatted = (0, commentGenerator_1.formatCommentText)(aiResult.comment, languageId);
    return {
        success: true,
        comment: formatted,
    };
}
/*
  생성된 주석을 실제 에디터에 삽입
  - 웹뷰 미리보기에서 확인한 주석 문자열을 받아
  - 현재 선택 시작 줄의 맨 앞에 삽입한다.

  중요:
  - 삽입 위치는 "선택 시작 줄의 위"가 아니라
    "선택 시작 줄의 맨 앞"에 문자열을 넣는 방식이다.
  - comment 문자열에는 줄바꿈(\n)이 포함되어 있어야
    실제로 코드 위 주석처럼 보인다.
*/
async function insertGeneratedComment(comment) {
    // 현재 활성 에디터를 가져온다.
    const editor = (0, editorUtils_1.getActiveEditor)();
    // 열린 파일이 없으면 중단
    if (!editor) {
        return { success: false, message: '열린 파일이 없습니다!' };
    }
    // 삽입할 주석이 비어 있으면 중단
    if (!comment.trim()) {
        return { success: false, message: '삽입할 주석이 없습니다!' };
    }
    // 선택이 시작된 줄의 맨 앞 위치를 구한다.
    const startLine = editor.selection.start.line;
    const position = new vscode.Position(startLine, 0);
    // 실제 에디터에 주석 문자열 삽입
    const applied = await editor.edit(editBuilder => {
        editBuilder.insert(position, comment);
    });
    // 삽입 실패 시 안내 메시지 반환
    if (!applied) {
        return { success: false, message: '주석 삽입에 실패했어요.' };
    }
    return { success: true, message: '주석을 삽입했어요!' };
}
//# sourceMappingURL=webviewCommentService.js.map