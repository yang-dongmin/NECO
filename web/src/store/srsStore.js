import { create } from 'zustand'
import { sm2, isDue, daysUntilDue, masteryLevel } from '../lib/sm2'

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

  // ★ 단일 카드 반응형 조회 (cards 구독 트리거)
  getCard(noteId) {
    return get().cards[noteId] ?? initCard(noteId)
  },

  submitReview(noteId, quality) {
    const { cards } = get()
    const current   = cards[noteId] ?? initCard(noteId)
    const updated   = { ...current, noteId, ...sm2(current, quality) }
    const next      = { ...cards, [noteId]: updated }
    saveCards(next)
    set({ cards: next })   // ★ 전체 cards 교체 → 구독 컴포넌트 리렌더
    return updated
  },

  getDueNotes(notes) {
    const { cards } = get()
    return notes.filter(n => {
      const card = cards[n.id] ?? initCard(n.id)
      return isDue(card)
    })
  },

  // ★ cards를 구독하므로 submitReview 후 자동 리렌더
  getEnrichedCards(notes) {
    const { cards } = get()
    return notes.map(n => {
      const card = cards[n.id] ?? initCard(n.id)
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
    const enriched  = notes.map(n => cards[n.id] ?? initCard(n.id))
    return {
      due:     enriched.filter(isDue).length,
      learned: enriched.filter(c => c.repetitions > 0).length,
      mature:  enriched.filter(c => c.interval >= 21).length,
      total:   notes.length,
    }
  },

  // 전체 카드 초기화 (개발/테스트용)
  resetAll() {
    saveCards({})
    set({ cards: {} })
  },
}))
