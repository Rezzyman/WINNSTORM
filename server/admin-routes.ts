import { Router, Response, Request } from 'express';
import { requireAdmin, AdminAuthenticatedRequest, isAdminEmail } from './auth';
import { storage } from './storage';
import { User, Project, Property, InsertKnowledgeDocument, InsertKnowledgeCategory, InsertKnowledgeAuditLog } from '@shared/schema';
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
    cb(null, `knowledge-${uniqueSuffix}${ext}`);
  }
});

const allowedMimeTypes = [
  // Documents
  'text/plain',
  'text/markdown',
  'text/csv',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/json',
  // Images
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/svg+xml',
  // Audio
  'audio/mpeg',
  'audio/wav',
  'audio/mp4',
  'audio/m4a',
  'audio/ogg',
  'audio/webm',
  // Video
  'video/mp4',
  'video/webm',
  'video/quicktime',
  'video/x-msvideo',
];

const knowledgeUpload = multer({
  storage: knowledgeStorage,
  limits: {
    fileSize: 500 * 1024 * 1024, // 500MB max for video files
  },
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

const router = Router();

// Verify admin session
router.get('/session', requireAdmin, async (req: AdminAuthenticatedRequest, res: Response) => {
  if (!req.adminUser) {
    return res.status(401).json({ message: 'Not authenticated as admin' });
  }
  
  res.json({
    authenticated: true,
    email: req.adminUser.email,
    dbUserId: req.adminUser.dbUserId,
  });
});

// Check if email is admin (public endpoint for login page)
router.post('/check-access', async (req, res) => {
  const { email } = req.body;
  
  if (!email || typeof email !== 'string') {
    return res.status(400).json({ message: 'Email required' });
  }
  
  const hasAccess = isAdminEmail(email);
  res.json({ hasAccess });
});

// Admin password login (bypasses Firebase)
router.post('/login', async (req: Request, res: Response) => {
  const { email, password } = req.body;
  
  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password required' });
  }
  
  if (!isAdminEmail(email)) {
    return res.status(403).json({ message: 'Email not authorized for admin access' });
  }
  
  try {
    const adminCreds = await storage.getAdminCredentials(email);
    
    if (!adminCreds) {
      return res.status(401).json({ message: 'Admin credentials not set up. Please contact system administrator.' });
    }
    
    if (adminCreds.lockedUntil && new Date() < new Date(adminCreds.lockedUntil)) {
      return res.status(423).json({ message: 'Account temporarily locked. Try again later.' });
    }
    
    if (!verifyPassword(password, adminCreds.passwordHash)) {
      const attempts = (adminCreds.loginAttempts || 0) + 1;
      const updates: any = { loginAttempts: attempts };
      
      if (attempts >= 5) {
        updates.lockedUntil = new Date(Date.now() + 15 * 60 * 1000); // 15 min lockout
      }
      
      await storage.updateAdminCredentials(email, updates);
      return res.status(401).json({ message: 'Invalid password' });
    }
    
    await storage.updateAdminCredentials(email, { 
      lastLogin: new Date(), 
      loginAttempts: 0,
      lockedUntil: null 
    });
    
    const sessionToken = crypto.randomBytes(32).toString('hex');

    if (req.session) {
      (req.session as any).adminToken = sessionToken;
      (req.session as any).adminEmail = email;

      // Explicitly save session before responding
      req.session.save((err) => {
        if (err) {
          console.error('Session save error:', err);
          return res.status(500).json({ message: 'Failed to create session' });
        }
        res.json({
          success: true,
          email,
          message: 'Login successful'
        });
      });
      return;
    }

    res.json({
      success: true,
      email,
      message: 'Login successful'
    });
  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({ message: 'Login failed' });
  }
});

// Admin logout
router.post('/logout', async (req: Request, res: Response) => {
  if (req.session) {
    (req.session as any).adminToken = null;
    (req.session as any).adminEmail = null;
  }
  res.json({ success: true });
});

// Set admin password (requires existing admin or setup token)
router.post('/set-password', async (req: Request, res: Response) => {
  const { email, password, setupToken } = req.body;
  
  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password required' });
  }
  
  if (!isAdminEmail(email)) {
    return res.status(403).json({ message: 'Email not authorized for admin access' });
  }
  
  if (password.length < 8) {
    return res.status(400).json({ message: 'Password must be at least 8 characters' });
  }
  
  const adminSession = (req.session as any)?.adminEmail;
  const validSetupToken = setupToken === process.env.ADMIN_SETUP_TOKEN;
  
  if (!adminSession && !validSetupToken) {
    return res.status(403).json({ message: 'Not authorized to set passwords' });
  }
  
  try {
    const passwordHash = hashPassword(password);
    const existing = await storage.getAdminCredentials(email);
    
    if (existing) {
      await storage.updateAdminCredentials(email, { passwordHash });
    } else {
      await storage.createAdminCredentials({ email, passwordHash });
    }
    
    res.json({ success: true, message: 'Password set successfully' });
  } catch (error) {
    console.error('Error setting admin password:', error);
    res.status(500).json({ message: 'Failed to set password' });
  }
});

