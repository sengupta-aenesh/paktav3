import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()
    const body = await request.json()
    const { content, resolved } = body
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    // Check if user has permission to update this comment
    const { data: comment, error: fetchError } = await supabase
      .from('comments')
      .select('user_id, resource_type, resource_id')
      .eq('id', params.id)
      .single()
    
    if (fetchError || !comment) {
      return NextResponse.json({ error: 'Comment not found' }, { status: 404 })
    }
    
    // Check if user has access to the resource
    const { data: share } = await supabase
      .from('shares')
      .select('permission')
      .eq('resource_type', comment.resource_type)
      .eq('resource_id', comment.resource_id)
      .eq('shared_with', user.id)
      .single()
    
    // Check if user is owner
    let hasAccess = false
    let isOwner = false
    
    switch (comment.resource_type) {
      case 'contract':
        const { data: contract } = await supabase
          .from('contracts')
          .select('user_id')
          .eq('id', comment.resource_id)
          .single()
        isOwner = contract?.user_id === user.id
        break
      case 'template':
        const { data: template } = await supabase
          .from('templates')
          .select('user_id')
          .eq('id', comment.resource_id)
          .single()
        isOwner = template?.user_id === user.id
        break
    }
    
    hasAccess = isOwner || (share && share.permission && share.permission !== 'view')
    
    // Only comment author or users with edit+ access can update
    if (comment.user_id !== user.id && !hasAccess) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }
    
    // Update comment
    const updateData: any = { updated_at: new Date().toISOString() }
    if (content !== undefined) updateData.content = content
    if (resolved !== undefined) updateData.resolved = resolved
    
    const { data: updatedComment, error: updateError } = await supabase
      .from('comments')
      .update(updateData)
      .eq('id', params.id)
      .select()
      .single()
    
    if (updateError) {
      console.error('Error updating comment:', updateError)
      return NextResponse.json({ error: 'Failed to update comment' }, { status: 500 })
    }
    
    return NextResponse.json({ comment: updatedComment })
  } catch (error) {
    console.error('Error in comment update endpoint:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    // Check if user owns this comment
    const { data: comment, error: fetchError } = await supabase
      .from('comments')
      .select('user_id')
      .eq('id', params.id)
      .single()
    
    if (fetchError || !comment) {
      return NextResponse.json({ error: 'Comment not found' }, { status: 404 })
    }
    
    if (comment.user_id !== user.id) {
      return NextResponse.json({ error: 'Only comment author can delete' }, { status: 403 })
    }
    
    // Delete comment (cascade will handle replies)
    const { error: deleteError } = await supabase
      .from('comments')
      .delete()
      .eq('id', params.id)
    
    if (deleteError) {
      console.error('Error deleting comment:', deleteError)
      return NextResponse.json({ error: 'Failed to delete comment' }, { status: 500 })
    }
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in comment delete endpoint:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}