// pages/api/events/[eventId]/status.js
export default function handler(req, res) {
  const { eventId } = req.query;
  const { status } = req.body;

  if (req.method !== 'PUT') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  if (!eventId || !status) {
    return res.status(400).json({ message: 'Missing eventId or status' });
  }

  // Validate status
  const validStatuses = ['upcoming', 'active', 'completed'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ message: 'Invalid status. Must be: upcoming, active, or completed' });
  }

  try {
    // TODO: Replace with actual DynamoDB calls
    // const params = {
    //   TableName: 'Events',
    //   Key: {
    //     event_id: eventId
    //   },
    //   UpdateExpression: 'SET #status = :status, updated_at = :updated_at',
    //   ExpressionAttributeNames: {
    //     '#status': 'status'
    //   },
    //   ExpressionAttributeValues: {
    //     ':status': status,
    //     ':updated_at': new Date().toISOString()
    //   },
    //   ReturnValues: 'ALL_NEW'
    // };
    // 
    // const result = await dynamoDb.update(params).promise();

    console.log(`Event ${eventId} status changed to: ${status}`);
    
    // Log important status changes
    if (status === 'active') {
      console.log(`🟢 Event ${eventId} is now ACTIVE - check-ins enabled`);
    } else if (status === 'completed') {
      console.log(`🔴 Event ${eventId} is now COMPLETED - no more check-ins`);
      
      // TODO: Optionally trigger post-event workflows
      // - Send follow-up emails
      // - Generate event summary
      // - Archive participant data
    }

    // Mock success response
    res.status(200).json({ 
      success: true, 
      message: `Event status updated to ${status}`,
      eventId,
      status,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Error updating event status:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}