import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { UpdateShareInput } from '@/lib/types/collaboration'

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const body: UpdateShareInput = await request.json()
    const { permission, expires_at } = body

    // Get the share to verify ownership
    const { data: share, error: shareError } = await supabase
      .from('shares')
      .select('*, resource_type, resource_id, shared_by')
      .eq('id', params.id)
      .single()

    if (shareError || !share) {
      return NextResponse.json(
        { error: 'Share not found' },
        { status: 404 }
      )
    }

    // Verify user has permission to update (owner or admin)
    const canUpdate = share.shared_by === user.id || 
      await hasAdminPermission(supabase, user.id, share.resource_type, share.resource_id)

    if (!canUpdate) {
      return NextResponse.json(
        { error: 'You do not have permission to update this share' },
        { status: 403 }
      )
    }

    // Update the share
    const { data: updatedShare, error: updateError } = await supabase
      .from('shares')
      .update({
        ...(permission && { permission }),
        ...(expires_at !== undefined && { expires_at }),
        updated_at: new Date().toISOString()
      })
      .eq('id', params.id)
      .select(`
        *,
        shared_by_profile:profiles!shares_shared_by_fkey(id, email, display_name, avatar_url),
        shared_with_profile:profiles!shares_shared_with_fkey(id, email, display_name, avatar_url)
      `)
      .single()

    if (updateError) throw updateError

    // Track the change
    await supabase.from('document_changes').insert({
      resource_type: share.resource_type as 'contract' | 'template',
      resource_id: share.resource_id,
      user_id: user.id,
      change_type: 'share',
      metadata: {
        share_id: params.id,
        permission,
        action: 'updated'
      }
    })

    return NextResponse.json({ share: updatedShare })
  } catch (error) {
    console.error('Error updating share:', error)
    return NextResponse.json(
      { error: 'Failed to update share' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    // Get the share to verify ownership
    const { data: share, error: shareError } = await supabase
      .from('shares')
      .select('*, resource_type, resource_id, shared_by, shared_with')
      .eq('id', params.id)
      .single()

    if (shareError || !share) {
      return NextResponse.json(
        { error: 'Share not found' },
        { status: 404 }
      )
    }

    // Verify user has permission to delete (owner, admin, or the person being shared with)
    const canDelete = share.shared_by === user.id || 
      share.shared_with === user.id ||
      await hasAdminPermission(supabase, user.id, share.resource_type, share.resource_id)

    if (!canDelete) {
      return NextResponse.json(
        { error: 'You do not have permission to remove this share' },
        { status: 403 }
      )
    }

    // Delete the share
    const { error: deleteError } = await supabase
      .from('shares')
      .delete()
      .eq('id', params.id)

    if (deleteError) throw deleteError

    // Track the change
    await supabase.from('document_changes').insert({
      resource_type: share.resource_type as 'contract' | 'template',
      resource_id: share.resource_id,
      user_id: user.id,
      change_type: 'share',
      metadata: {
        share_id: params.id,
        shared_with: share.shared_with,
        action: 'removed'
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting share:', error)
    return NextResponse.json(
      { error: 'Failed to delete share' },
      { status: 500 }
    )
  }
}

async function hasAdminPermission(
  supabase: any,
  userId: string,
  resourceType: string,
  resourceId: string
): Promise<boolean> {
  const { data: adminShare } = await supabase
    .from('shares')
    .select('id')
    .eq('resource_type', resourceType)
    .eq('resource_id', resourceId)
    .eq('shared_with', userId)
    .eq('permission', 'admin')
    .single()

  return !!adminShare
}