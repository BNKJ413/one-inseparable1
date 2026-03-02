import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import dotenv from "dotenv";
import { z } from "zod";
import Stripe from "stripe";
import { PrismaClient } from "@prisma/client";
import crypto from "node:crypto";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import rateLimit from "express-rate-limit";
import cronRoutes from "./routes/cron.routes";
import { requireSubscription, checkSubscription } from "./middleware/subscription.middleware";

dotenv.config();

const app = express();
const prisma = new PrismaClient();

// === Configuration ===
const PORT = Number(process.env.PORT || 4000);
const CORS_ORIGIN = process.env.CORS_ORIGIN || "http://localhost:3000";
const WEB_BASE_URL = process.env.WEB_BASE_URL || "http://localhost:3000";
const JWT_SECRET = process.env.JWT_SECRET || "CHANGE_THIS_SECRET_IN_PRODUCTION";
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || "CHANGE_THIS_REFRESH_SECRET_IN_PRODUCTION";
const JWT_ACCESS_EXPIRY = "15m";  // Short-lived access tokens
const JWT_REFRESH_EXPIRY = "7d"; // Longer-lived refresh tokens
const BCRYPT_SALT_ROUNDS = 12;

const stripeSecret = process.env.STRIPE_SECRET_KEY || "";
const stripeWebhookSecret = process.env.STRIPE_WEBHOOK_SECRET || "";
const priceMonthly = process.env.STRIPE_PRICE_ID_MONTHLY || "";

const stripe = stripeSecret ? new Stripe(stripeSecret, { apiVersion: "2024-06-20" }) : null;

// === CORS Configuration ===
const corsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    // Allow requests with no origin (mobile apps, curl, etc.)
    const allowedOrigins = CORS_ORIGIN.split(",").map(o => o.trim());
    if (!origin || allowedOrigins.includes(origin) || allowedOrigins.includes("*")) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

app.use(cors(corsOptions));

// === Rate Limiting ===
// Strict rate limiting for authentication endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 requests per window
  message: { error: "Too many authentication attempts, please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
  validate: { xForwardedForHeader: false }, // Disable IPv6 validation warning
});

// General API rate limiting
const generalLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 100, // 100 requests per minute
  message: { error: "Too many requests, please slow down." },
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply general rate limiting to all routes
app.use(generalLimiter);

// === Stripe Webhook (needs raw body) ===
app.post("/api/billing/webhook", express.raw({ type: "application/json" }), async (req, res) => {
  if (!stripe) return res.status(500).json({ error: "Stripe not configured." });
  try {
    const sig = req.headers["stripe-signature"];
    if (!sig || Array.isArray(sig)) return res.status(400).send("Missing signature");
    const event = stripe.webhooks.constructEvent(req.body, sig, stripeWebhookSecret);

    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.client_reference_id || "";
      const customer = (typeof session.customer === "string") ? session.customer : session.customer?.id;

      if (session.mode === "subscription" && userId) {
        await prisma.subscription.create({
          data: {
            userId,
            status: "ACTIVE",
            plan: "MEMBER",
            provider: "STRIPE",
            providerRef: customer || session.id,
            startedAt: new Date(),
          },
        });
      }

      if (session.metadata?.kind === "donation") {
        const amount = Number(session.amount_total || 0);
        await prisma.donation.create({
          data: {
            userId: userId || null,
            amount,
            currency: session.currency || "usd",
            type: session.mode === "subscription" ? "MONTHLY" : "ONE_TIME",
            note: session.metadata?.note || null,
          },
        });
      }
    }

    res.json({ received: true });
  } catch (err: any) {
    console.error("Webhook error:", err);
    res.status(400).send(`Webhook Error: ${err.message}`);
  }
});

// JSON body parser for all other routes
app.use(express.json({ limit: "10kb" })); // Limit body size for security

// === Cron Job Routes (external scheduler calls these) ===
app.use("/api/cron", cronRoutes);

// === Health Check ===
app.get("/health", (_req, res) => res.json({ ok: true, timestamp: new Date().toISOString() }));

// === JWT Utilities ===
interface JWTPayload {
  userId: string;
  email: string;
  type: "access" | "refresh";
}

function generateAccessToken(userId: string, email: string): string {
  return jwt.sign(
    { userId, email, type: "access", jti: crypto.randomUUID() } as JWTPayload & { jti: string },
    JWT_SECRET,
    { expiresIn: JWT_ACCESS_EXPIRY }
  );
}

function generateRefreshToken(userId: string, email: string): string {
  return jwt.sign(
    { userId, email, type: "refresh", jti: crypto.randomUUID() } as JWTPayload & { jti: string },
    JWT_REFRESH_SECRET,
    { expiresIn: JWT_REFRESH_EXPIRY }
  );
}

