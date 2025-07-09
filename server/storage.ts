import { User, InsertUser, Property, InsertProperty, Scan, InsertScan, Report, InsertReport, Metric, Issue, CrmConfig, InsertCrmConfig, CrmSyncLog, InsertCrmSyncLog } from "@shared/schema";

// Interface for storage
export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Property methods
  getProperty(id: number): Promise<Property | undefined>;
  getPropertiesByUser(userId: number): Promise<Property[]>;
  createProperty(property: InsertProperty): Promise<Property>;
  updateProperty(id: number, property: Partial<Property>): Promise<Property | undefined>;
  
  // Scan methods
  getScan(id: number): Promise<Scan | undefined>;
  getScansByProperty(propertyId: number): Promise<Scan[]>;
  createScan(scan: InsertScan): Promise<Scan>;
  
  // Report methods
  getReport(id: number): Promise<Report | undefined>;
  getReportsByScan(scanId: number): Promise<Report[]>;
  createReport(report: InsertReport): Promise<Report>;
  
  // CRM methods
  getCrmConfig(id: number): Promise<CrmConfig | undefined>;
  getCrmConfigsByUser(userId: number): Promise<CrmConfig[]>;
  createCrmConfig(config: InsertCrmConfig & { userId: number }): Promise<CrmConfig>;
  updateCrmConfig(id: number, config: Partial<CrmConfig>): Promise<CrmConfig | undefined>;
  deleteCrmConfig(id: number): Promise<boolean>;
  
  // CRM sync log methods
  getCrmSyncLog(id: number): Promise<CrmSyncLog | undefined>;
  getCrmSyncLogsByConfig(crmConfigId: number): Promise<CrmSyncLog[]>;
  createCrmSyncLog(log: InsertCrmSyncLog): Promise<CrmSyncLog>;
}

