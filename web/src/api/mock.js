export const SUBJECTS = [
  { id: 'sw-design',   name: '소프트웨어 설계',    short: 'SW설계',   color: '#2563eb' },
  { id: 'sw-dev',      name: '소프트웨어 개발',    short: 'SW개발',   color: '#7c3aed' },
  { id: 'db',          name: '데이터베이스',        short: 'DB',       color: '#0891b2' },
  { id: 'security',    name: '정보시스템 구축관리', short: '구축관리', color: '#059669' },
  { id: 'programming', name: '프로그래밍 언어활용', short: '언어활용', color: '#d97706' },
]

export const MOCK_NOTES = [
  {
    id: 1, subject: 'sw-design', year: 2024, round: 1,
    wrongCode: `다음 중 객체지향 설계 원칙(SOLID)에서\n'개방-폐쇄 원칙(OCP)'에 대한 설명으로 옳은 것은?\n\n① 하나의 클래스는 하나의 책임만 가져야 한다.\n② 소프트웨어 요소는 확장에는 열려 있고,\n   변경에는 닫혀 있어야 한다.\n③ 하위 클래스는 상위 클래스를 대체할 수 있어야 한다.\n④ 클라이언트는 자신이 사용하지 않는 인터페이스에\n   의존하지 않아야 한다.`,
    fixedCode: '정답: ②',
    explanation: `**OCP(Open-Closed Principle, 개방-폐쇄 원칙)**\n\n소프트웨어 요소는 **확장에는 열려 있고, 변경에는 닫혀 있어야** 합니다.\n\n- ① 단일 책임 원칙(SRP)\n- ③ 리스코프 치환 원칙(LSP)\n- ④ 인터페이스 분리 원칙(ISP)\n\n**SOLID 암기법:** S단일 O개방 L리스코프 I인터페이스 D의존역전`,
    language: 'theory', reviewCount: 3,
    tags: [{ id:1, name:'SOLID' }, { id:2, name:'객체지향' }],
    createdAt: '2025-05-01T10:00:00.000Z',
  },
  {
    id: 2, subject: 'db', year: 2024, round: 1,
    wrongCode: `다음 SQL의 실행 결과로 옳은 것은?\n\nSELECT COUNT(*)\nFROM 사원\nWHERE 부서 = '개발부'\n  AND 급여 >= 3000000;\n\n(개발부 직원 5명 중 급여 300만원 이상 3명)`,
    fixedCode: '정답: 3',
    explanation: `**COUNT(*) 집계 함수**\n\n조건을 만족하는 **행의 수**를 반환합니다.\n\n- \`COUNT(*)\` : NULL 포함 전체 행 수\n- \`COUNT(컬럼)\` : NULL 제외 행 수\n\n결과: **3**`,
    language: 'sql', reviewCount: 1,
    tags: [{ id:4, name:'SQL' }, { id:5, name:'COUNT' }],
    createdAt: '2025-05-01T11:00:00.000Z',
  },
  {
    id: 3, subject: 'programming', year: 2023, round: 3,
    wrongCode: `다음 C언어 코드의 출력 결과는?\n\n#include <stdio.h>\nint main() {\n    int a = 10, b = 3;\n    printf("%d %d\\n", a / b, a % b);\n    return 0;\n}`,
    fixedCode: '정답: 3 1',
    explanation: `**정수 나눗셈과 나머지**\n\n- \`10 / 3\` = **3** (소수점 버림)\n- \`10 % 3\` = **1** (나머지)\n\n출력: \`3 1\``,
    language: 'c', reviewCount: 0,
    tags: [{ id:7, name:'C언어' }, { id:8, name:'연산자' }],
    createdAt: '2025-04-30T09:00:00.000Z',
  },
  {
    id: 4, subject: 'sw-dev', year: 2024, round: 2,
    wrongCode: `다음 중 '화이트박스 테스트'에 해당하는 것은?\n\n① 동치분할, 경계값 분석\n② 구문 커버리지, 결정 커버리지\n③ 오류 예측, 원인-결과 그래프\n④ 페어와이즈, 분류 트리`,
    fixedCode: '정답: ②',
    explanation: `| 구분 | 기법 |\n|------|------|\n| **화이트박스** | 구문/결정/조건 커버리지 |\n| **블랙박스** | 동치분할, 경계값 분석 |\n\n**암기:** 화이트박스 = **커버리지** 키워드`,
    language: 'theory', reviewCount: 2,
    tags: [{ id:10, name:'테스트' }, { id:11, name:'화이트박스' }],
    createdAt: '2025-04-29T14:00:00.000Z',
  },
  {
    id: 5, subject: 'security', year: 2024, round: 1,
    wrongCode: `다음 중 대칭키 암호화 알고리즘이 아닌 것은?\n\n① AES\n② DES\n③ RSA\n④ ARIA`,
    fixedCode: '정답: ③ RSA',
    explanation: `| 구분 | 알고리즘 |\n|------|----------|\n| **대칭키** | AES, DES, ARIA, SEED |\n| **비대칭키** | RSA, ECC, DSA |\n\n**RSA**는 공개키(비대칭키) 알고리즘입니다.`,
    language: 'theory', reviewCount: 0,
    tags: [{ id:13, name:'암호화' }, { id:14, name:'RSA' }],
    createdAt: '2025-04-28T10:00:00.000Z',
  },
  {
    id: 6, subject: 'db', year: 2023, round: 2,
    wrongCode: `'제2정규형(2NF)'의 조건으로 옳은 것은?\n\n① 모든 속성이 원자값을 가져야 한다\n② 부분 함수적 종속을 제거해야 한다\n③ 이행적 함수적 종속을 제거해야 한다\n④ 결정자가 후보키이어야 한다`,
    fixedCode: '정답: ②',
    explanation: `| 정규형 | 제거 대상 |\n|--------|----------|\n| 1NF | 반복 그룹 |\n| **2NF** | **부분 함수적 종속** |\n| 3NF | 이행적 종속 |\n| BCNF | 후보키 아닌 결정자 |\n\n**암기법:** 1원 2부 3이 BCNF결`,
    language: 'theory', reviewCount: 1,
    tags: [{ id:16, name:'정규화' }, { id:17, name:'2NF' }],
    createdAt: '2025-04-27T16:00:00.000Z',
  },
]

