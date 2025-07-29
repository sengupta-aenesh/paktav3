'use client'

import { useState, useEffect } from 'react'
import { useEnhancedNotifications } from '@/components/notifications/notification.hooks'
import styles from './share-modal.module.css'
import { ShareWithProfiles, UserSearchResult } from '@/lib/types/collaboration'

interface ShareModalProps {
  isOpen: boolean
  onClose: () => void
  resourceType: 'contract' | 'template' | 'folder' | 'template_folder'
  resourceId: string
  resourceTitle: string
  currentUserId: string
}

export default function ShareModal({
  isOpen,
  onClose,
  resourceType,
  resourceId,
  resourceTitle,
  currentUserId
}: ShareModalProps) {
  const [email, setEmail] = useState('')
  const [permission, setPermission] = useState<'view' | 'edit' | 'admin'>('view')
  const [searchResults, setSearchResults] = useState<UserSearchResult[]>([])
  const [shares, setShares] = useState<ShareWithProfiles[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [showResults, setShowResults] = useState(false)
  
  const notifications = useEnhancedNotifications()

  useEffect(() => {
    if (isOpen) {
      fetchShares()
    }
  }, [isOpen, resourceType, resourceId])

  useEffect(() => {
    const delaySearch = setTimeout(() => {
      if (email.length >= 2) {
        searchUsers()
      } else {
        setSearchResults([])
        setShowResults(false)
      }
    }, 300)

    return () => clearTimeout(delaySearch)
  }, [email])

  const fetchShares = async () => {
    try {
      const { collaborationApi } = await import('@/lib/collaboration/collaboration-api')
      const shares = await collaborationApi.getShares(resourceType, resourceId)
      setShares(shares)
    } catch (error) {
      console.error('Error fetching shares:', error)
      notifications.error('Error', 'Failed to load collaborators')
    }
  }

  const searchUsers = async () => {
    setIsSearching(true)
    try {
      const response = await fetch(
        `/api/shares/search-users?q=${encodeURIComponent(email)}&resourceType=${resourceType}&resourceId=${resourceId}`
      )
      if (!response.ok) throw new Error('Failed to search users')
      
      const data = await response.json()
      setSearchResults(data.users || [])
      setShowResults(true)
    } catch (error) {
      console.error('Error searching users:', error)
    } finally {
      setIsSearching(false)
    }
  }

  const handleShare = async (userEmail?: string) => {
    const targetEmail = userEmail || email
    if (!targetEmail) return

    setIsLoading(true)
    try {
      const { collaborationApi } = await import('@/lib/collaboration/collaboration-api')
      await collaborationApi.createShare({
        resource_type: resourceType,
        resource_id: resourceId,
        shared_with_email: targetEmail,
        permission,
        expires_at: null
      })

      notifications.success('Success', `Shared with ${targetEmail}`)
      setEmail('')
      setShowResults(false)
      fetchShares()
    } catch (error: any) {
      notifications.error('Error', error.message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleUpdatePermission = async (shareId: string, newPermission: 'view' | 'edit' | 'admin') => {
    try {
      const { collaborationApi } = await import('@/lib/collaboration/collaboration-api')
      await collaborationApi.updateShare(shareId, {
        permission: newPermission
      })

      notifications.success('Success', 'Permission updated')
      fetchShares()
    } catch (error) {
      notifications.error('Error', 'Failed to update permission')
    }
  }

  const handleRemoveShare = async (shareId: string) => {
    if (!confirm('Are you sure you want to remove this collaborator?')) return

    try {
      const { collaborationApi } = await import('@/lib/collaboration/collaboration-api')
      await collaborationApi.deleteShare(shareId)

      notifications.success('Success', 'Collaborator removed')
      fetchShares()
    } catch (error) {
      notifications.error('Error', 'Failed to remove collaborator')
    }
  }

  const copyShareLink = async () => {
    const shareLink = `${window.location.origin}/collaboration/${resourceType}/${resourceId}`
    try {
      await navigator.clipboard.writeText(shareLink)
      notifications.success('Success', 'Share link copied to clipboard')
    } catch (error) {
      notifications.error('Error', 'Failed to copy link')
    }
  }

  if (!isOpen) return null

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2>Share "{resourceTitle}"</h2>
          <button className={styles.closeButton} onClick={onClose}>×</button>
        </div>

        <div className={styles.modalContent}>
          {/* Add collaborator section */}
          <div className={styles.addSection}>
            <div className={styles.inputGroup}>
              <div className={styles.searchContainer}>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter email to share"
                  className={styles.emailInput}
                  disabled={isLoading}
                />
                {isSearching && <div className={styles.searchSpinner}></div>}
                
                {showResults && searchResults.length > 0 && (
                  <div className={styles.searchResults}>
                    {searchResults.map((user) => (
                      <div
                        key={user.id}
                        className={styles.searchResult}
                        onClick={() => {
                          if (!user.isAlreadyShared) {
                            handleShare(user.email)
                          }
                        }}
                      >
                        <div className={styles.userInfo}>
                          <div className={styles.userAvatar}>
                            {user.display_name?.[0] || user.email[0].toUpperCase()}
                          </div>
                          <div>
                            <div className={styles.userName}>
                              {user.display_name || user.email}
                            </div>
                            <div className={styles.userEmail}>{user.email}</div>
                          </div>
                        </div>
                        {user.isAlreadyShared && (
                          <span className={styles.alreadyShared}>
                            Already shared ({user.currentPermission})
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <select
                value={permission}
                onChange={(e) => setPermission(e.target.value as 'view' | 'edit' | 'admin')}
                className={styles.permissionSelect}
                disabled={isLoading}
              >
                <option value="view">Can view</option>
                <option value="edit">Can edit</option>
                <option value="admin">Admin</option>
              </select>

              <button
                onClick={() => handleShare()}
                className={styles.shareButton}
                disabled={!email || isLoading}
              >
                {isLoading ? 'Sharing...' : 'Share'}
              </button>
            </div>
          </div>

          {/* Current collaborators */}
          <div className={styles.collaboratorsList}>
            <h3>People with access</h3>
            
            {shares.length === 0 ? (
              <p className={styles.noCollaborators}>No collaborators yet</p>
            ) : (
              shares.map((share) => (
                <div key={share.id} className={styles.collaboratorItem}>
                  <div className={styles.collaboratorInfo}>
                    <div 
                      className={styles.collaboratorAvatar}
                      style={{ 
                        borderColor: share.shared_with_profile?.collaboration_color || 'var(--color-border)'
                      }}
                    >
                      {share.shared_with_profile?.display_name?.[0] || 
                       share.shared_with_profile?.email?.[0].toUpperCase()}
                    </div>
                    <div>
                      <div className={styles.collaboratorName}>
                        {share.shared_with_profile?.display_name || share.shared_with_profile?.email}
                      </div>
                      <div className={styles.collaboratorEmail}>
                        {share.shared_with_profile?.email}
                      </div>
                    </div>
                  </div>

                  <div className={styles.collaboratorActions}>
                    <select
                      value={share.permission}
                      onChange={(e) => handleUpdatePermission(share.id, e.target.value as any)}
                      className={styles.permissionSelect}
                    >
                      <option value="view">Can view</option>
                      <option value="edit">Can edit</option>
                      <option value="admin">Admin</option>
                    </select>
                    
                    <button
                      onClick={() => handleRemoveShare(share.id)}
                      className={styles.removeButton}
                      title="Remove access"
                    >
                      ×
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Copy link section */}
          <div className={styles.linkSection}>
            <button onClick={copyShareLink} className={styles.copyLinkButton}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
              </svg>
              Copy share link
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}