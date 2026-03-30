import * as vscode from 'vscode';
import fs from 'fs';
import path from 'path';

let panel: vscode.WebviewPanel | undefined;

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

	const files = fs.readdirSync(distPath);

	const jsFile = files.find(f => f.endsWith('.js'));
	const cssFile = files.find(f => f.endsWith('.css'));

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

function openWebview(context: vscode.ExtensionContext) {

	panel = vscode.window.createWebviewPanel(
		'necoView',
		'NECO Code Helper',
		vscode.ViewColumn.One,
		{ enableScripts: true }
	);

	const editor = vscode.window.activeTextEditor;
	if (!editor) return;

	const selectedText = editor.document.getText(editor.selection);

	panel.webview.html = getWebviewContent(panel.webview, context);

	panel.webview.postMessage({
		type: 'setCode',
		text: selectedText
	});
}

function handleSelectionChange() {

	vscode.window.onDidChangeTextEditorSelection(() => {

		if (!panel) return;

		const editor = vscode.window.activeTextEditor;
		if (!editor) return;

		const text = editor.document.getText(editor.selection);

		panel.webview.postMessage({
			type: 'setCode',
			text: text
		});
	});
}

export function activate(context: vscode.ExtensionContext) {

	console.log('NECO extension activated!');

	const commentCmd = vscode.commands.registerCommand(
		'neco.addComment',
		addCommentFromSelection
	);

	const openWebviewCmd = vscode.commands.registerCommand(
		'neco.openWebview',
		() => openWebview(context)
	);

	handleSelectionChange();

	context.subscriptions.push(commentCmd);
	context.subscriptions.push(openWebviewCmd);

}

export function deactivate() { }


