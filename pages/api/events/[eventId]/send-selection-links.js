// pages/api/events/[eventId]/send-selection-links.js
import { emailService, EmailTemplates } from '../../../../lib/emailService';

export default function handler(req, res) {
  const { eventId } = req.query;

  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  if (!eventId) {
    return res.status(400).json({ message: 'Missing eventId' });
  }

  return sendSelectionLinks(req, res, eventId);
}

async function sendSelectionLinks(req, res, eventId) {
  try {
    console.log(`📧 Starting selection link distribution for event: ${eventId}`);

    // TODO: Replace with actual DynamoDB calls
    // 
    // 1. Get event details
    // const eventParams = {
    //   TableName: 'Events',
    //   Key: { event_id: eventId }
    // };
    // const eventResult = await dynamoDb.get(eventParams).promise();
    // const event = eventResult.Item;

    // 2. Get all checked-in participants
    // const participantsParams = {
    //   TableName: 'Participants',
    //   IndexName: 'event-index',
    //   KeyConditionExpression: 'event_id = :event_id',
    //   FilterExpression: 'checked_in = :checked_in',
    //   ExpressionAttributeValues: {
    //     ':event_id': eventId,
    //     ':checked_in': true
    //   }
    // };
    // const participantsResult = await dynamoDb.query(participantsParams).promise();
    // const checkedInParticipants = participantsResult.Items;

    // Mock data for development
    const mockEvent = getMockEvent(eventId);
    const mockParticipants = getMockCheckedInParticipants(eventId);

    if (!mockEvent) {
      return res.status(404).json({ message: 'Event not found' });
    }

    if (!mockParticipants || mockParticipants.length === 0) {
      return res.status(400).json({ message: 'No checked-in participants found' });
    }

    console.log(`📊 Found ${mockParticipants.length} checked-in participants`);

    // Set expiration time (24 hours from now)
    const expirationTime = new Date(Date.now() + 24 * 60 * 60 * 1000);

    // Generate selection sessions and send emails
    const emailResults = [];
    const selectionSessions = [];

    for (const participant of mockParticipants) {
      try {
        // Generate unique token
        const token = generateSelectionToken();

        // Create selection session
        const session = {
          token,
          participant_id: participant.participant_id,
          event_id: eventId,
          expires_at: expirationTime.toISOString(),
          created_at: new Date().toISOString(),
          submitted_at: null
        };

        // TODO: Store session in database
        // const sessionParams = {
        //   TableName: 'SelectionSessions',
        //   Item: session
        // };
        // await dynamoDb.put(sessionParams).promise();

        selectionSessions.push(session);

        // Generate selection link
        const selectionLink = `${getBaseUrl()}/select/${token}`;

        // Generate email content
        const emailContent = EmailTemplates.generateSelectionEmail(
          participant.name,
          mockEvent.name,
          formatEventDate(mockEvent.date),
          mockEvent.venue,
          selectionLink,
          formatExpirationTime(expirationTime)
        );

        // Send email
        const emailResult = await emailService.sendEmail({
          to: participant.email,
          subject: emailContent.subject,
          htmlContent: emailContent.htmlContent,
          textContent: emailContent.textContent
        });

        emailResults.push({
          participant_id: participant.participant_id,
          participant_name: participant.name,
          email: participant.email,
          token,
          selection_link: selectionLink,
          email_sent: emailResult.success,
          email_id: emailResult.messageId
        });

        console.log(`✅ Selection link sent to ${participant.name} (${participant.email})`);

      } catch (error) {
        console.error(`❌ Failed to send selection link to ${participant.name}:`, error);
        emailResults.push({
          participant_id: participant.participant_id,
          participant_name: participant.name,
          email: participant.email,
          email_sent: false,
          error: error.message
        });
      }
    }

    // Count results
    const successCount = emailResults.filter(r => r.email_sent).length;
    const failureCount = emailResults.length - successCount;

    console.log(`📈 Email distribution complete: ${successCount} sent, ${failureCount} failed`);

    // TODO: Update event with selection links sent timestamp
    // const updateEventParams = {
    //   TableName: 'Events',
    //   Key: { event_id: eventId },
    //   UpdateExpression: 'SET selection_links_sent_at = :sent_at, selection_expires_at = :expires_at',
    //   ExpressionAttributeValues: {
    //     ':sent_at': new Date().toISOString(),
    //     ':expires_at': expirationTime.toISOString()
    //   }
    // };
    // await dynamoDb.update(updateEventParams).promise();

    res.status(200).json({
      success: true,
      message: 'Selection links sent successfully',
      event_id: eventId,
      event_name: mockEvent.name,
      participants_count: mockParticipants.length,
      emails_sent: successCount,
      emails_failed: failureCount,
      expires_at: expirationTime.toISOString(),
      results: emailResults
    });

  } catch (error) {
    console.error('Error sending selection links:', error);
    res.status(500).json({
      message: 'Internal server error',
      error: error.message
    });
  }
}

// Helper functions
function generateSelectionToken() {
  return `sel_${Date.now()}_${Math.random().toString(36).substr(2, 12)}`;
}

function getBaseUrl() {
  // TODO: Use environment variable for production
  return process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
}

function formatEventDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

function formatExpirationTime(date) {
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZoneName: 'short'
  });
}

// Mock data functions
function getMockEvent(eventId) {
  const events = {
    'evt_001': {
      event_id: 'evt_001',
      name: 'Singles Night - Ages 25-35',
      date: '2025-07-29',
      time: '7:00 PM',
      venue: 'Downtown Wine Bar',
      status: 'active'
    },
    'evt_002': {
      event_id: 'evt_002',
      name: 'Professionals Night - Ages 35-45',
      date: '2025-07-29',
      time: '7:30 PM',
      venue: 'Uptown Lounge',
      status: 'active'
    }
  };

  return events[eventId];
}

function getMockCheckedInParticipants(eventId) {
  const participants = {
    'evt_001': [
      { participant_id: 'p001', name: 'Sarah Johnson', email: 'sarah@email.com', phone: '555-0101', gender: 'Female', checked_in: true },
      { participant_id: 'p002', name: 'Mike Chen', email: 'mike@email.com', phone: '555-0102', gender: 'Male', checked_in: true },
      { participant_id: 'p003', name: 'Emma Davis', email: 'emma@email.com', phone: '555-0103', gender: 'Female', checked_in: true },
      { participant_id: 'p004', name: 'James Wilson', email: 'james@email.com', phone: '555-0104', gender: 'Male', checked_in: true }
    ],
    'evt_002': [
      { participant_id: 'p005', name: 'Lisa Anderson', email: 'lisa@email.com', phone: '555-0105', gender: 'Female', checked_in: true },
      { participant_id: 'p006', name: 'David Brown', email: 'david@email.com', phone: '555-0106', gender: 'Male', checked_in: true }
    ]
  };

  return participants[eventId];
}