// pages/api/selection-sessions/[token].js
export default function handler(req, res) {
  const { token } = req.query;

  if (req.method === 'GET') {
    // Get selection session data
    return getSelectionSession(req, res, token);
  } else {
    return res.status(405).json({ message: 'Method not allowed' });
  }
}

async function getSelectionSession(req, res, token) {
  if (!token) {
    return res.status(400).json({ message: 'Missing token' });
  }

  try {
    // TODO: Replace with actual DynamoDB calls
    // 
    // 1. Look up selection session by token
    // const sessionParams = {
    //   TableName: 'SelectionSessions',
    //   Key: {
    //     token: token
    //   }
    // };
    // const sessionResult = await dynamoDb.get(sessionParams).promise();
    // 
    // if (!sessionResult.Item) {
    //   return res.status(404).json({ message: 'Invalid or expired token' });
    // }
    // 
    // const session = sessionResult.Item;
    // 
    // // Check if expired
    // if (new Date() > new Date(session.expires_at)) {
    //   return res.status(410).json({ message: 'Selection period has expired' });
    // }
    // 
    // // Check if already submitted
    // if (session.submitted_at) {
    //   return res.status(410).json({ message: 'Selections already submitted' });
    // }
    // 
    // 2. Get participant data
    // const participantParams = {
    //   TableName: 'Participants',
    //   Key: {
    //     participant_id: session.participant_id
    //   }
    // };
    // const participantResult = await dynamoDb.get(participantParams).promise();
    // const participant = participantResult.Item;
    // 
    // 3. Get event data
    // const eventParams = {
    //   TableName: 'Events',
    //   Key: {
    //     event_id: session.event_id
    //   }
    // };
    // const eventResult = await dynamoDb.get(eventParams).promise();
    // const event = eventResult.Item;
    // 
    // 4. Get selectable participants (opposite gender, checked in)
    // const selectableParams = {
    //   TableName: 'Participants',
    //   IndexName: 'event-index',
    //   KeyConditionExpression: 'event_id = :event_id',
    //   FilterExpression: 'participant_id <> :current_id AND gender <> :current_gender AND checked_in = :checked_in',
    //   ExpressionAttributeValues: {
    //     ':event_id': session.event_id,
    //     ':current_id': session.participant_id,
    //     ':current_gender': participant.gender,
    //     ':checked_in': true
    //   }
    // };
    // const selectableResult = await dynamoDb.query(selectableParams).promise();
    // const selectableParticipants = selectableResult.Items;

    // Mock data for development
    const mockData = {
      'abc123': {
        participant: {
          participant_id: 'p001',
          name: 'Sarah Johnson',
          email: 'sarah@email.com',
          gender: 'Female',
          event_id: 'evt_001'
        },
        event: {
          event_id: 'evt_001',
          name: 'Singles Night - Ages 25-35',
          date: '2025-07-29',
          venue: 'Downtown Wine Bar'
        },
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours from now
        selectable_participants: [
          { participant_id: 'p002', name: 'Mike Chen', age: 32, gender: 'Male' },
          { participant_id: 'p004', name: 'James Wilson', age: 31, gender: 'Male' },
          { participant_id: 'p011', name: 'David Kim', age: 29, gender: 'Male' },
          { participant_id: 'p012', name: 'Alex Rodriguez', age: 33, gender: 'Male' }
        ]
      },
      'xyz789': {
        participant: {
          participant_id: 'p002',
          name: 'Mike Chen',
          email: 'mike@email.com',
          gender: 'Male',
          event_id: 'evt_001'
        },
        event: {
          event_id: 'evt_001',
          name: 'Singles Night - Ages 25-35',
          date: '2025-07-29',
          venue: 'Downtown Wine Bar'
        },
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours from now
        selectable_participants: [
          { participant_id: 'p001', name: 'Sarah Johnson', age: 28, gender: 'Female' },
          { participant_id: 'p003', name: 'Emma Davis', age: 29, gender: 'Female' },
          { participant_id: 'p013', name: 'Jessica Lee', age: 26, gender: 'Female' },
          { participant_id: 'p014', name: 'Amanda Brown', age: 30, gender: 'Female' }
        ]
      }
    };

    const sessionData = mockData[token];

    if (!sessionData) {
      return res.status(404).json({ message: 'Invalid or expired token' });
    }

    console.log(`Selection session accessed: ${token} for participant ${sessionData.participant.name}`);

    res.status(200).json({
      success: true,
      data: sessionData
    });

  } catch (error) {
    console.error('Error fetching selection session:', error);
    res.status(500).json({
      message: 'Internal server error',
      error: error.message
    });
  }
}