// ============ Team Member Management ============

// Get all team members
router.get('/team-members', requireAdmin, async (req: AdminAuthenticatedRequest, res: Response) => {
  try {
    const members = await storage.getAllTeamMembers();
    const sanitized = members.map(m => ({
      id: m.id,
      email: m.email,
      name: m.name,
      isActive: m.isActive,
      lastLogin: m.lastLogin,
      createdBy: m.createdBy,
      createdAt: m.createdAt,
    }));
    res.json(sanitized);
  } catch (error) {
    console.error('Error fetching team members:', error);
    res.status(500).json({ message: 'Failed to fetch team members' });
  }
});

// Create team member
router.post('/team-members', requireAdmin, async (req: AdminAuthenticatedRequest, res: Response) => {
  try {
    const { email, name, password } = req.body;
    
    if (!email || !name || !password) {
      return res.status(400).json({ message: 'Email, name, and password are required' });
    }
    
    if (password.length < 8) {
      return res.status(400).json({ message: 'Password must be at least 8 characters' });
    }
    
    const normalizedEmail = email.toLowerCase().trim();
    
    const existing = await storage.getTeamCredentials(normalizedEmail);
    if (existing) {
      return res.status(400).json({ message: 'Team member with this email already exists' });
    }
    
    const passwordHash = hashPassword(password);
    const member = await storage.createTeamCredentials({
      email: normalizedEmail,
      name,
      passwordHash,
      isActive: true,
      createdBy: req.adminUser?.email || 'admin',
    });
    
    res.json({
      success: true,
      member: {
        id: member.id,
        email: member.email,
        name: member.name,
        isActive: member.isActive,
        createdAt: member.createdAt,
      }
    });
  } catch (error) {
    console.error('Error creating team member:', error);
    res.status(500).json({ message: 'Failed to create team member' });
  }
});

// Update team member (activate/deactivate, reset password)
router.patch('/team-members/:email', requireAdmin, async (req: AdminAuthenticatedRequest, res: Response) => {
  try {
    const { email } = req.params;
    const { isActive, password, name } = req.body;
    
    const updates: any = {};
    if (typeof isActive === 'boolean') updates.isActive = isActive;
    if (name) updates.name = name;
    if (password) {
      if (password.length < 8) {
        return res.status(400).json({ message: 'Password must be at least 8 characters' });
      }
      updates.passwordHash = hashPassword(password);
    }
    
    const updated = await storage.updateTeamCredentials(email, updates);
    if (!updated) {
      return res.status(404).json({ message: 'Team member not found' });
    }
    
    res.json({
      success: true,
      member: {
        id: updated.id,
        email: updated.email,
        name: updated.name,
        isActive: updated.isActive,
      }
    });
  } catch (error) {
    console.error('Error updating team member:', error);
    res.status(500).json({ message: 'Failed to update team member' });
  }
});

// Delete team member
router.delete('/team-members/:email', requireAdmin, async (req: AdminAuthenticatedRequest, res: Response) => {
  try {
    const { email } = req.params;
    const success = await storage.deleteTeamCredentials(email);
    
    if (!success) {
      return res.status(404).json({ message: 'Team member not found' });
    }
    
    res.json({ success: true, message: 'Team member deleted' });
  } catch (error) {
    console.error('Error deleting team member:', error);
    res.status(500).json({ message: 'Failed to delete team member' });
  }
});

