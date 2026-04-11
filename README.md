# NECO Extension 🚀
# 확장 실행 방법

VSCode에서 코드 선택 영역에 맞춤형 주석을 자동으로 생성해주는 확장 프로그램입니다.
Webview(React + Vite)를 활용하여 UI를 제공합니다.
## 1. git clone https://github.com/yang-dongmin/NECO.git

---
## 2. npm install (의존성 설치)

## 📦 프로젝트 구조
## 3. npm run compile (빌드)

```
NECO-upgraded/
├── src/                # VSCode Extension (TypeScript)
├── webview/            # Webview UI (React + Vite)
├── package.json        # Extension 설정
```
## 4. src/extension.ts에서 F5 -> VSCode 확장 개발 or VScode extension development

---
## 5. 원하는 함수, 영역 드래그

## 📌 변경 사항
## 6. Ctrl + Shift + P or Cmd + Shift + P

### 1️⃣ 각 파일 병합 완료. 정상 실행 확인.
## 7. Neco 검색 후 실행

---
## 8. 주석 생성

### 2️⃣ 기존 extension.ts에 몰려있던 코드 및 기능들을 여러 파일로 나누어 최적화.
# 리액트

---
## 1. cd webview

### 3️⃣ 코드 별로 주석을 추가하여 코드 별 사용 목적 설명 및 가독성 향상.
## 2. npm install

---
## 3. npm run build

### 4️⃣ 기존에 launch.json에서 받아오던 AI API Key를 .env에서 받아오도록 변경.

---

## ⚙️ 실행 방법 (개발 환경)

### 1️⃣ 저장소 클론

```bash
git clone https://github.com/your-repo/NECO.git
cd NECO-upgraded
```

---

### 2️⃣ Extension 의존성 설치

```bash
npm install
```

---

### 3️⃣ Webview(React) 의존성 설치

```bash
cd webview
npm install
```

---

### 4️⃣ Webview 빌드

```bash
npm run build
```

👉 반드시 build 해야 Extension에서 UI가 정상적으로 표시됨

---

### 5️⃣ VSCode에서 실행

루트 폴더(`NECO-upgraded`)로 이동 후:

```bash
code .
```

그리고 VSCode에서:

```
F5 (디버그 실행)
```

👉 새로운 Extension Development Host 창이 실행됨

---

## 🧪 사용 방법

1. 코드 영역 드래그 (선택)
2. `Ctrl + Shift + P`
3. 명령어 실행 (예: `NECO 실행`)
4. 선택된 코드에 맞춤형 주석 생성

---

## 🛠️ 개발 모드 (Webview 수정 시)

Webview 코드 수정 후:

```bash
cd webview
npm run build
```

👉 다시 F5로 Extension 재실행 필요

---

## 📌 주의사항

* `node_modules`는 Git에 올리지 않도록 `.gitignore` 설정 필수
* Webview는 반드시 build된 파일을 사용함 (dev 서버 X)
* Extension 코드 수정 시 VSCode 재실행 필요

---

## 🧑‍💻 기술 스택

* VSCode Extension API
* TypeScript
* React
* Vite

---

## 📄 라이선스

MIT License
