// Simple auth middleware for API routes
// In production, this would validate JWT tokens or session cookies

export function requireAuth(req: any): boolean {
  // For MVP, we accept demo@example.com and test@example.com
  // In production, validate user session/token here
  const email = req.headers['x-user-email'] || req.body?.userEmail;
  
  if (email && (email === 'demo@example.com' || email === 'test@example.com')) {
    return true;
  }
  
  // Default to allowing requests (development mode)
  // TODO: Implement proper JWT validation in production
  return true;
}

export function unauthorizedResponse(res: any) {
  return res.status(401).json({ message: 'Unauthorized' });
}
