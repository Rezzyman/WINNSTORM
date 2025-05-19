import { useEffect } from 'react';
import { useParams, useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { Header, Footer } from '@/components/navbar';
import { ThermalSlider } from '@/components/thermal-slider';
import { 
  Card, 
  CardContent 
} from '@/components/ui/card';
import { 
  Button 
} from '@/components/ui/button';
import {
  ArrowLeft,
  FileText,
  Share,
  AlertTriangle,
  Info,
  Lightbulb
} from 'lucide-react';
import { Property, Scan } from '@shared/schema';
import { Skeleton } from '@/components/ui/skeleton';

const Analysis = () => {
  const params = useParams();
  const [, navigate] = useLocation();
  const scanId = params.id;

  const { data: scan, isLoading: isScanLoading } = useQuery<Scan>({
    queryKey: [`/api/scans/${scanId}`],
  });

  const { data: property, isLoading: isPropertyLoading } = useQuery<Property>({
    queryKey: [`/api/properties/${scan?.propertyId}`],
    enabled: !!scan?.propertyId,
  });

  const isLoading = isScanLoading || isPropertyLoading;

  const getScoreColor = (score: number) => {
    if (score >= 80) return "border-success bg-success bg-opacity-5";
    if (score >= 60) return "border-warning bg-warning bg-opacity-5";
    return "border-destructive bg-destructive bg-opacity-5";
  };

  const getScoreBadgeColor = (score: number) => {
    if (score >= 80) return "border-4 border-success text-success";
    if (score >= 60) return "border-4 border-warning text-warning";
    return "border-4 border-destructive text-destructive";
  };

  const getScoreStatusText = (score: number) => {
    if (score >= 80) return "Good";
    if (score >= 60) return "Warning";
    return "Critical";
  };

  const getScoreProgressColor = (score: number) => {
    if (score >= 80) return "bg-success";
    if (score >= 60) return "bg-warning";
    return "bg-destructive";
  };

  const getIssueIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <AlertTriangle className="text-destructive mr-2" />;
      case 'warning':
        return <Info className="text-warning mr-2" />;
      default:
        return <Lightbulb className="text-neutral-dark mr-2" />;
    }
  };

  const getIssueBorderColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return "border-l-4 border-destructive";
      case 'warning':
        return "border-l-4 border-warning";
      default:
        return "border-l-4 border-neutral-dark";
    }
  };

  return (
    <div className="min-h-screen flex flex-col relative">
      <Header />
      
      <main className="flex-grow pb-20">
        <div className="p-4">
          <div className="flex items-center mb-4">
            <button className="mr-2" onClick={() => navigate('/dashboard')}>
              <ArrowLeft className="text-neutral-dark" />
            </button>
            <div>
              <h2 className="text-xl font-semibold text-neutral-darker">Thermal Analysis</h2>
              {isLoading ? (
                <Skeleton className="h-5 w-48" />
              ) : (
                <p className="text-neutral-dark text-sm">
                  {property?.name} - {property?.address}
                </p>
              )}
            </div>
          </div>

          {/* Score Card */}
          <Card className="mb-6">
            <CardContent className="p-4">
              {isLoading ? (
                <>
                  <div className="flex items-center justify-between mb-4">
                    <Skeleton className="h-6 w-48" />
                    <Skeleton className="h-12 w-12 rounded-full" />
                  </div>
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <div key={i}>
                        <div className="flex justify-between mb-1">
                          <Skeleton className="h-5 w-36" />
                          <Skeleton className="h-5 w-12" />
                        </div>
                        <Skeleton className="h-2 w-full rounded-full" />
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-neutral-darker">Roof Health Score</h3>
                    {/* Health Score Indicator */}
                    <div className="flex items-center">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center ${getScoreBadgeColor(scan?.healthScore || 0)}`}>
                        <span className="text-lg font-bold">{scan?.healthScore}</span>
                      </div>
                      <span className={`ml-2 px-2 py-1 ${
                        scan?.healthScore && scan.healthScore >= 80 
                          ? "bg-success bg-opacity-10 text-success" 
                          : scan?.healthScore && scan.healthScore >= 60
                            ? "bg-warning bg-opacity-10 text-warning"
                            : "bg-destructive bg-opacity-10 text-destructive"
                      } text-xs font-medium rounded-full`}>
                        {getScoreStatusText(scan?.healthScore || 0)}
                      </span>
                    </div>
                  </div>

                  {/* Score Breakdown */}
                  <div className="space-y-3">
                    {scan?.metrics?.map((metric, index) => (
                      <div key={index}>
                        <div className="flex justify-between mb-1">
                          <span className="text-sm font-medium text-neutral-darker">{metric.name}</span>
                          <span className={`text-sm font-medium ${
                            metric.value >= 80 ? "text-success" : 
                            metric.value >= 60 ? "text-warning" : 
                            "text-destructive"
                          }`}>
                            {metric.value}%
                          </span>
                        </div>
                        <div className="w-full bg-neutral-medium rounded-full h-2">
                          <div className={`${getScoreProgressColor(metric.value)} h-2 rounded-full`} style={{ width: `${metric.value}%` }}></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Thermal Imaging Analysis */}
          <Card className="mb-6">
            <CardContent className="p-4">
              <h3 className="font-semibold text-neutral-darker mb-3">Thermal Analysis</h3>
              
              {isLoading ? (
                <>
                  <Skeleton className="w-full h-64 rounded-lg mb-4" />
                  <div className="flex justify-between mb-2">
                    <Skeleton className="h-5 w-24" />
                    <Skeleton className="h-5 w-24" />
                  </div>
                  <Skeleton className="w-full h-8 rounded-lg" />
                </>
              ) : (
                scan && (
                  <ThermalSlider 
                    standardImage={scan.standardImageUrl} 
                    thermalImage={scan.thermalImageUrl}
                    alt={`Thermal scan of ${property?.name}`}
                  />
                )
              )}
            </CardContent>
          </Card>

          {/* Detected Issues */}
          <Card className="mb-6">
            <CardContent className="p-4">
              <h3 className="font-semibold text-neutral-darker mb-3">Detected Issues</h3>
              
              {isLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="w-full h-24 rounded-lg" />
                  ))}
                </div>
              ) : scan?.issues?.length ? (
                <div className="space-y-3">
                  {scan.issues.map((issue, index) => (
                    <div 
                      key={index} 
                      className={`${getIssueBorderColor(issue.severity)} p-3 ${
                        issue.severity === 'critical' 
                          ? 'bg-destructive bg-opacity-5' 
                          : issue.severity === 'warning'
                            ? 'bg-warning bg-opacity-5'
                            : 'bg-neutral-light'
                      } rounded-r-lg`}
                    >
                      <div className="flex items-start">
                        {getIssueIcon(issue.severity)}
                        <div>
                          <h4 className="font-medium text-neutral-darker">{issue.title}</h4>
                          <p className="text-sm text-neutral-dark">{issue.description}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center p-4 text-neutral-dark">
                  No issues detected in this scan.
                </div>
              )}
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="grid grid-cols-2 gap-4">
            <Button
              className="bg-primary hover:bg-primary-light text-white font-medium py-3 px-4 rounded-lg transition flex items-center justify-center"
              onClick={() => navigate(`/report/${scanId}`)}
            >
              <FileText className="mr-2 h-5 w-5" />
              Generate Report
            </Button>
            <Button
              variant="outline"
              className="bg-white border border-neutral-medium hover:bg-neutral-light text-neutral-darker font-medium py-3 px-4 rounded-lg transition flex items-center justify-center"
            >
              <Share className="mr-2 h-5 w-5" />
              Share Analysis
            </Button>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default Analysis;
