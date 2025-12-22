import { Router, Response } from 'express';
import { requireAdmin, AdminAuthenticatedRequest, isAdminEmail } from './auth';
import { storage } from './storage';
import { User, Project, Property, InsertKnowledgeDocument, InsertKnowledgeCategory, InsertKnowledgeAuditLog } from '@shared/schema';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

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
  'text/plain',
  'text/markdown',
  'text/csv',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/json',
];

const knowledgeUpload = multer({
  storage: knowledgeStorage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB max
  },
  fileFilter: (req, file, cb) => {
    if (allowedMimeTypes.includes(file.mimetype) || file.mimetype.startsWith('text/')) {
      cb(null, true);
    } else {
      cb(new Error(`File type ${file.mimetype} not allowed. Allowed types: ${allowedMimeTypes.join(', ')}`));
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

// Approve knowledge document
router.post('/knowledge/documents/:id/approve', requireAdmin, async (req: AdminAuthenticatedRequest, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ message: 'Invalid document ID' });
    
    const document = await storage.approveKnowledgeDocument(id, req.adminUser?.dbUserId || 0);
    if (!document) return res.status(404).json({ message: 'Document not found' });
    
    await logKnowledgeAudit(req, 'approve', id, document.categoryId || undefined, undefined, { approved: true });
    res.json(document);
  } catch (error) {
    console.error('Error approving knowledge document:', error);
    res.status(500).json({ message: 'Failed to approve document' });
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

export default router;
