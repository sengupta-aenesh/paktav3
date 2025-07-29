import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { CommentWithProfile } from '@/lib/types/collaboration'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const url = new URL(request.url)
    const resourceType = url.searchParams.get('resourceType')
    const resourceId = url.searchParams.get('resourceId')
    const includeResolved = url.searchParams.get('includeResolved') === 'true'
    
    if (!resourceType || !resourceId) {
      return NextResponse.json(
        { error: 'Missing resourceType or resourceId' },
        { status: 400 }
      )
    }
    
    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Verify user has access to view comments
    const hasAccess = await verifyViewAccess(supabase, user.id, resourceType, resourceId)
    if (!hasAccess) {
      return NextResponse.json(
        { error: 'You do not have permission to view comments for this resource' },
        { status: 403 }
      )
    }

    // Build query
    let query = supabase
      .from('comments')
      .select(`
        *,
        user_profile:profiles!comments_user_id_fkey(id, email, display_name, avatar_url, collaboration_color)
      `)
      .eq('resource_type', resourceType)
      .eq('resource_id', resourceId)
      .is('parent_id', null) // Only get top-level comments
      .order('created_at', { ascending: false })

    // Filter by resolved status
    if (!includeResolved) {
      query = query.eq('resolved', false)
    }

    const { data: comments, error: commentsError } = await query

    if (commentsError) throw commentsError

    // Fetch replies for each comment
    const commentsWithReplies: CommentWithProfile[] = []
    
    for (const comment of comments || []) {
      const { data: replies } = await supabase
        .from('comments')
        .select(`
          *,
          user_profile:profiles!comments_user_id_fkey(id, email, display_name, avatar_url, collaboration_color)
        `)
        .eq('parent_id', comment.id)
        .order('created_at', { ascending: true })

      commentsWithReplies.push({
        ...comment,
        replies: replies || []
      })
    }

    return NextResponse.json({ comments: commentsWithReplies })
  } catch (error) {
    console.error('Error fetching comments:', error)
    return NextResponse.json(
      { error: 'Failed to fetch comments' },
      { status: 500 }
    )
  }
}

async function verifyViewAccess(
  supabase: any,
  userId: string,
  resourceType: string,
  resourceId: string
): Promise<boolean> {
  // Check ownership
  let isOwner = false
  if (resourceType === 'contract') {
    const { data } = await supabase
      .from('contracts')
      .select('user_id')
      .eq('id', resourceId)
      .single()
    isOwner = data?.user_id === userId
  } else if (resourceType === 'template') {
    const { data } = await supabase
      .from('templates')
      .select('user_id')
      .eq('id', resourceId)
      .single()
    isOwner = data?.user_id === userId
  }

  if (isOwner) return true

  // Check if user has any share permission
  const { data: share } = await supabase
    .from('shares')
    .select('id')
    .eq('resource_type', resourceType)
    .eq('resource_id', resourceId)
    .eq('shared_with', userId)
    .single()

  return !!share
}