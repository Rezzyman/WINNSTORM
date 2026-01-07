import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { SEO } from '@/components/seo';
import { 
  Shield, 
  Users, 
  Briefcase, 
  Building2, 
  UserCheck,
  LogOut,
  RefreshCw,
  Activity,
  Settings,
  BookOpen,
  Upload,
  FileText,
  FolderOpen,
  CheckCircle2,
  Clock,
  Trash2,
  Eye,
  Plus
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogFooter 
} from '@/components/ui/dialog';
import winnstormLogo from '@assets/logo-dark_1765042579232.png';

interface AdminStats {
  totalUsers: number;
  totalProjects: number;
  totalProperties: number;
  totalClients: number;
  adminUsers: number;
  activeProjects: number;
}

interface AdminUser {
  id: number;
  email: string;
  role: string | null;
  firstName: string | null;
  lastName: string | null;
  certificationLevel: string | null;
  inspectionHours: number;
  approvedDARs: number;
  onboardingCompleted: boolean;
  isAdmin: boolean;
  createdAt: string;
}

interface KnowledgeCategory {
  id: number;
  name: string;
  description: string | null;
  icon: string | null;
  color: string | null;
  orderIndex: number;
  isActive: boolean;
  createdAt: string;
}

interface KnowledgeDocument {
  id: number;
  title: string;
  description: string | null;
  categoryId: number | null;
  documentType: string;
  fileUrl: string | null;
  fileName: string | null;
  fileSize: number | null;
  mimeType: string | null;
  content: string | null;
  isActive: boolean;
  isPublic: boolean;
  version: number;
  uploadedBy: number | null;
  approvedBy: number | null;
  approvedAt: string | null;
  createdAt: string;
}

