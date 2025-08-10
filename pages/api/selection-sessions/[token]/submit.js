// pages/api/selection-sessions/[token]/submit.js
export default function handler(req, res) {
    const { token } = req.query;
    const { selections } = req.body;

    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method not allowed' });
    }

    if (!token) {
        return res.status(400).json({ message: 'Missing token' });
    }

    if (!selections || !Array.isArray(selections)) {
        return res.status(400).json({ message: 'Invalid selections data' });
    }

    return submitSelections(req, res, token, selections);
}

async function submitSelections(req, res, token, selections) {
    try {
        // TODO: Replace with actual DynamoDB calls
        // 
        // 1. Validate session token and get session data
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

        // Mock session validation
        const mockSessions = {
            'abc123': { participant_id: 'p001', event_id: 'evt_001', expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000) },
            'xyz789': { participant_id: 'p002', event_id: 'evt_001', expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000) }
        };

        const session = mockSessions[token];
        if (!session) {
            return res.status(404).json({ message: 'Invalid or expired token' });
        }

        // Validate selections format
        for (const selection of selections) {
            if (!selection.selected_participant_id || !selection.selection_type) {
                return res.status(400).json({ message: 'Invalid selection format' });
            }

            if (!['Pass', 'Friend', 'Match', 'Match & Friend'].includes(selection.selection_type)) {
                return res.status(400).json({ message: `Invalid selection type: ${selection.selection_type}. Must be Pass, Friend, Match, or Match & Friend` });
            }
        }

        // TODO: Store selections in database
        // for (const selection of selections) {
        //   const selectionParams = {
        //     TableName: 'Selections',
        //     Item: {
        //       selection_id: `sel_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        //       event_id: session.event_id,
        //       participant_id: session.participant_id,
        //       selected_participant_id: selection.selected_participant_id,
        //       selection_type: selection.selection_type,
        //       created_at: new Date().toISOString()
        //     }
        //   };
        //   await dynamoDb.put(selectionParams).promise();
        // }

        // TODO: Mark session as completed
        // const updateSessionParams = {
        //   TableName: 'SelectionSessions',
        //   Key: {
        //     token: token
        //   },
        //   UpdateExpression: 'SET submitted_at = :submitted_at',
        //   ExpressionAttributeValues: {
        //     ':submitted_at': new Date().toISOString()
        //   }
        // };
        // await dynamoDb.update(updateSessionParams).promise();

        // Log the selections for development
        console.log(`Selections submitted for token ${token}:`);
        console.log(`Participant: ${session.participant_id}`);
        console.log(`Event: ${session.event_id}`);
        console.log('Selections:', selections.map(s => ({
            selected: s.selected_participant_id,
            choice: s.selection_type
        })));

        // Count selections by type
        const selectionCounts = selections.reduce((acc, sel) => {
            acc[sel.selection_type] = (acc[sel.selection_type] || 0) + 1;
            return acc;
        }, {});

        console.log('Selection summary:', selectionCounts);

        res.status(200).json({
            success: true,
            message: 'Selections submitted successfully',
            data: {
                participant_id: session.participant_id,
                event_id: session.event_id,
                selection_count: selections.length,
                selection_summary: selectionCounts,
                submitted_at: new Date().toISOString()
            }
        });

    } catch (error) {
        console.error('Error submitting selections:', error);
        res.status(500).json({
            message: 'Internal server error',
            error: error.message
        });
    }
}