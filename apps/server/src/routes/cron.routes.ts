import { Router, Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import {
  sendDailyAnchorReminder,
  sendStreakMilestoneEmail,
  sendBatchEmails,
  DailyAnchorReminderData,
  StreakMilestoneData,
} from '../services/email.service';

const router = Router();
const prisma = new PrismaClient();

// Milestone days that trigger celebration emails
const MILESTONE_DAYS = [3, 7, 14, 21, 30, 60, 90, 180, 365];

// ============================================
// Cron Authentication Middleware
// ============================================
const authenticateCron = (req: Request, res: Response, next: NextFunction): void => {
  const cronSecret = process.env.CRON_SECRET;
  
  if (!cronSecret) {
    console.error('[Cron] CRON_SECRET is not configured');
    res.status(500).json({ error: 'Cron authentication not configured' });
    return;
  }

  const authHeader = req.headers.authorization;
  const providedSecret = authHeader?.replace('Bearer ', '');

  if (providedSecret !== cronSecret) {
    console.warn('[Cron] Unauthorized cron request attempt');
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  next();
};

// Apply authentication to all cron routes
router.use(authenticateCron);

// ============================================
// Helper Functions
// ============================================

/**
 * Get the current hour in a specific timezone
 */
function getCurrentHourInTimezone(timezone: string): number {
  try {
    const now = new Date();
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      hour: 'numeric',
      hour12: false,
    });
    return parseInt(formatter.format(now), 10);
  } catch {
    // Default to UTC if timezone is invalid
    return new Date().getUTCHours();
  }
}

/**
 * Determine anchor time slot based on hour
 */
function getAnchorTimeSlot(hour: number): 'morning' | 'midday' | 'evening' | null {
  if (hour >= 6 && hour < 10) return 'morning';
  if (hour >= 11 && hour < 14) return 'midday';
  if (hour >= 18 && hour < 21) return 'evening';
  return null;
}

/**
 * Parse anchor times from user's JSON string
 */
function parseAnchorTimes(anchorTimesJson: string): { morning?: boolean; midday?: boolean; evening?: boolean } {
  try {
    return JSON.parse(anchorTimesJson || '{}');
  } catch {
    return {};
  }
}

