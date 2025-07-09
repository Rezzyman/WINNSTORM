import { Property, Scan, Report } from "@shared/schema";

// CRM Integration Types
export interface CRMConfig {
  type: 'jobnimbus' | 'gohighlevel' | 'salesforce' | 'hubspot' | 'pipedrive';
  apiKey: string;
  baseUrl: string;
  webhookUrl?: string;
  customFields?: Record<string, string>;
}

export interface CRMContact {
  id: string;
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
  customFields?: Record<string, any>;
}

export interface CRMJob {
  id: string;
  contactId: string;
  name: string;
  type: string;
  status: string;
  address: string;
  estimatedValue?: number;
  notes?: string;
  scheduledDate?: Date;
  customFields?: Record<string, any>;
}

export interface CRMSyncResult {
  success: boolean;
  contactId?: string;
  jobId?: string;
  error?: string;
  syncedAt: Date;
}

// JobNimbus Integration
class JobNimbusIntegration {
  private config: CRMConfig;

  constructor(config: CRMConfig) {
    this.config = config;
  }

  async createContact(contact: CRMContact): Promise<CRMSyncResult> {
    try {
      const response = await fetch(`${this.config.baseUrl}/contacts`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          first_name: contact.firstName,
          last_name: contact.lastName,
          email: contact.email,
          phone: contact.phone,
          company: contact.company,
          address_line_1: contact.address?.street,
          city: contact.address?.city,
          state_text: contact.address?.state,
          zip: contact.address?.zipCode,
          ...contact.customFields
        })
      });

      if (!response.ok) {
        throw new Error(`JobNimbus API error: ${response.statusText}`);
      }

      const result = await response.json();
      
      return {
        success: true,
        contactId: result.jnid,
        syncedAt: new Date()
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        syncedAt: new Date()
      };
    }
  }

  async createJob(job: CRMJob): Promise<CRMSyncResult> {
    try {
      const response = await fetch(`${this.config.baseUrl}/jobs`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: job.name,
          number: `WINN-${Date.now()}`,
          job_type: job.type,
          stage: job.status,
          primary_contact: job.contactId,
          address_line_1: job.address,
          estimated_value: job.estimatedValue,
          description: job.notes,
          date_start: job.scheduledDate?.toISOString(),
          ...job.customFields
        })
      });

      if (!response.ok) {
        throw new Error(`JobNimbus API error: ${response.statusText}`);
      }

      const result = await response.json();
      
      return {
        success: true,
        jobId: result.jnid,
        syncedAt: new Date()
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        syncedAt: new Date()
      };
    }
  }

  async uploadDocument(jobId: string, fileName: string, fileData: Buffer): Promise<boolean> {
    try {
      const formData = new FormData();
      formData.append('file', new Blob([fileData]), fileName);
      formData.append('related_id', jobId);
      formData.append('related_type', 'job');

      const response = await fetch(`${this.config.baseUrl}/files`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`
        },
        body: formData
      });

      return response.ok;
    } catch (error) {
      console.error('JobNimbus document upload error:', error);
      return false;
    }
  }
}

// GoHighLevel Integration
class GoHighLevelIntegration {
  private config: CRMConfig;

  constructor(config: CRMConfig) {
    this.config = config;
  }

  async createContact(contact: CRMContact): Promise<CRMSyncResult> {
    try {
      const response = await fetch(`${this.config.baseUrl}/contacts/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          firstName: contact.firstName,
          lastName: contact.lastName,
          email: contact.email,
          phone: contact.phone,
          companyName: contact.company,
          address1: contact.address?.street,
          city: contact.address?.city,
          state: contact.address?.state,
          postalCode: contact.address?.zipCode,
          customFields: contact.customFields
        })
      });

      if (!response.ok) {
        throw new Error(`GoHighLevel API error: ${response.statusText}`);
      }

      const result = await response.json();
      
      return {
        success: true,
        contactId: result.contact.id,
        syncedAt: new Date()
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        syncedAt: new Date()
      };
    }
  }

  async createOpportunity(job: CRMJob): Promise<CRMSyncResult> {
    try {
      const response = await fetch(`${this.config.baseUrl}/opportunities/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: job.name,
          contactId: job.contactId,
          status: job.status,
          monetaryValue: job.estimatedValue,
          notes: job.notes,
          customFields: job.customFields
        })
      });

      if (!response.ok) {
        throw new Error(`GoHighLevel API error: ${response.statusText}`);
      }

      const result = await response.json();
      
      return {
        success: true,
        jobId: result.opportunity.id,
        syncedAt: new Date()
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        syncedAt: new Date()
      };
    }
  }
}

// CRM Integration Manager
export class CRMIntegrationManager {
  private integrations: Map<string, any> = new Map();

  addIntegration(name: string, config: CRMConfig) {
    switch (config.type) {
      case 'jobnimbus':
        this.integrations.set(name, new JobNimbusIntegration(config));
        break;
      case 'gohighlevel':
        this.integrations.set(name, new GoHighLevelIntegration(config));
        break;
      default:
        throw new Error(`Unsupported CRM type: ${config.type}`);
    }
  }

  async syncPropertyToCRM(
    crmName: string, 
    property: Property, 
    scan: Scan, 
    ownerInfo: CRMContact
  ): Promise<CRMSyncResult[]> {
    const integration = this.integrations.get(crmName);
    if (!integration) {
      throw new Error(`CRM integration '${crmName}' not found`);
    }

    const results: CRMSyncResult[] = [];

    // Create or update contact
    const contactResult = await integration.createContact(ownerInfo);
    results.push(contactResult);

    if (contactResult.success && contactResult.contactId) {
      // Create job for thermal inspection
      const job: CRMJob = {
        id: '',
        contactId: contactResult.contactId,
        name: `Thermal Roof Inspection - ${property.name}`,
        type: 'Thermal Inspection',
        status: 'In Progress',
        address: property.address,
        estimatedValue: this.calculateInspectionValue(scan),
        notes: `Thermal inspection completed on ${scan.date.toLocaleDateString()}. Issues found: ${scan.issues.length}`,
        scheduledDate: scan.date,
        customFields: {
          property_id: property.id.toString(),
          scan_id: scan.id.toString(),
          health_score: property.healthScore.toString(),
          critical_issues: scan.issues.filter(i => i.severity === 'critical').length.toString()
        }
      };

      const jobResult = await integration.createJob(job);
      results.push(jobResult);
    }

    return results;
  }

  async syncReportToCRM(
    crmName: string,
    jobId: string,
    reportPdf: Buffer,
    fileName: string
  ): Promise<boolean> {
    const integration = this.integrations.get(crmName);
    if (!integration || !integration.uploadDocument) {
      return false;
    }

    return await integration.uploadDocument(jobId, fileName, reportPdf);
  }

  private calculateInspectionValue(scan: Scan): number {
    // Base inspection fee
    let value = 2500;
    
    // Add value based on issues found
    const criticalIssues = scan.issues.filter(i => i.severity === 'critical').length;
    const majorIssues = scan.issues.filter(i => i.severity === 'major').length;
    
    value += criticalIssues * 500; // $500 per critical issue for follow-up
    value += majorIssues * 250;    // $250 per major issue for follow-up
    
    return value;
  }
}

// Export singleton instance
export const crmManager = new CRMIntegrationManager();