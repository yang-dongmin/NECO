import { create } from 'zustand'
import { sm2, isDue, daysUntilDue, masteryLevel } from '../lib/sm2'
import { reviewNote } from '../api/client'

const STORAGE_KEY = 'ct_srs_cards'

function loadCards() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch { return {} }
}

function saveCards(cards) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(cards))
}

function initCard(noteId) {
  return { noteId, ef: 2.5, interval: 0, repetitions: 0, nextReviewAt: null, lastReviewedAt: null }
}

export const useSrsStore = create((set, get) => ({
  cards: loadCards(),

  // ── 로그인 후 DB SRS 카드 병합 ────────────────────────────────────────────
  // 호출: useAuthStore login() 이후, 또는 앱 초기화 시
  async loadFromDB(srsCards) {
    if (!Array.isArray(srsCards) || srsCards.length === 0) return
    const { cards } = get()
    const merged = { ...cards }
    srsCards.forEach(row => {
      const noteId = String(row.note_id)
      const dbCard = {
        noteId,
        ef:            row.ef            ?? 2.5,
        interval:      row.interval_days ?? 0,
        repetitions:   row.repetitions   ?? 0,
        nextReviewAt:  row.next_review_at  ? new Date(row.next_review_at).toISOString()  : null,
        lastReviewedAt:row.last_reviewed_at? new Date(row.last_reviewed_at).toISOString(): null,
      }
      // DB가 더 최신이면 덮어쓰기
      const local = cards[noteId]
      const dbTime  = dbCard.lastReviewedAt  ? new Date(dbCard.lastReviewedAt).getTime()  : 0
      const locTime = local?.lastReviewedAt  ? new Date(local.lastReviewedAt).getTime()   : 0
      if (!local || dbTime >= locTime) {
        merged[noteId] = dbCard
      }
    })
    saveCards(merged)
    set({ cards: merged })
  },

  // ── 단일 카드 반응형 조회 ─────────────────────────────────────────────────
  getCard(noteId) {
    return get().cards[String(noteId)] ?? initCard(String(noteId))
  },

  // ── 복습 제출 — localStorage + DB 동시 저장 ──────────────────────────────
  async submitReview(noteId, quality) {
    const { cards } = get()
    const key     = String(noteId)
    const current = cards[key] ?? initCard(key)
    const updated = { ...current, noteId: key, ...sm2(current, quality) }
    const next    = { ...cards, [key]: updated }

    // 1) localStorage 즉시 반영 (UI 반응성)
    saveCards(next)
    set({ cards: next })

    // 2) DB 비동기 동기화 (실패해도 UI는 이미 업데이트)
    try {
      await reviewNote(noteId, {
        ef:           updated.ef,
        intervalDays: updated.interval,
        repetitions:  updated.repetitions,
        nextReviewAt: updated.nextReviewAt,
      })
    } catch (err) {
      console.warn('[SRS] DB 동기화 실패 (로컬은 저장됨):', err.message)
    }

    return updated
  },

  getDueNotes(notes) {
    const { cards } = get()
    return notes.filter(n => {
      const card = cards[String(n.id)] ?? initCard(String(n.id))
      return isDue(card)
    })
  },

  getEnrichedCards(notes) {
    const { cards } = get()
    return notes.map(n => {
      const card = cards[String(n.id)] ?? initCard(String(n.id))
      return {
        ...n,
        srs: {
          ...card,
          mastery:   masteryLevel(card.ef),
          daysUntil: daysUntilDue(card),
          due:       isDue(card),
        },
      }
    })
  },

  getSummary(notes) {
    const { cards } = get()
    const enriched  = notes.map(n => cards[String(n.id)] ?? initCard(String(n.id)))
    return {
      due:     enriched.filter(isDue).length,
      learned: enriched.filter(c => c.repetitions > 0).length,
      mature:  enriched.filter(c => c.interval >= 21).length,
      total:   notes.length,
    }
  },

  resetAll() {
    saveCards({})
    set({ cards: {} })
  },
}))
