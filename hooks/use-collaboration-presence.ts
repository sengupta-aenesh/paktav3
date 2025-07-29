'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { PresenceManager, PresenceState, CursorPosition } from '@/lib/collaboration/presence'
import { CollaboratorPresence } from '@/lib/types/collaboration'
import { RealtimePresenceState } from '@supabase/supabase-js'

interface UseCollaborationPresenceOptions {
  resourceType: 'contract' | 'template'
  resourceId: string
  userId: string
  userProfile: {
    email: string
    display_name?: string
    avatar_url?: string
    collaboration_color?: string
  }
  enabled?: boolean
}

export function useCollaborationPresence({
  resourceType,
  resourceId,
  userId,
  userProfile,
  enabled = true,
}: UseCollaborationPresenceOptions) {
  const [collaborators, setCollaborators] = useState<CollaboratorPresence[]>([])
  const [isConnected, setIsConnected] = useState(false)
  const presenceManagerRef = useRef<PresenceManager | null>(null)

  // Generate room name based on resource
  const roomName = `${resourceType}:${resourceId}`

  useEffect(() => {
    if (!enabled) return

    const initPresence = async () => {
      try {
        // Create presence manager
        const manager = new PresenceManager(roomName, userId, {
          email: userProfile.email,
          display_name: userProfile.display_name,
          avatar_url: userProfile.avatar_url,
          color: userProfile.collaboration_color || 'var(--collab-user-1)',
        })

        presenceManagerRef.current = manager

        // Set up presence update handler
        const unsubscribe = manager.onPresenceUpdate((state: RealtimePresenceState<PresenceState>) => {
          const collabs = manager.getCollaborators()
          setCollaborators(collabs)
        })

        // Join the room
        await manager.join()
        setIsConnected(true)

        // Cleanup function
        return () => {
          unsubscribe()
          manager.leave()
          setIsConnected(false)
        }
      } catch (error) {
        console.error('Error initializing presence:', error)
        setIsConnected(false)
      }
    }

    initPresence()

    return () => {
      if (presenceManagerRef.current) {
        presenceManagerRef.current.leave()
        presenceManagerRef.current = null
      }
    }
  }, [enabled, roomName, userId, userProfile])

  const updateCursor = useCallback((position: CursorPosition) => {
    presenceManagerRef.current?.updateCursor(position)
  }, [])

  const updateSelection = useCallback((selectionStart: number, selectionEnd: number) => {
    presenceManagerRef.current?.updateSelection(selectionStart, selectionEnd)
  }, [])

  const setTyping = useCallback((isTyping: boolean) => {
    presenceManagerRef.current?.setTyping(isTyping)
  }, [])

  const updateViewport = useCallback((scrollTop: number, scrollLeft: number) => {
    presenceManagerRef.current?.updateViewport(scrollTop, scrollLeft)
  }, [])

  return {
    collaborators,
    isConnected,
    updateCursor,
    updateSelection,
    setTyping,
    updateViewport,
  }
}