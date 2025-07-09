import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLocation, useRoute } from 'wouter';
import { Header, Footer } from '@/components/navbar';
import { PropertyCard } from '@/components/property-card';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent } from '@/components/ui/card';
import { Property } from '@shared/schema';
import { Flame, FileText, Upload, BarChart3 } from 'lucide-react';
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

  // Fetch properties
  const { data: properties, isLoading } = useQuery<Property[]>({
    queryKey: ['/api/properties'],
  });

  // Stats calculation
  const stats = {
    scans: properties?.reduce((acc, prop) => acc + prop.scans.length, 0) || 0,
    reports: properties?.reduce((acc, prop) => acc + (prop.reports?.length || 0), 0) || 0,
    avgScore: properties && properties.length > 0 
      ? Math.round(properties.reduce((acc, prop) => acc + prop.healthScore, 0) / properties.length) 
      : 0
  };

  return (
    <div className="min-h-screen flex flex-col relative bg-background text-foreground">
      <Header />
      
      <main className="flex-grow pb-20">
        <div className="p-6">
          <div className="mb-8 flex items-center">
            <img src="/images/white-hot-logo.png" alt="WHITE HOT" className="h-12 mr-3" />
            <div>
              <h2 className="text-2xl font-bold text-foreground">Recent Properties</h2>
              <p className="text-muted-foreground text-sm mt-1">View and manage your thermal scans</p>
            </div>
          </div>

          {/* Property Cards */}
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
