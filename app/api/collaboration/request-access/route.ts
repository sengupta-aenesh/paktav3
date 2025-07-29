import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await request.json()
    
    const { resource_type, resource_id, requested_permission, message } = body
    
    // Validate input
    if (!resource_type || !resource_id || !requested_permission) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    // Get the resource owner
    let ownerId = null
    let resourceTitle = 'Untitled'
    
    switch (resource_type) {
      case 'contract':
        const { data: contract } = await supabase
          .from('contracts')
          .select('user_id, title')
          .eq('id', resource_id)
          .single()
        ownerId = contract?.user_id
        resourceTitle = contract?.title || 'Contract'
        break
        
      case 'template':
        const { data: template } = await supabase
          .from('templates')
          .select('user_id, title')
          .eq('id', resource_id)
          .single()
        ownerId = template?.user_id
        resourceTitle = template?.title || 'Template'
        break
        
      case 'folder':
        const { data: folder } = await supabase
          .from('folders')
          .select('user_id, name')
          .eq('id', resource_id)
          .single()
        ownerId = folder?.user_id
        resourceTitle = folder?.name || 'Folder'
        break
        
      case 'template_folder':
        const { data: templateFolder } = await supabase
          .from('template_folders')
          .select('user_id, name')
          .eq('id', resource_id)
          .single()
        ownerId = templateFolder?.user_id
        resourceTitle = templateFolder?.name || 'Template Folder'
        break
    }
    
    if (!ownerId) {
      return NextResponse.json({ error: 'Resource not found' }, { status: 404 })
    }
    
    // Check if user already has access
    const { data: existingShare } = await supabase
      .from('shares')
      .select('id')
      .eq('resource_type', resource_type)
      .eq('resource_id', resource_id)
      .eq('shared_with', user.id)
      .single()
    
    if (existingShare) {
      return NextResponse.json({ error: 'You already have access to this resource' }, { status: 400 })
    }
    
    // Check if there's already a pending request
    const { data: existingRequest } = await supabase
      .from('access_requests')
      .select('id, status')
      .eq('resource_type', resource_type)
      .eq('resource_id', resource_id)
      .eq('requested_by', user.id)
      .eq('status', 'pending')
      .single()
    
    if (existingRequest) {
      return NextResponse.json({ error: 'You already have a pending request for this resource' }, { status: 400 })
    }
    
    // Create access request
    const { data: request, error: requestError } = await supabase
      .from('access_requests')
      .insert({
        resource_type,
        resource_id,
        resource_owner: ownerId,
        requested_by: user.id,
        requested_permission,
        message,
        status: 'pending'
      })
      .select()
      .single()
    
    if (requestError) {
      console.error('Error creating access request:', requestError)
      return NextResponse.json({ error: 'Failed to create access request' }, { status: 500 })
    }
    
    // TODO: Send notification to resource owner
    // This would integrate with your notification system
    
    return NextResponse.json({ request })
  } catch (error) {
    console.error('Error in request-access endpoint:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const url = new URL(request.url)
    const status = url.searchParams.get('status') || 'pending'
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    // Get access requests for resources owned by the user
    const { data: requests, error } = await supabase
      .from('access_requests')
      .select(`
        *,
        requested_by_profile:profiles!access_requests_requested_by_fkey(
          id,
          email,
          display_name,
          avatar_url
        )
      `)
      .eq('resource_owner', user.id)
      .eq('status', status)
      .order('created_at', { ascending: false })
    
    if (error) {
      console.error('Error fetching access requests:', error)
      return NextResponse.json({ error: 'Failed to fetch access requests' }, { status: 500 })
    }
    
    return NextResponse.json({ requests: requests || [] })
  } catch (error) {
    console.error('Error in request-access GET endpoint:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}