// ============================================
// POST /api/cron/send-anchor-reminders
// Sends daily anchor reminder emails to users based on their anchor times
// ============================================
router.post('/send-anchor-reminders', async (req: Request, res: Response) => {
  const startTime = Date.now();
  console.log('[Cron] Starting anchor reminder job...');

  try {
    // Get all users with their anchor time preferences
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        firstName: true,
        timezone: true,
        anchorTimes: true,
        couple: {
          select: {
            streak: true,
          },
        },
      },
    });

    const emailsToSend: Array<{ to: string; data: DailyAnchorReminderData }> = [];
    const appUrl = process.env.WEB_BASE_URL || 'https://oneinseparable.app';

    for (const user of users) {
      const currentHour = getCurrentHourInTimezone(user.timezone);
      const currentSlot = getAnchorTimeSlot(currentHour);

      if (!currentSlot) continue;

      const anchorTimes = parseAnchorTimes(user.anchorTimes);
      
      // Check if user has this anchor time enabled
      if (anchorTimes[currentSlot]) {
        emailsToSend.push({
          to: user.email,
          data: {
            firstName: user.firstName,
            anchorTime: currentSlot,
            appUrl,
            streak: user.couple?.streak,
          },
        });
      }
    }

    console.log(`[Cron] Found ${emailsToSend.length} users to send anchor reminders`);

    // Send emails with rate limiting
    const results = await sendBatchEmails(
      emailsToSend,
      sendDailyAnchorReminder,
      100 // 100ms delay between emails
    );

    const duration = Date.now() - startTime;
    console.log(`[Cron] Anchor reminder job completed in ${duration}ms`, results);

    res.json({
      success: true,
      message: 'Anchor reminders sent',
      stats: {
        totalUsers: users.length,
        emailsSent: results.sent,
        emailsFailed: results.failed,
        durationMs: duration,
      },
      errors: results.errors.length > 0 ? results.errors.slice(0, 10) : undefined, // Limit error details
    });
  } catch (error) {
    console.error('[Cron] Anchor reminder job failed:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// ============================================
// POST /api/cron/update-streaks
// Updates daily streaks for all couples
// ============================================
router.post('/update-streaks', async (req: Request, res: Response) => {
  const startTime = Date.now();
  console.log('[Cron] Starting streak update job...');

  try {
    // Get all couples with their last connection time
    const couples = await prisma.couple.findMany({
      select: {
        id: true,
        streak: true,
        lastConnectionAt: true,
      },
    });

    let updatedCount = 0;
    let resetCount = 0;
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const twoDaysAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000);

    for (const couple of couples) {
      // If they connected yesterday (within 24-48 hours ago), streak continues
      // If they haven't connected in over 48 hours, reset streak
      if (couple.lastConnectionAt) {
        const lastConnection = new Date(couple.lastConnectionAt);
        
        if (lastConnection < twoDaysAgo && couple.streak > 0) {
          // Reset streak - they missed more than a day
          await prisma.couple.update({
            where: { id: couple.id },
            data: { streak: 0 },
          });
          resetCount++;
        }
      } else if (couple.streak > 0) {
        // No connection ever recorded but has streak - reset
        await prisma.couple.update({
          where: { id: couple.id },
          data: { streak: 0 },
        });
        resetCount++;
      }
      
      updatedCount++;
    }

    const duration = Date.now() - startTime;
    console.log(`[Cron] Streak update job completed in ${duration}ms. Checked: ${updatedCount}, Reset: ${resetCount}`);

    res.json({
      success: true,
      message: 'Streaks updated',
      stats: {
        totalCouples: couples.length,
        checkedCount: updatedCount,
        resetCount,
        durationMs: duration,
      },
    });
  } catch (error) {
    console.error('[Cron] Streak update job failed:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// ============================================
// POST /api/cron/milestone-check
// Checks for streak milestones and sends celebration emails
// ============================================
router.post('/milestone-check', async (req: Request, res: Response) => {
  const startTime = Date.now();
  console.log('[Cron] Starting milestone check job...');

  try {
    // Find couples that hit a milestone today
    const couplesAtMilestones = await prisma.couple.findMany({
      where: {
        streak: { in: MILESTONE_DAYS },
      },
      include: {
        users: {
          select: {
            email: true,
            firstName: true,
          },
        },
      },
    });

    const emailsToSend: Array<{ to: string; data: StreakMilestoneData }> = [];
    const appUrl = process.env.WEB_BASE_URL || 'https://oneinseparable.app';

    for (const couple of couplesAtMilestones) {
      // Get both partner names for the email
      const partnerNames = couple.users.map(u => u.firstName);
      
      for (const user of couple.users) {
        const otherPartner = couple.users.find(u => u.email !== user.email);
        
        emailsToSend.push({
          to: user.email,
          data: {
            firstName: user.firstName,
            streakDays: couple.streak,
            appUrl,
            partnerName: otherPartner?.firstName,
          },
        });
      }
    }

    console.log(`[Cron] Found ${emailsToSend.length} milestone emails to send`);

    // Send emails with rate limiting
    const results = await sendBatchEmails(
      emailsToSend,
      sendStreakMilestoneEmail,
      100
    );

    const duration = Date.now() - startTime;
    console.log(`[Cron] Milestone check job completed in ${duration}ms`, results);

    res.json({
      success: true,
      message: 'Milestone emails sent',
      stats: {
        couplesAtMilestones: couplesAtMilestones.length,
        emailsSent: results.sent,
        emailsFailed: results.failed,
        milestonesHit: couplesAtMilestones.map(c => c.streak),
        durationMs: duration,
      },
      errors: results.errors.length > 0 ? results.errors.slice(0, 10) : undefined,
    });
  } catch (error) {
    console.error('[Cron] Milestone check job failed:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// ============================================
// GET /api/cron/health
// Health check endpoint for monitoring
// ============================================
router.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'one-cron',
  });
});

export default router;
