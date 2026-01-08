import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  RoofComponent, 
  ThermalReading, 
  WeatherCondition, 
  InspectionMetric, 
  DetailedIssue,
  BuildingInformation,
  RoofSystemDetails,
  InspectionSection,
  CostEstimate,
  RoofSection
} from '@shared/schema';
import { Plus, Upload, Camera, MapPin, AlertTriangle, FileText, Database, MessageCircle, X, Sparkles } from 'lucide-react';
import { ThermalAnalysis } from './thermal-analysis';
import { GoogleMapsDrawing } from './google-maps-drawing';
import { AIInspectionAssistant } from './ai-inspection-assistant';
import { MobileWorkflowNav } from './mobile-workflow-nav';
import { EducationalTooltip } from './educational-tooltip';
import { CameraCapture } from './camera-capture';
import { StormyChat } from './stormy-chat';
import { StormyAvatar } from './stormy-avatar';
import { BulkImageAnalysis } from './bulk-image-analysis';

interface WinnReportWorkflowProps {
  propertyId: number;
  onComplete: (reportData: WinnReportData) => void;
}

interface WinnReportData {
  propertyId: number;
  inspectionDate: Date;
  inspector: string;
  buildingInfo: BuildingInformation;
  roofSystemDetails: RoofSystemDetails;
  weatherConditions: WeatherCondition[];
  inspectionSections: InspectionSection[];
  roofComponents: RoofComponent[];
  thermalReadings: ThermalReading[];
  metrics: InspectionMetric[];
  issues: DetailedIssue[];
  costEstimates: CostEstimate[];
  executiveSummary: string;
  recommendations: string;
  notes: string;
  images: string[];
  thermalImages: string[];
}

const WORKFLOW_STEPS = [
  { id: 'building-info', title: 'Building Information', icon: MapPin },
  { id: 'bulk-analysis', title: 'AI Bulk Analysis', icon: Sparkles },
  { id: 'roof-system', title: 'Roof System Details', icon: Database },
  { id: 'weather', title: 'Weather Conditions', icon: Database },
  { id: 'thermal', title: 'Thermal Analysis', icon: Camera },
  { id: 'components', title: 'Roof Components', icon: FileText },
  { id: 'issues', title: 'Issues & Findings', icon: AlertTriangle },
  { id: 'cost-estimates', title: 'Cost Estimates', icon: FileText },
  { id: 'review', title: 'Review & Generate', icon: FileText },
];

