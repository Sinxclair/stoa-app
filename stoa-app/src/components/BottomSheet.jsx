import { useRef, useState, useEffect } from 'react'

/**
 * Draggable bottom sheet.
 * Props:
 *   expanded: boolean — controlled expansion state
 *   onToggle: fn — called when user taps handle or drags
 *   children: React nodes shown inside the sheet
 */
export default function BottomSheet({ expanded, onToggle, children }) {
  const sheetRef = useRef(null)
  const startYRef = useRef(null)
  const [dragging, setDragging] = useState(false)

  // Touch drag handling
  function onTouchStart(e) {
    startYRef.current = e.touches[0].clientY
    setDragging(true)
  }

  function onTouchEnd(e) {
    if (!dragging || startYRef.current === null) return
    const delta = e.changedTouches[0].clientY - startYRef.current
    if (delta < -60 && !expanded) onToggle()   // swipe up → expand
    if (delta > 60 && expanded) onToggle()     // swipe down → collapse
    startYRef.current = null
    setDragging(false)
  }

  return (
    <div
      ref={sheetRef}
      className={`absolute bottom-0 left-0 right-0 z-20 flex flex-col transition-transform duration-300 ease-out ${
        expanded ? 'translate-y-0' : 'translate-y-[calc(100%-220px)]'
      }`}
      style={{ maxHeight: 'calc(100% - 120px)', minHeight: '220px' }}
    >
      {/* Handle zone */}
      <div
        className="flex-shrink-0 bg-cream rounded-t-[32px] pt-4 pb-0 border-t border-primary/5 shadow-[0_-10px_40px_rgba(0,0,0,0.05)] cursor-grab"
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
        onClick={onToggle}
      >
        <div className="w-12 h-1.5 bg-primary/10 rounded-full mx-auto mb-4" />
        <div className="flex justify-between items-center px-6 pb-2">
          <h2 className="text-xl font-display font-black text-primary tracking-tight">Explore STOA</h2>
          <span className={`material-symbols-outlined text-primary/40 transition-transform ${expanded ? 'rotate-180' : ''}`}>
            expand_less
          </span>
        </div>
      </div>

      {/* Scrollable content */}
      <div
        className="flex-1 bg-cream overflow-y-auto px-5 pb-28"
        style={{ scrollbarWidth: 'none' }}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        {children}
      </div>
    </div>
  )
}
