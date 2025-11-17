import { User, InsertUser, Property, InsertProperty, Scan, InsertScan, Report, InsertReport, CrmConfig, InsertCrmConfig, CrmSyncLog, InsertCrmSyncLog, Metric, Issue } from "@shared/schema";

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
      firstName: "Demo",
      lastName: "User",
      phone: null,
      certificationLevel: "junior",
      certificationDate: null,
      certificationExpiry: null,
      inspectionHours: 0,
      approvedDARs: 0,
      trainingProgress: null,
      performanceMetrics: null,
      createdAt: new Date(),
    };
    this.users.set(demoUser.id, demoUser);
    
    // Create test user for test login functionality
    const testUser: User = {
      id: this.userId++,
      email: "test@example.com",
      password: "password",
      role: "field-rep",
      firstName: "Test",
      lastName: "User",
      phone: null,
      certificationLevel: "junior",
      certificationDate: null,
      certificationExpiry: null,
      inspectionHours: 0,
      approvedDARs: 0,
      trainingProgress: null,
      performanceMetrics: null,
      createdAt: new Date(),
    };
    this.users.set(testUser.id, testUser);

    // Create realistic properties with actual locations and damage imagery
    const property1: Property = {
      id: this.propertyId++,
      projectId: null,
      name: "Meridian Business Center",
      address: "2500 Technology Drive, Plano, TX 75074",
      buildingInfo: {
        type: "Commercial Office",
        yearBuilt: 2008,
        squareFootage: 85000,
        stories: 3,
        occupancy: "Class A Office Space"
      },
      roofSystemDetails: {
        type: "Modified Bitumen",
        age: 15,
        lastReplacement: "2009",
        manufacturer: "GAF",
        warrantyStatus: "Expired"
      },
      imageUrl: "/Hail_damaged_office_building_6d3912a4.png",
      overallCondition: "poor",
      lastInspectionDate: new Date("2025-01-15"),
      createdAt: new Date(),
      userId: demoUser.id,
    };
    
    const property2: Property = {
      id: this.propertyId++,
      projectId: null,
      name: "Legacy Village Shopping Center",
      address: "7200 Bishop Road, Plano, TX 75024",
      buildingInfo: {
        type: "Retail Complex",
        yearBuilt: 2012,
        squareFootage: 124000,
        stories: 1,
        occupancy: "Multi-Tenant Retail"
      },
      roofSystemDetails: {
        type: "TPO Single Ply",
        age: 12,
        lastReplacement: "2012",
        manufacturer: "Firestone",
        warrantyStatus: "Active"
      },
      imageUrl: "/Wind_damaged_retail_center_196a2ea4.png",
      overallCondition: "fair",
      lastInspectionDate: new Date("2025-01-08"),
      createdAt: new Date(),
      userId: demoUser.id,
    };
    
    const property3: Property = {
      id: this.propertyId++,
      projectId: null,
      name: "Industrial Distribution Facility",
      address: "1850 Central Expressway, Richardson, TX 75080",
      buildingInfo: {
        type: "Industrial Warehouse",
        yearBuilt: 2005,
        squareFootage: 245000,
        stories: 1,
        occupancy: "Distribution Center"
      },
      roofSystemDetails: {
        type: "Metal Standing Seam",
        age: 19,
        lastReplacement: "2005",
        manufacturer: "Berridge",
        warrantyStatus: "Expired"
      },
      imageUrl: "/Tornado_damaged_warehouse_1b53c65b.png",
      overallCondition: "critical",
      lastInspectionDate: new Date("2025-01-20"),
      createdAt: new Date(),
      userId: demoUser.id,
    };
    
    const property4: Property = {
      id: this.propertyId++,
      projectId: null,
      name: "Oakwood Apartments",
      address: "5420 LBJ Freeway, Dallas, TX 75240",
      buildingInfo: {
        type: "Multi-Family Residential",
        yearBuilt: 1998,
        squareFootage: 180000,
        stories: 3,
        occupancy: "Apartment Complex - 156 Units"
      },
      roofSystemDetails: {
        type: "Asphalt Shingle",
        age: 26,
        lastReplacement: "1998",
        manufacturer: "CertainTeed",
        warrantyStatus: "Expired"
      },
      imageUrl: "/Flood_damaged_apartment_complex_fc1f3c43.png",
      overallCondition: "poor",
      lastInspectionDate: new Date("2025-01-12"),
      createdAt: new Date(),
      userId: demoUser.id,
    };
    
    this.properties.set(property1.id, property1);
    this.properties.set(property2.id, property2);
    this.properties.set(property3.id, property3);
    this.properties.set(property4.id, property4);

    // Create realistic assessment data for Meridian Business Center (hail damage)
    const scan1Metrics: Metric[] = [
      { name: "Roof Surface Integrity", value: 25 },
      { name: "Membrane Condition", value: 35 },
      { name: "Hail Impact Density", value: 85 },
      { name: "Water Infiltration Risk", value: 90 },
      { name: "Structural Integrity", value: 70 }
    ];
    
    const scan1Issues: Issue[] = [
      { 
        title: "Severe Hail Damage", 
        description: "Multiple impact points across 75% of roof surface. Granule loss and membrane punctures documented. Immediate repair required.", 
        severity: "critical" 
      },
      { 
        title: "Compromised Flashing", 
        description: "Perimeter flashing displaced at multiple penetrations. Active leaks detected in building interior.", 
        severity: "critical" 
      },
      { 
        title: "HVAC Unit Damage", 
        description: "All 4 rooftop units show impact damage to housings and ductwork connections.", 
        severity: "warning" 
      },
      {
        title: "Gutter System Failure",
        description: "Gutters and downspouts severely damaged. Improper drainage causing ponding water.",
        severity: "warning"
      }
    ];
    
    const scan1: Scan = {
      id: this.scanId++,
      propertyId: property1.id,
      date: new Date("2025-01-15"),
      scanType: "terrestrial",
      deviceType: "FLIR T1020 Thermal Camera",
      standardImageUrl: "attached_assets/generated_images/Hail_damaged_office_building_6d3912a4.png",
      thermalImageUrl: "https://cdn.pixabay.com/photo/2019/09/14/09/48/thermal-imaging-4475776_1280.jpg",
      healthScore: 25,
      metrics: scan1Metrics,
      issues: scan1Issues,
      notes: "Post-storm damage assessment following January 12, 2025 severe hailstorm. Hail stones measured up to 2.5 inches diameter. Property requires immediate emergency repairs. Insurance claim #HC-2025-0115-TX pending.",
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
    
    // Legacy Village Shopping Center - Wind damage assessment
    const scan3: Scan = {
      id: this.scanId++,
      propertyId: property2.id,
      date: new Date("2025-01-08"),
      scanType: "drone",
      deviceType: "DJI Mavic 3 Enterprise Thermal",
      standardImageUrl: "attached_assets/generated_images/Wind_damaged_retail_center_196a2ea4.png",
      thermalImageUrl: "https://cdn.pixabay.com/photo/2019/09/14/09/48/thermal-imaging-4475776_1280.jpg",
      healthScore: 55,
      metrics: [
        { name: "TPO Membrane Integrity", value: 60 },
        { name: "Seam Adhesion", value: 40 },
        { name: "Wind Uplift Resistance", value: 25 },
        { name: "Drainage System", value: 70 },
        { name: "Penetration Sealing", value: 65 }
      ],
      issues: [
        { 
          title: "TPO Membrane Uplift", 
          description: "Significant membrane lifting along eastern perimeter. Wind speeds reached 85 mph during January 5th storm event.", 
          severity: "critical" 
        },
        { 
          title: "Seam Separation", 
          description: "Multiple seam failures noted across approximately 2,400 sq ft of roof area.", 
          severity: "warning" 
        },
        { 
          title: "Fastener Pull-Through", 
          description: "Mechanical fasteners showing signs of pull-through at membrane attachment points.", 
          severity: "warning" 
        }
      ],
      notes: "Post-windstorm assessment following derecho event January 5-6, 2025. Sustained winds 70-85 mph with gusts to 95 mph. Insurance claim #WD-2025-0108-TX filed.",
      createdAt: new Date(),
      userId: demoUser.id,
    };

    // Industrial Distribution Facility - Tornado damage assessment  
    const scan4: Scan = {
      id: this.scanId++,
      propertyId: property3.id,
      date: new Date("2025-01-20"),
      scanType: "terrestrial",
      deviceType: "FLIR T1050sc Research Camera",
      standardImageUrl: "attached_assets/generated_images/Tornado_damaged_warehouse_1b53c65b.png",
      thermalImageUrl: "https://cdn.pixabay.com/photo/2019/09/14/09/48/thermal-imaging-4475776_1280.jpg",
      healthScore: 15,
      metrics: [
        { name: "Structural Integrity", value: 20 },
        { name: "Metal Panel Condition", value: 10 },
        { name: "Standing Seam Integrity", value: 5 },
        { name: "Insulation System", value: 15 },
        { name: "Drainage Infrastructure", value: 30 }
      ],
      issues: [
        { 
          title: "Catastrophic Roof Failure", 
          description: "EF-2 tornado caused complete roof system failure across 80% of building footprint. Metal panels twisted and torn from structural supports.", 
          severity: "critical" 
        },
        { 
          title: "Structural Beam Damage", 
          description: "Multiple steel roof beams bent and displaced. Structural engineer assessment required before occupancy.", 
          severity: "critical" 
        },
        { 
          title: "Total Insulation Loss", 
          description: "All roof insulation blown away or severely damaged. Interior equipment exposed to elements.", 
          severity: "critical" 
        },
        {
          title: "Electrical System Compromise",
          description: "Rooftop electrical systems and lighting damaged. Power shut off for safety.",
          severity: "critical"
        }
      ],
      notes: "Emergency damage assessment following EF-2 tornado touchdown January 18, 2025 at 11:47 PM. Peak winds estimated 135 mph. Property declared total constructive loss. FEMA disaster declaration requested.",
      createdAt: new Date(),
      userId: demoUser.id,
    };

    // Oakwood Apartments - Flood damage assessment
    const scan5: Scan = {
      id: this.scanId++,
      propertyId: property4.id,
      date: new Date("2025-01-12"),
      scanType: "handheld",
      deviceType: "FLIR E95 Advanced Thermal Camera",
      standardImageUrl: "attached_assets/generated_images/Flood_damaged_apartment_complex_fc1f3c43.png",
      thermalImageUrl: "https://cdn.pixabay.com/photo/2019/09/14/09/48/thermal-imaging-4475776_1280.jpg",
      healthScore: 35,
      metrics: [
        { name: "Shingle Condition", value: 45 },
        { name: "Underlayment Integrity", value: 30 },
        { name: "Moisture Infiltration", value: 80 },
        { name: "Guttering System", value: 20 },
        { name: "Ventilation Adequacy", value: 60 }
      ],
      issues: [
        { 
          title: "Widespread Water Damage", 
          description: "Heavy rainfall (8.5 inches in 4 hours) caused extensive water infiltration through aging roof system. Multiple units affected.", 
          severity: "critical" 
        },
        { 
          title: "Shingle Granule Loss", 
          description: "25-year-old asphalt shingles showing severe granule loss and curling. Multiple shingles missing or displaced.", 
          severity: "warning" 
        },
        { 
          title: "Gutter Overflow", 
          description: "Inadequate gutter capacity led to overflow and water damage to building exterior and foundation areas.", 
          severity: "warning" 
        },
        {
          title: "Interior Ceiling Damage",
          description: "Water stains and active leaks in 12 residential units. Tenant displacement required.",
          severity: "critical"
        }
      ],
      notes: "Flash flood assessment following January 10, 2025 extreme rainfall event. Property received 8.5 inches of rain in 4-hour period, exceeding 100-year flood plain projections. Emergency tarping completed.",
      createdAt: new Date(),
      userId: demoUser.id,
    };
    
    this.scans.set(scan1.id, scan1);
    this.scans.set(scan2.id, scan2);
    this.scans.set(scan3.id, scan3);
    this.scans.set(scan4.id, scan4);
    this.scans.set(scan5.id, scan5);
    
    // Store properties (extended properties will be created dynamically in getProperty)
    
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
    if (!property) return undefined;
    
    // Get scans for this property
    const propertyScans = Array.from(this.scans.values()).filter(scan => scan.propertyId === id);
    
    // Get reports for property scans
    const propertyReports = Array.from(this.reports.values()).filter(
      report => propertyScans.some(scan => scan.id === report.scanId)
    );
    
    // Return extended property object for the API
    return {
      ...property,
      scans: propertyScans,
      reports: propertyReports,
      healthScore: propertyScans.length > 0 ? propertyScans[0].healthScore || 50 : 50,
      lastScanDate: propertyScans.length > 0 ? propertyScans[0].date : null
    } as any;
  }

  async getPropertiesByUser(userId: number): Promise<Property[]> {
    const properties = Array.from(this.properties.values()).filter(
      (property) => property.userId === userId
    );
    
    // Return extended properties with scans and reports
    return properties.map(property => {
      const propertyScans = Array.from(this.scans.values()).filter(scan => scan.propertyId === property.id);
      const propertyReports = Array.from(this.reports.values()).filter(
        report => propertyScans.some(scan => scan.id === report.scanId)
      );
      
      return {
        ...property,
        scans: propertyScans,
        reports: propertyReports,
        healthScore: propertyScans.length > 0 ? propertyScans[0].healthScore || 50 : 50,
        lastScanDate: propertyScans.length > 0 ? propertyScans[0].date : null
      } as any;
    });
  }

  async createProperty(property: InsertProperty): Promise<Property> {
    const id = this.propertyId++;
    const newProperty: Property = { 
      ...property, 
      id, 
      createdAt: new Date()
    };
    this.properties.set(id, newProperty);
    return {
      ...newProperty,
      scans: [],
      reports: [],
      healthScore: 50,
      lastScanDate: null
    } as any;
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
