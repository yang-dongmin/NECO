/*
  현재 구현된 기능:
  1) 사용자가 에디터에서 코드를 드래그해서 선택하면,
  선택된 코드를 자동으로 감지한다.
  2) 감지한 코드를 사이드바 웹뷰에 바로 보여준다.
  3) 사용자가 사이드바에서 "AI 주석 생성" 버튼을 누르면
  Gemini API가 주석 설명을 만든다.
  4) 생성된 주석을 선택한 코드 바로 위에 실제로 삽입한다.
*/

import * as vscode from 'vscode';

/*
  Gemini API 응답 구조 중 실제로 사용할 부분만 타입으로 정의한다.
*/
interface GeminiResponse {
  candidates?: {
    content?: {
      parts?: {
        text?: string;
      }[];
    };
  }[];
}

/*
  선택된 코드와 웹뷰를 관리하는 사이드바 Provider 클래스
*/
class NecoSidebarProvider implements vscode.WebviewViewProvider {
  /*
    실제 사이드바 웹뷰 객체
  */
  private view?: vscode.WebviewView;

  /*
    현재 사용자가 선택한 코드 문자열
  */
  private selectedCode = '';

  /*
    선택된 코드가 들어 있는 문서 URI
  */
  private selectedDocumentUri?: vscode.Uri;

  /*
    선택 범위
  */
  private selectedSelection?: vscode.Selection;

  /*
    웹뷰가 처음 열릴 때 실행되는 함수
  */
  public resolveWebviewView(webviewView: vscode.WebviewView): void {
    this.view = webviewView;

    /*
      웹뷰 내부 JavaScript 사용 허용
    */
    webviewView.webview.options = {
      enableScripts: true
    };

    /*
      웹뷰 HTML 주입
    */
    webviewView.webview.html = this.getHtml();

    /*
      웹뷰 -> extension 메시지 처리
    */
    webviewView.webview.onDidReceiveMessage(async (message) => {
      /*
        웹뷰 로딩 완료 후 현재 선택 코드 반영
      */
      if (message.command === 'ready') {
        this.refreshWebview();
      }

      /*
        사용자가 AI 주석 생성 버튼을 눌렀을 때 처리
      */
      if (message.command === 'requestAiComment') {
        try {
          /*
            선택된 코드가 없으면 안내 메시지 표시
          */
          if (!this.selectedCode || this.selectedCode.trim() === '') {
            webviewView.webview.postMessage({
              command: 'setResult',
              result: '먼저 에디터에서 주석을 달 코드를 드래그해서 선택하세요.'
            });
            return;
          }

          /*
            문서 정보가 없으면 실제 삽입을 할 수 없음
          */
          if (!this.selectedDocumentUri || !this.selectedSelection) {
            webviewView.webview.postMessage({
              command: 'setResult',
              result: '선택 정보가 없습니다. 다시 코드를 선택해주세요.'
            });
            return;
          }

          /*
            로딩 상태 표시
          */
          webviewView.webview.postMessage({
            command: 'loading'
          });

          /*
            AI 주석 생성
          */
          const aiComment = await generateCommentWithGemini(this.selectedCode);

          /*
            실제 코드 위에 주석 삽입
          */
          await this.insertCommentAboveSelection(
            this.selectedDocumentUri,
            this.selectedSelection,
            aiComment
          );

          /*
            결과 표시
          */
          webviewView.webview.postMessage({
            command: 'setResult',
            result: `주석이 추가되었습니다.\n\n[생성된 주석]\n${aiComment}`
          });
        } catch (error: any) {
          webviewView.webview.postMessage({
            command: 'setResult',
            result: `오류 발생: ${error.message}`
          });
        }
      }
    });
  }

  /*
    현재 에디터 선택 내용을 provider에 저장하는 함수

    사용자가 드래그할 때마다 자동 호출된다.
  */
  public updateSelection(
    code: string,
    documentUri?: vscode.Uri,
    selection?: vscode.Selection
  ) {
    this.selectedCode = code;
    this.selectedDocumentUri = documentUri;
    this.selectedSelection = selection;

    this.refreshWebview();
  }

