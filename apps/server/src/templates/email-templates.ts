import {
  baseEmailTemplate,
  buttonStyle,
  secondaryButtonStyle,
  headingStyle,
  subheadingStyle,
  paragraphStyle,
  highlightBoxStyle,
  BRAND_COLORS,
} from './email-base';

// ============================================
// WELCOME EMAIL
// ============================================
export interface WelcomeEmailData {
  firstName: string;
  loginUrl: string;
}

export const welcomeEmail = (data: WelcomeEmailData) => {
  const content = `
    <h1 class="main-heading" style="${headingStyle}">
      Welcome to ONE, ${data.firstName}! 💛
    </h1>
    
    <p style="${paragraphStyle}">
      You've just taken a meaningful step toward building a stronger, more connected marriage. 
      We're honored to be part of your journey.
    </p>
    
    <div style="${highlightBoxStyle}">
      <p style="${paragraphStyle}; margin-bottom: 0;">
        <strong>What's next?</strong><br><br>
        ✨ Set your daily anchor time<br>
        💑 Connect with your spouse using your unique code<br>
        📖 Explore Scripture and action ideas for your marriage
      </p>
    </div>
    
    <p style="${paragraphStyle}">
      Every day, you'll receive a fresh anchor—a Scripture or principle paired with 
      a simple action to keep you and your spouse connected and growing together.
    </p>
    
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
      <tr>
        <td align="center" style="padding: 24px 0;">
          <a href="${data.loginUrl}" class="cta-button" style="${buttonStyle}">
            Start Your Journey →
          </a>
        </td>
      </tr>
    </table>
    
    <p style="${paragraphStyle}; font-size: 14px; color: ${BRAND_COLORS.textLight};">
      Remember: small, consistent actions create lasting change. You've got this—and we've got you.
    </p>
  `;

  return {
    subject: `Welcome to ONE, ${data.firstName}! Your marriage journey starts now 💛`,
    html: baseEmailTemplate(content, "You've joined ONE - let's build a stronger marriage together"),
  };
};

// ============================================
// DAILY ANCHOR REMINDER
// ============================================
export interface DailyAnchorReminderData {
  firstName: string;
  anchorTime: 'morning' | 'midday' | 'evening';
  appUrl: string;
  streak?: number;
}

const anchorTimeMessages = {
  morning: {
    greeting: 'Good morning',
    message: "Start your day anchored in love.",
    emoji: '🌅',
  },
  midday: {
    greeting: 'Hey there',
    message: "Take a moment to reconnect.",
    emoji: '☀️',
  },
  evening: {
    greeting: 'Good evening',
    message: "End your day connected.",
    emoji: '🌙',
  },
};

export const dailyAnchorReminderEmail = (data: DailyAnchorReminderData) => {
  const timeData = anchorTimeMessages[data.anchorTime];
  
  const content = `
    <h1 class="main-heading" style="${headingStyle}">
      ${timeData.greeting}, ${data.firstName}! ${timeData.emoji}
    </h1>
    
    <p style="${paragraphStyle}">
      ${timeData.message} Your daily anchor is ready and waiting.
    </p>
    
    ${data.streak && data.streak > 0 ? `
      <div style="${highlightBoxStyle}">
        <p style="${paragraphStyle}; margin-bottom: 0;">
          🔥 <strong>${data.streak}-day streak!</strong><br>
          Keep the momentum going—every day counts.
        </p>
      </div>
    ` : ''}
    
    <p style="${paragraphStyle}">
      Today's anchor includes a meaningful Scripture or principle, plus a simple action 
      you can take to strengthen your connection with your spouse.
    </p>
    
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
      <tr>
        <td align="center" style="padding: 24px 0;">
          <a href="${data.appUrl}/today" class="cta-button" style="${buttonStyle}">
            View Today's Anchor
          </a>
        </td>
      </tr>
    </table>
    
    <p style="${paragraphStyle}; font-size: 14px; color: ${BRAND_COLORS.textLight}; text-align: center;">
      Small steps. Big impact. One day at a time.
    </p>
  `;

  return {
    subject: `${timeData.emoji} Your daily anchor is ready, ${data.firstName}`,
    html: baseEmailTemplate(content, `${timeData.message} Your daily anchor awaits.`),
  };
};

// ============================================
// PARTNER PAIRING SUCCESS
// ============================================
export interface PartnerPairingData {
  firstName: string;
  partnerName: string;
  appUrl: string;
}

