import { Property, Scan, Report } from "@shared/schema";

// CRM Integration Types
export interface CRMConfig {
  type: 'jobnimbus' | 'aterna' | 'salesforce' | 'hubspot' | 'pipedrive';
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
    } catch (error: any) {
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
    } catch (error: any) {
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

// Salesforce Integration
class SalesforceIntegration {
  private config: CRMConfig;

  constructor(config: CRMConfig) {
    this.config = config;
  }

  async createContact(contact: CRMContact): Promise<CRMSyncResult> {
    try {
      const response = await fetch(`${this.config.baseUrl}/services/data/v58.0/sobjects/Contact`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          FirstName: contact.firstName,
          LastName: contact.lastName,
          Email: contact.email,
          Phone: contact.phone,
          MailingStreet: contact.address?.street,
          MailingCity: contact.address?.city,
          MailingState: contact.address?.state,
          MailingPostalCode: contact.address?.zipCode,
          Description: contact.company ? `Company: ${contact.company}` : undefined,
          ...contact.customFields
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Salesforce API error: ${response.statusText} - ${JSON.stringify(errorData)}`);
      }

      const result = await response.json();
      
      return {
        success: true,
        contactId: result.id,
        syncedAt: new Date()
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        syncedAt: new Date()
      };
    }
  }

  async createJob(job: CRMJob): Promise<CRMSyncResult> {
    try {
      // Salesforce uses Opportunities for deals/jobs
      const response = await fetch(`${this.config.baseUrl}/services/data/v58.0/sobjects/Opportunity`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          Name: job.name,
          StageName: this.mapStatusToSalesforceStage(job.status),
          Amount: job.estimatedValue,
          Description: job.notes,
          CloseDate: job.scheduledDate?.toISOString().split('T')[0] || new Date().toISOString().split('T')[0],
          Type: job.type,
          ...job.customFields
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Salesforce API error: ${response.statusText} - ${JSON.stringify(errorData)}`);
      }

      const result = await response.json();
      
      // Link contact to opportunity via OpportunityContactRole
      if (job.contactId) {
        await this.linkContactToOpportunity(result.id, job.contactId);
      }
      
      return {
        success: true,
        jobId: result.id,
        syncedAt: new Date()
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        syncedAt: new Date()
      };
    }
  }

  private async linkContactToOpportunity(opportunityId: string, contactId: string): Promise<void> {
    try {
      await fetch(`${this.config.baseUrl}/services/data/v58.0/sobjects/OpportunityContactRole`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          OpportunityId: opportunityId,
          ContactId: contactId,
          IsPrimary: true,
          Role: 'Decision Maker'
        })
      });
    } catch (error) {
      console.error('Failed to link contact to opportunity:', error);
    }
  }

  private mapStatusToSalesforceStage(status: string): string {
    const stageMap: Record<string, string> = {
      'New': 'Prospecting',
      'In Progress': 'Qualification',
      'Pending': 'Needs Analysis',
      'Completed': 'Closed Won',
      'Cancelled': 'Closed Lost'
    };
    return stageMap[status] || 'Qualification';
  }

  async uploadDocument(jobId: string, fileName: string, fileData: Buffer): Promise<boolean> {
    try {
      // Create ContentVersion (file) in Salesforce
      const base64Data = fileData.toString('base64');
      
      const response = await fetch(`${this.config.baseUrl}/services/data/v58.0/sobjects/ContentVersion`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          Title: fileName.replace('.pdf', ''),
          PathOnClient: fileName,
          VersionData: base64Data,
          FirstPublishLocationId: jobId
        })
      });

      return response.ok;
    } catch (error) {
      console.error('Salesforce document upload error:', error);
      return false;
    }
  }
}

// HubSpot Integration
class HubSpotIntegration {
  private config: CRMConfig;

  constructor(config: CRMConfig) {
    this.config = config;
  }

