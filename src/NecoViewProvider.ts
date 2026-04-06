/*
  이 파일은 NECO 사이드바 웹뷰를 생성하고 관리하는 클래스이다.

  역할:
  1) VS Code 사이드바에 웹뷰를 띄운다.
  2) extension.ts에서 보낸 선택 코드를 웹뷰에 전달한다.
  3) 웹뷰 버튼 클릭 메시지를 받아 extension.ts의 기능을 실행한다.
*/

import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

/*
  웹뷰에서 실행을 요청할 수 있는 기능 목록
*/
type NecoHandlers = {
	onAddComment: () => void | Promise<void>;
};

export class NecoViewProvider implements vscode.WebviewViewProvider {
	private view?: vscode.WebviewView;

	/*
	  [추가된 부분]
	  웹뷰가 열릴 때 실행할 콜백을 저장하는 변수

	  이 값을 나중에 extension.ts에서 따로 연결할 수 있다.
	  constructor에서 바로 받지 않기 때문에
	  provider 자기 자신을 참조하는 문제를 피할 수 있다.
	*/
	private onViewReady?: () => void;

	/*
	  생성자

	  extensionUri: 웹뷰 리소스 경로 처리용
	  handlers: 웹뷰 버튼 클릭 시 실행할 기능
	*/
	constructor(
		private readonly extensionUri: vscode.Uri,
		private readonly handlers: NecoHandlers
	) {}

	/*
	  [추가된 부분]
	  웹뷰가 열릴 때 실행할 콜백을 나중에 등록하는 함수
	*/
	public setOnViewReady(callback: () => void) {
		this.onViewReady = callback;
	}

	/*
	  웹뷰가 실제로 열릴 때 호출되는 함수
	*/
	resolveWebviewView(webviewView: vscode.WebviewView) {
		const webview = webviewView.webview;

		this.view = webviewView;

		webview.options = {
			enableScripts: true,
			localResourceRoots: [
				vscode.Uri.joinPath(this.extensionUri, 'webview/dist')
			]
		};

		webview.html = this.getHtml(webview);

		/*
		  웹뷰 -> extension 메시지 수신

		  App.tsx에서
		  vscode.postMessage({ command: 'addComment' })
		  를 보내면 여기서 받아서 주석 생성 함수 실행
		*/
		webview.onDidReceiveMessage(async (message) => {
			switch (message.command) {
				case 'addComment':
					await this.handlers.onAddComment();
					break;
			}
		});

		/*
		  [추가된 부분]
		  웹뷰가 열리는 순간 현재 선택 코드를 다시 보내기 위한 콜백 실행
		*/
		this.onViewReady?.();
	}

	/*
	  extension -> webview 메시지 전송
	*/
	public sendMessage(type: string, text: string) {
		if (!this.view) return;

		this.view.webview.postMessage({
			type,
			text
		});
	}

	/*
	  React 빌드 결과물을 웹뷰 HTML로 연결
	*/
	private getHtml(webview: vscode.Webview): string {
		const distPath = path.join(this.extensionUri.fsPath, 'webview/dist/assets');
		const files = fs.readdirSync(distPath);

		const jsFile = files.find(f => f.endsWith('.js'));
		const cssFile = files.find(f => f.endsWith('.css'));

		const scriptUri = webview.asWebviewUri(
			vscode.Uri.joinPath(this.extensionUri, 'webview/dist/assets', jsFile!)
		);

		const styleUri = webview.asWebviewUri(
			vscode.Uri.joinPath(this.extensionUri, 'webview/dist/assets', cssFile!)
		);

		return `
		<!DOCTYPE html>
		<html>
		<head>
			<meta charset="UTF-8">
			<link rel="stylesheet" href="${styleUri}">
		</head>
		<body>
			<div id="root"></div>
			<script type="module" src="${scriptUri}"></script>
		</body>
		</html>
		`;
	}
}