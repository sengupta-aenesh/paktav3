import { Database } from '@/lib/database.types'

// Base database types
type DbShare = Database['public']['Tables']['shares']['Row']
type DbComment = Database['public']['Tables']['comments']['Row']
type DbDocumentChange = Database['public']['Tables']['document_changes']['Row']
type DbPresence = Database['public']['Tables']['presence']['Row']
type DbAccessRequest = Database['public']['Tables']['access_requests']['Row']

// Profile type for collaboration
export interface Profile {
  id: string
  email: string
  display_name: string | null
  avatar_url: string | null
  collaboration_color: string | null
}

// Extended types with relationships
export interface Share extends DbShare {
  shared_by_profile?: Profile
  shared_with_profile?: Profile
}

export interface Comment extends DbComment {
  user_profile?: Profile
  replies?: Comment[]
}

export interface DocumentChange extends DbDocumentChange {
  user_profile?: Profile
}

export interface AccessRequest extends DbAccessRequest {
  requester_profile?: Profile
  owner_profile?: Profile
}

// Collaboration-specific types
export interface CollaboratorPresence {
  user_id: string
  profile: Profile
  cursor_position?: number
  selection?: { start: number; end: number }
  color: string
  last_seen: string
}

export interface CollaborationPermission {
  canView: boolean
  canEdit: boolean
  canAdmin: boolean
  canShare: boolean
  canComment: boolean
}

// Share creation types
export interface CreateShareInput {
  resource_type: 'contract' | 'template' | 'folder' | 'template_folder'
  resource_id: string
  shared_with_email: string
  permission: 'view' | 'edit' | 'admin'
  expires_at?: string | null
}

export interface UpdateShareInput {
  permission?: 'view' | 'edit' | 'admin'
  expires_at?: string | null
}

// Comment types
export interface CreateCommentInput {
  resource_type: 'contract' | 'template'
  resource_id: string
  content: string
  selection_start?: number | null
  selection_end?: number | null
  parent_id?: string | null
}

export interface UpdateCommentInput {
  content?: string
  resolved?: boolean
  resolved_by?: string
}

// Access request types
export interface CreateAccessRequestInput {
  resource_type: 'contract' | 'template' | 'folder' | 'template_folder'
  resource_id: string
  owner_id: string
  requested_permission: 'view' | 'edit'
  message?: string
}

export interface UpdateAccessRequestInput {
  status: 'approved' | 'denied'
}

// Document change types
export interface CreateDocumentChangeInput {
  resource_type: 'contract' | 'template'
  resource_id: string
  change_type: 'edit' | 'comment' | 'share' | 'analysis' | 'resolve_risk'
  before_content?: string | null
  after_content?: string | null
  metadata?: any
}

// Real-time types
export interface PresenceState {
  [userId: string]: {
    user_id: string
    profile: Profile
    cursor_position?: number
    selection?: { start: number; end: number }
    color: string
    online_at: string
  }
}

export interface RealtimeDocumentChange {
  type: 'insert' | 'delete' | 'update'
  position: number
  content?: string
  length?: number
  user_id: string
  timestamp: string
}

// Response types for API
export interface ShareWithProfiles extends Share {
  shared_by_profile: Profile
  shared_with_profile: Profile
}

export interface CommentWithProfile extends Comment {
  user_profile: Profile
}

export interface SharedResource {
  id: string
  type: 'contract' | 'template' | 'folder' | 'template_folder'
  title: string
  shared_by: Profile
  permission: 'view' | 'edit' | 'admin'
  shared_at: string
  last_modified?: string
  collaborator_count: number
}

// Permission check types
export interface ResourceAccess {
  hasAccess: boolean
  permission?: 'view' | 'edit' | 'admin'
  isOwner: boolean
  sharedBy?: Profile
}

// User search types
export interface UserSearchResult {
  id: string
  email: string
  display_name: string | null
  avatar_url: string | null
  isAlreadyShared?: boolean
  currentPermission?: 'view' | 'edit' | 'admin'
}