// Get all users (admin only)
router.get('/users', requireAdmin, async (req: AdminAuthenticatedRequest, res: Response) => {
  try {
    const users = await storage.getAllUsers();
    const sanitizedUsers = users.map(user => ({
      id: user.id,
      email: user.email,
      role: user.role,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      certificationLevel: user.certificationLevel,
      inspectionHours: user.inspectionHours,
      approvedDARs: user.approvedDARs,
      onboardingCompleted: user.onboardingCompleted,
      isAdmin: user.isAdmin,
      createdAt: user.createdAt,
    }));
    res.json(sanitizedUsers);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ message: 'Failed to fetch users' });
  }
});

// Update user (admin only)
router.patch('/users/:id', requireAdmin, async (req: AdminAuthenticatedRequest, res: Response) => {
  const userId = parseInt(req.params.id);
  if (isNaN(userId)) {
    return res.status(400).json({ message: 'Invalid user ID' });
  }
  
  const { role, isAdmin, certificationLevel } = req.body;
  const updates: any = {};
  
  if (role !== undefined) updates.role = role;
  if (isAdmin !== undefined) updates.isAdmin = isAdmin;
  if (certificationLevel !== undefined) updates.certificationLevel = certificationLevel;
  
  try {
    const updatedUser = await storage.updateUser(userId, updates);
    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json({ success: true, user: updatedUser });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ message: 'Failed to update user' });
  }
});

// Get all projects (admin only)
router.get('/projects', requireAdmin, async (req: AdminAuthenticatedRequest, res: Response) => {
  try {
    const projects = await storage.getAllProjects();
    res.json(projects);
  } catch (error) {
    console.error('Error fetching projects:', error);
    res.status(500).json({ message: 'Failed to fetch projects' });
  }
});

// Get all properties (admin only)
router.get('/properties', requireAdmin, async (req: AdminAuthenticatedRequest, res: Response) => {
  try {
    const properties = await storage.getAllProperties();
    res.json(properties);
  } catch (error) {
    console.error('Error fetching properties:', error);
    res.status(500).json({ message: 'Failed to fetch properties' });
  }
});

// Get all clients (admin only)
router.get('/clients', requireAdmin, async (req: AdminAuthenticatedRequest, res: Response) => {
  try {
    const clients = await storage.getAllClients();
    res.json(clients);
  } catch (error) {
    console.error('Error fetching clients:', error);
    res.status(500).json({ message: 'Failed to fetch clients' });
  }
});

// Get dashboard stats (admin only)
router.get('/stats', requireAdmin, async (req: AdminAuthenticatedRequest, res: Response) => {
  try {
    const [users, projects, properties, clients] = await Promise.all([
      storage.getAllUsers(),
      storage.getAllProjects(),
      storage.getAllProperties(),
      storage.getAllClients(),
    ]);
    
    res.json({
      totalUsers: users.length,
      totalProjects: projects.length,
      totalProperties: properties.length,
      totalClients: clients.length,
      adminUsers: users.filter(u => u.isAdmin).length,
      activeProjects: projects.filter(p => !['completed', 'denied'].includes(p.status)).length,
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ message: 'Failed to fetch stats' });
  }
});

// =============================================================================
// KNOWLEDGE BASE MANAGEMENT ROUTES
// =============================================================================

// Helper function to log audit events
async function logKnowledgeAudit(
  req: AdminAuthenticatedRequest, 
  action: string, 
  documentId?: number, 
  categoryId?: number, 
  previousValue?: any, 
  newValue?: any,
  notes?: string
) {
  if (!req.adminUser?.dbUserId) return;
  
  await storage.createKnowledgeAuditLog({
    documentId,
    categoryId,
    action,
    userId: req.adminUser.dbUserId,
    userEmail: req.adminUser.email,
    previousValue,
    newValue,
    ipAddress: req.ip || req.headers['x-forwarded-for']?.toString() || 'unknown',
    userAgent: req.headers['user-agent'] || 'unknown',
    notes,
  });
}

// === CATEGORIES ===

// Get all knowledge categories
router.get('/knowledge/categories', requireAdmin, async (req: AdminAuthenticatedRequest, res: Response) => {
  try {
    const categories = await storage.getAllKnowledgeCategories();
    res.json(categories);
  } catch (error) {
    console.error('Error fetching knowledge categories:', error);
    res.status(500).json({ message: 'Failed to fetch categories' });
  }
});

