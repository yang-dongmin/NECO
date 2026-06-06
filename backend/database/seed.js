/**
 * seed.js — 정보처리기사 SQL 17문제 시드 데이터
 *
 * 실행: node backend/database/seed.js
 *      (backend 디렉토리 안에서 실행할 경우: node database/seed.js)
 *
 * ※ 이미 같은 이메일의 유저가 있으면 건너뜀 (중복 실행 안전)
 */

const db     = require('./db');
const bcrypt = require('bcrypt');

// ── 시드 유저 ─────────────────────────────────────────────────────────────────
const SEED_USER = {
    email:    'test@neco.dev',
    password: 'test1234',
    nickname: '테스트유저',
};

// ── SQL 17문제 데이터 ─────────────────────────────────────────────────────────
// wrong_code  : 문제 지문 (빈칸·질의 결과를 구해야 하는 SQL)
// fixed_code  : 정답
// explanation : 해설
// tags        : 관련 키워드 태그
const SQL_NOTES = [
    {
        title: 'Q01',
        wrong_code: `-- [문제] 다음 SQL문의 실행 결과를 쓰시오. (ON DELETE CASCADE 적용)
-- 부서(부서코드 PK, 부서명) / 직원(직원코드 PK, 부서코드 FK→부서, 직원명)
-- INSERT 후 아래 두 질의를 실행하면?

-- ①
SELECT DISTINCT COUNT(부서코드) FROM 직원 WHERE 부서코드 = 20;

-- ②
DELETE FROM 부서 WHERE 부서코드 = 20;
SELECT DISTINCT COUNT(부서코드) FROM 직원;`,
        fixed_code: `-- ① 답: 3
-- ② 답: 4

-- ① WHERE 부서코드=20 → 3개 튜플 → COUNT=3, DISTINCT는 COUNT 결과에 적용 → 3
-- ② DELETE CASCADE로 부서코드=20인 직원 3명 함께 삭제
--    남은 직원: 4명(부서코드 10×2, 30×2) → COUNT=4, DISTINCT해도 중복 없으므로 4`,
        explanation: `DISTINCT는 COUNT() 자체에 적용됩니다 (필드값이 아님에 주의).
ON DELETE CASCADE는 부모 테이블(부서) 튜플 삭제 시 자식 테이블(직원)의 관련 튜플을 자동 삭제합니다.
① 부서코드=20인 직원: 3명 → COUNT(부서코드)=3 → DISTINCT 적용해도 3
② 부서코드=20 삭제 → 직원 3명 CASCADE 삭제 → 남은 직원 4명(10×2, 30×2) → COUNT=4`,
        tags: ['DISTINCT', 'COUNT', 'DELETE', 'CASCADE', 'FOREIGN KEY'],
    },
    {
        title: 'Q02',
        wrong_code: `-- [문제] STUDENT 테이블 (전기과 50명, 전산과 100명, 전자과 50명)
-- 각 SQL문의 실행 결과 튜플 수는?

-- ①
SELECT DEPT FROM STUDENT;

-- ②
SELECT DISTINCT DEPT FROM STUDENT;

-- ③
SELECT COUNT(DISTINCT DEPT) FROM STUDENT WHERE DEPT = '전산과';`,
        fixed_code: `-- ① 답: 200
-- ② 답: 3
-- ③ 답: 1`,
        explanation: `① 조건 없이 DEPT 전체 조회 → 총 200개 튜플 반환
② DISTINCT로 중복 제거 → 전기과·전산과·전자과 3개만 반환
③ WHERE DEPT='전산과' 필터 후 COUNT(DISTINCT DEPT) → '전산과' 1종류이므로 1`,
        tags: ['DISTINCT', 'COUNT', 'SELECT'],
    },
    {
        title: 'Q03',
        wrong_code: `-- [문제] 괄호 안에 알맞은 답을 쓰시오.
-- "H" 제조사의 모든 단가보다 높은 단가를 가진 제품 조회

SELECT 제품명, 단가, 제조사
FROM 제품
WHERE 단가 > (    ) (SELECT 단가 FROM 제품 WHERE 제조사 = 'H');`,
        fixed_code: `-- 답: ALL

SELECT 제품명, 단가, 제조사
FROM 제품
WHERE 단가 > ALL (SELECT 단가 FROM 제품 WHERE 제조사 = 'H');`,
        explanation: `ALL: 서브쿼리가 반환하는 모든 값보다 크다는 조건.
ANY/SOME은 하나라도 만족하면 참, ALL은 전부 만족해야 참.
H 제조사 단가: 200, 150, 300 → ALL보다 크려면 300 초과여야 함 → 핸드폰(400), 컴퓨터(500)`,
        tags: ['ALL', 'ANY', '서브쿼리', 'WHERE'],
    },
    {
        title: 'Q04',
        wrong_code: `-- [문제] 다음 TABLE을 참조하여 SQL문의 실행 결과를 쓰시오.
-- (NULL은 값 없음을 의미)
-- INDEX | COL1 | COL2
--   1   |   2  | NULL
--   2   |   4  |   6
--   3   |   3  |   5
--   4   |   6  |   3
--   5   | NULL |   3

SELECT COUNT(COL2)
FROM TABLE
WHERE COL1 IN (2, 3)
   OR COL2 IN (3, 5);`,
        fixed_code: `-- 답: 3`,
        explanation: `조건 만족 행: INDEX 1(COL1=2), INDEX 3(COL1=3, COL2=5), INDEX 4(COL2=3), INDEX 5(COL2=3) → 4행 해당
해당 행의 COL2 값: NULL, 5, 3, 3
COUNT()는 NULL을 제외하고 계산 → 5, 3, 3 → 결과: 3`,
        tags: ['COUNT', 'NULL', 'IN', 'OR'],
    },
    {
        title: 'Q05',
        wrong_code: `-- [문제] EMPLOYEE 릴레이션에 대해 관계 대수식을 수행했을 때 결과의 ①~⑤ 빈칸을 채우시오.
-- 관계 대수식: πTTL(EMPLOYEE)
--
-- <EMPLOYEE>          <결과>
-- INDEX | AGE | TTL   (  ①  )
--   1   |  48 | 부장  (  ②  )
--   2   |  25 | 대리  (  ③  )
--   3   |  41 | 과장  (  ④  )
--   4   |  36 | 차장  (  ⑤  )`,
        fixed_code: `-- ① TTL
-- ② 부장
-- ③ 대리
-- ④ 과장
-- ⑤ 차장`,
        explanation: `π(파이)는 관계 대수의 PROJECT 연산으로, 지정한 속성(Attribute List)만 추출하여 새 릴레이션을 만듭니다.
πTTL(EMPLOYEE)는 EMPLOYEE에서 TTL 속성만 추출 → 속성명 TTL + 4개 값(부장·대리·과장·차장)`,
        tags: ['관계대수', 'PROJECT', 'π'],
    },
    {
        title: 'Q06',
        wrong_code: `-- [문제] 괄호 ①②에 들어갈 알맞은 답을 쓰시오.
-- "학부생 테이블에서 입학생수가 300 이상인 튜플의 학과번호를 999로 갱신"

(  ①  ) 학부생 (  ②  ) 학과번호 = 999 WHERE 입학생수 >= 300;`,
        fixed_code: `-- ① UPDATE
-- ② SET

UPDATE 학부생 SET 학과번호 = 999 WHERE 입학생수 >= 300;`,
        explanation: `DML 명령어:
- INSERT: 새 튜플 삽입
- UPDATE: 기존 튜플 갱신 (형식: UPDATE 테이블 SET 컬럼=값 WHERE 조건)
- DELETE: 튜플 삭제

UPDATE 문에서 SET은 변경할 컬럼과 값을 지정하고, WHERE로 대상 행을 필터링합니다.`,
        tags: ['UPDATE', 'SET', 'DML'],
    },
    {
        title: 'Q07',
        wrong_code: `-- [문제] EMP_TBL을 참고하여 SQL문의 실행 결과를 쓰시오.
-- EMPNO | SAL
--  100  | 1500
--  200  | 3000
--  300  | 2000

SELECT COUNT(*) FROM EMP_TBL
WHERE EMPNO > 100 AND SAL >= 3000 OR EMPNO = 200;`,
        fixed_code: `-- 답: 1`,
        explanation: `AND가 OR보다 우선순위가 높으므로 먼저 계산:
1. EMPNO > 100 AND SAL >= 3000 → EMPNO=200(SAL=3000) 만족
2. 위 결과 OR EMPNO = 200 → EMPNO=200 중복이므로 여전히 1개
COUNT(*) = 1`,
        tags: ['AND', 'OR', '연산자 우선순위', 'COUNT'],
    },
    {
        title: 'Q08',
        wrong_code: `-- [문제] <학생> 테이블에서 '이름'이 "민수"인 튜플을 삭제하는 SQL문을 작성하시오.
-- (처리 조건: 작은따옴표 사용, 세미콜론 생략 가능)

-- 여기에 SQL문을 작성하시오:`,
        fixed_code: `DELETE FROM 학생 WHERE 이름 = '민수';`,
        explanation: `DELETE 문 형식:
DELETE FROM 테이블명 WHERE 조건;

WHERE 없이 실행하면 테이블의 모든 튜플이 삭제되므로 주의.
문자열 값은 작은따옴표('')로 감쌉니다.`,
        tags: ['DELETE', 'DML', 'WHERE'],
    },
    {
        title: 'Q09',
        wrong_code: `-- [문제] <학생> 테이블에 20자 가변길이 '주소' 속성을 추가하는 SQL문을 완성하시오.
-- (ISO/IEC 9075 표준 기반)

(  ①  ) TABLE 학생 (  ②  ) 주소 VARCHAR(20);`,
        fixed_code: `-- ① ALTER
-- ② ADD

ALTER TABLE 학생 ADD 주소 VARCHAR(20);`,
        explanation: `DDL 명령어:
- CREATE: 테이블 생성
- ALTER: 테이블 구조 변경 (속성 추가/수정/삭제)
- DROP: 테이블 삭제

ALTER TABLE 형식:
- 속성 추가: ALTER TABLE 테이블명 ADD 속성명 데이터타입;
- 속성 삭제: ALTER TABLE 테이블명 DROP COLUMN 속성명;
- 속성 변경: ALTER TABLE 테이블명 MODIFY 속성명 새타입;`,
        tags: ['ALTER', 'ADD', 'DDL', 'VARCHAR'],
    },
    {
        title: 'Q10',
        wrong_code: `-- [문제] <학생> 테이블에서 3, 4학년의 학번, 이름을 조회하는 SQL문을 작성하시오.
-- (처리 조건: IN 예약어 사용 필수)
-- 학번 | 이름 | 학년 | 수강과목 | 점수 | 연락처

-- 여기에 SQL문을 작성하시오:`,
        fixed_code: `SELECT 학번, 이름 FROM 학생 WHERE 학년 IN (3, 4);`,
        explanation: `IN 연산자는 여러 값 중 하나와 일치하면 참을 반환합니다.
WHERE 학년 IN (3, 4) ≡ WHERE 학년 = 3 OR 학년 = 4
NOT IN으로 반대 조건도 표현 가능합니다.`,
        tags: ['IN', 'SELECT', 'WHERE'],
    },
    {
        title: 'Q11',
        wrong_code: `-- [문제] <student> 테이블의 'name' 속성으로 'idx_name' 인덱스를 생성하는 SQL문을 작성하시오.
-- stid | name  | score | deptid
-- 2001 | brown |  85   | PE01
-- 2002 | white |  45   | EF03
-- 2003 | black |  67   | UW11

-- 여기에 SQL문을 작성하시오:`,
        fixed_code: `CREATE INDEX idx_name ON student(name);`,
        explanation: `인덱스(INDEX): 검색 속도를 높이기 위한 데이터 구조.
형식: CREATE [UNIQUE] INDEX 인덱스명 ON 테이블명(속성명);
UNIQUE 키워드 추가 시 중복값을 허용하지 않는 인덱스 생성.
인덱스 삭제: DROP INDEX 인덱스명 ON 테이블명;`,
        tags: ['CREATE INDEX', 'DDL', 'INDEX'],
    },
    {
        title: 'Q12',
        wrong_code: `-- [문제] <성적> 테이블에서 이름(name)과 점수(score)를 점수 기준 내림차순으로 조회하는 SQL문을 완성하시오.
-- name | class | score

SELECT name, score
FROM 성적
(  ①  ) BY (  ②  ) (  ③  )`,
        fixed_code: `-- ① ORDER
-- ② score
-- ③ DESC

SELECT name, score
FROM 성적
ORDER BY score DESC;`,
        explanation: `ORDER BY 절로 결과를 정렬합니다.
- ASC: 오름차순 (기본값, 생략 가능)
- DESC: 내림차순

여러 컬럼 정렬: ORDER BY col1 ASC, col2 DESC;
ORDER BY는 SELECT문 가장 마지막에 위치합니다.`,
        tags: ['ORDER BY', 'DESC', 'ASC', 'SELECT'],
    },
    {
        title: 'Q13',
        wrong_code: `-- [문제] <회원> 테이블에서 이름이 "이"로 시작하는 회원을 가입일 내림차순으로 조회하는 SQL문의 빈칸을 채우시오.

SELECT * FROM 회원
WHERE 이름 LIKE '(  ①  )'
ORDER BY 가입일 (  ②  );`,
        fixed_code: `-- ① 이%
-- ② DESC

SELECT * FROM 회원
WHERE 이름 LIKE '이%'
ORDER BY 가입일 DESC;`,
        explanation: `LIKE 패턴 매칭:
- %: 0개 이상의 임의 문자
- _: 정확히 1개의 임의 문자

'이%' → "이"로 시작하는 모든 값
'%이%' → "이"를 포함하는 모든 값
'%이' → "이"로 끝나는 모든 값
'이__' → "이"로 시작하고 총 3자인 값`,
        tags: ['LIKE', 'ORDER BY', 'DESC', '%'],
    },
    {
        title: 'Q14',
        wrong_code: `-- [문제] 학생 테이블에서 학과별 튜플의 개수를 검색하는 SQL문을 작성하시오.
-- (처리 조건: WHERE 사용 불가, GROUP BY 필수, 집계함수, AS 별칭 사용)
-- 학번 | 이름 | 학년 | 학과 | 주소

-- 여기에 SQL문을 작성하시오:`,
        fixed_code: `SELECT 학과, COUNT(*) AS 학과별튜플수
FROM 학생
GROUP BY 학과;`,
        explanation: `GROUP BY: 특정 컬럼을 기준으로 그룹화하여 집계함수 적용.
주요 집계함수: COUNT(), SUM(), AVG(), MAX(), MIN()
AS: 컬럼/테이블에 별칭(Alias) 지정.

SELECT 순서: SELECT → FROM → WHERE → GROUP BY → HAVING → ORDER BY`,
        tags: ['GROUP BY', 'COUNT', 'AS', 'Alias', '집계함수'],
    },
    {
        title: 'Q15',
        wrong_code: `-- [문제] <성적> 테이블에서 과목별 점수 평균이 90점 이상인 과목이름, 최소점수, 최대점수를 검색하는 SQL문을 작성하시오.
-- (처리 조건: WHERE 사용 불가, GROUP BY + HAVING 사용, MIN/MAX, AS 사용)
-- 학번 | 과목번호 | 과목이름 | 학점 | 점수

-- 여기에 SQL문을 작성하시오:`,
        fixed_code: `SELECT 과목이름, MIN(점수) AS 최소점수, MAX(점수) AS 최대점수
FROM 성적
GROUP BY 과목이름
HAVING AVG(점수) >= 90;`,
        explanation: `HAVING: GROUP BY 이후 그룹에 조건을 적용 (WHERE는 그룹화 이전 개별 행에 적용).
- WHERE: 집계함수 사용 불가
- HAVING: 집계함수 사용 가능

실행 순서: FROM → WHERE → GROUP BY → HAVING → SELECT → ORDER BY`,
        tags: ['GROUP BY', 'HAVING', 'AVG', 'MIN', 'MAX', '집계함수'],
    },
    {
        title: 'Q16',
        wrong_code: `-- [문제] <A>와 <B> 테이블을 참고하여 SQL문의 실행 결과를 쓰시오.
-- <A>          <B>
-- NAME         RULE
-- Smith        S%
-- Allen        %T%
-- Scott

SELECT COUNT(*) CNT
FROM A CROSS JOIN B
WHERE A.NAME LIKE B.RULE;`,
        fixed_code: `-- 답: 4`,
        explanation: `CROSS JOIN(교차 조인): 두 테이블의 모든 행을 곱집합으로 조합 (3×2=6개 행 생성).
조합된 6개 중 WHERE 조건(NAME LIKE RULE) 만족:
- Smith LIKE 'S%'  → ✓ (S로 시작)
- Smith LIKE '%T%' → ✓ (T 포함: smiTh)
- Allen LIKE 'S%'  → ✗
- Allen LIKE '%T%' → ✗
- Scott LIKE 'S%'  → ✓
- Scott LIKE '%T%' → ✓ (T 포함: scoTt)
결과: 4개`,
        tags: ['CROSS JOIN', 'LIKE', 'COUNT', 'JOIN'],
    },
    {
        title: 'Q17',
        wrong_code: `-- [문제] <사원>과 <동아리> 테이블을 조인한 결과를 확인하여 SQL문의 빈칸을 채우시오.
-- (결과: 사원 전체 표시, 동아리 없으면 NULL)

SELECT a.코드, 이름, 동아리명
FROM 사원 a LEFT JOIN 동아리 b (  ①  ) a.코드 = b.(  ②  );`,
        fixed_code: `-- ① ON
-- ② 코드

SELECT a.코드, 이름, 동아리명
FROM 사원 a LEFT JOIN 동아리 b ON a.코드 = b.코드;`,
        explanation: `JOIN 종류:
- INNER JOIN: 양쪽 모두 일치하는 행만 반환
- LEFT JOIN: 왼쪽 테이블 전체 + 오른쪽 일치 행 (없으면 NULL)
- RIGHT JOIN: 오른쪽 테이블 전체 + 왼쪽 일치 행 (없으면 NULL)
- FULL OUTER JOIN: 양쪽 모두 전체 반환

ON: JOIN 조건 지정 키워드 (WHERE와 유사하지만 JOIN 전용)`,
        tags: ['LEFT JOIN', 'JOIN', 'ON', 'OUTER JOIN'],
    },
];

