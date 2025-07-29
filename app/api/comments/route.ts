import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { CreateCommentInput } from '@/lib/types/collaboration'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body: CreateCommentInput = await request.json()
    const { resource_type, resource_id, content, selection_start, selection_end, parent_id } = body

    // Verify user has access to comment
    const hasAccess = await verifyCommentAccess(supabase, user.id, resource_type, resource_id)
    if (!hasAccess) {
      return NextResponse.json(
        { error: 'You do not have permission to comment on this resource' },
        { status: 403 }
      )
    }

    // Create the comment
    const { data: newComment, error: createError } = await supabase
      .from('comments')
      .insert({
        resource_type,
        resource_id,
        user_id: user.id,
        content,
        selection_start,
        selection_end,
        parent_id
      })
      .select(`
        *,
        user_profile:profiles!comments_user_id_fkey(id, email, display_name, avatar_url, collaboration_color)
      `)
      .single()

    if (createError) throw createError

    // Track the change
    await supabase.from('document_changes').insert({
      resource_type,
      resource_id,
      user_id: user.id,
      change_type: 'comment',
      metadata: {
        comment_id: newComment.id,
        action: 'created',
        parent_id
      }
    })

    return NextResponse.json({ comment: newComment })
  } catch (error) {
    console.error('Error creating comment:', error)
    return NextResponse.json(
      { error: 'Failed to create comment' },
      { status: 500 }
    )
  }
}

async function verifyCommentAccess(
  supabase: any,
  userId: string,
  resourceType: 'contract' | 'template',
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