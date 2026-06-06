"use strict";
// 에디터에서 자주 사용하는 기능을 공통 함수로 모아둔 유틸 파일이다.
// 여러 파일에서 같은 코드를 반복하지 않기 위해 따로 분리했다.
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
exports.getActiveEditor = getActiveEditor;
exports.getSelectedText = getSelectedText;
exports.getCurrentFileName = getCurrentFileName;
const vscode = __importStar(require("vscode"));
/*
  현재 활성화된 에디터를 반환한다.
  - 열린 파일이 없으면 undefined가 반환된다.
  - 주석 생성, 삽입, 선택 감지 등에서 공통으로 사용된다.
*/
function getActiveEditor() {
    return vscode.window.activeTextEditor;
}
/*
  현재 에디터에서 사용자가 선택한 텍스트를 반환한다.
  - 드래그한 코드 영역을 그대로 문자열로 가져온다.
*/
function getSelectedText(editor) {
    return editor.document.getText(editor.selection);
}
/*
  현재 파일의 "이름만" 반환한다.
  - 전체 경로가 아니라 마지막 파일명만 추출한다.
  - 예: C:\project\src\app.ts -> app.ts

  중요:
  - 이 값은 웹뷰 상단의 파일명 표시용으로 사용된다.
*/
function getCurrentFileName(editor) {
    return editor.document.fileName.split(/[\\/]/).pop() ?? '';
}
//# sourceMappingURL=editorUtils.js.map