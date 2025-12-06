import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLocation, useRoute } from 'wouter';
import { Header, Footer } from '@/components/navbar';
import { PropertyCard } from '@/components/property-card';
import { UserOnboarding } from '@/components/user-onboarding';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Property, Project, DamageAssessment } from '@shared/schema';
import { Cloud, FileText, Upload, BarChart3, Users, Briefcase, GraduationCap, AlertTriangle, Mic, BookOpen } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { SEO, breadcrumbSchema } from '@/components/seo';
import winnstormLogo from '@assets/logo-dark_1765042579232.png';

const Dashboard = () => {
  const { user, role } = useAuth();
  const [, navigate] = useLocation();
  const [, params] = useRoute('/dashboard');
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

  const handleOnboardingComplete = () => {
    if (user) {
      localStorage.setItem(`onboarding_completed_${user.uid}`, 'true');
    }
    setShowOnboarding(false);
  };

  // Fetch properties and projects
  const { data: properties, isLoading } = useQuery<Property[]>({
    queryKey: ['/api/properties'],
  });

  // Stats calculation for WinnStorm™ dashboard
  const stats = {
    activeProjects: properties?.length || 0,
    completedAssessments: properties?.length || 0,
    avgCondition: properties && properties.length > 0 
      ? 'Good'
      : 'N/A',
    certificationLevel: 'Junior',
    scans: '—',
    reports: '—',
    avgScore: '—'
  };

  return (
    <div className="min-h-screen flex flex-col relative bg-background text-foreground">
      <SEO
        title="Dashboard"
        description="Manage your damage assessment projects, track inspections, and view certification progress. Access thermal analysis tools and generate comprehensive Winn Reports."
        canonical="/dashboard"
        noindex={true}
        structuredData={breadcrumbSchema([
          { name: 'Home', url: '/' },
          { name: 'Dashboard', url: '/dashboard' }
        ])}
      />
      <Header />
      
      <main className="flex-grow pb-20">
        <div className="p-6">
          

          {/* Dashboard Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <Card className="bg-gradient-to-br from-card to-primary/5 border-primary/20">
              <CardContent className="p-4">
                <div className="flex items-center">
                  <div className="p-2 bg-gradient-to-br from-primary/20 to-cyan-500/20 rounded-lg">
                    <Briefcase className="h-6 w-6 text-primary" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-muted-foreground">Active Projects</p>
                    <p className="text-2xl font-bold text-primary">{stats.activeProjects}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-to-br from-card to-cyan-500/5 border-cyan-500/20">
              <CardContent className="p-4">
                <div className="flex items-center">
                  <div className="p-2 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 rounded-lg">
                    <FileText className="h-6 w-6 text-cyan-500" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-muted-foreground">Assessments</p>
                    <p className="text-2xl font-bold text-cyan-600">{stats.completedAssessments}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-to-br from-card to-blue-500/5 border-blue-500/20">
              <CardContent className="p-4">
                <div className="flex items-center">
                  <div className="p-2 bg-gradient-to-br from-blue-500/20 to-primary/20 rounded-lg">
                    <BarChart3 className="h-6 w-6 text-blue-500" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-muted-foreground">Avg. Condition</p>
                    <p className="text-2xl font-bold text-blue-600">{stats.avgCondition}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-to-br from-card to-primary/5 border-primary/20">
              <CardContent className="p-4">
                <div className="flex items-center">
                  <div className="p-2 bg-gradient-to-br from-primary/20 to-cyan-500/20 rounded-lg">
                    <GraduationCap className="h-6 w-6 text-primary" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-muted-foreground">Certification</p>
                    <p className="text-lg font-bold text-primary">{stats.certificationLevel}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <div className="mb-8">
            <h3 className="text-xl font-semibold mb-4">Quick Actions</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Button 
                onClick={() => navigate('/upload')} 
                className="bg-gradient-to-br from-primary to-cyan-500 hover:from-primary/90 hover:to-cyan-500/90 text-white p-4 h-auto flex flex-col items-center shadow-lg border-0"
              >
                <Upload className="h-6 w-6 mb-2" />
                <span>New Assessment</span>
              </Button>
              
              <Button 
                variant="outline" 
                className="p-4 h-auto flex flex-col items-center border-primary/30 hover:bg-primary/10 hover:border-primary/50"
                onClick={() => navigate('/training')}
              >
                <GraduationCap className="h-6 w-6 mb-2 text-primary" />
                <span>Training Portal</span>
              </Button>
              
              <Button 
                variant="outline" 
                className="p-4 h-auto flex flex-col items-center border-cyan-500/30 hover:bg-cyan-500/10 hover:border-cyan-500/50"
                onClick={() => navigate('/projects')}
              >
                <Briefcase className="h-6 w-6 mb-2 text-cyan-500" />
                <span>Manage Projects</span>
              </Button>
              
              <Button 
                variant="outline" 
                className="p-4 h-auto flex flex-col items-center border-blue-500/30 hover:bg-blue-500/10 hover:border-blue-500/50"
                onClick={() => navigate('/crm-integrations')}
              >
                <Users className="h-6 w-6 mb-2 text-blue-500" />
                <span>CRM Integration</span>
              </Button>
              
              <Button 
                variant="outline" 
                className="p-4 h-auto flex flex-col items-center border-purple-500/30 hover:bg-purple-500/10 hover:border-purple-500/50"
                onClick={() => navigate('/transcripts')}
                data-testid="button-transcripts"
              >
                <Mic className="h-6 w-6 mb-2 text-purple-500" />
                <span>Transcripts</span>
              </Button>
            </div>
          </div>

          {/* Recent Projects & Assessments */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold">Recent Projects</h3>
              <Button variant="outline" onClick={() => navigate('/projects')}>
                View All Projects
              </Button>
            </div>

            {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <Card>
                <Skeleton className="h-48 w-full" />
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <Skeleton className="h-6 w-1/3" />
                    <Skeleton className="h-6 w-1/4" />
                  </div>
                  <Skeleton className="h-4 w-2/3 mb-3" />
                  <div className="flex items-center justify-between">
                    <Skeleton className="h-4 w-1/3" />
                    <Skeleton className="h-4 w-1/4" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <Skeleton className="h-48 w-full" />
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <Skeleton className="h-6 w-1/3" />
                    <Skeleton className="h-6 w-1/4" />
                  </div>
                  <Skeleton className="h-4 w-2/3 mb-3" />
                  <div className="flex items-center justify-between">
                    <Skeleton className="h-4 w-1/3" />
                    <Skeleton className="h-4 w-1/4" />
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : properties && properties.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              {properties.map((property) => (
                <PropertyCard key={property.id} property={property} />
              ))}
            </div>
          ) : (
            <Card className="mb-6 border border-border shadow-md">
              <CardContent className="p-6 text-center">
                <p className="text-muted-foreground mb-4">No properties found. Start by adding a new thermal scan.</p>
              </CardContent>
            </Card>
          )}
          </div>

          {/* Action Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            {/* Winn Report Card - Featured */}
            <Card 
              className="bg-gradient-to-br from-primary/20 to-secondary/20 border-2 border-primary/30 cursor-pointer shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
              onClick={() => navigate('/winn-report/1')}
            >
              <CardContent className="p-6 text-center">
                <div className="bg-primary/20 p-4 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <FileText className="h-8 w-8 text-primary" />
                </div>
                <h3 className="font-bold text-foreground mb-2">Create Winn Report</h3>
                <p className="text-muted-foreground text-sm mb-3">Generate comprehensive 300+ page inspection report</p>
                <div className="flex justify-center space-x-1">
                  <span className="text-xs bg-primary/20 text-primary px-2 py-1 rounded-full">
                    Blockchain
                  </span>
                  <span className="text-xs bg-secondary/20 text-secondary px-2 py-1 rounded-full">
                    Digital Title
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* New Scan Card */}
            <Card 
              className="bg-card border border-border hover:border-secondary transition-colors cursor-pointer shadow-md"
              onClick={() => navigate('/upload')}
            >
              <CardContent className="p-6 text-center">
                <div className="bg-secondary/20 p-4 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <Upload className="h-8 w-8 text-secondary" />
                </div>
                <h3 className="font-bold text-foreground mb-2">Upload New Scan</h3>
                <p className="text-muted-foreground text-sm">Upload thermal images for analysis</p>
              </CardContent>
            </Card>

            {/* View Reports Card */}
            <Card 
              className="bg-card border border-border hover:border-accent transition-colors cursor-pointer shadow-md"
              onClick={() => navigate('/reports')}
            >
              <CardContent className="p-6 text-center">
                <div className="bg-accent/20 p-4 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <BarChart3 className="h-8 w-8 text-accent" />
                </div>
                <h3 className="font-bold text-foreground mb-2">View Reports</h3>
                <p className="text-muted-foreground text-sm">Access all damage assessment reports</p>
              </CardContent>
            </Card>
          </div>

          {/* Quick Stats */}
          {!isLoading && (
            <Card className="bg-card border border-border shadow-md">
              <CardContent className="p-5">
                <h3 className="font-bold text-foreground mb-4">Monthly Overview</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-3 bg-background rounded-lg">
                    <p className="text-2xl font-bold text-primary">{stats.scans}</p>
                    <p className="text-muted-foreground text-sm mt-1">Scans</p>
                  </div>
                  <div className="text-center p-3 bg-background rounded-lg">
                    <p className="text-2xl font-bold text-secondary">{stats.reports}</p>
                    <p className="text-muted-foreground text-sm mt-1">Reports</p>
                  </div>
                  <div className="text-center p-3 bg-background rounded-lg">
                    <p className="text-2xl font-bold text-accent">{stats.avgScore}</p>
                    <p className="text-muted-foreground text-sm mt-1">Avg Score</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
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
    </div>
  );
};

export default Dashboard;
