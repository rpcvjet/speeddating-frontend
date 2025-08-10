// pages/test-email-preview.js
import { EmailTemplates } from '../lib/emailService';

export default function EmailPreview() {
    const selectionEmail = EmailTemplates.generateSelectionEmail(
        'Test User',
        'Singles Night - Ages 25-35',
        'Monday, August 5, 2025',
        'Downtown Wine Bar',
        'http://localhost:3000/select/test123',
        'Tuesday, August 6, 2025 at 7:00 PM EST'
    );

    return (
        <div style={{ padding: '20px' }}>
            <h1>Email Preview</h1>
            <div dangerouslySetInnerHTML={{ __html: selectionEmail.htmlContent }} />
        </div>
    );
}