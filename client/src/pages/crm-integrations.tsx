import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Database, Settings, Activity, Plus, CheckCircle, AlertCircle, Clock, ArrowLeft, Zap, Building2,
  Shield, Star, ChevronDown, ChevronUp, ExternalLink, Home, Crown
} from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import CrmConfigManager from '@/components/crm-config';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useLocation } from 'wouter';
import winnstormLogo from '@assets/logo-dark_1765042579232.png';
import { Header, Footer } from '@/components/navbar';

interface CrmConfig {
  id: number;
  name: string;
  type: string;
  isActive: boolean;
  createdAt: string;
}

interface CrmSyncLog {
  id: number;
  crmConfigId: number;
  propertyId?: number;
  scanId?: number;
  syncType: string;
  externalId?: string;
  status: string;
  errorMessage?: string;
  syncedAt: string;
}

const CrmIntegrationsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState("overview");
  const [showExternalIntegrations, setShowExternalIntegrations] = useState(false);
  const [, navigate] = useLocation();

  const configs: CrmConfig[] = [
    {
      id: 1,
      name: "JobNimbus Production",
      type: "jobnimbus",
      isActive: true,
      createdAt: "2025-01-20T10:00:00Z"
    },
    {
      id: 2,
      name: "Salesforce CRM",
      type: "salesforce",
      isActive: true,
      createdAt: "2025-01-18T14:30:00Z"
    },
    {
      id: 3,
      name: "HubSpot Pipeline",
      type: "hubspot",
      isActive: false,
      createdAt: "2025-01-15T09:15:00Z"
    }
  ];

  const allSyncLogs: CrmSyncLog[] = [
    {
      id: 1,
      crmConfigId: 1,
      propertyId: 1,
      syncType: "contact",
      externalId: "JN-2025-001",
      status: "success",
      syncedAt: "2025-01-27T18:30:00Z"
    },
    {
      id: 2,
      crmConfigId: 2,
      propertyId: 2,
      syncType: "job",
      externalId: "SF-OP-2025-087",
      status: "success",
      syncedAt: "2025-01-27T17:45:00Z"
    },
    {
      id: 3,
      crmConfigId: 1,
      scanId: 1,
      syncType: "document",
      externalId: "JN-DOC-4512",
      status: "success",
      syncedAt: "2025-01-27T16:20:00Z"
    },
    {
      id: 4,
      crmConfigId: 2,
      propertyId: 3,
      syncType: "contact",
      status: "failed",
      errorMessage: "Invalid API key format",
      syncedAt: "2025-01-27T15:10:00Z"
    }
  ];

  const configsLoading = false;
  const logsLoading = false;

  const activeConfigs = configs.filter(config => config.isActive);
  const recentLogs = allSyncLogs.slice(0, 10);
  const successfulSyncs = allSyncLogs.filter(log => log.status === 'success').length;
  const failedSyncs = allSyncLogs.filter(log => log.status === 'failed').length;

  const getCrmTypeIcon = (type: string) => {
    switch (type) {
      case 'jobnimbus': return '🔧';
      case 'aterna': return '⚡';
      case 'salesforce': return '☁️';
      case 'hubspot': return '🟠';
      case 'pipedrive': return '🔵';
      default: return '📊';
    }
  };

  const getCrmTypeName = (type: string) => {
    switch (type) {
      case 'jobnimbus': return 'JobNimbus';
      case 'aterna': return 'ATERNA CRM+';
      case 'salesforce': return 'Salesforce';
      case 'hubspot': return 'HubSpot';
      case 'pipedrive': return 'Pipedrive';
      default: return type;
    }
  };

  const formatSyncType = (type: string) => {
    switch (type) {
      case 'contact': return 'Contact';
      case 'job': return 'Job/Opportunity';
      case 'document': return 'Document';
      default: return type;
    }
  };

  const externalCrmOptions = [
    { value: 'jobnimbus', label: 'JobNimbus', description: 'Construction job management', icon: '🔧' },
    { value: 'salesforce', label: 'Salesforce', description: 'Enterprise CRM platform', icon: '☁️' },
    { value: 'hubspot', label: 'HubSpot', description: 'Inbound marketing & sales', icon: '🟠' },
    { value: 'pipedrive', label: 'Pipedrive', description: 'Sales-focused CRM', icon: '🔵' },
  ];

  return (
    <div className="min-h-screen flex flex-col relative bg-background text-foreground">
      <Header />
      
      <main className="flex-grow pb-20">
        <div className="max-w-7xl mx-auto p-6">
          <div className="mb-8">
            <div className="flex items-center mb-6">
              <Button 
                variant="ghost" 
                onClick={() => navigate('/dashboard')}
                className="mr-4 p-2 hover:bg-primary/10"
                data-testid="button-back-dashboard"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div className="flex items-center">
                <div className="relative mr-4">
                  <div className="absolute inset-0 bg-gradient-to-r from-orange-500/30 to-orange-400/30 rounded-lg blur-md"></div>
                  <img src={winnstormLogo} alt="WinnStorm" className="h-10 relative z-10" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-orange-500">
                    CRM & Data Management
                  </h1>
                  <p className="text-muted-foreground text-sm">
                    Manage your client relationships and sync inspection data
                  </p>
                </div>
              </div>
            </div>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="bg-card border-border">
              <TabsTrigger value="overview" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground" data-testid="tab-overview">
                <Database className="w-4 h-4 mr-2" />
                Overview
              </TabsTrigger>
              <TabsTrigger value="configurations" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground" data-testid="tab-configurations">
                <Settings className="w-4 h-4 mr-2" />
                Integrations
              </TabsTrigger>
              <TabsTrigger value="activity" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground" data-testid="tab-activity">
                <Activity className="w-4 h-4 mr-2" />
                Activity
              </TabsTrigger>
            </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <Card className="bg-gradient-to-r from-orange-500/5 via-orange-400/5 to-orange-500/5 border-orange-500/30 mb-6">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <div className="p-4 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl shadow-lg">
                      <Home className="h-8 w-8 text-white" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h2 className="text-2xl font-bold text-foreground">WinnStorm Native CRM</h2>
                        <Badge className="bg-primary text-primary-foreground">
                          <Crown className="w-3 h-3 mr-1" />
                          Included
                        </Badge>
                      </div>
                      <p className="text-muted-foreground max-w-xl">
                        Your comprehensive client management solution built right into WinnStorm. 
                        Manage clients, properties, and projects without switching platforms.
                      </p>
                    </div>
                  </div>
                  <Button 
                    onClick={() => navigate('/clients')}
                    className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700"
                    data-testid="button-open-native-crm"
                  >
                    <Home className="w-4 h-4 mr-2" />
                    Open Client Manager
                  </Button>
                </div>
                
                <div className="grid md:grid-cols-4 gap-4 mt-6">
                  <div className="flex items-center gap-3 bg-background/50 p-3 rounded-lg">
                    <CheckCircle className="h-5 w-5 text-orange-500" />
                    <span className="text-sm text-foreground">Unlimited Clients</span>
                  </div>
                  <div className="flex items-center gap-3 bg-background/50 p-3 rounded-lg">
                    <CheckCircle className="h-5 w-5 text-orange-500" />
                    <span className="text-sm text-foreground">Property Tracking</span>
                  </div>
                  <div className="flex items-center gap-3 bg-background/50 p-3 rounded-lg">
                    <CheckCircle className="h-5 w-5 text-orange-500" />
                    <span className="text-sm text-foreground">Report History</span>
                  </div>
                  <div className="flex items-center gap-3 bg-background/50 p-3 rounded-lg">
                    <CheckCircle className="h-5 w-5 text-orange-500" />
                    <span className="text-sm text-foreground">No Extra Cost</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="bg-gradient-to-br from-card to-primary/5 border-primary/20">
                <CardHeader className="pb-3">
                  <CardTitle className="text-foreground flex items-center gap-2">
                    <Database className="w-5 h-5 text-primary" />
                    Active Integrations
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-primary mb-2">
                    {configsLoading ? '...' : activeConfigs.length}
                  </div>
                  <p className="text-muted-foreground text-sm">
                    {configs.length - activeConfigs.length} inactive
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-card to-orange-500/5 border-orange-500/20">
                <CardHeader className="pb-3">
                  <CardTitle className="text-foreground flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-orange-500" />
                    Successful Syncs
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-orange-600 mb-2">
                    {logsLoading ? '...' : successfulSyncs}
                  </div>
                  <p className="text-muted-foreground text-sm">
                    {((successfulSyncs / (successfulSyncs + failedSyncs)) * 100 || 0).toFixed(1)}% success rate
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-card to-red-500/5 border-red-500/20">
                <CardHeader className="pb-3">
                  <CardTitle className="text-foreground flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-red-500" />
                    Failed Syncs
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-red-600 mb-2">
                    {logsLoading ? '...' : failedSyncs}
                  </div>
                  <p className="text-muted-foreground text-sm">
                    Last 30 days
                  </p>
                </CardContent>
              </Card>
            </div>

            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-foreground">Active External Integrations</CardTitle>
                <CardDescription className="text-muted-foreground">
                  Your connected third-party CRM systems
                </CardDescription>
              </CardHeader>
              <CardContent>
                {configsLoading ? (
                  <div className="flex items-center justify-center p-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                ) : activeConfigs.length === 0 ? (
                  <div className="text-center py-8">
                    <Database className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground mb-2">No external CRM integrations active</p>
                    <p className="text-sm text-muted-foreground mb-4">
                      Use the built-in WinnStorm CRM or connect to your existing system
                    </p>
                    <Button
                      onClick={() => setActiveTab('configurations')}
                      variant="outline"
                      className="border-border"
                      data-testid="button-add-external-integration"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add External Integration
                    </Button>
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {activeConfigs.map((config) => (
                      <div
                        key={config.id}
                        className="flex items-center justify-between p-4 bg-secondary/10 rounded-lg border border-border"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{getCrmTypeIcon(config.type)}</span>
                          <div>
                            <h3 className="text-foreground font-medium">{config.name}</h3>
                            <p className="text-muted-foreground text-sm">{getCrmTypeName(config.type)}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="default" className="bg-green-600 hover:bg-green-700">
                            Active
                          </Badge>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setActiveTab('configurations')}
                            className="text-muted-foreground hover:text-foreground"
                          >
                            <Settings className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-foreground">Recent Activity</CardTitle>
                <CardDescription className="text-muted-foreground">
                  Latest synchronization events
                </CardDescription>
              </CardHeader>
              <CardContent>
                {logsLoading ? (
                  <div className="flex items-center justify-center p-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                ) : recentLogs.length === 0 ? (
                  <div className="text-center py-8">
                    <Activity className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">No recent activity</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {recentLogs.map((log) => (
                      <div
                        key={log.id}
                        className="flex items-center justify-between p-3 bg-secondary/10 rounded-lg border border-border"
                      >
                        <div className="flex items-center gap-3">
                          {log.status === 'success' ? (
                            <CheckCircle className="w-5 h-5 text-orange-500" />
                          ) : log.status === 'failed' ? (
                            <AlertCircle className="w-5 h-5 text-red-500" />
                          ) : (
                            <Clock className="w-5 h-5 text-yellow-500" />
                          )}
                          <div>
                            <p className="text-foreground font-medium">
                              {formatSyncType(log.syncType)} sync
                            </p>
                            <p className="text-muted-foreground text-sm">
                              {new Date(log.syncedAt).toLocaleString()}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge
                            variant={log.status === 'success' ? 'default' : 'destructive'}
                            className={log.status === 'success' ? 'bg-orange-600 hover:bg-orange-700' : ''}
                          >
                            {log.status}
                          </Badge>
                          {log.externalId && (
                            <p className="text-muted-foreground text-xs mt-1">
                              ID: {log.externalId}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="configurations" className="space-y-6">
            <Card className="bg-gradient-to-r from-orange-500/5 via-orange-400/5 to-orange-500/5 border-orange-500/30">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <div className="p-4 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl shadow-lg">
                      <Home className="h-8 w-8 text-white" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h2 className="text-xl font-bold text-foreground">WinnStorm Native CRM</h2>
                        <Badge className="bg-orange-600 text-white">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Active
                        </Badge>
                      </div>
                      <p className="text-muted-foreground text-sm max-w-lg">
                        Your all-in-one client management solution. No additional setup required.
                      </p>
                    </div>
                  </div>
                  <Button 
                    onClick={() => navigate('/clients')}
                    className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700"
                    data-testid="button-manage-clients"
                  >
                    <Home className="w-4 h-4 mr-2" />
                    Manage Clients
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-r from-purple-500/10 via-indigo-500/10 to-purple-500/10 border-purple-500/30">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <div className="p-4 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-xl shadow-lg">
                      <Zap className="h-8 w-8 text-white" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h2 className="text-xl font-bold text-foreground">ATERNA CRM+</h2>
                        <Badge className="bg-purple-600 text-white">
                          <Star className="w-3 h-3 mr-1" />
                          Premium
                        </Badge>
                      </div>
                      <p className="text-muted-foreground text-sm max-w-lg">
                        Advanced CRM with marketing automation, pipeline management, and AI-powered lead scoring. 
                        Perfect for scaling your damage assessment business.
                      </p>
                      <div className="flex flex-wrap gap-2 mt-3">
                        <Badge variant="outline" className="text-xs border-purple-500/50 text-purple-400">
                          Marketing Automation
                        </Badge>
                        <Badge variant="outline" className="text-xs border-purple-500/50 text-purple-400">
                          Pipeline Management
                        </Badge>
                        <Badge variant="outline" className="text-xs border-purple-500/50 text-purple-400">
                          AI Lead Scoring
                        </Badge>
                        <Badge variant="outline" className="text-xs border-purple-500/50 text-purple-400">
                          White-Label Ready
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <Button 
                      className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
                      data-testid="button-connect-aterna"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Connect ATERNA
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-purple-400 hover:text-purple-300"
                      data-testid="button-learn-more-aterna"
                    >
                      Learn More
                      <ExternalLink className="w-3 h-3 ml-1" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Collapsible open={showExternalIntegrations} onOpenChange={setShowExternalIntegrations}>
              <Card className="bg-card border-border">
                <CardHeader>
                  <CollapsibleTrigger asChild>
                    <div className="flex items-center justify-between cursor-pointer" data-testid="button-toggle-external-integrations">
                      <div>
                        <CardTitle className="text-foreground flex items-center gap-2">
                          <Database className="w-5 h-5 text-muted-foreground" />
                          Third-Party CRM Integrations
                        </CardTitle>
                        <CardDescription className="text-muted-foreground">
                          Connect to your existing CRM if you prefer an external system
                        </CardDescription>
                      </div>
                      <Button variant="ghost" size="sm">
                        {showExternalIntegrations ? (
                          <ChevronUp className="w-5 h-5" />
                        ) : (
                          <ChevronDown className="w-5 h-5" />
                        )}
                      </Button>
                    </div>
                  </CollapsibleTrigger>
                </CardHeader>
                <CollapsibleContent>
                  <CardContent>
                    <div className="bg-muted/50 p-4 rounded-lg mb-6 border border-border">
                      <div className="flex items-start gap-3">
                        <Shield className="w-5 h-5 text-primary mt-0.5" />
                        <div>
                          <p className="text-sm text-foreground font-medium">
                            Already have a CRM you love?
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Connect your existing system to sync property data and reports. 
                            We recommend using WinnStorm's built-in CRM for the best experience.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                      {externalCrmOptions.map((crm) => (
                        <Card key={crm.value} className="bg-secondary/10 border-border hover:border-muted-foreground/50 transition-colors">
                          <CardContent className="p-4 text-center">
                            <div className="text-3xl mb-2">{crm.icon}</div>
                            <h4 className="font-medium text-foreground">{crm.label}</h4>
                            <p className="text-xs text-muted-foreground mb-3">{crm.description}</p>
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="w-full border-border hover:border-primary"
                              data-testid={`button-connect-${crm.value}`}
                            >
                              <Plus className="w-4 h-4 mr-1" />
                              Connect
                            </Button>
                          </CardContent>
                        </Card>
                      ))}
                    </div>

                    {configs.length > 0 && (
                      <div>
                        <h3 className="text-lg font-semibold text-foreground mb-4">Current Configurations</h3>
                        <div className="space-y-3">
                          {configs.map((config) => (
                            <div key={config.id} className="flex items-center justify-between p-4 bg-secondary/10 rounded-lg border border-border">
                              <div className="flex items-center gap-3">
                                <span className="text-2xl">{getCrmTypeIcon(config.type)}</span>
                                <div>
                                  <h4 className="font-medium text-foreground">{config.name}</h4>
                                  <p className="text-sm text-muted-foreground">{getCrmTypeName(config.type)} • Created {new Date(config.createdAt).toLocaleDateString()}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge variant={config.isActive ? 'default' : 'secondary'} className={config.isActive ? 'bg-green-600' : ''}>
                                  {config.isActive ? 'Active' : 'Inactive'}
                                </Badge>
                                <Button variant="ghost" size="sm">
                                  <Settings className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </CollapsibleContent>
              </Card>
            </Collapsible>
          </TabsContent>

          <TabsContent value="activity" className="space-y-6">
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-foreground">All Sync Activity</CardTitle>
                <CardDescription className="text-muted-foreground">
                  Complete history of CRM synchronization events
                </CardDescription>
              </CardHeader>
              <CardContent>
                {logsLoading ? (
                  <div className="flex items-center justify-center p-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                ) : allSyncLogs.length === 0 ? (
                  <div className="text-center py-8">
                    <Activity className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">No sync activity found</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {allSyncLogs.map((log) => (
                      <div
                        key={log.id}
                        className="flex items-start justify-between p-4 bg-secondary/10 rounded-lg border border-border"
                      >
                        <div className="flex items-start gap-3">
                          {log.status === 'success' ? (
                            <CheckCircle className="w-5 h-5 text-orange-500 mt-0.5" />
                          ) : log.status === 'failed' ? (
                            <AlertCircle className="w-5 h-5 text-red-500 mt-0.5" />
                          ) : (
                            <Clock className="w-5 h-5 text-yellow-500 mt-0.5" />
                          )}
                          <div className="flex-1">
                            <p className="text-foreground font-medium">
                              {formatSyncType(log.syncType)} sync
                            </p>
                            <p className="text-muted-foreground text-sm">
                              {new Date(log.syncedAt).toLocaleString()}
                            </p>
                            {log.errorMessage && (
                              <p className="text-red-500 text-sm mt-1">
                                Error: {log.errorMessage}
                              </p>
                            )}
                            {log.propertyId && (
                              <p className="text-muted-foreground text-xs mt-1">
                                Property ID: {log.propertyId}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge
                            variant={log.status === 'success' ? 'default' : 'destructive'}
                            className={log.status === 'success' ? 'bg-orange-600 hover:bg-orange-700' : ''}
                          >
                            {log.status}
                          </Badge>
                          {log.externalId && (
                            <p className="text-muted-foreground text-xs mt-1">
                              ID: {log.externalId}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          </Tabs>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default CrmIntegrationsPage;
