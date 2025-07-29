import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const url = new URL(request.url)
    const resourceType = url.searchParams.get('resourceType')
    const resourceId = url.searchParams.get('resourceId')
    
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

    // Verify user has access to view shares (owner or has permission)
    const hasAccess = await verifyViewAccess(supabase, user.id, resourceType, resourceId)
    if (!hasAccess) {
      return NextResponse.json(
        { error: 'You do not have permission to view shares for this resource' },
        { status: 403 }
      )
    }

    // Get all shares for the resource
    const { data: shares, error: sharesError } = await supabase
      .from('shares')
      .select(`
        *,
        shared_by_profile:profiles!shares_shared_by_fkey(id, email, display_name, avatar_url, collaboration_color),
        shared_with_profile:profiles!shares_shared_with_fkey(id, email, display_name, avatar_url, collaboration_color)
      `)
      .eq('resource_type', resourceType)
      .eq('resource_id', resourceId)
      .order('created_at', { ascending: false })

    if (sharesError) throw sharesError

    return NextResponse.json({ shares: shares || [] })
  } catch (error) {
    console.error('Error fetching shares:', error)
    return NextResponse.json(
      { error: 'Failed to fetch shares' },
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

  // Check if user has any permission on the resource
  const { data: share } = await supabase
    .from('shares')
    .select('id')
    .eq('resource_type', resourceType)
    .eq('resource_id', resourceId)
    .eq('shared_with', userId)
    .single()

  return !!share
}