  async createContact(contact: CRMContact): Promise<CRMSyncResult> {
    try {
      const response = await fetch(`${this.config.baseUrl}/crm/v3/objects/contacts`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          properties: {
            firstname: contact.firstName,
            lastname: contact.lastName,
            email: contact.email,
            phone: contact.phone,
            company: contact.company,
            address: contact.address?.street,
            city: contact.address?.city,
            state: contact.address?.state,
            zip: contact.address?.zipCode,
            ...contact.customFields
          }
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`HubSpot API error: ${response.statusText} - ${JSON.stringify(errorData)}`);
      }

      const result = await response.json();
      
      return {
        success: true,
        contactId: result.id,
        syncedAt: new Date()
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        syncedAt: new Date()
      };
    }
  }

  async createJob(job: CRMJob): Promise<CRMSyncResult> {
    try {
      // HubSpot uses Deals for jobs/opportunities
      const response = await fetch(`${this.config.baseUrl}/crm/v3/objects/deals`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          properties: {
            dealname: job.name,
            dealstage: this.mapStatusToHubSpotStage(job.status),
            amount: job.estimatedValue?.toString(),
            description: job.notes,
            closedate: job.scheduledDate?.toISOString(),
            pipeline: 'default',
            ...job.customFields
          }
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`HubSpot API error: ${response.statusText} - ${JSON.stringify(errorData)}`);
      }

      const result = await response.json();
      
      // Associate deal with contact
      if (job.contactId) {
        await this.associateDealWithContact(result.id, job.contactId);
      }
      
      return {
        success: true,
        jobId: result.id,
        syncedAt: new Date()
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        syncedAt: new Date()
      };
    }
  }

  private async associateDealWithContact(dealId: string, contactId: string): Promise<void> {
    try {
      await fetch(`${this.config.baseUrl}/crm/v4/objects/deals/${dealId}/associations/contacts/${contactId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify([{
          associationCategory: 'HUBSPOT_DEFINED',
          associationTypeId: 3 // Deal to Contact
        }])
      });
    } catch (error) {
      console.error('Failed to associate deal with contact:', error);
    }
  }

  private mapStatusToHubSpotStage(status: string): string {
    const stageMap: Record<string, string> = {
      'New': 'appointmentscheduled',
      'In Progress': 'qualifiedtobuy',
      'Pending': 'presentationscheduled',
      'Completed': 'closedwon',
      'Cancelled': 'closedlost'
    };
    return stageMap[status] || 'qualifiedtobuy';
  }

  async uploadDocument(jobId: string, fileName: string, fileData: Buffer): Promise<boolean> {
    try {
      // HubSpot file upload through Files API
      const formData = new FormData();
      formData.append('file', new Blob([fileData], { type: 'application/pdf' }), fileName);
      formData.append('options', JSON.stringify({
        access: 'PRIVATE',
        ttl: 'P12M',
        overwrite: false,
        duplicateValidationStrategy: 'NONE',
        duplicateValidationScope: 'EXACT_FOLDER'
      }));
      formData.append('folderPath', '/winn-reports');

      const uploadResponse = await fetch(`${this.config.baseUrl}/files/v3/files`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`
        },
        body: formData
      });

      if (!uploadResponse.ok) return false;

      const fileResult = await uploadResponse.json();

      // Create engagement/note with file attachment on deal
      await fetch(`${this.config.baseUrl}/crm/v3/objects/notes`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          properties: {
            hs_note_body: `Winn Report attached: ${fileName}`,
            hs_attachment_ids: fileResult.id
          },
          associations: [{
            to: { id: jobId },
            types: [{ associationCategory: 'HUBSPOT_DEFINED', associationTypeId: 214 }]
          }]
        })
      });

      return true;
    } catch (error) {
      console.error('HubSpot document upload error:', error);
      return false;
    }
  }
}

// Pipedrive Integration
class PipedriveIntegration {
  private config: CRMConfig;

  constructor(config: CRMConfig) {
    this.config = config;
  }

