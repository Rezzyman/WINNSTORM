// Vercel Serverless Function - Full Express App
import "dotenv/config";
import express from "express";
import session from "express-session";
import pgSession from "connect-pg-simple";
import pg from "pg";
import rateLimit from "express-rate-limit";

const app = express();

// Trust proxy for Vercel
app.set('trust proxy', 1);

// Rate limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { message: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/', apiLimiter);

// Stripe webhook needs raw body - must be before express.json()
app.use('/api/stripe/webhook', express.raw({ type: 'application/json' }));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: false, limit: '50mb' }));

// Session configuration
const sessionSecret = process.env.SESSION_SECRET || 'dev-secret-change-in-production';
const PgSession = pgSession(session);

const sessionConfig: session.SessionOptions = {
  secret: sessionSecret,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: true,
    httpOnly: true,
    maxAge: 7 * 24 * 60 * 60 * 1000,
    sameSite: 'lax',
  },
};

if (process.env.DATABASE_URL) {
  const pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });
  sessionConfig.store = new PgSession({
    pool,
    tableName: 'user_sessions',
    createTableIfMissing: true,
  });
}

app.use(session(sessionConfig));

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString(), env: !!process.env.DATABASE_URL });
});

// Dynamic import and route registration
let routesRegistered = false;

const initRoutes = async () => {
  if (routesRegistered) return;

  try {
    // Import routes module
    const { registerRoutes } = await import("../server/routes.js");
    await registerRoutes(app);
    routesRegistered = true;
    console.log("Routes registered successfully");
  } catch (error) {
    console.error("Failed to register routes:", error);
  }
};

// Initialize routes on first request
app.use(async (req, res, next) => {
  await initRoutes();
  next();
});

export default app;
