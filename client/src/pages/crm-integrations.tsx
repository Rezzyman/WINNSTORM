import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Database, Settings, Activity, Plus, CheckCircle, AlertCircle, Clock } from 'lucide-react';
import CrmConfigManager from '@/components/crm-config';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

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

  // Fetch CRM configurations
  const { data: configs = [], isLoading: configsLoading } = useQuery<CrmConfig[]>({
    queryKey: ['/api/crm/configs'],
    queryFn: () => apiRequest('/api/crm/configs'),
  });

  // Fetch recent sync logs from all configs
  const { data: allSyncLogs = [], isLoading: logsLoading } = useQuery<CrmSyncLog[]>({
    queryKey: ['/api/crm/sync/logs', 'all'],
    queryFn: async () => {
      const logs: CrmSyncLog[] = [];
      for (const config of configs) {
        try {
          const configLogs = await apiRequest(`/api/crm/sync/logs/${config.id}`);
          logs.push(...configLogs);
        } catch (error) {
          console.error(`Failed to fetch logs for config ${config.id}:`, error);
        }
      }
      return logs.sort((a, b) => new Date(b.syncedAt).getTime() - new Date(a.syncedAt).getTime());
    },
    enabled: configs.length > 0,
  });

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
    <div className="min-h-screen bg-black">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">CRM Integrations</h1>
          <p className="text-gray-400">
            Connect your roofing CRM systems to automatically sync property data, inspection results, and reports
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-zinc-900 border-zinc-800">
            <TabsTrigger value="overview" className="data-[state=active]:bg-red-600">
              <Database className="w-4 h-4 mr-2" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="configurations" className="data-[state=active]:bg-red-600">
              <Settings className="w-4 h-4 mr-2" />
              Configurations
            </TabsTrigger>
            <TabsTrigger value="activity" className="data-[state=active]:bg-red-600">
              <Activity className="w-4 h-4 mr-2" />
              Activity
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="bg-zinc-900 border-zinc-800">
                <CardHeader className="pb-3">
                  <CardTitle className="text-white flex items-center gap-2">
                    <Database className="w-5 h-5 text-blue-400" />
                    Active Integrations
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-white mb-2">
                    {configsLoading ? '...' : activeConfigs.length}
                  </div>
                  <p className="text-gray-400 text-sm">
                    {configs.length - activeConfigs.length} inactive
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-zinc-900 border-zinc-800">
                <CardHeader className="pb-3">
                  <CardTitle className="text-white flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-400" />
                    Successful Syncs
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-white mb-2">
                    {logsLoading ? '...' : successfulSyncs}
                  </div>
                  <p className="text-gray-400 text-sm">
                    {((successfulSyncs / (successfulSyncs + failedSyncs)) * 100 || 0).toFixed(1)}% success rate
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-zinc-900 border-zinc-800">
                <CardHeader className="pb-3">
                  <CardTitle className="text-white flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-red-400" />
                    Failed Syncs
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-white mb-2">
                    {logsLoading ? '...' : failedSyncs}
                  </div>
                  <p className="text-gray-400 text-sm">
                    Last 30 days
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Active Integrations */}
            <Card className="bg-zinc-900 border-zinc-800">
              <CardHeader>
                <CardTitle className="text-white">Active Integrations</CardTitle>
                <CardDescription className="text-gray-400">
                  Your currently connected CRM systems
                </CardDescription>
              </CardHeader>
              <CardContent>
                {configsLoading ? (
                  <div className="flex items-center justify-center p-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
                  </div>
                ) : activeConfigs.length === 0 ? (
                  <div className="text-center py-8">
                    <Database className="w-12 h-12 mx-auto text-gray-600 mb-4" />
                    <p className="text-gray-400 mb-4">No active CRM integrations</p>
                    <Button
                      onClick={() => setActiveTab('configurations')}
                      className="bg-red-600 hover:bg-red-700"
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
                        className="flex items-center justify-between p-4 bg-zinc-800 rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{getCrmTypeIcon(config.type)}</span>
                          <div>
                            <h3 className="text-white font-medium">{config.name}</h3>
                            <p className="text-gray-400 text-sm">{getCrmTypeName(config.type)}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="default" className="bg-green-600">
                            Active
                          </Badge>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setActiveTab('configurations')}
                            className="text-gray-400 hover:text-white"
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
            <Card className="bg-zinc-900 border-zinc-800">
              <CardHeader>
                <CardTitle className="text-white">Recent Activity</CardTitle>
                <CardDescription className="text-gray-400">
                  Latest synchronization events
                </CardDescription>
              </CardHeader>
              <CardContent>
                {logsLoading ? (
                  <div className="flex items-center justify-center p-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
                  </div>
                ) : recentLogs.length === 0 ? (
                  <div className="text-center py-8">
                    <Activity className="w-12 h-12 mx-auto text-gray-600 mb-4" />
                    <p className="text-gray-400">No recent activity</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {recentLogs.map((log) => (
                      <div
                        key={log.id}
                        className="flex items-center justify-between p-3 bg-zinc-800 rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          {log.status === 'success' ? (
                            <CheckCircle className="w-5 h-5 text-green-400" />
                          ) : log.status === 'failed' ? (
                            <AlertCircle className="w-5 h-5 text-red-400" />
                          ) : (
                            <Clock className="w-5 h-5 text-yellow-400" />
                          )}
                          <div>
                            <p className="text-white font-medium">
                              {formatSyncType(log.syncType)} sync
                            </p>
                            <p className="text-gray-400 text-sm">
                              {new Date(log.syncedAt).toLocaleString()}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge
                            variant={log.status === 'success' ? 'default' : 'destructive'}
                            className={log.status === 'success' ? 'bg-green-600' : ''}
                          >
                            {log.status}
                          </Badge>
                          {log.externalId && (
                            <p className="text-gray-400 text-xs mt-1">
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
          <TabsContent value="configurations">
            <CrmConfigManager />
          </TabsContent>

          {/* Activity Tab */}
          <TabsContent value="activity" className="space-y-6">
            <Card className="bg-zinc-900 border-zinc-800">
              <CardHeader>
                <CardTitle className="text-white">All Sync Activity</CardTitle>
                <CardDescription className="text-gray-400">
                  Complete history of CRM synchronization events
                </CardDescription>
              </CardHeader>
              <CardContent>
                {logsLoading ? (
                  <div className="flex items-center justify-center p-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
                  </div>
                ) : allSyncLogs.length === 0 ? (
                  <div className="text-center py-8">
                    <Activity className="w-12 h-12 mx-auto text-gray-600 mb-4" />
                    <p className="text-gray-400">No sync activity found</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {allSyncLogs.map((log) => (
                      <div
                        key={log.id}
                        className="flex items-start justify-between p-4 bg-zinc-800 rounded-lg"
                      >
                        <div className="flex items-start gap-3">
                          {log.status === 'success' ? (
                            <CheckCircle className="w-5 h-5 text-green-400 mt-0.5" />
                          ) : log.status === 'failed' ? (
                            <AlertCircle className="w-5 h-5 text-red-400 mt-0.5" />
                          ) : (
                            <Clock className="w-5 h-5 text-yellow-400 mt-0.5" />
                          )}
                          <div className="flex-1">
                            <p className="text-white font-medium">
                              {formatSyncType(log.syncType)} sync
                            </p>
                            <p className="text-gray-400 text-sm">
                              {new Date(log.syncedAt).toLocaleString()}
                            </p>
                            {log.errorMessage && (
                              <p className="text-red-400 text-sm mt-1">
                                Error: {log.errorMessage}
                              </p>
                            )}
                            {log.propertyId && (
                              <p className="text-gray-500 text-xs mt-1">
                                Property ID: {log.propertyId}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge
                            variant={log.status === 'success' ? 'default' : 'destructive'}
                            className={log.status === 'success' ? 'bg-green-600' : ''}
                          >
                            {log.status}
                          </Badge>
                          {log.externalId && (
                            <p className="text-gray-400 text-xs mt-1">
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
    </div>
  );
};

export default CrmIntegrationsPage;