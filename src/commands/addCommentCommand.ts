import * as vscode from 'vscode';
import { getActiveEditor, getSelectedText } from '../utils/editorUtils';
import { generateComment } from '../services/commentGenerator';

/*
  - 현재 에디터에서 사용자가 선택한 코드를 읽는다.
  - 선택한 코드에 맞는 주석 문자열을 만든다.
  - 선택 시작 줄의 위쪽에 주석을 삽입한다.

  editorUtils -> 현재 에디터 / 선택 텍스트 가져오기
  commentGenerator -> 주석 문자열 생성
  vscode editor.edit -> 실제 코드에 삽입
*/

export async function addCommentFromSelection(): Promise<void> {
	// 현재 활성화된 에디터를 가져온다.
	const editor = getActiveEditor();

	// 열린 파일이 없으면 더 진행하지 않는다.
	if (!editor) {
		vscode.window.showErrorMessage('열린 파일이 없습니다!');
		return;
	}

	// 사용자가 드래그한 선택 영역의 텍스트를 가져온다.
	const selectedText = getSelectedText(editor);

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
	const comment = generateComment(selectedText, languageId);

	// 계산한 위치에 주석을 실제로 삽입한다.
	await editor.edit(editBuilder => {
		editBuilder.insert(position, comment);
	});
}