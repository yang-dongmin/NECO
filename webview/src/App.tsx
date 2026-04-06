/*
  현재 구현된 기능:
  1) extension.ts가 보내준 "선택된 코드"를 화면에 보여준다.
  2) 사용자가 버튼을 누르면 extension.ts 쪽에 AI 요청 메시지를 보낸다.
  3) extension.ts가 보내준 AI 결과를 화면에 출력한다.
  4) 로딩 중일 때는 "생성 중..." 상태를 표시한다.

  - 코드 표시용 UI
  - 버튼 클릭용 UI
  - AI 결과 출력용 UI
  를 담당한다.
*/

import { useEffect, useState } from 'react';

/*
  VS Code 웹뷰 환경에서만 사용할 수 있는 API 함수 선언

  일반 브라우저에는 없고,
  VS Code 웹뷰 내부에서 extension.ts와 통신할 때 사용한다.
*/
declare const acquireVsCodeApi: any;

/*
  VS Code API 객체 획득

  이 객체의 postMessage()를 통해
  extension.ts 쪽으로 메시지를 보낼 수 있다.
*/
const vscode = acquireVsCodeApi();

function App() {
  /*
    현재 extension.ts에서 전달받은 "선택된 코드"를 저장하는 상태
  */
  const [code, setCode] = useState('');

  /*
    AI가 생성한 설명/주석 결과를 저장하는 상태
  */
  const [aiComment, setAiComment] = useState('');

  /*
    현재 AI 요청이 진행 중인지 여부를 저장하는 상태
    true이면 버튼을 비활성화하고 "생성 중..."으로 표시한다.
  */
  const [loading, setLoading] = useState(false);

  /*
    웹뷰가 extension.ts로부터 메시지를 받을 수 있도록
    이벤트 리스너를 등록하는 부분
  */
  useEffect(() => {
    /*
      extension.ts가 postMessage로 보낸 데이터를 받는 핸들러
    */
    const handler = (event: MessageEvent) => {
      const message = event.data;

      /*
        선택된 코드를 전달받은 경우
        화면의 code 상태를 갱신한다.
      */
      if (message.command === 'setCode') {
        setCode(message.code);
      }

      /*
        AI 작업 시작 메시지를 받은 경우
        로딩 상태를 true로 바꾸고
        사용자에게 진행 중 안내 문구를 보여준다.
      */
      if (message.command === 'aiLoading') {
        setLoading(true);
        setAiComment('AI가 주석을 생성하는 중입니다...');
      }

      /*
        AI 결과를 받은 경우
        로딩 상태를 종료하고
        결과 문자열을 화면에 표시한다.
      */
      if (message.command === 'setAiComment') {
        setLoading(false);
        setAiComment(message.comment);
      }
    };

    /*
      window에 message 이벤트 리스너 등록
    */
    window.addEventListener('message', handler);

    /*
      컴포넌트가 사라질 때 이벤트 리스너 제거

      메모리 누수 방지를 위해 정리 작업을 해준다.
    */
    return () => window.removeEventListener('message', handler);
  }, []);

  /*
    "AI 주석 생성" 버튼 클릭 시 실행되는 함수

    extension.ts에 requestAiComment 메시지를 보내
    실제 API 호출을 요청한다.
  */
  const handleGenerateComment = () => {
    vscode.postMessage({
      command: 'requestAiComment'
    });
  };

  return (
    <div style={{ padding: '16px', fontFamily: 'sans-serif' }}>
      {/* 화면 제목 */}
      <h2>선택된 코드</h2>

      {/* extension.ts에서 전달받은 선택 코드 표시 영역 */}
      <pre
        style={{
          background: '#f4f4f4',
          padding: '12px',
          whiteSpace: 'pre-wrap',
          borderRadius: '8px'
        }}
      >
        {code || '선택된 코드가 없습니다.'}
      </pre>

      {/* AI 주석 생성 버튼 */}
      <button
        onClick={handleGenerateComment}
        disabled={loading}
        style={{
          marginTop: '12px',
          padding: '10px 16px',
          cursor: loading ? 'not-allowed' : 'pointer'
        }}
      >
        {loading ? '생성 중...' : 'AI 주석 생성'}
      </button>

      {/* AI 결과 제목 */}
      <h2 style={{ marginTop: '20px' }}>AI 결과</h2>

      {/* AI가 생성한 설명/주석 결과 표시 영역 */}
      <pre
        style={{
          background: '#eef6ff',
          padding: '12px',
          whiteSpace: 'pre-wrap',
          borderRadius: '8px'
        }}
      >
        {aiComment || '아직 생성된 결과가 없습니다.'}
      </pre>
    </div>
  );
}

export default App;