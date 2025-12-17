import { Router, Response } from 'express';
import { requireAdmin, AdminAuthenticatedRequest, isAdminEmail } from './auth';
import { storage } from './storage';
import { User, Project, Property } from '@shared/schema';

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

export default router;
