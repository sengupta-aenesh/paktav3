import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { ResourceAccess } from '@/lib/types/collaboration'

export async function GET(request: NextRequest) {
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

    const searchParams = request.nextUrl.searchParams
    const resourceType = searchParams.get('resourceType')
    const resourceId = searchParams.get('resourceId')

    if (!resourceType || !resourceId) {
      return NextResponse.json(
        { error: 'Resource type and ID are required' },
        { status: 400 }
      )
    }

    // Check ownership
    let isOwner = false
    switch (resourceType) {
      case 'contract':
        const { data: contract } = await supabase
          .from('contracts')
          .select('user_id')
          .eq('id', resourceId)
          .single()
        isOwner = contract?.user_id === user.id
        break
      case 'template':
        const { data: template } = await supabase
          .from('templates')
          .select('user_id')
          .eq('id', resourceId)
          .single()
        isOwner = template?.user_id === user.id
        break
      case 'folder':
        const { data: folder } = await supabase
          .from('folders')
          .select('user_id')
          .eq('id', resourceId)
          .single()
        isOwner = folder?.user_id === user.id
        break
      case 'template_folder':
        const { data: templateFolder } = await supabase
          .from('template_folders')
          .select('user_id')
          .eq('id', resourceId)
          .single()
        isOwner = templateFolder?.user_id === user.id
        break
    }

    // If owner, return full access
    if (isOwner) {
      const result: ResourceAccess = {
        hasAccess: true,
        permission: 'admin',
        isOwner: true
      }
      return NextResponse.json(result)
    }

    // Check for shares
    const { data: share, error: shareError } = await supabase
      .from('shares')
      .select(`
        permission,
        shared_by_profile:profiles!shares_shared_by_fkey(id, email, display_name, avatar_url, collaboration_color)
      `)
      .eq('resource_type', resourceType)
      .eq('resource_id', resourceId)
      .eq('shared_with', user.id)
      .single()

    if (shareError || !share) {
      const result: ResourceAccess = {
        hasAccess: false,
        isOwner: false
      }
      return NextResponse.json(result)
    }

    const result: ResourceAccess = {
      hasAccess: true,
      permission: share.permission as 'view' | 'edit' | 'admin',
      isOwner: false,
      sharedBy: share.shared_by_profile
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error checking access:', error)
    return NextResponse.json(
      { error: 'Failed to check access' },
      { status: 500 }
    )
  }
}