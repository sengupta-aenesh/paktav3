'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Contract, contractsApi } from '@/lib/supabase-client'
import { getCurrentUser } from '@/lib/auth-client'
import { collaborationApi } from '@/lib/collaboration/collaboration-api'
import { ResourceAccess, CollaboratorPresence } from '@/lib/types/collaboration'
import { useCollaborationPresence } from '@/hooks/use-collaboration-presence'
import { useDocumentChanges } from '@/hooks/use-document-changes'
import InteractiveContractEditor from '@/components/contracts/interactive-contract-editor'
import { ContractAnalysis } from '@/components/contracts/contract-analysis'
import CollaboratorAvatars from '@/components/collaboration/collaborator-avatars'
import AccessRequestModal from '@/components/collaboration/access-request-modal'
import LiveCursors from '@/components/collaboration/live-cursors'
import CommentsPanel from '@/components/collaboration/comments-panel'
import { TopNavigation, Button } from '@/components/ui'
import { useEnhancedNotifications } from '@/components/notifications/notification.hooks'
import styles from './collaboration-contract.module.css'

type MobileView = 'editor' | 'analysis' | 'comments'

export default function CollaborationContractPage() {
  const router = useRouter()
  const params = useParams()
  const contractId = params.id as string
  const notifications = useEnhancedNotifications()
  
  const [user, setUser] = useState<any>(null)
  const [contract, setContract] = useState<Contract | null>(null)
  const [access, setAccess] = useState<ResourceAccess | null>(null)
  const [staticCollaborators, setStaticCollaborators] = useState<CollaboratorPresence[]>([])
  const [contractRisks, setContractRisks] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [mobileView, setMobileView] = useState<MobileView>('editor')
  const [showAccessRequest, setShowAccessRequest] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [showComments, setShowComments] = useState(false)
  
  const reanalyzeRisksRef = useRef<(() => Promise<void>) | null>(null)
  const [updateContractContentFunction, setUpdateContractContentFunction] = useState<((content: string | null) => void) | null>(null)
  const editorRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    loadContractAndAccess()
  }, [contractId])

  // Real-time presence
  const { collaborators, isConnected, updateCursor, updateSelection, setTyping } = useCollaborationPresence({
    resourceType: 'contract',
    resourceId: contractId,
    userId: user?.id || '',
    userProfile: {
      email: user?.email || '',
      display_name: user?.user_metadata?.display_name,
      avatar_url: user?.user_metadata?.avatar_url,
      collaboration_color: user?.user_metadata?.collaboration_color,
    },
    enabled: !!user && !!contract && access?.hasAccess,
  })

  // Real-time document changes
  const { trackContentChange, trackFieldChange } = useDocumentChanges({
    resourceType: 'contract',
    resourceId: contractId,
    userId: user?.id || '',
    enabled: !!user && !!contract && access?.hasAccess,
    onRemoteChange: (change) => {
      // Handle remote changes
      if (change.field_name === 'content' && updateContractContentFunction) {
        // Update editor content with remote changes
        updateContractContentFunction(change.new_value)
      } else if (change.field_name === 'title') {
        // Update title with remote changes
        setContract(prev => prev ? { ...prev, title: change.new_value } : null)
      }
    },
  })

  async function loadContractAndAccess() {
    try {
      const currentUser = await getCurrentUser()
      if (!currentUser) {
        router.push('/auth/login')
        return
      }
      
      setUser(currentUser)
      
      // Check access first
      const accessData = await collaborationApi.checkAccess('contract', contractId)
      setAccess(accessData)
      
      if (!accessData.hasAccess) {
        setShowAccessRequest(true)
        setLoading(false)
        return
      }

      // Load contract if user has access
      const contractData = await contractsApi.getById(contractId)
      if (!contractData) {
        notifications.error('Not Found', 'Contract not found')
        router.push('/collaboration')
        return
      }
      
      setContract(contractData)
      
      // Load cached risks
      if (contractData.analysis_cache?.risks) {
        const riskAnalysis = contractData.analysis_cache.risks
        const cachedRisks = Array.isArray(riskAnalysis) 
          ? riskAnalysis
          : riskAnalysis.risks || []
        setContractRisks(cachedRisks)
      }
      
      // Load static collaborators (for initial display)
      const contractCollaborators = await collaborationApi.getCollaborators('contract', contractId)
      setStaticCollaborators(contractCollaborators)
      
    } catch (error) {
      console.error('Error loading contract:', error)
      notifications.error('Operation Failed', 'Failed to load contract')
      router.push('/collaboration')
    } finally {
      setLoading(false)
    }
  }

  async function handleSignOut() {
    const { signOut } = await import('@/lib/auth-client')
    await signOut()
    router.push('/auth/login')
  }

  async function handleContractContentChange(content: string | null) {
    if (!contract || !access || access.permission === 'view') return
    
    const safeContent = content || ''
    
    try {
      await contractsApi.update(contract.id, { content: safeContent })
      setContract(prev => prev ? { ...prev, content: safeContent } : null)
      setContractRisks([])
      
      // Track content change for real-time sync
      trackContentChange(safeContent)
      
      notifications.success('Success', 'Contract updated successfully')
    } catch (error) {
      console.error('Error updating contract:', error)
      notifications.error('Operation Failed', 'Failed to update contract')
    }
  }

  const handleRegisterUpdateFunction = useCallback((fn: (content: string | null) => void) => {
    setUpdateContractContentFunction(() => fn)
  }, [])

  const handleRegisterReanalysisFunction = useCallback((fn: () => Promise<void>) => {
    reanalyzeRisksRef.current = fn
  }, [])

  const refreshContract = useCallback(async () => {
    if (contract) {
      try {
        const updatedContract = await contractsApi.getById(contract.id)
        if (updatedContract) {
          setContract(updatedContract)
        }
      } catch (error) {
        console.error('Failed to refresh contract:', error)
      }
    }
  }, [contract])

  const handleContractTitleChange = useCallback(async (newTitle: string) => {
    if (!contract || !newTitle.trim() || !access || access.permission === 'view') return
    
    const trimmedTitle = newTitle.trim()
    
    setContract(prev => prev ? { ...prev, title: trimmedTitle } : null)
    
    try {
      await contractsApi.update(contract.id, { title: trimmedTitle })
      
      // Track title change for real-time sync
      trackFieldChange('title', contract.title, trimmedTitle)
      
      notifications.success('Success', 'Contract title updated')
    } catch (error) {
      console.error('Failed to update contract title:', error)
      notifications.error('Operation Failed', 'Failed to update title')
      setContract(prev => prev ? { ...prev, title: contract.title } : null)
    }
  }, [contract, access])

  const handleOpenPrivateView = () => {
    router.push(`/dashboard?contractId=${contractId}`)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="spinner-lg"></div>
      </div>
    )
  }

  if (showAccessRequest && access && !access.hasAccess) {
    return (
      <div className={styles.accessRequestContainer}>
        <TopNavigation 
          currentPage="collaboration"
          user={user}
          onSignOut={handleSignOut}
        />
        <AccessRequestModal
          resourceType="contract"
          resourceId={contractId}
          resourceTitle={access.owner?.display_name || access.owner?.email || 'this contract'}
          onClose={() => router.push('/collaboration')}
          onRequestSent={() => {
            notifications.success('Request Sent', 'Your access request has been sent')
            router.push('/collaboration')
          }}
        />
      </div>
    )
  }

  return (
    <div className={styles.collaborationContainer}>
      <TopNavigation 
        currentPage="collaboration"
        contractTitle={contract?.title || ''}
        onContractTitleChange={access?.permission !== 'view' ? handleContractTitleChange : undefined}
        user={user}
        onSignOut={handleSignOut}
      />

      {/* Collaboration Header */}
      <div className={styles.collaborationHeader}>
        <div className={styles.headerLeft}>
          <button
            className={styles.backButton}
            onClick={() => router.push('/collaboration')}
            title="Back to collaboration dashboard"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="15 18 9 12 15 6"></polyline>
            </svg>
            <span>Back</span>
          </button>
          
          {access && (
            <div className={styles.accessBadge}>
              {access.permission === 'view' && '👁️ View Only'}
              {access.permission === 'edit' && '✏️ Can Edit'}
              {access.permission === 'admin' && '👑 Admin'}
            </div>
          )}
        </div>

        <div className={styles.headerCenter}>
          <CollaboratorAvatars
            collaborators={collaborators.length > 0 ? collaborators : staticCollaborators}
            size="md"
            maxDisplay={5}
            showTooltip={true}
          />
          <span className={styles.collaboratorCount}>
            {(collaborators.length > 0 ? collaborators : staticCollaborators).length} collaborator{(collaborators.length > 0 ? collaborators : staticCollaborators).length !== 1 ? 's' : ''}
          </span>
          {isConnected && (
            <div className={styles.liveIndicator} title="Real-time collaboration active" />
          )}
        </div>

        <div className={styles.headerRight}>
          <Button
            variant="outline"
            size="sm"
            onClick={handleOpenPrivateView}
            className={styles.privateViewButton}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2L2 7l10 5 10-5-10-5z"/>
              <path d="M2 17l10 5 10-5M2 12l10 5 10-5"/>
            </svg>
            Private View
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className={styles.mainContent}>
        {/* Sidebar Toggle */}
        <button
          className={`${styles.sidebarToggle} ${sidebarCollapsed ? styles.collapsed : ''}`}
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points={sidebarCollapsed ? "9 18 15 12 9 6" : "15 18 9 12 15 6"}></polyline>
          </svg>
        </button>

        {/* Editor Panel */}
        <div 
          ref={editorRef}
          className={`${styles.editorPanel} ${sidebarCollapsed ? styles.expanded : ''} ${mobileView === 'editor' ? styles.mobileVisible : styles.mobileHidden}`}
        >
          {isConnected && <LiveCursors collaborators={collaborators} containerRef={editorRef} />}
          <InteractiveContractEditor
            contract={contract}
            risks={contractRisks}
            onContentChange={access?.permission !== 'view' ? handleContractContentChange : undefined}
            onRiskClick={(riskId) => {
              if (window.innerWidth <= 768) {
                setMobileView('analysis')
              }
            }}
            onHighlightClick={(riskId) => {
              if (typeof window !== 'undefined' && (window as any).scrollToRiskCard) {
                (window as any).scrollToRiskCard(riskId)
              }
              if (window.innerWidth <= 768) {
                setMobileView('analysis')
              }
            }}
            onComment={(text, position) => {
              // Show comments panel
              setShowComments(true)
              if (window.innerWidth <= 768) {
                setMobileView('comments')
              }
            }}
            onReanalyzeRisks={reanalyzeRisksRef.current}
            onRegisterUpdateFunction={handleRegisterUpdateFunction}
            className={styles.contractEditor}
            readOnly={access?.permission === 'view'}
            onSelectionChange={(start, end) => {
              // Update selection for real-time collaboration
              if (isConnected && start !== undefined && end !== undefined) {
                updateSelection(start, end)
              }
            }}
            onTyping={(isTyping) => {
              // Update typing indicator
              if (isConnected) {
                setTyping(isTyping)
              }
            }}
          />
        </div>

        {/* Analysis Panel */}
        <div className={`${styles.analysisPanel} ${sidebarCollapsed ? styles.collapsed : ''} ${showComments ? styles.withComments : ''} ${mobileView === 'analysis' ? styles.mobileVisible : styles.mobileHidden}`}>
          <ContractAnalysis 
            contract={contract} 
            onMobileViewChange={setMobileView}
            mobileView={mobileView}
            onRisksUpdate={setContractRisks}
            onReanalysisRequest={handleRegisterReanalysisFunction}
            onContractUpdate={access?.permission !== 'view' ? handleContractContentChange : undefined}
            collaborationMode={true}
            readOnly={access?.permission === 'view'}
          />
        </div>

        {/* Comments Panel */}
        {showComments && (
          <div className={`${styles.commentsPanel} ${mobileView === 'comments' ? styles.mobileVisible : styles.mobileHidden}`}>
            <div className={styles.commentsPanelHeader}>
              <button
                className={styles.closeCommentsButton}
                onClick={() => {
                  setShowComments(false)
                  if (mobileView === 'comments') {
                    setMobileView('analysis')
                  }
                }}
                title="Close comments"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
            <CommentsPanel
              resourceType="contract"
              resourceId={contractId}
              currentUserId={user?.id || ''}
              canComment={access?.permission !== 'view'}
              onHighlightText={(start, end) => {
                // TODO: Implement text highlighting in editor
                console.log('Highlight text:', start, end)
              }}
            />
          </div>
        )}
      </div>
    </div>
  )
}