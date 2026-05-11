// ── 스켈레톤 기본 블록 ────────────────────────────────────────────────────────
export function SkeletonBlock({ width = '100%', height = 16, style = {} }) {
  return (
    <div className="skeleton" style={{ width, height, borderRadius: 6, ...style }} />
  )
}

// ── 노트 카드 스켈레톤 ────────────────────────────────────────────────────────
export function NoteCardSkeleton() {
  return (
    <div style={{
      background: '#fff', border: '1px solid #f1f5f9', borderRadius: 12,
      overflow: 'hidden', display: 'flex',
      boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
    }}>
      <div style={{ width: 4, background: '#f1f5f9', flexShrink: 0 }} />
      <div style={{ flex: 1, padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ display: 'flex', gap: 8 }}>
          <SkeletonBlock width={64} height={20} />
          <SkeletonBlock width={48} height={20} />
          <SkeletonBlock width={40} height={20} style={{ marginLeft: 'auto' }} />
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <SkeletonBlock width={48} height={18} />
          <SkeletonBlock width={56} height={18} />
        </div>
        <SkeletonBlock width="100%" height={68} />
        <SkeletonBlock width="100%" height={3} />
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <SkeletonBlock width={80} height={14} />
          <SkeletonBlock width={70} height={14} />
        </div>
      </div>
    </div>
  )
}

// ── 통계 카드 스켈레톤 ────────────────────────────────────────────────────────
export function StatCardSkeleton() {
  return (
    <div style={{
      background: '#fff', border: '1px solid #f1f5f9', borderRadius: 12,
      padding: '16px 18px', display: 'flex', gap: 12,
      boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
    }}>
      <SkeletonBlock width={40} height={40} style={{ borderRadius: 10, flexShrink: 0 }} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <SkeletonBlock width={60} height={12} />
        <SkeletonBlock width={48} height={24} />
        <SkeletonBlock width={80} height={10} />
      </div>
    </div>
  )
}

// ── 전체 페이지 로딩 스켈레톤 ────────────────────────────────────────────────
export function PageSkeleton() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* 배너 스켈레톤 */}
      <SkeletonBlock width="100%" height={100} style={{ borderRadius: 14 }} />

      {/* 스탯 카드 4개 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
        {[...Array(4)].map((_, i) => <StatCardSkeleton key={i} />)}
      </div>

      {/* 2열 패널 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <SkeletonBlock width="100%" height={260} style={{ borderRadius: 14 }} />
        <SkeletonBlock width="100%" height={260} style={{ borderRadius: 14 }} />
      </div>

      {/* 추천 문제 */}
      <SkeletonBlock width="100%" height={180} style={{ borderRadius: 14 }} />
    </div>
  )
}

// ── 노트 목록 스켈레톤 ────────────────────────────────────────────────────────
export function NoteListSkeleton({ count = 6 }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 14 }}>
      {[...Array(count)].map((_, i) => <NoteCardSkeleton key={i} />)}
    </div>
  )
}
