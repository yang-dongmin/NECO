// 사용자가 에디터에서 선택한 코드가 바뀔 때마다
// 웹뷰(NECO 사이드바)로 최신 선택 정보를 전달한다.

import * as vscode from 'vscode';
import { NecoViewProvider } from '../NecoViewProvider';
import { getActiveEditor, getCurrentFileName } from '../utils/editorUtils';

/*
  1 사용자가 에디터에서 다른 영역을 선택한다.
  2 onDidChangeTextEditorSelection 이벤트가 발생한다.
  3 현재 선택한 코드, 언어, 파일명을 읽는다.
  4 provider.sendMessage('setCode', ...)로 웹뷰에 전달한다.

  - 웹뷰 App.tsx는 'setCode' 메시지를 받아 화면을 갱신한다.
  - debounce를 사용해서 선택이 빠르게 바뀔 때 과도한 전송을 줄인다.
*/
export function handleSelectionChange(provider: NecoViewProvider): vscode.Disposable {
	// 연속 선택 이벤트가 너무 자주 발생하는 것을 막기 위한 타이머
	let debounceTimer: ReturnType<typeof setTimeout> | undefined;

	return vscode.window.onDidChangeTextEditorSelection(() => {
		// 이전 대기 중이던 타이머가 있으면 취소
		clearTimeout(debounceTimer);

		// 0.2초 뒤에 마지막 선택 상태만 반영
		debounceTimer = setTimeout(() => {
			// 현재 활성 에디터를 가져온다.
			const editor = getActiveEditor();
			if (!editor) return;

			const { selection, document } = editor;

			// 사용자가 현재 선택한 코드
			const text = document.getText(selection);

			// 현재 파일의 언어 id
			// 예: javascript, python, java
			const languageId = document.languageId;

			// 현재 파일명만 추출
			const fileName = getCurrentFileName(editor);

			/*
			  웹뷰로 보내는 데이터:
			  - code: 선택한 코드
			  - languageId: 현재 언어 종류
			  - fileName: 현재 파일명

			  중요 경로:
			  selectionSyncService.ts
			    -> NecoViewProvider.sendMessage()
			    -> webview App.tsx의 window message handler
			*/
			provider.sendMessage(
				'setCode',
				JSON.stringify({ code: text, languageId, fileName })
			);
		}, 200);
	});
}