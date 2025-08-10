// pages/api/events/[eventId]/send-match-results.js
import { emailService, EmailTemplates } from '../../../../lib/emailService';

export default function handler(req, res) {
    const { eventId } = req.query;

    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method not allowed' });
    }

    if (!eventId) {
        return res.status(400).json({ message: 'Missing eventId' });
    }

    return sendMatchResults(req, res, eventId);
}

async function sendMatchResults(req, res, eventId) {
    try {
        console.log(`📧 Starting match results distribution for event: ${eventId}`);

        // TODO: Replace with actual DynamoDB calls
        // 
        // 1. Get event details
        // const eventParams = {
        //   TableName: 'Events',
        //   Key: { event_id: eventId }
        // };
        // const eventResult = await dynamoDb.get(eventParams).promise();
        // const event = eventResult.Item;

        // 2. Get all participants
        // const participantsParams = {
        //   TableName: 'Participants',
        //   IndexName: 'event-index',
        //   KeyConditionExpression: 'event_id = :event_id',
        //   ExpressionAttributeValues: {
        //     ':event_id': eventId
        //   }
        // };
        // const participantsResult = await dynamoDb.query(participantsParams).promise();
        // const participants = participantsResult.Items;

        // 3. Get all matches for this event
        // const matchesParams = {
        //   TableName: 'Matches',
        //   IndexName: 'event-index',
        //   KeyConditionExpression: 'event_id = :event_id',
        //   ExpressionAttributeValues: {
        //     ':event_id': eventId
        //   }
        // };
        // const matchesResult = await dynamoDb.query(matchesParams).promise();
        // const matches = matchesResult.Items;

        // Mock data for development
        const mockEvent = getMockEvent(eventId);
        const mockParticipants = getMockParticipants(eventId);
        const mockMatches = getMockMatches(eventId);

        if (!mockEvent) {
            return res.status(404).json({ message: 'Event not found' });
        }

        if (!mockParticipants || mockParticipants.length === 0) {
            return res.status(400).json({ message: 'No participants found for this event' });
        }

        if (!mockMatches || mockMatches.length === 0) {
            console.log('⚠️  No matches found - will send "no matches" emails to all participants');
        }

        console.log(`📊 Processing ${mockMatches.length} matches for ${mockParticipants.length} participants`);

        // Create participant lookup map
        const participantsMap = {};
        mockParticipants.forEach(p => {
            participantsMap[p.participant_id] = p;
        });

        // Initialize participant matches structure
        const participantMatches = {};
        mockParticipants.forEach(p => {
            participantMatches[p.participant_id] = {
                participant: p,
                romanticMatches: [],
                platonicMatches: []
            };
        });

        // Process matches and group by participant
        mockMatches.forEach(match => {
            const participant1 = participantsMap[match.participant1_id];
            const participant2 = participantsMap[match.participant2_id];

            if (participant1 && participant2) {
                if (match.match_type === 'romantic_match') {
                    // Add each other as romantic matches (phone + email)
                    participantMatches[match.participant1_id].romanticMatches.push({
                        name: participant2.name,
                        email: participant2.email,
                        phone: participant2.phone
                    });
                    participantMatches[match.participant2_id].romanticMatches.push({
                        name: participant1.name,
                        email: participant1.email,
                        phone: participant1.phone
                    });
                } else if (match.match_type === 'platonic_match') {
                    // Add each other as platonic matches (email only)
                    participantMatches[match.participant1_id].platonicMatches.push({
                        name: participant2.name,
                        email: participant2.email
                    });
                    participantMatches[match.participant2_id].platonicMatches.push({
                        name: participant1.name,
                        email: participant1.email
                    });
                }
            }
        });

        // Send emails to all participants
        const emailResults = [];

        for (const participantId of Object.keys(participantMatches)) {
            const { participant, romanticMatches, platonicMatches } = participantMatches[participantId];

            try {
                // Generate email content
                const emailContent = EmailTemplates.generateMatchResultsEmail(
                    participant.name,
                    mockEvent.name,
                    romanticMatches,
                    platonicMatches
                );

                // Send email
                const emailResult = await emailService.sendEmail({
                    to: participant.email,
                    subject: emailContent.subject,
                    htmlContent: emailContent.htmlContent,
                    textContent: emailContent.textContent
                });

                emailResults.push({
                    participant_id: participantId,
                    participant_name: participant.name,
                    email: participant.email,
                    romantic_matches_count: romanticMatches.length,
                    platonic_matches_count: platonicMatches.length,
                    total_matches: romanticMatches.length + platonicMatches.length,
                    email_sent: emailResult.success,
                    email_id: emailResult.messageId
                });

                const matchSummary = romanticMatches.length > 0 || platonicMatches.length > 0
                    ? `${romanticMatches.length} romantic, ${platonicMatches.length} platonic`
                    : 'no matches';

                console.log(`✅ Results sent to ${participant.name} (${participant.email}) - ${matchSummary}`);

            } catch (error) {
                console.error(`❌ Failed to send results to ${participant.name}:`, error);
                emailResults.push({
                    participant_id: participantId,
                    participant_name: participant.name,
                    email: participant.email,
                    romantic_matches_count: 0,
                    platonic_matches_count: 0,
                    total_matches: 0,
                    email_sent: false,
                    error: error.message
                });
            }
        }

        // Calculate statistics
        const successCount = emailResults.filter(r => r.email_sent).length;
        const failureCount = emailResults.length - successCount;
        const totalRomanticMatches = mockMatches.filter(m => m.match_type === 'romantic_match').length;
        const totalPlatonicMatches = mockMatches.filter(m => m.match_type === 'platonic_match').length;
        const participantsWithMatches = emailResults.filter(r => r.total_matches > 0).length;
        const matchRate = mockParticipants.length > 0 ? Math.round((participantsWithMatches / mockParticipants.length) * 100) : 0;

        console.log(`📈 Match results distribution complete:`);
        console.log(`   📧 ${successCount} emails sent successfully, ${failureCount} failed`);
        console.log(`   💕 ${totalRomanticMatches} romantic matches distributed`);
        console.log(`   👥 ${totalPlatonicMatches} platonic matches distributed`);
        console.log(`   🎯 ${participantsWithMatches}/${mockParticipants.length} participants got matches (${matchRate}% match rate)`);

        // TODO: Update event with results sent timestamp
        // const updateEventParams = {
        //   TableName: 'Events',
        //   Key: { event_id: eventId },
        //   UpdateExpression: 'SET match_results_sent_at = :sent_at, status = :status',
        //   ExpressionAttributeValues: {
        //     ':sent_at': new Date().toISOString(),
        //     ':status': 'completed'
        //   }
        // };
        // await dynamoDb.update(updateEventParams).promise();

        res.status(200).json({
            success: true,
            message: 'Match results sent successfully',
            event_id: eventId,
            event_name: mockEvent.name,
            participants_count: mockParticipants.length,
            total_matches: mockMatches.length,
            romantic_matches: totalRomanticMatches,
            platonic_matches: totalPlatonicMatches,
            participants_with_matches: participantsWithMatches,
            match_rate: `${matchRate}%`,
            emails_sent: successCount,
            emails_failed: failureCount,
            sent_at: new Date().toISOString(),
            results: emailResults
        });

    } catch (error) {
        console.error('Error sending match results:', error);
        res.status(500).json({
            message: 'Internal server error',
            error: error.message
        });
    }
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
            status: 'completed'
        },
        'evt_002': {
            event_id: 'evt_002',
            name: 'Professionals Night - Ages 35-45',
            date: '2025-07-29',
            time: '7:30 PM',
            venue: 'Uptown Lounge',
            status: 'completed'
        }
    };

    return events[eventId];
}