  /*
    웹뷰 화면을 현재 선택 상태에 맞게 갱신
  */
  private refreshWebview() {
    if (!this.view) {
      return;
    }

    this.view.webview.postMessage({
      command: 'setCode',
      code: this.selectedCode
    });

    if (this.selectedCode && this.selectedCode.trim() !== '') {
      this.view.webview.postMessage({
        command: 'setResult',
        result: '선택된 코드가 감지되었습니다. "AI 주석 생성" 버튼을 누르세요.'
      });
    } else {
      this.view.webview.postMessage({
        command: 'setResult',
        result: '에디터에서 주석을 달 코드를 드래그해서 선택하세요.'
      });
    }
  }

  /*
    선택된 코드 위에 실제 주석을 삽입하는 함수
  */
  private async insertCommentAboveSelection(
    documentUri: vscode.Uri,
    selection: vscode.Selection,
    aiComment: string
  ): Promise<void> {
    const editor = vscode.window.activeTextEditor;

    /*
      현재 활성 에디터가 없거나 다른 문서면 삽입 불가
    */
    if (!editor || editor.document.uri.toString() !== documentUri.toString()) {
      throw new Error('선택했던 문서를 현재 편집 중이 아닙니다. 다시 선택 후 시도해주세요.');
    }

    const languageId = editor.document.languageId;

    /*
      AI 응답을 언어별 주석 형식으로 변환
    */
    const formattedComment = formatCommentByLanguage(aiComment, languageId);

    /*
      선택 시작 줄의 들여쓰기 가져오기
      주석도 같은 들여쓰기로 맞춘다.
    */
    const lineText = editor.document.lineAt(selection.start.line).text;
    const indent = lineText.match(/^\s*/)?.[0] ?? '';

    const indentedComment = formattedComment
      .split('\n')
      .map((line) => indent + line)
      .join('\n');

    /*
      선택 시작 줄의 맨 앞에 주석 삽입
    */
    const insertPosition = new vscode.Position(selection.start.line, 0);

    const success = await editor.edit((editBuilder) => {
      editBuilder.insert(insertPosition, indentedComment + '\n');
    });

    if (!success) {
      throw new Error('주석 삽입에 실패했습니다.');
    }
  }

  /*
    사이드바 웹뷰 HTML 생성
  */
  private getHtml(): string {
    return `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>NECO</title>
  <style>
    body {
      font-family: sans-serif;
      padding: 12px;
      color: var(--vscode-foreground);
      background: var(--vscode-sideBar-background);
    }

    h3 {
      margin-top: 0;
      margin-bottom: 10px;
      font-size: 14px;
    }

    pre {
      white-space: pre-wrap;
      word-break: break-word;
      padding: 10px;
      border-radius: 6px;
      background: var(--vscode-editor-background);
      color: var(--vscode-editor-foreground);
      border: 1px solid var(--vscode-panel-border);
      min-height: 80px;
      line-height: 1.5;
    }

    button {
      width: 100%;
      margin-top: 10px;
      padding: 10px 12px;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      background: var(--vscode-button-background);
      color: var(--vscode-button-foreground);
      font-weight: bold;
    }

    button:hover {
      background: var(--vscode-button-hoverBackground);
    }
  </style>
</head>
<body>
  <h3>선택된 코드</h3>
  <pre id="code">선택된 코드가 없습니다.</pre>

  <button id="generateBtn">AI 주석 생성</button>

  <h3 style="margin-top: 16px;">결과</h3>
  <pre id="result">에디터에서 주석을 달 코드를 드래그해서 선택하세요.</pre>

  <script>
    const vscode = acquireVsCodeApi();
    const codeEl = document.getElementById('code');
    const resultEl = document.getElementById('result');
    const generateBtn = document.getElementById('generateBtn');

    window.addEventListener('message', (event) => {
      const message = event.data;

      if (message.command === 'setCode') {
        codeEl.textContent = message.code || '선택된 코드가 없습니다.';
      }

      if (message.command === 'loading') {
        resultEl.textContent = 'AI가 주석을 생성하고 있습니다...';
      }

      if (message.command === 'setResult') {
        resultEl.textContent = message.result || '처리 결과가 없습니다.';
      }
    });

    generateBtn.addEventListener('click', () => {
      vscode.postMessage({
        command: 'requestAiComment'
      });
    });

    vscode.postMessage({
      command: 'ready'
    });
  </script>
</body>
</html>`;
  }
}

