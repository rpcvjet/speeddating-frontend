// lib/emailService.js
// Email service abstraction layer - can be switched between providers

class EmailService {
  constructor() {
    // TODO: Initialize email provider (SendGrid, AWS SES, etc.)
    // For development, we'll simulate email sending
    this.provider = process.env.EMAIL_PROVIDER || 'mock';
    this.fromEmail = process.env.FROM_EMAIL || 'noreply@speeddating.com';
    this.fromName = process.env.FROM_NAME || 'Speed Dating Events';
  }

  async sendEmail({ to, subject, htmlContent, textContent }) {
    try {
      if (this.provider === 'mock') {
        return this.mockSendEmail({ to, subject, htmlContent, textContent });
      }


      throw new Error(`Email provider ${this.provider} not implemented`);
    } catch (error) {
      console.error('Email sending error:', error);
      throw error;
    }
  }

  mockSendEmail({ to, subject, htmlContent, textContent }) {
    console.log('\n📧 EMAIL SENT (Mock):');
    console.log(`To: ${to}`);
    console.log(`Subject: ${subject}`);
    console.log(`From: ${this.fromName} <${this.fromEmail}>`);
    console.log('---');
    console.log(textContent || 'No text content');
    console.log('---\n');

    return Promise.resolve({
      success: true,
      messageId: `mock_${Date.now()}`,
      provider: 'mock'
    });
  }
}

