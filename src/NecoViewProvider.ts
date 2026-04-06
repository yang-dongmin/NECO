import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

export class NecoViewProvider implements vscode.WebviewViewProvider {

	private view?: vscode.WebviewView;

	constructor(private readonly extensionUri: vscode.Uri) {}

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

		// 웹뷰 → 익스텐션 메시지 수신 (양방향 통신)
		webview.onDidReceiveMessage(async (message) => {
			switch (message.type) {
				case 'copyToClipboard':
					await vscode.env.clipboard.writeText(message.text);
					vscode.window.showInformationMessage('클립보드에 복사됐어요!');
					break;
				case 'showInfo':
					vscode.window.showInformationMessage(message.text);
					break;
			}
		});
	}

	public sendMessage(type: string, text: string) {
		if (!this.view) return;
		this.view.webview.postMessage({ type, text });
	}

	private getHtml(webview: vscode.Webview): string {
		const distPath = path.join(this.extensionUri.fsPath, 'webview/dist/assets');

		// null 안전 처리: 빌드 파일 없으면 명확한 에러 표시
		if (!fs.existsSync(distPath)) {
			return this.getErrorHtml('webview/dist 폴더가 없습니다. <code>npm run build</code>를 실행해주세요.');
		}

		const files = fs.readdirSync(distPath);
		const jsFile = files.find(f => f.endsWith('.js'));
		const cssFile = files.find(f => f.endsWith('.css'));

		if (!jsFile || !cssFile) {
			return this.getErrorHtml('빌드 파일(js/css)을 찾을 수 없습니다.');
		}

		const scriptUri = webview.asWebviewUri(
			vscode.Uri.joinPath(this.extensionUri, 'webview/dist/assets', jsFile)
		);
		const styleUri = webview.asWebviewUri(
			vscode.Uri.joinPath(this.extensionUri, 'webview/dist/assets', cssFile)
		);

		// CSP 헤더 추가 (보안 강화)
		const nonce = getNonce();

		return `
		<!DOCTYPE html>
		<html lang="ko">
		<head>
			<meta charset="UTF-8">
			<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource} 'unsafe-inline'; script-src 'nonce-${nonce}' ${webview.cspSource}; font-src ${webview.cspSource} https://fonts.gstatic.com; connect-src https://api.anthropic.com;">
			<meta name="viewport" content="width=device-width, initial-scale=1.0">
			<link rel="stylesheet" href="${styleUri}">
		</head>
		<body>
			<div id="root"></div>
			<script type="module" nonce="${nonce}" src="${scriptUri}"></script>
		</body>
		</html>
		`;
	}

	private getErrorHtml(message: string): string {
		return `
		<!DOCTYPE html>
		<html>
		<head><meta charset="UTF-8"></head>
		<body style="font-family: sans-serif; padding: 20px; color: #f87171;">
			<h3>⚠️ NECO 로드 실패</h3>
			<p>${message}</p>
		</body>
		</html>
		`;
	}
}

function getNonce(): string {
	let text = '';
	const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
	for (let i = 0; i < 32; i++) {
		text += possible.charAt(Math.floor(Math.random() * possible.length));
	}
	return text;
}
