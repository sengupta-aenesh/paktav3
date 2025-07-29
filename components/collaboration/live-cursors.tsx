'use client'

import { useEffect, useState, useRef } from 'react'
import { CollaboratorPresence } from '@/lib/types/collaboration'
import styles from './live-cursors.module.css'

interface LiveCursorsProps {
  collaborators: CollaboratorPresence[]
  containerRef?: React.RefObject<HTMLElement>
  showLabels?: boolean
}

interface CursorData {
  userId: string
  x: number
  y: number
  color: string
  name: string
  isTyping?: boolean
}

export default function LiveCursors({ 
  collaborators, 
  containerRef,
  showLabels = true 
}: LiveCursorsProps) {
  const [cursors, setCursors] = useState<Map<string, CursorData>>(new Map())
  const animationFrameRef = useRef<number>()

  useEffect(() => {
    const updateCursors = () => {
      const newCursors = new Map<string, CursorData>()

      collaborators.forEach(collaborator => {
        if (collaborator.cursor_position) {
          // For now, we'll use a simple position
          // In a real implementation, this would be converted from text position to screen coordinates
          const cursorData: CursorData = {
            userId: collaborator.user_id,
            x: 0, // This would be calculated based on cursor_position
            y: 0, // This would be calculated based on cursor_position
            color: collaborator.color,
            name: collaborator.profile.display_name || collaborator.profile.email.split('@')[0],
            isTyping: false, // This would come from presence state
          }

          newCursors.set(collaborator.user_id, cursorData)
        }
      })

      setCursors(newCursors)
    }

    // Update cursors with animation frame for smooth movement
    const animate = () => {
      updateCursors()
      animationFrameRef.current = requestAnimationFrame(animate)
    }

    animate()

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [collaborators])

  return (
    <div className={styles.cursorsContainer}>
      {Array.from(cursors.values()).map(cursor => (
        <div
          key={cursor.userId}
          className={styles.cursor}
          style={{
            transform: `translate(${cursor.x}px, ${cursor.y}px)`,
            '--cursor-color': cursor.color,
          } as React.CSSProperties}
        >
          <svg
            className={styles.cursorIcon}
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <path d="M4.5 2.5L20.5 9.5L13.5 12.5L10.5 19.5L4.5 2.5Z" />
          </svg>
          {showLabels && (
            <div className={styles.cursorLabel}>
              <span className={styles.cursorName}>{cursor.name}</span>
              {cursor.isTyping && (
                <span className={styles.typingIndicator}>
                  <span></span>
                  <span></span>
                  <span></span>
                </span>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}