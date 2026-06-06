// 에디터에서 자주 사용하는 기능을 공통 함수로 모아둔 유틸 파일이다.
// 여러 파일에서 같은 코드를 반복하지 않기 위해 따로 분리했다.

import * as vscode from 'vscode';

/*
  현재 활성화된 에디터를 반환한다.
  - 열린 파일이 없으면 undefined가 반환된다.
  - 주석 생성, 삽입, 선택 감지 등에서 공통으로 사용된다.
*/
export function getActiveEditor(): vscode.TextEditor | undefined {
	return vscode.window.activeTextEditor;
}

/*
  현재 에디터에서 사용자가 선택한 텍스트를 반환한다.
  - 드래그한 코드 영역을 그대로 문자열로 가져온다.
*/
export function getSelectedText(editor: vscode.TextEditor): string {
	return editor.document.getText(editor.selection);
}

/*
  현재 파일의 "이름만" 반환한다.
  - 전체 경로가 아니라 마지막 파일명만 추출한다.
  - 예: C:\project\src\app.ts -> app.ts

  중요:
  - 이 값은 웹뷰 상단의 파일명 표시용으로 사용된다.
*/
export function getCurrentFileName(editor: vscode.TextEditor): string {
	return editor.document.fileName.split(/[\\/]/).pop() ?? '';
}