// Demo data for mobile app showcase

export interface DemoInspection {
  id: number;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  status: 'pending' | 'in_progress' | 'completed';
  damageType: string;
  createdAt: string;
  updatedAt: string;
  photoCount: number;
  clientName: string;
  propertyType: 'commercial' | 'residential';
  notes?: string;
}

export interface DemoPhoto {
  id: number;
  inspectionId: number;
  url: string;
  type: 'overview' | 'damage' | 'thermal' | 'detail';
  caption: string;
  createdAt: string;
  analysis?: string;
}

// Generate placeholder image SVGs (work offline)
const createPlaceholder = (text: string, bgColor: string, textColor: string = '#fff') => {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600">
    <rect fill="${bgColor}" width="800" height="600"/>
    <rect fill="${bgColor}" opacity="0.3" x="50" y="50" width="700" height="500" rx="20"/>
    <text x="400" y="280" font-family="system-ui, sans-serif" font-size="32" font-weight="600" fill="${textColor}" text-anchor="middle">${text}</text>
    <text x="400" y="330" font-family="system-ui, sans-serif" font-size="18" fill="${textColor}" opacity="0.7" text-anchor="middle">WinnStorm Demo Image</text>
  </svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
};

// Stock commercial roof images (embedded SVG placeholders)
export const stockImages = {
  commercialRoofs: [
    createPlaceholder('Commercial Roof - Overview', '#1e3a5f'),
    createPlaceholder('Flat Roof Section', '#2d4a6f'),
    createPlaceholder('HVAC Unit Area', '#1e4a5f'),
    createPlaceholder('Parapet Wall', '#2d3a6f'),
    createPlaceholder('Drainage System', '#1e3a6f'),
    createPlaceholder('Roof Access Point', '#2d4a5f'),
  ],
  damagedRoofs: [
    createPlaceholder('Hail Impact Damage', '#8b2500'),
    createPlaceholder('Wind Uplift Damage', '#6b3500'),
    createPlaceholder('Membrane Tear', '#8b3500'),
    createPlaceholder('Ponding Water Area', '#5b4500'),
  ],
  thermalImages: [
    createPlaceholder('Thermal Scan - Hot Spot', '#ff6b00'),
    createPlaceholder('Thermal Scan - Moisture', '#ff4500'),
  ],
};

// Demo inspections for showcase
export const demoInspections: DemoInspection[] = [
  {
    id: 1001,
    address: '1250 Commerce Center Dr',
    city: 'Dallas',
    state: 'TX',
    zipCode: '75201',
    status: 'in_progress',
    damageType: 'Hail Damage',
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
    updatedAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    photoCount: 12,
    clientName: 'Metro Commercial Properties',
    propertyType: 'commercial',
    notes: 'Large flat roof with multiple HVAC units. Client reports hail event on Jan 12.',
  },
  {
    id: 1002,
    address: '8700 Industrial Blvd',
    city: 'Fort Worth',
    state: 'TX',
    zipCode: '76102',
    status: 'pending',
    damageType: 'Wind Damage',
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // Yesterday
    updatedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    photoCount: 0,
    clientName: 'Southwest Distribution LLC',
    propertyType: 'commercial',
    notes: 'Warehouse facility - 45,000 sq ft TPO membrane roof.',
  },
  {
    id: 1003,
    address: '2200 Oak Lawn Ave',
    city: 'Dallas',
    state: 'TX',
    zipCode: '75219',
    status: 'completed',
    damageType: 'Storm Damage',
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
    updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    photoCount: 28,
    clientName: 'Uptown Office Partners',
    propertyType: 'commercial',
    notes: 'Multi-story office complex. Comprehensive assessment completed.',
  },
  {
    id: 1004,
    address: '5500 Belt Line Rd',
    city: 'Irving',
    state: 'TX',
    zipCode: '75038',
    status: 'in_progress',
    damageType: 'Hail & Wind',
    createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(), // 5 hours ago
    updatedAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
    photoCount: 8,
    clientName: 'Texas Retail Centers',
    propertyType: 'commercial',
    notes: 'Strip mall with multiple tenants. Focus on common areas.',
  },
  {
    id: 1005,
    address: '9800 Hillcrest Rd',
    city: 'Dallas',
    state: 'TX',
    zipCode: '75230',
    status: 'pending',
    damageType: 'Assessment Needed',
    createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
    photoCount: 0,
    clientName: 'Preston Medical Plaza',
    propertyType: 'commercial',
    notes: 'Medical office building - schedule inspection with building management.',
  },
];

// Demo photos for each inspection
export const demoPhotos: DemoPhoto[] = [
  // Inspection 1001 photos
  {
    id: 2001,
    inspectionId: 1001,
    url: stockImages.commercialRoofs[0],
    type: 'overview',
    caption: 'North section overview - flat roof membrane',
    createdAt: new Date(Date.now() - 90 * 60 * 1000).toISOString(),
    analysis: 'Visible granule loss and surface degradation consistent with hail impact.',
  },
  {
    id: 2002,
    inspectionId: 1001,
    url: stockImages.damagedRoofs[0],
    type: 'damage',
    caption: 'Hail impact damage - multiple soft metal dents',
    createdAt: new Date(Date.now() - 85 * 60 * 1000).toISOString(),
    analysis: 'Pattern consistent with 1.5" hail. Recommend full membrane replacement.',
  },
  {
    id: 2003,
    inspectionId: 1001,
    url: stockImages.commercialRoofs[1],
    type: 'overview',
    caption: 'East elevation - parapet wall and flashing',
    createdAt: new Date(Date.now() - 80 * 60 * 1000).toISOString(),
  },
  {
    id: 2004,
    inspectionId: 1001,
    url: stockImages.damagedRoofs[1],
    type: 'damage',
    caption: 'HVAC unit surround - ponding water observed',
    createdAt: new Date(Date.now() - 75 * 60 * 1000).toISOString(),
    analysis: 'Drainage issue identified. Standing water may accelerate membrane deterioration.',
  },
  // Inspection 1003 photos (completed job)
  {
    id: 2010,
    inspectionId: 1003,
    url: stockImages.commercialRoofs[2],
    type: 'overview',
    caption: 'Building overview from adjacent structure',
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 2011,
    inspectionId: 1003,
    url: stockImages.commercialRoofs[3],
    type: 'overview',
    caption: 'Rooftop mechanical equipment area',
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 2012,
    inspectionId: 1003,
    url: stockImages.damagedRoofs[2],
    type: 'damage',
    caption: 'Storm damage to edge flashing',
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    analysis: 'Wind uplift damage to metal edge. Full perimeter inspection recommended.',
  },
  // Inspection 1004 photos
  {
    id: 2020,
    inspectionId: 1004,
    url: stockImages.commercialRoofs[4],
    type: 'overview',
    caption: 'Strip mall main roof section',
    createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 2021,
    inspectionId: 1004,
    url: stockImages.damagedRoofs[3],
    type: 'damage',
    caption: 'Tenant C storefront - visible impact marks',
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    analysis: 'Hail damage confirmed. Document for insurance claim.',
  },
];

// Quick stats for demo
export const demoStats = {
  today: 2,
  pending: 3,
  inProgress: 2,
  completed: 1,
  totalPhotos: 48,
  nearbyJobs: 2,
};

// Get photos for a specific inspection
export function getPhotosForInspection(inspectionId: number): DemoPhoto[] {
  return demoPhotos.filter(p => p.inspectionId === inspectionId);
}

// Get inspection by ID
export function getInspectionById(id: number): DemoInspection | undefined {
  return demoInspections.find(i => i.id === id);
}