export const partnerPairingEmail = (data: PartnerPairingData) => {
  const content = `
    <h1 class="main-heading" style="${headingStyle}">
      You're connected! 💑
    </h1>
    
    <p style="${paragraphStyle}">
      Great news, ${data.firstName}! You and ${data.partnerName} are now paired in ONE.
    </p>
    
    <div style="${highlightBoxStyle}">
      <p style="${paragraphStyle}; margin-bottom: 0;">
        <strong>What this means:</strong><br><br>
        ✅ Your daily anchors are now synced<br>
        ✅ You can send stickers to encourage each other<br>
        ✅ Your connection streak tracks your journey together<br>
        ✅ You're building something beautiful, together
      </p>
    </div>
    
    <p style="${paragraphStyle}">
      Remember, the goal isn't perfection—it's progress. Every small act of 
      intentionality strengthens your bond.
    </p>
    
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
      <tr>
        <td align="center" style="padding: 24px 0;">
          <a href="${data.appUrl}/today" class="cta-button" style="${buttonStyle}">
            Start Connecting
          </a>
        </td>
      </tr>
    </table>
  `;

  return {
    subject: `You're paired with ${data.partnerName}! 💑 Let's build together`,
    html: baseEmailTemplate(content, `You and ${data.partnerName} are now connected in ONE!`),
  };
};

// ============================================
// STREAK MILESTONE
// ============================================
export interface StreakMilestoneData {
  firstName: string;
  streakDays: number;
  appUrl: string;
  partnerName?: string;
}

const milestoneMessages: Record<number, { emoji: string; title: string; message: string }> = {
  3: {
    emoji: '🌱',
    title: '3 Days Strong!',
    message: "You're building a habit. The first few days are the hardest—you're doing great!",
  },
  7: {
    emoji: '🔥',
    title: '1 Week Streak!',
    message: "A full week of intentional connection. That's something to celebrate!",
  },
  14: {
    emoji: '⭐',
    title: '2 Weeks of Connection!',
    message: "Two weeks in, and you're proving that love is a daily choice. Keep going!",
  },
  21: {
    emoji: '💪',
    title: '21 Days—Habit Formed!',
    message: "They say 21 days makes a habit. You've just built a connection habit!",
  },
  30: {
    emoji: '🏆',
    title: '30-Day Champion!',
    message: "One whole month of showing up for your marriage. That's incredible dedication.",
  },
  60: {
    emoji: '💎',
    title: '60 Days of Love!',
    message: "Two months of daily connection. Your marriage is being transformed!",
  },
  90: {
    emoji: '👑',
    title: '90-Day Legend!',
    message: "Three months of consistent love and connection. You're an inspiration!",
  },
  180: {
    emoji: '🌟',
    title: '6 Months of Faithfulness!',
    message: "Half a year of showing up every single day. Your commitment is remarkable.",
  },
  365: {
    emoji: '🎉',
    title: 'ONE YEAR!',
    message: "365 days of intentional connection. This is what inseparable looks like!",
  },
};

export const streakMilestoneEmail = (data: StreakMilestoneData) => {
  const milestone = milestoneMessages[data.streakDays] || {
    emoji: '🎯',
    title: `${data.streakDays} Day Streak!`,
    message: `${data.streakDays} days of showing up for your marriage. Keep building!`,
  };

  const content = `
    <div style="text-align: center; margin-bottom: 24px;">
      <span style="font-size: 64px;">${milestone.emoji}</span>
    </div>
    
    <h1 class="main-heading" style="${headingStyle}; text-align: center;">
      ${milestone.title}
    </h1>
    
    <p style="${paragraphStyle}; text-align: center;">
      Congratulations, ${data.firstName}${data.partnerName ? ` and ${data.partnerName}` : ''}!
    </p>
    
    <div style="${highlightBoxStyle}">
      <p style="${paragraphStyle}; margin-bottom: 0; text-align: center;">
        ${milestone.message}
      </p>
    </div>
    
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
      <tr>
        <td align="center">
          <div style="background: linear-gradient(135deg, ${BRAND_COLORS.primary} 0%, ${BRAND_COLORS.accent} 100%); color: white; padding: 20px 40px; border-radius: 12px; display: inline-block;">
            <span style="font-size: 48px; font-weight: 700;">${data.streakDays}</span><br>
            <span style="font-size: 14px; text-transform: uppercase; letter-spacing: 2px;">Days Connected</span>
          </div>
        </td>
      </tr>
    </table>
    
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
      <tr>
        <td align="center" style="padding: 32px 0 16px;">
          <a href="${data.appUrl}/today" class="cta-button" style="${buttonStyle}">
            Keep the Streak Going!
          </a>
        </td>
      </tr>
    </table>
    
    <p style="${paragraphStyle}; font-size: 14px; color: ${BRAND_COLORS.textLight}; text-align: center;">
      Share this milestone with your spouse and celebrate together! 🎉
    </p>
  `;

  return {
    subject: `${milestone.emoji} ${milestone.title} - You hit ${data.streakDays} days!`,
    html: baseEmailTemplate(content, `Celebrate! You've reached a ${data.streakDays}-day connection streak!`),
  };
};

// ============================================
// PASSWORD RESET
// ============================================
export interface PasswordResetData {
  firstName: string;
  resetUrl: string;
  expiryMinutes: number;
}

