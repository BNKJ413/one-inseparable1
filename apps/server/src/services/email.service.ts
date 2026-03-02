import { Resend } from 'resend';
import {
  welcomeEmail,
  WelcomeEmailData,
  dailyAnchorReminderEmail,
  DailyAnchorReminderData,
  partnerPairingEmail,
  PartnerPairingData,
  streakMilestoneEmail,
  StreakMilestoneData,
  passwordResetEmail,
  PasswordResetData,
  subscriptionConfirmationEmail,
  SubscriptionConfirmationData,
  donationThankYouEmail,
  DonationThankYouData,
} from '../templates/email-templates';

// Initialize Resend client (null if no API key configured)
const RESEND_API_KEY = process.env.RESEND_API_KEY;
const resend = RESEND_API_KEY ? new Resend(RESEND_API_KEY) : null;

// Check if email service is configured
const isEmailConfigured = (): boolean => {
  return resend !== null;
};

// Email configuration
const FROM_EMAIL = process.env.EMAIL_FROM || 'ONE <hello@oneinseparable.app>';
const REPLY_TO = process.env.EMAIL_REPLY_TO || 'support@oneinseparable.app';

// Email result type
interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

// ============================================
// Email Service Functions
// ============================================

/**
 * Send welcome email to new users
 */
export async function sendWelcomeEmail(
  to: string,
  data: WelcomeEmailData
): Promise<EmailResult> {
  if (!resend) {
    console.log(`[Email] Skipped welcome email to ${to} - Resend not configured`);
    return { success: true, messageId: 'skipped-no-api-key' };
  }

  try {
    const { subject, html } = welcomeEmail(data);
    
    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to: [to],
      replyTo: REPLY_TO,
      subject,
      html,
    });

    console.log(`[Email] Welcome email sent to ${to}`, result);
    return { success: true, messageId: result.data?.id };
  } catch (error) {
    console.error(`[Email] Failed to send welcome email to ${to}:`, error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

/**
 * Send daily anchor reminder email
 */
export async function sendDailyAnchorReminder(
  to: string,
  data: DailyAnchorReminderData
): Promise<EmailResult> {
  if (!resend) {
    console.log(`[Email] Skipped anchor reminder to ${to} - Resend not configured`);
    return { success: true, messageId: 'skipped-no-api-key' };
  }

  try {
    const { subject, html } = dailyAnchorReminderEmail(data);
    
    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to: [to],
      replyTo: REPLY_TO,
      subject,
      html,
    });

    console.log(`[Email] Daily anchor reminder sent to ${to}`, result);
    return { success: true, messageId: result.data?.id };
  } catch (error) {
    console.error(`[Email] Failed to send anchor reminder to ${to}:`, error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

/**
 * Send partner pairing success email
 */
export async function sendPartnerPairingEmail(
  to: string,
  data: PartnerPairingData
): Promise<EmailResult> {
  if (!resend) {
    console.log(`[Email] Skipped pairing email to ${to} - Resend not configured`);
    return { success: true, messageId: 'skipped-no-api-key' };
  }

  try {
    const { subject, html } = partnerPairingEmail(data);
    
    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to: [to],
      replyTo: REPLY_TO,
      subject,
      html,
    });

    console.log(`[Email] Partner pairing email sent to ${to}`, result);
    return { success: true, messageId: result.data?.id };
  } catch (error) {
    console.error(`[Email] Failed to send pairing email to ${to}:`, error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

/**
 * Send streak milestone celebration email
 */
export async function sendStreakMilestoneEmail(
  to: string,
  data: StreakMilestoneData
): Promise<EmailResult> {
  if (!resend) {
    console.log(`[Email] Skipped milestone email to ${to} - Resend not configured`);
    return { success: true, messageId: 'skipped-no-api-key' };
  }

  try {
    const { subject, html } = streakMilestoneEmail(data);
    
    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to: [to],
      replyTo: REPLY_TO,
      subject,
      html,
    });

    console.log(`[Email] Streak milestone email sent to ${to} (${data.streakDays} days)`, result);
    return { success: true, messageId: result.data?.id };
  } catch (error) {
    console.error(`[Email] Failed to send milestone email to ${to}:`, error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

/**
 * Send password reset email
 */
export async function sendPasswordResetEmail(
  to: string,
  data: PasswordResetData
): Promise<EmailResult> {
  if (!resend) {
    console.log(`[Email] Skipped password reset email to ${to} - Resend not configured`);
    return { success: true, messageId: 'skipped-no-api-key' };
  }

  try {
    const { subject, html } = passwordResetEmail(data);
    
    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to: [to],
      replyTo: REPLY_TO,
      subject,
      html,
    });

    console.log(`[Email] Password reset email sent to ${to}`, result);
    return { success: true, messageId: result.data?.id };
  } catch (error) {
    console.error(`[Email] Failed to send password reset email to ${to}:`, error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

/**
 * Send subscription confirmation email
 */
export async function sendSubscriptionConfirmationEmail(
  to: string,
  data: SubscriptionConfirmationData
): Promise<EmailResult> {
  if (!resend) {
    console.log(`[Email] Skipped subscription confirmation to ${to} - Resend not configured`);
    return { success: true, messageId: 'skipped-no-api-key' };
  }

  try {
    const { subject, html } = subscriptionConfirmationEmail(data);
    
    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to: [to],
      replyTo: REPLY_TO,
      subject,
      html,
    });

    console.log(`[Email] Subscription confirmation sent to ${to}`, result);
    return { success: true, messageId: result.data?.id };
  } catch (error) {
    console.error(`[Email] Failed to send subscription confirmation to ${to}:`, error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

/**
 * Send donation thank you email
 */
export async function sendDonationThankYouEmail(
  to: string,
  data: DonationThankYouData
): Promise<EmailResult> {
  if (!resend) {
    console.log(`[Email] Skipped donation thank you to ${to} - Resend not configured`);
    return { success: true, messageId: 'skipped-no-api-key' };
  }

  try {
    const { subject, html } = donationThankYouEmail(data);
    
    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to: [to],
      replyTo: REPLY_TO,
      subject,
      html,
    });

    console.log(`[Email] Donation thank you email sent to ${to}`, result);
    return { success: true, messageId: result.data?.id };
  } catch (error) {
    console.error(`[Email] Failed to send donation thank you to ${to}:`, error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

/**
 * Batch send emails (for cron jobs)
 * Includes rate limiting to avoid hitting Resend limits
 */
export async function sendBatchEmails<T>(
  emails: Array<{ to: string; data: T }>,
  sendFn: (to: string, data: T) => Promise<EmailResult>,
  delayMs: number = 100 // Rate limiting delay between emails
): Promise<{ sent: number; failed: number; errors: string[] }> {
  const results = {
    sent: 0,
    failed: 0,
    errors: [] as string[],
  };

  for (const email of emails) {
    try {
      const result = await sendFn(email.to, email.data);
      
      if (result.success) {
        results.sent++;
      } else {
        results.failed++;
        results.errors.push(`${email.to}: ${result.error}`);
      }

      // Rate limiting
      if (delayMs > 0) {
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    } catch (error) {
      results.failed++;
      results.errors.push(
        `${email.to}: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  return results;
}

// Export utility function
export { isEmailConfigured };

// Export types for use in other modules
export type {
  WelcomeEmailData,
  DailyAnchorReminderData,
  PartnerPairingData,
  StreakMilestoneData,
  PasswordResetData,
  SubscriptionConfirmationData,
  DonationThankYouData,
  EmailResult,
};
