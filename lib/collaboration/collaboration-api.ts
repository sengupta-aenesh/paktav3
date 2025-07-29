'use client'

import { 
  ShareWithProfiles, 
  UserSearchResult, 
  ResourceAccess, 
  SharedResource,
  CommentWithProfile,
  CollaboratorPresence
} from '@/lib/types/collaboration'

export const collaborationApi = {
  // Shares
  async createShare(data: {
    resource_type: 'contract' | 'template' | 'folder' | 'template_folder'
    resource_id: string
    shared_with_email: string
    permission: 'view' | 'edit' | 'admin'
    expires_at?: string | null
  }) {
    const response = await fetch('/api/shares/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })
    
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to create share')
    }
    
    return response.json()
  },

  async getShares(resourceType: string, resourceId: string): Promise<ShareWithProfiles[]> {
    const response = await fetch(`/api/shares/${resourceType}/${resourceId}`)
    
    if (!response.ok) {
      throw new Error('Failed to fetch shares')
    }
    
    const data = await response.json()
    return data.shares || []
  },

  async updateShare(shareId: string, data: {
    permission?: 'view' | 'edit' | 'admin'
    expires_at?: string | null
  }) {
    const response = await fetch(`/api/shares/${shareId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })
    
    if (!response.ok) {
      throw new Error('Failed to update share')
    }
    
    return response.json()
  },

  async deleteShare(shareId: string) {
    const response = await fetch(`/api/shares/${shareId}`, {
      method: 'DELETE'
    })
    
    if (!response.ok) {
      throw new Error('Failed to delete share')
    }
    
    return response.json()
  },

  async searchUsers(query: string, resourceType?: string, resourceId?: string): Promise<UserSearchResult[]> {
    const params = new URLSearchParams({ q: query })
    if (resourceType) params.append('resourceType', resourceType)
    if (resourceId) params.append('resourceId', resourceId)
    
    const response = await fetch(`/api/shares/search-users?${params}`)
    
    if (!response.ok) {
      throw new Error('Failed to search users')
    }
    
    const data = await response.json()
    return data.users || []
  },

  // Access control
  async checkAccess(resourceType: string, resourceId: string): Promise<ResourceAccess> {
    const params = new URLSearchParams({
      resourceType,
      resourceId
    })
    
    const response = await fetch(`/api/collaboration/access-check?${params}`)
    
    if (!response.ok) {
      throw new Error('Failed to check access')
    }
    
    return response.json()
  },

  async getSharedWithMe(type?: string): Promise<SharedResource[]> {
    const params = new URLSearchParams()
    if (type) params.append('type', type)
    
    const response = await fetch(`/api/collaboration/shared-with-me?${params}`)
    
    if (!response.ok) {
      throw new Error('Failed to fetch shared resources')
    }
    
    const data = await response.json()
    return data.resources || []
  },

  async getMyShares(type?: string): Promise<ShareWithProfiles[]> {
    const params = new URLSearchParams()
    if (type) params.append('type', type)
    
    const response = await fetch(`/api/collaboration/my-shares?${params}`)
    
    if (!response.ok) {
      throw new Error('Failed to fetch my shares')
    }
    
    const data = await response.json()
    return data.shares || []
  },

  // Comments
  async createComment(data: {
    resource_type: 'contract' | 'template'
    resource_id: string
    content: string
    selection_start?: number | null
    selection_end?: number | null
    parent_id?: string | null
  }) {
    const response = await fetch('/api/comments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })
    
    if (!response.ok) {
      throw new Error('Failed to create comment')
    }
    
    return response.json()
  },

  async getComments(
    resourceType: string, 
    resourceId: string, 
    includeResolved = false
  ): Promise<CommentWithProfile[]> {
    const params = new URLSearchParams()
    if (includeResolved) params.append('includeResolved', 'true')
    
    const response = await fetch(`/api/comments/${resourceType}/${resourceId}?${params}`)
    
    if (!response.ok) {
      throw new Error('Failed to fetch comments')
    }
    
    const data = await response.json()
    return data.comments || []
  },

  async updateComment(commentId: string, data: {
    content?: string
    resolved?: boolean
  }) {
    const response = await fetch(`/api/comments/${commentId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })
    
    if (!response.ok) {
      throw new Error('Failed to update comment')
    }
    
    return response.json()
  },

  async deleteComment(commentId: string) {
    const response = await fetch(`/api/comments/${commentId}`, {
      method: 'DELETE'
    })
    
    if (!response.ok) {
      throw new Error('Failed to delete comment')
    }
    
    return response.json()
  },

  // Helper to get collaborators for a resource
  async getCollaborators(resourceType: string, resourceId: string): Promise<CollaboratorPresence[]> {
    try {
      const shares = await this.getShares(resourceType, resourceId)
      
      // Convert shares to collaborator presence format
      // In a real implementation, this would fetch actual presence data
      return shares.map((share, index) => ({
        user_id: share.shared_with,
        profile: {
          id: share.shared_with,
          email: share.shared_with_profile?.email || '',
          display_name: share.shared_with_profile?.display_name || null,
          avatar_url: share.shared_with_profile?.avatar_url || null,
          collaboration_color: share.shared_with_profile?.collaboration_color || 
            `var(--collab-user-${(index % 8) + 1})`
        },
        color: share.shared_with_profile?.collaboration_color || 
          `var(--collab-user-${(index % 8) + 1})`,
        last_seen: new Date().toISOString()
      }))
    } catch (error) {
      console.error('Error fetching collaborators:', error)
      return []
    }
  }
}