  async createContact(contact: CRMContact): Promise<CRMSyncResult> {
    try {
      // Pipedrive uses "persons" for contacts
      const response = await fetch(`${this.config.baseUrl}/persons?api_token=${this.config.apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: `${contact.firstName} ${contact.lastName}`,
          email: [{ value: contact.email, primary: true }],
          phone: [{ value: contact.phone, primary: true }],
          org_id: contact.company ? undefined : undefined, // Would need org lookup
          visible_to: 3, // Shared with everyone
          ...contact.customFields
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Pipedrive API error: ${response.statusText} - ${JSON.stringify(errorData)}`);
      }

      const result = await response.json();
      
      return {
        success: true,
        contactId: result.data.id.toString(),
        syncedAt: new Date()
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        syncedAt: new Date()
      };
    }
  }

  async createJob(job: CRMJob): Promise<CRMSyncResult> {
    try {
      // Pipedrive uses "deals" for jobs/opportunities
      const response = await fetch(`${this.config.baseUrl}/deals?api_token=${this.config.apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: job.name,
          person_id: parseInt(job.contactId),
          value: job.estimatedValue,
          currency: 'USD',
          status: this.mapStatusToPipedriveStatus(job.status),
          expected_close_date: job.scheduledDate?.toISOString().split('T')[0],
          visible_to: 3,
          ...job.customFields
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Pipedrive API error: ${response.statusText} - ${JSON.stringify(errorData)}`);
      }

      const result = await response.json();
      
      // Add note with job details
      if (job.notes) {
        await this.addNoteToDeal(result.data.id, job.notes);
      }
      
      return {
        success: true,
        jobId: result.data.id.toString(),
        syncedAt: new Date()
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        syncedAt: new Date()
      };
    }
  }

  private async addNoteToDeal(dealId: number, content: string): Promise<void> {
    try {
      await fetch(`${this.config.baseUrl}/notes?api_token=${this.config.apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          content: content,
          deal_id: dealId
        })
      });
    } catch (error) {
      console.error('Failed to add note to deal:', error);
    }
  }

  private mapStatusToPipedriveStatus(status: string): string {
    const statusMap: Record<string, string> = {
      'New': 'open',
      'In Progress': 'open',
      'Pending': 'open',
      'Completed': 'won',
      'Cancelled': 'lost'
    };
    return statusMap[status] || 'open';
  }

  async uploadDocument(jobId: string, fileName: string, fileData: Buffer): Promise<boolean> {
    try {
      const formData = new FormData();
      formData.append('file', new Blob([fileData], { type: 'application/pdf' }), fileName);
      formData.append('deal_id', jobId);

      const response = await fetch(`${this.config.baseUrl}/files?api_token=${this.config.apiKey}`, {
        method: 'POST',
        body: formData
      });

      return response.ok;
    } catch (error) {
      console.error('Pipedrive document upload error:', error);
      return false;
    }
  }
}

// ATERNA CRM+ Integration (White-labeled)
class AternaIntegration {
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
        throw new Error(`ATERNA CRM+ API error: ${response.statusText}`);
      }

      const result = await response.json();
      
      return {
        success: true,
        contactId: result.contact.id,
        syncedAt: new Date()
      };
    } catch (error: any) {
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
        throw new Error(`ATERNA CRM+ API error: ${response.statusText}`);
      }

      const result = await response.json();
      
      return {
        success: true,
        jobId: result.opportunity.id,
        syncedAt: new Date()
      };
    } catch (error: any) {
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
      case 'aterna':
        this.integrations.set(name, new AternaIntegration(config));
        break;
      case 'salesforce':
        this.integrations.set(name, new SalesforceIntegration(config));
        break;
      case 'hubspot':
        this.integrations.set(name, new HubSpotIntegration(config));
        break;
      case 'pipedrive':
        this.integrations.set(name, new PipedriveIntegration(config));
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
      const issues = scan.issues || [];
      const criticalCount = issues.filter(i => i.severity === 'critical').length;
      
      const job: CRMJob = {
        id: '',
        contactId: contactResult.contactId,
        name: `Thermal Roof Inspection - ${property.name}`,
        type: 'Thermal Inspection',
        status: 'In Progress',
        address: property.address,
        estimatedValue: this.calculateInspectionValue(scan),
        notes: `Thermal inspection completed on ${scan.date.toLocaleDateString()}. Issues found: ${issues.length}`,
        scheduledDate: scan.date,
        customFields: {
          property_id: property.id.toString(),
          scan_id: scan.id.toString(),
          condition: property.overallCondition || 'unknown',
          critical_issues: criticalCount.toString()
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
    const issues = scan.issues || [];
    const criticalIssues = issues.filter(i => i.severity === 'critical').length;
    const warningIssues = issues.filter(i => i.severity === 'warning').length;
    
    value += criticalIssues * 500; // $500 per critical issue for follow-up
    value += warningIssues * 250;  // $250 per warning issue for follow-up
    
    return value;
  }
}

// Export singleton instance
export const crmManager = new CRMIntegrationManager();