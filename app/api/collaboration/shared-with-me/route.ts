import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { SharedResource } from '@/lib/types/collaboration'

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
    const filter = searchParams.get('filter') // 'shared-with-me' | 'shared-by-me'
    const resourceType = searchParams.get('type') // optional filter by type

    let sharesQuery = supabase
      .from('shares')
      .select(`
        *,
        shared_by_profile:profiles!shares_shared_by_fkey(id, email, display_name, avatar_url),
        shared_with_profile:profiles!shares_shared_with_fkey(id, email, display_name, avatar_url)
      `)

    // Apply filters
    if (filter === 'shared-by-me') {
      sharesQuery = sharesQuery.eq('shared_by', user.id)
    } else {
      // Default to shared-with-me
      sharesQuery = sharesQuery.eq('shared_with', user.id)
    }

    if (resourceType) {
      sharesQuery = sharesQuery.eq('resource_type', resourceType)
    }

    const { data: shares, error: sharesError } = await sharesQuery
      .order('shared_at', { ascending: false })

    if (sharesError) throw sharesError

    // Fetch resource details for each share
    const sharedResources: SharedResource[] = []
    
    for (const share of shares || []) {
      let resourceData: any = null
      let title = 'Untitled'
      let lastModified: string | undefined

      // Fetch resource based on type
      switch (share.resource_type) {
        case 'contract':
          const { data: contract } = await supabase
            .from('contracts')
            .select('title, updated_at')
            .eq('id', share.resource_id)
            .single()
          if (contract) {
            title = contract.title
            lastModified = contract.updated_at
          }
          break
        case 'template':
          const { data: template } = await supabase
            .from('templates')
            .select('title, updated_at')
            .eq('id', share.resource_id)
            .single()
          if (template) {
            title = template.title
            lastModified = template.updated_at
          }
          break
        case 'folder':
          const { data: folder } = await supabase
            .from('folders')
            .select('name, updated_at')
            .eq('id', share.resource_id)
            .single()
          if (folder) {
            title = folder.name
            lastModified = folder.updated_at
          }
          break
        case 'template_folder':
          const { data: templateFolder } = await supabase
            .from('template_folders')
            .select('name, updated_at')
            .eq('id', share.resource_id)
            .single()
          if (templateFolder) {
            title = templateFolder.name
            lastModified = templateFolder.updated_at
          }
          break
      }

      // Get collaborator count
      const { count: collaboratorCount } = await supabase
        .from('shares')
        .select('id', { count: 'exact', head: true })
        .eq('resource_type', share.resource_type)
        .eq('resource_id', share.resource_id)

      sharedResources.push({
        id: share.resource_id,
        type: share.resource_type as 'contract' | 'template' | 'folder' | 'template_folder',
        title,
        shared_by: filter === 'shared-by-me' ? share.shared_with_profile : share.shared_by_profile,
        permission: share.permission as 'view' | 'edit' | 'admin',
        shared_at: share.shared_at,
        last_modified: lastModified,
        collaborator_count: (collaboratorCount || 0) + 1 // +1 for owner
      })
    }

    return NextResponse.json({ resources: sharedResources })
  } catch (error) {
    console.error('Error fetching shared resources:', error)
    return NextResponse.json(
      { error: 'Failed to fetch shared resources' },
      { status: 500 }
    )
  }
}