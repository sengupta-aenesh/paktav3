'use client'

import { useState, useEffect } from 'react'
import { DocumentChange } from '@/lib/types/collaboration'
import { ChangesManager } from '@/lib/collaboration/changes'
import { formatDistanceToNow } from 'date-fns'
import { Button } from '@/components/ui'
import { useEnhancedNotifications } from '@/components/notifications/notification.hooks'
import styles from './track-changes.module.css'

interface TrackChangesProps {
  resourceType: 'contract' | 'template'
  resourceId: string
  currentUserId: string
  onRestoreVersion?: (change: DocumentChange) => void
}

type FilterType = 'all' | 'content' | 'metadata'
type TimeFilter = 'all' | 'today' | 'week' | 'month'

export default function TrackChanges({
  resourceType,
  resourceId,
  currentUserId,
  onRestoreVersion,
}: TrackChangesProps) {
  const [changes, setChanges] = useState<DocumentChange[]>([])
  const [loading, setLoading] = useState(true)
  const [filterType, setFilterType] = useState<FilterType>('all')
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('all')
  const [selectedUser, setSelectedUser] = useState<string>('all')
  const [expandedChanges, setExpandedChanges] = useState<Set<string>>(new Set())
  const notifications = useEnhancedNotifications()

  useEffect(() => {
    loadChanges()
  }, [resourceType, resourceId])

  async function loadChanges() {
    try {
      const changesManager = new ChangesManager(resourceType, resourceId)
      const recentChanges = await changesManager.getRecentChanges(100)
      setChanges(recentChanges)
    } catch (error) {
      console.error('Error loading changes:', error)
      notifications.error('Failed to load change history')
    } finally {
      setLoading(false)
    }
  }

  function filterChanges() {
    let filtered = [...changes]

    // Filter by type
    if (filterType !== 'all') {
      filtered = filtered.filter(change => {
        if (filterType === 'content') {
          return change.field_name === 'content'
        } else if (filterType === 'metadata') {
          return change.field_name !== 'content'
        }
        return true
      })
    }

    // Filter by time
    if (timeFilter !== 'all') {
      const now = new Date()
      const cutoff = new Date()
      
      switch (timeFilter) {
        case 'today':
          cutoff.setHours(0, 0, 0, 0)
          break
        case 'week':
          cutoff.setDate(now.getDate() - 7)
          break
        case 'month':
          cutoff.setMonth(now.getMonth() - 1)
          break
      }
      
      filtered = filtered.filter(change => 
        new Date(change.created_at) >= cutoff
      )
    }

    // Filter by user
    if (selectedUser !== 'all') {
      filtered = filtered.filter(change => change.user_id === selectedUser)
    }

    return filtered
  }

  function toggleExpanded(changeId: string) {
    const newExpanded = new Set(expandedChanges)
    if (newExpanded.has(changeId)) {
      newExpanded.delete(changeId)
    } else {
      newExpanded.add(changeId)
    }
    setExpandedChanges(newExpanded)
  }

  function getChangeIcon(changeType: string) {
    switch (changeType) {
      case 'create':
        return (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="12" y1="5" x2="12" y2="19"/>
            <line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
        )
      case 'update':
        return (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="16 3 21 3 21 8"/>
            <line x1="4" y1="20" x2="21" y2="3"/>
            <polyline points="21 16 21 21 16 21"/>
            <line x1="15" y1="15" x2="21" y2="21"/>
          </svg>
        )
      case 'delete':
        return (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="3 6 5 6 21 6"/>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
          </svg>
        )
      default:
        return null
    }
  }

  function formatFieldName(fieldName?: string) {
    if (!fieldName) return 'Document'
    
    return fieldName
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  }

  function renderDiff(change: DocumentChange) {
    if (!change.old_value && !change.new_value) return null
    
    if (change.field_name === 'content') {
      // For content changes, show character count difference
      const oldLength = change.old_value?.length || 0
      const newLength = change.new_value?.length || 0
      const diff = newLength - oldLength
      
      return (
        <div className={styles.contentDiff}>
          <div className={styles.diffStat}>
            <span className={styles.diffLabel}>Characters:</span>
            <span className={diff > 0 ? styles.diffAdded : styles.diffRemoved}>
              {diff > 0 ? '+' : ''}{diff}
            </span>
          </div>
          {change.metadata?.diff_size && (
            <div className={styles.diffStat}>
              <span className={styles.diffLabel}>Changes:</span>
              <span>{change.metadata.diff_size} characters</span>
            </div>
          )}
        </div>
      )
    } else {
      // For other fields, show old and new values
      return (
        <div className={styles.valueDiff}>
          {change.old_value && (
            <div className={styles.oldValue}>
              <span className={styles.diffLabel}>From:</span>
              <span>{String(change.old_value)}</span>
            </div>
          )}
          {change.new_value && (
            <div className={styles.newValue}>
              <span className={styles.diffLabel}>To:</span>
              <span>{String(change.new_value)}</span>
            </div>
          )}
        </div>
      )
    }
  }

  if (loading) {
    return (
      <div className={styles.loading}>
        <div className="spinner"></div>
      </div>
    )
  }

  const filteredChanges = filterChanges()
  const uniqueUsers = Array.from(new Set(changes.map(c => c.user_id)))

  return (
    <div className={styles.trackChanges}>
      <div className={styles.header}>
        <h3 className={styles.title}>Track Changes</h3>
        <div className={styles.filters}>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as FilterType)}
            className={styles.filterSelect}
          >
            <option value="all">All Changes</option>
            <option value="content">Content Only</option>
            <option value="metadata">Metadata Only</option>
          </select>
          
          <select
            value={timeFilter}
            onChange={(e) => setTimeFilter(e.target.value as TimeFilter)}
            className={styles.filterSelect}
          >
            <option value="all">All Time</option>
            <option value="today">Today</option>
            <option value="week">Last 7 Days</option>
            <option value="month">Last Month</option>
          </select>
          
          {uniqueUsers.length > 1 && (
            <select
              value={selectedUser}
              onChange={(e) => setSelectedUser(e.target.value)}
              className={styles.filterSelect}
            >
              <option value="all">All Users</option>
              {changes
                .filter((change, index, self) => 
                  index === self.findIndex(c => c.user_id === change.user_id)
                )
                .map(change => (
                  <option key={change.user_id} value={change.user_id}>
                    {change.user?.display_name || change.user?.email.split('@')[0]}
                  </option>
                ))
              }
            </select>
          )}
        </div>
      </div>

      <div className={styles.changesList}>
        {filteredChanges.length === 0 ? (
          <div className={styles.emptyState}>
            <p>No changes found</p>
            <p className={styles.emptyStateHint}>
              Changes will appear here as the document is edited
            </p>
          </div>
        ) : (
          filteredChanges.map(change => {
            const isExpanded = expandedChanges.has(change.id)
            
            return (
              <div key={change.id} className={styles.changeItem}>
                <div 
                  className={styles.changeHeader}
                  onClick={() => toggleExpanded(change.id)}
                >
                  <div className={styles.changeInfo}>
                    <div className={styles.changeIcon}>
                      {getChangeIcon(change.change_type)}
                    </div>
                    <div>
                      <div className={styles.changeTitle}>
                        {formatFieldName(change.field_name)} {change.change_type}d
                      </div>
                      <div className={styles.changeMeta}>
                        <span 
                          className={styles.changeUser}
                          style={{ 
                            color: change.user?.collaboration_color || 'var(--color-text-secondary)' 
                          }}
                        >
                          {change.user?.display_name || change.user?.email.split('@')[0]}
                        </span>
                        <span className={styles.changeTime}>
                          {formatDistanceToNow(new Date(change.created_at), { addSuffix: true })}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <button className={`${styles.expandButton} ${isExpanded ? styles.expanded : ''}`}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="6 9 12 15 18 9"/>
                    </svg>
                  </button>
                </div>
                
                {isExpanded && (
                  <div className={styles.changeDetails}>
                    {renderDiff(change)}
                    {onRestoreVersion && change.old_value && (
                      <div className={styles.changeActions}>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onRestoreVersion(change)}
                        >
                          Restore This Version
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}