export const WinnReportWorkflow = ({ propertyId, onComplete }: WinnReportWorkflowProps) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [showStormy, setShowStormy] = useState(true);
  const [reportData, setReportData] = useState<WinnReportData>({
    propertyId,
    inspectionDate: new Date(),
    inspector: '',
    buildingInfo: {
      address: '',
      propertyType: 'commercial',
      yearBuilt: new Date().getFullYear(),
      squareFootage: 0,
      stories: 1,
      occupancy: '',
      ownerName: '',
      ownerContact: '',
      roofSections: []
    },
    roofSystemDetails: {
      roofType: 'flat',
      primaryMaterial: 'membrane',
      age: 0,
      condition: 'good',
      previousRepairs: [],
      warrantyInfo: ''
    },
    weatherConditions: [],
    inspectionSections: [],
    roofComponents: [],
    thermalReadings: [],
    metrics: [],
    issues: [],
    costEstimates: [],
    executiveSummary: '',
    recommendations: '',
    notes: '',
    images: [],
    thermalImages: [],
  });

  const progressPercentage = ((currentStep + 1) / WORKFLOW_STEPS.length) * 100;

  const nextStep = () => {
    if (currentStep < WORKFLOW_STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const addWeatherCondition = () => {
    const newCondition: WeatherCondition = {
      temperature: 0,
      humidity: 0,
      windSpeed: 0,
      precipitation: 0,
      visibility: 0,
      timestamp: new Date(),
    };
    setReportData(prev => ({
      ...prev,
      weatherConditions: [...prev.weatherConditions, newCondition]
    }));
  };

  const addRoofComponent = () => {
    const newComponent: RoofComponent = {
      id: `component-${Date.now()}`,
      name: '',
      type: 'membrane',
      condition: 'good',
      notes: '',
      images: [],
      thermalData: [],
    };
    setReportData(prev => ({
      ...prev,
      roofComponents: [...prev.roofComponents, newComponent]
    }));
  };

  const addThermalReading = () => {
    const newReading: ThermalReading = {
      location: '',
      temperature: 0,
      timestamp: new Date(),
      alertLevel: 'normal',
    };
    setReportData(prev => ({
      ...prev,
      thermalReadings: [...prev.thermalReadings, newReading]
    }));
  };

  const addIssue = () => {
    const newIssue: DetailedIssue = {
      id: `issue-${Date.now()}`,
      title: '',
      description: '',
      severity: 'minor',
      category: '',
      location: '',
      recommendedAction: '',
      urgency: 'monitoring',
      images: [],
      thermalImages: [],
      discoveredDate: new Date(),
      reportedBy: reportData.inspector,
    };
    setReportData(prev => ({
      ...prev,
      issues: [...prev.issues, newIssue]
    }));
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0: // Building Information  
        return (
          <div className="space-y-6">
            {/* Basic Property Information */}
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-foreground">
                  <MapPin className="h-5 w-5 text-orange-500" />
                  Basic Property Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="inspector" className="text-foreground flex items-center">
                      Inspector Name
                      <EducationalTooltip 
                        content="Document who conducted this inspection for accountability and certification tracking."
                        learnMore="This information appears on the final Winn Report and is linked to your consultant certification."
                      />
                    </Label>
                    <Input
                      id="inspector"
                      data-testid="input-inspector-name"
                      value={reportData.inspector}
                      onChange={(e) => setReportData(prev => ({ ...prev, inspector: e.target.value }))}
                      className="bg-background text-foreground border-border field-input"
                      placeholder="Enter inspector name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="inspection-date" className="text-foreground">Inspection Date</Label>
                    <Input
                      id="inspection-date"
                      type="date"
                      value={reportData.inspectionDate.toISOString().split('T')[0]}
                      onChange={(e) => setReportData(prev => ({ ...prev, inspectionDate: new Date(e.target.value) }))}
                      className="bg-background text-foreground border-border"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="owner-name" className="text-foreground flex items-center">
                      Property Owner
                      <EducationalTooltip 
                        content="Record the property owner's name for report authorization and insurance claim documentation."
                        learnMore="Accurate owner information is critical for legal compliance and insurance processing."
                      />
                    </Label>
                    <Input
                      id="owner-name"
                      data-testid="input-property-owner"
                      value={reportData.buildingInfo.ownerName}
                      onChange={(e) => setReportData(prev => ({ 
                        ...prev, 
                        buildingInfo: { ...prev.buildingInfo, ownerName: e.target.value }
                      }))}
                      className="bg-background text-foreground border-border field-input"
                      placeholder="Enter property owner name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="owner-contact" className="text-foreground">Owner Contact</Label>
                    <Input
                      id="owner-contact"
                      value={reportData.buildingInfo.ownerContact}
                      onChange={(e) => setReportData(prev => ({ 
                        ...prev, 
                        buildingInfo: { ...prev.buildingInfo, ownerContact: e.target.value }
                      }))}
                      className="bg-background text-foreground border-border"
                      placeholder="Phone or email"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="property-type" className="text-foreground">Property Type</Label>
                    <Select
                      value={reportData.buildingInfo.propertyType}
                      onValueChange={(value) => setReportData(prev => ({ 
                        ...prev, 
                        buildingInfo: { ...prev.buildingInfo, propertyType: value as any }
                      }))}
                    >
                      <SelectTrigger className="bg-background text-foreground border-border">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="commercial">Commercial</SelectItem>
                        <SelectItem value="residential">Residential</SelectItem>
                        <SelectItem value="industrial">Industrial</SelectItem>
                        <SelectItem value="institutional">Institutional</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="year-built" className="text-foreground">Year Built</Label>
                    <Input
                      id="year-built"
                      type="number"
                      value={reportData.buildingInfo.yearBuilt}
                      onChange={(e) => setReportData(prev => ({ 
                        ...prev, 
                        buildingInfo: { ...prev.buildingInfo, yearBuilt: parseInt(e.target.value) }
                      }))}
                      className="bg-background text-foreground border-border"
                      placeholder="2020"
                    />
                  </div>
                  <div>
                    <Label htmlFor="square-footage" className="text-foreground flex items-center">
                      Square Footage
                      <EducationalTooltip 
                        content="Total roof square footage is essential for material estimates, cost calculations, and damage assessment scope."
                        learnMore="Winn Methodology requires precise measurements verified through on-site inspection and satellite imagery."
                      />
                    </Label>
                    <Input
                      id="square-footage"
                      data-testid="input-square-footage"
                      type="number"
                      inputMode="numeric"
                      value={reportData.buildingInfo.squareFootage}
                      onChange={(e) => setReportData(prev => ({ 
                        ...prev, 
                        buildingInfo: { ...prev.buildingInfo, squareFootage: parseInt(e.target.value) }
                      }))}
                      className="bg-background text-foreground border-border field-input"
                      placeholder="10000"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Google Maps Property Location & Roof Section Drawing */}
            <GoogleMapsDrawing
              address={reportData.buildingInfo.address}
              onAddressChange={(address) => setReportData(prev => ({ 
                ...prev, 
                buildingInfo: { ...prev.buildingInfo, address }
              }))}
              roofSections={reportData.buildingInfo.roofSections}
              onSectionsChange={(roofSections) => setReportData(prev => ({ 
                ...prev, 
                buildingInfo: { ...prev.buildingInfo, roofSections }
              }))}
            />

            {/* Initial Notes */}
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-foreground">Initial Inspection Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={reportData.notes}
                  onChange={(e) => setReportData(prev => ({ ...prev, notes: e.target.value }))}
                  className="bg-background text-foreground border-border"
                  placeholder="Enter initial inspection observations, weather conditions, access notes, etc."
                  rows={4}
                />
              </CardContent>
            </Card>
          </div>
        );

      case 1: // AI Bulk Analysis
        return (
          <div className="space-y-6">
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-foreground">
                  <Sparkles className="h-5 w-5 text-orange-500" />
                  Stormy AI Bulk Image Analysis
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Upload a ZIP file containing all your inspection photos. Stormy will analyze each image using AI vision 
                  and automatically populate issues, components, and findings in your report.
                </p>
                <BulkImageAnalysis
                  propertyAddress={reportData.buildingInfo.address || 'Unknown Address'}
                  onIssuesDetected={(detectedIssues) => {
                    const newIssues: DetailedIssue[] = detectedIssues.map((issue, idx) => ({
                      id: `ai-issue-${Date.now()}-${idx}`,
                      title: issue.title,
                      description: issue.description,
                      severity: issue.severity === 'critical' ? 'critical' : issue.severity as any,
                      category: issue.category,
                      location: issue.location,
                      recommendedAction: '',
                      urgency: issue.severity === 'critical' ? 'immediate' : 'routine' as any,
                      images: [],
                      thermalImages: [],
                      discoveredDate: new Date(),
                      reportedBy: 'Stormy AI',
                    }));
                    setReportData(prev => ({
                      ...prev,
                      issues: [...prev.issues, ...newIssues]
                    }));
                  }}
                  onComponentsDetected={(detectedComponents) => {
                    const newComponents: RoofComponent[] = detectedComponents.map((comp, idx) => ({
                      id: `ai-comp-${Date.now()}-${idx}`,
                      name: comp.name,
                      type: comp.type as RoofComponent['type'],
                      condition: comp.condition as RoofComponent['condition'],
                      notes: comp.notes,
                      images: [],
                      thermalData: [],
                    }));
                    setReportData(prev => ({
                      ...prev,
                      roofComponents: [...prev.roofComponents, ...newComponents]
                    }));
                  }}
                  onSummaryGenerated={(summary) => {
                    setReportData(prev => ({
                      ...prev,
                      executiveSummary: summary,
                    }));
                  }}
                />
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-500/5 dark:to-amber-500/5 border-orange-200 dark:border-orange-500/20">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <StormyAvatar size={32} />
                  <div className="text-sm text-gray-700 dark:text-gray-300">
                    <p className="font-medium mb-1">Pro Tip from Stormy:</p>
                    <p>
                      Organize your photos in folders by area (roof, gutters, siding) for better categorization. 
                      I'll automatically detect damage patterns, thermal anomalies, and affected components across all your images.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case 2: // Roof System Details
        return (
          <div className="space-y-6">
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-foreground">
                  <Database className="h-5 w-5 text-orange-500" />
                  Roof System Configuration
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-foreground">Primary Roof Type</Label>
                    <Select
                      value={reportData.roofSystemDetails?.primaryMaterial || ''}
                      onValueChange={(value) => setReportData(prev => ({ 
                        ...prev, 
                        roofSystemDetails: { ...prev.roofSystemDetails, primaryMaterial: value }
                      }))}
                    >
                      <SelectTrigger className="bg-background text-foreground border-border">
                        <SelectValue placeholder="Select roof type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="tpo">TPO Membrane</SelectItem>
                        <SelectItem value="epdm">EPDM Rubber</SelectItem>
                        <SelectItem value="pvc">PVC Membrane</SelectItem>
                        <SelectItem value="bur">Built-Up Roofing</SelectItem>
                        <SelectItem value="mod-bit">Modified Bitumen</SelectItem>
                        <SelectItem value="metal">Metal Roofing</SelectItem>
                        <SelectItem value="asphalt-shingle">Asphalt Shingles</SelectItem>
                        <SelectItem value="clay-tile">Clay Tile</SelectItem>
                        <SelectItem value="concrete-tile">Concrete Tile</SelectItem>
                        <SelectItem value="slate">Slate</SelectItem>
                        <SelectItem value="wood-shake">Wood Shake</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-foreground">Roof Age (years)</Label>
                    <Input
                      type="number"
                      value={reportData.roofSystemDetails?.age || ''}
                      onChange={(e) => setReportData(prev => ({ 
                        ...prev, 
                        roofSystemDetails: { ...prev.roofSystemDetails, age: parseInt(e.target.value) }
                      }))}
                      className="bg-background text-foreground border-border"
                      placeholder="Estimated age"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label className="text-foreground">Roof Type</Label>
                    <Select
                      value={reportData.roofSystemDetails?.roofType || ''}
                      onValueChange={(value) => setReportData(prev => ({ 
                        ...prev, 
                        roofSystemDetails: { ...prev.roofSystemDetails, roofType: value as any }
                      }))}
                    >
                      <SelectTrigger className="bg-background text-foreground border-border">
                        <SelectValue placeholder="Roof type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="flat">Flat</SelectItem>
                        <SelectItem value="low_slope">Low Slope</SelectItem>
                        <SelectItem value="steep_slope">Steep Slope</SelectItem>
                        <SelectItem value="pitched">Pitched</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-foreground">Condition</Label>
                    <Select
                      value={reportData.roofSystemDetails?.condition || ''}
                      onValueChange={(value) => setReportData(prev => ({ 
                        ...prev, 
                        roofSystemDetails: { ...prev.roofSystemDetails, condition: value as any }
                      }))}
                    >
                      <SelectTrigger className="bg-background text-foreground border-border">
                        <SelectValue placeholder="Select condition" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="excellent">Excellent</SelectItem>
                        <SelectItem value="good">Good</SelectItem>
                        <SelectItem value="fair">Fair</SelectItem>
                        <SelectItem value="poor">Poor</SelectItem>
                        <SelectItem value="critical">Critical</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-foreground">Warranty Info</Label>
                    <Input
                      value={reportData.roofSystemDetails?.warrantyInfo || ''}
                      onChange={(e) => setReportData(prev => ({ 
                        ...prev, 
                        roofSystemDetails: { ...prev.roofSystemDetails, warrantyInfo: e.target.value }
                      }))}
                      className="bg-background text-foreground border-border"
                      placeholder="Warranty details"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case 3: // Weather Conditions
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-foreground font-semibold">Weather Conditions</h3>
              <Button 
                data-testid="button-add-weather"
                onClick={addWeatherCondition} 
                className="bg-orange-500 hover:bg-orange-600 text-white touch-target"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Reading
              </Button>
            </div>
            <div className="space-y-4">
              {reportData.weatherConditions.map((condition, index) => (
                <Card key={index} className="bg-card border-border">
                  <CardContent className="p-4">
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      <div>
                        <Label className="text-foreground">Temperature (°F)</Label>
                        <Input
                          type="number"
                          value={condition.temperature}
                          onChange={(e) => {
                            const newConditions = [...reportData.weatherConditions];
                            newConditions[index].temperature = parseFloat(e.target.value);
                            setReportData(prev => ({ ...prev, weatherConditions: newConditions }));
                          }}
                          className="bg-card text-foreground border-border"
                        />
                      </div>
                      <div>
                        <Label className="text-foreground">Humidity (%)</Label>
                        <Input
                          type="number"
                          value={condition.humidity}
                          onChange={(e) => {
                            const newConditions = [...reportData.weatherConditions];
                            newConditions[index].humidity = parseFloat(e.target.value);
                            setReportData(prev => ({ ...prev, weatherConditions: newConditions }));
                          }}
                          className="bg-card text-foreground border-border"
                        />
                      </div>
                      <div>
                        <Label className="text-foreground">Wind Speed (mph)</Label>
                        <Input
                          type="number"
                          value={condition.windSpeed}
                          onChange={(e) => {
                            const newConditions = [...reportData.weatherConditions];
                            newConditions[index].windSpeed = parseFloat(e.target.value);
                            setReportData(prev => ({ ...prev, weatherConditions: newConditions }));
                          }}
                          className="bg-card text-foreground border-border"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        );

      case 4: // Thermal Analysis
        return (
          <ThermalAnalysis
            location={reportData.buildingInfo?.address || "Unknown location"}
            ambientTemp={reportData.weatherConditions[0]?.temperature}
            humidity={reportData.weatherConditions[0]?.humidity}
            onAnalysisComplete={(result) => {
              setReportData(prev => ({
                ...prev,
                thermalReadings: [...prev.thermalReadings, ...result.thermalReadings],
                issues: [...prev.issues, ...result.issues],
                metrics: [...prev.metrics, ...result.metrics],
                recommendations: result.summary,
                thermalImages: [...prev.thermalImages, ...result.thermalReadings.map(r => r.location)]
              }));
            }}
          />
        );

      case 5: // Roof Components
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-foreground font-semibold">Roof Components</h3>
              <Button 
                data-testid="button-add-component"
                onClick={addRoofComponent} 
                className="bg-orange-500 hover:bg-orange-600 text-white touch-target"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Component
              </Button>
            </div>
            <div className="space-y-4">
              {reportData.roofComponents.map((component, index) => (
                <Card key={component.id} className="bg-card border-border">
                  <CardContent className="p-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label className="text-foreground">Component Name</Label>
                        <Input
                          value={component.name}
                          onChange={(e) => {
                            const newComponents = [...reportData.roofComponents];
                            newComponents[index].name = e.target.value;
                            setReportData(prev => ({ ...prev, roofComponents: newComponents }));
                          }}
                          className="bg-card text-foreground border-border"
                          placeholder="e.g., TPO Membrane, Insulation Layer"
                        />
                      </div>
                      <div>
                        <Label className="text-foreground">Type</Label>
                        <Select
                          value={component.type}
                          onValueChange={(value) => {
                            const newComponents = [...reportData.roofComponents];
                            newComponents[index].type = value as RoofComponent['type'];
                            setReportData(prev => ({ ...prev, roofComponents: newComponents }));
                          }}
                        >
                          <SelectTrigger className="bg-card text-foreground border-border">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="membrane">Membrane</SelectItem>
                            <SelectItem value="insulation">Insulation</SelectItem>
                            <SelectItem value="deck">Deck</SelectItem>
                            <SelectItem value="drainage">Drainage</SelectItem>
                            <SelectItem value="flashing">Flashing</SelectItem>
                            <SelectItem value="penetration">Penetration</SelectItem>
                            <SelectItem value="equipment">Equipment</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-foreground">Condition</Label>
                        <Select
                          value={component.condition}
                          onValueChange={(value) => {
                            const newComponents = [...reportData.roofComponents];
                            newComponents[index].condition = value as RoofComponent['condition'];
                            setReportData(prev => ({ ...prev, roofComponents: newComponents }));
                          }}
                        >
                          <SelectTrigger className="bg-card text-foreground border-border">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="excellent">Excellent</SelectItem>
                            <SelectItem value="good">Good</SelectItem>
                            <SelectItem value="fair">Fair</SelectItem>
                            <SelectItem value="poor">Poor</SelectItem>
                            <SelectItem value="critical">Critical</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-foreground">Estimated Lifespan (years)</Label>
                        <Input
                          type="number"
                          value={component.estimatedLifespan || ''}
                          onChange={(e) => {
                            const newComponents = [...reportData.roofComponents];
                            newComponents[index].estimatedLifespan = e.target.value ? parseInt(e.target.value) : undefined;
                            setReportData(prev => ({ ...prev, roofComponents: newComponents }));
                          }}
                          className="bg-card text-foreground border-border"
                          placeholder="e.g., 20"
                        />
                      </div>
                    </div>
                    <div className="mt-4">
                      <Label className="text-foreground">Notes</Label>
                      <Textarea
                        value={component.notes || ''}
                        onChange={(e) => {
                          const newComponents = [...reportData.roofComponents];
                          newComponents[index].notes = e.target.value;
                          setReportData(prev => ({ ...prev, roofComponents: newComponents }));
                        }}
                        className="bg-card text-foreground border-border"
                        placeholder="Detailed notes about this component..."
                        rows={2}
                      />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        );

      case 6: // Issues & Findings
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-foreground font-semibold">Issues & Findings</h3>
              <Button 
                data-testid="button-add-issue"
                onClick={addIssue} 
                className="bg-primary text-primary-foreground touch-target"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Issue
              </Button>
            </div>
            <div className="space-y-4">
              {reportData.issues.map((issue, index) => (
                <Card key={issue.id} className="bg-card border-border">
                  <CardContent className="p-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label className="text-foreground">Issue Title</Label>
                        <Input
                          value={issue.title}
                          onChange={(e) => {
                            const newIssues = [...reportData.issues];
                            newIssues[index].title = e.target.value;
                            setReportData(prev => ({ ...prev, issues: newIssues }));
                          }}
                          className="bg-card text-foreground border-border"
                          placeholder="e.g., Membrane Puncture, Drainage Blockage"
                        />
                      </div>
                      <div>
                        <Label className="text-foreground">Severity</Label>
                        <Select
                          value={issue.severity}
                          onValueChange={(value) => {
                            const newIssues = [...reportData.issues];
                            newIssues[index].severity = value as DetailedIssue['severity'];
                            setReportData(prev => ({ ...prev, issues: newIssues }));
                          }}
                        >
                          <SelectTrigger className="bg-card text-foreground border-border">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="critical">Critical</SelectItem>
                            <SelectItem value="major">Major</SelectItem>
                            <SelectItem value="minor">Minor</SelectItem>
                            <SelectItem value="informational">Informational</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-foreground">Location</Label>
                        <Input
                          value={issue.location}
                          onChange={(e) => {
                            const newIssues = [...reportData.issues];
                            newIssues[index].location = e.target.value;
                            setReportData(prev => ({ ...prev, issues: newIssues }));
                          }}
                          className="bg-card text-foreground border-border"
                          placeholder="e.g., North roof section, Building A"
                        />
                      </div>
                      <div>
                        <Label className="text-foreground">Urgency</Label>
                        <Select
                          value={issue.urgency}
                          onValueChange={(value) => {
                            const newIssues = [...reportData.issues];
                            newIssues[index].urgency = value as DetailedIssue['urgency'];
                            setReportData(prev => ({ ...prev, issues: newIssues }));
                          }}
                        >
                          <SelectTrigger className="bg-card text-foreground border-border">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="immediate">Immediate</SelectItem>
                            <SelectItem value="short_term">Short Term</SelectItem>
                            <SelectItem value="long_term">Long Term</SelectItem>
                            <SelectItem value="monitoring">Monitoring</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="mt-4 space-y-4">
                      <div>
                        <Label className="text-foreground">Description</Label>
                        <Textarea
                          value={issue.description}
                          onChange={(e) => {
                            const newIssues = [...reportData.issues];
                            newIssues[index].description = e.target.value;
                            setReportData(prev => ({ ...prev, issues: newIssues }));
                          }}
                          className="bg-card text-foreground border-border"
                          placeholder="Detailed description of the issue..."
                          rows={3}
                        />
                      </div>
                      <div>
                        <Label className="text-foreground">Recommended Action</Label>
                        <Textarea
                          value={issue.recommendedAction}
                          onChange={(e) => {
                            const newIssues = [...reportData.issues];
                            newIssues[index].recommendedAction = e.target.value;
                            setReportData(prev => ({ ...prev, issues: newIssues }));
                          }}
                          className="bg-card text-foreground border-border"
                          placeholder="Recommended action to address this issue..."
                          rows={2}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        );

      case 7: // Cost Estimates
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-foreground font-semibold">Cost Estimates</h3>
              <Button 
                data-testid="button-add-cost-estimate"
                onClick={() => {
                  const newEstimate: CostEstimate = {
                    itemDescription: '',
                    quantity: 1,
                    unit: 'each',
                    unitCost: 0,
                    totalCost: 0,
                    priority: 'within_1_year',
                    laborHours: 0,
                  };
                  setReportData(prev => ({
                    ...prev,
                    costEstimates: [...prev.costEstimates, newEstimate]
                  }));
                }} 
                className="bg-orange-500 hover:bg-orange-600 text-white touch-target"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Estimate
              </Button>
            </div>
            
            {reportData.costEstimates.length === 0 && (
              <Card className="bg-card border-border border-dashed">
                <CardContent className="p-6 text-center">
                  <FileText className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                  <p className="text-muted-foreground">
                    No cost estimates yet. Click "Add Estimate" to add repair or replacement costs.
                  </p>
                </CardContent>
              </Card>
            )}
            
            <div className="space-y-4">
              {reportData.costEstimates.map((estimate, index) => (
                <Card key={index} className="bg-card border-border">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-4">
                      <Badge variant="outline" className="text-orange-500 border-orange-500">
                        Item #{index + 1}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          const newEstimates = reportData.costEstimates.filter((_, i) => i !== index);
                          setReportData(prev => ({ ...prev, costEstimates: newEstimates }));
                        }}
                        className="text-red-500 hover:text-red-600 hover:bg-red-500/10"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div className="md:col-span-2">
                        <Label className="text-foreground">Item Description</Label>
                        <Input
                          value={estimate.itemDescription}
                          onChange={(e) => {
                            const newEstimates = [...reportData.costEstimates];
                            newEstimates[index].itemDescription = e.target.value;
                            setReportData(prev => ({ ...prev, costEstimates: newEstimates }));
                          }}
                          className="bg-card text-foreground border-border"
                          placeholder="e.g., TPO membrane replacement, Flashing repair"
                        />
                      </div>
                      <div>
                        <Label className="text-foreground">Quantity</Label>
                        <Input
                          type="number"
                          value={estimate.quantity}
                          onChange={(e) => {
                            const newEstimates = [...reportData.costEstimates];
                            newEstimates[index].quantity = parseFloat(e.target.value) || 0;
                            newEstimates[index].totalCost = newEstimates[index].quantity * newEstimates[index].unitCost;
                            setReportData(prev => ({ ...prev, costEstimates: newEstimates }));
                          }}
                          className="bg-card text-foreground border-border"
                        />
                      </div>
                      <div>
                        <Label className="text-foreground">Unit</Label>
                        <Select
                          value={estimate.unit}
                          onValueChange={(value) => {
                            const newEstimates = [...reportData.costEstimates];
                            newEstimates[index].unit = value;
                            setReportData(prev => ({ ...prev, costEstimates: newEstimates }));
                          }}
                        >
                          <SelectTrigger className="bg-card text-foreground border-border">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="sq_ft">sq ft</SelectItem>
                            <SelectItem value="sq">squares (100 sq ft)</SelectItem>
                            <SelectItem value="linear_ft">linear ft</SelectItem>
                            <SelectItem value="each">each</SelectItem>
                            <SelectItem value="hour">hour</SelectItem>
                            <SelectItem value="lump_sum">lump sum</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-foreground">Unit Cost ($)</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={estimate.unitCost}
                          onChange={(e) => {
                            const newEstimates = [...reportData.costEstimates];
                            newEstimates[index].unitCost = parseFloat(e.target.value) || 0;
                            newEstimates[index].totalCost = newEstimates[index].quantity * newEstimates[index].unitCost;
                            setReportData(prev => ({ ...prev, costEstimates: newEstimates }));
                          }}
                          className="bg-card text-foreground border-border"
                        />
                      </div>
                      <div>
                        <Label className="text-foreground">Total Cost ($)</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={estimate.totalCost}
                          readOnly
                          className="bg-muted text-foreground border-border font-semibold"
                        />
                      </div>
                      <div>
                        <Label className="text-foreground">Priority</Label>
                        <Select
                          value={estimate.priority}
                          onValueChange={(value) => {
                            const newEstimates = [...reportData.costEstimates];
                            newEstimates[index].priority = value as CostEstimate['priority'];
                            setReportData(prev => ({ ...prev, costEstimates: newEstimates }));
                          }}
                        >
                          <SelectTrigger className="bg-card text-foreground border-border">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="immediate">Immediate</SelectItem>
                            <SelectItem value="within_1_year">Within 1 Year</SelectItem>
                            <SelectItem value="within_5_years">Within 5 Years</SelectItem>
                            <SelectItem value="monitoring">Monitoring Only</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-foreground">Labor Hours (optional)</Label>
                        <Input
                          type="number"
                          value={estimate.laborHours || ''}
                          onChange={(e) => {
                            const newEstimates = [...reportData.costEstimates];
                            newEstimates[index].laborHours = parseFloat(e.target.value) || 0;
                            setReportData(prev => ({ ...prev, costEstimates: newEstimates }));
                          }}
                          className="bg-card text-foreground border-border"
                          placeholder="0"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            
            {reportData.costEstimates.length > 0 && (
              <Card className="bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-500/10 dark:to-amber-500/10 border-orange-200 dark:border-orange-500/30">
                <CardContent className="p-4">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-foreground">Total Estimated Cost:</span>
                    <span className="text-2xl font-bold text-orange-500">
                      ${reportData.costEstimates.reduce((sum, e) => sum + (e.totalCost || 0), 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        );

      case 8: // Review & Generate
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-foreground font-semibold text-lg mb-2">Review Your Winn Report</h3>
              <p className="text-muted-foreground">Please review all collected data before generating the comprehensive report.</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="bg-card border-border">
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-primary">{reportData.weatherConditions.length}</div>
                  <div className="text-sm text-muted-foreground">Weather Readings</div>
                </CardContent>
              </Card>
              <Card className="bg-card border-border">
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-secondary">{reportData.thermalReadings.length}</div>
                  <div className="text-sm text-muted-foreground">Thermal Readings</div>
                </CardContent>
              </Card>
              <Card className="bg-card border-border">
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-accent">{reportData.roofComponents.length}</div>
                  <div className="text-sm text-muted-foreground">Components</div>
                </CardContent>
              </Card>
              <Card className="bg-card border-border">
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-destructive">{reportData.issues.length}</div>
                  <div className="text-sm text-muted-foreground">Issues Found</div>
                </CardContent>
              </Card>
            </div>

            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-foreground">Report Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Inspector:</span>
                    <span className="text-foreground">{reportData.inspector}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Inspection Date:</span>
                    <span className="text-foreground">{reportData.inspectionDate.toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Critical Issues:</span>
                    <span className="text-destructive font-semibold">
                      {reportData.issues.filter(i => i.severity === 'critical').length}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Estimated Report Pages:</span>
                    <span className="text-foreground font-semibold">
                      {Math.max(300, reportData.roofComponents.length * 15 + reportData.issues.length * 8 + reportData.thermalReadings.length * 3)}+
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-6 pb-32 md:pb-6">
      <div className="mb-6 md:mb-8">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">Winn Report Generation</h1>
          <Badge variant="outline" className="text-primary border-primary hidden md:inline-flex">
            Step {currentStep + 1} of {WORKFLOW_STEPS.length}
          </Badge>
        </div>
        <Progress value={progressPercentage} className="mb-4" />
        <div className="hidden md:flex justify-between text-sm text-muted-foreground">
          {WORKFLOW_STEPS.map((step, index) => (
            <div key={step.id} className={`flex items-center ${index <= currentStep ? 'text-primary' : ''}`}>
              <step.icon className="h-4 w-4 mr-1" />
              {step.title}
            </div>
          ))}
        </div>
      </div>

      {/* Main Content Grid: Workflow Steps + AI Assistant */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Workflow Content - Takes 2/3 of the width */}
        <div className="xl:col-span-2">
          <Card className="bg-card border-border shadow-lg">
            <CardHeader>
              <CardTitle className="text-foreground flex items-center">
                {(() => {
                  const StepIcon = WORKFLOW_STEPS[currentStep].icon;
                  return <StepIcon className="h-5 w-5 mr-2" />;
                })()}
                {WORKFLOW_STEPS[currentStep].title}
              </CardTitle>
            </CardHeader>
            <CardContent className="min-h-[500px]">
              {renderStepContent()}
            </CardContent>
          </Card>

          {/* Desktop Navigation - Hidden on mobile */}
          <div className="hidden md:flex justify-between mt-6">
            <Button 
              data-testid="button-previous-step"
              onClick={prevStep} 
              disabled={currentStep === 0}
              variant="outline"
              className="border-border text-foreground touch-target"
            >
              Previous
            </Button>
            {currentStep === WORKFLOW_STEPS.length - 1 ? (
              <Button 
                data-testid="button-generate-report"
                onClick={() => onComplete(reportData)}
                className="bg-primary text-primary-foreground touch-target"
              >
                Generate Winn Report
              </Button>
            ) : (
              <Button 
                data-testid="button-next-step"
                onClick={nextStep}
                className="bg-primary text-primary-foreground touch-target"
              >
                Next
              </Button>
            )}
          </div>
        </div>

        {/* AI Assistant Panel - Takes 1/3 of the width */}
        <div className="xl:col-span-1">
          <div className="sticky top-6 space-y-4">
            {/* Stormy AI Coach - Collapsible */}
            <Card className="border-orange-500/20 bg-background/50 backdrop-blur-sm shadow-xl overflow-hidden">
              <CardHeader 
                className="flex flex-row items-center justify-between pb-2 space-y-0 bg-orange-500/5 cursor-pointer hover:bg-orange-500/10 transition-colors"
                onClick={() => setShowStormy(!showStormy)}
                data-testid="button-toggle-stormy"
              >
                <div className="flex items-center gap-2">
                  <StormyAvatar size={32} />
                  <CardTitle className="text-base font-semibold">Stormy AI Coach</CardTitle>
                </div>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8 hover:bg-orange-500/10 hover:text-orange-500"
                  onClick={(e) => { e.stopPropagation(); setShowStormy(!showStormy); }}
                >
                  <X className={`h-4 w-4 transition-transform duration-200 ${showStormy ? 'rotate-0' : 'rotate-45'}`} />
                </Button>
              </CardHeader>
              {showStormy && (
                <CardContent className="p-0 animate-in slide-in-from-top duration-200">
                  <StormyChat 
                    propertyId={propertyId} 
                    contextType="inspection" 
                    position="inline"
                    initialOpen={true}
                  />
                </CardContent>
              )}
            </Card>
            
            {/* AI Inspection Assistant */}
            <AIInspectionAssistant
              currentStep={WORKFLOW_STEPS[currentStep]?.id}
              propertyData={reportData.buildingInfo}
              thermalData={reportData.thermalReadings}
              roofSections={reportData.buildingInfo.roofSections}
              weatherData={reportData.weatherConditions}
              issues={reportData.issues}
              components={reportData.roofComponents}
              onGuidanceReceived={() => {}}
            />
          </div>
        </div>
      </div>

      {/* Mobile Navigation - Fixed bottom bar */}
      <MobileWorkflowNav
        currentStep={currentStep}
        totalSteps={WORKFLOW_STEPS.length}
        onPrevious={prevStep}
        onNext={nextStep}
        onComplete={() => onComplete(reportData)}
        isFirstStep={currentStep === 0}
        isLastStep={currentStep === WORKFLOW_STEPS.length - 1}
        stepTitle={WORKFLOW_STEPS[currentStep].title}
      />
    </div>
  );
};