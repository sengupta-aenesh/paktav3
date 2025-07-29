'use client'

import { useEffect, useRef, ReactNode } from 'react'
import { CursorPosition } from '@/lib/collaboration/presence'

interface CollaborativeEditorWrapperProps {
  children: ReactNode
  onCursorMove?: (position: CursorPosition) => void
  onTextSelect?: (start: number, end: number) => void
  isEnabled?: boolean
}

export default function CollaborativeEditorWrapper({
  children,
  onCursorMove,
  onTextSelect,
  isEnabled = true,
}: CollaborativeEditorWrapperProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const lastCursorPosition = useRef<CursorPosition | null>(null)

  useEffect(() => {
    if (!isEnabled || !containerRef.current) return

    const container = containerRef.current

    // Track mouse movement
    const handleMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect()
      const position: CursorPosition = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      }

      // Only update if position changed significantly (throttling)
      if (
        !lastCursorPosition.current ||
        Math.abs(position.x - lastCursorPosition.current.x) > 5 ||
        Math.abs(position.y - lastCursorPosition.current.y) > 5
      ) {
        lastCursorPosition.current = position
        onCursorMove?.(position)
      }
    }

    // Track text selection
    const handleSelectionChange = () => {
      const selection = window.getSelection()
      if (!selection || selection.rangeCount === 0) return

      const range = selection.getRangeAt(0)
      
      // Check if selection is within our container
      if (!container.contains(range.commonAncestorContainer)) return

      // Get text positions (simplified - in real implementation, you'd calculate actual text offsets)
      const startOffset = range.startOffset
      const endOffset = range.endOffset

      if (startOffset !== endOffset) {
        onTextSelect?.(startOffset, endOffset)
      }
    }

    // Add event listeners
    container.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('selectionchange', handleSelectionChange)

    return () => {
      container.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('selectionchange', handleSelectionChange)
    }
  }, [isEnabled, onCursorMove, onTextSelect])

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '100%', height: '100%' }}>
      {children}
    </div>
  )
}