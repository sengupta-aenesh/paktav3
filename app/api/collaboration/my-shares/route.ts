import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { ShareWithProfiles } from '@/lib/types/collaboration'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const url = new URL(request.url)
    const type = url.searchParams.get('type') || undefined
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Build query for shares created by the user
    let query = supabase
      .from('shares')
      .select(`
        *,
        shared_with_profile:profiles!shares_shared_with_fkey(
          id,
          email,
          display_name,
          avatar_url,
          collaboration_color
        ),
        resource:contracts(id, title, content, updated_at, analysis_cache),
        resource_template:templates(id, title, content, updated_at, analysis_cache),
        resource_folder:folders(id, name, updated_at),
        resource_template_folder:template_folders(id, name, updated_at)
      `)
      .eq('shared_by', user.id)
      .order('created_at', { ascending: false })

    // Filter by type if specified
    if (type) {
      query = query.eq('resource_type', type)
    }

    const { data: shares, error } = await query

    if (error) {
      console.error('Error fetching my shares:', error)
      return NextResponse.json({ error: 'Failed to fetch shares' }, { status: 500 })
    }

    // Transform the data to include the correct resource based on type
    const transformedShares: ShareWithProfiles[] = (shares || []).map(share => {
      let resource = null
      
      switch (share.resource_type) {
        case 'contract':
          resource = share.resource
          break
        case 'template':
          resource = share.resource_template
          break
        case 'folder':
          resource = share.resource_folder
          break
        case 'template_folder':
          resource = share.resource_template_folder
          break
      }

      return {
        ...share,
        resource,
        // Remove the individual resource fields
        resource_contract: undefined,
        resource_template: undefined,
        resource_folder: undefined,
        resource_template_folder: undefined
      }
    })

    return NextResponse.json({ shares: transformedShares })
  } catch (error) {
    console.error('Error in my-shares endpoint:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}