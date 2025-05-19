import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLocation, useRoute } from 'wouter';
import { Header, Footer } from '@/components/navbar';
import { PropertyCard } from '@/components/property-card';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent } from '@/components/ui/card';
import { Property } from '@shared/schema';
import { Flame, FileText } from 'lucide-react';
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
    <div className="min-h-screen flex flex-col relative">
      <Header />
      
      <main className="flex-grow pb-20">
        <div className="p-4">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-neutral-darker">Recent Properties</h2>
            <p className="text-neutral-dark text-sm">View and manage your thermal scans</p>
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
            <Card className="mb-6">
              <CardContent className="p-6 text-center">
                <p className="text-neutral-dark mb-4">No properties found. Start by adding a new thermal scan.</p>
              </CardContent>
            </Card>
          )}

          {/* Action Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            {/* New Scan Card */}
            <Card 
              className="bg-primary text-white cursor-pointer"
              onClick={() => navigate('/upload')}
            >
              <CardContent className="p-4">
                <div className="flex items-center">
                  <div className="bg-white bg-opacity-20 p-3 rounded-full">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="h-6 w-6"
                    >
                      <path d="M15 2H9a1 1 0 0 0-1 1v2c0 .6.4 1 1 1h6c.6 0 1-.4 1-1V3c0-.6-.4-1-1-1Z" />
                      <path d="M8 4H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-2" />
                      <path d="M12 11v6" />
                      <path d="M9 14h6" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <h3 className="font-medium text-white">New Thermal Scan</h3>
                    <p className="text-blue-100 text-sm">Upload and analyze new imagery</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* View Reports Card */}
            <Card className="bg-white rounded-lg shadow-sm cursor-pointer">
              <CardContent className="p-4">
                <div className="flex items-center">
                  <div className="bg-secondary bg-opacity-10 p-3 rounded-full">
                    <FileText className="h-6 w-6 text-secondary" />
                  </div>
                  <div className="ml-4">
                    <h3 className="font-medium text-neutral-darker">Reports</h3>
                    <p className="text-neutral-dark text-sm">View previously generated reports</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Stats */}
          {!isLoading && (
            <Card>
              <CardContent className="p-4">
                <h3 className="font-semibold text-neutral-darker mb-3">Monthly Overview</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center">
                    <p className="text-2xl font-semibold text-primary">{stats.scans}</p>
                    <p className="text-neutral-dark text-sm">Scans</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-semibold text-secondary">{stats.reports}</p>
                    <p className="text-neutral-dark text-sm">Reports</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-semibold text-success">{stats.avgScore}</p>
                    <p className="text-neutral-dark text-sm">Avg Score</p>
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
