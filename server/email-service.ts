import { Resend } from 'resend';

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const EMAIL_FROM = process.env.EMAIL_FROM || 'WinnStorm <noreply@winnstorm.com>';

export interface EmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  attachments?: Array<{
    filename: string;
    content: Buffer;
  }>;
}

export async function sendEmail(options: EmailOptions): Promise<{ success: boolean; error?: string }> {
  if (!resend) {
    console.warn('Email service not configured - RESEND_API_KEY not set');
    // In development, log what would be sent
    console.log('Would send email:', {
      to: options.to,
      subject: options.subject,
      preview: options.html.substring(0, 200) + '...'
    });
    return { success: true }; // Return success in dev mode
  }

  try {
    const { data, error } = await resend.emails.send({
      from: EMAIL_FROM,
      to: Array.isArray(options.to) ? options.to : [options.to],
      subject: options.subject,
      html: options.html,
      text: options.text,
      attachments: options.attachments?.map(a => ({
        filename: a.filename,
        content: a.content,
      })),
    });

    if (error) {
      console.error('Email send error:', error);
      return { success: false, error: error.message };
    }

    console.log('Email sent successfully:', data?.id);
    return { success: true };
  } catch (error: any) {
    console.error('Email service error:', error);
    return { success: false, error: error.message };
  }
}

// Pre-built email templates
export const emailTemplates = {
  welcomeEmail: (userName: string) => ({
    subject: 'Welcome to WinnStorm - Your Damage Assessment Platform',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #1e3a5f 0%, #2d5a87 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 8px 8px; }
          .button { display: inline-block; background: #1e3a5f; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Welcome to WinnStorm</h1>
          </div>
          <div class="content">
            <p>Hi ${userName || 'there'},</p>
            <p>Welcome to WinnStorm! You've joined the most advanced damage assessment platform for roofing consultants.</p>
            <p>Here's what you can do:</p>
            <ul>
              <li><strong>Conduct inspections</strong> using the Winn Methodology</li>
              <li><strong>Get AI assistance</strong> from Stormy, your field co-pilot</li>
              <li><strong>Generate professional reports</strong> for your clients</li>
              <li><strong>Track your certifications</strong> and training progress</li>
            </ul>
            <a href="https://winnstorm.com/dashboard" class="button">Go to Dashboard</a>
            <p>Need help? Our support team is here for you.</p>
          </div>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} WinnStorm. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `,
  }),

  reportDelivery: (recipientName: string, propertyAddress: string, reportType: string) => ({
    subject: `Your ${reportType} Report is Ready - ${propertyAddress}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #1e3a5f 0%, #2d5a87 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 8px 8px; }
          .property-box { background: white; border: 1px solid #ddd; border-radius: 6px; padding: 15px; margin: 15px 0; }
          .button { display: inline-block; background: #1e3a5f; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Your Report is Ready</h1>
          </div>
          <div class="content">
            <p>Hi ${recipientName || 'there'},</p>
            <p>Your ${reportType} report has been completed and is attached to this email.</p>
            <div class="property-box">
              <strong>Property:</strong> ${propertyAddress}
            </div>
            <p>Please review the attached PDF report. If you have any questions or need clarification on any findings, don't hesitate to reach out.</p>
            <p>Thank you for choosing WinnStorm for your damage assessment needs.</p>
          </div>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} WinnStorm. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `,
  }),

  subscriptionConfirmation: (userName: string, planName: string, amount: string) => ({
    subject: `Subscription Confirmed - WinnStorm ${planName}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #1e3a5f 0%, #2d5a87 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 8px 8px; }
          .plan-box { background: white; border: 2px solid #1e3a5f; border-radius: 6px; padding: 20px; margin: 15px 0; text-align: center; }
          .plan-name { font-size: 24px; font-weight: bold; color: #1e3a5f; }
          .plan-price { font-size: 18px; color: #666; margin-top: 5px; }
          .button { display: inline-block; background: #1e3a5f; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Subscription Confirmed!</h1>
          </div>
          <div class="content">
            <p>Hi ${userName || 'there'},</p>
            <p>Thank you for subscribing to WinnStorm! Your subscription is now active.</p>
            <div class="plan-box">
              <div class="plan-name">${planName} Plan</div>
              <div class="plan-price">${amount}/month</div>
            </div>
            <p>You now have full access to all ${planName} features. Start conducting professional damage assessments today!</p>
            <a href="https://winnstorm.com/dashboard" class="button">Go to Dashboard</a>
          </div>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} WinnStorm. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `,
  }),

  paymentFailed: (userName: string) => ({
    subject: 'Action Required: Payment Failed - WinnStorm',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #dc3545; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 8px 8px; }
          .button { display: inline-block; background: #1e3a5f; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Payment Failed</h1>
          </div>
          <div class="content">
            <p>Hi ${userName || 'there'},</p>
            <p>We were unable to process your subscription payment. Please update your payment method to continue using WinnStorm.</p>
            <p>If you don't update your payment method within 7 days, your subscription features may be limited.</p>
            <a href="https://winnstorm.com/settings/billing" class="button">Update Payment Method</a>
            <p>If you believe this is an error, please contact our support team.</p>
          </div>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} WinnStorm. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `,
  }),
};

// Convenience functions
export async function sendWelcomeEmail(to: string, userName: string) {
  const template = emailTemplates.welcomeEmail(userName);
  return sendEmail({ to, ...template });
}

export async function sendReportEmail(to: string, recipientName: string, propertyAddress: string, reportType: string, pdfBuffer?: Buffer) {
  const template = emailTemplates.reportDelivery(recipientName, propertyAddress, reportType);
  return sendEmail({
    to,
    ...template,
    attachments: pdfBuffer ? [{ filename: `${reportType.replace(/\s+/g, '_')}_Report.pdf`, content: pdfBuffer }] : undefined,
  });
}

export async function sendSubscriptionConfirmation(to: string, userName: string, planName: string, amount: string) {
  const template = emailTemplates.subscriptionConfirmation(userName, planName, amount);
  return sendEmail({ to, ...template });
}

export async function sendPaymentFailedEmail(to: string, userName: string) {
  const template = emailTemplates.paymentFailed(userName);
  return sendEmail({ to, ...template });
}
