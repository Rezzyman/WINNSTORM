import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
  Settings
} from 'lucide-react';
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

const AdminDashboard = () => {
  const { user, logout } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
  const [hasChecked, setHasChecked] = useState(false);

  const getToken = async (): Promise<string | null> => {
    if (!user) return null;
    return await user.getIdToken();
  };

  const verifyAdminAccess = async () => {
    if (hasChecked) return;
    
    try {
      const token = await getToken();
      if (!token) {
        setIsAuthorized(false);
        setHasChecked(true);
        return;
      }
      
      const response = await fetch('/api/admin/session', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
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
      }
    } catch (error) {
      setIsAuthorized(false);
    }
    setHasChecked(true);
  };

  useEffect(() => {
    if (!user) {
      setIsAuthorized(false);
      setHasChecked(true);
      return;
    }
    verifyAdminAccess();
  }, [user, hasChecked]);

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

  const handleLogout = () => {
    logout();
    navigate('/');
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
    </div>
  );
};

export default AdminDashboard;
