import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { Trash2, Plus, Settings, ExternalLink, Database, CheckCircle, AlertCircle } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

interface CrmConfig {
  id: number;
  name: string;
  type: string;
  apiKey: string;
  baseUrl: string;
  webhookUrl?: string;
  customFields?: Record<string, string>;
  isActive: boolean;
  createdAt: Date;
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
  syncedAt: Date;
}

const CRM_TYPES = [
  { value: 'jobnimbus', label: 'JobNimbus', description: 'Construction job management' },
  { value: 'gohighlevel', label: 'GoHighLevel', description: 'All-in-one CRM & marketing' },
  { value: 'salesforce', label: 'Salesforce', description: 'Enterprise CRM platform' },
  { value: 'hubspot', label: 'HubSpot', description: 'Inbound marketing & sales' },
  { value: 'pipedrive', label: 'Pipedrive', description: 'Sales-focused CRM' },
];

export const CrmConfigManager: React.FC = () => {
  const [selectedConfig, setSelectedConfig] = useState<CrmConfig | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    type: '',
    apiKey: '',
    baseUrl: '',
    webhookUrl: '',
    customFields: '{}',
    isActive: true
  });
  const [syncLogs, setSyncLogs] = useState<CrmSyncLog[]>([]);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch CRM configurations
  const { data: configs = [], isLoading, error } = useQuery<CrmConfig[]>({
    queryKey: ['/api/crm/configs'],
    queryFn: () => apiRequest('/api/crm/configs'),
  });

  // Create configuration mutation
  const createConfigMutation = useMutation({
    mutationFn: (data: any) => apiRequest('/api/crm/configs', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/crm/configs'] });
      setIsCreating(false);
      resetForm();
      toast({
        title: "CRM Configuration Created",
        description: "Your CRM integration has been set up successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Create Configuration",
        description: error.message || "Please check your settings and try again.",
        variant: "destructive",
      });
    }
  });

  // Update configuration mutation
  const updateConfigMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => 
      apiRequest(`/api/crm/configs/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/crm/configs'] });
      setSelectedConfig(null);
      toast({
        title: "Configuration Updated",
        description: "Your CRM settings have been updated successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Update Configuration",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    }
  });

  // Delete configuration mutation
  const deleteConfigMutation = useMutation({
    mutationFn: (id: number) => apiRequest(`/api/crm/configs/${id}`, {
      method: 'DELETE'
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/crm/configs'] });
      toast({
        title: "Configuration Deleted",
        description: "The CRM configuration has been removed.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Delete Configuration",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    }
  });

  // Fetch sync logs for selected config
  const fetchSyncLogs = async (configId: number) => {
    try {
      const logs = await apiRequest(`/api/crm/sync/logs/${configId}`);
      setSyncLogs(logs);
    } catch (error) {
      console.error('Failed to fetch sync logs:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      type: '',
      apiKey: '',
      baseUrl: '',
      webhookUrl: '',
      customFields: '{}',
      isActive: true
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const customFields = formData.customFields ? JSON.parse(formData.customFields) : {};
      
      const submitData = {
        ...formData,
        customFields: Object.keys(customFields).length > 0 ? customFields : null
      };

      if (selectedConfig) {
        updateConfigMutation.mutate({ id: selectedConfig.id, data: submitData });
      } else {
        createConfigMutation.mutate(submitData);
      }
    } catch (error) {
      toast({
        title: "Invalid Custom Fields",
        description: "Please ensure custom fields are valid JSON format.",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (config: CrmConfig) => {
    setSelectedConfig(config);
    setFormData({
      name: config.name,
      type: config.type,
      apiKey: config.apiKey,
      baseUrl: config.baseUrl,
      webhookUrl: config.webhookUrl || '',
      customFields: JSON.stringify(config.customFields || {}, null, 2),
      isActive: config.isActive
    });
    setIsCreating(true);
    fetchSyncLogs(config.id);
  };

  const getDefaultBaseUrl = (type: string) => {
    const defaults = {
      'jobnimbus': 'https://api.jobnimbus.com/api1',
      'gohighlevel': 'https://rest.gohighlevel.com/v1',
      'salesforce': 'https://your-domain.my.salesforce.com/services/data/v54.0',
      'hubspot': 'https://api.hubapi.com',
      'pipedrive': 'https://api.pipedrive.com/v1'
    };
    return defaults[type] || '';
  };

  const handleTypeChange = (type: string) => {
    setFormData(prev => ({
      ...prev,
      type,
      baseUrl: getDefaultBaseUrl(type)
    }));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-white">CRM Integrations</h2>
          <p className="text-gray-400 mt-1">
            Connect your roofing CRM to automatically sync property data and reports
          </p>
        </div>
        <Button
          onClick={() => {
            setIsCreating(true);
            resetForm();
            setSelectedConfig(null);
          }}
          className="bg-red-600 hover:bg-red-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Integration
        </Button>
      </div>

      {/* Configuration List */}
      <div className="grid gap-4">
        {configs.map((config) => (
          <Card key={config.id} className="bg-zinc-900 border-zinc-800">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Database className="w-5 h-5" />
                    {config.name}
                  </CardTitle>
                  <CardDescription className="text-gray-400">
                    {CRM_TYPES.find(t => t.value === config.type)?.label || config.type}
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={config.isActive ? "default" : "secondary"}>
                    {config.isActive ? "Active" : "Inactive"}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEdit(config)}
                    className="text-gray-400 hover:text-white"
                  >
                    <Settings className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteConfigMutation.mutate(config.id)}
                    className="text-red-400 hover:text-red-300"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-400">API Endpoint:</span>
                  <p className="text-white font-mono text-xs truncate">{config.baseUrl}</p>
                </div>
                <div>
                  <span className="text-gray-400">Created:</span>
                  <p className="text-white">{new Date(config.createdAt).toLocaleDateString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Create/Edit Form */}
      {isCreating && (
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-white">
              {selectedConfig ? 'Edit Integration' : 'New CRM Integration'}
            </CardTitle>
            <CardDescription className="text-gray-400">
              Configure your CRM connection settings
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name" className="text-white">Integration Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g., Main JobNimbus"
                    className="bg-zinc-800 border-zinc-700 text-white"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="type" className="text-white">CRM Type</Label>
                  <Select value={formData.type} onValueChange={handleTypeChange}>
                    <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white">
                      <SelectValue placeholder="Select CRM type" />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-800 border-zinc-700">
                      {CRM_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          <div>
                            <div className="font-medium">{type.label}</div>
                            <div className="text-xs text-gray-400">{type.description}</div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="apiKey" className="text-white">API Key</Label>
                <Input
                  id="apiKey"
                  type="password"
                  value={formData.apiKey}
                  onChange={(e) => setFormData(prev => ({ ...prev, apiKey: e.target.value }))}
                  placeholder="Enter your API key"
                  className="bg-zinc-800 border-zinc-700 text-white"
                  required
                />
              </div>

              <div>
                <Label htmlFor="baseUrl" className="text-white">API Base URL</Label>
                <Input
                  id="baseUrl"
                  value={formData.baseUrl}
                  onChange={(e) => setFormData(prev => ({ ...prev, baseUrl: e.target.value }))}
                  placeholder="https://api.example.com/v1"
                  className="bg-zinc-800 border-zinc-700 text-white"
                  required
                />
              </div>

              <div>
                <Label htmlFor="webhookUrl" className="text-white">Webhook URL (Optional)</Label>
                <Input
                  id="webhookUrl"
                  value={formData.webhookUrl}
                  onChange={(e) => setFormData(prev => ({ ...prev, webhookUrl: e.target.value }))}
                  placeholder="https://your-webhook-endpoint.com"
                  className="bg-zinc-800 border-zinc-700 text-white"
                />
              </div>

              <div>
                <Label htmlFor="customFields" className="text-white">Custom Fields (JSON)</Label>
                <Textarea
                  id="customFields"
                  value={formData.customFields}
                  onChange={(e) => setFormData(prev => ({ ...prev, customFields: e.target.value }))}
                  placeholder='{"field1": "value1", "field2": "value2"}'
                  className="bg-zinc-800 border-zinc-700 text-white font-mono"
                  rows={3}
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="isActive"
                  checked={formData.isActive}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isActive: checked }))}
                />
                <Label htmlFor="isActive" className="text-white">Active</Label>
              </div>

              <div className="flex justify-end space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsCreating(false);
                    setSelectedConfig(null);
                    resetForm();
                  }}
                  className="border-zinc-600 text-gray-300"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="bg-red-600 hover:bg-red-700"
                  disabled={createConfigMutation.isPending || updateConfigMutation.isPending}
                >
                  {createConfigMutation.isPending || updateConfigMutation.isPending ? 'Saving...' : 'Save Integration'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Sync Logs */}
      {selectedConfig && syncLogs.length > 0 && (
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-white">Sync History</CardTitle>
            <CardDescription className="text-gray-400">
              Recent synchronization activity for {selectedConfig.name}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {syncLogs.slice(0, 10).map((log) => (
                <div key={log.id} className="flex items-center justify-between p-3 bg-zinc-800 rounded-lg">
                  <div className="flex items-center gap-3">
                    {log.status === 'success' ? (
                      <CheckCircle className="w-5 h-5 text-green-400" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-red-400" />
                    )}
                    <div>
                      <p className="text-white font-medium">{log.syncType} sync</p>
                      <p className="text-gray-400 text-sm">
                        {new Date(log.syncedAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge variant={log.status === 'success' ? "default" : "destructive"}>
                      {log.status}
                    </Badge>
                    {log.externalId && (
                      <p className="text-gray-400 text-xs mt-1">ID: {log.externalId}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default CrmConfigManager;