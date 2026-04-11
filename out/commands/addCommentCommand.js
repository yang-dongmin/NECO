"use strict";
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
exports.addCommentFromSelection = addCommentFromSelection;
const vscode = __importStar(require("vscode"));
const editorUtils_1 = require("../utils/editorUtils");
const commentGenerator_1 = require("../services/commentGenerator");
/*
  - 현재 에디터에서 사용자가 선택한 코드를 읽는다.
  - 선택한 코드에 맞는 주석 문자열을 만든다.
  - 선택 시작 줄의 위쪽에 주석을 삽입한다.

  editorUtils -> 현재 에디터 / 선택 텍스트 가져오기
  commentGenerator -> 주석 문자열 생성
  vscode editor.edit -> 실제 코드에 삽입
*/
async function addCommentFromSelection() {
    // 현재 활성화된 에디터를 가져온다.
    const editor = (0, editorUtils_1.getActiveEditor)();
    // 열린 파일이 없으면 더 진행하지 않는다.
    if (!editor) {
        vscode.window.showErrorMessage('열린 파일이 없습니다!');
        return;
    }
    // 사용자가 드래그한 선택 영역의 텍스트를 가져온다.
    const selectedText = (0, editorUtils_1.getSelectedText)(editor);
    // 선택된 코드가 비어 있으면 안내 메시지를 띄운다.
    if (!selectedText.trim()) {
        vscode.window.showErrorMessage('코드를 선택해주세요!');
        return;
    }
    // 현재 파일의 언어 id를 가져온다.
    // 예: javascript, python, java
    const languageId = editor.document.languageId;
    // 선택이 시작된 줄 번호를 기준으로 주석을 넣을 위치를 잡는다.
    // column 0이므로 해당 줄 맨 앞에 삽입된다.
    const startLine = editor.selection.start.line;
    const position = new vscode.Position(startLine, 0);
    // 선택한 코드와 언어 정보를 바탕으로 주석 문자열을 만든다.
    const comment = (0, commentGenerator_1.generateComment)(selectedText, languageId);
    // 계산한 위치에 주석을 실제로 삽입한다.
    await editor.edit(editBuilder => {
        editBuilder.insert(position, comment);
    });
}
//# sourceMappingURL=addCommentCommand.js.map