const AdminDashboard = () => {
  const { user, logout } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [sessionEmail, setSessionEmail] = useState<string | null>(null);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [uploadForm, setUploadForm] = useState({
    title: '',
    description: '',
    categoryId: '',
    documentType: 'transcript',
    content: '',
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  
  // Team member state
  const [showAddTeamMember, setShowAddTeamMember] = useState(false);
  const [teamMemberForm, setTeamMemberForm] = useState({ name: '', email: '', password: '' });
  const [isCreatingTeamMember, setIsCreatingTeamMember] = useState(false);

  const getToken = async (): Promise<string | null> => {
    if (!user) return null;
    return await user.getIdToken();
  };

  const verifyAdminAccess = async () => {
    if (isVerifying) return;
    setIsVerifying(true);
    
    try {
      // First try session-based auth (password login)
      const sessionResponse = await fetch('/api/admin/session', {
        credentials: 'include',
      });
      
      if (sessionResponse.ok) {
        const data = await sessionResponse.json();
        setSessionEmail(data.email);
        setIsAuthorized(true);
        setIsVerifying(false);
        return;
      }
      
      // Fall back to Firebase token auth
      const token = await getToken();
      if (!token) {
        setIsAuthorized(false);
        setIsVerifying(false);
        navigate('/admin/login');
        return;
      }
      
      const response = await fetch('/api/admin/session', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        credentials: 'include',
      });
      
      if (response.ok) {
        setIsAuthorized(true);
      } else {
        setIsAuthorized(false);
        toast({
          title: "Access Denied",
          description: "You are not authorized to access the admin panel.",
          variant: "destructive",
        });
        navigate('/admin/login');
      }
    } catch (error) {
      setIsAuthorized(false);
      navigate('/admin/login');
    }
    setIsVerifying(false);
  };

  useEffect(() => {
    verifyAdminAccess();
  }, []);

  const { data: stats, isLoading: statsLoading, refetch: refetchStats } = useQuery<AdminStats>({
    queryKey: ['/api/admin/stats'],
    enabled: isAuthorized === true,
  });

  const { data: users, isLoading: usersLoading, refetch: refetchUsers } = useQuery<AdminUser[]>({
    queryKey: ['/api/admin/users'],
    enabled: isAuthorized === true,
  });

  const { data: projects, isLoading: projectsLoading } = useQuery<any[]>({
    queryKey: ['/api/admin/projects'],
    enabled: isAuthorized === true,
  });

  const { data: clients, isLoading: clientsLoading } = useQuery<any[]>({
    queryKey: ['/api/admin/clients'],
    enabled: isAuthorized === true,
  });

  // Knowledge Base queries
  const { data: knowledgeCategories, isLoading: categoriesLoading, refetch: refetchCategories } = useQuery<KnowledgeCategory[]>({
    queryKey: ['/api/admin/knowledge/categories'],
    enabled: isAuthorized === true,
  });

  const { data: knowledgeDocuments, isLoading: documentsLoading, refetch: refetchDocuments } = useQuery<KnowledgeDocument[]>({
    queryKey: ['/api/admin/knowledge/documents'],
    enabled: isAuthorized === true,
  });

  // Team members query
  const { data: teamMembers, isLoading: teamMembersLoading, refetch: refetchTeamMembers } = useQuery<{id: number; email: string; name: string; isActive: boolean; lastLogin: string | null; createdAt: string}[]>({
    queryKey: ['/api/admin/team-members'],
    enabled: isAuthorized === true,
  });

  const handleUploadDocument = async () => {
    if (!uploadForm.title) {
      toast({ title: "Title is required", variant: "destructive" });
      return;
    }

    setIsUploading(true);
    try {
      const token = await getToken();
      const formData = new FormData();
      formData.append('title', uploadForm.title);
      formData.append('description', uploadForm.description);
      if (uploadForm.categoryId) {
        formData.append('categoryId', uploadForm.categoryId);
      }
      formData.append('documentType', uploadForm.documentType);
      formData.append('content', uploadForm.content);
      
      if (selectedFile) {
        formData.append('file', selectedFile);
      }

      const response = await fetch('/api/admin/knowledge/documents', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to upload document');
      }

      toast({ title: "Document uploaded successfully" });
      setShowUploadDialog(false);
      setUploadForm({ title: '', description: '', categoryId: '', documentType: 'transcript', content: '' });
      setSelectedFile(null);
      refetchDocuments();
    } catch (error) {
      toast({ title: "Upload failed", description: (error as Error).message, variant: "destructive" });
    } finally {
      setIsUploading(false);
    }
  };

  const handleApproveDocument = async (docId: number) => {
    try {
      const token = await getToken();
      const response = await fetch(`/api/admin/knowledge/documents/${docId}/approve`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error('Failed to approve document');
      toast({ title: "Document approved" });
      refetchDocuments();
    } catch (error) {
      toast({ title: "Failed to approve document", variant: "destructive" });
    }
  };

  const handleDeleteDocument = async (docId: number) => {
    if (!confirm('Are you sure you want to delete this document?')) return;
    
    try {
      const token = await getToken();
      const response = await fetch(`/api/admin/knowledge/documents/${docId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error('Failed to delete document');
      toast({ title: "Document deleted" });
      refetchDocuments();
    } catch (error) {
      toast({ title: "Failed to delete document", variant: "destructive" });
    }
  };

  // Team member handlers
  const handleCreateTeamMember = async () => {
    if (!teamMemberForm.name || !teamMemberForm.email || !teamMemberForm.password) {
      toast({ title: "All fields are required", variant: "destructive" });
      return;
    }
    if (teamMemberForm.password.length < 8) {
      toast({ title: "Password must be at least 8 characters", variant: "destructive" });
      return;
    }
    
    setIsCreatingTeamMember(true);
    try {
      const token = await getToken();
      const response = await fetch('/api/admin/team-members', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(teamMemberForm),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to create team member');
      }

      toast({ title: "Team member created successfully" });
      setShowAddTeamMember(false);
      setTeamMemberForm({ name: '', email: '', password: '' });
      refetchTeamMembers();
    } catch (error) {
      toast({ title: "Failed to create team member", description: (error as Error).message, variant: "destructive" });
    } finally {
      setIsCreatingTeamMember(false);
    }
  };

  const handleToggleTeamMember = async (email: string, isActive: boolean) => {
    try {
      const token = await getToken();
      const response = await fetch(`/api/admin/team-members/${encodeURIComponent(email)}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isActive: !isActive }),
      });

      if (!response.ok) throw new Error('Failed to update team member');
      toast({ title: isActive ? "Team member deactivated" : "Team member activated" });
      refetchTeamMembers();
    } catch (error) {
      toast({ title: "Failed to update team member", variant: "destructive" });
    }
  };

  const handleDeleteTeamMember = async (email: string) => {
    if (!confirm('Are you sure you want to delete this team member?')) return;
    
    try {
      const token = await getToken();
      const response = await fetch(`/api/admin/team-members/${encodeURIComponent(email)}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error('Failed to delete team member');
      toast({ title: "Team member deleted" });
      refetchTeamMembers();
    } catch (error) {
      toast({ title: "Failed to delete team member", variant: "destructive" });
    }
  };

  const updateUserMutation = useMutation({
    mutationFn: async ({ userId, updates }: { userId: number; updates: any }) => {
      const token = await getToken();
      return apiRequest(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(updates),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/stats'] });
      toast({ title: "User updated successfully" });
    },
    onError: (error: any) => {
      toast({
        title: "Update failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleLogout = async () => {
    // Clear session-based auth
    try {
      await fetch('/api/admin/logout', {
        method: 'POST',
        credentials: 'include',
      });
    } catch (error) {
      console.error('Session logout error:', error);
    }
    // Also logout from Firebase if logged in
    if (user) {
      logout();
    }
    navigate('/admin/login');
  };

  const handleRefresh = () => {
    refetchStats();
    refetchUsers();
    toast({ title: "Data refreshed" });
  };

  if (isAuthorized === null) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-white/60">Verifying admin access...</p>
        </div>
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
        <div className="text-center max-w-md p-8">
          <Shield className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">Access Denied</h1>
          <p className="text-white/60 mb-6">
            {user 
              ? `Your account (${user.email}) is not authorized to access the admin panel.`
              : 'Please log in with an admin account to access this page.'
            }
          </p>
          <div className="flex flex-col gap-3">
            {user && (
              <Button
                variant="outline"
                onClick={() => {
                  logout();
                  navigate('/admin/login');
                }}
                className="w-full text-white border-white/20 hover:bg-white/10"
                data-testid="button-logout-admin-denied"
              >
                Sign out and try a different account
              </Button>
            )}
            <Button
              variant="outline"
              onClick={() => navigate('/')}
              className="w-full text-white border-white/20 hover:bg-white/10"
              data-testid="button-back-home"
            >
              Go back to homepage
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A]">
      <SEO
        title="Admin Dashboard - WinnStorm"
        description="WinnStorm Admin Panel for platform management."
        canonical="/admin"
        noindex={true}
      />

      <header className="bg-[#1A1A1A] border-b border-primary/30">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <img src={winnstormLogo} alt="WinnStorm" className="h-8" />
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              <span className="font-bold text-white">Admin Panel</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-primary border-primary">
              {user?.email}
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRefresh}
              className="text-white/60 hover:text-white"
              data-testid="button-refresh"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="text-white/60 hover:text-white"
              data-testid="button-logout"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card className="bg-white/5 border-white/10 rounded-none">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/60 text-sm">Total Users</p>
                  <p className="text-2xl font-bold text-white">{stats?.totalUsers || 0}</p>
                </div>
                <Users className="h-8 w-8 text-primary" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-white/5 border-white/10 rounded-none">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/60 text-sm">Active Projects</p>
                  <p className="text-2xl font-bold text-white">{stats?.activeProjects || 0}</p>
                </div>
                <Briefcase className="h-8 w-8 text-cyan-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-white/5 border-white/10 rounded-none">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/60 text-sm">Total Properties</p>
                  <p className="text-2xl font-bold text-white">{stats?.totalProperties || 0}</p>
                </div>
                <Building2 className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-white/5 border-white/10 rounded-none">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/60 text-sm">Admin Users</p>
                  <p className="text-2xl font-bold text-white">{stats?.adminUsers || 0}</p>
                </div>
                <Shield className="h-8 w-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="users" className="space-y-4">
          <TabsList className="bg-white/5 border border-white/10 rounded-none">
            <TabsTrigger value="users" className="rounded-none data-[state=active]:bg-primary">
              <Users className="h-4 w-4 mr-2" />
              Users
            </TabsTrigger>
            <TabsTrigger value="projects" className="rounded-none data-[state=active]:bg-primary">
              <Briefcase className="h-4 w-4 mr-2" />
              Projects
            </TabsTrigger>
            <TabsTrigger value="clients" className="rounded-none data-[state=active]:bg-primary">
              <UserCheck className="h-4 w-4 mr-2" />
              Clients
            </TabsTrigger>
            <TabsTrigger value="knowledge" className="rounded-none data-[state=active]:bg-primary">
              <BookOpen className="h-4 w-4 mr-2" />
              Knowledge Base
            </TabsTrigger>
            <TabsTrigger value="team-members" className="rounded-none data-[state=active]:bg-primary">
              <UserCheck className="h-4 w-4 mr-2" />
              Team Portal
            </TabsTrigger>
            <TabsTrigger value="system" className="rounded-none data-[state=active]:bg-primary">
              <Settings className="h-4 w-4 mr-2" />
              System
            </TabsTrigger>
          </TabsList>

          <TabsContent value="users">
            <Card className="bg-white/5 border-white/10 rounded-none">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  User Management
                </CardTitle>
              </CardHeader>
              <CardContent>
                {usersLoading ? (
                  <div className="text-center py-8 text-white/60">Loading users...</div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-white/10 hover:bg-transparent">
                          <TableHead className="text-white/60">ID</TableHead>
                          <TableHead className="text-white/60">Email</TableHead>
                          <TableHead className="text-white/60">Name</TableHead>
                          <TableHead className="text-white/60">Role</TableHead>
                          <TableHead className="text-white/60">Certification</TableHead>
                          <TableHead className="text-white/60">Admin</TableHead>
                          <TableHead className="text-white/60">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {users?.map((adminUser) => (
                          <TableRow key={adminUser.id} className="border-white/10 hover:bg-white/5">
                            <TableCell className="text-white/80">{adminUser.id}</TableCell>
                            <TableCell className="text-white">{adminUser.email}</TableCell>
                            <TableCell className="text-white/80">
                              {adminUser.firstName} {adminUser.lastName}
                            </TableCell>
                            <TableCell>
                              <Select
                                value={adminUser.role || 'junior_consultant'}
                                onValueChange={(value) => {
                                  updateUserMutation.mutate({
                                    userId: adminUser.id,
                                    updates: { role: value },
                                  });
                                }}
                              >
                                <SelectTrigger className="w-40 bg-white/5 border-white/20 text-white">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="junior_consultant">Junior Consultant</SelectItem>
                                  <SelectItem value="senior_consultant">Senior Consultant</SelectItem>
                                  <SelectItem value="admin">Admin</SelectItem>
                                  <SelectItem value="client">Client</SelectItem>
                                </SelectContent>
                              </Select>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="text-white/60">
                                {adminUser.certificationLevel || 'none'}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Switch
                                checked={adminUser.isAdmin}
                                onCheckedChange={(checked) => {
                                  updateUserMutation.mutate({
                                    userId: adminUser.id,
                                    updates: { isAdmin: checked },
                                  });
                                }}
                                data-testid={`switch-admin-${adminUser.id}`}
                              />
                            </TableCell>
                            <TableCell>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-primary hover:text-primary/80"
                                data-testid={`button-view-user-${adminUser.id}`}
                              >
                                View
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="projects">
            <Card className="bg-white/5 border-white/10 rounded-none">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Briefcase className="h-5 w-5 text-cyan-500" />
                  Project Management
                </CardTitle>
              </CardHeader>
              <CardContent>
                {projectsLoading ? (
                  <div className="text-center py-8 text-white/60">Loading projects...</div>
                ) : projects?.length === 0 ? (
                  <div className="text-center py-8 text-white/60">No projects found</div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-white/10 hover:bg-transparent">
                          <TableHead className="text-white/60">ID</TableHead>
                          <TableHead className="text-white/60">Project ID</TableHead>
                          <TableHead className="text-white/60">Address</TableHead>
                          <TableHead className="text-white/60">Loss Type</TableHead>
                          <TableHead className="text-white/60">Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {projects?.map((project) => (
                          <TableRow key={project.id} className="border-white/10 hover:bg-white/5">
                            <TableCell className="text-white/80">{project.id}</TableCell>
                            <TableCell className="text-white">{project.projectId}</TableCell>
                            <TableCell className="text-white/80">{project.propertyAddress}</TableCell>
                            <TableCell className="text-white/80">{project.lossType}</TableCell>
                            <TableCell>
                              <Badge variant="outline" className="text-primary border-primary">
                                {project.status}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="clients">
            <Card className="bg-white/5 border-white/10 rounded-none">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <UserCheck className="h-5 w-5 text-green-500" />
                  Client Management
                </CardTitle>
              </CardHeader>
              <CardContent>
                {clientsLoading ? (
                  <div className="text-center py-8 text-white/60">Loading clients...</div>
                ) : clients?.length === 0 ? (
                  <div className="text-center py-8 text-white/60">No clients found</div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-white/10 hover:bg-transparent">
                          <TableHead className="text-white/60">ID</TableHead>
                          <TableHead className="text-white/60">Company</TableHead>
                          <TableHead className="text-white/60">Contact</TableHead>
                          <TableHead className="text-white/60">Email</TableHead>
                          <TableHead className="text-white/60">Phone</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {clients?.map((client) => (
                          <TableRow key={client.id} className="border-white/10 hover:bg-white/5">
                            <TableCell className="text-white/80">{client.id}</TableCell>
                            <TableCell className="text-white">{client.companyName}</TableCell>
                            <TableCell className="text-white/80">{client.contactPerson}</TableCell>
                            <TableCell className="text-white/80">{client.email}</TableCell>
                            <TableCell className="text-white/80">{client.phone}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="knowledge">
            <Card className="bg-white/5 border-white/10 rounded-none">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-white flex items-center gap-2">
                    <BookOpen className="h-5 w-5 text-purple-500" />
                    Knowledge Base Management
                  </CardTitle>
                  <Button
                    onClick={() => setShowUploadDialog(true)}
                    className="bg-primary hover:bg-primary/90"
                    data-testid="button-upload-knowledge"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Document
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 bg-white/5 border border-white/10">
                    <div className="flex items-center gap-2 mb-2">
                      <FileText className="h-5 w-5 text-blue-400" />
                      <span className="text-white font-medium">Total Documents</span>
                    </div>
                    <p className="text-2xl font-bold text-white">{knowledgeDocuments?.length || 0}</p>
                  </div>
                  <div className="p-4 bg-white/5 border border-white/10">
                    <div className="flex items-center gap-2 mb-2">
                      <FolderOpen className="h-5 w-5 text-yellow-400" />
                      <span className="text-white font-medium">Categories</span>
                    </div>
                    <p className="text-2xl font-bold text-white">{knowledgeCategories?.length || 0}</p>
                  </div>
                  <div className="p-4 bg-white/5 border border-white/10">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle2 className="h-5 w-5 text-green-400" />
                      <span className="text-white font-medium">Approved</span>
                    </div>
                    <p className="text-2xl font-bold text-white">
                      {knowledgeDocuments?.filter(d => d.approvedAt).length || 0}
                    </p>
                  </div>
                </div>

                <div>
                  <h3 className="text-white font-medium mb-3 flex items-center gap-2">
                    <FolderOpen className="h-4 w-4" />
                    Categories
                  </h3>
                  {categoriesLoading ? (
                    <div className="text-center py-4 text-white/60">Loading categories...</div>
                  ) : knowledgeCategories?.length === 0 ? (
                    <div className="text-center py-4 text-white/60">
                      No categories yet. Categories will be created automatically.
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
                      {knowledgeCategories?.map((category) => (
                        <div
                          key={category.id}
                          className="p-3 bg-white/5 border border-white/10 text-center"
                        >
                          <span className="text-white text-sm">{category.name}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <h3 className="text-white font-medium mb-3 flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Documents
                  </h3>
                  {documentsLoading ? (
                    <div className="text-center py-8 text-white/60">Loading documents...</div>
                  ) : knowledgeDocuments?.length === 0 ? (
                    <div className="text-center py-8 text-white/60">
                      <FileText className="h-12 w-12 mx-auto mb-3 text-white/30" />
                      <p>No documents uploaded yet</p>
                      <p className="text-sm mt-1">Upload transcripts, PDFs, or text files to train Stormy AI</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow className="border-white/10 hover:bg-transparent">
                            <TableHead className="text-white/60">Title</TableHead>
                            <TableHead className="text-white/60">Type</TableHead>
                            <TableHead className="text-white/60">Category</TableHead>
                            <TableHead className="text-white/60">Status</TableHead>
                            <TableHead className="text-white/60">Uploaded</TableHead>
                            <TableHead className="text-white/60">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {knowledgeDocuments?.map((doc) => (
                            <TableRow key={doc.id} className="border-white/10 hover:bg-white/5">
                              <TableCell className="text-white">
                                <div className="flex items-center gap-2">
                                  <FileText className="h-4 w-4 text-blue-400" />
                                  {doc.title}
                                </div>
                                {doc.fileName && (
                                  <span className="text-xs text-white/40 ml-6">{doc.fileName}</span>
                                )}
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline" className="text-white/60">
                                  {doc.documentType}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-white/60">
                                {knowledgeCategories?.find(c => c.id === doc.categoryId)?.name || '-'}
                              </TableCell>
                              <TableCell>
                                {doc.approvedAt ? (
                                  <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                                    <CheckCircle2 className="h-3 w-3 mr-1" />
                                    Approved
                                  </Badge>
                                ) : (
                                  <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
                                    <Clock className="h-3 w-3 mr-1" />
                                    Pending
                                  </Badge>
                                )}
                              </TableCell>
                              <TableCell className="text-white/60 text-sm">
                                {new Date(doc.createdAt).toLocaleDateString()}
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-1">
                                  {!doc.approvedAt && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleApproveDocument(doc.id)}
                                      className="text-green-400 hover:text-green-300 hover:bg-green-500/10"
                                      data-testid={`button-approve-doc-${doc.id}`}
                                    >
                                      <CheckCircle2 className="h-4 w-4" />
                                    </Button>
                                  )}
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-white/60 hover:text-white"
                                    data-testid={`button-view-doc-${doc.id}`}
                                  >
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleDeleteDocument(doc.id)}
                                    className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                                    data-testid={`button-delete-doc-${doc.id}`}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="team-members">
            <Card className="bg-white/5 border-white/10 rounded-none">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-white flex items-center gap-2">
                    <UserCheck className="h-5 w-5 text-primary" />
                    Team Knowledge Portal Access
                  </CardTitle>
                  <Button
                    onClick={() => setShowAddTeamMember(true)}
                    className="bg-primary hover:bg-primary/90"
                    data-testid="button-add-team-member"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Team Member
                  </Button>
                </div>
                <CardDescription className="text-white/60">
                  Manage team members who can upload documents to Stormy's knowledge base at /team/knowledge
                </CardDescription>
              </CardHeader>
              <CardContent>
                {showAddTeamMember && (
                  <div className="mb-6 p-4 bg-white/5 border border-white/10 rounded-none">
                    <h4 className="text-white font-medium mb-4">Add New Team Member</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <Label className="text-white/60">Name</Label>
                        <Input
                          placeholder="John Doe"
                          value={teamMemberForm.name}
                          onChange={(e) => setTeamMemberForm({ ...teamMemberForm, name: e.target.value })}
                          className="bg-white/5 border-white/20 text-white"
                          data-testid="input-team-name"
                        />
                      </div>
                      <div>
                        <Label className="text-white/60">Email</Label>
                        <Input
                          type="email"
                          placeholder="john@example.com"
                          value={teamMemberForm.email}
                          onChange={(e) => setTeamMemberForm({ ...teamMemberForm, email: e.target.value })}
                          className="bg-white/5 border-white/20 text-white"
                          data-testid="input-team-email"
                        />
                      </div>
                      <div>
                        <Label className="text-white/60">Password (min 8 chars)</Label>
                        <Input
                          type="password"
                          placeholder="••••••••"
                          value={teamMemberForm.password}
                          onChange={(e) => setTeamMemberForm({ ...teamMemberForm, password: e.target.value })}
                          className="bg-white/5 border-white/20 text-white"
                          data-testid="input-team-password"
                        />
                      </div>
                    </div>
                    <div className="flex gap-2 mt-4">
                      <Button
                        onClick={handleCreateTeamMember}
                        disabled={isCreatingTeamMember}
                        className="bg-primary"
                        data-testid="button-create-team-member"
                      >
                        {isCreatingTeamMember ? 'Creating...' : 'Create Team Member'}
                      </Button>
                      <Button
                        variant="ghost"
                        onClick={() => {
                          setShowAddTeamMember(false);
                          setTeamMemberForm({ name: '', email: '', password: '' });
                        }}
                        className="text-white/60"
                        data-testid="button-cancel-team-member"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}
                
                {teamMembersLoading ? (
                  <div className="text-center py-8 text-white/60">Loading team members...</div>
                ) : !teamMembers || teamMembers.length === 0 ? (
                  <div className="text-center py-8 text-white/60">
                    No team members yet. Add team members to give them access to upload documents.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-white/10 hover:bg-transparent">
                          <TableHead className="text-white/60">Name</TableHead>
                          <TableHead className="text-white/60">Email</TableHead>
                          <TableHead className="text-white/60">Status</TableHead>
                          <TableHead className="text-white/60">Last Login</TableHead>
                          <TableHead className="text-white/60">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {teamMembers.map((member) => (
                          <TableRow key={member.id} className="border-white/10 hover:bg-white/5">
                            <TableCell className="text-white">{member.name}</TableCell>
                            <TableCell className="text-white/80">{member.email}</TableCell>
                            <TableCell>
                              <span className={`px-2 py-1 text-xs rounded ${member.isActive ? 'bg-green-900/50 text-green-400' : 'bg-red-900/50 text-red-400'}`}>
                                {member.isActive ? 'Active' : 'Inactive'}
                              </span>
                            </TableCell>
                            <TableCell className="text-white/60">
                              {member.lastLogin ? new Date(member.lastLogin).toLocaleDateString() : 'Never'}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleToggleTeamMember(member.email, member.isActive)}
                                  className={member.isActive ? 'text-yellow-400 hover:text-yellow-300' : 'text-green-400 hover:text-green-300'}
                                  data-testid={`button-toggle-team-${member.id}`}
                                >
                                  {member.isActive ? 'Deactivate' : 'Activate'}
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDeleteTeamMember(member.email)}
                                  className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                                  data-testid={`button-delete-team-${member.id}`}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
                
                <div className="mt-6 p-4 bg-blue-900/20 border border-blue-500/30 rounded-none">
                  <h4 className="text-blue-400 font-medium mb-2">Team Portal URL</h4>
                  <p className="text-white/80 font-mono text-sm">/team/knowledge</p>
                  <p className="text-white/60 text-sm mt-2">
                    Share this URL with team members. They can log in with the credentials you create here.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="system">
            <Card className="bg-white/5 border-white/10 rounded-none">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Activity className="h-5 w-5 text-yellow-500" />
                  System Status
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-white/5 border border-white/10">
                    <h3 className="text-white font-medium mb-2">Database Status</h3>
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 bg-green-500 rounded-full animate-pulse" />
                      <span className="text-green-400">Connected</span>
                    </div>
                  </div>
                  <div className="p-4 bg-white/5 border border-white/10">
                    <h3 className="text-white font-medium mb-2">Firebase Auth</h3>
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 bg-green-500 rounded-full animate-pulse" />
                      <span className="text-green-400">Active</span>
                    </div>
                  </div>
                  <div className="p-4 bg-white/5 border border-white/10">
                    <h3 className="text-white font-medium mb-2">AI Services</h3>
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 bg-green-500 rounded-full animate-pulse" />
                      <span className="text-green-400">Stormy AI Online</span>
                    </div>
                  </div>
                  <div className="p-4 bg-white/5 border border-white/10">
                    <h3 className="text-white font-medium mb-2">Stripe Integration</h3>
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 bg-green-500 rounded-full animate-pulse" />
                      <span className="text-green-400">Configured</span>
                    </div>
                  </div>
                </div>
                
                <div className="p-4 bg-white/5 border border-white/10">
                  <h3 className="text-white font-medium mb-2">Quick Actions</h3>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate('/dashboard')}
                      className="text-white border-white/20 hover:bg-white/10"
                      data-testid="button-goto-dashboard"
                    >
                      Go to Dashboard
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate('/innovation')}
                      className="text-white border-white/20 hover:bg-white/10"
                      data-testid="button-goto-innovation"
                    >
                      Innovation Hub
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open('/api-docs', '_blank')}
                      className="text-white border-white/20 hover:bg-white/10"
                      data-testid="button-goto-api-docs"
                    >
                      API Documentation
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
        <DialogContent className="bg-[#1A1A1A] border-white/10 text-white max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5 text-primary" />
              Upload Knowledge Document
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title" className="text-white">Title *</Label>
              <Input
                id="title"
                placeholder="Document title"
                value={uploadForm.title}
                onChange={(e) => setUploadForm({ ...uploadForm, title: e.target.value })}
                className="bg-white/5 border-white/20 text-white"
                data-testid="input-doc-title"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description" className="text-white">Description</Label>
              <Textarea
                id="description"
                placeholder="Brief description of the document"
                value={uploadForm.description}
                onChange={(e) => setUploadForm({ ...uploadForm, description: e.target.value })}
                className="bg-white/5 border-white/20 text-white min-h-20"
                data-testid="input-doc-description"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="documentType" className="text-white">Document Type</Label>
                <Select
                  value={uploadForm.documentType}
                  onValueChange={(value) => setUploadForm({ ...uploadForm, documentType: value })}
                >
                  <SelectTrigger className="bg-white/5 border-white/20 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="transcript">Transcript</SelectItem>
                    <SelectItem value="methodology">Methodology Guide</SelectItem>
                    <SelectItem value="procedure">Procedure/Process</SelectItem>
                    <SelectItem value="training">Training Material</SelectItem>
                    <SelectItem value="case_study">Case Study</SelectItem>
                    <SelectItem value="manufacturer_spec">Manufacturer Spec</SelectItem>
                    <SelectItem value="product_info">Product Information</SelectItem>
                    <SelectItem value="installation_guide">Installation Guide</SelectItem>
                    <SelectItem value="reference_image">Reference Image</SelectItem>
                    <SelectItem value="audio_recording">Audio Recording</SelectItem>
                    <SelectItem value="video">Video</SelectItem>
                    <SelectItem value="damage_pattern">Damage Pattern</SelectItem>
                    <SelectItem value="insurance_doc">Insurance Document</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="category" className="text-white">Category</Label>
                <Select
                  value={uploadForm.categoryId}
                  onValueChange={(value) => setUploadForm({ ...uploadForm, categoryId: value })}
                >
                  <SelectTrigger className="bg-white/5 border-white/20 text-white">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {knowledgeCategories?.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id.toString()}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="file" className="text-white">Upload File (optional)</Label>
              <Input
                id="file"
                type="file"
                accept=".pdf,.txt,.md,.doc,.docx,.xls,.xlsx,.csv,.jpg,.jpeg,.png,.gif,.webp,.mp3,.wav,.m4a,.ogg,.mp4,.webm,.mov"
                onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                className="bg-white/5 border-white/20 text-white file:bg-primary file:text-white file:border-0 file:mr-4 file:px-4 file:py-2"
                data-testid="input-doc-file"
              />
              <p className="text-xs text-white/40">
                Documents: PDF, Word, Excel, Text | Images: JPG, PNG, WebP | Audio: MP3, WAV, M4A | Video: MP4, WebM
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="content" className="text-white">Or paste content directly</Label>
              <Textarea
                id="content"
                placeholder="Paste transcript or document content here..."
                value={uploadForm.content}
                onChange={(e) => setUploadForm({ ...uploadForm, content: e.target.value })}
                className="bg-white/5 border-white/20 text-white min-h-32"
                data-testid="input-doc-content"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowUploadDialog(false)}
              className="border-white/20 text-white hover:bg-white/10"
              data-testid="button-cancel-upload"
            >
              Cancel
            </Button>
            <Button
              onClick={handleUploadDocument}
              disabled={isUploading || !uploadForm.title}
              className="bg-primary hover:bg-primary/90"
              data-testid="button-submit-upload"
            >
              {isUploading ? (
                <>
                  <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Document
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminDashboard;
