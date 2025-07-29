# Collaboration Features Implementation Guide

## Overview
This guide provides comprehensive instructions for implementing real-time collaboration features in Contract Manager V3. The database schema has been created and migrated successfully.

## Current Status
✅ **Completed:**
- Database schema design and migration
- New tables: shares, comments, document_changes, presence, access_requests
- Extended profiles table with collaboration fields
- RLS policies and helper functions

❌ **Remaining Tasks:**
1. TypeScript types and interfaces
2. API endpoints for collaboration
3. UI components for sharing and permissions
4. Collaboration dashboard interface
5. Real-time functionality implementation
6. Comments system UI
7. Track changes visualization
8. Access request flow

## Implementation Architecture

### 1. TypeScript Types (`/lib/types/collaboration.ts`)
Create new types extending the database types:

```typescript
export interface Share extends Database['public']['Tables']['shares']['Row'] {
  shared_by_profile?: Profile
  shared_with_profile?: Profile
}

export interface Comment extends Database['public']['Tables']['comments']['Row'] {
  user_profile?: Profile
  replies?: Comment[]
}

export interface CollaboratorPresence {
  user_id: string
  profile: Profile
  cursor_position?: number
  selection?: { start: number; end: number }
  color: string
}

export interface CollaborationPermission {
  canView: boolean
  canEdit: boolean
  canAdmin: boolean
  canShare: boolean
  canComment: boolean
}
```

### 2. API Endpoints Structure

#### Shares API (`/app/api/shares/`)
- `POST /api/shares/create` - Create new share
- `GET /api/shares/[resourceType]/[resourceId]` - Get shares for resource
- `PUT /api/shares/[id]` - Update share permissions
- `DELETE /api/shares/[id]` - Remove share
- `GET /api/shares/search-users` - Search users by email

#### Comments API (`/app/api/comments/`)
- `POST /api/comments` - Create comment
- `GET /api/comments/[resourceType]/[resourceId]` - Get comments
- `PUT /api/comments/[id]` - Update comment
- `PUT /api/comments/[id]/resolve` - Resolve/unresolve comment
- `DELETE /api/comments/[id]` - Delete comment

#### Collaboration API (`/app/api/collaboration/`)
- `GET /api/collaboration/access-check` - Check user access
- `POST /api/collaboration/request-access` - Request access
- `PUT /api/collaboration/request-access/[id]` - Approve/deny request
- `GET /api/collaboration/shared-with-me` - Get shared resources
- `GET /api/collaboration/document-changes/[resourceType]/[resourceId]` - Get changes

### 3. UI Components Implementation

#### Share Modal (`/components/collaboration/share-modal.tsx`)
```typescript
interface ShareModalProps {
  isOpen: boolean
  onClose: () => void
  resourceType: 'contract' | 'template' | 'folder' | 'template_folder'
  resourceId: string
  resourceTitle: string
  currentUserId: string
}

// Features:
// - Search users by email
// - Set permission levels (view/edit/admin)
// - Show current collaborators
// - Remove collaborators
// - Copy share link
```

**Styling Guidelines:**
- Use existing modal styles from the project
- Black primary buttons, grey secondary
- Consistent spacing using CSS variables
- User avatars with initials fallback
- Permission dropdown matching existing select styles

#### Collaborator Avatars (`/components/collaboration/collaborator-avatars.tsx`)
```typescript
interface CollaboratorAvatarsProps {
  collaborators: CollaboratorPresence[]
  maxDisplay?: number
  size?: 'sm' | 'md' | 'lg'
}

// Features:
// - Stack avatars with overlap
// - Show user colors as border
// - Tooltip with name on hover
// - "+X more" indicator
```

#### Comments Panel (`/components/collaboration/comments-panel.tsx`)
```typescript
interface CommentsPanelProps {
  resourceType: 'contract' | 'template'
  resourceId: string
  currentUserId: string
  canComment: boolean
}

// Features:
// - Thread-based comments
// - Reply functionality
// - Resolve/unresolve
// - Delete own comments
// - Filter by status
// - Highlight text selection
```

#### Access Request (`/components/collaboration/access-request.tsx`)
```typescript
interface AccessRequestProps {
  resourceType: 'contract' | 'template'
  resourceId: string
  resourceTitle: string
  ownerId: string
}

// Features:
// - Request form with message
// - Permission level selection
// - Blurred preview background
// - Loading states
```

### 4. Collaboration Dashboard Pages

