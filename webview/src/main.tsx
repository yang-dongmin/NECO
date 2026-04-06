/*
  역할:
  1) index.html 안의 root 요소를 찾는다.
  2) App.tsx를 불러와 화면에 렌더링한다.

  - App을 './App.tsx'로 명시적으로 불러온다.
  - 예전 App.js가 남아 있더라도 잘못 참조되는 가능성을 줄인다.

  주의:
  - webview/src/App.js
  - webview/src/App.js.map
  이 두 파일이 남아 있다면 삭제하는 것이 좋다.
*/

import React from 'react';
import ReactDOM from 'react-dom/client';

// App.tsx를 명시적으로 불러옴
// -> 어떤 App 파일을 사용할지 혼동되지 않게 하기 위한 수정
import App from './App';

import './index.css';

// root 요소를 기준으로 React 앱 시작
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);