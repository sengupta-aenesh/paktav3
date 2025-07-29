'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { ChangesManager, ChangeEvent } from '@/lib/collaboration/changes'
import { DocumentChange } from '@/lib/types/collaboration'

interface UseDocumentChangesOptions {
  resourceType: 'contract' | 'template'
  resourceId: string
  userId: string
  enabled?: boolean
  onRemoteChange?: (change: ChangeEvent) => void
}

export function useDocumentChanges({
  resourceType,
  resourceId,
  userId,
  enabled = true,
  onRemoteChange,
}: UseDocumentChangesOptions) {
  const [recentChanges, setRecentChanges] = useState<DocumentChange[]>([])
  const [isSubscribed, setIsSubscribed] = useState(false)
  const changesManagerRef = useRef<ChangesManager | null>(null)
  const lastContentRef = useRef<string>('')

  useEffect(() => {
    if (!enabled) return

    const initChanges = async () => {
      try {
        // Create changes manager
        const manager = new ChangesManager(resourceType, resourceId)
        changesManagerRef.current = manager

        // Set up change handler
        const unsubscribe = manager.onChange((change: ChangeEvent) => {
          // Only process changes from other users
          if (change.user_id !== userId) {
            onRemoteChange?.(change)
            
            // Refresh recent changes list
            loadRecentChanges()
          }
        })

        // Subscribe to changes
        await manager.subscribe()
        setIsSubscribed(true)

        // Load initial recent changes
        await loadRecentChanges()

        // Cleanup function
        return () => {
          unsubscribe()
          manager.unsubscribe()
          setIsSubscribed(false)
        }
      } catch (error) {
        console.error('Error initializing document changes:', error)
        setIsSubscribed(false)
      }
    }

    const loadRecentChanges = async () => {
      if (changesManagerRef.current) {
        const changes = await changesManagerRef.current.getRecentChanges()
        setRecentChanges(changes)
      }
    }

    initChanges()

    return () => {
      if (changesManagerRef.current) {
        changesManagerRef.current.unsubscribe()
        changesManagerRef.current = null
      }
    }
  }, [enabled, resourceType, resourceId, userId, onRemoteChange])

  const trackChange = useCallback(async (
    change: Omit<ChangeEvent, 'id' | 'created_at' | 'resource_type' | 'resource_id' | 'user_id'>
  ) => {
    if (changesManagerRef.current) {
      await changesManagerRef.current.trackChange({
        ...change,
        user_id: userId,
      })
    }
  }, [userId])

  const trackContentChange = useCallback((newContent: string, debounceMs: number = 1000) => {
    if (changesManagerRef.current) {
      changesManagerRef.current.trackContentChange(
        userId,
        lastContentRef.current,
        newContent,
        debounceMs
      )
      lastContentRef.current = newContent
    }
  }, [userId])

  const trackFieldChange = useCallback(async (
    fieldName: string,
    oldValue: any,
    newValue: any
  ) => {
    await trackChange({
      change_type: 'update',
      field_name: fieldName,
      old_value: oldValue,
      new_value: newValue,
    })
  }, [trackChange])

  const refreshChanges = useCallback(async () => {
    if (changesManagerRef.current) {
      const changes = await changesManagerRef.current.getRecentChanges()
      setRecentChanges(changes)
    }
  }, [])

  return {
    recentChanges,
    isSubscribed,
    trackChange,
    trackContentChange,
    trackFieldChange,
    refreshChanges,
  }
}