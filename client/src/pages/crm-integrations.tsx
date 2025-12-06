import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Database, Settings, Activity, Plus, CheckCircle, AlertCircle, Clock, ArrowLeft, Zap, Building2 } from 'lucide-react';
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
  const [, navigate] = useLocation();

  // Mock data for demonstration - in real implementation this would connect to APIs
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
      case 'gohighlevel': return '📈';
      case 'salesforce': return '☁️';
      case 'hubspot': return '🟠';
      case 'pipedrive': return '🔵';
      default: return '📊';
    }
  };

  const getCrmTypeName = (type: string) => {
    switch (type) {
      case 'jobnimbus': return 'JobNimbus';
      case 'gohighlevel': return 'GoHighLevel';
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

  return (
    <div className="min-h-screen flex flex-col relative bg-background text-foreground">
      <Header />
      
      <main className="flex-grow pb-20">
        <div className="max-w-7xl mx-auto p-6">
          {/* WinnStorm™ Branded Header */}
          <div className="mb-8">
            <div className="flex items-center mb-6">
              <Button 
                variant="ghost" 
                onClick={() => navigate('/dashboard')}
                className="mr-4 p-2 hover:bg-primary/10"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div className="flex items-center">
                <div className="relative mr-4">
                  <div className="absolute inset-0 bg-gradient-to-r from-primary/30 to-cyan-500/30 rounded-lg blur-md"></div>
                  <img src={winnstormLogo} alt="WinnStorm" className="h-10 relative z-10" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-cyan-500 bg-clip-text text-transparent">
                    CRM Integrations
                  </h1>
                  <p className="text-muted-foreground text-sm">
                    Connect roofing CRM systems to automatically sync property data, inspection results, and Winn Reports
                  </p>
                </div>
              </div>
            </div>
            
            {/* Integration Benefits Banner */}
            <Card className="bg-gradient-to-r from-primary/10 to-cyan-500/10 border-primary/30 mb-6">
              <CardContent className="p-6">
                <div className="grid md:grid-cols-3 gap-6">
                  <div className="flex items-center space-x-3">
                    <div className="p-3 bg-primary/20 rounded-lg">
                      <Zap className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">Automated Workflows</h3>
                      <p className="text-sm text-muted-foreground">Auto-sync damage assessments to your CRM</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="p-3 bg-cyan-500/20 rounded-lg">
                      <Building2 className="h-6 w-6 text-cyan-500" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">Property Management</h3>
                      <p className="text-sm text-muted-foreground">Seamless property data synchronization</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="p-3 bg-blue-500/20 rounded-lg">
                      <Database className="h-6 w-6 text-blue-500" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">Report Delivery</h3>
                      <p className="text-sm text-muted-foreground">Direct Winn Report delivery to clients</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="bg-card border-border">
              <TabsTrigger value="overview" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <Database className="w-4 h-4 mr-2" />
                Overview
              </TabsTrigger>
              <TabsTrigger value="configurations" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <Settings className="w-4 h-4 mr-2" />
                Configurations
              </TabsTrigger>
              <TabsTrigger value="activity" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <Activity className="w-4 h-4 mr-2" />
                Activity
              </TabsTrigger>
            </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Stats Cards */}
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

                <Card className="bg-gradient-to-br from-card to-green-500/5 border-green-500/20">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-foreground flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-green-500" />
                      Successful Syncs
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-green-600 mb-2">
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

              {/* Active Integrations */}
              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle className="text-foreground">Active Integrations</CardTitle>
                  <CardDescription className="text-muted-foreground">
                    Your currently connected CRM systems
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
                      <p className="text-muted-foreground mb-4">No active CRM integrations</p>
                      <Button
                        onClick={() => setActiveTab('configurations')}
                        className="bg-primary hover:bg-primary/90"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Add Integration
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

              {/* Recent Activity */}
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
                              <CheckCircle className="w-5 h-5 text-green-500" />
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
                              className={log.status === 'success' ? 'bg-green-600 hover:bg-green-700' : ''}
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

            {/* Configurations Tab */}
            <TabsContent value="configurations" className="space-y-6">
              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle className="text-foreground flex items-center gap-2">
                    <Settings className="w-5 h-5 text-primary" />
                    CRM Configuration Manager
                  </CardTitle>
                  <CardDescription className="text-muted-foreground">
                    Set up and manage your CRM system connections for automated Winn Report delivery
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {/* Available CRM Systems */}
                    <div>
                      <h3 className="text-lg font-semibold text-foreground mb-4">Available Integrations</h3>
                      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {['jobnimbus', 'salesforce', 'hubspot', 'pipedrive', 'gohighlevel'].map((crm) => (
                          <Card key={crm} className="bg-secondary/10 border-border hover:border-primary/50 transition-colors cursor-pointer">
                            <CardContent className="p-4 text-center">
                              <div className="text-3xl mb-2">{getCrmTypeIcon(crm)}</div>
                              <h4 className="font-medium text-foreground">{getCrmTypeName(crm)}</h4>
                              <p className="text-sm text-muted-foreground mb-3">Professional roofing CRM</p>
                              <Button size="sm" className="bg-primary hover:bg-primary/90">
                                <Plus className="w-4 h-4 mr-1" />
                                Connect
                              </Button>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>

                    {/* Current Configurations */}
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
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Activity Tab */}
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
                              <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
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
                              className={log.status === 'success' ? 'bg-green-600 hover:bg-green-700' : ''}
                            >
                              {log.status}
                            </Badge>
                            {log.externalId && (
                              <p className="text-muted-foreground text-xs mt-1">
                                External ID: {log.externalId}
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