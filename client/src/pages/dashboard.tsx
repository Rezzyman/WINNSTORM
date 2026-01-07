import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { Header, Footer } from '@/components/navbar';
import { UserOnboarding } from '@/components/user-onboarding';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Property, Project, Client, InspectionSession } from '@shared/schema';
import { 
  FileText, Upload, Users, Briefcase, TrendingUp, Calendar,
  Building2, ClipboardCheck, ChevronRight, Clock, CheckCircle2,
  AlertCircle, Play, Eye, Download, Plus, ArrowUpRight
} from 'lucide-react';
import { StormyChat } from '@/components/stormy-chat';
import { Skeleton } from '@/components/ui/skeleton';
import { SEO, breadcrumbSchema } from '@/components/seo';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, LineChart, Line, Area, AreaChart
} from 'recharts';

// Status color mapping
const statusColors: Record<string, string> = {
  active: 'bg-green-500/20 text-green-400 border-green-500/30',
  inactive: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
  pending: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  lead: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  completed: 'bg-green-500/20 text-green-400 border-green-500/30',
  in_progress: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  scheduled: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  draft: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  submitted: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
  denied: 'bg-red-500/20 text-red-400 border-red-500/30',
};

// Pipeline stage colors for chart
const pipelineColors = ['#3b82f6', '#f97316', '#22c55e', '#06b6d4', '#8b5cf6'];

// Demo data for demonstration purposes (linked to testimonials on landing page)
const demoClients = [
  { id: 1, companyName: 'State Farm Insurance', contactPerson: 'Michael Rodriguez', email: 'mrodriguez@statefarm.com', phone: '(214) 555-0142', status: 'active' },
  { id: 2, companyName: 'Elite Roofing Solutions', contactPerson: 'Sarah Chen', email: 'schen@eliteroofing.com', phone: '(972) 555-0198', status: 'active' },
  { id: 3, companyName: 'Liberty Mutual', contactPerson: 'David Thompson', email: 'dthompson@libertymutual.com', phone: '(469) 555-0234', status: 'active' },
  { id: 4, companyName: 'Allstate Claims', contactPerson: 'Jennifer Martinez', email: 'jmartinez@allstate.com', phone: '(817) 555-0167', status: 'active' },
  { id: 5, companyName: 'Texas Premier Roofing', contactPerson: 'Robert Williams', email: 'rwilliams@texaspremier.com', phone: '(214) 555-0289', status: 'active' },
  { id: 6, companyName: 'Farmers Insurance Group', contactPerson: 'Amanda Foster', email: 'afoster@farmers.com', phone: '(972) 555-0312', status: 'active' },
  { id: 7, companyName: 'DFW Storm Repairs', contactPerson: 'Marcus Johnson', email: 'mjohnson@dfwstorm.com', phone: '(469) 555-0445', status: 'active' },
  { id: 8, companyName: 'Nationwide Claims', contactPerson: 'Lisa Anderson', email: 'landerson@nationwide.com', phone: '(817) 555-0521', status: 'active' },
];