function verifyAccessToken(token: string): JWTPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
    if (decoded.type !== "access") return null;
    return decoded;
  } catch {
    return null;
  }
}

function verifyRefreshToken(token: string): JWTPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_REFRESH_SECRET) as JWTPayload;
    if (decoded.type !== "refresh") return null;
    return decoded;
  } catch {
    return null;
  }
}

// === JWT Authentication Middleware ===
interface AuthenticatedRequest extends Request {
  user?: { userId: string; email: string };
  subscription?: { status: string; plan: string; isActive: boolean };
}

async function authenticateJWT(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Missing or invalid authorization header" });
  }

  const token = authHeader.slice(7);
  const decoded = verifyAccessToken(token);

  if (!decoded) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }

  // Verify user still exists
  const user = await prisma.user.findUnique({ where: { id: decoded.userId } });
  if (!user) {
    return res.status(401).json({ error: "User not found" });
  }

  req.user = { userId: decoded.userId, email: decoded.email };
  next();
}

// === Password Hashing with bcrypt ===
async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_SALT_ROUNDS);
}

async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// === Validation Schemas ===
const registerSchema = z.object({
  firstName: z.string().min(1, "First name is required").max(50, "First name too long").trim(),
  email: z.string().email("Invalid email address").toLowerCase().trim(),
  password: z.string()
    .min(8, "Password must be at least 8 characters")
    .max(128, "Password too long")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
});

const loginSchema = z.object({
  email: z.string().email("Invalid email address").toLowerCase().trim(),
  password: z.string().min(1, "Password is required"),
});

const passwordResetRequestSchema = z.object({
  email: z.string().email("Invalid email address").toLowerCase().trim(),
});

const passwordResetSchema = z.object({
  token: z.string().min(1, "Token is required"),
  newPassword: z.string()
    .min(8, "Password must be at least 8 characters")
    .max(128, "Password too long")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
});

// === Auth Routes (with rate limiting) ===
app.post("/api/auth/register", authLimiter, async (req, res) => {
  try {
    const parsed = registerSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ 
        error: "Validation failed", 
        details: parsed.error.flatten().fieldErrors 
      });
    }

    const { firstName, email, password } = parsed.data;
    
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(409).json({ error: "Email already registered." });
    }

    const passwordHash = await hashPassword(password);
    
    const user = await prisma.user.create({
      data: { firstName, email, passwordHash },
      select: { id: true, firstName: true, email: true, coupleId: true },
    });

    // Generate tokens
    const accessToken = generateAccessToken(user.id, user.email);
    const refreshToken = generateRefreshToken(user.id, user.email);

    // Store refresh token in DB
    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      },
    });

    res.status(201).json({ 
      user,
      accessToken,
      refreshToken,
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ error: "Registration failed. Please try again." });
  }
});

app.post("/api/auth/login", authLimiter, async (req, res) => {
  try {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ 
        error: "Validation failed", 
        details: parsed.error.flatten().fieldErrors 
      });
    }

    const { email, password } = parsed.data;
    
    const user = await prisma.user.findUnique({ where: { email } });
    
    // Generic error to prevent user enumeration
    if (!user || !user.passwordHash) {
      return res.status(401).json({ error: "Invalid email or password." });
    }

    const passwordValid = await verifyPassword(password, user.passwordHash);
    if (!passwordValid) {
      return res.status(401).json({ error: "Invalid email or password." });
    }

    // Generate tokens
    const accessToken = generateAccessToken(user.id, user.email);
    const refreshToken = generateRefreshToken(user.id, user.email);

    // Store refresh token in DB
    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    res.json({ 
      accessToken,
      refreshToken,
      user: { 
        id: user.id, 
        firstName: user.firstName, 
        email: user.email, 
        coupleId: user.coupleId 
      }
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Login failed. Please try again." });
  }
});

