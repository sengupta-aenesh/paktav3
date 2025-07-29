'use client'

import { createClient } from '@/lib/supabase/client'
import { RealtimeChannel } from '@supabase/supabase-js'
import { DocumentChange } from '@/lib/types/collaboration'

export interface ChangeEvent {
  id: string
  resource_type: 'contract' | 'template'
  resource_id: string
  user_id: string
  change_type: 'create' | 'update' | 'delete'
  field_name?: string
  old_value?: any
  new_value?: any
  metadata?: any
  created_at: string
}

export class ChangesManager {
  private channel: RealtimeChannel | null = null
  private supabase = createClient()
  private resourceType: 'contract' | 'template'
  private resourceId: string
  private changeCallbacks: Set<(change: ChangeEvent) => void> = new Set()
  private pendingChanges: Map<string, NodeJS.Timeout> = new Map()

  constructor(resourceType: 'contract' | 'template', resourceId: string) {
    this.resourceType = resourceType
    this.resourceId = resourceId
  }

  async subscribe() {
    // Create a channel for document changes using Broadcast instead of Postgres Changes
    this.channel = this.supabase
      .channel(`changes:${this.resourceType}:${this.resourceId}`)
      .on(
        'broadcast',
        {
          event: 'document_change'
        },
        (payload) => {
          this.handleChange(payload.payload as ChangeEvent)
        }
      )

    await this.channel.subscribe()
  }

  async unsubscribe() {
    if (this.channel) {
      await this.supabase.removeChannel(this.channel)
      this.channel = null
    }

    // Clear pending changes
    this.pendingChanges.forEach(timeout => clearTimeout(timeout))
    this.pendingChanges.clear()
  }

  async trackChange(change: Omit<ChangeEvent, 'id' | 'created_at'>) {
    try {
      // Save to database for persistence
      const { error } = await this.supabase
        .from('document_changes')
        .insert({
          ...change,
          resource_type: this.resourceType,
          resource_id: this.resourceId,
        })

      if (error) {
        console.error('Error tracking change:', error)
      }

      // Broadcast the change to other users in real-time
      if (this.channel) {
        const changeEvent: ChangeEvent = {
          ...change,
          id: crypto.randomUUID(),
          created_at: new Date().toISOString(),
        }
        
        await this.channel.send({
          type: 'broadcast',
          event: 'document_change',
          payload: changeEvent,
        })
      }
    } catch (error) {
      console.error('Failed to track change:', error)
    }
  }

  // Batch content changes to avoid overwhelming the system
  async trackContentChange(
    userId: string,
    oldContent: string,
    newContent: string,
    debounceMs: number = 1000
  ) {
    const changeKey = 'content'
    
    // Clear existing timeout for this field
    const existingTimeout = this.pendingChanges.get(changeKey)
    if (existingTimeout) {
      clearTimeout(existingTimeout)
    }

    // Set new timeout
    const timeout = setTimeout(() => {
      this.trackChange({
        user_id: userId,
        change_type: 'update',
        field_name: 'content',
        old_value: oldContent,
        new_value: newContent,
        metadata: {
          length_before: oldContent.length,
          length_after: newContent.length,
          diff_size: Math.abs(newContent.length - oldContent.length),
        },
      })
      
      this.pendingChanges.delete(changeKey)
    }, debounceMs)

    this.pendingChanges.set(changeKey, timeout)
  }

  async getRecentChanges(limit: number = 50): Promise<DocumentChange[]> {
    const { data, error } = await this.supabase
      .from('document_changes')
      .select(`
        *,
        user:profiles!document_changes_user_id_fkey(
          id,
          email,
          display_name,
          avatar_url,
          collaboration_color
        )
      `)
      .eq('resource_type', this.resourceType)
      .eq('resource_id', this.resourceId)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('Error fetching changes:', error)
      return []
    }

    return data || []
  }

  async getChangesSince(timestamp: string): Promise<DocumentChange[]> {
    const { data, error } = await this.supabase
      .from('document_changes')
      .select(`
        *,
        user:profiles!document_changes_user_id_fkey(
          id,
          email,
          display_name,
          avatar_url,
          collaboration_color
        )
      `)
      .eq('resource_type', this.resourceType)
      .eq('resource_id', this.resourceId)
      .gt('created_at', timestamp)
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Error fetching changes since timestamp:', error)
      return []
    }

    return data || []
  }

  onChange(callback: (change: ChangeEvent) => void) {
    this.changeCallbacks.add(callback)
    
    // Return unsubscribe function
    return () => {
      this.changeCallbacks.delete(callback)
    }
  }

  private handleChange(change: ChangeEvent) {
    // Skip if this is a change from the current user
    // (they already see their own changes immediately)
    this.changeCallbacks.forEach(callback => callback(change))
  }

  // Helper method to apply text changes with operational transform
  static applyTextChange(
    originalText: string,
    change: {
      type: 'insert' | 'delete'
      position: number
      text?: string
      length?: number
    }
  ): string {
    if (change.type === 'insert' && change.text) {
      return (
        originalText.slice(0, change.position) +
        change.text +
        originalText.slice(change.position)
      )
    } else if (change.type === 'delete' && change.length) {
      return (
        originalText.slice(0, change.position) +
        originalText.slice(change.position + change.length)
      )
    }
    
    return originalText
  }
}