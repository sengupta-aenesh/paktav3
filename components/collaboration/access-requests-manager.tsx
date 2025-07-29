'use client'

import { useState, useEffect } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { Button } from '@/components/ui'
import { useEnhancedNotifications } from '@/components/notifications/notification.hooks'
import styles from './access-requests-manager.module.css'

interface AccessRequest {
  id: string
  resource_type: 'contract' | 'template' | 'folder' | 'template_folder'
  resource_id: string
  resource_owner: string
  requested_by: string
  requested_permission: 'view' | 'edit'
  message?: string
  status: 'pending' | 'approved' | 'denied'
  created_at: string
  updated_at: string
  requested_by_profile?: {
    id: string
    email: string
    display_name?: string
    avatar_url?: string
  }
  resource?: {
    id: string
    title?: string
    name?: string
  }
}

interface AccessRequestsManagerProps {
  userId: string
  onRequestHandled?: () => void
}

export default function AccessRequestsManager({
  userId,
  onRequestHandled,
}: AccessRequestsManagerProps) {
  const [requests, setRequests] = useState<AccessRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [processingId, setProcessingId] = useState<string | null>(null)
  const [filter, setFilter] = useState<'pending' | 'all'>('pending')
  const notifications = useEnhancedNotifications()

  useEffect(() => {
    loadRequests()
  }, [userId, filter])

  async function loadRequests() {
    try {
      const params = new URLSearchParams({ status: filter === 'pending' ? 'pending' : '' })
      const response = await fetch(`/api/collaboration/request-access?${params}`)
      
      if (!response.ok) {
        throw new Error('Failed to load access requests')
      }
      
      const data = await response.json()
      setRequests(data.requests || [])
    } catch (error) {
      console.error('Error loading access requests:', error)
      notifications.error('Failed to load access requests')
    } finally {
      setLoading(false)
    }
  }

  async function handleRequest(requestId: string, action: 'approve' | 'deny') {
    setProcessingId(requestId)
    
    try {
      const request = requests.find(r => r.id === requestId)
      if (!request) return
      
      const response = await fetch(`/api/collaboration/request-access/${requestId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: action === 'approve' ? 'approved' : 'denied',
          permission: action === 'approve' ? request.requested_permission : null,
        }),
      })
      
      if (!response.ok) {
        throw new Error(`Failed to ${action} request`)
      }
      
      notifications.success(
        action === 'approve' ? 'Access Granted' : 'Access Denied',
        `Request ${action === 'approve' ? 'approved' : 'denied'} successfully`
      )
      
      // Reload requests
      await loadRequests()
      onRequestHandled?.()
    } catch (error) {
      console.error(`Error ${action}ing request:`, error)
      notifications.error('Operation Failed', `Failed to ${action} request`)
    } finally {
      setProcessingId(null)
    }
  }

  function getResourceTypeLabel(type: AccessRequest['resource_type']) {
    switch (type) {
      case 'contract':
        return 'Contract'
      case 'template':
        return 'Template'
      case 'folder':
        return 'Folder'
      case 'template_folder':
        return 'Template Folder'
    }
  }

  function getResourceTitle(request: AccessRequest) {
    return request.resource?.title || request.resource?.name || 'Untitled'
  }

  if (loading) {
    return (
      <div className={styles.loading}>
        <div className="spinner"></div>
      </div>
    )
  }

  const pendingRequests = requests.filter(r => r.status === 'pending')
  const processedRequests = requests.filter(r => r.status !== 'pending')

  return (
    <div className={styles.accessRequestsManager}>
      <div className={styles.header}>
        <h3 className={styles.title}>Access Requests</h3>
        <div className={styles.filterButtons}>
          <button
            className={`${styles.filterButton} ${filter === 'pending' ? styles.active : ''}`}
            onClick={() => setFilter('pending')}
          >
            Pending ({pendingRequests.length})
          </button>
          <button
            className={`${styles.filterButton} ${filter === 'all' ? styles.active : ''}`}
            onClick={() => setFilter('all')}
          >
            All Requests
          </button>
        </div>
      </div>

      <div className={styles.requestsList}>
        {requests.length === 0 ? (
          <div className={styles.emptyState}>
            <svg 
              className={styles.emptyStateIcon}
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
              strokeWidth="1.5"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <p className={styles.emptyStateText}>
              {filter === 'pending' ? 'No pending access requests' : 'No access requests yet'}
            </p>
          </div>
        ) : (
          requests.map(request => (
            <div key={request.id} className={styles.requestCard}>
              <div className={styles.requestHeader}>
                <div className={styles.requesterInfo}>
                  <div 
                    className={styles.requesterAvatar}
                    style={{ 
                      backgroundColor: '#' + request.requested_by.substring(0, 6).padEnd(6, '0')
                    }}
                  >
                    {request.requested_by_profile?.display_name?.[0] || 
                     request.requested_by_profile?.email[0] || '?'}
                  </div>
                  <div>
                    <div className={styles.requesterName}>
                      {request.requested_by_profile?.display_name || 
                       request.requested_by_profile?.email.split('@')[0]}
                    </div>
                    <div className={styles.requesterEmail}>
                      {request.requested_by_profile?.email}
                    </div>
                  </div>
                </div>
                
                <div className={styles.requestTime}>
                  {formatDistanceToNow(new Date(request.created_at), { addSuffix: true })}
                </div>
              </div>

              <div className={styles.requestDetails}>
                <div className={styles.resourceInfo}>
                  <span className={styles.resourceType}>
                    {getResourceTypeLabel(request.resource_type)}:
                  </span>
                  <span className={styles.resourceTitle}>
                    {getResourceTitle(request)}
                  </span>
                </div>
                
                <div className={styles.permissionBadge}>
                  Requesting {request.requested_permission} access
                </div>
                
                {request.message && (
                  <div className={styles.requestMessage}>
                    <p className={styles.messageLabel}>Message:</p>
                    <p className={styles.messageText}>{request.message}</p>
                  </div>
                )}
              </div>

              <div className={styles.requestActions}>
                {request.status === 'pending' ? (
                  <>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleRequest(request.id, 'deny')}
                      disabled={processingId === request.id}
                    >
                      Deny
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleRequest(request.id, 'approve')}
                      disabled={processingId === request.id}
                    >
                      {processingId === request.id ? 'Processing...' : 'Approve'}
                    </Button>
                  </>
                ) : (
                  <div className={`${styles.statusBadge} ${styles[request.status]}`}>
                    {request.status === 'approved' ? '✓ Approved' : '✗ Denied'}
                    <span className={styles.statusTime}>
                      {formatDistanceToNow(new Date(request.updated_at), { addSuffix: true })}
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}