// Refresh token endpoint
app.post("/api/auth/refresh", authLimiter, async (req, res) => {
  try {
    const { refreshToken } = req.body as { refreshToken: string };
    
    if (!refreshToken) {
      return res.status(400).json({ error: "Refresh token required." });
    }

    // Verify token signature
    const decoded = verifyRefreshToken(refreshToken);
    if (!decoded) {
      return res.status(401).json({ error: "Invalid or expired refresh token." });
    }

    // Check if token exists in DB and is not revoked
    const storedToken = await prisma.refreshToken.findUnique({
      where: { token: refreshToken },
      include: { user: true },
    });

    if (!storedToken || storedToken.revokedAt || storedToken.expiresAt < new Date()) {
      return res.status(401).json({ error: "Refresh token is invalid or revoked." });
    }

    // Revoke old refresh token (rotation)
    await prisma.refreshToken.update({
      where: { id: storedToken.id },
      data: { revokedAt: new Date() },
    });

    // Generate new tokens
    const newAccessToken = generateAccessToken(storedToken.userId, storedToken.user.email);
    const newRefreshToken = generateRefreshToken(storedToken.userId, storedToken.user.email);

    // Store new refresh token
    await prisma.refreshToken.create({
      data: {
        token: newRefreshToken,
        userId: storedToken.userId,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    res.json({
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    });
  } catch (error) {
    console.error("Token refresh error:", error);
    res.status(500).json({ error: "Token refresh failed." });
  }
});

// Logout endpoint (revoke refresh token)
app.post("/api/auth/logout", async (req, res) => {
  try {
    const { refreshToken } = req.body as { refreshToken: string };
    
    if (refreshToken) {
      await prisma.refreshToken.updateMany({
        where: { token: refreshToken },
        data: { revokedAt: new Date() },
      });
    }

    res.json({ success: true });
  } catch (error) {
    console.error("Logout error:", error);
    res.status(500).json({ error: "Logout failed." });
  }
});

// Password reset request
app.post("/api/auth/forgot-password", authLimiter, async (req, res) => {
  try {
    const parsed = passwordResetRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ 
        error: "Validation failed", 
        details: parsed.error.flatten().fieldErrors 
      });
    }

    const { email } = parsed.data;
    
    // Always return success to prevent user enumeration
    const user = await prisma.user.findUnique({ where: { email } });
    
    if (user) {
      // Invalidate any existing reset tokens
      await prisma.passwordResetToken.updateMany({
        where: { userId: user.id, usedAt: null },
        data: { usedAt: new Date() },
      });

      // Generate new reset token
      const resetToken = crypto.randomBytes(32).toString("hex");
      const hashedToken = crypto.createHash("sha256").update(resetToken).digest("hex");
      
      await prisma.passwordResetToken.create({
        data: {
          token: hashedToken,
          userId: user.id,
          email: user.email,
          expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
        },
      });

      // TODO: Send email with reset link containing resetToken
      // For now, log it (in production, use an email service)
      console.log(`Password reset link: ${WEB_BASE_URL}/reset-password?token=${resetToken}`);
    }

    // Always return success to prevent enumeration
    res.json({ 
      message: "If an account exists with that email, a password reset link has been sent." 
    });
  } catch (error) {
    console.error("Password reset request error:", error);
    res.status(500).json({ error: "Password reset request failed." });
  }
});

// Password reset
app.post("/api/auth/reset-password", authLimiter, async (req, res) => {
  try {
    const parsed = passwordResetSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ 
        error: "Validation failed", 
        details: parsed.error.flatten().fieldErrors 
      });
    }

    const { token, newPassword } = parsed.data;
    
    // Hash the token to compare with stored hash
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");
    
    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { token: hashedToken },
      include: { user: true },
    });

    if (!resetToken || resetToken.usedAt || resetToken.expiresAt < new Date()) {
      return res.status(400).json({ error: "Invalid or expired reset token." });
    }

    // Update password
    const passwordHash = await hashPassword(newPassword);
    await prisma.user.update({
      where: { id: resetToken.userId },
      data: { passwordHash },
    });

    // Mark token as used
    await prisma.passwordResetToken.update({
      where: { id: resetToken.id },
      data: { usedAt: new Date() },
    });

    // Revoke all refresh tokens for security
    await prisma.refreshToken.updateMany({
      where: { userId: resetToken.userId },
      data: { revokedAt: new Date() },
    });

    res.json({ message: "Password has been reset successfully. Please log in with your new password." });
  } catch (error) {
    console.error("Password reset error:", error);
    res.status(500).json({ error: "Password reset failed." });
  }
});

// Get current user (protected route)
app.get("/api/auth/me", authenticateJWT, async (req: AuthenticatedRequest, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.userId },
      select: {
        id: true,
        firstName: true,
        email: true,
        coupleId: true,
        timezone: true,
        faithMode: true,
        loveLang1: true,
        loveLang2: true,
        intimacyLevel: true,
        anchorTimes: true,
        emailVerified: true,
        createdAt: true,
      },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }

    // Format for frontend
    res.json({ 
      user: {
        id: user.id,
        name: user.firstName,
        email: user.email,
        coupleId: user.coupleId,
        timezone: user.timezone,
        faithMode: user.faithMode,
        loveLanguages: [user.loveLang1.toLowerCase(), user.loveLang2.toLowerCase()],
        boundaries: user.intimacyLevel.toLowerCase(),
        anchorTimes: (() => { try { return JSON.parse(user.anchorTimes || '[]'); } catch { return []; } })(),
        emailVerified: user.emailVerified,
        createdAt: user.createdAt,
      }
    });
  } catch (error) {
    console.error("Get user error:", error);
    res.status(500).json({ error: "Failed to get user." });
  }
});

