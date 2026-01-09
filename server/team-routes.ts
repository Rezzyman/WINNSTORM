import { Router, Response, Request } from 'express';
import { storage } from './storage';
import { InsertKnowledgeDocument } from '@shared/schema';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';

function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
  return `${salt}:${hash}`;
}

function verifyPassword(password: string, storedHash: string): boolean {
  const [salt, hash] = storedHash.split(':');
  const verifyHash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
  return hash === verifyHash;
}

const uploadDir = path.join(process.cwd(), 'uploads', 'knowledge');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const knowledgeStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `team-upload-${uniqueSuffix}${ext}`);
  }
});

const allowedMimeTypes = [
  'text/plain', 'text/markdown', 'text/csv',
  'application/pdf', 'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/json',
  'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
  'audio/mpeg', 'audio/wav', 'audio/mp4', 'audio/m4a', 'audio/ogg', 'audio/webm',
  'video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo',
];

const knowledgeUpload = multer({
  storage: knowledgeStorage,
  limits: { fileSize: 500 * 1024 * 1024 }, // 500MB max
  fileFilter: (req, file, cb) => {
    if (allowedMimeTypes.includes(file.mimetype) || 
        file.mimetype.startsWith('text/') || 
        file.mimetype.startsWith('image/') ||
        file.mimetype.startsWith('audio/') ||
        file.mimetype.startsWith('video/')) {
      cb(null, true);
    } else {
      cb(new Error(`File type ${file.mimetype} not allowed`));
    }
  }
});

interface TeamAuthenticatedRequest extends Request {
  teamMember?: {
    email: string;
    name: string;
  };
}

async function requireTeamAuth(req: TeamAuthenticatedRequest, res: Response, next: Function) {
  const teamEmail = (req.session as any)?.teamEmail;
  const teamToken = (req.session as any)?.teamToken;
  
  if (!teamEmail || !teamToken) {
    return res.status(401).json({ message: 'Team authentication required' });
  }
  
  const teamMember = await storage.getTeamCredentials(teamEmail);
  if (!teamMember || !teamMember.isActive) {
    return res.status(401).json({ message: 'Invalid or inactive team member' });
  }
  
  req.teamMember = { email: teamMember.email, name: teamMember.name };
  next();
}

const router = Router();

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password required' });
    }
    
    const normalizedEmail = email.toLowerCase().trim();
    const teamMember = await storage.getTeamCredentials(normalizedEmail);
    
    if (!teamMember) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    if (!teamMember.isActive) {
      return res.status(401).json({ message: 'Account is deactivated' });
    }
    
    if (teamMember.lockedUntil && new Date(teamMember.lockedUntil) > new Date()) {
      const minutes = Math.ceil((new Date(teamMember.lockedUntil).getTime() - Date.now()) / 60000);
      return res.status(429).json({ message: `Account locked. Try again in ${minutes} minutes` });
    }
    
    const isValid = verifyPassword(password, teamMember.passwordHash);
    
    if (!isValid) {
      const attempts = (teamMember.loginAttempts || 0) + 1;
      const updates: any = { loginAttempts: attempts };
      
      if (attempts >= 5) {
        updates.lockedUntil = new Date(Date.now() + 15 * 60 * 1000);
      }
      
      await storage.updateTeamCredentials(normalizedEmail, updates);
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    await storage.updateTeamCredentials(normalizedEmail, {
      lastLogin: new Date(),
      loginAttempts: 0,
      lockedUntil: null
    });
    
    const sessionToken = crypto.randomBytes(32).toString('hex');
    
    if (req.session) {
      (req.session as any).teamToken = sessionToken;
      (req.session as any).teamEmail = normalizedEmail;
    }
    
    res.json({
      success: true,
      email: normalizedEmail,
      name: teamMember.name,
      message: 'Login successful'
    });
  } catch (error) {
    console.error('Team login error:', error);
    res.status(500).json({ message: 'Login failed' });
  }
});

router.post('/logout', async (req, res) => {
  if (req.session) {
    (req.session as any).teamToken = null;
    (req.session as any).teamEmail = null;
  }
  res.json({ success: true });
});

router.get('/session', requireTeamAuth, async (req: TeamAuthenticatedRequest, res) => {
  res.json({
    authenticated: true,
    email: req.teamMember?.email,
    name: req.teamMember?.name
  });
});

router.post('/upload', requireTeamAuth, knowledgeUpload.single('file'), async (req: TeamAuthenticatedRequest, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }
    
    const { title, description, category, documentType, tags, sourceUrl } = req.body;
    
    if (!title || !category || !documentType) {
      return res.status(400).json({ message: 'Title, category, and document type are required' });
    }
    
    const documentData: InsertKnowledgeDocument = {
      title,
      description: description || null,
      categoryId: parseInt(category) || null,
      documentType,
      fileName: req.file.filename,
      originalFileName: req.file.originalname,
      filePath: req.file.path,
      fileSize: req.file.size,
      mimeType: req.file.mimetype,
      tags: tags ? JSON.parse(tags) : null,
      sourceUrl: sourceUrl || null,
      uploadedBy: req.teamMember?.email || 'team-member',
      isActive: true,
    };
    
    const document = await storage.createKnowledgeDocument(documentData);
    
    await storage.createKnowledgeAuditLog({
      documentId: document.id,
      action: 'uploaded',
      performedBy: req.teamMember?.email || 'team-member',
      details: { source: 'team_portal', originalFileName: req.file.originalname }
    });
    
    res.json({
      success: true,
      document,
      message: 'Document uploaded successfully. Pending admin approval.'
    });
  } catch (error) {
    console.error('Team upload error:', error);
    res.status(500).json({ message: 'Upload failed' });
  }
});

router.get('/documents', requireTeamAuth, async (req: TeamAuthenticatedRequest, res) => {
  try {
    const allDocs = await storage.getKnowledgeDocuments(100, 0);
    const myDocs = allDocs.filter(doc => doc.uploadedBy === req.teamMember?.email);
    
    res.json(myDocs);
  } catch (error) {
    console.error('Error fetching team documents:', error);
    res.status(500).json({ message: 'Failed to fetch documents' });
  }
});

router.get('/categories', requireTeamAuth, async (req: TeamAuthenticatedRequest, res) => {
  try {
    const categories = await storage.getKnowledgeCategories();
    res.json(categories);
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ message: 'Failed to fetch categories' });
  }
});

export default router;
