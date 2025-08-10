// pages/api/test-emails.js
import { emailService, EmailTemplates } from '../../lib/emailService';

export default function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method not allowed' });
    }

    return testEmails(req, res);
}

async function testEmails(req, res) {
    const { email, emailType = 'both' } = req.body;

    if (!email) {
        return res.status(400).json({ message: 'Email address is required' });
    }

    try {
        console.log(`🧪 Testing emails for: ${email}`);
        const results = [];

        // Test Selection Email
        if (emailType === 'selection' || emailType === 'both') {
            const selectionLink = `${getBaseUrl()}/select/test_token_12345`;
            const expirationTime = new Date(Date.now() + 24 * 60 * 60 * 1000);

            const selectionEmail = EmailTemplates.generateSelectionEmail(
                'Test Participant',
                'Test Speed Dating Event - Ages 25-35',
                'Monday, August 5, 2025',
                'Downtown Wine Bar',
                selectionLink,
                formatExpirationTime(expirationTime)
            );

            const selectionResult = await emailService.sendEmail({
                to: email,
                subject: `[TEST] ${selectionEmail.subject}`,
                htmlContent: selectionEmail.htmlContent,
                textContent: selectionEmail.textContent
            });

            results.push({
                type: 'selection',
                success: selectionResult.success,
                messageId: selectionResult.messageId
            });

            console.log(`✅ Selection email test sent to ${email}`);
        }

        // Test Results Email - With Matches
        if (emailType === 'results' || emailType === 'both') {
            const mockRomanticMatches = [
                { name: 'Sarah Johnson', email: 'sarah@example.com', phone: '555-0101' },
                { name: 'Emma Davis', email: 'emma@example.com', phone: '555-0103' }
            ];

            const mockPlatonicMatches = [
                { name: 'Mike Chen', email: 'mike@example.com' },
                { name: 'James Wilson', email: 'james@example.com' }
            ];

            const resultsEmail = EmailTemplates.generateMatchResultsEmail(
                'Test Participant',
                'Test Speed Dating Event - Ages 25-35',
                mockRomanticMatches,
                mockPlatonicMatches
            );

            const resultsResult = await emailService.sendEmail({
                to: email,
                subject: `[TEST] ${resultsEmail.subject}`,
                htmlContent: resultsEmail.htmlContent,
                textContent: resultsEmail.textContent
            });

            results.push({
                type: 'results_with_matches',
                success: resultsResult.success,
                messageId: resultsResult.messageId
            });

            console.log(`✅ Results email (with matches) test sent to ${email}`);
        }

        // Test Results Email - No Matches
        if (emailType === 'results' || emailType === 'both') {
            const noMatchesEmail = EmailTemplates.generateMatchResultsEmail(
                'Test Participant',
                'Test Speed Dating Event - Ages 25-35',
                [], // No romantic matches
                []  // No platonic matches
            );

            const noMatchesResult = await emailService.sendEmail({
                to: email,
                subject: `[TEST] ${noMatchesEmail.subject} (No Matches)`,
                htmlContent: noMatchesEmail.htmlContent,
                textContent: noMatchesEmail.textContent
            });

            results.push({
                type: 'results_no_matches',
                success: noMatchesResult.success,
                messageId: noMatchesResult.messageId
            });

            console.log(`✅ Results email (no matches) test sent to ${email}`);
        }

        const successCount = results.filter(r => r.success).length;
        const totalCount = results.length;

        res.status(200).json({
            success: true,
            message: `Test emails sent successfully`,
            email: email,
            emails_sent: successCount,
            total_emails: totalCount,
            results: results
        });

    } catch (error) {
        console.error('Error sending test emails:', error);
        res.status(500).json({
            message: 'Internal server error',
            error: error.message
        });
    }
}

function getBaseUrl() {
    return process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
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