const demoProjects = [
  { id: 1, name: 'State Farm - Richardson Hail Claim', clientId: 1, propertyId: 1, status: 'completed', inspectionDate: '2025-12-28', address: '2847 Prestonwood Blvd, Richardson, TX' },
  { id: 2, name: 'Elite Roofing - Plano Commercial', clientId: 2, propertyId: 2, status: 'completed', inspectionDate: '2025-12-30', address: '5201 Legacy Dr, Plano, TX' },
  { id: 3, name: 'Liberty Mutual - Frisco Storm', clientId: 3, propertyId: 3, status: 'completed', inspectionDate: '2026-01-02', address: '9100 Warren Pkwy, Frisco, TX' },
  { id: 4, name: 'Allstate - McKinney Residential', clientId: 4, propertyId: 4, status: 'submitted', inspectionDate: '2026-01-04', address: '1420 Eldorado Pkwy, McKinney, TX' },
  { id: 5, name: 'Texas Premier - Allen Multi-Unit', clientId: 5, propertyId: 5, status: 'report_draft', inspectionDate: '2026-01-05', address: '710 Stacy Rd, Allen, TX' },
  { id: 6, name: 'Farmers - Carrollton Wind Damage', clientId: 6, propertyId: 6, status: 'in_progress', inspectionDate: '2026-01-06', address: '2220 E Hebron Pkwy, Carrollton, TX' },
  { id: 7, name: 'DFW Storm - Irving Commercial', clientId: 7, propertyId: 7, status: 'in_progress', inspectionDate: '2026-01-06', address: '6401 N MacArthur Blvd, Irving, TX' },
  { id: 8, name: 'State Farm - Lewisville Hail', clientId: 1, propertyId: 8, status: 'scheduled', inspectionDate: '2026-01-08', address: '1850 S Valley Pkwy, Lewisville, TX' },
  { id: 9, name: 'Nationwide - Flower Mound', clientId: 8, propertyId: 9, status: 'scheduled', inspectionDate: '2026-01-09', address: '3401 Long Prairie Rd, Flower Mound, TX' },
  { id: 10, name: 'Elite Roofing - Southlake Estate', clientId: 2, propertyId: 10, status: 'scheduled', inspectionDate: '2026-01-10', address: '1400 E Southlake Blvd, Southlake, TX' },
  { id: 11, name: 'Liberty Mutual - Grapevine', clientId: 3, propertyId: 11, status: 'scheduled', inspectionDate: '2026-01-12', address: '2100 Glade Rd, Grapevine, TX' },
];

const demoReports = [
  { id: 1, projectName: 'State Farm - Richardson Hail Claim', clientName: 'State Farm Insurance', completedDate: '2025-12-29', damageScore: 78, status: 'delivered' },
  { id: 2, projectName: 'Elite Roofing - Plano Commercial', clientName: 'Elite Roofing Solutions', completedDate: '2026-01-01', damageScore: 85, status: 'delivered' },
  { id: 3, projectName: 'Liberty Mutual - Frisco Storm', clientName: 'Liberty Mutual', completedDate: '2026-01-03', damageScore: 92, status: 'delivered' },
  { id: 4, projectName: 'Allstate - Addison Office Park', clientName: 'Allstate Claims', completedDate: '2025-12-20', damageScore: 67, status: 'delivered' },
  { id: 5, projectName: 'Texas Premier - Garland Complex', clientName: 'Texas Premier Roofing', completedDate: '2025-12-15', damageScore: 73, status: 'delivered' },
];

const demoUpcoming = [
  { id: 8, name: 'State Farm - Lewisville Hail', clientName: 'State Farm Insurance', inspectionDate: '2026-01-08', address: '1850 S Valley Pkwy, Lewisville, TX', time: '9:00 AM' },
  { id: 9, name: 'Nationwide - Flower Mound', clientName: 'Nationwide Claims', inspectionDate: '2026-01-09', address: '3401 Long Prairie Rd, Flower Mound, TX', time: '10:30 AM' },
  { id: 10, name: 'Elite Roofing - Southlake Estate', clientName: 'Elite Roofing Solutions', inspectionDate: '2026-01-10', address: '1400 E Southlake Blvd, Southlake, TX', time: '2:00 PM' },
  { id: 11, name: 'Liberty Mutual - Grapevine', clientName: 'Liberty Mutual', inspectionDate: '2026-01-12', address: '2100 Glade Rd, Grapevine, TX', time: '11:00 AM' },
];

