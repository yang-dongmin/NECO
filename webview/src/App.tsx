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

interface ParsedParam {
  name: string;
  type?: string;
}

interface ParsedCode {
  functionName?: string;
  params: ParsedParam[];
  returnType?: string;
  calledFunctions: string[];
  languageId: string;
  raw: string;
}

type SavedComment = {
  comment: string;
  code: string;
  parsedCode: ParsedCode | null;
};

type State = {
  payload: CodePayload;
  copied: boolean;
  generatedComment: string;
  savedComments: SavedComment[];
  selectedIndex: number | null;
  parsedCode: ParsedCode | null;
  analysisOpen: boolean;
};



type Action =
  | { type: 'SET_CODE'; payload: CodePayload }
  | { type: 'SET_COPIED'; value: boolean }
  | { type: 'SET_COMMENT_PREVIEW'; value: string }
  | { type: 'SAVE_COMMENT'; value: SavedComment }
  | { type: 'SET_SELECTED_INDEX'; value: number | null }
  | { type: 'DELETE_COMMENT'; index: number }
  | { type: 'SET_PARSED_CODE'; value: ParsedCode | null }
  | { type: 'TOGGLE_ANALYSIS' };

const initialState: State = {
  payload: { code: '', languageId: '', fileName: '' },
  copied: false,
  generatedComment: '',
  savedComments: [],
  selectedIndex: null,
  parsedCode: null,
  analysisOpen: false,
};