// In-memory storage implementation
export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private properties: Map<number, Property>;
  private scans: Map<number, Scan>;
  private reports: Map<number, Report>;
  private crmConfigs: Map<number, CrmConfig>;
  private crmSyncLogs: Map<number, CrmSyncLog>;
  private userId: number;
  private propertyId: number;
  private scanId: number;
  private reportId: number;
  private crmConfigId: number;
  private crmSyncLogId: number;

  constructor() {
    this.users = new Map();
    this.properties = new Map();
    this.scans = new Map();
    this.reports = new Map();
    this.crmConfigs = new Map();
    this.crmSyncLogs = new Map();
    this.userId = 1;
    this.propertyId = 1;
    this.scanId = 1;
    this.reportId = 1;
    this.crmConfigId = 1;
    this.crmSyncLogId = 1;
    
    // Add some initial demo data
    this.initDemoData();
  }

  private initDemoData() {
    // Create demo user
    const demoUser: User = {
      id: this.userId++,
      email: "demo@example.com",
      password: "password",
      role: "field-rep",
      createdAt: new Date(),
    };
    this.users.set(demoUser.id, demoUser);

    // Create demo properties
    const property1: Property = {
      id: this.propertyId++,
      name: "Office Complex",
      address: "123 Business Ave, Austin, TX",
      imageUrl: "https://cdn.pixabay.com/photo/2012/05/07/18/57/skyscrapers-49592_960_720.jpg",
      healthScore: 68,
      lastScanDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      createdAt: new Date(),
      userId: demoUser.id,
      scans: [],
      reports: [],
    };
    
    const property2: Property = {
      id: this.propertyId++,
      name: "Distribution Center",
      address: "456 Industrial Pkwy, Austin, TX",
      imageUrl: "https://cdn.pixabay.com/photo/2018/01/31/21/39/warehouse-3122321_960_720.jpg",
      healthScore: 42,
      lastScanDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      createdAt: new Date(),
      userId: demoUser.id,
      scans: [],
      reports: [],
    };
    
    this.properties.set(property1.id, property1);
    this.properties.set(property2.id, property2);

    // Create demo scans for property 1
    const scan1Metrics: Metric[] = [
      { name: "Membrane Integrity", value: 82 },
      { name: "Insulation Performance", value: 58 },
      { name: "Moisture Detection", value: 45 },
    ];
    
    const scan1Issues: Issue[] = [
      { 
        title: "Moisture Infiltration", 
        description: "Detected in NE corner, approximately 120 sq ft affected.", 
        severity: "critical" 
      },
      { 
        title: "Insulation Degradation", 
        description: "Central section shows heat loss, indicating poor insulation performance.", 
        severity: "warning" 
      },
      { 
        title: "HVAC Efficiency", 
        description: "Rooftop units showing normal thermal signatures.", 
        severity: "info" 
      }
    ];
    
    const scan1: Scan = {
      id: this.scanId++,
      propertyId: property1.id,
      date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      scanType: "drone",
      deviceType: "DJI Mavic 2 Enterprise",
      standardImageUrl: "https://cdn.pixabay.com/photo/2016/11/18/17/46/drone-1836350_1280.jpg",
      thermalImageUrl: "https://cdn.pixabay.com/photo/2019/09/14/09/48/thermal-imaging-4475776_1280.jpg",
      healthScore: 68,
      metrics: scan1Metrics,
      issues: scan1Issues,
      notes: "Regular annual inspection. Weather was clear, 72°F.",
      createdAt: new Date(),
      userId: demoUser.id,
    };
    
    const scan2: Scan = {
      id: this.scanId++,
      propertyId: property1.id,
      date: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
      scanType: "drone",
      deviceType: "DJI Mavic 2 Enterprise",
      standardImageUrl: "https://cdn.pixabay.com/photo/2016/11/18/17/46/drone-1836350_1280.jpg",
      thermalImageUrl: "https://cdn.pixabay.com/photo/2019/09/14/09/48/thermal-imaging-4475776_1280.jpg",
      healthScore: 75,
      metrics: [
        { name: "Membrane Integrity", value: 85 },
        { name: "Insulation Performance", value: 70 },
        { name: "Moisture Detection", value: 52 },
      ],
      issues: [
        { 
          title: "Minor Moisture Infiltration", 
          description: "Small area in NE corner shows early signs of moisture.", 
          severity: "warning" 
        },
        { 
          title: "HVAC Efficiency", 
          description: "Rooftop units showing normal thermal signatures.", 
          severity: "info" 
        }
      ],
      notes: "Regular quarterly inspection.",
      createdAt: new Date(),
      userId: demoUser.id,
    };
    
    // Create demo scan for property 2
    const scan3: Scan = {
      id: this.scanId++,
      propertyId: property2.id,
      date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      scanType: "handheld",
      deviceType: "FLIR E6-XT",
      standardImageUrl: "https://cdn.pixabay.com/photo/2018/01/31/21/39/warehouse-3122321_960_720.jpg",
      thermalImageUrl: "https://cdn.pixabay.com/photo/2019/09/14/09/48/thermal-imaging-4475776_1280.jpg",
      healthScore: 42,
      metrics: [
        { name: "Membrane Integrity", value: 35 },
        { name: "Insulation Performance", value: 42 },
        { name: "Moisture Detection", value: 28 },
      ],
      issues: [
        { 
          title: "Severe Moisture Infiltration", 
          description: "Multiple areas showing significant moisture penetration.", 
          severity: "critical" 
        },
        { 
          title: "Membrane Failure", 
          description: "Western section shows complete failure with water pooling.", 
          severity: "critical" 
        },
        { 
          title: "Insulation Saturation", 
          description: "Approximately 30% of roof insulation appears saturated.", 
          severity: "critical" 
        }
      ],
      notes: "Emergency scan following heavy rainfall.",
      createdAt: new Date(),
      userId: demoUser.id,
    };
    
    this.scans.set(scan1.id, scan1);
    this.scans.set(scan2.id, scan2);
    this.scans.set(scan3.id, scan3);
    
    // Update properties with scans
    property1.scans = [scan1, scan2];
    property2.scans = [scan3];
    property1.lastScanDate = scan1.date;
    property2.lastScanDate = scan3.date;
    
    // Create demo report
    const report1: Report = {
      id: this.reportId++,
      scanId: scan1.id,
      title: "Thermal Roof Assessment",
      pdfUrl: "",
      sentTo: "",
      createdAt: new Date(),
      userId: demoUser.id,
    };
    
    this.reports.set(report1.id, report1);
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email === email,
    );
  }

  async createUser(user: InsertUser): Promise<User> {
    const id = this.userId++;
    const newUser: User = { ...user, id, createdAt: new Date() };
    this.users.set(id, newUser);
    return newUser;
  }

  // Property methods
  async getProperty(id: number): Promise<Property | undefined> {
    const property = this.properties.get(id);
    if (property) {
      // Get scans for property
      property.scans = Array.from(this.scans.values()).filter(
        (scan) => scan.propertyId === id
      );
      
      // Get reports for property scans
      property.reports = Array.from(this.reports.values()).filter(
        (report) => property.scans?.some((scan) => scan.id === report.scanId)
      );
    }
    return property;
  }

  async getPropertiesByUser(userId: number): Promise<Property[]> {
    const properties = Array.from(this.properties.values()).filter(
      (property) => property.userId === userId
    );
    
    // Populate scans and reports for each property
    for (const property of properties) {
      property.scans = Array.from(this.scans.values()).filter(
        (scan) => scan.propertyId === property.id
      );
      
      property.reports = Array.from(this.reports.values()).filter(
        (report) => property.scans?.some((scan) => scan.id === report.scanId)
      );
    }
    
    return properties;
  }

  async createProperty(property: InsertProperty): Promise<Property> {
    const id = this.propertyId++;
    const newProperty: Property = { 
      ...property, 
      id, 
      healthScore: 0,
      createdAt: new Date(),
      scans: [],
      reports: []
    };
    this.properties.set(id, newProperty);
    return newProperty;
  }

  async updateProperty(id: number, updates: Partial<Property>): Promise<Property | undefined> {
    const property = this.properties.get(id);
    if (!property) return undefined;
    
    const updatedProperty = { ...property, ...updates };
    this.properties.set(id, updatedProperty);
    return updatedProperty;
  }

  // Scan methods
  async getScan(id: number): Promise<Scan | undefined> {
    return this.scans.get(id);
  }

  async getScansByProperty(propertyId: number): Promise<Scan[]> {
    return Array.from(this.scans.values()).filter(
      (scan) => scan.propertyId === propertyId
    );
  }

  async createScan(scan: InsertScan): Promise<Scan> {
    const id = this.scanId++;
    
    // Generate demo analysis
    const healthScore = Math.floor(Math.random() * 41) + 60; // 60-100
    
    const metrics: Metric[] = [
      { 
        name: "Membrane Integrity", 
        value: Math.floor(Math.random() * 31) + 70 // 70-100
      },
      { 
        name: "Insulation Performance", 
        value: Math.floor(Math.random() * 41) + 50 // 50-90
      },
      { 
        name: "Moisture Detection", 
        value: Math.floor(Math.random() * 41) + 45 // 45-85
      }
    ];
    
    const issues: Issue[] = [];
    
    // Conditionally add issues based on metrics
    if (metrics[0].value < 80) {
      issues.push({
        title: "Membrane Degradation",
        description: `Membrane showing signs of wear and degradation in multiple areas. Affected area: ${100 - metrics[0].value}%`,
        severity: metrics[0].value < 70 ? "critical" : "warning"
      });
    }
    
    if (metrics[1].value < 70) {
      issues.push({
        title: "Insulation Inefficiency",
        description: "Thermal bridging detected, indicating poor insulation performance in central section.",
        severity: metrics[1].value < 60 ? "critical" : "warning"
      });
    }
    
    if (metrics[2].value < 75) {
      issues.push({
        title: "Moisture Infiltration",
        description: `Moisture detected in ${100 - metrics[2].value}% of the roof area, primarily in the NE corner.`,
        severity: metrics[2].value < 60 ? "critical" : "warning"
      });
    }
    
    // Always add at least one neutral observation
    issues.push({
      title: "HVAC Performance",
      description: "Rooftop HVAC units showing normal thermal signatures with no unusual heat patterns.",
      severity: "info"
    });
    
    const newScan: Scan = { 
      ...scan, 
      id, 
      date: new Date(),
      healthScore,
      metrics,
      issues,
      createdAt: new Date()
    };
    
    this.scans.set(id, newScan);
    
    // Update property's health score and last scan date
    const property = this.properties.get(scan.propertyId);
    if (property) {
      property.healthScore = healthScore;
      property.lastScanDate = new Date();
      this.properties.set(property.id, property);
    }
    
    return newScan;
  }

  // Report methods
  async getReport(id: number): Promise<Report | undefined> {
    return this.reports.get(id);
  }

  async getReportsByScan(scanId: number): Promise<Report[]> {
    return Array.from(this.reports.values()).filter(
      (report) => report.scanId === scanId
    );
  }

  async createReport(report: InsertReport): Promise<Report> {
    const id = this.reportId++;
    const newReport: Report = { 
      ...report, 
      id, 
      createdAt: new Date() 
    };
    this.reports.set(id, newReport);
    return newReport;
  }

  // CRM Configuration methods
  async getCrmConfig(id: number): Promise<CrmConfig | undefined> {
    return this.crmConfigs.get(id);
  }

  async getCrmConfigsByUser(userId: number): Promise<CrmConfig[]> {
    return Array.from(this.crmConfigs.values()).filter(
      (config) => config.userId === userId
    );
  }

  async createCrmConfig(config: InsertCrmConfig & { userId: number }): Promise<CrmConfig> {
    const id = this.crmConfigId++;
    const newConfig: CrmConfig = { 
      ...config, 
      id, 
      createdAt: new Date() 
    };
    this.crmConfigs.set(id, newConfig);
    return newConfig;
  }

  async updateCrmConfig(id: number, updates: Partial<CrmConfig>): Promise<CrmConfig | undefined> {
    const config = this.crmConfigs.get(id);
    if (!config) return undefined;
    
    const updatedConfig = { ...config, ...updates };
    this.crmConfigs.set(id, updatedConfig);
    return updatedConfig;
  }

  async deleteCrmConfig(id: number): Promise<boolean> {
    return this.crmConfigs.delete(id);
  }

  // CRM Sync Log methods
  async getCrmSyncLog(id: number): Promise<CrmSyncLog | undefined> {
    return this.crmSyncLogs.get(id);
  }

  async getCrmSyncLogsByConfig(crmConfigId: number): Promise<CrmSyncLog[]> {
    return Array.from(this.crmSyncLogs.values()).filter(
      (log) => log.crmConfigId === crmConfigId
    );
  }

  async createCrmSyncLog(log: InsertCrmSyncLog): Promise<CrmSyncLog> {
    const id = this.crmSyncLogId++;
    const newLog: CrmSyncLog = { 
      ...log, 
      id, 
      syncedAt: new Date() 
    };
    this.crmSyncLogs.set(id, newLog);
    return newLog;
  }
}

export const storage = new MemStorage();
