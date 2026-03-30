import * as vscode from 'vscode';

async function addCommentFromSelection() {
	// 현재 열려있는 파일 가져오는 변수
	const editor = vscode.window.activeTextEditor;

	if (!editor) {
		vscode.window.showErrorMessage('열린 파일이 없습니다!');
		return;
	}

	// 드래그한 영역 정보
	const selection = editor.selection;

	// 선택한 텍스트 실제 내용
	const selectedText = editor.document.getText(selection);

	if (!selectedText) {
		vscode.window.showErrorMessage('코드를 선택해주세요!');
		return;
	}

	console.log('선택한 코드:', selectedText);

	// 언어 구분 변수
	const languageId = editor.document.languageId;

	console.log('언어 : ', languageId);

	// 언어별 주석 스타일
	const commentMap: { [key: string]: string } = {
		python: '# [py] : ',
		javascript: '// [js] : ',
		cpp: '// [c++] : ',
		c: '// [c] : '
	};

	const commentPrefix = commentMap[languageId] ?? '//';

	// 선택 영역 시작 줄 번호
	const startLine = selection.start.line;

	const position = new vscode.Position(startLine, 0);

	const comment = `${commentPrefix} 이 코드는 선택된 코드입니다\n`;

	// 실제 주석 삽입
	await editor.edit(editBuilder => {
		editBuilder.insert(position, comment);
	});
}

export function activate(context: vscode.ExtensionContext) {

	console.log('Congratulations, your extension "neco" is now active!');

	const disposable = vscode.commands.registerCommand('neco.addComment', async () => {
		
		await addCommentFromSelection();
		vscode.window.showInformationMessage('주석 삽입 완료!');
	});

	context.subscriptions.push(disposable);
}

export function deactivate() { }
