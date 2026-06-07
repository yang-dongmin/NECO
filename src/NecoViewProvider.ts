import * as vscode from 'vscode';
import * as fs from 'fs';
import {
  generateAiCommentPreview,
  insertGeneratedComment
} from './services/webviewCommentService';
import {
  saveNote,
  loadNotes,
  deleteNote,
  NecoNote
} from './services/noteStorageService';
import { broadcastNewNote } from './services/localServerService';
import { generateQuiz } from './services/quizGeneratorService';

export class NecoViewProvider implements vscode.WebviewViewProvider {

  private view?: vscode.WebviewView;

  constructor(
    private readonly extensionUri: vscode.Uri,
    private readonly context: vscode.ExtensionContext
  ) {}

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

    webview.onDidReceiveMessage(
      async (message) => {
        switch (message.type) {
          case 'LOGIN':
            vscode.env.openExternal(
              vscode.Uri.parse(
                'http://localhost:5173/login'
              )
            );
            break;
        }
      }
    );

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

    if (message.type === 'showMessage') {
      vscode.window.showInformationMessage(message.text);
      return;
    }

    if (message.type === 'generateAiCommentPreview') {
      const parsedCode = message.parsedCode ?? null;
      const result = await generateAiCommentPreview(parsedCode);

      console.log('[NECO] 받은 parsedCode:', JSON.stringify(parsedCode));

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
      return;
    }

    if (message.type === 'deleteNote') {
      try {
        const { code } = message.payload;

        const notes = loadNotes();

        const target = notes.find(
          n => n.code === code
        );

        if (target) {
          deleteNote(target.id);
        }

        const token = await this.context.secrets.get('necoToken');

        if (token && target) {
          const response = await fetch(
            `http://localhost:5001/api/notes/${target.id}`,
            {
              method: 'DELETE',
              headers: {
                Authorization: `Bearer ${token}`
              }
            }
          );

          if (!response.ok) {
            const errorText = await response.text();

            console.error(
              '[NECO] DB 삭제 응답 실패:',
              response.status,
              errorText
            );

            vscode.window.showWarningMessage(
              '로컬 삭제는 완료됐지만 DB 삭제는 실패했어요.'
            );
          }
        }

        vscode.window.showInformationMessage('삭제 완료 ✅');

      } catch (error) {
        console.error('[NECO] 삭제 실패:', error);

        vscode.window.showErrorMessage('삭제 실패');
      }

      return;
    }

    if (message.type === 'saveNote') {
      const {
        code,
        comment,
        parsedCode,
        isPublic,
        languageId,
        fileName
      } = message.payload;

      const id = crypto.randomUUID();

      const note: NecoNote = {
        id,
        code,
        comment,
        parsedCode: parsedCode ?? null,
        isPublic,
        languageId,
        fileName,
        createdAt: new Date().toISOString(),
      };

      if (isPublic) {
        vscode.window.showInformationMessage('빈칸 문제를 생성하고 있어요 🤖');

        const quizResult = await generateQuiz(
          code,
          comment,
          languageId
        );

        if (quizResult.success) {
          note.quiz = {
            blankedCode: quizResult.blankedCode!,
            answer: quizResult.answer!,
            hint: quizResult.hint!,
          };
        }
      }

      saveNote(note);

      try {
        const token = await this.context.secrets.get('necoToken');

        if (!token) {
          vscode.window.showWarningMessage(
            '로그인 토큰이 없어 DB에는 저장하지 못했어요. 먼저 로그인해주세요.'
          );
        } else {
          const response = await fetch(
            'http://localhost:5001/api/code-notes',
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({
                code,
                comment,
                parsedCode: parsedCode ?? null,
                isPublic,
                languageId,
                fileName,
                quiz: note.quiz ?? null,
              }),
            }
          );

          if (!response.ok) {
            const errorText = await response.text();

            console.error(
              '[NECO] DB 저장 응답 실패:',
              response.status,
              errorText
            );

            vscode.window.showWarningMessage(
              '로컬 저장은 완료됐지만 DB 저장은 실패했어요.'
            );
          }
        }
      } catch (error) {
        console.error('[NECO] DB 저장 실패:', error);

        vscode.window.showWarningMessage(
          '로컬 저장은 완료됐지만 DB 저장은 실패했어요.'
        );
      }

      broadcastNewNote(note);

      vscode.window.showInformationMessage(
        isPublic
          ? '저장됐어요! 빈칸 문제도 생성됐어요 ✅'
          : '비공개로 저장됐어요 ✅'
      );

      return;
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
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource} 'unsafe-inline'; script-src 'nonce-${nonce}' ${webview.cspSource}; font-src ${webview.cspSource} https://fonts.gstatic.com; connect-src https://generativelanguage.googleapis.com https://api.anthropic.com http://localhost:5001;">
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