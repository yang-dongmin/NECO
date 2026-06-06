// 내 노트 + 실시간 업데이트를 한번에 처리하는 훅

import { useEffect, useState } from 'react'
import { fetchMyNotes, fetchPublicNotes, subscribeToNotes } from '../api/necoApi'

// 내 전체 노트 (비공개 포함)
export function useMyNotes() {
  const [notes, setNotes] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchMyNotes().then(data => {
      setNotes(data)
      setLoading(false)
    })

    // 새 노트 저장되면 자동으로 목록에 추가
    const unsubscribe = subscribeToNotes((newNote) => {
      setNotes(prev => [newNote, ...prev])
    })

    return unsubscribe
  }, [])

  return { notes, loading }
}

// 공개 노트만 (문제 풀기용)
export function usePublicNotes() {
  const [notes, setNotes] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchPublicNotes().then(data => {
      setNotes(data)
      setLoading(false)
    })

    const unsubscribe = subscribeToNotes((newNote) => {
      if (newNote.isPublic) {
        setNotes(prev => [newNote, ...prev])
      }
    })

    return unsubscribe
  }, [])

  return { notes, loading }
}