'use client'

import { useState, useEffect, useRef } from 'react'
import { CommentWithProfile } from '@/lib/types/collaboration'
import { collaborationApi } from '@/lib/collaboration/collaboration-api'
import { formatDistanceToNow } from 'date-fns'
import { Button } from '@/components/ui'
import { useEnhancedNotifications } from '@/components/notifications/notification.hooks'
import styles from './comments-panel.module.css'

interface CommentsPanelProps {
  resourceType: 'contract' | 'template'
  resourceId: string
  currentUserId: string
  canComment?: boolean
  onHighlightText?: (selectionStart?: number, selectionEnd?: number) => void
}

export default function CommentsPanel({
  resourceType,
  resourceId,
  currentUserId,
  canComment = true,
  onHighlightText,
}: CommentsPanelProps) {
  const [comments, setComments] = useState<CommentWithProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [showResolved, setShowResolved] = useState(false)
  const [replyingTo, setReplyingTo] = useState<string | null>(null)
  const [newComment, setNewComment] = useState('')
  const [newReply, setNewReply] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const notifications = useEnhancedNotifications()
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    loadComments()
  }, [resourceType, resourceId, showResolved])

  async function loadComments() {
    try {
      const fetchedComments = await collaborationApi.getComments(
        resourceType,
        resourceId,
        showResolved
      )
      setComments(fetchedComments)
    } catch (error) {
      console.error('Error loading comments:', error)
      notifications.error('Failed to load comments')
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmitComment() {
    if (!newComment.trim() || !canComment) return

    setSubmitting(true)
    try {
      await collaborationApi.createComment({
        resource_type: resourceType,
        resource_id: resourceId,
        content: newComment.trim(),
      })
      
      setNewComment('')
      await loadComments()
      notifications.success('Comment added')
    } catch (error) {
      console.error('Error creating comment:', error)
      notifications.error('Failed to add comment')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleSubmitReply(parentId: string) {
    if (!newReply.trim() || !canComment) return

    setSubmitting(true)
    try {
      await collaborationApi.createComment({
        resource_type: resourceType,
        resource_id: resourceId,
        content: newReply.trim(),
        parent_id: parentId,
      })
      
      setNewReply('')
      setReplyingTo(null)
      await loadComments()
      notifications.success('Reply added')
    } catch (error) {
      console.error('Error creating reply:', error)
      notifications.error('Failed to add reply')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleResolveComment(commentId: string, resolved: boolean) {
    try {
      await collaborationApi.updateComment(commentId, { resolved })
      await loadComments()
      notifications.success(resolved ? 'Comment resolved' : 'Comment reopened')
    } catch (error) {
      console.error('Error updating comment:', error)
      notifications.error('Failed to update comment')
    }
  }

  const renderComment = (comment: CommentWithProfile, isReply = false) => {
    const isAuthor = comment.user_id === currentUserId
    const hasTextSelection = comment.selection_start !== null && comment.selection_end !== null
    
    return (
      <div 
        key={comment.id} 
        className={`${styles.comment} ${isReply ? styles.reply : ''} ${comment.resolved ? styles.resolved : ''}`}
      >
        <div className={styles.commentHeader}>
          <div className={styles.commentAuthor}>
            <div 
              className={styles.authorAvatar}
              style={{ 
                backgroundColor: comment.user?.collaboration_color || 'var(--color-text-secondary)',
              }}
            >
              {comment.user?.display_name?.[0] || comment.user?.email[0] || '?'}
            </div>
            <div>
              <div className={styles.authorName}>
                {comment.user?.display_name || comment.user?.email.split('@')[0]}
              </div>
              <div className={styles.commentTime}>
                {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
              </div>
            </div>
          </div>

          <div className={styles.commentActions}>
            {hasTextSelection && (
              <button
                className={styles.viewInTextButton}
                onClick={() => onHighlightText?.(comment.selection_start!, comment.selection_end!)}
                title="View in document"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/>
                  <polyline points="13 2 13 9 20 9"/>
                </svg>
              </button>
            )}
            
            {!isReply && canComment && (
              <button
                className={styles.resolveButton}
                onClick={() => handleResolveComment(comment.id, !comment.resolved)}
                title={comment.resolved ? 'Reopen comment' : 'Resolve comment'}
              >
                {comment.resolved ? (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/>
                    <path d="M21 3v5h-5"/>
                    <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/>
                    <path d="M8 16H3v5"/>
                  </svg>
                ) : (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                )}
              </button>
            )}
          </div>
        </div>

        <div className={styles.commentContent}>
          {comment.content}
        </div>

        {!isReply && canComment && (
          <div className={styles.commentFooter}>
            {replyingTo === comment.id ? (
              <div className={styles.replyBox}>
                <textarea
                  ref={textareaRef}
                  value={newReply}
                  onChange={(e) => setNewReply(e.target.value)}
                  placeholder="Write a reply..."
                  className={styles.replyInput}
                  rows={2}
                  disabled={submitting}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      handleSubmitReply(comment.id)
                    }
                  }}
                />
                <div className={styles.replyActions}>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setReplyingTo(null)
                      setNewReply('')
                    }}
                    disabled={submitting}
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => handleSubmitReply(comment.id)}
                    disabled={!newReply.trim() || submitting}
                  >
                    Reply
                  </Button>
                </div>
              </div>
            ) : (
              <button
                className={styles.replyButton}
                onClick={() => {
                  setReplyingTo(comment.id)
                  setTimeout(() => textareaRef.current?.focus(), 100)
                }}
              >
                Reply
              </button>
            )}
          </div>
        )}

        {/* Render replies */}
        {comment.replies && comment.replies.length > 0 && (
          <div className={styles.replies}>
            {comment.replies.map(reply => renderComment(reply, true))}
          </div>
        )}
      </div>
    )
  }

  if (loading) {
    return (
      <div className={styles.loading}>
        <div className="spinner"></div>
      </div>
    )
  }

  const activeComments = comments.filter(c => !c.resolved)
  const resolvedComments = comments.filter(c => c.resolved)

  return (
    <div className={styles.commentsPanel}>
      <div className={styles.panelHeader}>
        <h3 className={styles.panelTitle}>Comments</h3>
        <button
          className={styles.filterButton}
          onClick={() => setShowResolved(!showResolved)}
        >
          {showResolved ? 'Hide' : 'Show'} resolved ({resolvedComments.length})
        </button>
      </div>

      {canComment && (
        <div className={styles.newCommentBox}>
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Add a comment..."
            className={styles.commentInput}
            rows={3}
            disabled={submitting}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                handleSubmitComment()
              }
            }}
          />
          <div className={styles.commentActions}>
            <Button
              size="sm"
              onClick={handleSubmitComment}
              disabled={!newComment.trim() || submitting}
            >
              Comment
            </Button>
          </div>
        </div>
      )}

      <div className={styles.commentsList}>
        {activeComments.length === 0 && !showResolved && (
          <div className={styles.emptyState}>
            <p>No comments yet</p>
            {canComment && <p className={styles.emptyStateHint}>Be the first to comment</p>}
          </div>
        )}

        {activeComments.map(comment => renderComment(comment))}
        
        {showResolved && resolvedComments.length > 0 && (
          <>
            {activeComments.length > 0 && <div className={styles.divider} />}
            <div className={styles.resolvedSection}>
              <h4 className={styles.sectionTitle}>Resolved</h4>
              {resolvedComments.map(comment => renderComment(comment))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}