export const passwordResetEmail = (data: PasswordResetData) => {
  const content = `
    <h1 class="main-heading" style="${headingStyle}">
      Reset Your Password
    </h1>
    
    <p style="${paragraphStyle}">
      Hi ${data.firstName}, we received a request to reset your password for your ONE account.
    </p>
    
    <p style="${paragraphStyle}">
      Click the button below to create a new password:
    </p>
    
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
      <tr>
        <td align="center" style="padding: 24px 0;">
          <a href="${data.resetUrl}" class="cta-button" style="${buttonStyle}">
            Reset Password
          </a>
        </td>
      </tr>
    </table>
    
    <div style="${highlightBoxStyle}; background-color: #FFF8E1; border-left-color: #FFB300;">
      <p style="${paragraphStyle}; margin-bottom: 0; font-size: 14px;">
        ⏰ This link expires in <strong>${data.expiryMinutes} minutes</strong>.<br><br>
        If you didn't request this reset, you can safely ignore this email. 
        Your password won't be changed.
      </p>
    </div>
    
    <p style="${paragraphStyle}; font-size: 14px; color: ${BRAND_COLORS.textLight};">
      If the button doesn't work, copy and paste this link into your browser:<br>
      <span style="word-break: break-all; color: ${BRAND_COLORS.primary};">${data.resetUrl}</span>
    </p>
  `;

  return {
    subject: 'Reset your ONE password',
    html: baseEmailTemplate(content, 'Reset your password to continue your marriage journey'),
  };
};

// ============================================
// SUBSCRIPTION CONFIRMATION
// ============================================
export interface SubscriptionConfirmationData {
  firstName: string;
  planName: string;
  amount: string;
  billingCycle: 'monthly' | 'yearly';
  appUrl: string;
}

export const subscriptionConfirmationEmail = (data: SubscriptionConfirmationData) => {
  const content = `
    <h1 class="main-heading" style="${headingStyle}">
      Thank You for Your Support! 💛
    </h1>
    
    <p style="${paragraphStyle}">
      Hi ${data.firstName}, your subscription to ONE is now active!
    </p>
    
    <div style="${highlightBoxStyle}">
      <p style="${paragraphStyle}; margin-bottom: 0;">
        <strong>Subscription Details:</strong><br><br>
        📋 Plan: ${data.planName}<br>
        💰 Amount: ${data.amount}/${data.billingCycle === 'monthly' ? 'month' : 'year'}<br>
        ✅ Status: Active
      </p>
    </div>
    
    <p style="${paragraphStyle}">
      Your support helps us continue building tools that strengthen marriages. 
      Thank you for being part of this mission!
    </p>
    
    <h2 style="${subheadingStyle}">What's Included:</h2>
    <ul style="${paragraphStyle}">
      <li>Unlimited access to all Scripture and action ideas</li>
      <li>Advanced couple features and insights</li>
      <li>Priority support</li>
      <li>Early access to new features</li>
    </ul>
    
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
      <tr>
        <td align="center" style="padding: 24px 0;">
          <a href="${data.appUrl}/today" class="cta-button" style="${buttonStyle}">
            Continue Your Journey
          </a>
        </td>
      </tr>
    </table>
  `;

  return {
    subject: `Welcome to ${data.planName}! Your subscription is active 💛`,
    html: baseEmailTemplate(content, `Your ${data.planName} subscription is now active!`),
  };
};

// ============================================
// DONATION THANK YOU
// ============================================
export interface DonationThankYouData {
  firstName: string;
  amount: string;
  appUrl: string;
}

export const donationThankYouEmail = (data: DonationThankYouData) => {
  const content = `
    <h1 class="main-heading" style="${headingStyle}">
      Thank You for Your Generosity! 🙏
    </h1>
    
    <p style="${paragraphStyle}">
      Hi ${data.firstName}, we're deeply grateful for your donation of <strong>${data.amount}</strong> to ONE.
    </p>
    
    <div style="${highlightBoxStyle}">
      <p style="${paragraphStyle}; margin-bottom: 0;">
        Your generosity directly supports our mission to help couples build 
        stronger, faith-centered marriages. Every contribution makes a difference.
      </p>
    </div>
    
    <p style="${paragraphStyle}">
      Because of supporters like you, we can:
    </p>
    <ul style="${paragraphStyle}">
      <li>Keep core features free for all couples</li>
      <li>Develop new tools for marriage growth</li>
      <li>Reach more couples who need support</li>
      <li>Maintain and improve the platform</li>
    </ul>
    
    <p style="${paragraphStyle}">
      May God bless you abundantly for your heart to serve marriages!
    </p>
    
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
      <tr>
        <td align="center" style="padding: 24px 0;">
          <a href="${data.appUrl}/today" class="cta-button" style="${buttonStyle}">
            Continue Building Your Marriage
          </a>
        </td>
      </tr>
    </table>
  `;

  return {
    subject: 'Thank you for your donation to ONE! 🙏',
    html: baseEmailTemplate(content, `Thank you for your generous ${data.amount} donation!`),
  };
};
