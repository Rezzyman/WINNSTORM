import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Upload, Database, CheckCircle, AlertCircle, User, Building } from 'lucide-react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Property, Scan } from '@shared/schema';

interface CrmConfig {
  id: number;
  name: string;
  type: string;
  isActive: boolean;
}

interface CrmSyncProps {
  property: Property;
  scan: Scan;
}

interface OwnerInfo {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  company?: string;
  address?: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
  };
}

export const CrmSync: React.FC<CrmSyncProps> = ({ property, scan }) => {
  const [selectedCrmId, setSelectedCrmId] = useState<number | null>(null);
  const [ownerInfo, setOwnerInfo] = useState<OwnerInfo>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    company: '',
    address: {
      street: property.address || '',
      city: '',
      state: '',
      zipCode: ''
    }
  });
  const [isExpanded, setIsExpanded] = useState(false);
  const { toast } = useToast();

  // Fetch available CRM configurations
  const { data: crmConfigs = [], isLoading } = useQuery<CrmConfig[]>({
    queryKey: ['/api/crm/configs'],
    queryFn: () => apiRequest('/api/crm/configs'),
  });

  const activeCrmConfigs = crmConfigs.filter(config => config.isActive);

  // Sync to CRM mutation
  const syncMutation = useMutation({
    mutationFn: async (data: { crmConfigId: number; propertyId: number; ownerInfo: OwnerInfo }) => {
      return apiRequest('/api/crm/sync/property', {
        method: 'POST',
        body: JSON.stringify(data)
      });
    },
    onSuccess: (data) => {
      const successResults = data.results.filter((r: any) => r.success);
      const failedResults = data.results.filter((r: any) => !r.success);
      
      if (successResults.length > 0) {
        toast({
          title: "CRM Sync Successful",
          description: `Successfully synced ${successResults.length} item(s) to CRM.`,
        });
      }
      
      if (failedResults.length > 0) {
        toast({
          title: "Partial Sync Failure",
          description: `${failedResults.length} item(s) failed to sync. Check the logs for details.`,
          variant: "destructive",
        });
      }
    },
    onError: (error: any) => {
      toast({
        title: "CRM Sync Failed",
        description: error.message || "Failed to sync property data to CRM.",
        variant: "destructive",
      });
    }
  });

  const handleSync = () => {
    if (!selectedCrmId) {
      toast({
        title: "No CRM Selected",
        description: "Please select a CRM configuration first.",
        variant: "destructive",
      });
      return;
    }

    if (!ownerInfo.firstName || !ownerInfo.lastName || !ownerInfo.email) {
      toast({
        title: "Missing Owner Information",
        description: "Please provide at least first name, last name, and email.",
        variant: "destructive",
      });
      return;
    }

    syncMutation.mutate({
      crmConfigId: selectedCrmId,
      propertyId: property.id,
      ownerInfo
    });
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-600';
      case 'major': return 'bg-orange-600';
      case 'minor': return 'bg-yellow-600';
      default: return 'bg-blue-600';
    }
  };

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

  if (isLoading) {
    return (
      <Card className="bg-card border-border">
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-red-600"></div>
            <span className="ml-2 text-muted-foreground">Loading CRM configurations...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (activeCrmConfigs.length === 0) {
    return (
      <Card className="bg-card border-border">
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">
            <Database className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No active CRM integrations found.</p>
            <p className="text-sm mt-1">Configure a CRM integration to sync property data.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="text-foreground flex items-center gap-2">
          <Database className="w-5 h-5" />
          CRM Integration
        </CardTitle>
        <CardDescription className="text-muted-foreground">
          Sync property data and inspection results to your CRM system
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* CRM Selection */}
        <div>
          <Label htmlFor="crm-select" className="text-foreground">Select CRM</Label>
          <Select value={selectedCrmId?.toString()} onValueChange={(value) => setSelectedCrmId(parseInt(value))}>
            <SelectTrigger className="bg-muted border-input text-foreground">
              <SelectValue placeholder="Choose a CRM integration" />
            </SelectTrigger>
            <SelectContent className="bg-muted border-input">
              {activeCrmConfigs.map((config) => (
                <SelectItem key={config.id} value={config.id.toString()}>
                  <div className="flex items-center gap-2">
                    <span>{getCrmTypeIcon(config.type)}</span>
                    <span>{config.name}</span>
                    <Badge variant="outline" className="text-xs">
                      {config.type}
                    </Badge>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Property Summary */}
        <div className="bg-muted p-4 rounded-lg">
          <h4 className="text-foreground font-medium mb-2 flex items-center gap-2">
            <Building className="w-4 h-4" />
            Property Summary
          </h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Name:</span>
              <p className="text-foreground">{property.name}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Health Score:</span>
              <p className="text-foreground">{property.healthScore}/100</p>
            </div>
            <div>
              <span className="text-muted-foreground">Address:</span>
              <p className="text-foreground">{property.address}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Issues Found:</span>
              <p className="text-foreground">{scan.issues.length} issues</p>
            </div>
          </div>
          
          {/* Issues Preview */}
          {scan.issues.length > 0 && (
            <div className="mt-3">
              <p className="text-muted-foreground text-sm mb-2">Critical Issues:</p>
              <div className="flex flex-wrap gap-1">
                {scan.issues.filter(issue => issue.severity === 'critical').slice(0, 3).map((issue, index) => (
                  <Badge key={index} className={`${getSeverityColor(issue.severity)} text-foreground text-xs`}>
                    {issue.title}
                  </Badge>
                ))}
                {scan.issues.filter(issue => issue.severity === 'critical').length > 3 && (
                  <Badge variant="outline" className="text-xs">
                    +{scan.issues.filter(issue => issue.severity === 'critical').length - 3} more
                  </Badge>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Owner Information */}
        <div>
          <Button
            variant="outline"
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-full justify-between border-input text-foreground hover:bg-muted"
          >
            <span className="flex items-center gap-2">
              <User className="w-4 h-4" />
              Property Owner Information
            </span>
            <span>{isExpanded ? '−' : '+'}</span>
          </Button>
          
          {isExpanded && (
            <div className="mt-4 space-y-3 bg-muted p-4 rounded-lg">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="firstName" className="text-foreground">First Name *</Label>
                  <Input
                    id="firstName"
                    value={ownerInfo.firstName}
                    onChange={(e) => setOwnerInfo(prev => ({ ...prev, firstName: e.target.value }))}
                    className="bg-input border-border text-foreground"
                    placeholder="John"
                  />
                </div>
                <div>
                  <Label htmlFor="lastName" className="text-foreground">Last Name *</Label>
                  <Input
                    id="lastName"
                    value={ownerInfo.lastName}
                    onChange={(e) => setOwnerInfo(prev => ({ ...prev, lastName: e.target.value }))}
                    className="bg-input border-border text-foreground"
                    placeholder="Doe"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="email" className="text-foreground">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={ownerInfo.email}
                    onChange={(e) => setOwnerInfo(prev => ({ ...prev, email: e.target.value }))}
                    className="bg-input border-border text-foreground"
                    placeholder="john@example.com"
                  />
                </div>
                <div>
                  <Label htmlFor="phone" className="text-foreground">Phone</Label>
                  <Input
                    id="phone"
                    value={ownerInfo.phone}
                    onChange={(e) => setOwnerInfo(prev => ({ ...prev, phone: e.target.value }))}
                    className="bg-input border-border text-foreground"
                    placeholder="(555) 123-4567"
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="company" className="text-foreground">Company</Label>
                <Input
                  id="company"
                  value={ownerInfo.company}
                  onChange={(e) => setOwnerInfo(prev => ({ ...prev, company: e.target.value }))}
                  className="bg-input border-border text-foreground"
                  placeholder="Company Name"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="city" className="text-foreground">City</Label>
                  <Input
                    id="city"
                    value={ownerInfo.address?.city || ''}
                    onChange={(e) => setOwnerInfo(prev => ({ 
                      ...prev, 
                      address: { ...prev.address!, city: e.target.value }
                    }))}
                    className="bg-input border-border text-foreground"
                    placeholder="City"
                  />
                </div>
                <div>
                  <Label htmlFor="state" className="text-foreground">State</Label>
                  <Input
                    id="state"
                    value={ownerInfo.address?.state || ''}
                    onChange={(e) => setOwnerInfo(prev => ({ 
                      ...prev, 
                      address: { ...prev.address!, state: e.target.value }
                    }))}
                    className="bg-input border-border text-foreground"
                    placeholder="State"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Sync Button */}
        <Button
          onClick={handleSync}
          disabled={!selectedCrmId || syncMutation.isPending}
          className="w-full bg-red-600 hover:bg-red-700 disabled:bg-gray-600"
        >
          {syncMutation.isPending ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Syncing to CRM...
            </>
          ) : (
            <>
              <Upload className="w-4 h-4 mr-2" />
              Sync to CRM
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
};

export default CrmSync;