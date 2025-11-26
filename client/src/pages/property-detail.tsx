import { useParams, useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { Header, Footer } from '@/components/navbar';
import { 
  Card, 
  CardContent 
} from '@/components/ui/card';
import { 
  Button 
} from '@/components/ui/button';
import {
  ArrowLeft,
  Camera,
  Share,
  Sparkles
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Property, Scan } from '@shared/schema';
import { Skeleton } from '@/components/ui/skeleton';
import { CrmSync } from '@/components/crm-sync';

const PropertyDetail = () => {
  const params = useParams();
  const [, navigate] = useLocation();
  const propertyId = params.id;

  const { data: property, isLoading } = useQuery<Property>({
    queryKey: [`/api/properties/${propertyId}`],
  });

  const getScoreColor = (score: number) => {
    if (score >= 80) return "bg-success bg-opacity-10 text-success";
    if (score >= 60) return "bg-warning bg-opacity-10 text-warning";
    return "bg-destructive bg-opacity-10 text-destructive";
  };

  const getChartBarColor = (score: number) => {
    if (score >= 80) return "bg-success";
    if (score >= 60) return "bg-warning";
    return "bg-destructive";
  };

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  // Sort scans by date (newest first)
  const sortedScans = property?.scans?.slice().sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  return (
    <div className="min-h-screen flex flex-col relative">
      <Header />
      
      <main className="flex-grow pb-20">
        {/* Property Header */}
        <div className="relative h-48">
          {isLoading ? (
            <Skeleton className="w-full h-48" />
          ) : (
            <>
              <img 
                src={property?.imageUrl} 
                alt={property?.name} 
                className="w-full h-48 object-cover" 
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black opacity-50"></div>
            </>
          )}
          <button className="absolute top-4 left-4 bg-white bg-opacity-80 p-2 rounded-full" onClick={() => navigate('/dashboard')}>
            <ArrowLeft className="text-neutral-darker" />
          </button>
          <div className="absolute bottom-4 left-4 text-white">
            {isLoading ? (
              <>
                <Skeleton className="h-7 w-48 bg-white bg-opacity-25" />
                <Skeleton className="h-5 w-64 mt-1 bg-white bg-opacity-25" />
              </>
            ) : (
              <>
                <h2 className="text-xl font-semibold">{property?.name}</h2>
                <p className="text-sm">{property?.address}</p>
              </>
            )}
          </div>
        </div>

        <div className="p-4">
          {/* Health Score Card */}
          <Card className="mb-6">
            <CardContent className="p-4">
              {isLoading ? (
                <>
                  <div className="flex justify-between items-center mb-3">
                    <Skeleton className="h-6 w-48" />
                    <Skeleton className="h-6 w-24" />
                  </div>
                  <Skeleton className="h-40 w-full" />
                  <div className="flex justify-between mt-2">
                    {Array(6).fill(0).map((_, i) => (
                      <Skeleton key={i} className="h-4 w-8" />
                    ))}
                  </div>
                </>
              ) : (
                <>
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="font-semibold text-neutral-darker">Roof Health History</h3>
                    <Badge variant="outline" className={getScoreColor(property?.healthScore || 0)}>
                      Current: {property?.healthScore}
                    </Badge>
                  </div>
                  
                  {/* Score History Chart (simplified) */}
                  <div className="h-40 flex items-end space-x-1 mb-2">
                    {property?.scans?.slice(0, 6).reverse().map((scan, index) => (
                      <div 
                        key={index} 
                        className={`${getChartBarColor(scan.healthScore)} rounded-t-sm flex-1`} 
                        style={{ height: `${scan.healthScore}%` }}
                      ></div>
                    ))}
                  </div>
                  
                  <div className="flex justify-between text-xs text-neutral-dark">
                    {property?.scans?.slice(0, 6).reverse().map((scan, index) => (
                      <span key={index}>
                        {new Date(scan.date).toLocaleDateString('en-US', { month: 'short' })}
                      </span>
                    ))}
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Scan History */}
          <h3 className="font-semibold text-neutral-darker mb-3">Scan History</h3>
          
          {isLoading ? (
            <div className="space-y-3 mb-6">
              {[1, 2, 3].map((i) => (
                <Card key={i}>
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <Skeleton className="h-6 w-32 mb-1" />
                        <Skeleton className="h-5 w-48" />
                      </div>
                      <div className="flex flex-col items-end">
                        <Skeleton className="h-6 w-20 mb-1" />
                        <Skeleton className="h-5 w-24" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : sortedScans && sortedScans.length > 0 ? (
            <div className="space-y-3 mb-6">
              {sortedScans.map((scan) => (
                <Card 
                  key={scan.id} 
                  className="cursor-pointer"
                  onClick={() => navigate(`/analysis/${scan.id}`)}
                >
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-medium text-neutral-darker">{formatDate(scan.date)}</h4>
                        <p className="text-sm text-neutral-dark">
                          {scan.scanType === 'drone' ? 'Drone scan' : 'Handheld scan'} 
                          {scan.deviceType ? ` - ${scan.deviceType}` : ''}
                        </p>
                      </div>
                      <div className="flex flex-col items-end">
                        <Badge variant="outline" className={getScoreColor(scan.healthScore)} style={{ marginBottom: '4px' }}>
                          Score: {scan.healthScore}
                        </Badge>
                        <span className="text-sm text-primary">View Analysis →</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="mb-6">
              <CardContent className="p-4 text-center text-neutral-dark">
                No scan history available. Add your first scan.
              </CardContent>
            </Card>
          )}

          {/* CRM Sync Component */}
          {property && sortedScans && sortedScans.length > 0 && (
            <div className="mb-6">
              <CrmSync property={property} scan={sortedScans[0]} />
            </div>
          )}

          {/* Primary Action - Start Inspection */}
          <Button
            className="w-full h-14 mb-4 bg-gradient-to-r from-primary to-cyan-500 hover:from-primary/90 hover:to-cyan-500/90 text-white font-medium rounded-lg transition flex items-center justify-center text-lg"
            onClick={() => navigate(`/inspection/${propertyId}`)}
            data-testid="button-start-inspection"
          >
            <Sparkles className="mr-2 h-6 w-6" />
            Inspect with Stormy
          </Button>

          {/* Secondary Action Buttons */}
          <div className="grid grid-cols-2 gap-4">
            <Button
              className="bg-primary hover:bg-primary-light text-white font-medium py-3 px-4 rounded-lg transition flex items-center justify-center"
              onClick={() => navigate('/upload')}
            >
              <Camera className="mr-2 h-5 w-5" />
              New Scan
            </Button>
            <Button
              variant="outline"
              className="bg-white border border-neutral-medium hover:bg-neutral-light text-neutral-darker font-medium py-3 px-4 rounded-lg transition flex items-center justify-center"
            >
              <Share className="mr-2 h-5 w-5" />
              Share History
            </Button>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default PropertyDetail;
