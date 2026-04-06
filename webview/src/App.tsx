import { useEffect, useState, useCallback } from 'react';
import './App.css';

declare function acquireVsCodeApi(): {
  postMessage: (msg: unknown) => void;
};

// VSCode API는 한 번만 초기화
const vscode = acquireVsCodeApi();

interface CodePayload {
  code: string;
  languageId: string;
  fileName: string;
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
  const [payload, setPayload] = useState<CodePayload>({ code: '', languageId: '', fileName: '' });
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const handler = (event: MessageEvent) => {
      const message = event.data;
      if (message.type === 'setCode') {
        try {
          const parsed: CodePayload = JSON.parse(message.text);
          setPayload(parsed);
          setCopied(false);
        } catch {
          // 구버전 호환: 그냥 string인 경우
          setPayload({ code: message.text, languageId: '', fileName: '' });
        }
      }
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, []);

  const handleCopy = useCallback(() => {
    if (!payload.code) return;
    vscode.postMessage({ type: 'copyToClipboard', text: payload.code });
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [payload.code]);

  const lineCount = payload.code ? payload.code.split('\n').length : 0;
  const charCount = payload.code.length;
  const langLabel = LANG_LABELS[payload.languageId] ?? payload.languageId ?? '';

  return (
    <div className="neco-root">
      {/* 헤더 */}
      <header className="neco-header">
        <div className="neco-logo">
          <span className="neco-logo-icon">🐱</span>
          <span className="neco-logo-text">NECO</span>
        </div>
        <span className="neco-tagline">코드 도우미</span>
      </header>

      {/* 파일 정보 바 */}
      {payload.fileName && (
        <div className="neco-filebar">
          <span className="neco-filename">📄 {payload.fileName}</span>
          {langLabel && <span className="neco-lang-badge">{langLabel}</span>}
        </div>
      )}

      {/* 코드 표시 영역 */}
      <div className="neco-code-section">
        {payload.code ? (
          <>
            <div className="neco-code-header">
              <span className="neco-code-meta">
                {lineCount}줄 · {charCount}자
              </span>
              <button
                className={`neco-copy-btn ${copied ? 'copied' : ''}`}
                onClick={handleCopy}
                title="클립보드에 복사"
              >
                {copied ? '✓ 복사됨' : '복사'}
              </button>
            </div>
            <pre className="neco-code-block"><code>{payload.code}</code></pre>
          </>
        ) : (
          <div className="neco-empty">
            <span className="neco-empty-icon">↑</span>
            <p>에디터에서 코드를 드래그해서 선택하면<br />여기에 표시돼요</p>
          </div>
        )}
      </div>

      {/* 푸터 */}
      <footer className="neco-footer">
        NECO · 친절한 AI 코딩 친구
      </footer>
    </div>
  );
}

export default App;
