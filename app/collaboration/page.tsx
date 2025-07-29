'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth-client'
import { collaborationApi } from '@/lib/collaboration/collaboration-api'
import { Contract, Template } from '@/lib/supabase-client'
import { ShareWithProfile } from '@/lib/types/collaboration'
import { TopNavigation, Button } from '@/components/ui'
import CollaboratorAvatars from '@/components/collaboration/collaborator-avatars'
import { useEnhancedNotifications } from '@/components/notifications/notification.hooks'
import styles from './collaboration.module.css'

type ViewFilter = 'all' | 'shared-with-me' | 'shared-by-me'
type ViewMode = 'grid' | 'list'
type ResourceType = 'all' | 'contracts' | 'templates' | 'folders'

interface CollaborationItem {
  id: string
  type: 'contract' | 'template' | 'folder' | 'template_folder'
  title: string
  permission: 'view' | 'edit' | 'admin'
  sharedBy?: string
  sharedWith?: ShareWithProfile[]
  lastModified: string
  resource: Contract | Template | any
}

export default function CollaborationDashboard() {
  const [user, setUser] = useState<any>(null)
  const [items, setItems] = useState<CollaborationItem[]>([])
  const [loading, setLoading] = useState(true)
  const [viewFilter, setViewFilter] = useState<ViewFilter>('all')
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [resourceFilter, setResourceFilter] = useState<ResourceType>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const router = useRouter()
  const notifications = useEnhancedNotifications()

  useEffect(() => {
    loadUserAndSharedItems()
  }, [])

  async function loadUserAndSharedItems() {
    try {
      const currentUser = await getCurrentUser()
      if (!currentUser) {
        router.push('/auth/login')
        return
      }
      
      setUser(currentUser)
      const sharedItems = await collaborationApi.getSharedWithMe()
      
      // Transform shared items into collaboration items
      const collaborationItems: CollaborationItem[] = sharedItems.map(share => ({
        id: share.resource_id,
        type: share.resource_type,
        title: share.resource?.title || 'Untitled',
        permission: share.permission,
        sharedBy: share.shared_by_profile?.display_name || share.shared_by_profile?.email || 'Unknown',
        lastModified: share.resource?.updated_at || share.created_at,
        resource: share.resource
      }))

      // Also fetch items shared by the user
      const myShares = await collaborationApi.getMyShares()
      const sharedByMeItems: CollaborationItem[] = []
      
      // Group shares by resource to get all collaborators
      const resourceSharesMap = new Map<string, ShareWithProfile[]>()
      myShares.forEach(share => {
        const key = `${share.resource_type}-${share.resource_id}`
        if (!resourceSharesMap.has(key)) {
          resourceSharesMap.set(key, [])
        }
        resourceSharesMap.get(key)!.push(share)
      })

      // Create items for resources I've shared
      resourceSharesMap.forEach((shares, key) => {
        const firstShare = shares[0]
        if (firstShare.resource) {
          sharedByMeItems.push({
            id: firstShare.resource_id,
            type: firstShare.resource_type,
            title: firstShare.resource.title || 'Untitled',
            permission: 'admin', // Owner always has admin
            sharedWith: shares,
            lastModified: firstShare.resource.updated_at || firstShare.created_at,
            resource: firstShare.resource
          })
        }
      })

      setItems([...collaborationItems, ...sharedByMeItems])
    } catch (error) {
      console.error('Error loading shared items:', error)
      notifications.error('Operation Failed', 'Failed to load shared items')
    } finally {
      setLoading(false)
    }
  }

  async function handleSignOut() {
    const { signOut } = await import('@/lib/auth-client')
    await signOut()
    router.push('/auth/login')
  }

  function handleItemClick(item: CollaborationItem) {
    // Navigate to collaboration view for the item
    router.push(`/collaboration/${item.type}/${item.id}`)
  }

  // Filter items based on current filters
  const filteredItems = items.filter(item => {
    // Filter by view type
    if (viewFilter === 'shared-with-me' && !item.sharedBy) return false
    if (viewFilter === 'shared-by-me' && !item.sharedWith) return false

    // Filter by resource type
    if (resourceFilter !== 'all') {
      if (resourceFilter === 'contracts' && item.type !== 'contract') return false
      if (resourceFilter === 'templates' && item.type !== 'template') return false
      if (resourceFilter === 'folders' && item.type !== 'folder' && item.type !== 'template_folder') return false
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      return item.title.toLowerCase().includes(query)
    }

    return true
  })

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    
    if (days === 0) {
      const hours = Math.floor(diff / (1000 * 60 * 60))
      if (hours === 0) {
        const minutes = Math.floor(diff / (1000 * 60))
        return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`
      }
      return `${hours} hour${hours !== 1 ? 's' : ''} ago`
    } else if (days < 7) {
      return `${days} day${days !== 1 ? 's' : ''} ago`
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      })
    }
  }

  const getResourceIcon = (type: CollaborationItem['type']) => {
    switch (type) {
      case 'contract':
        return (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14,2 14,8 20,8"/>
            <line x1="16" y1="13" x2="8" y2="13"/>
            <line x1="16" y1="17" x2="8" y2="17"/>
            <polyline points="10,9 9,9 8,9"/>
          </svg>
        )
      case 'template':
        return (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14,2 14,8 20,8"/>
            <line x1="16" y1="13" x2="8" y2="13"/>
            <line x1="16" y1="17" x2="8" y2="17"/>
            <polyline points="10,9 9,9 8,9"/>
          </svg>
        )
      case 'folder':
      case 'template_folder':
        return (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
          </svg>
        )
    }
  }

  const getPermissionBadge = (permission: CollaborationItem['permission']) => {
    return (
      <span className={`${styles.permissionBadge} ${styles[permission]}`}>
        {permission === 'view' && '👁️ View'}
        {permission === 'edit' && '✏️ Edit'}
        {permission === 'admin' && '👑 Admin'}
      </span>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="spinner-lg"></div>
      </div>
    )
  }

  return (
    <div className={styles.collaborationContainer}>
      <TopNavigation 
        currentPage="collaboration"
        user={user}
        onSignOut={handleSignOut}
      />

      <div className={styles.mainContent}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerContent}>
            <h1 className={styles.title}>Collaboration</h1>
            <p className={styles.subtitle}>
              {filteredItems.length} shared {filteredItems.length === 1 ? 'item' : 'items'}
            </p>
          </div>

          {/* Header Actions */}
          <div className={styles.headerActions}>
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push('/collaboration/requests')}
              className={styles.requestsButton}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2v10m0 0l-3-3m3 3l3-3M3 12h18M12 22v-6"/>
              </svg>
              Access Requests
            </Button>

            {/* View Mode Toggle */}
            <div className={styles.viewToggle}>
            <button
              className={`${styles.viewButton} ${viewMode === 'grid' ? styles.active : ''}`}
              onClick={() => setViewMode('grid')}
              title="Grid view"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="7" height="7"/>
                <rect x="14" y="3" width="7" height="7"/>
                <rect x="14" y="14" width="7" height="7"/>
                <rect x="3" y="14" width="7" height="7"/>
              </svg>
            </button>
            <button
              className={`${styles.viewButton} ${viewMode === 'list' ? styles.active : ''}`}
              onClick={() => setViewMode('list')}
              title="List view"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="8" y1="6" x2="21" y2="6"/>
                <line x1="8" y1="12" x2="21" y2="12"/>
                <line x1="8" y1="18" x2="21" y2="18"/>
                <line x1="3" y1="6" x2="3.01" y2="6"/>
                <line x1="3" y1="12" x2="3.01" y2="12"/>
                <line x1="3" y1="18" x2="3.01" y2="18"/>
              </svg>
            </button>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className={styles.filters}>
          {/* Search */}
          <div className={styles.searchContainer}>
            <svg className={styles.searchIcon} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/>
              <path d="m21 21-4.35-4.35"/>
            </svg>
            <input
              type="text"
              placeholder="Search shared items..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={styles.searchInput}
            />
          </div>

          {/* Filter Buttons */}
          <div className={styles.filterButtons}>
            <button
              className={`${styles.filterButton} ${viewFilter === 'all' ? styles.active : ''}`}
              onClick={() => setViewFilter('all')}
            >
              All
            </button>
            <button
              className={`${styles.filterButton} ${viewFilter === 'shared-with-me' ? styles.active : ''}`}
              onClick={() => setViewFilter('shared-with-me')}
            >
              Shared with me
            </button>
            <button
              className={`${styles.filterButton} ${viewFilter === 'shared-by-me' ? styles.active : ''}`}
              onClick={() => setViewFilter('shared-by-me')}
            >
              Shared by me
            </button>
          </div>

          {/* Resource Type Filter */}
          <div className={styles.resourceFilter}>
            <select
              value={resourceFilter}
              onChange={(e) => setResourceFilter(e.target.value as ResourceType)}
              className={styles.filterSelect}
            >
              <option value="all">All types</option>
              <option value="contracts">Contracts</option>
              <option value="templates">Templates</option>
              <option value="folders">Folders</option>
            </select>
          </div>
        </div>

        {/* Content */}
        <div className={styles.contentArea}>
          {filteredItems.length === 0 ? (
            <div className={styles.emptyState}>
              <div className={styles.emptyStateContent}>
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
                    d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z"
                  />
                </svg>
                <h3 className={styles.emptyStateTitle}>
                  {searchQuery ? 'No items match your search' : 'No shared items yet'}
                </h3>
                <p className={styles.emptyStateDescription}>
                  {searchQuery 
                    ? 'Try adjusting your search or filters'
                    : 'When documents are shared with you or you share documents with others, they will appear here.'
                  }
                </p>
              </div>
            </div>
          ) : viewMode === 'grid' ? (
            <div className={styles.gridView}>
              {filteredItems.map((item) => (
                <div
                  key={`${item.type}-${item.id}`}
                  className={styles.gridItem}
                  onClick={() => handleItemClick(item)}
                >
                  <div className={styles.itemHeader}>
                    <div className={styles.itemIcon}>
                      {getResourceIcon(item.type)}
                    </div>
                    {getPermissionBadge(item.permission)}
                  </div>
                  
                  <h3 className={styles.itemTitle}>{item.title}</h3>
                  
                  <div className={styles.itemMeta}>
                    {item.sharedBy && (
                      <p className={styles.sharedBy}>Shared by {item.sharedBy}</p>
                    )}
                    {item.sharedWith && item.sharedWith.length > 0 && (
                      <div className={styles.sharedWith}>
                        <CollaboratorAvatars
                          collaborators={item.sharedWith.map(share => ({
                            user_id: share.shared_with,
                            profile: share.shared_with_profile!,
                            color: share.shared_with_profile!.collaboration_color || '#000',
                            last_seen: new Date().toISOString()
                          }))}
                          size="sm"
                          maxDisplay={3}
                          showTooltip={true}
                        />
                        <span className={styles.sharedCount}>
                          {item.sharedWith.length} collaborator{item.sharedWith.length !== 1 ? 's' : ''}
                        </span>
                      </div>
                    )}
                    <p className={styles.lastModified}>{formatDate(item.lastModified)}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className={styles.listView}>
              <table className={styles.listTable}>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Type</th>
                    <th>Permission</th>
                    <th>Shared</th>
                    <th>Modified</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredItems.map((item) => (
                    <tr
                      key={`${item.type}-${item.id}`}
                      className={styles.listRow}
                      onClick={() => handleItemClick(item)}
                    >
                      <td>
                        <div className={styles.nameCell}>
                          <div className={styles.itemIcon}>
                            {getResourceIcon(item.type)}
                          </div>
                          <span>{item.title}</span>
                        </div>
                      </td>
                      <td className={styles.typeCell}>
                        {item.type === 'template_folder' ? 'Template Folder' : item.type}
                      </td>
                      <td>{getPermissionBadge(item.permission)}</td>
                      <td>
                        {item.sharedBy && <span>By {item.sharedBy}</span>}
                        {item.sharedWith && item.sharedWith.length > 0 && (
                          <div className={styles.sharedWithCell}>
                            <CollaboratorAvatars
                              collaborators={item.sharedWith.map(share => ({
                                user_id: share.shared_with,
                                profile: share.shared_with_profile!,
                                color: share.shared_with_profile!.collaboration_color || '#000',
                                last_seen: new Date().toISOString()
                              }))}
                              size="sm"
                              maxDisplay={3}
                              showTooltip={true}
                            />
                          </div>
                        )}
                      </td>
                      <td className={styles.dateCell}>{formatDate(item.lastModified)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}