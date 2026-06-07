// ── 과목 상수 (전체 앱에서 사용) ─────────────────────────────────────────────
export const SUBJECTS = [
  { id: 'sw-design',   name: '소프트웨어 설계',    short: 'SW설계',   color: '#2563eb' },
  { id: 'sw-dev',      name: '소프트웨어 개발',    short: 'SW개발',   color: '#7c3aed' },
  { id: 'db',          name: '데이터베이스',        short: 'DB',       color: '#0891b2' },
  { id: 'security',    name: '정보시스템 구축관리', short: '구축관리', color: '#059669' },
  { id: 'programming', name: '프로그래밍 언어활용', short: '언어활용', color: '#d97706' },
]

// ── D-day (시험일) ────────────────────────────────────────────────────────────
const DEFAULT_EXAM_DATE = '2026-07-18'

export function getExamDate() {
  return localStorage.getItem('ct_exam_date') ?? DEFAULT_EXAM_DATE
}
export function setExamDate(date) {
  localStorage.setItem('ct_exam_date', date)
}
export function getDday() {
  return Math.ceil((new Date(getExamDate()) - new Date()) / 86400000)
}

// ── 데이터 Export / Import ────────────────────────────────────────────────────
const USER_KEY = 'ct_user_notes'
const BOOK_KEY = 'ct_bookmarks'

export function exportData() {
  const data = {
    version:    1,
    exportedAt: new Date().toISOString(),
    userNotes:  JSON.parse(localStorage.getItem(USER_KEY) ?? '[]'),
    srsCards:   JSON.parse(localStorage.getItem('ct_srs_cards') ?? '{}'),
    bookmarks:  JSON.parse(localStorage.getItem(BOOK_KEY) ?? '[]'),
    examDate:   getExamDate(),
  }
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href     = url
  a.download = `정처기_백업_${new Date().toISOString().slice(0, 10)}.json`
  a.click()
  URL.revokeObjectURL(url)
}

export function importData(jsonStr) {
  const data = JSON.parse(jsonStr)
  if (!data.version) throw new Error('올바른 백업 파일이 아닙니다.')
  if (data.userNotes) localStorage.setItem(USER_KEY,        JSON.stringify(data.userNotes))
  if (data.srsCards)  localStorage.setItem('ct_srs_cards',  JSON.stringify(data.srsCards))
  if (data.bookmarks) localStorage.setItem(BOOK_KEY,        JSON.stringify(data.bookmarks))
  if (data.examDate)  localStorage.setItem('ct_exam_date',  data.examDate)
  return data
}
