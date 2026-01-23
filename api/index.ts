// Vercel Serverless Function - Express API Handler
import "dotenv/config";
import express from "express";
import session from "express-session";
import pgSession from "connect-pg-simple";
import pg from "pg";
import { registerRoutes } from "../server/routes";

const app = express();

// Trust proxy for Vercel
app.set('trust proxy', 1);

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
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    sameSite: 'lax',
  },
};

// Use PostgreSQL session store
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

// Register all routes
registerRoutes(app);

// Export for Vercel
export default app;
