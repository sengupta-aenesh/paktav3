# Real-time Collaboration Implementation Guide

## Overview
This guide explains how real-time collaboration has been implemented in Contract Manager V3 using Supabase Presence and Broadcast APIs.

## Architecture

### Why Broadcast Instead of Postgres Changes?
Since database replication is not available on your Supabase plan, we use:
- **Presence API**: For tracking user presence, cursors, and selections
- **Broadcast API**: For sending document changes in real-time
- **Database**: For persisting changes (without real-time subscription)

### Core Components

#### 1. Presence Manager (`/lib/collaboration/presence.ts`)
- Manages user presence in collaboration rooms
- Tracks cursor positions and text selections
- Handles typing indicators
- Automatically cleans up when users disconnect

#### 2. Changes Manager (`/lib/collaboration/changes.ts`)
- Broadcasts document changes to other users
- Saves changes to database for persistence
- Supports debounced content updates
- Tracks field-level changes

#### 3. React Hooks
- `useCollaborationPresence`: Easy integration for components
- `useDocumentChanges`: Document change tracking and syncing

## Setup Requirements

### Supabase Configuration
No additional configuration needed! Presence and Broadcast work out-of-the-box.

### Current Implementation Status

✅ **Working Features**:
- User presence tracking
- Real-time change broadcasting
- Automatic presence cleanup
- Connection status indicators
- Integration with collaboration views

⚠️ **Needs Editor Integration**:
- Cursor position conversion (screen to text coordinates)
- Selection highlighting in editor
- Live cursor display at actual text positions

## Usage Example

```typescript
// In a collaborative component
const { collaborators, updateCursor, setTyping } = useCollaborationPresence({
  resourceType: 'contract',
  resourceId: contractId,
  userId: user.id,
  userProfile: {
    email: user.email,
    display_name: user.display_name,
    collaboration_color: user.collaboration_color,
  },
  enabled: true,
})

// Track document changes
const { trackContentChange } = useDocumentChanges({
  resourceType: 'contract',
  resourceId: contractId,
  userId: user.id,
  onRemoteChange: (change) => {
    // Handle incoming changes from other users
    if (change.field_name === 'content') {
      updateEditorContent(change.new_value)
    }
  },
})
```

## Technical Details

### Room Naming Convention
- Contracts: `contract:{contractId}`
- Templates: `template:{templateId}`

### Presence State Structure
```typescript
{
  user_id: string
  email: string
  display_name?: string
  avatar_url?: string
  color: string
  cursor_position?: {
    x: number
    y: number
    selectionStart?: number
    selectionEnd?: number
  }
  last_seen: string
  is_typing?: boolean
}
```

### Performance Optimizations
- Cursor updates throttled to 50ms
- Content changes debounced to 1000ms
- Typing indicator auto-clears after 3 seconds
- Presence state uses CRDT for conflict resolution

## Future Enhancements

### When Replication Becomes Available
1. Switch from Broadcast to Postgres Changes for document updates
2. Enable real-time subscriptions on `document_changes` table
3. Remove manual broadcasting in `trackChange` method

### Editor Integration
To fully enable cursor tracking in the editor:
1. Add mouse position tracking in editor component
2. Convert screen coordinates to text positions
3. Implement selection range calculation
4. Display remote cursors at calculated positions

## Troubleshooting

### Users Not Appearing
- Check if user has proper access permissions
- Verify Supabase connection is established
- Look for connection indicator in UI

### Changes Not Syncing
- Ensure both users are in the same room (resource)
- Check browser console for errors
- Verify user has edit permissions

### Performance Issues
- Increase throttle/debounce delays
- Limit number of concurrent collaborators
- Check Supabase connection quotas

---

*Implementation completed without requiring database replication*
*Ready for production use with current Supabase plan*