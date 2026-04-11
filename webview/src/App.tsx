import { useEffect, useCallback, useMemo, useReducer } from 'react';
import './App.css';

declare function acquireVsCodeApi(): {
  postMessage: (msg: unknown) => void;
};

const vscode = acquireVsCodeApi();

interface CodePayload {
  code: string;
  languageId: string;
  fileName: string;
}

type State = {
  payload: CodePayload;
  copied: boolean;
  generatedComment: string;
};

type Action =
  | { type: 'SET_CODE'; payload: CodePayload }
  | { type: 'SET_COPIED'; value: boolean }
  | { type: 'SET_COMMENT_PREVIEW'; value: string };

const initialState: State = {
  payload: { code: '', languageId: '', fileName: '' },
  copied: false,
  generatedComment: '',
};

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'SET_CODE':
      return {
        payload: action.payload,
        copied: false,
        generatedComment: '',
      };

    case 'SET_COPIED':
      return { ...state, copied: action.value };

    case 'SET_COMMENT_PREVIEW':
      return { ...state, generatedComment: action.value };

    default:
      return state;
  }
}

const LANG_LABELS: Record<string, string> = {
  javascript: 'JavaScript',
  typescript: 'TypeScript',
  typescriptreact: 'TSX',
  javascriptreact: 'JSX',
  python: 'Python',
  cpp: 'C++',
  c: 'C',
  java: 'Java',
  rust: 'Rust',
  go: 'Go',
  kotlin: 'Kotlin',
  swift: 'Swift',
  csharp: 'C#',
  php: 'PHP',
  ruby: 'Ruby',
  shellscript: 'Shell',
  yaml: 'YAML',
};

function App() {
  const [{ payload, copied, generatedComment }, dispatch] = useReducer(reducer, initialState);

  useEffect(() => {
    const handler = (event: MessageEvent) => {
      const message = event.data;

      if (message.type === 'setCode') {
        dispatch({ type: 'SET_CODE', payload: JSON.parse(message.text) });
      }

      if (message.type === 'setCommentPreview') {
        dispatch({ type: 'SET_COMMENT_PREVIEW', value: message.text ?? '' });
      }
    };

    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, []);

  const handleCopy = useCallback(() => {
    if (!payload.code || copied) return;

    vscode.postMessage({ type: 'copyToClipboard', text: payload.code });
    dispatch({ type: 'SET_COPIED', value: true });
    setTimeout(() => dispatch({ type: 'SET_COPIED', value: false }), 2000);
  }, [payload.code, copied]);

  const handleGenerateAiComment = useCallback(() => {
    if (!payload.code) return;
    vscode.postMessage({ type: 'generateAiCommentPreview' });
  }, [payload.code]);

  const handleInsertComment = useCallback(() => {
    if (!generatedComment) return;
    vscode.postMessage({ type: 'insertComment', text: generatedComment });
  }, [generatedComment]);

  const { lineCount, charCount, langLabel } = useMemo(() => ({
    lineCount: payload.code ? payload.code.split('\n').length : 0,
    charCount: payload.code.length,
    langLabel: LANG_LABELS[payload.languageId] ?? payload.languageId ?? '',
  }), [payload.code, payload.languageId]);

  return (
    <div className="neco-root">
      <header className="neco-header">
        <div className="neco-logo">
          <span className="neco-logo-icon">🐱</span>
          <span className="neco-logo-text">NECO</span>
        </div>
        <span className="neco-tagline">코드 도우미</span>
      </header>

      {payload.fileName && (
        <div className="neco-filebar">
          <span className="neco-filename">📄 {payload.fileName}</span>
          {langLabel && <span className="neco-lang-badge">{langLabel}</span>}
        </div>
      )}

      <div className="neco-code-section">
        {payload.code ? (
          <>
            <div className="neco-code-header">
              <span className="neco-code-meta">{lineCount}줄 · {charCount}자</span>
              <button
                className={`neco-copy-btn ${copied ? 'copied' : ''}`}
                onClick={handleCopy}
                title="클립보드에 복사"
              >
                {copied ? '✓ 복사됨' : '복사'}
              </button>
            </div>

            <pre className="neco-code-block"><code>{payload.code}</code></pre>

            <div className="neco-action-section">
              <button
                className="neco-ai-btn"
                onClick={handleGenerateAiComment}
              >
                AI 주석 생성
              </button>

              <button
                className="neco-insert-btn"
                onClick={handleInsertComment}
                disabled={!generatedComment}
              >
                에디터에 삽입
              </button>
            </div>

            <div className="neco-preview-section">
              <div className="neco-preview-header">
                <span className="neco-preview-title">주석 미리보기</span>
              </div>

              {generatedComment ? (
                <pre className="neco-preview-block"><code>{generatedComment}</code></pre>
              ) : (
                <div className="neco-preview-empty">
                  AI 주석 생성 버튼을 누르면 여기에 결과가 표시돼요
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="neco-empty">
            <span className="neco-empty-icon">↑</span>
            <p>에디터에서 코드를 드래그해서 선택하면<br />여기에 표시돼요</p>
          </div>
        )}
      </div>

      <footer className="neco-footer">
        NECO · 친절한 AI 코딩 친구
      </footer>
    </div>
  );
}

export default App;