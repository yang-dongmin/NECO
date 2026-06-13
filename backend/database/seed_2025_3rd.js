/**
 * seed_2025_3rd.js - 2025년 3회 정보처리기사 실기 복원 문제 (1~20)
 *
 * 실행: node backend/database/seed_2025_3rd.js
 *
 * - 기존 유저가 있으면 그 유저에게 삽입 (test@neco.dev)
 * - 없으면 새로 생성 후 삽입
 * - 중복 실행 안전: wrong_code 앞 30자 기준 중복 체크
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const db   = require('./db');
const bcrypt = require('bcrypt');

const SEED_USER = {
    email:    'test@neco.dev',
    password: 'test1234',
    nickname: '테스트유저',
};

const NOTES = [
    {
        subject: 'sw-design',
        language: 'theory',
        year: 2025, round: 3,
        wrong_code:
`[2025년 3회 - 1번] UML 다이어그램 명칭을 작성하시오.

다음은 UML ( ) 다이어그램이다.

( ) 다이어그램이란
시스템을 폴더 모양의 ( ) 단위로 구분하여 구성 요소 간의 관계를 표현하는
UML 구조 다이어그램이다.

하나의 ( ) 안에는 여러 클래스나 하위 ( )가 포함될 수 있으며,
( ) 간에는 «import», «access», «merge» 등의 관계를 통해
의존성(Dependency)을 표현한다.

이 다이어그램은 코드의 실제 구조(폴더 구조)와 비슷하게 표현되기 때문에
소프트웨어의 모듈화, 재사용성, 의존 관계를 시각적으로 설계할 때 자주 사용된다.

정답: ( )`,
        fixed_code: `패키지`,
        explanation:
`패키지 다이어그램(Package Diagram)은 UML 구조 다이어그램 중 하나로,
시스템을 폴더(패키지) 단위로 구분하여 패키지 간 의존 관계를 표현한다.

- «import»: 한 패키지가 다른 패키지의 공개 요소를 사용
- «access»: import와 달리 네임스페이스에 추가하지 않고 접근
- «merge»: 두 패키지의 내용을 병합`,
        tags: ['UML', '패키지다이어그램', '구조다이어그램'],
    },
    {
        subject: 'sw-dev',
        language: 'theory',
        year: 2025, round: 3,
        wrong_code:
`[2025년 3회 - 2번] 소프트웨어 테스트 기법을 고르시오.

소프트웨어 테스트의 구조 기반(화이트박스) 기법 중 하나로,
결정 포인트(Decision Point) 내에 존재하는 모든 개별 조건식(Atomic Condition)을
대상으로 하는 커버리지 기준이 있다.

하나의 결정문(예: if (A && B)) 안에는 여러 개의 조건식이 포함될 수 있는데,
이 커버리지는 각각의 조건식이 True와 False 두 가지 경우를 모두 한 번 이상 만족하도록
테스트 케이스를 설계해야 한다.

단, 전체 결정식의 결과(True/False)가 모두 수행된다고 보장하지는 않는다.

[보기]
ㄱ. 경로(Path)
ㄴ. 결정(Decision)
ㄷ. 조건/결정(Condition/Decision)
ㄹ. 변경 조건/결정(MC/DC)
ㅁ. 다중 조건(Multiple Condition)
ㅂ. 문장(Statement)
ㅅ. 분기(Branch)
ㅇ. 조건(Condition)
ㅈ. 루프(Loop)`,
        fixed_code: `ㅇ. 조건(Condition)`,
        explanation:
`조건 커버리지(Condition Coverage)
- 각 결정문 내 모든 개별 조건식이 True/False를 한 번 이상 가지도록 테스트
- 결정문 전체의 결과(True/False)는 보장하지 않음 → 결정 커버리지와의 차이점

비교:
- 결정(Decision) 커버리지: 결정문 전체 결과가 T/F 모두 나오면 OK
- 조건/결정(C/D) 커버리지: 개별 조건 + 전체 결정 모두 T/F 보장
- MC/DC: 각 조건이 독립적으로 결정 결과에 영향을 미치는 경우 포함`,
        tags: ['화이트박스테스트', '조건커버리지', '커버리지'],
    },
    {
        subject: 'sw-dev',
        language: 'theory',
        year: 2025, round: 3,
        wrong_code:
`[2025년 3회 - 3번] 리눅스 명령어를 보기에서 골라 연결하시오.

현재 작업 중인 디렉터리의 경로를 출력한다. (   )
디렉터리의 내용(파일 및 하위 디렉터리)을 목록으로 표시한다. (   )
다른 디렉터리로 이동한다. (   )
파일을 복사한다. (   )

[보기] ls, cd, cp, pwd`,
        fixed_code:
`pwd
ls
cd
cp`,
        explanation:
`리눅스 기본 명령어:
- pwd (Print Working Directory): 현재 디렉터리 경로 출력
- ls (List): 디렉터리 내용 목록 출력
- cd (Change Directory): 디렉터리 이동
- cp (Copy): 파일/디렉터리 복사

추가로 자주 나오는 명령어:
- mv: 파일 이동/이름 변경
- rm: 파일 삭제
- mkdir: 디렉터리 생성
- chmod: 파일 권한 변경`,
        tags: ['리눅스', '기본명령어', 'Unix'],
    },
    {
        subject: 'security',
        language: 'theory',
        year: 2025, round: 3,
        wrong_code:
`[2025년 3회 - 4번] 오류검출 방식의 빈칸 ①~⑤를 채우시오.

(①) 코드는 전송 데이터에 여러 개의 검사 비트를 추가하여 오류를 검출하고
수정까지 가능한 방법이다.

이 코드는 재전송 없이 수신 측에서 자체 수정하는 (②) 방식에 속한다.

이에 반해 오류 발생 시 송신 측에 재전송을 요구하는 방식은 (③)이라 하며,
여기에 포함되는 대표적 검출 기법으로 (④) 검사와 (⑤) 검사가 있다.

(④) 검사는 데이터 블록 끝에 1비트 검사 비트를 추가하여 오류를 검출한다.
(⑤) 검사는 송신측과 수신측이 동일한 특정 다항식을 사용하여 오류를 검출한다.

[보기] ㉠ CRC  ㉡ FEC  ㉢ BEC  ㉣ NAK  ㉤ Parity  ㉥ MD5  ㉦ BCD  ㉧ Hamming`,
        fixed_code:
`① ㉧ Hamming
② ㉡ FEC
③ ㉢ BEC
④ ㉤ Parity
⑤ ㉠ CRC`,
        explanation:
`오류 제어 방식:
- FEC (Forward Error Correction): 순방향 오류 수정. 재전송 없이 수신측에서 자체 수정.
  대표: 해밍(Hamming) 코드
- BEC (Backward Error Correction / ARQ): 역방향. 오류 감지 후 재전송 요청.
  대표: Parity 검사, CRC

Parity: 1비트 검사 비트로 홀수/짝수 패리티 판별
CRC (Cyclic Redundancy Check): 생성 다항식으로 나머지 계산, 오류 검출률 높음`,
        tags: ['오류검출', '해밍코드', 'FEC', 'BEC', 'CRC', 'Parity'],
    },
    {
        subject: 'programming',
        language: 'c',
        year: 2025, round: 3,
        wrong_code:
`[2025년 3회 - 5번] 아래 C코드의 출력값을 작성하시오.

#include <stdio.h>

struct Test {
    int i;
    const char *g;
};

int main() {
    struct Test test[] = {{1, "AB"}, {2, "DC"}, {3, "EB"}};
    struct Test *p = &test[1];
    printf("%s", p->g + (p->i - 1));
    return 0;
}`,
        fixed_code: `C`,
        explanation:
`p = &test[1] → test[1] = {i:2, g:"DC"}
p->i = 2, p->g = "DC"

p->g + (p->i - 1) = "DC" + (2-1) = "DC" + 1

문자열 포인터 "DC"에서 1칸 이동하면 'C'를 가리킴
printf("%s", ...) 로 출력하면 → C

핵심: 포인터 연산으로 문자열 시작 위치를 이동`,
        tags: ['C언어', '구조체', '포인터', '문자열'],
    },
    {
        subject: 'programming',
        language: 'c',
        year: 2025, round: 3,
        wrong_code:
`[2025년 3회 - 6번] 아래 C코드의 출력값을 작성하시오.

#include <stdio.h>

int main(void) {
    char str[] = "REPUBLICOFKOREA";
    int a = 0;

    while (str[a] != '\\0')
        ++a;

    putchar(str[a - 2]);
    return 0;
}`,
        fixed_code: `E`,
        explanation:
`"REPUBLICOFKOREA" 의 길이 = 15
while 루프가 끝나면 a = 15 (null 문자 위치)

str[a-2] = str[13] = 'E'

인덱스 확인:
R E P U B L I C O F K O R E A \\0
0 1 2 3 4 5 6 7 8 9 10 11 12 13 14 15

str[13] = 'E'`,
        tags: ['C언어', '문자열', '배열', '포인터'],
    },
    {
        subject: 'programming',
        language: 'c',
        year: 2025, round: 3,
        wrong_code:
`[2025년 3회 - 7번] 아래 C코드의 출력값을 작성하시오.

#include <stdio.h>

struct Node {
    struct Node* next;
    unsigned int x;
};

int main() {
    struct Node t1 = { 0, 5u };
    struct Node t2 = { 0, 7u };
    struct Node t3 = { 0, 11u };

    t3.next = &t2;
    t2.next = &t1;

    struct Node* curr = &t3;
    int sum = 0;

    while (curr) {
        sum = sum * 3 + curr->x;
        curr = curr->next;
    }

    sum = (sum ^ 42u) + 100u;

    printf("%u\\n", sum);
}`,
        fixed_code: `187`,
        explanation:
`연결 리스트: t3(11) → t2(7) → t1(5) → NULL

반복 계산:
1회: sum = 0*3 + 11 = 11,  curr = &t2
2회: sum = 11*3 + 7 = 40,  curr = &t1
3회: sum = 40*3 + 5 = 125, curr = NULL (종료)

sum = 125
sum ^ 42 = 125 XOR 42
125 = 01111101
 42 = 00101010
XOR= 01010111 = 87

sum = 87 + 100 = 187`,
        tags: ['C언어', '연결리스트', '비트연산', 'XOR'],
    },
    {
        subject: 'programming',
        language: 'java',
        year: 2025, round: 3,
        wrong_code:
`[2025년 3회 - 8번] 빈칸에 들어갈 올바른 키워드를 작성하시오.

interface Machine {
    void run();
}

class WashingMachine (____빈칸____) Machine {
    private String name;

    public WashingMachine() {
        this.name = "LG Washer";
    }

    public void run() {
        System.out.println("Washing machine running");
    }
}

public class Main {
    public static void main(String[] args) {
        WashingMachine wm = new WashingMachine();
        wm.run();
    }
}`,
        fixed_code: `implements`,
        explanation:
`Java에서 인터페이스 구현 키워드:
- implements: 클래스가 인터페이스를 구현할 때 사용
- extends: 클래스 상속 또는 인터페이스 간 상속

인터페이스 vs 추상클래스:
- interface: 다중 구현 가능, 모든 메서드 추상(Java 8 이후 default 메서드 허용)
- abstract class: 단일 상속만, 일반 메서드 포함 가능

WashingMachine implements Machine → run() 메서드를 반드시 오버라이드해야 함`,
        tags: ['Java', '인터페이스', 'implements', '객체지향'],
    },
    {
        subject: 'programming',
        language: 'python',
        year: 2025, round: 3,
        wrong_code:
`[2025년 3회 - 9번] 아래 Python 코드의 출력값을 작성하시오.

data = [
    [3, 5, 2, 4, 1],
    [4, 5, 1],
    [4, 4, 1, 5, 4],
    [4, 5]
]

result = {}

for index, lis in enumerate(data):
    list_sum = sum(lis)
    list_len = len(lis)
    result[index] = (list_sum, list_len)

print(result)

[ 출력값 ]
{0: (①, ②), 1: (③, ④), 2: (⑤, ⑥), 3: (⑦, ⑧)}`,
        fixed_code: `{0: (15, 5), 1: (10, 3), 2: (18, 5), 3: (9, 2)}`,
        explanation:
`enumerate(data)로 인덱스와 리스트를 동시에 순회:

index=0, lis=[3,5,2,4,1]: sum=15, len=5 → (15, 5)
index=1, lis=[4,5,1]:     sum=10, len=3 → (10, 3)
index=2, lis=[4,4,1,5,4]: sum=18, len=5 → (18, 5)
index=3, lis=[4,5]:       sum=9,  len=2 → (9, 2)

result = {0:(15,5), 1:(10,3), 2:(18,5), 3:(9,2)}

핵심: enumerate() = (인덱스, 값) 쌍 반환, sum(), len() 내장함수`,
        tags: ['Python', 'enumerate', 'sum', '딕셔너리'],
    },
    {
        subject: 'db',
        language: 'sql',
        year: 2025, round: 3,
        wrong_code:
`[2025년 3회 - 10번] 다음 테이블에서 조건값을 실행한 결과값을 작성하시오.

(테이블 이미지 문제 - 복원 정보 기준)
SELECT 쿼리 실행 결과 행 수를 구하시오.`,
        fixed_code: `4`,
        explanation:
`테이블 이미지가 포함된 문제로 정확한 지문 복원이 어렵습니다.
정답: 4

SQL COUNT 또는 조건 필터링 결과 4행이 출력되는 문제입니다.
실제 시험 문제지를 참고하여 쿼리와 테이블 구조를 확인하세요.`,
        tags: ['SQL', 'SELECT', 'COUNT'],
    },
    {
        subject: 'security',
        language: 'theory',
        year: 2025, round: 3,
        wrong_code:
`[2025년 3회 - 11번] 다음 설명에 해당하는 인증 기술을 쓰시오.

한 번 사용하면 즉시 폐기되어 재사용이 불가능하다.

서버와 토큰(또는 앱)은 시간 동기화나 카운터 기반 방식으로 매번 새로운
값을 생성하고, 내부 검증은 해시 함수를 이용한 방식으로 서버에 평문을
저장하지 않고도 유효성을 확인할 수 있다.

이 특성 때문에 은행 인증 등 고보안 영역에서 널리 사용되며
재전송 공격 방지와 사용자 편의성을 동시에 만족한다.`,
        fixed_code: `OTP`,
        explanation:
`OTP (One-Time Password): 일회용 비밀번호

종류:
- TOTP (Time-based OTP): 시간 동기화 방식 (Google Authenticator 등)
- HOTP (HMAC-based OTP): 카운터 기반 방식

특징:
- 사용 후 즉시 폐기 → 재사용 불가
- 재전송 공격(Replay Attack) 방지
- 서버에 평문 저장 불필요 (해시 기반 검증)
- 2FA(2단계 인증)에 주로 활용`,
        tags: ['보안', 'OTP', '인증', '일회용비밀번호'],
    },
    {
        subject: 'programming',
        language: 'java',
        year: 2025, round: 3,
        wrong_code:
`[2025년 3회 - 12번] 밑줄에 알맞은 단어를 작성하시오.

class Rectangle {
    int width, height;

    Rectangle(int width, int height) {
        this.width = width;
        this.height = height;
    }
}

class Square extends Rectangle {
    Square(int a) {
        ____(a, a);
    }

    int getSquareArea() {
        return width * height;
    }
}

public class Main {
    public static void main(String[] args) {
        Square sq = new Square(10);
        System.out.println(sq.getSquareArea());
    }
}`,
        fixed_code: `super`,
        explanation:
`super(): 부모 클래스의 생성자를 호출하는 키워드

Square(int a)에서 super(a, a)를 호출하면
→ Rectangle(int width, int height) 생성자 실행
→ this.width = a, this.height = a

getSquareArea() = width * height = 10 * 10 = 100

규칙:
- super()는 자식 생성자의 첫 번째 줄에 있어야 함
- 명시하지 않으면 컴파일러가 super() (인자 없는 부모 생성자) 자동 삽입
- this(): 같은 클래스의 다른 생성자 호출`,
        tags: ['Java', 'super', '상속', '생성자'],
    },
    {
        subject: 'security',
        language: 'theory',
        year: 2025, round: 3,
        wrong_code:
`[2025년 3회 - 13번] 다음 설명에 알맞은 단어를 작성하시오.

사용자가 새로운 사이트에 가입하지 않고 평소에 이용하던 서비스의 계정으로
로그인할 수 있게 해주는 기술이다.

사용자의 비밀번호는 절대 전달되지 않으며 사용자가 승인한 범위에 대해서만
접근 권한이 위임된다.

이 방식은 직접 인증(Authentication)을 수행하지 않고
"인가(Authorization)" 절차를 통해 접근 권한을 제3자에게 부여한다.

인증 완료 후, 서비스 제공자는 Access Token을 발급하며 애플리케이션은 이
토큰을 이용해 API를 호출하여 필요한 정보에 접근한다.

대표적인 예는 소셜 로그인이며 SSO(Single Sign-On)과 달리 동일 시스템 내
인증이 아니라 서로 다른 서비스 간의 권한 위임에 초점이 맞춰져 있다.`,
        fixed_code: `OAuth`,
        explanation:
`OAuth (Open Authorization)
- 인증(Authentication)이 아닌 인가(Authorization) 프로토콜
- 비밀번호 없이 Access Token으로 권한 위임

OAuth 2.0 흐름:
1. 사용자가 소셜 로그인 요청
2. 인가 서버(Google 등)가 사용자 동의 요청
3. 동의 후 Authorization Code 발급
4. 클라이언트가 Access Token 교환
5. Access Token으로 API 호출

SSO vs OAuth:
- SSO: 한 번 로그인으로 동일 시스템 내 여러 서비스 접근
- OAuth: 서로 다른 서비스 간 권한 위임`,
        tags: ['보안', 'OAuth', '인가', '소셜로그인', 'AccessToken'],
    },
    {
        subject: 'db',
        language: 'sql',
        year: 2025, round: 3,
        wrong_code:
`[2025년 3회 - 14번] 아래의 테이블을 확인하여 R%S의 결과를 테이블 형태로 기재하시오.

(테이블 이미지 문제 - 관계대수 나누기 연산)

R % S (Division 연산): R을 S로 나누는 관계대수 연산`,
        fixed_code: `(테이블 이미지 포함 문제 - 실제 시험지 참고 필요)

관계대수 Division(÷) 연산 결과`,
        explanation:
`관계대수 Division(%) 연산:
R ÷ S = R에서 S의 모든 튜플과 쌍을 이루는 R의 튜플 집합

예시:
R(A, B): (1,a),(1,b),(2,a),(2,b),(3,a)
S(B): (a),(b)

R ÷ S = S의 모든 값(a,b)과 쌍을 이루는 A 값
→ A=1 (1,a)+(1,b) ✓, A=2 (2,a)+(2,b) ✓, A=3 (3,a)만 있고 (3,b) 없음 ✗
결과: {1, 2}

※ 이미지 문제로 정확한 테이블 복원 불가, 실제 시험지를 참고하세요.`,
        tags: ['DB', '관계대수', 'Division', '나누기연산'],
    },
    {
        subject: 'programming',
        language: 'c',
        year: 2025, round: 3,
        wrong_code:
`[2025년 3회 - 15번] 아래 C코드의 출력값을 작성하시오.

#include <stdio.h>

int main() {
    int x=7, y=4, z;

    z = y%3<3 ? 2 : 1;
    z = z & z >> 1;
    z = x>5 && z<=3 ? z*x : z/x;

    printf("%d", z);
    return 0;
}`,
        fixed_code: `0`,
        explanation:
`단계별 추적:

1) z = y%3 < 3 ? 2 : 1
   y%3 = 4%3 = 1,  1 < 3 → true
   z = 2

2) z = z & z >> 1
   연산자 우선순위: >> 가 & 보다 높음
   z >> 1 = 2 >> 1 = 1  (2 = 010b → 1 = 001b)
   z & 1  = 2 & 1 = 010b & 001b = 000b = 0
   z = 0

3) z = x>5 && z<=3 ? z*x : z/x
   x>5 → 7>5 → true
   z<=3 → 0<=3 → true
   true && true → true
   z = z*x = 0*7 = 0

출력: 0`,
        tags: ['C언어', '비트연산', '삼항연산자', '연산자우선순위'],
    },
    {
        subject: 'db',
        language: 'theory',
        year: 2025, round: 3,
        wrong_code:
`[2025년 3회 - 16번] 관계형 데이터베이스 개념의 빈칸을 채우시오.

ㄱ. 테이블에서 한 행(Row)을 의미하며, 하나의 레코드를 구성하는 요소
ㄴ. 실제 데이터가 저장되어 있는 테이블의 내용 전체를 의미하며, 데이터의 상태를 나타낸다.
ㄷ. 테이블에 저장된 행(Row)의 총 개수를 의미한다.

[보기]
스키마(Structure)  속성(Attribute)  튜플(Tuple)
차수(Degree)    인스턴스(Instance)  카디널리티(Cardinality)`,
        fixed_code:
`ㄱ. 튜플(Tuple)
ㄴ. 인스턴스(Instance)
ㄷ. 카디널리티(Cardinality)`,
        explanation:
`관계형 DB 용어 정리:

| 용어 | 의미 |
|------|------|
| 튜플(Tuple) | 행(Row), 레코드 |
| 속성(Attribute) | 열(Column), 필드 |
| 카디널리티(Cardinality) | 튜플(행)의 수 |
| 차수(Degree) | 속성(열)의 수 |
| 스키마(Schema) | 테이블 구조 정의 |
| 인스턴스(Instance) | 실제 저장된 데이터 전체 |
| 도메인(Domain) | 속성이 가질 수 있는 값의 범위 |`,
        tags: ['DB', '관계형데이터베이스', '튜플', '카디널리티', '인스턴스'],
    },
    {
        subject: 'programming',
        language: 'java',
        year: 2025, round: 3,
        wrong_code:
`[2025년 3회 - 17번] 아래 Java 코드의 출력값을 작성하시오.

enum Tri {
    A("A"), B("AB"), C("ABC");

    private String code;

    Tri(String code) {
        this.code = code;
    }

    public String code() {
        return code;
    }
}

public class Main {
    public static void main(String[] args) {
        Tri t = Tri.values()[Tri.A.name().length()];
        System.out.print(t.code());
    }
}`,
        fixed_code: `AB`,
        explanation:
`단계별 추적:

1) Tri.A.name() → "A" (enum 상수의 이름 문자열)
2) "A".length() → 1
3) Tri.values() → [A, B, C] (인덱스: 0=A, 1=B, 2=C)
4) Tri.values()[1] → Tri.B
5) Tri.B.code() → "AB"

출력: AB

핵심:
- name(): enum 상수의 선언 이름 반환 ("A", "B", "C")
- values(): enum 상수 배열 반환 (선언 순서대로)
- code(): 직접 정의한 메서드, 생성자에서 설정한 code 필드 반환`,
        tags: ['Java', 'enum', '열거형', 'values', 'name'],
    },
    {
        subject: 'security',
        language: 'theory',
        year: 2025, round: 3,
        wrong_code:
`[2025년 3회 - 18번] 접근통제 모델을 보기에서 골라 빈칸에 작성하시오.

ㄱ. 중앙에서 보안 정책을 일괄적으로 설정하며, 주체(사용자)가 임의로
수정하거나 변경할 수 없다. 주로 군사 기밀, 국가 보안과 같은 높은 보안
수준이 요구되는 환경에서 사용된다. 보안 등급(Top Secret / Secret /
Confidential 등)에 따라 접근 여부가 결정된다.

ㄴ. 조직 내에서 부여된 직무나 역할(Role)에 따라 접근 권한을 부여하는
방식이다. 개별 사용자에게 직접 권한을 설정하지 않고, 역할에 권한을 묶어
부여하기 때문에 관리가 용이하다.

ㄷ. 자원의 소유자(Owner)가 해당 자원에 대한 접근 권한을 자유롭게
부여하거나 회수할 수 있는 방식이다. 사용자의 임의 설정이 가능해
보안성이 상대적으로 낮다.

[보기] DAC  MAC  RBAC`,
        fixed_code:
`ㄱ. MAC (Mandatory Access Control)
ㄴ. RBAC (Role-Based Access Control)
ㄷ. DAC (Discretionary Access Control)`,
        explanation:
`접근통제 3대 모델:

MAC (강제적 접근통제)
- 중앙 관리자가 정책 결정, 사용자는 변경 불가
- 보안 등급(Label) 기반: Top Secret > Secret > Confidential > Unclassified
- 군사/정부 기관에서 사용

RBAC (역할 기반 접근통제)
- 역할(Role)에 권한 부여 → 사용자를 역할에 할당
- 관리 용이, 직무 변경 시 역할만 변경
- 기업 환경에서 가장 널리 사용

DAC (임의적 접근통제)
- 자원 소유자가 직접 접근 권한 결정
- Unix/Linux 파일 권한(rwx)이 대표적
- 유연하지만 보안성 낮음 (트로이목마 취약)`,
        tags: ['보안', '접근통제', 'MAC', 'RBAC', 'DAC'],
    },
    {
        subject: 'sw-dev',
        language: 'theory',
        year: 2025, round: 3,
        wrong_code:
`[2025년 3회 - 19번] 테스트케이스의 구성요소에 대한 설명에서 괄호를 채우시오.

(테이블 이미지 문제 - 테스트케이스 구성요소 연결)

[보기]
ㄱ. 테스트 조건
ㄴ. 테스트 환경
ㄷ. 테스트 유형
ㄹ. 테스트 데이터
ㅁ. 예상 결과
ㅂ. 수행 단계
ㅅ. 성공/실패 기준`,
        fixed_code:
`(왼쪽 순서대로)
ㄱ. 테스트 조건
ㄹ. 테스트 데이터
ㅁ. 예상 결과`,
        explanation:
`테스트케이스 구성요소:

1. 테스트 항목 식별자: 고유 식별 번호
2. 테스트 조건(ㄱ): 테스트 수행을 위한 전제 조건
3. 테스트 데이터(ㄹ): 입력값, 테스트에 사용할 실제 데이터
4. 수행 단계(ㅂ): 테스트 실행 절차
5. 예상 결과(ㅁ): 올바른 실행 시 나와야 할 결과
6. 성공/실패 기준(ㅅ): 통과/실패 판정 기준
7. 테스트 환경(ㄴ): OS, 브라우저, HW 등 실행 환경

※ 이미지 문제로 정확한 지문 복원 불가, 실제 시험지를 참고하세요.`,
        tags: ['소프트웨어테스트', '테스트케이스', '테스트설계'],
    },
    {
        subject: 'db',
        language: 'sql',
        year: 2025, round: 3,
        wrong_code:
`[2025년 3회 - 20번] 아래 A테이블을 참고하여 쿼리의 결과를 작성하시오.

(A 테이블: col1, col2 컬럼 존재 - 이미지)

[SQL]
SELECT count(col2)
FROM A
WHERE col1 IN (2, 3)
OR col2 IN (3, 5)`,
        fixed_code: `4`,
        explanation:
`SQL 분석:

WHERE col1 IN (2, 3) OR col2 IN (3, 5)
→ col1이 2 또는 3인 행 OR col2가 3 또는 5인 행

count(col2): col2가 NULL이 아닌 행의 수 카운트
(count(*)는 NULL 포함, count(컬럼)은 NULL 제외)

복원 문제 기준 정답: 4

IN 연산자 정리:
- IN (a, b, c) = OR 조건의 축약형
- col1 IN (2, 3) = col1=2 OR col1=3
- NOT IN: 해당 값이 아닌 행 선택`,
        tags: ['SQL', 'SELECT', 'COUNT', 'IN', 'WHERE'],
    },
];

async function main() {
    try {
        // 유저 찾기 또는 생성
        let [[user]] = await db.query('SELECT id FROM users WHERE email = ?', [SEED_USER.email]);
        if (!user) {
            const hash = await bcrypt.hash(SEED_USER.password, 10);
            const [r] = await db.query(
                'INSERT INTO users (email, password, nickname) VALUES (?, ?, ?)',
                [SEED_USER.email, hash, SEED_USER.nickname]
            );
            user = { id: r.insertId };
            console.log(`유저 생성: ${SEED_USER.email} (id=${user.id})`);
        } else {
            console.log(`기존 유저 사용: ${SEED_USER.email} (id=${user.id})`);
        }

        const userId = user.id;
        let inserted = 0;
        let skipped  = 0;

        for (const note of NOTES) {
            // 중복 체크 (wrong_code 앞 40자 기준)
            const key = note.wrong_code.slice(0, 40);
            const [[exists]] = await db.query(
                'SELECT id FROM notes WHERE user_id = ? AND LEFT(wrong_code, 40) = ?',
                [userId, key]
            );
            if (exists) { skipped++; continue; }

            const [r] = await db.query(
                `INSERT INTO notes (user_id, subject, language, year, round, wrong_code, fixed_code, explanation, is_public)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)`,
                [userId, note.subject, note.language, note.year, note.round,
                 note.wrong_code, note.fixed_code, note.explanation]
            );
            const noteId = r.insertId;

            // 태그 삽입
            for (const tagName of (note.tags || [])) {
                const [[t]] = await db.query('SELECT id FROM tags WHERE name = ?', [tagName]);
                let tagId;
                if (t) {
                    tagId = t.id;
                } else {
                    const [tr] = await db.query('INSERT INTO tags (name) VALUES (?)', [tagName]);
                    tagId = tr.insertId;
                }
                await db.query('INSERT IGNORE INTO note_tags (note_id, tag_id) VALUES (?, ?)', [noteId, tagId]);
            }
            inserted++;
            console.log(`  [${inserted}] 삽입: ${note.wrong_code.split('\n')[0].slice(0, 50)}`);
        }

        console.log(`\n완료: ${inserted}개 삽입, ${skipped}개 스킵(중복)`);
    } catch (err) {
        console.error('오류:', err.message);
    } finally {
        process.exit(0);
    }
}

main();
