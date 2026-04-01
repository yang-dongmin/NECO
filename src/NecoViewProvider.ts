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
	}

	public sendMessage(type: string, text: string) {
		if (!this.view) return;

		this.view.webview.postMessage({
			type,
			text
		});
	}

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