// Email template generators
export class EmailTemplates {
  static generateSelectionEmail(participantName, eventName, eventDate, eventVenue, selectionLink, expirationTime) {
    const subject = `Make Your Selections - ${eventName}`;

    const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${subject}</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #ffffff; padding: 30px; border: 1px solid #e0e0e0; }
        .button { display: inline-block; padding: 15px 30px; background: #4CAF50; color: white; text-decoration: none; border-radius: 5px; font-weight: bold; margin: 20px 0; }
        .button:hover { background: #45a049; }
        .warning { background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 20px 0; }
        .footer { background: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #666; border-radius: 0 0 8px 8px; }
        .event-details { background: #f8f9fa; padding: 15px; border-radius: 5px; margin: 15px 0; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>💕 Time to Make Your Selections!</h1>
        <p>Your speed dating experience continues...</p>
      </div>
      
      <div class="content">
        <h2>Hi ${participantName}!</h2>
        
        <p>Thank you for attending our speed dating event! We hope you had a wonderful time meeting new people.</p>
        
        <div class="event-details">
          <h3>Event Details:</h3>
          <p><strong>Event:</strong> ${eventName}</p>
          <p><strong>Date:</strong> ${eventDate}</p>
          <p><strong>Venue:</strong> ${eventVenue}</p>
        </div>
        
        <p>Now it's time to let us know who you'd like to connect with! You have <strong>24 hours</strong> to make your selections.</p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${selectionLink}" class="button">Make My Selections</a>
        </div>
        
        <div class="warning">
          <h4>⏰ Important:</h4>
          <p>This link expires at <strong>${expirationTime}</strong>. Please complete your selections before then!</p>
        </div>
        
        <h3>How it works:</h3>
        <ul>
          <li><strong>Pass:</strong> Not interested in further contact</li>
          <li><strong>Friend:</strong> Would like to connect as friends</li>
          <li><strong>Match:</strong> Interested in a romantic connection</li>
          <li><strong>Friend + Match:</strong> Open to both friendship and romance</li>
        </ul>
        
        <p><strong>Your privacy is protected:</strong> Your selections are completely confidential. Only mutual matches will be shared.</p>
        
        <p>Results will be sent to your email within 24-48 hours after the selection period ends.</p>
        
        <p>Questions? Reply to this email and we'll be happy to help!</p>
        
        <p>Best regards,<br>The Speed Dating Team</p>
      </div>
      
      <div class="footer">
        <p>This email was sent to you because you participated in our speed dating event.</p>
        <p>If you have any questions, please contact us at support@speeddating.com</p>
      </div>
    </body>
    </html>
    `;

    const textContent = `
Hi ${participantName}!

Thank you for attending ${eventName} on ${eventDate} at ${eventVenue}!

It's time to make your selections. You have 24 hours to let us know who you'd like to connect with.

Make your selections here: ${selectionLink}

This link expires at ${expirationTime}.

How it works:
- Pass: Not interested in further contact
- Friend: Would like to connect as friends  
- Match: Interested in a romantic connection
- Friend + Match: Open to both friendship and romance

Your selections are completely confidential. Only mutual matches will be shared.

Results will be sent within 24-48 hours.

Questions? Reply to this email.

Best regards,
The Speed Dating Team
    `;

    return { subject, htmlContent, textContent };
  }

  static generateMatchResultsEmail(participantName, eventName, romanticMatches, platonicMatches) {
    const subject = `Your Speed Dating Results - ${eventName}`;

    const hasMatches = romanticMatches.length > 0 || platonicMatches.length > 0;

    const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${subject}</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #ffffff; padding: 30px; border: 1px solid #e0e0e0; }
        .match-section { background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .romantic-match { background: #fff0f5; border-left: 4px solid #e91e63; }
        .platonic-match { background: #f0f8ff; border-left: 4px solid #2196f3; }
        .no-matches { background: #fff8e1; border-left: 4px solid #ff9800; }
        .contact-info { background: white; padding: 15px; border-radius: 5px; margin: 10px 0; }
        .footer { background: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #666; border-radius: 0 0 8px 8px; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>${hasMatches ? '🎉 You Have Matches!' : '💫 Your Results Are In'}</h1>
        <p>${eventName} Results</p>
      </div>
      
      <div class="content">
        <h2>Hi ${participantName}!</h2>
        
        <p>Thank you for participating in ${eventName}! Here are your results:</p>
        
        ${romanticMatches.length > 0 ? `
        <div class="match-section romantic-match">
          <h3>💕 Romantic Matches (${romanticMatches.length})</h3>
          <p>You both expressed interest in a romantic connection!</p>
          ${romanticMatches.map(match => `
          <div class="contact-info">
            <h4>${match.name}</h4>
            <p><strong>Email:</strong> ${match.email}</p>
            <p><strong>Phone:</strong> ${match.phone}</p>
          </div>
          `).join('')}
        </div>
        ` : ''}
        
        ${platonicMatches.length > 0 ? `
        <div class="match-section platonic-match">
          <h3>👥 Friend Matches (${platonicMatches.length})</h3>
          <p>You both would like to connect as friends!</p>
          ${platonicMatches.map(match => `
          <div class="contact-info">
            <h4>${match.name}</h4>
            <p><strong>Email:</strong> ${match.email}</p>
          </div>
          `).join('')}
        </div>
        ` : ''}
        
        ${!hasMatches ? `
        <div class="match-section no-matches">
          <h3>No Matches This Time</h3>
          <p>While there weren't any mutual matches from this event, don't be discouraged! Speed dating is about meeting new people and sometimes the connections happen at future events.</p>
          <p>We'd love to see you at our next event!</p>
        </div>
        ` : ''}
        
        ${hasMatches ? `
        <div style="margin: 30px 0; padding: 20px; background: #e8f5e8; border-radius: 8px;">
          <h3>🎯 Next Steps:</h3>
          <ul>
            <li>Reach out to your matches - they're excited to hear from you!</li>
            <li>Be yourself and have fun getting to know each other</li>
            <li>Remember to be respectful and considerate</li>
          </ul>
        </div>
        ` : ''}
        
        <p><strong>Privacy Reminder:</strong> Only mutual matches are shared. Your individual selections remain completely confidential.</p>
        
        <p>Thank you for being part of our speed dating community! We hope to see you at future events.</p>
        
        <p>Best regards,<br>The Speed Dating Team</p>
      </div>
      
      <div class="footer">
        <p>Questions about your results? Reply to this email.</p>
        <p>Want to join our next event? Visit our website or follow us on social media!</p>
      </div>
    </body>
    </html>
    `;

    const textContent = `
Hi ${participantName}!

Your ${eventName} results are ready!

${romanticMatches.length > 0 ? `
ROMANTIC MATCHES (${romanticMatches.length}):
${romanticMatches.map(match => `
${match.name}
Email: ${match.email}
Phone: ${match.phone}
`).join('\n')}
` : ''}

${platonicMatches.length > 0 ? `
FRIEND MATCHES (${platonicMatches.length}):
${platonicMatches.map(match => `
${match.name}
Email: ${match.email}
`).join('\n')}
` : ''}

${!hasMatches ? `
No mutual matches this time, but don't be discouraged! We'd love to see you at our next event.
` : ''}

${hasMatches ? `
Next Steps:
- Reach out to your matches - they're excited to hear from you!
- Be yourself and have fun getting to know each other
- Remember to be respectful and considerate
` : ''}

Only mutual matches are shared. Your individual selections remain confidential.

Thank you for being part of our community!

Best regards,
The Speed Dating Team
    `;

    return { subject, htmlContent, textContent };
  }
}

// Singleton email service instance
export const emailService = new EmailService();