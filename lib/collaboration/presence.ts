'use client'

import { createClient } from '@/lib/supabase/client'
import { RealtimeChannel, RealtimePresenceState } from '@supabase/supabase-js'
import { CollaboratorPresence } from '@/lib/types/collaboration'

export interface CursorPosition {
  x: number
  y: number
  elementId?: string
  selectionStart?: number
  selectionEnd?: number
}

export interface PresenceState {
  user_id: string
  email: string
  display_name?: string
  avatar_url?: string
  color: string
  cursor_position?: CursorPosition
  last_seen: string
  is_typing?: boolean
  viewport?: {
    scrollTop: number
    scrollLeft: number
  }
}

export class PresenceManager {
  private channel: RealtimeChannel | null = null
  private supabase = createClient()
  private roomName: string
  private userId: string
  private userProfile: {
    email: string
    display_name?: string
    avatar_url?: string
    color: string
  }
  private updateCallbacks: Set<(state: RealtimePresenceState<PresenceState>) => void> = new Set()
  private cursorThrottle: NodeJS.Timeout | null = null
  private typingTimeout: NodeJS.Timeout | null = null

  constructor(
    roomName: string,
    userId: string,
    userProfile: {
      email: string
      display_name?: string
      avatar_url?: string
      color: string
    }
  ) {
    this.roomName = roomName
    this.userId = userId
    this.userProfile = userProfile
  }

  async join() {
    // Create channel with presence configuration
    this.channel = this.supabase.channel(this.roomName, {
      config: {
        presence: {
          key: this.userId,
        },
      },
    })

    // Set up presence event handlers
    this.channel
      .on('presence', { event: 'sync' }, () => {
        const state = this.channel?.presenceState<PresenceState>()
        if (state) {
          this.notifyCallbacks(state)
        }
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        const state = this.channel?.presenceState<PresenceState>()
        if (state) {
          this.notifyCallbacks(state)
        }
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        const state = this.channel?.presenceState<PresenceState>()
        if (state) {
          this.notifyCallbacks(state)
        }
      })

    // Subscribe to the channel
    await this.channel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        // Track initial presence
        await this.updatePresence({
          user_id: this.userId,
          email: this.userProfile.email,
          display_name: this.userProfile.display_name,
          avatar_url: this.userProfile.avatar_url,
          color: this.userProfile.color,
          last_seen: new Date().toISOString(),
        })
      }
    })
  }

  async leave() {
    if (this.channel) {
      await this.channel.untrack()
      await this.supabase.removeChannel(this.channel)
      this.channel = null
    }
    
    // Clear timeouts
    if (this.cursorThrottle) {
      clearTimeout(this.cursorThrottle)
    }
    if (this.typingTimeout) {
      clearTimeout(this.typingTimeout)
    }
  }

  async updatePresence(state: Partial<PresenceState>) {
    if (!this.channel) return

    const currentState = await this.getCurrentState()
    const newState: PresenceState = {
      ...currentState,
      ...state,
      user_id: this.userId,
      last_seen: new Date().toISOString(),
    }

    await this.channel.track(newState)
  }

  updateCursor(position: CursorPosition) {
    // Throttle cursor updates to avoid overwhelming the system
    if (this.cursorThrottle) {
      clearTimeout(this.cursorThrottle)
    }

    this.cursorThrottle = setTimeout(() => {
      this.updatePresence({
        cursor_position: position,
      })
    }, 50) // Update at most every 50ms
  }

  updateSelection(selectionStart: number, selectionEnd: number) {
    this.updatePresence({
      cursor_position: {
        ...this.getCurrentState().cursor_position || { x: 0, y: 0 },
        selectionStart,
        selectionEnd,
      },
    })
  }

  setTyping(isTyping: boolean) {
    // Clear existing typing timeout
    if (this.typingTimeout) {
      clearTimeout(this.typingTimeout)
    }

    this.updatePresence({ is_typing: isTyping })

    // Auto-clear typing indicator after 3 seconds
    if (isTyping) {
      this.typingTimeout = setTimeout(() => {
        this.updatePresence({ is_typing: false })
      }, 3000)
    }
  }

  updateViewport(scrollTop: number, scrollLeft: number) {
    this.updatePresence({
      viewport: { scrollTop, scrollLeft },
    })
  }

  onPresenceUpdate(callback: (state: RealtimePresenceState<PresenceState>) => void) {
    this.updateCallbacks.add(callback)
    
    // Return unsubscribe function
    return () => {
      this.updateCallbacks.delete(callback)
    }
  }

  getPresenceState(): RealtimePresenceState<PresenceState> {
    return this.channel?.presenceState<PresenceState>() || {}
  }

  getCollaborators(): CollaboratorPresence[] {
    const state = this.getPresenceState()
    
    return Object.entries(state)
      .filter(([key]) => key !== this.userId) // Exclude self
      .map(([key, presences]) => {
        const presence = presences[0] // Take first presence if multiple
        return {
          user_id: presence.user_id,
          profile: {
            id: presence.user_id,
            email: presence.email,
            display_name: presence.display_name || null,
            avatar_url: presence.avatar_url || null,
            collaboration_color: presence.color,
          },
          cursor_position: presence.cursor_position?.selectionStart,
          selection: presence.cursor_position?.selectionStart && presence.cursor_position?.selectionEnd
            ? {
                start: presence.cursor_position.selectionStart,
                end: presence.cursor_position.selectionEnd,
              }
            : undefined,
          color: presence.color,
          last_seen: presence.last_seen,
        }
      })
  }

  private getCurrentState(): PresenceState {
    const state = this.getPresenceState()
    const myPresence = state[this.userId]?.[0]
    
    return myPresence || {
      user_id: this.userId,
      email: this.userProfile.email,
      display_name: this.userProfile.display_name,
      avatar_url: this.userProfile.avatar_url,
      color: this.userProfile.color,
      last_seen: new Date().toISOString(),
    }
  }

  private notifyCallbacks(state: RealtimePresenceState<PresenceState>) {
    this.updateCallbacks.forEach(callback => callback(state))
  }
}