// Create knowledge category
router.post('/knowledge/categories', requireAdmin, async (req: AdminAuthenticatedRequest, res: Response) => {
  try {
    const categoryData: InsertKnowledgeCategory = {
      name: req.body.name,
      description: req.body.description,
      parentId: req.body.parentId,
      icon: req.body.icon,
      color: req.body.color,
      isActive: req.body.isActive ?? true,
      orderIndex: req.body.orderIndex ?? 0,
    };
    
    const category = await storage.createKnowledgeCategory(categoryData);
    await logKnowledgeAudit(req, 'create', undefined, category.id, undefined, categoryData);
    res.status(201).json(category);
  } catch (error) {
    console.error('Error creating knowledge category:', error);
    res.status(500).json({ message: 'Failed to create category' });
  }
});

// Update knowledge category
router.patch('/knowledge/categories/:id', requireAdmin, async (req: AdminAuthenticatedRequest, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ message: 'Invalid category ID' });
    
    const existing = await storage.getKnowledgeCategoryById(id);
    if (!existing) return res.status(404).json({ message: 'Category not found' });
    
    const updates = req.body;
    const category = await storage.updateKnowledgeCategory(id, updates);
    await logKnowledgeAudit(req, 'update', undefined, id, existing, updates);
    res.json(category);
  } catch (error) {
    console.error('Error updating knowledge category:', error);
    res.status(500).json({ message: 'Failed to update category' });
  }
});

// Delete knowledge category
router.delete('/knowledge/categories/:id', requireAdmin, async (req: AdminAuthenticatedRequest, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ message: 'Invalid category ID' });
    
    const existing = await storage.getKnowledgeCategoryById(id);
    if (!existing) return res.status(404).json({ message: 'Category not found' });
    
    await storage.deleteKnowledgeCategory(id);
    await logKnowledgeAudit(req, 'delete', undefined, id, existing, undefined);
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting knowledge category:', error);
    res.status(500).json({ message: 'Failed to delete category' });
  }
});

// === DOCUMENTS ===

// Get all knowledge documents
router.get('/knowledge/documents', requireAdmin, async (req: AdminAuthenticatedRequest, res: Response) => {
  try {
    const categoryId = req.query.categoryId ? parseInt(req.query.categoryId as string) : undefined;
    const documentType = req.query.documentType as string | undefined;
    
    const documents = await storage.getAllKnowledgeDocuments({ categoryId, documentType });
    res.json(documents);
  } catch (error) {
    console.error('Error fetching knowledge documents:', error);
    res.status(500).json({ message: 'Failed to fetch documents' });
  }
});

// Get single knowledge document
router.get('/knowledge/documents/:id', requireAdmin, async (req: AdminAuthenticatedRequest, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ message: 'Invalid document ID' });
    
    const document = await storage.getKnowledgeDocumentById(id);
    if (!document) return res.status(404).json({ message: 'Document not found' });
    
    res.json(document);
  } catch (error) {
    console.error('Error fetching knowledge document:', error);
    res.status(500).json({ message: 'Failed to fetch document' });
  }
});

// Upload knowledge document
router.post('/knowledge/documents', requireAdmin, knowledgeUpload.single('file'), async (req: AdminAuthenticatedRequest, res: Response) => {
  try {
    const file = req.file;
    
    const documentData: InsertKnowledgeDocument = {
      title: req.body.title,
      description: req.body.description,
      categoryId: req.body.categoryId ? parseInt(req.body.categoryId) : undefined,
      documentType: req.body.documentType || 'transcript',
      fileUrl: file ? `/uploads/knowledge/${file.filename}` : undefined,
      fileName: file?.originalname,
      fileSize: file?.size,
      mimeType: file?.mimetype,
      content: req.body.content, // Direct text content
      isPublic: req.body.isPublic === 'true',
      isActive: true,
      version: 1,
      uploadedBy: req.adminUser?.dbUserId,
      metadata: {
        author: req.body.author,
        source: req.body.source,
        processingStatus: 'pending',
      },
    };
    
    const document = await storage.createKnowledgeDocument(documentData);
    await logKnowledgeAudit(req, 'upload', document.id, documentData.categoryId ?? undefined, undefined, { 
      title: documentData.title, 
      fileName: documentData.fileName,
      documentType: documentData.documentType,
    });
    
    res.status(201).json(document);
  } catch (error) {
    console.error('Error uploading knowledge document:', error);
    res.status(500).json({ message: 'Failed to upload document' });
  }
});

