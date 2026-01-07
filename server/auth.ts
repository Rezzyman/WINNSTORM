import { Request, Response, NextFunction } from 'express';
import { initializeApp, cert, getApps, App } from 'firebase-admin/app';
import { getAuth, DecodedIdToken } from 'firebase-admin/auth';
import { storage } from './storage';

let firebaseAdminApp: App | null = null;

function initializeFirebaseAdmin(): App | null {
  if (getApps().length > 0) {
    return getApps()[0];
  }

  const projectId = process.env.VITE_FIREBASE_PROJECT_ID;
  
  if (!projectId) {
    console.warn('Firebase Admin: Missing VITE_FIREBASE_PROJECT_ID - authentication will be disabled');
    return null;
  }

  try {
    const app = initializeApp({
      projectId: projectId,
    });
    console.log('Firebase Admin SDK initialized successfully');
    return app;
  } catch (error) {
    console.error('Failed to initialize Firebase Admin:', error);
    return null;
  }
}

firebaseAdminApp = initializeFirebaseAdmin();

export interface AuthenticatedUser {
  uid: string;
  email: string | undefined;
  name?: string;
  picture?: string;
  dbUserId?: number;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthenticatedUser;
}

export async function verifyFirebaseToken(idToken: string): Promise<DecodedIdToken | null> {
  if (!firebaseAdminApp) {
    console.warn('Firebase Admin not initialized - cannot verify token');
    return null;
  }

  try {
    const decodedToken = await getAuth().verifyIdToken(idToken);
    return decodedToken;
  } catch (error: any) {
    if (error.code === 'auth/id-token-expired') {
      console.warn('Firebase token expired');
    } else if (error.code === 'auth/argument-error') {
      console.warn('Invalid Firebase token format');
    } else {
      console.error('Firebase token verification failed:', error.message);
    }
    return null;
  }
}

export async function getOrCreateDbUser(firebaseUser: DecodedIdToken): Promise<number | null> {
  const email = firebaseUser.email;
  if (!email) {
    console.warn('Firebase user has no email');
    return null;
  }

  let dbUser = await storage.getUserByEmail(email);
  
  if (!dbUser) {
    try {
      dbUser = await storage.createUser({
        email: email,
        firstName: firebaseUser.name?.split(' ')[0] || '',
        lastName: firebaseUser.name?.split(' ').slice(1).join(' ') || '',
        role: 'junior_consultant',
        certificationLevel: 'none',
      });
      console.log(`Created new user in database for ${email}`);
    } catch (error) {
      console.error('Failed to create user in database:', error);
      return null;
    }
  }

  return dbUser.id;
}

export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ message: 'Authentication required. Please sign in.' });
    return;
  }

  const idToken = authHeader.substring(7);

  verifyFirebaseToken(idToken)
    .then(async (decodedToken) => {
      if (!decodedToken) {
        res.status(401).json({ message: 'Invalid or expired authentication token. Please sign in again.' });
        return;
      }

      const dbUserId = await getOrCreateDbUser(decodedToken);

      req.user = {
        uid: decodedToken.uid,
        email: decodedToken.email,
        name: decodedToken.name,
        picture: decodedToken.picture,
        dbUserId: dbUserId || undefined,
      };

      next();
    })
    .catch((error) => {
      console.error('Auth middleware error:', error);
      res.status(500).json({ message: 'Authentication error' });
    });
}

export function optionalAuth(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    next();
    return;
  }

  const idToken = authHeader.substring(7);

  verifyFirebaseToken(idToken)
    .then(async (decodedToken) => {
      if (decodedToken) {
        const dbUserId = await getOrCreateDbUser(decodedToken);
        req.user = {
          uid: decodedToken.uid,
          email: decodedToken.email,
          name: decodedToken.name,
          picture: decodedToken.picture,
          dbUserId: dbUserId || undefined,
        };
      }
      next();
    })
    .catch((error) => {
      console.error('Optional auth middleware error:', error);
      next();
    });
}

export function unauthorizedResponse(res: Response) {
  return res.status(401).json({ message: 'Unauthorized' });
}

// Admin allowlist - emails that can access admin panel
const ADMIN_ALLOWLIST = [
  'admin@winnstorm.com',
  'eric@winnstorm.com',
  'developer@winnstorm.com',
  'anthony@winnstorm.com',
];

export interface AdminAuthenticatedRequest extends AuthenticatedRequest {
  adminUser?: {
    uid: string;
    email: string;
    dbUserId: number;
    isAdmin: boolean;
  };
}

export async function requireAdmin(req: AdminAuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  // First check for session-based admin auth (password login)
  const sessionEmail = (req.session as any)?.adminEmail;
  const sessionToken = (req.session as any)?.adminToken;
  
  if (sessionEmail && sessionToken) {
    // Check if email is in admin allowlist
    if (!ADMIN_ALLOWLIST.includes(sessionEmail.toLowerCase())) {
      res.status(403).json({ message: 'Admin access denied - not authorized.' });
      return;
    }
    
    // Get or create DB user for session-based admin
    let dbUser = await storage.getUserByEmail(sessionEmail);
    if (!dbUser) {
      try {
        dbUser = await storage.createUser({
          email: sessionEmail,
          role: 'admin',
          certificationLevel: 'none',
        });
      } catch (error) {
        console.error('Failed to create admin user:', error);
        res.status(500).json({ message: 'Failed to verify admin user.' });
        return;
      }
    }
    
    if (!dbUser.isAdmin) {
      await storage.updateUser(dbUser.id, { isAdmin: true });
    }
    
    req.adminUser = {
      uid: `session-${sessionEmail}`,
      email: sessionEmail,
      dbUserId: dbUser.id,
      isAdmin: true,
    };
    
    next();
    return;
  }
  
  // Fallback to Firebase token auth
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ message: 'Admin authentication required.' });
    return;
  }

  const idToken = authHeader.substring(7);

  try {
    const decodedToken = await verifyFirebaseToken(idToken);
    if (!decodedToken) {
      res.status(401).json({ message: 'Invalid or expired authentication token.' });
      return;
    }

    const email = decodedToken.email;
    if (!email) {
      res.status(403).json({ message: 'Admin access denied - no email associated with account.' });
      return;
    }

    // Check if email is in admin allowlist
    if (!ADMIN_ALLOWLIST.includes(email.toLowerCase())) {
      res.status(403).json({ message: 'Admin access denied - not authorized.' });
      return;
    }

    const dbUserId = await getOrCreateDbUser(decodedToken);
    if (!dbUserId) {
      res.status(500).json({ message: 'Failed to verify admin user.' });
      return;
    }

    // Verify user has isAdmin flag in database
    const dbUser = await storage.getUser(dbUserId);
    if (!dbUser?.isAdmin) {
      // Auto-set isAdmin for allowlisted users
      await storage.updateUser(dbUserId, { isAdmin: true });
    }

    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email,
      name: decodedToken.name,
      picture: decodedToken.picture,
      dbUserId: dbUserId,
    };

    req.adminUser = {
      uid: decodedToken.uid,
      email: email,
      dbUserId: dbUserId,
      isAdmin: true,
    };

    next();
  } catch (error) {
    console.error('Admin auth middleware error:', error);
    res.status(500).json({ message: 'Admin authentication error' });
  }
}

export function isAdminEmail(email: string): boolean {
  return ADMIN_ALLOWLIST.includes(email.toLowerCase());
}
