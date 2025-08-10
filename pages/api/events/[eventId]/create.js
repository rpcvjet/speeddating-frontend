export default function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { eventInfo, participants } = req.body;

  // Validate required fields
  if (!eventInfo?.name || !eventInfo?.date || !eventInfo?.time || !eventInfo?.venue) {
    return res.status(400).json({ message: 'Missing required event information' });
  }

  if (!participants || participants.length === 0) {
    return res.status(400).json({ message: 'At least one participant is required' });
  }

  try {
    // Generate unique event ID
    const eventId = `evt_${Date.now()}`;

    console.log('Creating event:', {
      eventId,
      eventName: eventInfo.name,
      participantCount: participants.length,
      venue: eventInfo.venue,
      date: eventInfo.date
    });

    // Mock success response
    res.status(201).json({
      success: true,
      message: 'Event created successfully',
      event_id: eventId,
      event_name: eventInfo.name,
      participant_count: participants.length
    });

  } catch (error) {
    console.error('Error creating event:', error);
    res.status(500).json({
      message: 'Internal server error',
      error: error.message
    });
  }
}