// ── D-day 설정 (localStorage 우선) ───────────────────────────────────────────
const DEFAULT_EXAM_DATE = '2026-07-18'

export function getExamDate() {
  return localStorage.getItem('ct_exam_date') ?? DEFAULT_EXAM_DATE
}
export function setExamDate(date) {
  localStorage.setItem('ct_exam_date', date)
}
export function getDday() {
  const diff = Math.ceil((new Date(getExamDate()) - new Date()) / 86400000)
  return diff
}

export const MOCK_STATS = {
  totalNotes:  120,
  totalReview: 87,
  streak:      5,
  topTags: [
    { name: 'SQL',     count: 28 },
    { name: '객체지향', count: 22 },
    { name: '테스트',  count: 18 },
    { name: '정규화',  count: 15 },
    { name: '암호화',  count: 12 },
    { name: 'C언어',   count: 10 },
  ],
  languageBreakdown: [
    { language: '소프트웨어 설계', count: 35 },
    { language: '데이터베이스',   count: 30 },
    { language: '언어활용',       count: 25 },
    { language: 'SW 개발',        count: 20 },
    { language: '구축관리',       count: 10 },
  ],
  recentActivity: Array.from({ length: 28 }, (_, i) => ({
    date:  new Date(Date.now() - i * 86400000).toISOString().slice(0, 10),
    count: Math.random() < 0.3 ? 0 : Math.floor(Math.random() * 5) + 1,
  })),
}

