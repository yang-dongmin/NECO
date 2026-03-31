import * as vscode from 'vscode';

export class NecoViewProvider implements vscode.WebviewViewProvider {

	constructor(private readonly extensionUri: vscode.Uri) {}

	resolveWebviewView(webviewView: vscode.WebviewView) {

		webviewView.webview.options = {
			enableScripts: true
		};

		webviewView.webview.html = this.getHtml();
	}

	private getHtml(): string {
		return `
		<!DOCTYPE html>
		<html>
		<body>
			<h3>😺 NECO 사이드바</h3>
			<button onclick="sendMsg()">클릭</button>

			<script>
				const vscode = acquireVsCodeApi();

				function sendMsg() {
					vscode.postMessage({
						command: 'hello'
					});
				}
			</script>
		</body>
		</html>
		`;
	}
}