// ── 시드 실행 ─────────────────────────────────────────────────────────────────
async function seed() {
    console.log('🌱 시드 시작...\n');

    // 1) 유저 생성 (이미 존재하면 기존 id 사용)
    let userId;
    const [[existingUser]] = await db.query(
        'SELECT id FROM users WHERE email = ?', [SEED_USER.email]
    );

    if (existingUser) {
        userId = existingUser.id;
        console.log(`✓ 기존 유저 사용 (id=${userId}, email=${SEED_USER.email})`);
    } else {
        const hashed = await bcrypt.hash(SEED_USER.password, 10);
        const [result] = await db.query(
            'INSERT INTO users (email, password, nickname) VALUES (?, ?, ?)',
            [SEED_USER.email, hashed, SEED_USER.nickname]
        );
        userId = result.insertId;
        console.log(`✓ 유저 생성 (id=${userId}, email=${SEED_USER.email}, password=${SEED_USER.password})`);
    }

    // 2) 노트 & 태그 삽입
    let inserted = 0, skipped = 0;
    for (const note of SQL_NOTES) {
        // 중복 체크 (같은 유저의 동일 wrong_code)
        const [[dup]] = await db.query(
            'SELECT id FROM notes WHERE user_id = ? AND wrong_code = ?',
            [userId, note.wrong_code]
        );
        if (dup) { skipped++; continue; }

        const [res] = await db.query(
            `INSERT INTO notes
             (user_id, subject, language, year, round, wrong_code, fixed_code, explanation, is_public)
             VALUES (?, 'db', 'sql', 0, 0, ?, ?, ?, 1)`,
            [userId, note.wrong_code, note.fixed_code, note.explanation]
        );
        const noteId = res.insertId;

        // 태그 연결
        for (const tagName of note.tags) {
            await db.query('INSERT IGNORE INTO tags (name) VALUES (?)', [tagName]);
            const [[tag]] = await db.query('SELECT id FROM tags WHERE name = ?', [tagName]);
            if (tag) {
                await db.query(
                    'INSERT IGNORE INTO note_tags (note_id, tag_id) VALUES (?, ?)',
                    [noteId, tag.id]
                );
            }
        }

        inserted++;
        console.log(`  + ${note.title} 삽입 완료 (tags: ${note.tags.join(', ')})`);
    }

    // 3) 이 유저 소유 노트 전부 is_public = 1 보장
    const [upd] = await db.query(
        'UPDATE notes SET is_public = 1 WHERE user_id = ? AND is_public = 0',
        [userId]
    );
    if (upd.affectedRows > 0) {
        console.log(`✓ ${upd.affectedRows}개 노트를 공용(is_public=1)으로 업데이트`);
    }

    console.log(`\n✅ 완료! 삽입: ${inserted}개 / 스킵(중복): ${skipped}개`);
    process.exit(0);
}

seed().catch(err => {
    console.error('❌ 시드 실패:', err.message);
    process.exit(1);
});
