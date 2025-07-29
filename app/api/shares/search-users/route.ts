import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { UserSearchResult } from '@/lib/types/collaboration'

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
    const query = searchParams.get('q')
    const resourceType = searchParams.get('resourceType')
    const resourceId = searchParams.get('resourceId')

    if (!query || query.length < 2) {
      return NextResponse.json(
        { error: 'Query must be at least 2 characters' },
        { status: 400 }
      )
    }

    // Search for users by email or display name
    const { data: profiles, error: searchError } = await supabase
      .from('profiles')
      .select('id, email, display_name, avatar_url')
      .or(`email.ilike.%${query}%,display_name.ilike.%${query}%`)
      .neq('id', user.id) // Exclude current user
      .limit(10)

    if (searchError) throw searchError

    // If resource info provided, check existing shares
    let existingShares: Map<string, any> = new Map()
    if (resourceType && resourceId) {
      const { data: shares } = await supabase
        .from('shares')
        .select('shared_with, permission')
        .eq('resource_type', resourceType)
        .eq('resource_id', resourceId)

      if (shares) {
        shares.forEach(share => {
          existingShares.set(share.shared_with, share.permission)
        })
      }
    }

    // Format results
    const results: UserSearchResult[] = (profiles || []).map(profile => ({
      id: profile.id,
      email: profile.email || '',
      display_name: profile.display_name,
      avatar_url: profile.avatar_url,
      isAlreadyShared: existingShares.has(profile.id),
      currentPermission: existingShares.get(profile.id)
    }))

    return NextResponse.json({ users: results })
  } catch (error) {
    console.error('Error searching users:', error)
    return NextResponse.json(
      { error: 'Failed to search users' },
      { status: 500 }
    )
  }
}