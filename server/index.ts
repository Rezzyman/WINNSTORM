import "dotenv/config";
import express, { type Request, Response, NextFunction } from "express";
import session from "express-session";
import pgSession from "connect-pg-simple";
import pg from "pg";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";

const app = express();

// Trust proxy for production (Railway, etc.)
if (process.env.NODE_ENV === 'production') {
  app.set('trust proxy', 1);
}

// Site password protection (HTTP Basic Auth) - ONLY on home page
const SITE_PASSWORD = process.env.SITE_PASSWORD;
if (SITE_PASSWORD) {
  app.use((req, res, next) => {
    // Only protect the home page (/) - allow all other routes
    // This ensures logged-in users can navigate freely without auth popups
    if (req.path !== '/') {
      return next();
    }
    
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Basic ')) {
      res.setHeader('WWW-Authenticate', 'Basic realm="WinnStorm Access"');
      return res.status(401).send('Authentication required');
    }
    
    const base64Credentials = authHeader.split(' ')[1];
    const credentials = Buffer.from(base64Credentials, 'base64').toString('utf8');
    const [username, password] = credentials.split(':');
    
    // Accept any username with the correct password
    if (password === SITE_PASSWORD) {
      return next();
    }
    
    res.setHeader('WWW-Authenticate', 'Basic realm="WinnStorm Access"');
    return res.status(401).send('Invalid credentials');
  });
  log('Site password protection enabled (home page only)');
}

// Stripe webhook needs raw body for signature verification - must be before express.json()
app.use('/api/stripe/webhook', express.raw({ type: 'application/json' }));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: false, limit: '50mb' }));

// Session middleware for admin and team authentication
const sessionSecret = process.env.SESSION_SECRET;
if (process.env.NODE_ENV === 'production' && !sessionSecret) {
  console.error('ERROR: SESSION_SECRET environment variable is required in production');
  process.exit(1);
}

// Configure session store - use PostgreSQL in production for persistence
const PgStore = pgSession(session);
const sessionConfig: session.SessionOptions = {
  secret: sessionSecret || 'winnstorm-dev-session-' + Date.now(),
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    sameSite: 'lax',
  },
};

// Use PostgreSQL session store in production
if (process.env.NODE_ENV === 'production' && process.env.DATABASE_URL) {
  const pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });
  sessionConfig.store = new PgStore({
    pool,
    tableName: 'user_sessions',
    createTableIfMissing: true,
  });
  log('Using PostgreSQL session store');
}

app.use(session(sessionConfig));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // Serve the app - use PORT env var or default to 5000 for Replit
  const port = parseInt(process.env.PORT || "5000", 10);
  server.listen(port, "0.0.0.0", () => {
    log(`serving on port ${port}`);
  });
})();
