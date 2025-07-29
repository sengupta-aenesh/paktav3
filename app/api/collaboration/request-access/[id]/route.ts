import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()
    const body = await request.json()
    const { status, permission } = body
    
    // Validate input
    if (!status || !['approved', 'denied'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
    }
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    // Get the access request
    const { data: accessRequest, error: fetchError } = await supabase
      .from('access_requests')
      .select('*')
      .eq('id', params.id)
      .single()
    
    if (fetchError || !accessRequest) {
      return NextResponse.json({ error: 'Access request not found' }, { status: 404 })
    }
    
    // Verify the current user owns the resource
    if (accessRequest.resource_owner !== user.id) {
      return NextResponse.json({ error: 'Only resource owner can handle requests' }, { status: 403 })
    }
    
    // Update the request status
    const { error: updateError } = await supabase
      .from('access_requests')
      .update({ 
        status,
        updated_at: new Date().toISOString()
      })
      .eq('id', params.id)
    
    if (updateError) {
      console.error('Error updating access request:', updateError)
      return NextResponse.json({ error: 'Failed to update request' }, { status: 500 })
    }
    
    // If approved, create a share
    if (status === 'approved' && permission) {
      const { error: shareError } = await supabase
        .from('shares')
        .insert({
          resource_type: accessRequest.resource_type,
          resource_id: accessRequest.resource_id,
          shared_by: user.id,
          shared_with: accessRequest.requested_by,
          permission: permission,
        })
      
      if (shareError) {
        console.error('Error creating share:', shareError)
        // Don't fail the whole operation if share creation fails
        // The request is already marked as approved
      }
      
      // Track the share action
      await supabase
        .from('document_changes')
        .insert({
          resource_type: accessRequest.resource_type,
          resource_id: accessRequest.resource_id,
          user_id: user.id,
          change_type: 'create',
          field_name: 'share',
          new_value: {
            shared_with: accessRequest.requested_by,
            permission: permission,
            from_request: true
          },
          metadata: {
            action: 'approved_access_request',
            request_id: params.id
          }
        })
    }
    
    // TODO: Send notification to the requester
    // This would integrate with your notification system
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in request-access update endpoint:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}