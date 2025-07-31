import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLocation, useRoute } from 'wouter';
import { Header, Footer } from '@/components/navbar';
import { PropertyCard } from '@/components/property-card';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Property, Project, DamageAssessment } from '@shared/schema';
import { Cloud, FileText, Upload, BarChart3, Users, Briefcase, GraduationCap, AlertTriangle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

const Dashboard = () => {
  const { user, role } = useAuth();
  const [, navigate] = useLocation();
  const [, params] = useRoute('/dashboard');
  
  // Redirect to login if not authenticated
  useEffect(() => {
    if (!user) {
      navigate('/');
    }
  }, [user, navigate]);

  // Fetch properties and projects
  const { data: properties, isLoading } = useQuery<Property[]>({
    queryKey: ['/api/properties'],
  });

  // Stats calculation for WinnStorm™ dashboard
  const stats = {
    activeProjects: properties?.length || 0,
    completedAssessments: properties?.length || 0, // Will be replaced with actual assessment data
    avgCondition: properties && properties.length > 0 
      ? 'Good' // Will be calculated from actual assessments
      : 'N/A',
    certificationLevel: user?.certificationLevel || 'Junior'
  };

  return (
    <div className="min-h-screen flex flex-col relative bg-background text-foreground">
      <Header />
      
      <main className="flex-grow pb-20">
        <div className="p-6">
          {/* WinnStorm™ Dashboard Header */}
          <div className="mb-8">
            <div className="flex items-center mb-4">
              <Cloud className="h-8 w-8 text-blue-500 mr-3" />
              <div>
                <h1 className="text-3xl font-bold text-foreground">WinnStorm™</h1>
                <p className="text-muted-foreground text-sm">Damage Assessment Platform</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="bg-blue-500/10 px-3 py-1 rounded-full">
                <span className="text-blue-400 text-sm font-medium">{stats.certificationLevel} Consultant</span>
              </div>
              <div className="text-muted-foreground text-sm">
                Welcome back, {user?.firstName || user?.email}
              </div>
            </div>
          </div>

          {/* Dashboard Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center">
                  <Briefcase className="h-8 w-8 text-blue-500 mr-3" />
                  <div>
                    <p className="text-sm text-muted-foreground">Active Projects</p>
                    <p className="text-2xl font-bold">{stats.activeProjects}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center">
                  <FileText className="h-8 w-8 text-green-500 mr-3" />
                  <div>
                    <p className="text-sm text-muted-foreground">Assessments</p>
                    <p className="text-2xl font-bold">{stats.completedAssessments}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center">
                  <BarChart3 className="h-8 w-8 text-orange-500 mr-3" />
                  <div>
                    <p className="text-sm text-muted-foreground">Avg. Condition</p>
                    <p className="text-2xl font-bold">{stats.avgCondition}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center">
                  <GraduationCap className="h-8 w-8 text-purple-500 mr-3" />
                  <div>
                    <p className="text-sm text-muted-foreground">Certification</p>
                    <p className="text-lg font-bold">{stats.certificationLevel}</p>
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
                className="bg-blue-600 hover:bg-blue-700 text-white p-4 h-auto flex flex-col items-center"
              >
                <Upload className="h-6 w-6 mb-2" />
                <span>New Assessment</span>
              </Button>
              
              <Button 
                variant="outline" 
                className="p-4 h-auto flex flex-col items-center"
                onClick={() => navigate('/training')}
              >
                <GraduationCap className="h-6 w-6 mb-2" />
                <span>Training Portal</span>
              </Button>
              
              <Button 
                variant="outline" 
                className="p-4 h-auto flex flex-col items-center"
                onClick={() => navigate('/projects')}
              >
                <Briefcase className="h-6 w-6 mb-2" />
                <span>Manage Projects</span>
              </Button>
              
              <Button 
                variant="outline" 
                className="p-4 h-auto flex flex-col items-center"
                onClick={() => navigate('/crm-integrations')}
              >
                <Users className="h-6 w-6 mb-2" />
                <span>CRM Integration</span>
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
            <Card className="bg-card border border-border hover:border-accent transition-colors cursor-pointer shadow-md">
              <CardContent className="p-6 text-center">
                <div className="bg-accent/20 p-4 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <BarChart3 className="h-8 w-8 text-accent" />
                </div>
                <h3 className="font-bold text-foreground mb-2">Analytics</h3>
                <p className="text-muted-foreground text-sm">View insights and trends</p>
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
    </div>
  );
};

export default Dashboard;
