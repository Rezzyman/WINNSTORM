import { useParams, useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { Header, Footer } from '@/components/navbar';
import { ReportPreview } from '@/components/report-preview';
import {
  ArrowLeft,
} from 'lucide-react';
import { Scan, Property } from '@shared/schema';
import { Skeleton } from '@/components/ui/skeleton';
import { useMutation } from '@tanstack/react-query';
import { apiRequestRaw, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

const Report = () => {
  const params = useParams();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const scanId = params.id;

  const { data: scan, isLoading: isScanLoading } = useQuery<Scan>({
    queryKey: [`/api/scans/${scanId}`],
  });

  const { data: property, isLoading: isPropertyLoading } = useQuery<Property>({
    queryKey: [`/api/properties/${scan?.propertyId}`],
    enabled: !!scan?.propertyId,
  });

  const isLoading = isScanLoading || isPropertyLoading;

  const sendReportMutation = useMutation({
    mutationFn: async (email: string) => {
      const res = await apiRequestRaw('POST', `/api/reports/send/${scanId}`, { email });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/scans/${scanId}`] });
    },
    onError: (error) => {
      toast({
        title: 'Failed to send report',
        description: error.message || 'There was an error sending the report',
        variant: 'destructive',
      });
    }
  });

  const downloadReportMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/reports/download/${scanId}`, {
        method: 'GET',
        credentials: 'include',
      });
      
      if (!res.ok) {
        throw new Error('Failed to download report');
      }
      
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const disposition = res.headers.get('Content-Disposition');
      const filename = disposition?.match(/filename="(.+)"/)?.[1] || 'WinnReport.pdf';
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      return true;
    },
    onSuccess: () => {
      toast({
        title: 'Report downloaded',
        description: 'Your Winn Report PDF has been downloaded successfully.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Failed to download report',
        description: error.message || 'There was an error downloading the report',
        variant: 'destructive',
      });
    }
  });

  const handleSendReport = (email: string) => {
    sendReportMutation.mutate(email);
  };

  const handleDownloadReport = () => {
    downloadReportMutation.mutate();
  };

  return (
    <div className="min-h-screen flex flex-col relative">
      <Header />
      
      <main className="flex-grow pb-20">
        <div className="p-4">
          <div className="flex items-center mb-4">
            <button className="mr-2" onClick={() => navigate(`/analysis/${scanId}`)}>
              <ArrowLeft className="text-neutral-dark" />
            </button>
            <div>
              <h2 className="text-xl font-semibold text-neutral-darker">Report Generator</h2>
              <p className="text-neutral-dark text-sm">Customize and generate client report</p>
            </div>
          </div>

          {isLoading ? (
            <>
              <Skeleton className="w-full h-96 mb-6" />
              <div className="grid grid-cols-2 gap-4">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            </>
          ) : (
            property && scan && (
              <ReportPreview 
                property={property} 
                scan={scan} 
                onSend={handleSendReport}
                onDownload={handleDownloadReport}
              />
            )
          )}
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default Report;