export const MOCK_TAGS = [
  { id:1,  name:'SOLID',   count:8  },
  { id:2,  name:'객체지향', count:22 },
  { id:4,  name:'SQL',     count:28 },
  { id:7,  name:'C언어',   count:10 },
  { id:10, name:'테스트',   count:18 },
  { id:13, name:'암호화',   count:12 },
  { id:16, name:'정규화',   count:15 },
]

// ── 런타임 노트 저장소 (localStorage + 모듈 캐시) ─────────────────────────────
const USER_KEY  = 'ct_user_notes'
const BOOK_KEY  = 'ct_bookmarks'
let   _cache    = null   // ★ 모듈 레벨 캐시

function loadUserNotes() {
  try { return JSON.parse(localStorage.getItem(USER_KEY) ?? '[]') }
  catch { return [] }
}
function saveUserNotes(notes) {
  localStorage.setItem(USER_KEY, JSON.stringify(notes))
  _cache = null   // ★ 캐시 무효화
}

export function getAllNotes() {
  if (!_cache) _cache = [...loadUserNotes(), ...MOCK_NOTES]
  return _cache
}
export function invalidateCache() { _cache = null }

export function addUserNote(fields) {
  const existing = loadUserNotes()
  const maxId    = Math.max(0, ...existing.map(n=>n.id), ...MOCK_NOTES.map(n=>n.id))
  const note = {
    id: maxId + 1,
    reviewCount: 0,
    createdAt: new Date().toISOString(),
    year: new Date().getFullYear(), round: 1,
    ...fields,
    tags: (fields.tags ?? []).map((name, i) => ({ id: maxId+100+i, name })),
  }
  saveUserNotes([note, ...existing])
  return note
}

export function updateUserNote(id, fields) {
  const notes   = loadUserNotes()
  const updated = notes.map(n => n.id === id ? { ...n, ...fields, tags: (fields.tags ?? n.tags.map(t=>t.name)).map((name,i) => typeof name==='string' ? {id:id*100+i,name} : name) } : n)
  saveUserNotes(updated)
}

export function deleteUserNote(id) {
  saveUserNotes(loadUserNotes().filter(n => n.id !== id))
}

export function isMockNote(id) {
  return MOCK_NOTES.some(n => n.id === id)
}

// ── 북마크 ────────────────────────────────────────────────────────────────────
export function getBookmarks() {
  try { return new Set(JSON.parse(localStorage.getItem(BOOK_KEY) ?? '[]')) }
  catch { return new Set() }
}
export function toggleBookmark(id) {
  const set = getBookmarks()
  set.has(id) ? set.delete(id) : set.add(id)
  localStorage.setItem(BOOK_KEY, JSON.stringify([...set]))
  return set.has(id)
}
export function isBookmarked(id) {
  return getBookmarks().has(id)
}

// ── Export / Import ───────────────────────────────────────────────────────────
export function exportData() {
  const data = {
    version:    1,
    exportedAt: new Date().toISOString(),
    userNotes:  loadUserNotes(),
    srsCards:   JSON.parse(localStorage.getItem('ct_srs_cards') ?? '{}'),
    bookmarks:  [...getBookmarks()],
    examDate:   getExamDate(),
  }
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href     = url
  a.download = `정처기_백업_${new Date().toISOString().slice(0,10)}.json`
  a.click()
  URL.revokeObjectURL(url)
}

export function importData(jsonStr) {
  const data = JSON.parse(jsonStr)
  if (!data.version) throw new Error('올바른 백업 파일이 아닙니다.')
  if (data.userNotes) saveUserNotes(data.userNotes)
  if (data.srsCards)  localStorage.setItem('ct_srs_cards', JSON.stringify(data.srsCards))
  if (data.bookmarks) localStorage.setItem(BOOK_KEY, JSON.stringify(data.bookmarks))
  if (data.examDate)  localStorage.setItem('ct_exam_date', data.examDate)
  _cache = null
  return data
}
