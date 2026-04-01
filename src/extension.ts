import * as vscode from 'vscode';
import fs from 'fs';
import path from 'path';
import { NecoViewProvider } from './NecoViewProvider';

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


function getWebviewContent(webview: vscode.Webview, context: vscode.ExtensionContext) {

	const distPath = path.join(context.extensionUri.fsPath, 'webview/dist/assets');

	// dist 폴더 파일 목록 읽기
	const files = fs.readdirSync(distPath);

	// 빌드 된 Js, Css 찾기
	const jsFile = files.find(f => f.endsWith('.js'));
	const cssFile = files.find(f => f.endsWith('.css'));

	// VScode에서 접근 가능하게 변환
	const scriptUri = webview.asWebviewUri(
		vscode.Uri.joinPath(context.extensionUri, 'webview/dist/assets', jsFile!)
	);

	const styleUri = webview.asWebviewUri(
		vscode.Uri.joinPath(context.extensionUri, 'webview/dist/assets', cssFile!)
	);

	return `
	<!DOCTYPE html>
	<html>
	<head>
		<link rel="stylesheet" href="${styleUri}">
	</head>
	<body>
		<div id="root"></div>
		<script type="module" src="${scriptUri}"></script>
	</body>
	</html>
	`;
}

function handleSelectionChange(provider: NecoViewProvider) {

	vscode.window.onDidChangeTextEditorSelection(() => {


		const editor = vscode.window.activeTextEditor;
		if (!editor) return;
 
		// 현재 선택된 코드 가져오기
		const text = editor.document.getText(editor.selection);

		// React로 데이터 보내기
		provider.sendMessage('setCode', text);

	});
}

export function activate(context: vscode.ExtensionContext) {

	console.log('NECO extension activated!');

	const commentCmd = vscode.commands.registerCommand(
		'neco.addComment', // 명령어 이름
		addCommentFromSelection // 명령어 실행 시 호출
	);

	// 사이드바 생성 객체
	const provider = new NecoViewProvider(context.extensionUri);

	context.subscriptions.push(
		vscode.window.registerWebviewViewProvider(
			'necoSidebarView', // package.json이랑 반드시 동일
			provider
		)
	);

	// 이벤트 연결
	handleSelectionChange(provider);

	context.subscriptions.push(commentCmd);

}

export function deactivate() { }


