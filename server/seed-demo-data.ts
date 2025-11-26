import { storage } from './storage';
import { db } from './db';
import { users } from '@shared/schema';

export async function seedDemoData() {
  console.log('🎯 Creating realistic Kansas City inspection demo data...\n');

  try {
    // 1. Create demo user (consultant)
    console.log('👤 Creating demo user...');
    const demoUser = await storage.createUser({
      email: 'demo@winnstorm.com',
      password: 'demo',
      firstName: 'Sarah',
      lastName: 'Martinez',
      role: 'junior_consultant',
      certificationLevel: 'junior',
      phone: '816-555-0199',
      inspectionHours: 42,
      approvedDARs: 3,
    });
    console.log(`✅ Created user: ${demoUser.firstName} ${demoUser.lastName} (ID: ${demoUser.id})\n`);

    // 2. Create Kansas City property
    console.log('🏠 Creating Kansas City property...');
    const property = await storage.createProperty({
      name: 'Johnson Residence - 4726 Main Street',
      address: '4726 Main Street, Kansas City, MO 64112',
      userId: demoUser.id,
      imageUrl: '',
      overallCondition: 'fair',
      buildingInfo: {
        address: '4726 Main Street, Kansas City, MO 64112',
        propertyType: 'residential' as const,
        yearBuilt: 1998,
        squareFootage: 2850,
        stories: 2,
        occupancy: 'Single Family',
        ownerName: 'Michael & Jennifer Johnson',
        ownerContact: '816-555-0142',
        roofSections: [{
          number: 1,
          area: 1650,
          slope: '6/12',
          material: 'Architectural Shingles - GAF Timberline HDZ',
          color: 'Charcoal',
          ageYears: 9,
          orientation: 'South-facing',
          notes: 'Primary roof section - showed significant hail impact damage'
        }]
      },
      roofSystemDetails: {
        material: 'Architectural Shingles',
        manufacturer: 'GAF',
        model: 'Timberline HDZ',
        color: 'Charcoal',
        installDate: '2016-08-15',
        warranty: '25-year limited manufacturer warranty',
        underlayment: 'Synthetic - DeckArmor',
        ventilation: 'Ridge vent + soffit vents',
        drainage: 'Standard 5" K-style gutters',
        flashings: 'Step flashing at chimney, valley flashing at dormers',
        estimatedLifespan: 30,
        condition: 'Functional damage from hail impact - widespread impact marks documented'
      }
    });
    console.log(`✅ Created property: ${property.name} (ID: ${property.id})\n`);

    // 3. Create thermal scan with realistic damage data
    console.log('🌡️ Creating thermal scan with damage findings...');
    const scan = await storage.createScan({
      propertyId: property.id,
      userId: demoUser.id,
      date: new Date('2025-11-10T14:30:00'),
      scanType: 'drone',
      deviceType: 'DJI Mavic 3T Thermal',
      standardImageUrl: '/demo/kc-standard-roof.jpg',
      thermalImageUrl: '/demo/kc-thermal-roof.jpg',
      healthScore: 52,
      notes: 'Thermal scan conducted 14 days post-storm. Multiple temperature anomalies detected indicating moisture intrusion at hail impact points. Cool spots correlate with visible shingle damage observed during terrestrial walk.',
      metrics: [
        {
          label: 'Surface Temperature Range',
          value: '68°F - 94°F',
          unit: '',
          severity: 'info',
          description: 'Temperature differential indicates potential moisture infiltration'
        },
        {
          label: 'Moisture Anomalies Detected',
          value: '23',
          unit: 'locations',
          severity: 'warning',
          description: 'Cool spots indicating water penetration through damaged shingles'
        },
        {
          label: 'Thermal Coverage',
          value: '98',
          unit: '%',
          severity: 'info',
          description: 'Comprehensive thermal imaging of all roof planes completed'
        }
      ],
      issues: [
        {
          title: 'Northwest Quadrant Moisture Pattern',
          description: 'Cluster of 8 cool spots (65-72°F) in northwest roof section indicates water penetration through hail-damaged shingles. Pattern consistent with impact damage allowing moisture intrusion.',
          severity: 'high',
          location: 'Northwest roof section, approximately 15ft from ridge',
          recommendation: 'Correlate with terrestrial walk findings. Document test square in this area to quantify impact density.'
        },
        {
          title: 'South-facing Slope Temperature Differential',
          description: 'Scattered cool anomalies across south slope correlate with visible hail impact locations. Temperature differential of 15-22°F compared to adjacent undamaged areas.',
          severity: 'medium',
          location: 'South-facing primary roof slope',
          recommendation: 'Multiple test squares recommended to establish damage density for insurance claim'
        }
      ]
    });
    console.log(`✅ Created thermal scan (ID: ${scan.id})\n`);

    console.log('📊 Demo data summary:');
    console.log('  Property: 4726 Main Street, Kansas City, MO');
    console.log('  Storm Date: October 27, 2025');
    console.log('  Hail Size: 1.75" - 2.0" reported by NWS');
    console.log('  Consultant: Sarah Martinez (Junior)');
    console.log('  Thermal Scan: 23 moisture anomalies detected');
    console.log('  Status: Ready for terrestrial walk and test squares\n');

    console.log('🎉 Demo data seeding complete!');
    console.log('💡 Login with demo@winnstorm.com to see the Kansas City inspection\n');

  } catch (error) {
    console.error('❌ Error seeding demo data:', error);
    throw error;
  }
}

// Auto-run when executed directly
seedDemoData()
  .then(() => {
    console.log('✅ All demo data created successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Demo seeding failed:', error);
    process.exit(1);
  });