// === Google OAuth endpoint (for frontend integration) ===
const googleOAuthSchema = z.object({
  googleId: z.string().min(1),
  email: z.string().email(),
  firstName: z.string().min(1),
});

app.post("/api/auth/google", authLimiter, async (req, res) => {
  try {
    const parsed = googleOAuthSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ 
        error: "Validation failed", 
        details: parsed.error.flatten().fieldErrors 
      });
    }

    const { googleId, email, firstName } = parsed.data;

    // Check if user exists with this Google ID
    let user = await prisma.user.findUnique({ where: { googleId } });

    if (!user) {
      // Check if email already exists (link accounts)
      user = await prisma.user.findUnique({ where: { email } });
      
      if (user) {
        // Link Google ID to existing account
        user = await prisma.user.update({
          where: { id: user.id },
          data: { googleId, emailVerified: true },
        });
      } else {
        // Create new user
        user = await prisma.user.create({
          data: {
            firstName,
            email,
            googleId,
            emailVerified: true,
          },
        });
      }
    }

    // Generate tokens
    const accessToken = generateAccessToken(user.id, user.email);
    const refreshToken = generateRefreshToken(user.id, user.email);

    // Store refresh token
    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    res.json({
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        firstName: user.firstName,
        email: user.email,
        coupleId: user.coupleId,
      },
    });
  } catch (error) {
    console.error("Google OAuth error:", error);
    res.status(500).json({ error: "Google authentication failed." });
  }
});

// === Couple Pairing (protected) ===
app.post("/api/couple/create", authenticateJWT, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.userId;
    
    // Check if user already in a couple
    const existingUser = await prisma.user.findUnique({ where: { id: userId } });
    if (existingUser?.coupleId) {
      return res.status(409).json({ error: "You are already part of a couple." });
    }

    const inviteCode = crypto.randomBytes(3).toString("hex").toUpperCase();
    const couple = await prisma.couple.create({ data: { inviteCode } });
    await prisma.user.update({ where: { id: userId }, data: { coupleId: couple.id } });

    res.json({ coupleId: couple.id, inviteCode });
  } catch (error) {
    console.error("Create couple error:", error);
    res.status(500).json({ error: "Failed to create couple." });
  }
});

app.post("/api/couple/join", authenticateJWT, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.userId;
    const { inviteCode } = req.body as { inviteCode: string };
    
    if (!inviteCode) {
      return res.status(400).json({ error: "Invite code required." });
    }

    // Check if user already in a couple
    const existingUser = await prisma.user.findUnique({ where: { id: userId } });
    if (existingUser?.coupleId) {
      return res.status(409).json({ error: "You are already part of a couple." });
    }

    const couple = await prisma.couple.findUnique({ where: { inviteCode: inviteCode.toUpperCase() } });
    if (!couple) {
      return res.status(404).json({ error: "Invalid invite code." });
    }

    const memberCount = await prisma.user.count({ where: { coupleId: couple.id } });
    if (memberCount >= 2) {
      return res.status(409).json({ error: "Couple already has 2 members." });
    }

    await prisma.user.update({ where: { id: userId }, data: { coupleId: couple.id } });
    res.json({ coupleId: couple.id });
  } catch (error) {
    console.error("Join couple error:", error);
    res.status(500).json({ error: "Failed to join couple." });
  }
});

// === Today Anchor (protected) ===
app.get("/api/anchors/today", authenticateJWT, async (req: AuthenticatedRequest, res) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user!.userId } });
    const coupleId = user?.coupleId;
    
    if (!coupleId) {
      return res.status(400).json({ error: "You must be in a couple to access anchors." });
    }

    // Use user's timezone for date calculation
    const userTimezone = user.timezone || "America/New_York";
    const today = new Date().toLocaleDateString("en-CA", { timeZone: userTimezone }); // YYYY-MM-DD

    let anchor = await prisma.dailyAnchor.findFirst({ 
      where: { coupleId, date: today }, 
      include: { scripture: true, actionIdea: true } 
    });

    if (!anchor) {
      const users = await prisma.user.findMany({ where: { coupleId } });
      const faithOn = users.some(u => u.faithMode);

      const scripture = faithOn ? await prisma.scripture.findFirst({ where: { isFeatured: true } }) : null;
      const actionIdea = await prisma.actionIdea.findFirst({ where: { mode: faithOn ? "FAITH" : "EMOTIONAL" } }) 
                      ?? await prisma.actionIdea.findFirst();

      if (!actionIdea) {
        return res.status(500).json({ error: "No action ideas seeded." });
      }

      anchor = await prisma.dailyAnchor.create({
        data: {
          coupleId,
          date: today,
          mode: faithOn ? "FAITH" : "EMOTIONAL",
          scriptureId: scripture?.id ?? null,
          principleText: faithOn ? null : "Micro-positives build long-term closeness.",
          actionIdeaId: actionIdea.id,
        },
        include: { scripture: true, actionIdea: true },
      });
    }

    res.json({ anchor });
  } catch (error) {
    console.error("Get anchor error:", error);
    res.status(500).json({ error: "Failed to get today's anchor." });
  }
});

