import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { CreateShareInput } from '@/lib/types/collaboration'

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

    const body: CreateShareInput = await request.json()
    const { resource_type, resource_id, shared_with_email, permission, expires_at } = body

    // Verify the current user owns the resource or has admin permission
    const hasAccess = await verifyResourceAccess(supabase, user.id, resource_type, resource_id)
    if (!hasAccess) {
      return NextResponse.json(
        { error: 'You do not have permission to share this resource' },
        { status: 403 }
      )
    }

    // Find the user to share with by email
    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', shared_with_email)
      .single()

    if (profileError || !profiles) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Check if share already exists
    const { data: existingShare } = await supabase
      .from('shares')
      .select('id')
      .eq('resource_type', resource_type)
      .eq('resource_id', resource_id)
      .eq('shared_with', profiles.id)
      .single()

    if (existingShare) {
      // Update existing share
      const { data: updatedShare, error: updateError } = await supabase
        .from('shares')
        .update({
          permission,
          expires_at,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingShare.id)
        .select(`
          *,
          shared_by_profile:profiles!shares_shared_by_fkey(id, email, display_name, avatar_url),
          shared_with_profile:profiles!shares_shared_with_fkey(id, email, display_name, avatar_url)
        `)
        .single()

      if (updateError) throw updateError
      
      return NextResponse.json({ share: updatedShare })
    }

    // Create new share
    const { data: newShare, error: createError } = await supabase
      .from('shares')
      .insert({
        resource_type,
        resource_id,
        shared_by: user.id,
        shared_with: profiles.id,
        permission,
        expires_at
      })
      .select(`
        *,
        shared_by_profile:profiles!shares_shared_by_fkey(id, email, display_name, avatar_url),
        shared_with_profile:profiles!shares_shared_with_fkey(id, email, display_name, avatar_url)
      `)
      .single()

    if (createError) throw createError

    // Track the sharing action
    await supabase.from('document_changes').insert({
      resource_type: resource_type as 'contract' | 'template',
      resource_id,
      user_id: user.id,
      change_type: 'share',
      metadata: {
        shared_with: profiles.id,
        permission,
        action: 'created'
      }
    })

    return NextResponse.json({ share: newShare })
  } catch (error) {
    console.error('Error creating share:', error)
    return NextResponse.json(
      { error: 'Failed to create share' },
      { status: 500 }
    )
  }
}

async function verifyResourceAccess(
  supabase: any,
  userId: string,
  resourceType: string,
  resourceId: string
): Promise<boolean> {
  // Check ownership based on resource type
  let query
  switch (resourceType) {
    case 'contract':
      query = supabase.from('contracts').select('id').eq('id', resourceId).eq('user_id', userId)
      break
    case 'template':
      query = supabase.from('templates').select('id').eq('id', resourceId).eq('user_id', userId)
      break
    case 'folder':
      query = supabase.from('folders').select('id').eq('id', resourceId).eq('user_id', userId)
      break
    case 'template_folder':
      query = supabase.from('template_folders').select('id').eq('id', resourceId).eq('user_id', userId)
      break
    default:
      return false
  }

  const { data: resource } = await query.single()
  if (resource) return true

  // Check if user has admin permission
  const { data: share } = await supabase
    .from('shares')
    .select('permission')
    .eq('resource_type', resourceType)
    .eq('resource_id', resourceId)
    .eq('shared_with', userId)
    .eq('permission', 'admin')
    .single()

  return !!share
}