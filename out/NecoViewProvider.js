"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.NecoViewProvider = void 0;
const vscode = __importStar(require("vscode"));
const fs = __importStar(require("fs"));
const webviewCommentService_1 = require("./services/webviewCommentService");
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
class NecoViewProvider {
    extensionUri;
    view;
    constructor(extensionUri) {
        this.extensionUri = extensionUri;
    }
    resolveWebviewView(webviewView) {
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
    sendMessage(type, text) {
        this.view?.webview.postMessage({ type, text });
    }
    async handleMessage(message) {
        if (message.type === 'copyToClipboard') {
            await vscode.env.clipboard.writeText(message.text);
            vscode.window.showInformationMessage('클립보드에 복사됐어요!');
            return;
        }
        if (message.type === 'showMessage') {
            vscode.window.showInformationMessage(message.text);
            return;
        }
        if (message.type === 'generateCommentPreview') {
            const result = (0, webviewCommentService_1.generateCommentPreview)();
            if (!result.success) {
                vscode.window.showErrorMessage(result.message ?? '주석 생성에 실패했어요.');
                this.sendMessage('setCommentPreview', '');
                return;
            }
            this.sendMessage('setCommentPreview', result.comment ?? '');
            return;
        }
        if (message.type === 'generateAiCommentPreview') {
            const result = await (0, webviewCommentService_1.generateAiCommentPreview)();
            if (!result.success) {
                vscode.window.showErrorMessage(result.message ?? 'AI 주석 생성에 실패했어요.');
                this.sendMessage('setCommentPreview', '');
                return;
            }
            this.sendMessage('setCommentPreview', result.comment ?? '');
            return;
        }
        if (message.type === 'insertComment') {
            const result = await (0, webviewCommentService_1.insertGeneratedComment)(message.text ?? '');
            if (!result.success) {
                vscode.window.showErrorMessage(result.message);
                return;
            }
            vscode.window.showInformationMessage(result.message);
        }
    }
    getHtml(webview) {
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
    getErrorHtml(message) {
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
exports.NecoViewProvider = NecoViewProvider;
//# sourceMappingURL=NecoViewProvider.js.map