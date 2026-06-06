# NECO Extension 🚀

VSCode에서 코드 선택 영역에 맞춤형 주석을 자동으로 생성해주는 확장 프로그램입니다.
Webview(React + Vite)를 활용하여 UI를 제공합니다.

---

## 📌 실행 방법(2026.05.17)

## 1. 프로젝트 클론

```bash
git clone https://github.com/yang-dongmin/NECO.git
cd NECO
```

---

## 2. 환경 변수 파일 생성

아래 위치에 `.env` 파일을 생성합니다.

```txt
NECO/.env
NECO/backend/.env
```

### backend/.env 예시

```env
DB_HOST=127.0.0.1
DB_USER=root
DB_PASSWORD=본인_MySQL_비밀번호
DB_NAME=neco
JWT_SECRET=neco_secret_key
PORT=5000
```

> `DB_PASSWORD`에는 본인 MySQL root 비밀번호를 입력합니다.

---

## 3. 의존성 설치

각 폴더에서 `npm install`을 실행합니다.

### 루트

```bash
npm install
```

### backend

```bash
cd backend
npm install
cd ..
```

### webview

```bash
cd webview
npm install
cd ..
```

### web

```bash
cd web
npm install
cd ..
```

---

## 4. webview 빌드

```bash
cd webview
npm run build
cd ..
```

---

## 5. TypeScript 빌드

프로젝트 루트에서 실행합니다.

```bash
npx tsc
```

---

## 6. MySQL 설치 및 DB 생성

MySQL을 설치한 뒤 MySQL Workbench에서 `backend/database/schema.sql` 파일 내용을 실행합니다.

### schema.sql

```sql
CREATE DATABASE IF NOT EXISTS neco
DEFAULT CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

USE neco;

CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    nickname VARCHAR(100) NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

실행 후 아래 SQL로 확인할 수 있습니다.

```sql
USE neco;
SHOW TABLES;
DESC users;
```

---

## 7. 실행

터미널을 2개 열어서 각각 실행합니다.

### 터미널 1: 웹페이지 실행

```bash
cd web
npm run dev
```

### 터미널 2: 백엔드 실행

```bash
cd backend
node server.js
```

---

## 8. 회원가입 확인

웹페이지에서 회원가입을 진행한 뒤 MySQL Workbench에서 아래 SQL을 실행합니다.

```sql
USE neco;

SELECT id, email, nickname, created_at
FROM users;
```

회원 정보가 조회되면 MySQL 연동이 정상적으로 된 것입니다.

---

## 📌 2026.04.19 - 변경 사항



### 1️⃣ 프로그램 내 코드들이 출력되는 부분들을 보완 및 수정.

---

## 📦 프로젝트 구조

```
NECO-upgraded/
├── src/                # VSCode Extension (TypeScript)
├── webview/            # Webview UI (React + Vite)
├── package.json        # Extension 설정
```
## ⚙️ 실행 방법 (개발 환경)

### 1️⃣ 저장소 클론

```bash
git clone https://github.com/yang-dongmin/NECO
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
