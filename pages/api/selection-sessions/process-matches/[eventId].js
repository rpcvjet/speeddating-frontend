// pages/api/process-matches/[eventId].js
export default function handler(req, res) {
  const { eventId } = req.query;

  if (req.method === 'POST') {
    return processMatches(req, res, eventId);
  } else {
    return res.status(405).json({ message: 'Method not allowed' });
  }
}

async function processMatches(req, res, eventId) {
  if (!eventId) {
    return res.status(400).json({ message: 'Missing eventId' });
  }

  try {
    console.log(`🔄 Starting match processing for event: ${eventId}`);

    // TODO: Replace with actual DynamoDB calls
    // 
    // 1. Get all selections for this event
    // const selectionsParams = {
    //   TableName: 'Selections',
    //   IndexName: 'event-index',
    //   KeyConditionExpression: 'event_id = :event_id',
    //   ExpressionAttributeValues: {
    //     ':event_id': eventId
    //   }
    // };
    // const selectionsResult = await dynamoDb.query(selectionsParams).promise();
    // const allSelections = selectionsResult.Items;

    // 2. Get all participants for this event
    // const participantsParams = {
    //   TableName: 'Participants',
    //   IndexName: 'event-index',
    //   KeyConditionExpression: 'event_id = :event_id',
    //   ExpressionAttributeValues: {
    //     ':event_id': eventId
    //   }
    // };
    // const participantsResult = await dynamoDb.query(participantsParams).promise();
    // const allParticipants = participantsResult.Items;

    // Mock data for development
    const mockSelections = getMockSelections(eventId);
    const mockParticipants = getMockParticipants(eventId);

    if (!mockSelections || !mockParticipants) {
      return res.status(404).json({ message: 'Event not found or no selections available' });
    }

    console.log(`📊 Processing ${mockSelections.length} selections from ${mockParticipants.length} participants`);

    // Process matches using your algorithm
    const matches = await runMatchingAlgorithm(mockSelections, mockParticipants, eventId);

    console.log(`✅ Generated ${matches.length} matches`);

    // TODO: Store matches in database
    // for (const match of matches) {
    //   const matchParams = {
    //     TableName: 'Matches',
    //     Item: {
    //       match_id: match.match_id,
    //       event_id: eventId,
    //       participant1_id: match.participant1_id,
    //       participant2_id: match.participant2_id,
    //       match_type: match.match_type,
    //       participant1_contact: match.participant1_contact,
    //       participant2_contact: match.participant2_contact,
    //       created_at: new Date().toISOString()
    //     }
    //   };
    //   await dynamoDb.put(matchParams).promise();
    // }

    // TODO: Update event status or add processing timestamp
    // const updateEventParams = {
    //   TableName: 'Events',
    //   Key: {
    //     event_id: eventId
    //   },
    //   UpdateExpression: 'SET matches_processed_at = :processed_at',
    //   ExpressionAttributeValues: {
    //     ':processed_at': new Date().toISOString()
    //   }
    // };
    // await dynamoDb.update(updateEventParams).promise();

    // Generate summary statistics
    const summary = generateMatchSummary(matches, mockParticipants);

    console.log('📈 Match Summary:', summary);

    res.status(200).json({
      success: true,
      message: 'Matches processed successfully',
      event_id: eventId,
      matches_count: matches.length,
      summary: summary,
      processed_at: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error processing matches:', error);
    res.status(500).json({
      message: 'Internal server error',
      error: error.message
    });
  }
}

// Your custom matching algorithm
async function runMatchingAlgorithm(selections, participants, eventId) {
  const matches = [];

  // Create a map for easy lookup of participants
  const participantsMap = {};
  participants.forEach(p => {
    participantsMap[p.participant_id] = p;
  });

  // Create a map of selections for easy lookup
  const selectionsMap = {};
  selections.forEach(selection => {
    const key = `${selection.participant_id}_${selection.selected_participant_id}`;
    selectionsMap[key] = selection.selection_type;
  });

  // Get all unique participant pairs (avoid duplicates)
  const processedPairs = new Set();

  selections.forEach(selection => {
    const participant1Id = selection.participant_id;
    const participant2Id = selection.selected_participant_id;

    // Create a consistent pair key (always smaller ID first)
    const pairKey = [participant1Id, participant2Id].sort().join('_');

    // Skip if we've already processed this pair
    if (processedPairs.has(pairKey)) {
      return;
    }
    processedPairs.add(pairKey);

    // Get both selections
    const selection1 = selectionsMap[`${participant1Id}_${participant2Id}`];
    const selection2 = selectionsMap[`${participant2Id}_${participant1Id}`];

    // Apply your matching algorithm
    const matchResult = determineMatchType(selection1, selection2);

    if (matchResult !== 'no_match') {
      const participant1 = participantsMap[participant1Id];
      const participant2 = participantsMap[participant2Id];

      // Determine what contact info to share
      const contactInfo = getContactInfoToShare(matchResult, participant1, participant2);

      const match = {
        match_id: `match_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        event_id: eventId,
        participant1_id: participant1Id,
        participant2_id: participant2Id,
        match_type: matchResult,
        participant1_contact: contactInfo.participant1,
        participant2_contact: contactInfo.participant2,
        selections: {
          participant1_selected: selection1,
          participant2_selected: selection2
        }
      };

      matches.push(match);

      console.log(`💕 Match found: ${participant1.name} & ${participant2.name} (${matchResult})`);
    }
  });

  return matches;
}

// Your original matching algorithm logic
function determineMatchType(selection1, selection2) {
  if (selection1 === 'Pass' || selection2 === 'Pass') return 'no_match';

  if ((selection1 === 'Match' && selection2 === 'Match') ||
    (selection1 === 'Match & Friend' && selection2 === 'Match & Friend') ||
    (selection1 === 'Match & Friend' && selection2 === 'Match') ||
    (selection1 === 'Match' && selection2 === 'Match & Friend')) {
    return 'romantic_match';
  }

  if ((selection1 === 'Friend' && selection2 === 'Friend') ||
    (selection1 === 'Match & Friend' && selection2 === 'Friend') ||
    (selection1 === 'Friend' && selection2 === 'Match & Friend')) {
    return 'platonic_match';
  }

  // Handle the incompatible case: Match vs Friend (no Match & Friend involved)
  if ((selection1 === 'Match' && selection2 === 'Friend') ||
    (selection1 === 'Friend' && selection2 === 'Match')) {
    return 'no_match';
  }

  return 'no_match';
}

// Determine what contact information to share
function getContactInfoToShare(matchType, participant1, participant2) {
  if (matchType === 'romantic_match') {
    // Share phone + email for romantic matches
    return {
      participant1: {
        name: participant1.name,
        email: participant1.email,
        phone: participant1.phone
      },
      participant2: {
        name: participant2.name,
        email: participant2.email,
        phone: participant2.phone
      }
    };
  } else if (matchType === 'platonic_match') {
    // Share only email for friend matches
    return {
      participant1: {
        name: participant1.name,
        email: participant1.email
      },
      participant2: {
        name: participant2.name,
        email: participant2.email
      }
    };
  }

  return { participant1: {}, participant2: {} };
}

// Generate summary statistics
function generateMatchSummary(matches, participants) {
  const totalParticipants = participants.length;
  const romanticMatches = matches.filter(m => m.match_type === 'romantic_match').length;
  const platonicMatches = matches.filter(m => m.match_type === 'platonic_match').length;

  // Count unique participants who got matches
  const participantsWithMatches = new Set();
  matches.forEach(match => {
    participantsWithMatches.add(match.participant1_id);
    participantsWithMatches.add(match.participant2_id);
  });

  return {
    total_participants: totalParticipants,
    total_matches: matches.length,
    romantic_matches: romanticMatches,
    platonic_matches: platonicMatches,
    participants_with_matches: participantsWithMatches.size,
    match_rate: totalParticipants > 0 ? Math.round((participantsWithMatches.size / totalParticipants) * 100) : 0
  };
}

// Mock data functions
function getMockSelections(eventId) {
  // Mock selections for evt_001
  if (eventId === 'evt_001') {
    return [
      // Sarah's selections (p001 - Female)
      { participant_id: 'p001', selected_participant_id: 'p002', selection_type: 'Match' },    // Sarah → Mike: Match
      { participant_id: 'p001', selected_participant_id: 'p004', selection_type: 'Friend' },   // Sarah → James: Friend
      { participant_id: 'p001', selected_participant_id: 'p011', selection_type: 'Pass' },     // Sarah → David: Pass
      { participant_id: 'p001', selected_participant_id: 'p012', selection_type: 'Friend' },   // Sarah → Alex: Friend

      // Mike's selections (p002 - Male)
      { participant_id: 'p002', selected_participant_id: 'p001', selection_type: 'Match' },    // Mike → Sarah: Match ✅ ROMANTIC MATCH!
      { participant_id: 'p002', selected_participant_id: 'p003', selection_type: 'Friend' },   // Mike → Emma: Friend
      { participant_id: 'p002', selected_participant_id: 'p013', selection_type: 'Pass' },     // Mike → Jessica: Pass
      { participant_id: 'p002', selected_participant_id: 'p014', selection_type: 'Match' },    // Mike → Amanda: Match

      // Emma's selections (p003 - Female)
      { participant_id: 'p003', selected_participant_id: 'p002', selection_type: 'Friend' },   // Emma → Mike: Friend ✅ PLATONIC MATCH!
      { participant_id: 'p003', selected_participant_id: 'p004', selection_type: 'Match' },    // Emma → James: Match
      { participant_id: 'p003', selected_participant_id: 'p011', selection_type: 'Friend' },   // Emma → David: Friend
      { participant_id: 'p003', selected_participant_id: 'p012', selection_type: 'Pass' },     // Emma → Alex: Pass

      // James's selections (p004 - Male)
      { participant_id: 'p004', selected_participant_id: 'p001', selection_type: 'Friend' },   // James → Sarah: Friend ✅ PLATONIC MATCH!
      { participant_id: 'p004', selected_participant_id: 'p003', selection_type: 'Pass' },     // James → Emma: Pass (No match)
      { participant_id: 'p004', selected_participant_id: 'p013', selection_type: 'Match' },    // James → Jessica: Match
      { participant_id: 'p004', selected_participant_id: 'p014', selection_type: 'Friend' },   // James → Amanda: Friend
    ];
  }

  return null;
}

function getMockParticipants(eventId) {
  if (eventId === 'evt_001') {
    return [
      { participant_id: 'p001', name: 'Sarah Johnson', email: 'sarah@email.com', phone: '555-0101', gender: 'Female' },
      { participant_id: 'p002', name: 'Mike Chen', email: 'mike@email.com', phone: '555-0102', gender: 'Male' },
      { participant_id: 'p003', name: 'Emma Davis', email: 'emma@email.com', phone: '555-0103', gender: 'Female' },
      { participant_id: 'p004', name: 'James Wilson', email: 'james@email.com', phone: '555-0104', gender: 'Male' },
      { participant_id: 'p011', name: 'David Kim', email: 'david@email.com', phone: '555-0111', gender: 'Male' },
      { participant_id: 'p012', name: 'Alex Rodriguez', email: 'alex@email.com', phone: '555-0112', gender: 'Male' },
      { participant_id: 'p013', name: 'Jessica Lee', email: 'jessica@email.com', phone: '555-0113', gender: 'Female' },
      { participant_id: 'p014', name: 'Amanda Brown', email: 'amanda@email.com', phone: '555-0114', gender: 'Female' }
    ];
  }

  return null;
}