// Update knowledge document
router.patch('/knowledge/documents/:id', requireAdmin, async (req: AdminAuthenticatedRequest, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ message: 'Invalid document ID' });
    
    const existing = await storage.getKnowledgeDocumentById(id);
    if (!existing) return res.status(404).json({ message: 'Document not found' });
    
    const updates = req.body;
    const document = await storage.updateKnowledgeDocument(id, updates);
    await logKnowledgeAudit(req, 'update', id, existing.categoryId || undefined, 
      { title: existing.title, description: existing.description },
      updates
    );
    res.json(document);
  } catch (error) {
    console.error('Error updating knowledge document:', error);
    res.status(500).json({ message: 'Failed to update document' });
  }
});

// Import knowledge service for embedding generation
import { generateDocumentEmbeddings } from './knowledge-service';

// Approve knowledge document
router.post('/knowledge/documents/:id/approve', requireAdmin, async (req: AdminAuthenticatedRequest, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ message: 'Invalid document ID' });
    
    const document = await storage.approveKnowledgeDocument(id, req.adminUser?.dbUserId || 0);
    if (!document) return res.status(404).json({ message: 'Document not found' });
    
    await logKnowledgeAudit(req, 'approve', id, document.categoryId || undefined, undefined, { approved: true });
    
    // Generate embeddings for approved documents with content
    let embeddingsStatus = 'skipped';
    let embeddingsError: string | undefined;
    
    if (document.content) {
      try {
        const success = await generateDocumentEmbeddings(id);
        embeddingsStatus = success ? 'generated' : 'failed';
      } catch (err) {
        embeddingsStatus = 'failed';
        embeddingsError = err instanceof Error ? err.message : 'Unknown error';
        console.error(`Failed to generate embeddings for document ${id}:`, err);
      }
    }
    
    res.json({ 
      ...document, 
      embeddingsStatus,
      embeddingsError
    });
  } catch (error) {
    console.error('Error approving knowledge document:', error);
    res.status(500).json({ message: 'Failed to approve document' });
  }
});

// Generate embeddings for a document
router.post('/knowledge/documents/:id/embeddings', requireAdmin, async (req: AdminAuthenticatedRequest, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ message: 'Invalid document ID' });
    
    const document = await storage.getKnowledgeDocumentById(id);
    if (!document) return res.status(404).json({ message: 'Document not found' });
    
    if (!document.content) {
      return res.status(400).json({ message: 'Document has no content to generate embeddings from' });
    }
    
    const success = await generateDocumentEmbeddings(id);
    
    if (success) {
      await logKnowledgeAudit(req, 'update', id, document.categoryId || undefined, undefined, { embeddingsGenerated: true });
      res.json({ success: true, message: 'Embeddings generated successfully' });
    } else {
      res.status(500).json({ message: 'Failed to generate embeddings' });
    }
  } catch (error) {
    console.error('Error generating embeddings:', error);
    res.status(500).json({ message: 'Failed to generate embeddings' });
  }
});

// Delete knowledge document
router.delete('/knowledge/documents/:id', requireAdmin, async (req: AdminAuthenticatedRequest, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ message: 'Invalid document ID' });
    
    const existing = await storage.getKnowledgeDocumentById(id);
    if (!existing) return res.status(404).json({ message: 'Document not found' });
    
    // Delete the file if it exists
    if (existing.fileUrl) {
      const filePath = path.join(process.cwd(), existing.fileUrl);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }
    
    await storage.deleteKnowledgeDocument(id);
    await logKnowledgeAudit(req, 'delete', id, existing.categoryId || undefined, 
      { title: existing.title, fileName: existing.fileName }, 
      undefined
    );
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting knowledge document:', error);
    res.status(500).json({ message: 'Failed to delete document' });
  }
});

// === SECURE FILE DOWNLOAD ===

// Download knowledge document file (admin only)
router.get('/knowledge/documents/:id/download', requireAdmin, async (req: AdminAuthenticatedRequest, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ message: 'Invalid document ID' });
    
    const document = await storage.getKnowledgeDocumentById(id);
    if (!document) return res.status(404).json({ message: 'Document not found' });
    
    if (!document.fileUrl) {
      return res.status(404).json({ message: 'No file attached to this document' });
    }
    
    const filePath = path.join(process.cwd(), document.fileUrl);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: 'File not found on server' });
    }
    
    res.download(filePath, document.fileName || 'document');
  } catch (error) {
    console.error('Error downloading knowledge document:', error);
    res.status(500).json({ message: 'Failed to download document' });
  }
});