// === Fixed Streak Logic ===
function calculateNewStreak(
  lastConnectionAt: Date | null, 
  currentStreak: number, 
  timezone: string
): number {
  if (!lastConnectionAt) {
    // First completion ever
    return 1;
  }

  // Get dates in user's timezone
  const now = new Date();
  const todayStr = now.toLocaleDateString("en-CA", { timeZone: timezone }); // YYYY-MM-DD
  const lastStr = lastConnectionAt.toLocaleDateString("en-CA", { timeZone: timezone });

  if (todayStr === lastStr) {
    // Already completed today, streak unchanged
    return currentStreak;
  }

  // Calculate yesterday's date in user's timezone
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toLocaleDateString("en-CA", { timeZone: timezone });

  if (lastStr === yesterdayStr) {
    // Last completion was yesterday, increment streak
    return currentStreak + 1;
  }

  // Streak broken (more than 1 day gap), reset to 1
  return 1;
}

app.post("/api/anchors/complete", authenticateJWT, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.userId;
    const { anchorId } = req.body as { anchorId: string };
    
    if (!anchorId) {
      return res.status(400).json({ error: "Anchor ID required." });
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    const coupleId = user?.coupleId;
    
    if (!coupleId) {
      return res.status(400).json({ error: "You must be in a couple." });
    }

    // Verify anchor belongs to couple
    const anchor = await prisma.dailyAnchor.findUnique({
      where: { id: anchorId },
      include: { actionIdea: true },
    });

    if (!anchor || anchor.coupleId !== coupleId) {
      return res.status(404).json({ error: "Anchor not found." });
    }

    if (anchor.status === "DONE") {
      return res.status(409).json({ error: "Anchor already completed." });
    }

    // Update anchor status
    await prisma.dailyAnchor.update({
      where: { id: anchorId },
      data: { status: "DONE", completedAt: new Date() },
    });

    // Log the action
    await prisma.actionLog.create({
      data: { coupleId, userId, actionIdeaId: anchor.actionIdeaId, completionType: "DO_NOW" },
    });

    // Update streak with fixed logic
    const couple = await prisma.couple.findUnique({ where: { id: coupleId } });
    const userTimezone = user.timezone || "America/New_York";
    const newStreak = calculateNewStreak(
      couple?.lastConnectionAt || null,
      couple?.streak || 0,
      userTimezone
    );

    await prisma.couple.update({
      where: { id: coupleId },
      data: { streak: newStreak, lastConnectionAt: new Date() },
    });

    // Award points
    await prisma.rewardLedger.create({
      data: { coupleId, userId, type: "EARN", points: anchor.actionIdea.pointsAwarded, reason: "ANCHOR_DONE" },
    });

    res.json({ 
      ok: true, 
      pointsAwarded: anchor.actionIdea.pointsAwarded, 
      streak: newStreak,
      streakContinued: newStreak > 1,
    });
  } catch (error) {
    console.error("Complete anchor error:", error);
    res.status(500).json({ error: "Failed to complete anchor." });
  }
});

// === Scripture Vault ===
app.get("/api/scripture/list", async (req, res) => {
  try {
    const category = (req.query.category ? String(req.query.category) : undefined);
    const where = category ? { category } : {};
    const list = await prisma.scripture.findMany({ where, take: 50, orderBy: { reference: "asc" } });
    res.json({ list: list.map(s => ({...s, tags: JSON.parse(s.tags)})) });
  } catch (error) {
    console.error("Scripture list error:", error);
    res.status(500).json({ error: "Failed to fetch scriptures." });
  }
});

