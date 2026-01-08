import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { Header, Footer } from '@/components/navbar';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Project } from '@shared/schema';
import { 
  Briefcase, 
  Plus, 
  Search, 
  Filter, 
  Calendar, 
  FileText,
  Clock,
  CheckCircle,
  AlertTriangle,
  Eye
} from 'lucide-react';
import { SEO, breadcrumbSchema } from '@/components/seo';

const Projects = () => {
  const { user, role, loading: authLoading } = useAuth();
  const [, navigate] = useLocation();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/');
    }
  }, [user, authLoading, navigate]);

  // Fetch real projects from database
  const { data: projects, isLoading, error, refetch } = useQuery<Project[]>({
    queryKey: ['/api/projects'],
    enabled: !!user,
  });

  // Show loading during auth resolution or data fetch
  const showLoading = authLoading || (!!user && isLoading);

  // Transform projects for display
  const displayProjects = (projects || []).map(project => ({
    id: project.id,
    projectId: project.projectId,
    name: project.propertyAddress,
    address: project.propertyAddress,
    lossType: project.lossType,
    status: project.status,
    dateOfLoss: project.dateOfLoss ? new Date(project.dateOfLoss) : null,
    inspectionDate: project.inspectionDate ? new Date(project.inspectionDate) : null,
    estimatedValue: project.estimatedValue,
    approvedAmount: project.approvedAmount
  }));

  // Filter projects
  const filteredProjects = displayProjects.filter(project => {
    const matchesSearch = project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         project.projectId.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         project.lossType.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || project.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'prospecting': return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
      case 'inspection_scheduled': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
      case 'report_draft': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'submitted_to_insurance': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400';
      case 'approved': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'denied': return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      case 'completed': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  return (
    <div className="min-h-screen flex flex-col relative bg-background text-foreground">
      <SEO
        title="Project Management"
        description="Manage damage assessment projects, track client progress, and coordinate inspections. Comprehensive project management for property consultants."
        canonical="/projects"
        noindex={true}
        structuredData={breadcrumbSchema([
          { name: 'Home', url: '/' },
          { name: 'Projects', url: '/projects' }
        ])}
      />
      <Header />
      
      <main className="flex-grow pb-20">
        <div className="p-6">
          {/* Projects Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center">
                <div className="p-3 bg-gradient-to-br from-orange-500/20 to-orange-400/20 rounded-xl">
                  <Briefcase className="h-8 w-8 text-orange-500" />
                </div>
                <div className="ml-4">
                  <h1 className="text-3xl font-bold text-orange-500">
                    Project Management
                  </h1>
                  <p className="text-muted-foreground">Manage damage assessment projects and clients</p>
                </div>
              </div>
              
              <Button className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700" data-testid="btn-new-project">
                <Plus className="h-4 w-4 mr-2" />
                New Project
              </Button>
            </div>

            {/* Filters and Search */}
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search projects..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                  data-testid="input-search-projects"
                />
              </div>
              
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-[200px]" data-testid="status-filter">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Projects</SelectItem>
                  <SelectItem value="prospecting">Prospecting</SelectItem>
                  <SelectItem value="inspection_scheduled">Inspection Scheduled</SelectItem>
                  <SelectItem value="report_draft">Report Draft</SelectItem>
                  <SelectItem value="submitted_to_insurance">Submitted</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Project Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6" data-testid="project-stats">
              <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
                <CardContent className="p-4">
                  <div className="flex items-center">
                    <Briefcase className="h-5 w-5 text-primary mr-2" />
                    <div>
                      <p className="text-sm text-muted-foreground">Total Projects</p>
                      <p className="text-2xl font-bold text-primary" data-testid="stat-total-projects">{displayProjects.length}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-gradient-to-br from-gray-500/5 to-gray-500/10 border-gray-500/20">
                <CardContent className="p-4">
                  <div className="flex items-center">
                    <Clock className="h-5 w-5 text-gray-500 mr-2" />
                    <div>
                      <p className="text-sm text-muted-foreground">In Progress</p>
                      <p className="text-2xl font-bold text-gray-600 dark:text-gray-400" data-testid="stat-in-progress">
                        {displayProjects.filter(p => !['completed', 'approved', 'denied'].includes(p.status)).length}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-gradient-to-br from-orange-500/5 to-orange-500/10 border-orange-500/20">
                <CardContent className="p-4">
                  <div className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-orange-500 mr-2" />
                    <div>
                      <p className="text-sm text-muted-foreground">Completed</p>
                      <p className="text-2xl font-bold text-orange-600" data-testid="stat-completed">
                        {displayProjects.filter(p => p.status === 'completed' || p.status === 'approved').length}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-gradient-to-br from-orange-400/5 to-orange-400/10 border-orange-400/20">
                <CardContent className="p-4">
                  <div className="flex items-center">
                    <FileText className="h-5 w-5 text-orange-400 mr-2" />
                    <div>
                      <p className="text-sm text-muted-foreground">Total Value</p>
                      <p className="text-2xl font-bold text-orange-400" data-testid="stat-total-value">
                        ${((displayProjects.reduce((sum, p) => sum + (p.estimatedValue || 0), 0)) / 100).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Projects List */}
          <div className="space-y-4" data-testid="projects-list">
            {showLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <Card key={i} className="animate-pulse">
                    <CardContent className="p-6">
                      <div className="h-4 bg-muted rounded w-1/4 mb-2"></div>
                      <div className="h-3 bg-muted rounded w-1/2 mb-2"></div>
                      <div className="h-3 bg-muted rounded w-1/3"></div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : error ? (
              <Card className="border-destructive">
                <CardContent className="p-12 text-center">
                  <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Failed to load projects</h3>
                  <p className="text-muted-foreground mb-4">
                    There was an error loading your projects. Please try again.
                  </p>
                  <Button variant="outline" onClick={() => refetch()} data-testid="btn-retry">
                    Try Again
                  </Button>
                </CardContent>
              </Card>
            ) : filteredProjects.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <Briefcase className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No projects found</h3>
                  <p className="text-muted-foreground mb-4">
                    {searchTerm || statusFilter !== 'all' 
                      ? "Try adjusting your search or filters" 
                      : "Create your first project to get started"}
                  </p>
                  <Button className="bg-gradient-to-r from-orange-500 to-orange-600" data-testid="btn-create-project-empty">
                    <Plus className="h-4 w-4 mr-2" />
                    Create Project
                  </Button>
                </CardContent>
              </Card>
            ) : (
              filteredProjects.map((project) => (
                <Card key={project.id} className="hover:shadow-md transition-shadow cursor-pointer" data-testid={`project-card-${project.id}`}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <span className="text-xs font-mono text-muted-foreground bg-muted px-2 py-1 rounded" data-testid={`project-id-${project.id}`}>
                            {project.projectId}
                          </span>
                          <Badge className={getStatusColor(project.status)} data-testid={`project-status-${project.id}`}>
                            {project.status.replace(/_/g, ' ')}
                          </Badge>
                          <Badge variant="outline" className="capitalize">
                            {project.lossType}
                          </Badge>
                        </div>
                        
                        <h3 className="text-lg font-semibold mb-3" data-testid={`project-address-${project.id}`}>{project.address}</h3>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                          <div className="flex items-center text-sm text-muted-foreground">
                            <AlertTriangle className="h-4 w-4 mr-2 text-orange-500" />
                            <span>Loss Date: {project.dateOfLoss ? project.dateOfLoss.toLocaleDateString() : 'N/A'}</span>
                          </div>
                          <div className="flex items-center text-sm text-muted-foreground">
                            <Calendar className="h-4 w-4 mr-2" />
                            <span>Inspection: {project.inspectionDate ? project.inspectionDate.toLocaleDateString() : 'Not scheduled'}</span>
                          </div>
                          <div className="flex items-center text-sm text-muted-foreground">
                            <FileText className="h-4 w-4 mr-2" />
                            <span>Est. Value: ${project.estimatedValue ? (project.estimatedValue / 100).toLocaleString() : '0'}</span>
                          </div>
                        </div>
                        
                        {project.approvedAmount && (
                          <div className="flex items-center text-sm text-green-600 font-medium">
                            <CheckCircle className="h-4 w-4 mr-2" />
                            <span>Approved: ${(project.approvedAmount / 100).toLocaleString()}</span>
                          </div>
                        )}
                      </div>
                      
                      <div className="ml-4 flex flex-col space-y-2">
                        <Button
                          size="sm"
                          onClick={() => navigate(`/property/${project.id}`)}
                          data-testid={`btn-view-project-${project.id}`}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          View Details
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigate(`/winn-report/${project.id}`)}
                          data-testid={`btn-generate-report-${project.id}`}
                        >
                          <FileText className="h-4 w-4 mr-2" />
                          Generate Report
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default Projects;