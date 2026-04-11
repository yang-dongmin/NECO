import * as vscode from 'vscode';
import * as fs from 'fs';
import {
  generateCommentPreview,
  generateAiCommentPreview,
  insertGeneratedComment
} from './services/webviewCommentService';

/*
  - VS Code 사이드바 웹뷰를 생성하고 관리한다
  - 웹뷰(App.tsx)에서 보낸 메시지를 받아 실제 기능을 실행한다
  - 다시 웹뷰로 데이터를 보내 화면을 갱신한다

  App.tsx
    -> vscode.postMessage(...)
    -> NecoViewProvider.handleMessage(...)
    -> services/webviewCommentService.ts
    -> 결과를 sendMessage(...)로 다시 App.tsx에 전달
*/

export class NecoViewProvider implements vscode.WebviewViewProvider {

  private view?: vscode.WebviewView;

  constructor(private readonly extensionUri: vscode.Uri) {}

  resolveWebviewView(webviewView: vscode.WebviewView) {
    const { webview } = webviewView;
    this.view = webviewView;

    webview.options = {
      enableScripts: true,
      localResourceRoots: [
        vscode.Uri.joinPath(this.extensionUri, 'webview/dist')
      ]
    };

    webview.html = this.getHtml(webview);

    const messageListener = webview.onDidReceiveMessage(async (message) => {
      await this.handleMessage(message);
    });

    webviewView.onDidDispose(() => messageListener.dispose());
  }

  public sendMessage(type: string, text: string) {
    this.view?.webview.postMessage({ type, text });
  }

  private async handleMessage(message: any) {
    if (message.type === 'copyToClipboard') {
      await vscode.env.clipboard.writeText(message.text);
      vscode.window.showInformationMessage('클립보드에 복사됐어요!');
      return;
    }

    if (message.type === 'generateCommentPreview') {
      const result = generateCommentPreview();

      if (!result.success) {
        vscode.window.showErrorMessage(result.message ?? '주석 생성에 실패했어요.');
        this.sendMessage('setCommentPreview', '');
        return;
      }

      this.sendMessage('setCommentPreview', result.comment ?? '');
      return;
    }

    if (message.type === 'generateAiCommentPreview') {
      const result = await generateAiCommentPreview();

      if (!result.success) {
        vscode.window.showErrorMessage(result.message ?? 'AI 주석 생성에 실패했어요.');
        this.sendMessage('setCommentPreview', '');
        return;
      }

      this.sendMessage('setCommentPreview', result.comment ?? '');
      return;
    }

    if (message.type === 'insertComment') {
      const result = await insertGeneratedComment(message.text ?? '');

      if (!result.success) {
        vscode.window.showErrorMessage(result.message);
        return;
      }

      vscode.window.showInformationMessage(result.message);
    }
  }

  private getHtml(webview: vscode.Webview): string {
    const distUri = vscode.Uri.joinPath(this.extensionUri, 'webview/dist/assets');
    const distPath = distUri.fsPath;

    if (!fs.existsSync(distPath)) {
      return this.getErrorHtml('webview/dist 폴더가 없습니다. <code>npm run build</code>를 실행해주세요.');
    }

    const files = fs.readdirSync(distPath);
    const jsFile = files.find(f => f.endsWith('.js'));
    const cssFile = files.find(f => f.endsWith('.css'));

    if (!jsFile || !cssFile) {
      return this.getErrorHtml('빌드 파일(js/css)을 찾을 수 없습니다.');
    }

    const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(distUri, jsFile));
    const styleUri = webview.asWebviewUri(vscode.Uri.joinPath(distUri, cssFile));
    const nonce = crypto.randomUUID().replace(/-/g, '');

    return `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource} 'unsafe-inline'; script-src 'nonce-${nonce}' ${webview.cspSource}; font-src ${webview.cspSource} https://fonts.gstatic.com; connect-src https://generativelanguage.googleapis.com https://api.anthropic.com;">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link rel="stylesheet" href="${styleUri}">
</head>
<body>
  <div id="root"></div>
  <script type="module" nonce="${nonce}" src="${scriptUri}"></script>
</body>
</html>`;
  }

  private getErrorHtml(message: string): string {
    return `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body style="font-family: sans-serif; padding: 20px; color: #f87171;">
  <h3>⚠️ NECO 로드 실패</h3>
  <p>${message}</p>
</body>
</html>`;
  }
}