app.get("/api/scripture/search", async (req, res) => {
  try {
    const q = String(req.query.q || "").toLowerCase().trim();
    if (!q) return res.json({ list: [] });
    
    // Sanitize search query
    const sanitizedQ = q.replace(/[^\w\s-]/g, "");
    
    const list = await prisma.scripture.findMany({ take: 50 });
    const filtered = list.filter(s => 
      s.reference.toLowerCase().includes(sanitizedQ) || 
      s.marriageMeaning.toLowerCase().includes(sanitizedQ) || 
      s.tags.toLowerCase().includes(sanitizedQ)
    );
    res.json({ list: filtered.map(s => ({...s, tags: JSON.parse(s.tags)})) });
  } catch (error) {
    console.error("Scripture search error:", error);
    res.status(500).json({ error: "Failed to search scriptures." });
  }
});

app.post("/api/scripture/save", authenticateJWT, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.userId;
    const { scriptureId, note } = req.body as { scriptureId: string; note?: string };
    
    if (!scriptureId) {
      return res.status(400).json({ error: "Scripture ID required." });
    }

    // Sanitize note
    const sanitizedNote = note ? note.slice(0, 1000).trim() : null;
    
    const saved = await prisma.savedScripture.create({ 
      data: { userId, scriptureId, note: sanitizedNote } 
    });
    res.json({ saved });
  } catch (error) {
    console.error("Save scripture error:", error);
    res.status(500).json({ error: "Failed to save scripture." });
  }
});

// === Stickers ===
app.get("/api/stickers/presets", async (_req, res) => {
  try {
    const list = await prisma.stickerDefinition.findMany({ 
      where: { isPreset: true }, 
      include: { linkedActions: true } 
    });
    res.json({ list });
  } catch (error) {
    console.error("Stickers error:", error);
    res.status(500).json({ error: "Failed to fetch stickers." });
  }
});

app.post("/api/stickers/send", authenticateJWT, async (req: AuthenticatedRequest, res) => {
  try {
    const fromUserId = req.user!.userId;
    const { toUserId, stickerId, note } = req.body as { toUserId: string; stickerId: string; note?: string };
    
    if (!toUserId || !stickerId) {
      return res.status(400).json({ error: "Missing required fields." });
    }

    const user = await prisma.user.findUnique({ where: { id: fromUserId } });
    const coupleId = user?.coupleId;
    
    if (!coupleId) {
      return res.status(400).json({ error: "You must be in a couple." });
    }

    // Verify recipient is in same couple
    const toUser = await prisma.user.findUnique({ where: { id: toUserId } });
    if (!toUser || toUser.coupleId !== coupleId) {
      return res.status(400).json({ error: "Invalid recipient." });
    }

    const sanitizedNote = note ? note.slice(0, 500).trim() : null;
    
    const msg = await prisma.stickerMessage.create({ 
      data: { coupleId, fromUserId, toUserId, stickerId, note: sanitizedNote } 
    });
    res.json({ msg });
  } catch (error) {
    console.error("Send sticker error:", error);
    res.status(500).json({ error: "Failed to send sticker." });
  }
});

// === Billing ===
app.post("/api/billing/create-checkout-session", authenticateJWT, async (req: AuthenticatedRequest, res) => {
  try {
    if (!stripe || !priceMonthly) {
      return res.status(500).json({ error: "Stripe not configured." });
    }

    const userId = req.user!.userId;
    const user = await prisma.user.findUnique({ where: { id: userId } });

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      client_reference_id: userId,
      customer_email: user?.email,
      line_items: [{ price: priceMonthly, quantity: 1 }],
      success_url: `${WEB_BASE_URL}/settings?billing=success`,
      cancel_url: `${WEB_BASE_URL}/settings?billing=cancel`,
      automatic_tax: { enabled: false },
      payment_method_collection: "if_required",
    });

    res.json({ url: session.url });
  } catch (error) {
    console.error("Checkout session error:", error);
    res.status(500).json({ error: "Failed to create checkout session." });
  }
});

app.post("/api/billing/create-donation-session", async (req, res) => {
  try {
    if (!stripe) {
      return res.status(500).json({ error: "Stripe not configured." });
    }

    const { email, amountCents } = req.body as { email?: string; amountCents: number };
    const amount = Math.max(100, Math.min(1000000, Number(amountCents || 0))); // $1 - $10,000

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer_email: email,
      line_items: [{
        price_data: {
          currency: "usd",
          product_data: { name: "Support the Mission — One-time Gift" },
          unit_amount: amount,
        },
        quantity: 1,
      }],
      metadata: { kind: "donation" },
      success_url: `${WEB_BASE_URL}/support?giving=success`,
      cancel_url: `${WEB_BASE_URL}/support?giving=cancel`,
    });

    res.json({ url: session.url });
  } catch (error) {
    console.error("Donation session error:", error);
    res.status(500).json({ error: "Failed to create donation session." });
  }
});