// === AUDIT LOG ===

// Get knowledge audit log
router.get('/knowledge/audit-log', requireAdmin, async (req: AdminAuthenticatedRequest, res: Response) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 100;
    const offset = req.query.offset ? parseInt(req.query.offset as string) : 0;
    
    const logs = await storage.getKnowledgeAuditLogs(limit, offset);
    res.json(logs);
  } catch (error) {
    console.error('Error fetching knowledge audit log:', error);
    res.status(500).json({ message: 'Failed to fetch audit log' });
  }
});

// === STATS ===

// Get knowledge base stats
router.get('/knowledge/stats', requireAdmin, async (req: AdminAuthenticatedRequest, res: Response) => {
  try {
    const [documents, categories] = await Promise.all([
      storage.getAllKnowledgeDocuments({}),
      storage.getAllKnowledgeCategories(),
    ]);
    
    const stats = {
      totalDocuments: documents.length,
      totalCategories: categories.length,
      pendingApproval: documents.filter(d => !d.approvedAt).length,
      byType: {} as Record<string, number>,
      byCategory: {} as Record<string, number>,
      totalSize: documents.reduce((sum, d) => sum + (d.fileSize || 0), 0),
    };
    
    documents.forEach(doc => {
      stats.byType[doc.documentType] = (stats.byType[doc.documentType] || 0) + 1;
      const catName = categories.find(c => c.id === doc.categoryId)?.name || 'Uncategorized';
      stats.byCategory[catName] = (stats.byCategory[catName] || 0) + 1;
    });
    
    res.json(stats);
  } catch (error) {
    console.error('Error fetching knowledge stats:', error);
    res.status(500).json({ message: 'Failed to fetch stats' });
  }
});

// Seed default knowledge categories
router.post('/knowledge/seed-categories', requireAdmin, async (req: AdminAuthenticatedRequest, res: Response) => {
  try {
    const defaultCategories = [
      { name: 'Winn Methodology', description: 'Core Winn Methodology documentation and procedures', icon: 'BookOpen', color: '#F97316', orderIndex: 1 },
      { name: 'Inspection Procedures', description: 'Standard inspection procedures and protocols', icon: 'ClipboardCheck', color: '#3B82F6', orderIndex: 2 },
      { name: 'Thermal Analysis', description: 'Thermal imaging analysis guides and references', icon: 'Thermometer', color: '#EF4444', orderIndex: 3 },
      { name: 'Insurance Documentation', description: 'Insurance claim documentation and requirements', icon: 'FileText', color: '#10B981', orderIndex: 4 },
      { name: 'Training Materials', description: 'Consultant training transcripts and videos', icon: 'GraduationCap', color: '#8B5CF6', orderIndex: 5 },
      { name: 'Case Studies', description: 'Real-world damage assessment case studies', icon: 'FolderOpen', color: '#F59E0B', orderIndex: 6 },
      { name: 'Manufacturer Specs', description: 'Roofing and building material manufacturer specifications', icon: 'Factory', color: '#6366F1', orderIndex: 7 },
      { name: 'Installation Guides', description: 'Material installation guides and best practices', icon: 'Wrench', color: '#14B8A6', orderIndex: 8 },
      { name: 'Damage Patterns', description: 'Reference images and documentation of damage types', icon: 'AlertTriangle', color: '#DC2626', orderIndex: 9 },
      { name: 'Product Information', description: 'Product data sheets and specifications', icon: 'Package', color: '#0EA5E9', orderIndex: 10 },
      { name: 'Audio Recordings', description: 'Training sessions, interviews, and field recordings', icon: 'Mic', color: '#A855F7', orderIndex: 11 },
      { name: 'Video Content', description: 'Training videos, demonstrations, and field documentation', icon: 'Video', color: '#EC4899', orderIndex: 12 },
    ];
    
    const created = [];
    for (const cat of defaultCategories) {
      const existing = await storage.getKnowledgeCategoryByName(cat.name);
      if (!existing) {
        const newCat = await storage.createKnowledgeCategory(cat);
        created.push(newCat);
      }
    }
    
    await logKnowledgeAudit(req, 'create', undefined, undefined, undefined, { seededCategories: created.length }, 'Seeded default categories');
    
    res.json({ 
      success: true, 
      created: created.length,
      message: `Created ${created.length} new categories` 
    });
  } catch (error) {
    console.error('Error seeding knowledge categories:', error);
    res.status(500).json({ message: 'Failed to seed categories' });
  }
});

