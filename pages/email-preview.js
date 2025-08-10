// pages/email-preview.js
import React, { useState } from 'react';
import { EmailTemplates } from '../lib/emailService';

const EmailPreview = () => {
    const [selectedEmail, setSelectedEmail] = useState('selection');

    // Generate sample email content
    const selectionEmail = EmailTemplates.generateSelectionEmail(
        'Sarah Johnson',
        'Singles Night - Ages 25-35',
        'Friday, August 8, 2025',
        'Downtown Wine Bar',
        'http://localhost:3000/select/abc123',
        'Saturday, August 9, 2025 at 7:00 PM EST'
    );

    const resultsWithMatchesEmail = EmailTemplates.generateMatchResultsEmail(
        'Sarah Johnson',
        'Singles Night - Ages 25-35',
        [
            { name: 'Mike Chen', email: 'mike@email.com', phone: '555-0102' },
            { name: 'David Kim', email: 'david@email.com', phone: '555-0111' }
        ],
        [
            { name: 'James Wilson', email: 'james@email.com' },
            { name: 'Alex Rodriguez', email: 'alex@email.com' }
        ]
    );

    const resultsNoMatchesEmail = EmailTemplates.generateMatchResultsEmail(
        'Emma Davis',
        'Singles Night - Ages 25-35',
        [], // No romantic matches
        []  // No platonic matches
    );

    const emails = {
        selection: {
            title: 'Selection Email',
            description: 'Email sent to participants with their selection link',
            content: selectionEmail
        },
        resultsWithMatches: {
            title: 'Results Email (With Matches)',
            description: 'Email sent to participants who got matches',
            content: resultsWithMatchesEmail
        },
        resultsNoMatches: {
            title: 'Results Email (No Matches)',
            description: 'Email sent to participants who didn\'t get matches',
            content: resultsNoMatchesEmail
        }
    };

    const currentEmail = emails[selectedEmail];

    return (
        <div style={{ minHeight: '100vh', backgroundColor: '#f5f5f5', padding: '20px' }}>
            {/* Header */}
            <div style={{ minWidth: '1200px', margin: '0 auto', marginBottom: '30px' }}>
                <h1 style={{ fontSize: '32px', fontWeight: 'bold', color: '#333', marginBottom: '10px' }}>
                    📧 Email Template Preview
                </h1>
                <p style={{ color: '#666', fontSize: '16px' }}>
                    Preview how your speed dating emails will look to participants
                </p>
            </div>

            {/* Email Type Selector */}
            <div style={{ maxWidth: '1200px', margin: '0 auto', marginBottom: '30px' }}>
                <div style={{
                    backgroundColor: 'white',
                    padding: '20px',
                    borderRadius: '8px',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                    display: 'flex',
                    gap: '15px',
                    flexWrap: 'wrap'
                }}>
                    {Object.entries(emails).map(([key, email]) => (
                        <button
                            key={key}
                            onClick={() => setSelectedEmail(key)}
                            style={{
                                padding: '12px 24px',
                                borderRadius: '6px',
                                border: '2px solid',
                                borderColor: selectedEmail === key ? '#3b82f6' : '#e5e7eb',
                                backgroundColor: selectedEmail === key ? '#3b82f6' : 'white',
                                color: selectedEmail === key ? 'white' : '#374151',
                                fontSize: '14px',
                                fontWeight: '500',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease'
                            }}
                        >
                            {email.title}
                        </button>
                    ))}
                </div>
            </div>

            {/* Email Preview Container */}
            <div style={{ maxWidth: '1600px', margin: '0 auto', display: 'flex', gap: '30px' }}>
                {/* Email Info */}
                <div style={{ flex: '0 0 300px' }}>
                    <div style={{
                        backgroundColor: 'white',
                        padding: '20px',
                        borderRadius: '8px',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                        position: 'sticky',
                        top: '20px'
                    }}>
                        <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#333', marginBottom: '10px' }}>
                            {currentEmail.title}
                        </h3>
                        <p style={{ color: '#666', fontSize: '14px', marginBottom: '20px' }}>
                            {currentEmail.description}
                        </p>

                        <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: '15px' }}>
                            <h4 style={{ fontSize: '14px', fontWeight: '600', color: '#333', marginBottom: '10px' }}>
                                Email Details:
                            </h4>
                            <div style={{ fontSize: '12px', color: '#666', lineHeight: '1.5' }}>
                                <p><strong>Subject:</strong> {currentEmail.content.subject}</p>
                                <p><strong>From:</strong> Speed Dating Events</p>
                                <p><strong>To:</strong> Participant Email</p>
                            </div>
                        </div>

                        <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: '15px', marginTop: '15px' }}>
                            <h4 style={{ fontSize: '14px', fontWeight: '600', color: '#333', marginBottom: '10px' }}>
                                Features:
                            </h4>
                            <ul style={{ fontSize: '12px', color: '#666', lineHeight: '1.5', paddingLeft: '16px' }}>
                                {selectedEmail === 'selection' && (
                                    <>
                                        <li>Personalized greeting</li>
                                        <li>Event details</li>
                                        <li>Selection instructions</li>
                                        <li>24-hour countdown</li>
                                        <li>Privacy assurance</li>
                                    </>
                                )}
                                {selectedEmail === 'resultsWithMatches' && (
                                    <>
                                        <li>Romantic matches with phone + email</li>
                                        <li>Platonic matches with email only</li>
                                        <li>Next steps guidance</li>
                                        <li>Privacy reminder</li>
                                    </>
                                )}
                                {selectedEmail === 'resultsNoMatches' && (
                                    <>
                                        <li>Encouraging message</li>
                                        <li>Positive tone</li>
                                        <li>Future event invitation</li>
                                        <li>Community building</li>
                                    </>
                                )}
                            </ul>
                        </div>
                    </div>
                </div>

                {/* Email Content */}
                <div style={{ flex: '1', minWidth: '0' }}>
                    <div style={{
                        backgroundColor: 'white',
                        padding: '20px',
                        borderRadius: '8px',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                    }}>
                        <div style={{
                            marginBottom: '20px',
                            paddingBottom: '15px',
                            borderBottom: '1px solid #e5e7eb'
                        }}>
                            <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#333', marginBottom: '5px' }}>
                                Email Preview
                            </h3>
                            <p style={{ fontSize: '12px', color: '#666' }}>
                                This is how the email will appear in the participant's inbox
                            </p>
                        </div>

                        {/* Email Content Container with max width like real email */}
                        <div style={{
                            maxWidth: '600px',
                            margin: '0 auto',
                            backgroundColor: '#f8f9fa',
                            padding: '20px',
                            borderRadius: '4px'
                        }}>
                            <div
                                dangerouslySetInnerHTML={{ __html: currentEmail.content.htmlContent }}
                                style={{ backgroundColor: 'white', borderRadius: '8px' }}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Text Version */}
            <div style={{ maxWidth: '1200px', margin: '30px auto 0' }}>
                <div style={{
                    backgroundColor: 'white',
                    padding: '20px',
                    borderRadius: '8px',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                }}>
                    <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#333', marginBottom: '15px' }}>
                        Text Version (for email clients that don't support HTML)
                    </h3>
                    <pre style={{
                        backgroundColor: '#f8f9fa',
                        padding: '15px',
                        borderRadius: '4px',
                        fontSize: '12px',
                        lineHeight: '1.4',
                        color: '#374151',
                        whiteSpace: 'pre-wrap',
                        fontFamily: 'monospace',
                        overflow: 'auto'
                    }}>
                        {currentEmail.content.textContent}
                    </pre>
                </div>
            </div>
        </div>
    );
};

export default EmailPreview;