function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'SET_CODE':
      return {
        payload: action.payload,
        copied: false,
        generatedComment: '',
        savedComments: state.savedComments,
        selectedIndex: null,
        parsedCode: null,
        analysisOpen: false,
      };

    case 'SET_COPIED':
      return { ...state, copied: action.value };

    case 'SET_COMMENT_PREVIEW':
      return { ...state, generatedComment: action.value };

    case 'SAVE_COMMENT':
      return {
        ...state,
        savedComments: [action.value, ...state.savedComments],
      };

    case 'SET_SELECTED_INDEX':
      return { ...state, selectedIndex: action.value };

    case 'DELETE_COMMENT':
      return {
        ...state,
        savedComments: state.savedComments.filter((_, i) => i !== action.index),
        selectedIndex: null,
      };
    case 'SET_PARSED_CODE':
      return { ...state, parsedCode: action.value };

    case 'TOGGLE_ANALYSIS':
      return { ...state, analysisOpen: !state.analysisOpen };

      

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
  const [{ payload, copied, generatedComment, savedComments, selectedIndex, parsedCode, analysisOpen }, dispatch] = useReducer(reducer, initialState);

  useEffect(() => {
    const handler = (event: MessageEvent) => {
      const message = event.data;

      if (message.type === 'setCode') {
        dispatch({ type: 'SET_CODE', payload: JSON.parse(message.text) });
      }

      if (message.type === 'setCommentPreview') {
        dispatch({ type: 'SET_COMMENT_PREVIEW', value: message.text ?? '' });
      }
      if (message.type === 'setParsedCode') {
        dispatch({ type: 'SET_PARSED_CODE', value: JSON.parse(message.text) });
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

  const handleSave = useCallback(() => {
  if (!generatedComment) return;

  const isDuplicate = savedComments.some(
    (item) => item.code === payload.code
  );

  if (isDuplicate) {
    vscode.postMessage({ 
      type: 'showMessage', 
      text: '이미 저장된 코드입니다!' 
    });
    return;
  }

    dispatch({
      type: 'SAVE_COMMENT',
      value: { comment: generatedComment, code: payload.code, parsedCode }
    });
}, [generatedComment, savedComments, payload.code]);

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

            {parsedCode && (
              <div className="neco-parsed-section">
                <button
                  className="neco-parsed-toggle"
                  onClick={() => dispatch({ type: 'TOGGLE_ANALYSIS' })}
                >
                  <span className="neco-section-title">코드 분석</span>
                  <span className="neco-toggle-icon">{analysisOpen ? '▲' : '▼'}</span>
                </button>

                {analysisOpen && (
                  <div className="neco-parsed-body">
                    {parsedCode.functionName && (
                      <div className="neco-parsed-row">
                        <span className="neco-parsed-label">함수명</span>
                        <span className="neco-parsed-value">{parsedCode.functionName}</span>
                      </div>
                    )}
                    {parsedCode.params.length > 0 && (
                      <div className="neco-parsed-row">
                        <span className="neco-parsed-label">매개변수</span>
                        <div className="neco-parsed-params">
                          {parsedCode.params.map((p, i) => (
                            <span key={i} className="neco-param-badge">
                              {p.name}{p.type ? `: ${p.type}` : ''}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    {parsedCode.returnType && (
                      <div className="neco-parsed-row">
                        <span className="neco-parsed-label">반환 타입</span>
                        <span className="neco-parsed-value">{parsedCode.returnType}</span>
                      </div>
                    )}
                    {parsedCode.calledFunctions.length > 0 && (
                      <div className="neco-parsed-row">
                        <span className="neco-parsed-label">호출 함수</span>
                        <div className="neco-parsed-params">
                          {parsedCode.calledFunctions.map((f, i) => (
                            <span key={i} className="neco-param-badge neco-call-badge">
                              {f}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

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
                <>
                  <pre className="neco-preview-block"><code>{generatedComment}</code></pre>
                  <button
                    className="neco-save-btn"
                    onClick={handleSave}
                  >
                    저장
                  </button>
                </>
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
      {savedComments.length > 0 && (
        <div className="neco-saved-section">
          <span className="neco-saved-title">
            저장된 주석 <span className="neco-saved-count">{savedComments.length}</span>
          </span>
          <ul className="neco-saved-list">
            {savedComments.map((item, i) => (
              <li
                key={i}
                className="neco-saved-item"
                onClick={() => dispatch({
                  type: 'SET_SELECTED_INDEX',
                  value: selectedIndex === i ? null : i
                })}
              >
                <div className="neco-saved-item-header">
                  <code className="neco-saved-comment">{item.comment}</code>
                  <button
                    className="neco-delete-btn"
                    onClick={(e) => {
                      e.stopPropagation(); // 토글 클릭 방지
                      dispatch({ type: 'DELETE_COMMENT', index: i });
                    }}
                  >
                    ✕
                  </button>
                </div>
                {selectedIndex === i && (
                  <pre className="neco-saved-code-block">
                    <code>{item.code}</code>
                  </pre>
                )}
                {selectedIndex === i && item.parsedCode && (
                  <div className="neco-parsed-section" style={{ marginTop: '8px' }}>
                    <span className="neco-section-title">코드 분석</span>
                    <div className="neco-parsed-body">
                      {item.parsedCode.functionName && (
                        <div className="neco-parsed-row">
                          <span className="neco-parsed-label">함수명</span>
                          <span className="neco-parsed-value">{item.parsedCode.functionName}</span>
                        </div>
                      )}
                      {item.parsedCode.params.length > 0 && (
                        <div className="neco-parsed-row">
                          <span className="neco-parsed-label">매개변수</span>
                          <div className="neco-parsed-params">
                            {item.parsedCode.params.map((p, j) => (
                              <span key={j} className="neco-param-badge">
                                {p.name}{p.type ? `: ${p.type}` : ''}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      {item.parsedCode.calledFunctions.length > 0 && (
                        <div className="neco-parsed-row">
                          <span className="neco-parsed-label">호출 함수</span>
                          <div className="neco-parsed-params">
                            {item.parsedCode.calledFunctions.map((f, j) => (
                              <span key={j} className="neco-param-badge neco-call-badge">
                                {f}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
      <footer className="neco-footer">
        NECO · 친절한 AI 코딩 친구
      </footer>
    </div>
  );
}

export default App;