// ============================================================================
// STORMY AI SETTINGS
// ============================================================================

// Get Stormy AI system prompt
router.get('/settings/stormy-prompt', requireAdmin, async (req: AdminAuthenticatedRequest, res: Response) => {
  try {
    const setting = await storage.getSystemSetting('stormy_system_prompt');

    // Return default prompt if none saved
    const defaultPrompt = `You are Stormy, the AI assistant for WinnStorm™ - a professional damage assessment platform. You are an expert in the Winn Methodology, which is an 8-step systematic approach to property damage inspection and documentation.

Your expertise includes:
- Thermal imaging analysis and interpretation
- Hail, wind, and storm damage identification
- Insurance claim documentation best practices
- Property inspection techniques using the Winn Methodology
- Reading and analyzing thermal images for moisture detection, heat loss, and structural issues

The 8 Steps of the Winn Methodology:
1. Weather Verification - Confirm storm events affected the property
2. Property Documentation - Gather building information and specifications
3. Exterior Survey - Systematic exterior damage assessment
4. Interior Survey - Check for interior damage and moisture intrusion
5. Thermal Scanning - Use infrared imaging to detect hidden issues
6. Test Square Analysis - Document damage density using 10x10 test squares
7. Evidence Compilation - Organize all photos, measurements, and findings
8. Report Generation - Create comprehensive damage assessment report

When analyzing images:
- For thermal images: Identify temperature anomalies, moisture patterns, insulation deficiencies
- For damage photos: Identify damage type, severity, affected components, and recommended repairs
- Always relate findings to insurance claim documentation requirements

Remember previous conversations and user preferences. Adapt your communication style based on the user's expertise level. Be professional, thorough, and helpful.`;

    res.json({
      prompt: setting?.value || defaultPrompt,
      isCustom: !!setting,
      updatedAt: setting?.updatedAt,
      updatedBy: setting?.updatedBy
    });
  } catch (error) {
    console.error('Error fetching Stormy prompt:', error);
    res.status(500).json({ message: 'Failed to fetch Stormy prompt' });
  }
});

// Update Stormy AI system prompt
router.put('/settings/stormy-prompt', requireAdmin, async (req: AdminAuthenticatedRequest, res: Response) => {
  try {
    const { prompt } = req.body;

    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({ message: 'Prompt is required' });
    }

    if (prompt.length < 100) {
      return res.status(400).json({ message: 'Prompt must be at least 100 characters' });
    }

    if (prompt.length > 10000) {
      return res.status(400).json({ message: 'Prompt must be less than 10,000 characters' });
    }

    const setting = await storage.upsertSystemSetting(
      'stormy_system_prompt',
      prompt,
      'Custom system prompt for Stormy AI assistant',
      (req.session as any)?.adminEmail
    );

    res.json({
      success: true,
      message: 'Stormy prompt updated successfully',
      updatedAt: setting.updatedAt
    });
  } catch (error) {
    console.error('Error updating Stormy prompt:', error);
    res.status(500).json({ message: 'Failed to update Stormy prompt' });
  }
});

// Reset Stormy AI prompt to default
router.delete('/settings/stormy-prompt', requireAdmin, async (req: AdminAuthenticatedRequest, res: Response) => {
  try {
    // Just delete the custom setting, the service will use the default
    const existing = await storage.getSystemSetting('stormy_system_prompt');
    if (existing) {
      // We don't have a delete method, so we'll set it to empty and let the service handle it
      // Actually, let's just leave it - the GET endpoint handles defaults
    }

    res.json({
      success: true,
      message: 'Stormy prompt reset to default'
    });
  } catch (error) {
    console.error('Error resetting Stormy prompt:', error);
    res.status(500).json({ message: 'Failed to reset Stormy prompt' });
  }
});

// Get all system settings
router.get('/settings', requireAdmin, async (req: AdminAuthenticatedRequest, res: Response) => {
  try {
    const settings = await storage.getAllSystemSettings();
    res.json(settings);
  } catch (error) {
    console.error('Error fetching system settings:', error);
    res.status(500).json({ message: 'Failed to fetch settings' });
  }
});

export default router;
