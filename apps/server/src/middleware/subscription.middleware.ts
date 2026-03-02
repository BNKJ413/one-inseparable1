/**
 * Subscription Feature Gating Middleware
 * 
 * Checks if user has an active subscription for premium features.
 * Returns 402 Payment Required if not subscribed.
 */

import { Request, Response, NextFunction } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Extended request interface with user info
interface AuthenticatedRequest extends Request {
  user?: { userId: string; email: string };
  subscription?: {
    status: string;
    plan: string;
    isActive: boolean;
  };
}

/**
 * Middleware to require active subscription for premium endpoints
 * Must be used AFTER authenticateJWT middleware
 */
export async function requireSubscription(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    if (!req.user?.userId) {
      return res.status(401).json({ error: "Authentication required." });
    }

    // Check for active subscription
    const subscription = await prisma.subscription.findFirst({
      where: {
        userId: req.user.userId,
        status: "ACTIVE",
      },
      orderBy: { startedAt: "desc" },
    });

    if (!subscription) {
      return res.status(402).json({
        error: "Subscription required",
        code: "SUBSCRIPTION_REQUIRED",
        message: "This feature requires an active subscription. Upgrade to continue.",
        upgradeUrl: "/pricing",
      });
    }

    // Attach subscription info to request for downstream use
    req.subscription = {
      status: subscription.status,
      plan: subscription.plan,
      isActive: true,
    };

    next();
  } catch (error) {
    console.error("Subscription check error:", error);
    res.status(500).json({ error: "Failed to verify subscription status." });
  }
}

/**
 * Middleware to check subscription but allow free tier
 * Attaches subscription info without blocking request
 */
export async function checkSubscription(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    if (!req.user?.userId) {
      req.subscription = { status: "NONE", plan: "FREE", isActive: false };
      return next();
    }

    const subscription = await prisma.subscription.findFirst({
      where: {
        userId: req.user.userId,
        status: "ACTIVE",
      },
      orderBy: { startedAt: "desc" },
    });

    req.subscription = subscription
      ? { status: subscription.status, plan: subscription.plan, isActive: true }
      : { status: "NONE", plan: "FREE", isActive: false };

    next();
  } catch (error) {
    console.error("Subscription check error:", error);
    // Don't block on error, just set as free tier
    req.subscription = { status: "ERROR", plan: "FREE", isActive: false };
    next();
  }
}

/**
 * Premium features list for reference:
 * - Unlimited Scripture saves
 * - Premium action ideas
 * - Advanced streak analytics
 * - Priority email support
 * - Ad-free experience
 */
export const PREMIUM_FEATURES = [
  "unlimited_scripture_saves",
  "premium_actions",
  "advanced_analytics",
  "priority_support",
  "ad_free",
] as const;

export type PremiumFeature = (typeof PREMIUM_FEATURES)[number];

/**
 * Check if user has access to a specific premium feature
 */
export function hasFeatureAccess(
  subscription: AuthenticatedRequest["subscription"],
  _feature: PremiumFeature
): boolean {
  // For now, all premium features require subscription
  // In the future, can add feature-specific logic
  return subscription?.isActive ?? false;
}
