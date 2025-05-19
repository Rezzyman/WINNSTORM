import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Flame, Send, Download } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Property, Scan } from '@shared/schema';

interface ReportPreviewProps {
  property: Property;
  scan: Scan;
  onSend: (email: string) => void;
  onDownload: () => void;
}

export const ReportPreview = ({ property, scan, onSend, onDownload }: ReportPreviewProps) => {
  const { toast } = useToast();
  const [reportTitle, setReportTitle] = useState('Thermal Roof Assessment');
  const [recipientName, setRecipientName] = useState('');
  const [recipientEmail, setRecipientEmail] = useState('');
  const [includes, setIncludes] = useState({
    summary: true,
    findings: true,
    recommendations: true,
    thermalImages: true,
    costEstimates: false
  });

  const handleDownload = () => {
    onDownload();
    toast({
      title: 'Report downloaded successfully!',
      description: 'Your PDF report is ready.',
    });
  };

  const handleSend = () => {
    if (!recipientEmail) {
      toast({
        title: 'Email required',
        description: 'Please enter a recipient email address.',
        variant: 'destructive'
      });
      return;
    }
    
    onSend(recipientEmail);
    toast({
      title: 'Report sent successfully!',
      description: `The report has been sent to ${recipientEmail}.`,
    });
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "bg-success";
    if (score >= 60) return "bg-warning";
    return "bg-destructive";
  };

  return (
    <>
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="border border-neutral-medium rounded-lg p-4 mb-4">
            {/* Report Header (Preview) */}
            <div className="flex justify-between items-center mb-4 pb-4 border-b border-neutral-medium">
              <div>
                <h3 className="font-bold text-primary text-lg">{reportTitle}</h3>
                <p className="text-neutral-dark text-sm">{property.name} - {property.address}</p>
                <p className="text-neutral-dark text-sm">Assessment Date: {formatDate(new Date(scan.date))}</p>
              </div>
              <div className="text-right">
                <div className="flex items-center justify-end">
                  <Flame className="text-secondary mr-1" />
                  <span className="font-semibold text-primary">ThermalRoof</span>
                </div>
                <p className="text-neutral-dark text-xs mt-1">Professional Roofing Intelligence</p>
              </div>
            </div>

            {/* Report Content Preview */}
            <div className="space-y-3 mb-4">
              <div>
                <h4 className="font-semibold text-neutral-darker">Roof Health Score: {scan.healthScore}/100</h4>
                <div className="w-full bg-neutral-medium rounded-full h-2 mt-1">
                  <div className={`${getScoreColor(scan.healthScore)} h-2 rounded-full`} style={{ width: `${scan.healthScore}%` }}></div>
                </div>
                <p className="text-xs text-neutral-dark mt-1">
                  {scan.healthScore >= 80 ? 'Good: No immediate action required' : 
                   scan.healthScore >= 60 ? 'Warning: Maintenance recommended' : 
                   'Critical: Immediate attention required'}
                </p>
              </div>

              {includes.summary && (
                <p className="text-sm text-neutral-dark">
                  Assessment summary and thermal analysis for the commercial property located at {property.address}. 
                  Scan performed on {formatDate(new Date(scan.date))} using {scan.deviceType || 'thermal imaging equipment'}.
                </p>
              )}

              {includes.thermalImages && (
                <div className="w-full rounded-lg overflow-hidden">
                  <img src={scan.thermalImageUrl} alt="Thermal imaging of the roof" className="w-full h-auto" />
                </div>
              )}
              
              {includes.findings && (
                <div>
                  <h4 className="font-semibold text-neutral-darker text-sm">Key Findings:</h4>
                  <ul className="text-sm text-neutral-dark list-disc pl-5 mt-1">
                    {scan.issues.map((issue, index) => (
                      <li key={index}>{issue.description}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Preview pagination */}
            <div className="flex justify-center">
              <span className="text-xs text-neutral-dark">Preview - Page 1 of {includes.costEstimates ? 4 : 3}</span>
            </div>
          </div>

          {/* Report Options */}
          <h3 className="font-semibold text-neutral-darker mb-3">Report Options</h3>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="report-title" className="block text-neutral-darker text-sm font-medium mb-2">
                Report Title
              </Label>
              <Input 
                id="report-title"
                value={reportTitle}
                onChange={(e) => setReportTitle(e.target.value)}
                className="w-full p-3 border border-neutral-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            
            <div>
              <Label className="block text-neutral-darker text-sm font-medium mb-2">
                Include Sections
              </Label>
              <div className="space-y-2">
                <div className="flex items-center">
                  <Checkbox 
                    id="include-summary" 
                    checked={includes.summary}
                    onCheckedChange={(checked) => setIncludes({...includes, summary: !!checked})}
                    className="h-4 w-4 text-primary focus:ring-primary border-neutral-medium rounded" 
                  />
                  <Label htmlFor="include-summary" className="ml-2 block text-sm text-neutral-darker">
                    Executive Summary
                  </Label>
                </div>
                <div className="flex items-center">
                  <Checkbox 
                    id="include-findings" 
                    checked={includes.findings}
                    onCheckedChange={(checked) => setIncludes({...includes, findings: !!checked})}
                    className="h-4 w-4 text-primary focus:ring-primary border-neutral-medium rounded" 
                  />
                  <Label htmlFor="include-findings" className="ml-2 block text-sm text-neutral-darker">
                    Detailed Findings
                  </Label>
                </div>
                <div className="flex items-center">
                  <Checkbox 
                    id="include-recommendations" 
                    checked={includes.recommendations}
                    onCheckedChange={(checked) => setIncludes({...includes, recommendations: !!checked})}
                    className="h-4 w-4 text-primary focus:ring-primary border-neutral-medium rounded" 
                  />
                  <Label htmlFor="include-recommendations" className="ml-2 block text-sm text-neutral-darker">
                    Recommendations
                  </Label>
                </div>
                <div className="flex items-center">
                  <Checkbox 
                    id="include-thermal" 
                    checked={includes.thermalImages}
                    onCheckedChange={(checked) => setIncludes({...includes, thermalImages: !!checked})}
                    className="h-4 w-4 text-primary focus:ring-primary border-neutral-medium rounded" 
                  />
                  <Label htmlFor="include-thermal" className="ml-2 block text-sm text-neutral-darker">
                    Thermal Images & Analysis
                  </Label>
                </div>
                <div className="flex items-center">
                  <Checkbox 
                    id="include-cost" 
                    checked={includes.costEstimates}
                    onCheckedChange={(checked) => setIncludes({...includes, costEstimates: !!checked})}
                    className="h-4 w-4 text-primary focus:ring-primary border-neutral-medium rounded"
                  />
                  <Label htmlFor="include-cost" className="ml-2 block text-sm text-neutral-darker">
                    Cost Estimates
                  </Label>
                </div>
              </div>
            </div>
            
            <div>
              <Label htmlFor="recipient-name" className="block text-neutral-darker text-sm font-medium mb-2">
                Recipient Information
              </Label>
              <Input 
                id="recipient-name"
                value={recipientName}
                onChange={(e) => setRecipientName(e.target.value)}
                placeholder="Recipient Name"
                className="w-full p-3 border border-neutral-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-primary mb-2"
              />
              <Input 
                id="recipient-email"
                type="email"
                value={recipientEmail}
                onChange={(e) => setRecipientEmail(e.target.value)}
                placeholder="Email Address"
                className="w-full p-3 border border-neutral-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Action Buttons */}
      <div className="grid grid-cols-2 gap-4">
        <Button 
          className="bg-primary hover:bg-primary-light text-white font-medium py-3 px-4 rounded-lg transition flex items-center justify-center"
          onClick={handleSend}
        >
          <Send className="mr-2 h-5 w-5" />
          Send Report
        </Button>
        <Button 
          variant="outline"
          className="bg-white border border-neutral-medium hover:bg-neutral-light text-neutral-darker font-medium py-3 px-4 rounded-lg transition flex items-center justify-center"
          onClick={handleDownload}
        >
          <Download className="mr-2 h-5 w-5" />
          Download PDF
        </Button>
      </div>
    </>
  );
};