#### Main Collaboration Page (`/app/collaboration/page.tsx`)
- List all shared documents
- Filter by: shared with me, shared by me
- Search functionality
- Grid/list view toggle
- Access level indicators

#### Collaborative Contract View (`/app/collaboration/contract/[id]/page.tsx`)
Structure similar to dashboard but with:
- Real-time cursors
- Live presence indicators
- Comments panel
- Track changes toggle
- Synchronized scrolling option

**Layout:**
```
[Top Navigation with Collaborators]
[Three-panel layout:]
  [Sidebar - Document List] | [Editor with Cursors] | [Analysis + Comments]
```

### 5. Real-time Implementation with Supabase

#### Presence System (`/lib/collaboration/presence.ts`)
```typescript
// Subscribe to presence channel
const channel = supabase.channel(`presence:${resourceType}:${resourceId}`)

// Track presence
channel.on('presence', { event: 'sync' }, () => {
  const state = channel.presenceState()
  // Update collaborators list
})

// Send cursor updates
const updateCursor = debounce((position: number) => {
  channel.track({
    user_id: userId,
    cursor_position: position,
    selection: getSelection()
  })
}, 100)
```

#### Document Changes (`/lib/collaboration/changes.ts`)
```typescript
// Subscribe to document changes
supabase
  .channel(`changes:${resourceType}:${resourceId}`)
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'document_changes',
    filter: `resource_id=eq.${resourceId}`
  }, (payload) => {
    // Apply changes to document
  })
```

### 6. Styling Guidelines

#### Color Variables for Collaboration
Add to `/app/styles/base.css`:
```css
:root {
  /* Collaboration colors */
  --collab-user-1: #3B82F6;
  --collab-user-2: #10B981;
  --collab-user-3: #F59E0B;
  --collab-user-4: #EF4444;
  --collab-user-5: #8B5CF6;
  --collab-user-6: #EC4899;
  --collab-user-7: #14B8A6;
  --collab-user-8: #F97316;
}
```

#### Cursor Styles (`/components/collaboration/collaboration.module.css`)
```css
.collaboratorCursor {
  position: absolute;
  width: 2px;
  transition: top 0.1s ease-out;
  pointer-events: none;
}

.collaboratorSelection {
  position: absolute;
  opacity: 0.3;
  pointer-events: none;
}

.collaboratorLabel {
  position: absolute;
  top: -20px;
  left: 0;
  font-size: 12px;
  padding: 2px 6px;
  border-radius: 3px;
  white-space: nowrap;
  color: white;
}
```

### 7. Integration Points

#### Update Existing Components:

1. **Contract/Template Lists**: Add share button and collaborator avatars
2. **Top Navigation**: Show collaborators when in shared document
3. **Editor Components**: Integrate cursor tracking and live updates
4. **Analysis Panels**: Add comments toggle button

#### Middleware Updates:
Add collaboration routes to protected paths in `middleware.ts`

#### Database Hooks:
Create Supabase functions to:
- Auto-track document changes
- Clean up stale presence data
- Send notifications for new shares/comments

### 8. Security Considerations

1. **Always check permissions** before any operation
2. **Use RLS policies** - don't bypass them
3. **Validate share links** with expiration
4. **Sanitize user input** in comments
5. **Rate limit** share creation and access requests

### 9. Performance Optimizations

1. **Debounce cursor updates** (100ms)
2. **Batch presence updates** 
3. **Lazy load comments** with pagination
4. **Cache user profiles** for avatars
5. **Use optimistic updates** for better UX

### 10. Testing Checklist

- [ ] Share modal creates proper permissions
- [ ] Real-time cursors work across browsers
- [ ] Comments thread properly
- [ ] Access requests notify owners
- [ ] Permissions cascade to child folders
- [ ] Document changes are tracked
- [ ] Presence cleanup on disconnect
- [ ] Mobile responsive design
- [ ] Keyboard navigation works
- [ ] Screen reader accessible

## Next Steps Priority Order

1. Create TypeScript types and API structure
2. Implement share modal and basic sharing
3. Build collaboration dashboard
4. Add real-time presence
5. Implement comments system
6. Add track changes view
7. Create access request flow
8. Polish and optimize

## Important Notes

- Maintain consistent styling with existing app
- Use existing notification system for alerts
- Follow established patterns for API routes
- Test with multiple users simultaneously
- Consider mobile experience from the start

Good luck with the implementation! The foundation is solid, and the migration is complete.