/*
  확장 프로그램 활성화 함수
*/
export function activate(context: vscode.ExtensionContext) {
  const provider = new NecoSidebarProvider();

  /*
    package.json의 webview view id와 연결
  */
  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider('necoSidebarView', provider)
  );

  /*
    사용자가 텍스트 선택을 바꿀 때마다 자동 감지
    이제 명령 팔레트 실행 없이도 선택 내용이 NECO에 반영된다.
  */
  context.subscriptions.push(
    vscode.window.onDidChangeTextEditorSelection((event) => {
      const editor = event.textEditor;
      const selection = event.selections[0];

      /*
        선택이 비어 있으면 상태 초기화
      */
      if (!selection || selection.isEmpty) {
        provider.updateSelection('', undefined, undefined);
        return;
      }

      /*
        선택된 문자열 추출
      */
      const selectedCode = editor.document.getText(selection);

      provider.updateSelection(
        selectedCode,
        editor.document.uri,
        selection
      );
    })
  );

  /*
    에디터가 바뀔 때도 현재 선택 상태 반영
  */
  context.subscriptions.push(
    vscode.window.onDidChangeActiveTextEditor((editor) => {
      if (!editor) {
        provider.updateSelection('', undefined, undefined);
        return;
      }

      const selection = editor.selection;

      if (!selection || selection.isEmpty) {
        provider.updateSelection('', undefined, undefined);
        return;
      }

      const selectedCode = editor.document.getText(selection);

      provider.updateSelection(
        selectedCode,
        editor.document.uri,
        selection
      );
    })
  );
}

/*
  Gemini API 호출 함수
*/
async function generateCommentWithGemini(code: string): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error('GEMINI_API_KEY 환경변수가 설정되어 있지 않습니다.');
  }

  const prompt = `
아래 코드를 읽고, 이 코드 바로 위에 넣을 수 있는 주석 설명을 한국어로 작성해줘.

조건:
1. 너무 길지 않게 작성
2. 핵심 역할과 동작을 중심으로 설명
3. 실제 코드 주석으로 바로 넣을 수 있어야 함
4. 번호 목록 없이 자연스러운 설명으로 작성
5. 코드블록(\`\`\`) 없이 순수 텍스트만 출력

코드:
${code}
`;

  const response = await fetch(
    'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: prompt
              }
            ]
          }
        ]
      })
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gemini API 호출 실패: ${response.status} ${errorText}`);
  }

  const data = (await response.json()) as GeminiResponse;

  const text =
    data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ||
    '이 코드는 선택된 기능을 수행하기 위한 로직입니다.';

  return text;
}

/*
  언어별 주석 형식 변환 함수
*/
function formatCommentByLanguage(text: string, languageId: string): string {
  const lines = text
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  const slashLanguages = [
    'c',
    'cpp',
    'java',
    'javascript',
    'typescript',
    'javascriptreact',
    'typescriptreact',
    'csharp',
    'go',
    'rust',
    'php',
    'swift',
    'kotlin'
  ];

  const hashLanguages = [
    'python',
    'shellscript',
    'ruby',
    'perl',
    'yaml'
  ];

  const sqlLanguages = [
    'sql'
  ];

  if (slashLanguages.includes(languageId)) {
    return lines.map((line) => `// ${line}`).join('\n');
  }

  if (hashLanguages.includes(languageId)) {
    return lines.map((line) => `# ${line}`).join('\n');
  }

  if (sqlLanguages.includes(languageId)) {
    return lines.map((line) => `-- ${line}`).join('\n');
  }

  if (lines.length === 1) {
    return `/* ${lines[0]} */`;
  }

  return [
    '/*',
    ...lines.map((line) => ` * ${line}`),
    ' */'
  ].join('\n');
}

/*
  확장 비활성화 함수
*/
export function deactivate() {}