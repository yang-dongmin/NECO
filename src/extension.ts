import * as vscode from 'vscode';
import { NecoViewProvider } from './NecoViewProvider';

// 지원 언어 & 주석 스타일 (대폭 확장)
const COMMENT_MAP: { [key: string]: string } = {
	python:          '# [py] : ',
	javascript:      '// [js] : ',
	typescript:      '// [ts] : ',
	typescriptreact: '// [tsx] : ',
	javascriptreact: '// [jsx] : ',
	cpp:             '// [c++] : ',
	c:               '// [c] : ',
	java:            '// [java] : ',
	rust:            '// [rs] : ',
	go:              '// [go] : ',
	kotlin:          '// [kt] : ',
	swift:           '// [swift] : ',
	csharp:          '// [c#] : ',
	php:             '// [php] : ',
	ruby:            '# [rb] : ',
	shellscript:     '# [sh] : ',
	yaml:            '# [yaml] : ',
};

async function addCommentFromSelection() {
	const editor = vscode.window.activeTextEditor;

	if (!editor) {
		vscode.window.showErrorMessage('열린 파일이 없습니다!');
		return;
	}

	const selection = editor.selection;
	const selectedText = editor.document.getText(selection);

	if (!selectedText) {
		vscode.window.showErrorMessage('코드를 선택해주세요!');
		return;
	}

	const languageId = editor.document.languageId;
	const commentPrefix = COMMENT_MAP[languageId] ?? '// ';
	const startLine = selection.start.line;
	const position = new vscode.Position(startLine, 0);

	// 선택한 코드의 첫 줄을 요약해서 주석에 활용
	const firstLine = selectedText.split('\n')[0].trim().slice(0, 60);
	const comment = `${commentPrefix}${firstLine}${firstLine.length >= 60 ? '...' : ''}\n`;

	await editor.edit(editBuilder => {
		editBuilder.insert(position, comment);
	});
}

function handleSelectionChange(provider: NecoViewProvider): vscode.Disposable {
	return vscode.window.onDidChangeTextEditorSelection(() => {
		const editor = vscode.window.activeTextEditor;
		if (!editor) return;

		const selection = editor.selection;
		const text = editor.document.getText(selection);
		const languageId = editor.document.languageId;
		const fileName = editor.document.fileName.split(/[\\/]/).pop() ?? '';

		// 선택한 코드 + 언어 + 파일명 함께 전송
		provider.sendMessage('setCode', JSON.stringify({ code: text, languageId, fileName }));
	});
}

export function activate(context: vscode.ExtensionContext) {
	console.log('NECO extension activated!');

	const provider = new NecoViewProvider(context.extensionUri);

	const commentCmd = vscode.commands.registerCommand(
		'neco.addComment',
		addCommentFromSelection
	);

	const webviewProvider = vscode.window.registerWebviewViewProvider(
		'necoSidebarView',
		provider
	);

	// 메모리 누수 수정: 이벤트 리스너도 subscriptions에 등록
	const selectionListener = handleSelectionChange(provider);

	context.subscriptions.push(commentCmd, webviewProvider, selectionListener);
}

export function deactivate() {}
