'use client'

import { CollaboratorPresence } from '@/lib/types/collaboration'
import styles from './collaborator-avatars.module.css'

interface CollaboratorAvatarsProps {
  collaborators: CollaboratorPresence[]
  maxDisplay?: number
  size?: 'sm' | 'md' | 'lg'
  showTooltip?: boolean
}

export default function CollaboratorAvatars({
  collaborators,
  maxDisplay = 3,
  size = 'md',
  showTooltip = true
}: CollaboratorAvatarsProps) {
  const displayedCollaborators = collaborators.slice(0, maxDisplay)
  const remainingCount = Math.max(0, collaborators.length - maxDisplay)

  const getInitials = (profile: CollaboratorPresence['profile']) => {
    if (profile.display_name) {
      const parts = profile.display_name.split(' ')
      if (parts.length > 1) {
        return (parts[0][0] + parts[1][0]).toUpperCase()
      }
      return profile.display_name.substring(0, 2).toUpperCase()
    }
    return profile.email.substring(0, 2).toUpperCase()
  }

  const getName = (profile: CollaboratorPresence['profile']) => {
    return profile.display_name || profile.email
  }

  return (
    <div className={`${styles.avatarStack} ${styles[size]}`}>
      {displayedCollaborators.map((collaborator, index) => (
        <div
          key={collaborator.user_id}
          className={styles.avatarWrapper}
          style={{
            zIndex: displayedCollaborators.length - index,
            marginLeft: index > 0 ? `-${size === 'sm' ? 8 : size === 'md' ? 10 : 12}px` : 0
          }}
        >
          <div
            className={styles.avatar}
            style={{
              borderColor: collaborator.color,
              backgroundColor: collaborator.profile.avatar_url ? 'transparent' : 'var(--color-text-primary)'
            }}
            title={showTooltip ? getName(collaborator.profile) : undefined}
          >
            {collaborator.profile.avatar_url ? (
              <img 
                src={collaborator.profile.avatar_url} 
                alt={getName(collaborator.profile)}
                className={styles.avatarImage}
              />
            ) : (
              <span className={styles.avatarInitials}>
                {getInitials(collaborator.profile)}
              </span>
            )}
          </div>
          {showTooltip && (
            <div className={styles.tooltip}>
              <div className={styles.tooltipName}>{getName(collaborator.profile)}</div>
              <div className={styles.tooltipStatus}>
                {new Date().getTime() - new Date(collaborator.last_seen).getTime() < 5000 
                  ? 'Active now' 
                  : 'Active recently'}
              </div>
            </div>
          )}
        </div>
      ))}
      
      {remainingCount > 0 && (
        <div
          className={`${styles.avatarWrapper} ${styles.remainingCount}`}
          style={{
            zIndex: 0,
            marginLeft: `-${size === 'sm' ? 8 : size === 'md' ? 10 : 12}px`
          }}
        >
          <div className={styles.avatar}>
            <span className={styles.avatarInitials}>+{remainingCount}</span>
          </div>
          {showTooltip && (
            <div className={styles.tooltip}>
              <div className={styles.tooltipName}>{remainingCount} more</div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}