// === User Preferences ===
const preferencesSchema = z.object({
  faithMode: z.boolean().optional(),
  loveLanguages: z.array(z.string()).max(2).optional(),
  anchorTimes: z.array(z.string()).max(4).optional(),
  timeAvailability: z.enum(['2min', '7min', '20min']).optional(),
  boundaries: z.enum(['pg', 'romantic', 'married']).optional(),
  notificationsEnabled: z.boolean().optional(),
});

app.post("/api/user/preferences", authenticateJWT, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.userId;
    const result = preferencesSchema.safeParse(req.body);
    
    if (!result.success) {
      return res.status(400).json({ error: "Invalid preferences data" });
    }

    const data = result.data;
    
    // Map the frontend data to database fields
    const updateData: any = {};
    
    if (data.faithMode !== undefined) {
      updateData.faithMode = data.faithMode;
    }
    
    if (data.loveLanguages && data.loveLanguages.length > 0) {
      updateData.loveLang1 = data.loveLanguages[0]?.toUpperCase() || 'WORDS';
      updateData.loveLang2 = data.loveLanguages[1]?.toUpperCase() || 'QUALITY_TIME';
    }
    
    if (data.anchorTimes) {
      updateData.anchorTimes = JSON.stringify(data.anchorTimes);
    }
    
    if (data.boundaries) {
      updateData.intimacyLevel = data.boundaries.toUpperCase();
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: updateData,
    });

    res.json({ 
      ok: true, 
      user: {
        id: user.id,
        faithMode: user.faithMode,
        loveLanguages: [user.loveLang1.toLowerCase(), user.loveLang2.toLowerCase()],
        anchorTimes: JSON.parse(user.anchorTimes || '[]'),
        boundaries: user.intimacyLevel.toLowerCase(),
      }
    });
  } catch (error) {
    console.error("Preferences update error:", error);
    res.status(500).json({ error: "Failed to update preferences." });
  }
});

app.get("/api/user/preferences", authenticateJWT, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.userId;
    
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        faithMode: true,
        loveLang1: true,
        loveLang2: true,
        anchorTimes: true,
        intimacyLevel: true,
        timezone: true,
      },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }

    res.json({
      faithMode: user.faithMode,
      loveLanguages: [user.loveLang1.toLowerCase(), user.loveLang2.toLowerCase()],
      anchorTimes: JSON.parse(user.anchorTimes || '[]'),
      boundaries: user.intimacyLevel.toLowerCase(),
      timezone: user.timezone,
    });
  } catch (error) {
    console.error("Preferences fetch error:", error);
    res.status(500).json({ error: "Failed to fetch preferences." });
  }
});

// === Action Ideas API ===
app.get("/api/actions/list", authenticateJWT, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.userId;
    const user = await prisma.user.findUnique({ where: { id: userId } });
    
    // Get query params for filtering
    const loveLanguage = req.query.loveLanguage as string | undefined;
    const timeRequired = req.query.timeRequired as string | undefined;
    const mode = req.query.mode as string | undefined;
    
    // Build where clause
    const where: any = {};
    if (loveLanguage && loveLanguage !== 'all') {
      where.loveLanguage = loveLanguage.toUpperCase();
    }
    if (timeRequired && timeRequired !== 'all') {
      // Map time filter to minutes
      const minutesMap: Record<string, number> = { '2min': 2, '7min': 7, '20min': 20 };
      if (minutesMap[timeRequired]) {
        where.timeNeededMinutes = { lte: minutesMap[timeRequired] };
      }
    }
    if (mode && mode !== 'all') {
      where.mode = mode.toUpperCase();
    }
    
    // If faith mode is off, exclude faith actions
    if (user && !user.faithMode) {
      where.mode = { not: 'FAITH' };
    }
    
    const actions = await prisma.actionIdea.findMany({
      where,
      take: 50,
      orderBy: { title: 'asc' },
    });
    
    // Transform to frontend format
    const list = actions.map(a => ({
      id: a.id,
      title: a.title,
      description: a.whyItHelps, // Use whyItHelps as description
      timeRequired: `${a.timeNeededMinutes}min`,
      loveLanguage: a.loveLanguage.toLowerCase(),
      mode: a.mode.toLowerCase(),
      pointsAwarded: a.pointsAwarded,
    }));
    
    // Prioritize user's love languages
    if (user) {
      const userLangs = [user.loveLang1?.toLowerCase(), user.loveLang2?.toLowerCase()].filter(Boolean);
      list.sort((a, b) => {
        const aMatch = userLangs.includes(a.loveLanguage) ? 0 : 1;
        const bMatch = userLangs.includes(b.loveLanguage) ? 0 : 1;
        return aMatch - bMatch;
      });
    }
    
    res.json({ list });
  } catch (error) {
    console.error("Action ideas list error:", error);
    res.status(500).json({ error: "Failed to fetch action ideas." });
  }
});

