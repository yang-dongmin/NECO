/**
 * SM-2 Spaced Repetition Algorithm
 * quality: 0=완전모름 1=거의모름 2=어렴풋 3=어렵게맞춤 4=잘맞춤 5=완벽
 */

const MIN_EF      = 1.3
const DEFAULT_EF  = 2.5

// ── 실제 hex 색상값 (CSS 변수 X) ─────────────────────────────────────────────
export const MASTERY = {
  완벽: { label: '완벽', color: '#10b981', bg: '#ecfdf5', pct: 100 },
  양호: { label: '양호', color: '#2563eb', bg: '#eff6ff', pct: 75  },
  보통: { label: '보통', color: '#f59e0b', bg: '#fffbeb', pct: 50  },
  취약: { label: '취약', color: '#ef4444', bg: '#fef2f2', pct: 25  },
}

export function masteryLevel(ef = DEFAULT_EF) {
  if (ef >= 2.5) return MASTERY.완벽
  if (ef >= 2.0) return MASTERY.양호
  if (ef >= 1.7) return MASTERY.보통
  return MASTERY.취약
}

export function sm2(card, quality) {
  let { ef = DEFAULT_EF, interval = 0, repetitions = 0 } = card

  if (quality < 3) {
    repetitions = 0
    interval    = 1
  } else {
    ef = ef + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
    ef = Math.max(MIN_EF, ef)

    if      (repetitions === 0) interval = 1
    else if (repetitions === 1) interval = 6
    else                        interval = Math.round(interval * ef)

    repetitions += 1
  }

  const nextReviewAt = new Date()
  nextReviewAt.setDate(nextReviewAt.getDate() + interval)
  nextReviewAt.setHours(0, 0, 0, 0)

  return {
    ef: parseFloat(ef.toFixed(2)),
    interval,
    repetitions,
    nextReviewAt:    nextReviewAt.toISOString(),
    lastReviewedAt:  new Date().toISOString(),
  }
}

export function isDue(card) {
  if (!card.nextReviewAt) return true
  const today = new Date(); today.setHours(0, 0, 0, 0)
  return new Date(card.nextReviewAt) <= today
}

export function daysUntilDue(card) {
  if (!card.nextReviewAt) return -Infinity
  const today = new Date(); today.setHours(0, 0, 0, 0)
  const next  = new Date(card.nextReviewAt); next.setHours(0, 0, 0, 0)
  return Math.round((next - today) / 86400000)
}

export const QUALITY_OPTIONS = [
  { q: 0, label: '전혀 모름',   desc: '완전히 기억 못 했습니다' },
  { q: 1, label: '거의 모름',   desc: '정답 보고 나서야 기억남' },
  { q: 2, label: '어렴풋이 앎', desc: '힌트 있어야 기억남'      },
  { q: 3, label: '어렵게 맞춤', desc: '많이 버벅이며 맞음'      },
  { q: 4, label: '잘 맞춤',     desc: '약간 버벅이며 맞음'      },
  { q: 5, label: '완벽히 맞춤', desc: '막힘 없이 바로 맞음'     },
]
