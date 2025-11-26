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