// Mark action as completed (without anchor)
app.post("/api/actions/complete", authenticateJWT, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.userId;
    const { actionId } = req.body as { actionId: string };
    
    if (!actionId) {
      return res.status(400).json({ error: "Action ID required." });
    }
    
    const user = await prisma.user.findUnique({ where: { id: userId } });
    const coupleId = user?.coupleId;
    
    if (!coupleId) {
      // Still allow tracking without couple
      return res.json({ ok: true, pointsAwarded: 0, message: "Action tracked locally." });
    }
    
    const action = await prisma.actionIdea.findUnique({ where: { id: actionId } });
    if (!action) {
      return res.status(404).json({ error: "Action not found." });
    }
    
    // Log the action
    await prisma.actionLog.create({
      data: { coupleId, userId, actionIdeaId: actionId, completionType: "DO_NOW" },
    });
    
    // Award points
    await prisma.rewardLedger.create({
      data: { coupleId, userId, type: "EARN", points: action.pointsAwarded, reason: "ACTION_DONE" },
    });
    
    res.json({ ok: true, pointsAwarded: action.pointsAwarded });
  } catch (error) {
    console.error("Complete action error:", error);
    res.status(500).json({ error: "Failed to complete action." });
  }
});

// === Premium Endpoints (require subscription) ===

// Example: Premium analytics endpoint
app.get("/api/premium/analytics", authenticateJWT, requireSubscription, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.userId;
    const user = await prisma.user.findUnique({ where: { id: userId } });
    const coupleId = user?.coupleId;

    if (!coupleId) {
      return res.json({ 
        streakHistory: [],
        completionRate: 0,
        favoriteActions: [],
        message: "Join a couple to see analytics."
      });
    }

    // Get action history
    const actionLogs = await prisma.actionLog.findMany({
      where: { coupleId },
      orderBy: { completedAt: "desc" },
      take: 30,
      include: { actionIdea: true },
    });

    // Get couple stats
    const couple = await prisma.couple.findUnique({ where: { id: coupleId } });

    // Calculate completion rate (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentAnchors = await prisma.dailyAnchor.findMany({
      where: { coupleId, createdAt: { gte: thirtyDaysAgo } },
    });
    const completedAnchors = recentAnchors.filter(a => a.status === "DONE").length;
    const completionRate = recentAnchors.length > 0 
      ? Math.round((completedAnchors / recentAnchors.length) * 100) 
      : 0;

    // Get favorite actions
    const actionCounts = actionLogs.reduce((acc, log) => {
      if (log.actionIdea) {
        acc[log.actionIdea.title] = (acc[log.actionIdea.title] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);

    const favoriteActions = Object.entries(actionCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([title, count]) => ({ title, count }));

    res.json({
      currentStreak: couple?.streak || 0,
      longestStreak: couple?.streak || 0, // TODO: track longest separately
      completionRate,
      totalActionsCompleted: actionLogs.length,
      favoriteActions,
      subscriptionPlan: req.subscription?.plan || "MEMBER",
    });
  } catch (error) {
    console.error("Premium analytics error:", error);
    res.status(500).json({ error: "Failed to fetch analytics." });
  }
});

// Get subscription status endpoint
app.get("/api/subscription/status", authenticateJWT, checkSubscription, async (req: AuthenticatedRequest, res) => {
  res.json({
    isSubscribed: req.subscription?.isActive || false,
    plan: req.subscription?.plan || "FREE",
    status: req.subscription?.status || "NONE",
    features: req.subscription?.isActive 
      ? ["unlimited_scripture_saves", "premium_actions", "advanced_analytics", "priority_support", "ad_free"]
      : ["basic_scripture", "daily_anchors", "connect_ideas"],
  });
});

// === Error Handler ===
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ error: "Internal server error." });
});

// === Start Server ===
app.listen(PORT, () => {
  console.log(`@one/server listening on http://localhost:${PORT}`);
  console.log(`CORS enabled for: ${CORS_ORIGIN}`);
  
  // Security warnings
  if (JWT_SECRET === "CHANGE_THIS_SECRET_IN_PRODUCTION") {
    console.warn("⚠️  WARNING: Using default JWT_SECRET. Set a secure secret in production!");
  }
  if (JWT_REFRESH_SECRET === "CHANGE_THIS_REFRESH_SECRET_IN_PRODUCTION") {
    console.warn("⚠️  WARNING: Using default JWT_REFRESH_SECRET. Set a secure secret in production!");
  }
});