const Dashboard = () => {
  const { user, role } = useAuth();
  const [, navigate] = useLocation();
  const [showOnboarding, setShowOnboarding] = useState(false);
  
  // Redirect to login if not authenticated
  useEffect(() => {
    if (!user) {
      navigate('/');
    }
  }, [user, navigate]);

  // Check if user has completed onboarding
  useEffect(() => {
    if (user) {
      const hasCompletedOnboarding = localStorage.getItem(`onboarding_completed_${user.uid}`);
      if (!hasCompletedOnboarding) {
        setShowOnboarding(true);
      }
    }
  }, [user]);

  const handleOnboardingComplete = async () => {
    if (user) {
      localStorage.setItem(`onboarding_completed_${user.uid}`, 'true');
      try {
        await fetch('/api/user/onboarding', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include'
        });
      } catch (error) {
        console.error('Failed to persist onboarding status:', error);
      }
    }
    setShowOnboarding(false);
  };

  // Fetch all data
  const { data: clients, isLoading: clientsLoading } = useQuery<Client[]>({
    queryKey: ['/api/clients'],
  });

  const { data: projects, isLoading: projectsLoading } = useQuery<Project[]>({
    queryKey: ['/api/projects'],
  });

  const { data: properties, isLoading: propertiesLoading } = useQuery<Property[]>({
    queryKey: ['/api/properties'],
  });

  const { data: inspections, isLoading: inspectionsLoading } = useQuery<InspectionSession[]>({
    queryKey: ['/api/inspection/sessions'],
  });

  const isLoading = clientsLoading || projectsLoading || propertiesLoading || inspectionsLoading;

  // Check if we should use demo data (when no real data exists)
  const hasRealClients = clients && clients.length > 0;
  const hasRealProjects = projects && projects.length > 0;
  const useDemoData = !hasRealClients && !hasRealProjects && !isLoading;

  // Use demo or real data
  const displayClients = useDemoData ? demoClients : (clients || []);
  const displayProjects = useDemoData ? demoProjects : (projects || []);

  // Calculate stats with demo fallback
  const activeClients = useDemoData ? demoClients.length : (clients?.length || 0);
  const totalClients = useDemoData ? demoClients.length : (clients?.length || 0);
  const openProjects = useDemoData 
    ? demoProjects.filter(p => !['completed', 'denied'].includes(p.status)).length 
    : (projects?.filter(p => !['completed', 'denied'].includes(p.status)).length || 0);
  const completedProjects = useDemoData
    ? demoProjects.filter(p => p.status === 'completed').length
    : (projects?.filter(p => p.status === 'completed').length || 0);
  
  // This month's inspections (demo: 15)
  const thisMonth = new Date();
  const thisMonthStart = new Date(thisMonth.getFullYear(), thisMonth.getMonth(), 1);
  const inspectionsThisMonth = useDemoData 
    ? 15 
    : (inspections?.filter(i => new Date(i.startedAt || '') >= thisMonthStart).length || 0);

  // Reports generated (demo: 47)
  const reportsGenerated = useDemoData ? 47 : (inspections?.filter(i => i.status === 'completed').length || 0);

  // Pipeline data for chart
  const pipelineData = useDemoData ? [
    { name: 'Scheduled', value: 4, fill: pipelineColors[0] },
    { name: 'In Progress', value: 2, fill: pipelineColors[1] },
    { name: 'Report Draft', value: 1, fill: pipelineColors[2] },
    { name: 'Submitted', value: 1, fill: pipelineColors[3] },
    { name: 'Completed', value: 3, fill: pipelineColors[4] },
  ] : [
    { name: 'Scheduled', value: projects?.filter(p => p.status === 'scheduled').length || 0, fill: pipelineColors[0] },
    { name: 'In Progress', value: projects?.filter(p => p.status === 'in_progress').length || 0, fill: pipelineColors[1] },
    { name: 'Report Draft', value: projects?.filter(p => p.status === 'report_draft').length || 0, fill: pipelineColors[2] },
    { name: 'Submitted', value: projects?.filter(p => p.status === 'submitted').length || 0, fill: pipelineColors[3] },
    { name: 'Completed', value: completedProjects, fill: pipelineColors[4] },
  ];

  // Monthly trend data
  const monthlyTrendData = [
    { month: 'Aug', inspections: 12, reports: 10 },
    { month: 'Sep', inspections: 18, reports: 15 },
    { month: 'Oct', inspections: 24, reports: 20 },
    { month: 'Nov', inspections: 22, reports: 19 },
    { month: 'Dec', inspections: 28, reports: 25 },
    { month: 'Jan', inspections: useDemoData ? 15 : (inspectionsThisMonth || 15), reports: useDemoData ? 12 : (reportsGenerated || 12) },
  ];

  // Recent clients (last 5) - use demo if no real data
  const recentClients = useDemoData ? demoClients.slice(0, 5) : (clients?.slice(0, 5) || []);

  // Recent projects for reports - use demo reports if no real data
  const recentReportsData = useDemoData ? demoReports : (projects?.filter(p => p.status === 'completed').slice(0, 5) || []);

  // Upcoming inspections - use demo if no real data
  const upcomingInspections = useDemoData 
    ? demoUpcoming 
    : (projects
        ?.filter(p => p.status === 'scheduled' && p.inspectionDate)
        .sort((a, b) => new Date(a.inspectionDate!).getTime() - new Date(b.inspectionDate!).getTime())
        .slice(0, 5) || []);

  // Get client name by ID (check both demo and real clients)
  const getClientName = (clientId: number | null) => {
    if (!clientId) return 'Unknown Client';
    const realClient = clients?.find(c => c.id === clientId);
    if (realClient) return realClient.companyName || realClient.contactPerson || 'Unknown Client';
    const demoClient = demoClients.find(c => c.id === clientId);
    return demoClient?.companyName || demoClient?.contactPerson || 'Unknown Client';
  };

  // Format date
  const formatDate = (dateStr: string | null | Date) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <div className="min-h-screen flex flex-col relative bg-[#0f1419] text-foreground">
      <SEO
        title="Dashboard"
        description="Manage your damage assessment projects, track inspections, and view certification progress."
        canonical="/dashboard"
        noindex={true}
        structuredData={breadcrumbSchema([
          { name: 'Home', url: '/' },
          { name: 'Dashboard', url: '/dashboard' }
        ])}
      />
      <Header />
      
      <main className="flex-grow pb-20">
        <div className="p-4 md:p-6 max-w-[1600px] mx-auto">
          
          {/* Dashboard Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-white mb-1">Dashboard</h1>
              <p className="text-gray-400 text-sm">
                Welcome back{user?.displayName ? `, ${user.displayName.split(' ')[0]}` : ''}. Here's your overview.
              </p>
            </div>
            <div className="flex gap-2 mt-4 md:mt-0">
              <Button 
                onClick={() => navigate('/upload')}
                className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white border-0"
                data-testid="button-new-assessment"
              >
                <Plus className="h-4 w-4 mr-2" />
                New Assessment
              </Button>
              <Button 
                variant="outline" 
                onClick={() => navigate('/clients')}
                className="border-gray-700 hover:bg-gray-800"
                data-testid="button-add-client"
              >
                <Users className="h-4 w-4 mr-2" />
                Add Client
              </Button>
            </div>
          </div>

          {/* Hero Stats Row */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <Card className="bg-gradient-to-br from-[#1a1f26] to-[#1a1f26] border-gray-800 hover:border-orange-500/30 transition-colors" data-testid="stat-active-clients">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm font-medium">Active Clients</p>
                    <div className="flex items-baseline gap-2 mt-1">
                      <span className="text-3xl font-bold text-white">{isLoading ? '—' : activeClients}</span>
                      <span className="text-gray-500 text-sm">/ {totalClients}</span>
                    </div>
                  </div>
                  <div className="p-3 bg-orange-500/10 rounded-xl">
                    <Users className="h-6 w-6 text-orange-500" />
                  </div>
                </div>
                <div className="mt-3 flex items-center text-xs text-gray-500">
                  <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
                  <span className="text-green-500">+2</span>
                  <span className="ml-1">this month</span>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-[#1a1f26] to-[#1a1f26] border-gray-800 hover:border-blue-500/30 transition-colors" data-testid="stat-open-projects">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm font-medium">Open Projects</p>
                    <div className="flex items-baseline gap-2 mt-1">
                      <span className="text-3xl font-bold text-white">{isLoading ? '—' : openProjects}</span>
                    </div>
                  </div>
                  <div className="p-3 bg-blue-500/10 rounded-xl">
                    <Briefcase className="h-6 w-6 text-blue-500" />
                  </div>
                </div>
                <div className="mt-3 flex items-center text-xs text-gray-500">
                  <Clock className="h-3 w-3 mr-1 text-yellow-500" />
                  <span>{projects?.filter(p => p.status === 'in_progress').length || 0} in progress</span>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-[#1a1f26] to-[#1a1f26] border-gray-800 hover:border-green-500/30 transition-colors" data-testid="stat-inspections-month">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm font-medium">Inspections This Month</p>
                    <div className="flex items-baseline gap-2 mt-1">
                      <span className="text-3xl font-bold text-white">{isLoading ? '—' : inspectionsThisMonth}</span>
                    </div>
                  </div>
                  <div className="p-3 bg-green-500/10 rounded-xl">
                    <ClipboardCheck className="h-6 w-6 text-green-500" />
                  </div>
                </div>
                <div className="mt-3 flex items-center text-xs text-gray-500">
                  <ArrowUpRight className="h-3 w-3 mr-1 text-green-500" />
                  <span className="text-green-500">12%</span>
                  <span className="ml-1">vs last month</span>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-[#1a1f26] to-[#1a1f26] border-gray-800 hover:border-purple-500/30 transition-colors" data-testid="stat-reports-generated">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm font-medium">Reports Generated</p>
                    <div className="flex items-baseline gap-2 mt-1">
                      <span className="text-3xl font-bold text-white">{isLoading ? '—' : reportsGenerated}</span>
                    </div>
                  </div>
                  <div className="p-3 bg-purple-500/10 rounded-xl">
                    <FileText className="h-6 w-6 text-purple-500" />
                  </div>
                </div>
                <div className="mt-3 flex items-center text-xs text-gray-500">
                  <CheckCircle2 className="h-3 w-3 mr-1 text-green-500" />
                  <span>{completedProjects} delivered</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            
            {/* Recent Clients */}
            <Card className="bg-[#1a1f26] border-gray-800" data-testid="widget-recent-clients">
              <CardHeader className="pb-3 border-b border-gray-800">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-semibold text-white">Recent Clients</CardTitle>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => navigate('/clients')}
                    className="text-orange-500 hover:text-orange-400 hover:bg-orange-500/10 -mr-2"
                    data-testid="button-view-all-clients"
                  >
                    View All
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {isLoading ? (
                  <div className="p-4 space-y-3">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="flex items-center gap-3">
                        <Skeleton className="h-10 w-10 rounded-lg" />
                        <div className="flex-1">
                          <Skeleton className="h-4 w-32 mb-1" />
                          <Skeleton className="h-3 w-24" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : recentClients.length > 0 ? (
                  <div className="divide-y divide-gray-800" data-testid="list-recent-clients">
                    {recentClients.map((client) => (
                      <div 
                        key={client.id} 
                        className="p-4 hover:bg-gray-800/50 transition-colors cursor-pointer group"
                        onClick={() => navigate(`/clients/${client.id}`)}
                        data-testid={`client-row-${client.id}`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-orange-500/20 to-orange-600/20 flex items-center justify-center">
                            <Building2 className="h-5 w-5 text-orange-500" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-white truncate group-hover:text-orange-400 transition-colors">
                              {client.companyName || client.contactPerson}
                            </p>
                            <p className="text-sm text-gray-500 truncate">{client.email}</p>
                          </div>
                          <Badge className={`${statusColors['active']} border text-xs`}>
                            active
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 text-center">
                    <Users className="h-10 w-10 text-gray-600 mx-auto mb-3" />
                    <p className="text-gray-400 mb-3">No clients yet</p>
                    <Button 
                      size="sm" 
                      onClick={() => navigate('/clients')}
                      className="bg-orange-500 hover:bg-orange-600"
                      data-testid="button-add-first-client"
                    >
                      Add First Client
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Inspection Pipeline */}
            <Card className="bg-[#1a1f26] border-gray-800" data-testid="widget-pipeline">
              <CardHeader className="pb-3 border-b border-gray-800">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-semibold text-white">Inspection Pipeline</CardTitle>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => navigate('/projects')}
                    className="text-orange-500 hover:text-orange-400 hover:bg-orange-500/10 -mr-2"
                    data-testid="button-view-all-projects"
                  >
                    View All
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-4">
                {isLoading ? (
                  <Skeleton className="h-[200px] w-full" />
                ) : (
                  <div className="space-y-4" data-testid="pipeline-chart">
                    {pipelineData.map((stage, idx) => (
                      <div key={stage.name} className="flex items-center gap-3">
                        <div className="w-24 text-sm text-gray-400">{stage.name}</div>
                        <div className="flex-1 h-8 bg-gray-800 rounded-lg overflow-hidden">
                          <div 
                            className="h-full rounded-lg flex items-center justify-end pr-2 transition-all duration-500"
                            style={{ 
                              width: `${Math.max((stage.value / Math.max(...pipelineData.map(d => d.value), 1)) * 100, stage.value > 0 ? 15 : 0)}%`,
                              backgroundColor: stage.fill
                            }}
                          >
                            {stage.value > 0 && (
                              <span className="text-xs font-bold text-white">{stage.value}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                    
                    {/* Total indicator */}
                    <div className="pt-3 border-t border-gray-800 flex items-center justify-between">
                      <span className="text-sm text-gray-400">Total Pipeline</span>
                      <span className="text-xl font-bold text-white">
                        {pipelineData.reduce((sum, d) => sum + d.value, 0)}
                      </span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Monthly Trend */}
            <Card className="bg-[#1a1f26] border-gray-800" data-testid="widget-trend">
              <CardHeader className="pb-3 border-b border-gray-800">
                <CardTitle className="text-lg font-semibold text-white">Monthly Trend</CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                {isLoading ? (
                  <Skeleton className="h-[200px] w-full" />
                ) : (
                  <ResponsiveContainer width="100%" height={200}>
                    <AreaChart data={monthlyTrendData}>
                      <defs>
                        <linearGradient id="inspectionsGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#f97316" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="reportsGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <XAxis 
                        dataKey="month" 
                        axisLine={false} 
                        tickLine={false}
                        tick={{ fill: '#6b7280', fontSize: 12 }}
                      />
                      <YAxis 
                        axisLine={false} 
                        tickLine={false}
                        tick={{ fill: '#6b7280', fontSize: 12 }}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#1f2937', 
                          border: '1px solid #374151',
                          borderRadius: '8px'
                        }}
                        labelStyle={{ color: '#fff' }}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="inspections" 
                        stroke="#f97316" 
                        fill="url(#inspectionsGradient)"
                        strokeWidth={2}
                        name="Inspections"
                      />
                      <Area 
                        type="monotone" 
                        dataKey="reports" 
                        stroke="#22c55e" 
                        fill="url(#reportsGradient)"
                        strokeWidth={2}
                        name="Reports"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
                <div className="flex items-center justify-center gap-6 mt-2">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-orange-500" />
                    <span className="text-xs text-gray-400">Inspections</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-green-500" />
                    <span className="text-xs text-gray-400">Reports</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Bottom Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Recent Reports */}
            <Card className="bg-[#1a1f26] border-gray-800" data-testid="widget-recent-reports">
              <CardHeader className="pb-3 border-b border-gray-800">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-semibold text-white">Recent Reports</CardTitle>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => navigate('/reports')}
                    className="text-orange-500 hover:text-orange-400 hover:bg-orange-500/10 -mr-2"
                    data-testid="button-view-all-reports"
                  >
                    View All
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {isLoading ? (
                  <div className="p-4 space-y-3">
                    {[1, 2, 3].map(i => (
                      <Skeleton key={i} className="h-16 w-full" />
                    ))}
                  </div>
                ) : recentReportsData.length > 0 ? (
                  <div className="divide-y divide-gray-800" data-testid="list-recent-reports">
                    {recentReportsData.map((report: any) => (
                      <div 
                        key={report.id} 
                        className="p-4 hover:bg-gray-800/50 transition-colors"
                        data-testid={`report-row-${report.id}`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-green-500/20 to-green-600/20 flex items-center justify-center">
                              <FileText className="h-5 w-5 text-green-500" />
                            </div>
                            <div>
                              <p className="font-medium text-white">
                                {report.projectName || report.propertyAddress || 'Damage Assessment Report'}
                              </p>
                              <p className="text-sm text-gray-500">
                                {report.clientName || getClientName(report.clientId)} • {formatDate(report.completedDate || report.submissionDate)}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {useDemoData && report.damageScore && (
                              <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30 mr-2">
                                {report.damageScore}% damage
                              </Badge>
                            )}
                            <Button 
                              variant="ghost" 
                              size="sm"
                              className="text-gray-400 hover:text-white hover:bg-gray-700"
                              onClick={() => navigate(`/winn-report/${report.id}`)}
                              data-testid={`button-view-report-${report.id}`}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              className="text-gray-400 hover:text-white hover:bg-gray-700"
                              data-testid={`button-download-report-${report.id}`}
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 text-center">
                    <FileText className="h-10 w-10 text-gray-600 mx-auto mb-3" />
                    <p className="text-gray-400 mb-3">No reports yet</p>
                    <Button 
                      size="sm" 
                      onClick={() => navigate('/upload')}
                      className="bg-orange-500 hover:bg-orange-600"
                      data-testid="button-start-assessment"
                    >
                      Start Assessment
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Upcoming Inspections */}
            <Card className="bg-[#1a1f26] border-gray-800" data-testid="widget-upcoming">
              <CardHeader className="pb-3 border-b border-gray-800">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-semibold text-white">Upcoming Inspections</CardTitle>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => navigate('/schedule')}
                    className="text-orange-500 hover:text-orange-400 hover:bg-orange-500/10 -mr-2"
                    data-testid="button-schedule"
                  >
                    Schedule
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {isLoading ? (
                  <div className="p-4 space-y-3">
                    {[1, 2, 3].map(i => (
                      <Skeleton key={i} className="h-16 w-full" />
                    ))}
                  </div>
                ) : upcomingInspections.length > 0 ? (
                  <div className="divide-y divide-gray-800" data-testid="list-upcoming-inspections">
                    {upcomingInspections.map((inspection: any) => (
                      <div 
                        key={inspection.id} 
                        className="p-4 hover:bg-gray-800/50 transition-colors"
                        data-testid={`inspection-row-${inspection.id}`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-blue-500/20 to-blue-600/20 flex items-center justify-center">
                              <Calendar className="h-5 w-5 text-blue-500" />
                            </div>
                            <div>
                              <p className="font-medium text-white">
                                {inspection.address || inspection.propertyAddress || inspection.name}
                              </p>
                              <p className="text-sm text-gray-500">
                                {inspection.clientName || getClientName(inspection.clientId)}
                                {inspection.time && <span className="ml-2 text-blue-400">• {inspection.time}</span>}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium text-orange-400">
                              {formatDate(inspection.inspectionDate)}
                            </p>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              className="text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 mt-1 h-7 px-2"
                              onClick={() => navigate(`/inspection/${inspection.id}`)}
                              data-testid={`button-start-inspection-${inspection.id}`}
                            >
                              <Play className="h-3 w-3 mr-1" />
                              Start
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 text-center">
                    <Calendar className="h-10 w-10 text-gray-600 mx-auto mb-3" />
                    <p className="text-gray-400 mb-3">No upcoming inspections</p>
                    <Button 
                      size="sm" 
                      onClick={() => navigate('/schedule')}
                      className="bg-orange-500 hover:bg-orange-600"
                      data-testid="button-schedule-inspection"
                    >
                      Schedule Inspection
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions Row */}
          <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card 
              className="bg-gradient-to-br from-orange-500/10 to-orange-600/5 border-orange-500/20 hover:border-orange-500/40 transition-all cursor-pointer group"
              onClick={() => navigate('/reports')}
              data-testid="card-winn-report"
            >
              <CardContent className="p-4 flex items-center gap-3">
                <div className="p-2 bg-orange-500/20 rounded-lg group-hover:bg-orange-500/30 transition-colors">
                  <FileText className="h-5 w-5 text-orange-500" />
                </div>
                <div>
                  <p className="font-medium text-white text-sm">View Reports</p>
                  <p className="text-xs text-gray-500">Assessment reports</p>
                </div>
              </CardContent>
            </Card>

            <Card 
              className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/20 hover:border-blue-500/40 transition-all cursor-pointer group"
              onClick={() => navigate('/training')}
              data-testid="card-training"
            >
              <CardContent className="p-4 flex items-center gap-3">
                <div className="p-2 bg-blue-500/20 rounded-lg group-hover:bg-blue-500/30 transition-colors">
                  <ClipboardCheck className="h-5 w-5 text-blue-500" />
                </div>
                <div>
                  <p className="font-medium text-white text-sm">Training Portal</p>
                  <p className="text-xs text-gray-500">Certifications</p>
                </div>
              </CardContent>
            </Card>

            <Card 
              className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border-purple-500/20 hover:border-purple-500/40 transition-all cursor-pointer group"
              onClick={() => navigate('/crm-integrations')}
              data-testid="card-crm"
            >
              <CardContent className="p-4 flex items-center gap-3">
                <div className="p-2 bg-purple-500/20 rounded-lg group-hover:bg-purple-500/30 transition-colors">
                  <Users className="h-5 w-5 text-purple-500" />
                </div>
                <div>
                  <p className="font-medium text-white text-sm">CRM Integration</p>
                  <p className="text-xs text-gray-500">Connect systems</p>
                </div>
              </CardContent>
            </Card>

            <Card 
              className="bg-gradient-to-br from-cyan-500/10 to-cyan-600/5 border-cyan-500/20 hover:border-cyan-500/40 transition-all cursor-pointer group"
              onClick={() => navigate('/innovation')}
              data-testid="card-innovation"
            >
              <CardContent className="p-4 flex items-center gap-3">
                <div className="p-2 bg-cyan-500/20 rounded-lg group-hover:bg-cyan-500/30 transition-colors">
                  <TrendingUp className="h-5 w-5 text-cyan-500" />
                </div>
                <div>
                  <p className="font-medium text-white text-sm">Innovation Hub</p>
                  <p className="text-xs text-gray-500">Enterprise tools</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      
      <Footer />

      {/* Onboarding Modal */}
      {user && (
        <UserOnboarding
          isOpen={showOnboarding}
          onComplete={handleOnboardingComplete}
          userEmail={user.email || ''}
        />
      )}

      {/* Stormy AI Assistant */}
      {user && <StormyChat contextType="general" />}
    </div>
  );
};

export default Dashboard;