function getMockParticipants(eventId) {
    const participants = {
        'evt_001': [
            { participant_id: 'p001', name: 'Sarah Johnson', email: 'sarah@email.com', phone: '555-0101', gender: 'Female' },
            { participant_id: 'p002', name: 'Mike Chen', email: 'mike@email.com', phone: '555-0102', gender: 'Male' },
            { participant_id: 'p003', name: 'Emma Davis', email: 'emma@email.com', phone: '555-0103', gender: 'Female' },
            { participant_id: 'p004', name: 'James Wilson', email: 'james@email.com', phone: '555-0104', gender: 'Male' },
            { participant_id: 'p005', name: 'Lisa Anderson', email: 'lisa@email.com', phone: '555-0105', gender: 'Female' },
            { participant_id: 'p006', name: 'David Brown', email: 'david@email.com', phone: '555-0106', gender: 'Male' }
        ],
        'evt_002': [
            { participant_id: 'p007', name: 'Jennifer Lee', email: 'jennifer@email.com', phone: '555-0107', gender: 'Female' },
            { participant_id: 'p008', name: 'Robert Garcia', email: 'robert@email.com', phone: '555-0108', gender: 'Male' }
        ]
    };

    return participants[eventId] || [];
}

function getMockMatches(eventId) {
    const matches = {
        'evt_001': [
            {
                match_id: 'match_001',
                event_id: 'evt_001',
                participant1_id: 'p001', // Sarah
                participant2_id: 'p002', // Mike
                match_type: 'romantic_match'
            },
            {
                match_id: 'match_002',
                event_id: 'evt_001',
                participant1_id: 'p003', // Emma  
                participant2_id: 'p004', // James
                match_type: 'platonic_match'
            },
            {
                match_id: 'match_003',
                event_id: 'evt_001',
                participant1_id: 'p001', // Sarah
                participant2_id: 'p006', // David
                match_type: 'platonic_match'
            }
        ],
        'evt_002': [
            {
                match_id: 'match_004',
                event_id: 'evt_002',
                participant1_id: 'p007', // Jennifer
                participant2_id: 'p008', // Robert
                match_type: 'romantic_match'
            }
        ]
    };

    return matches[eventId] || [];
}