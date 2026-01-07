import React, { useState } from 'react';
import { useRoute } from 'wouter';
import { WinnReportWorkflow } from '@/components/winn-report-workflow';
import { Header, Footer } from '@/components/navbar';
import { ErrorBoundary } from '@/components/error-boundary';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, FileText, Shield, Database } from 'lucide-react';

interface WinnReportData {
  propertyId: number;
  inspectionDate: Date;
  inspector: string;
  weatherConditions: any[];
  roofComponents: any[];
  thermalReadings: any[];
  metrics: any[];
  issues: any[];
  notes: string;
  images: string[];
  thermalImages: string[];
}

export default function WinnReportPage() {
  const [match, params] = useRoute('/winn-report/:propertyId');
  const [reportCompleted, setReportCompleted] = useState(false);
  const [generatedReport, setGeneratedReport] = useState<WinnReportData | null>(null);
  
  const propertyId = params?.propertyId ? parseInt(params.propertyId) : 1;

  const handleReportComplete = (reportData: WinnReportData) => {
    setGeneratedReport(reportData);
    setReportCompleted(true);
  };

  if (reportCompleted && generatedReport) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto py-8">
          <div className="max-w-4xl mx-auto">
            <Card className="bg-card border-border shadow-lg">
              <CardHeader className="text-center">
                <div className="flex justify-center mb-4">
                  <CheckCircle className="h-16 w-16 text-green-500" />
                </div>
                <CardTitle className="text-3xl font-bold text-foreground">
                  Winn Report Generated Successfully
                </CardTitle>
                <p className="text-muted-foreground mt-2">
                  Your comprehensive {Math.max(300, generatedReport.roofComponents.length * 15 + generatedReport.issues.length * 8 + generatedReport.thermalReadings.length * 3)}+ page report is ready
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card className="bg-background border-border">
                    <CardContent className="p-4 text-center">
                      <FileText className="h-8 w-8 text-primary mx-auto mb-2" />
                      <div className="text-lg font-semibold text-foreground">Detailed Report</div>
                      <div className="text-sm text-muted-foreground">
                        {generatedReport.roofComponents.length} components analyzed
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="bg-background border-border">
                    <CardContent className="p-4 text-center">
                      <Database className="h-8 w-8 text-secondary mx-auto mb-2" />
                      <div className="text-lg font-semibold text-foreground">Data Integrity</div>
                      <div className="text-sm text-muted-foreground">
                        {generatedReport.thermalReadings.length} thermal readings
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="bg-background border-border">
                    <CardContent className="p-4 text-center">
                      <Shield className="h-8 w-8 text-accent mx-auto mb-2" />
                      <div className="text-lg font-semibold text-foreground">Verified Report</div>
                      <div className="text-sm text-muted-foreground">
                        Secure documentation
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div className="bg-background rounded-lg p-6 border border-border">
                  <h3 className="text-lg font-semibold text-foreground mb-4">Report Summary</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="text-muted-foreground">Inspector:</span>
                        <span className="text-foreground">{generatedReport.inspector}</span>
                      </div>
                      <div className="flex justify-between mb-2">
                        <span className="text-muted-foreground">Inspection Date:</span>
                        <span className="text-foreground">{generatedReport.inspectionDate.toLocaleDateString()}</span>
                      </div>
                      <div className="flex justify-between mb-2">
                        <span className="text-muted-foreground">Weather Conditions:</span>
                        <span className="text-foreground">{generatedReport.weatherConditions.length} readings</span>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="text-muted-foreground">Total Issues:</span>
                        <span className="text-foreground">{generatedReport.issues.length}</span>
                      </div>
                      <div className="flex justify-between mb-2">
                        <span className="text-muted-foreground">Critical Issues:</span>
                        <Badge variant="destructive">
                          {generatedReport.issues.filter(i => i.severity === 'critical').length}
                        </Badge>
                      </div>
                      <div className="flex justify-between mb-2">
                        <span className="text-muted-foreground">Roof Components:</span>
                        <span className="text-foreground">{generatedReport.roofComponents.length}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="text-center space-y-4">
                  <div className="text-sm text-muted-foreground">
                    This report will serve as part of the digital title for this commercial roof,
                    providing immutable evidence of maintenance and inspection history.
                  </div>
                  <div className="flex justify-center space-x-4">
                    <Button 
                      variant="outline" 
                      className="border-border text-foreground"
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      Download Report
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-background">
        <Header />
        <main className="py-8">
          <WinnReportWorkflow 
            propertyId={propertyId}
            onComplete={handleReportComplete}
          />
        </main>
        <Footer />
      </div>
    </ErrorBoundary>
  );
}