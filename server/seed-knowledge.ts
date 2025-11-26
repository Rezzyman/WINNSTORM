import { storage } from './storage';
import { db } from './db';

export async function seedKnowledgeBase() {
  console.log('🌱 Seeding Eric Winn Methodology Knowledge Base...');

  const knowledgeEntries = [
    {
      category: 'procedure',
      title: 'Weather Verification - Initial Storm Analysis',
      content: `ERIC WINN METHODOLOGY: Weather verification is the foundation of every damage assessment report.

STEP-BY-STEP PROCESS:
1. **Obtain Event Date** - Get exact date of loss from property owner
2. **Verify NOAA Records** - Cross-reference with official meteorological data
3. **Check Hail Size** - Document maximum reported hail diameter (critical for damage correlation)
4. **Wind Speed Analysis** - Record peak wind gusts and sustained winds
5. **Storm Path** - Map the storm trajectory over the property location

WHY IT MATTERS:
Without verified weather data, insurance adjusters will reject the claim. You're building an evidence-based case that shows the storm event had sufficient severity to cause the documented damage.

CRITICAL POINTS:
- Use OFFICIAL sources only (NOAA, NWS, local airports)
- Document the exact time window when damaging conditions occurred
- Save PDF copies of all meteorological reports
- If hail size < 1 inch, damage claims become difficult to substantiate

COMMON MISTAKES TO AVOID:
❌ Relying on property owner's memory alone
❌ Using unverified social media weather reports
❌ Ignoring the storm's path relative to property location
❌ Failing to document the data source and retrieval date`,
      tags: ['weather', 'verification', 'NOAA', 'storm', 'hail'],
      workflowStep: 'weather',
      difficulty: 'beginner',
    },
    {
      category: 'procedure',
      title: 'Thermal Imaging - Reading Heat Signatures',
      content: `ERIC WINN METHODOLOGY: Thermal imaging reveals what the eye cannot see - moisture intrusion and structural anomalies.

STEP-BY-STEP PROCESS:
1. **Capture Wide-Angle Shots** - Start with full roof sections for context
2. **Identify Temperature Differentials** - Look for cooler spots (potential moisture)
3. **Document Hot Spots** - Areas warmer than surroundings may indicate insulation gaps
4. **Cross-Reference with Visual** - Every thermal anomaly needs a standard photo
5. **Record Exact Temperatures** - Use your thermal camera's measurement tools

INTERPRETING THERMAL PATTERNS:
🔵 **BLUE/COOL AREAS**: Water infiltration, moisture saturation, compromised insulation
🔴 **RED/HOT AREAS**: Insulation voids, thermal bridging, structural gaps
⚪ **UNIFORM TEMPERATURE**: Healthy roof system with proper insulation

WHY IT MATTERS:
Thermal imaging provides SCIENTIFIC EVIDENCE of hidden damage. Adjusters cannot dispute temperature differentials captured on calibrated equipment.

HAIL DAMAGE THERMAL SIGNATURES:
- Fractured shingles allow water penetration → cool spots
- Compressed insulation from impact → temperature anomalies
- Multiple impact points create scattered cool patterns

BEST PRACTICES:
✅ Shoot early morning or late evening (max temperature differential)
✅ Avoid direct sunlight hours (false hot spots)
✅ Calibrate camera to local conditions
✅ Document ambient temperature and weather conditions

CRITICAL: Always explain to clients that thermal anomalies are NOT the damage itself - they're indicators guiding us to areas requiring terrestrial inspection.`,
      tags: ['thermal', 'imaging', 'moisture', 'temperature', 'infrared'],
      workflowStep: 'thermal',
      difficulty: 'intermediate',
    },
    {
      category: 'decision_tree',
      title: 'When to Take Core Samples - Decision Framework',
      content: `ERIC WINN METHODOLOGY: Core samples are DESTRUCTIVE testing - use them strategically, not routinely.

DECISION TREE:

🔍 **DO YOU SEE VISIBLE HAIL DAMAGE ON SHINGLES?**
├── YES → Proceed with test squares first
└── NO → Continue assessment

🔍 **DO THERMAL IMAGES SHOW MOISTURE INTRUSION?**
├── YES → Core sample warranted to prove extent of water damage
└── NO → Document and continue

🔍 **IS THE CLIENT DISPUTING VISIBLE DAMAGE FINDINGS?**
├── YES → Core sample provides irrefutable evidence
└── NO → Test squares may be sufficient

🔍 **DOES INSURANCE ADJUSTER DEMAND PROOF OF SUBSTRATE DAMAGE?**
├── YES → Core sample required for claims over $50K
└── NO → Proceed with standard documentation

WHEN CORE SAMPLING IS MANDATORY:
✅ Moisture readings >20% on moisture meter
✅ Suspected deck deterioration not visible from attic
✅ Large claims requiring forensic-level evidence
✅ Disputes over whether damage extends beyond shingles

WHEN TO AVOID CORE SAMPLES:
❌ First day of inspection (gather other evidence first)
❌ Without property owner's written consent
❌ When test squares already prove functional damage
❌ On brand new roofs (< 2 years old) without clear cause

PROPER CORE SAMPLING PROCEDURE:
1. Document exact location with GPS and photos
2. Use 3-4 inch hole saw for clean extraction
3. Photograph each layer: shingles → underlayment → deck
4. Bag and label sample with property ID and date
5. Immediately seal hole with professional patch

PRO TIP: Core samples are your "ace in the hole" - use them when other evidence might not be enough, not as your primary inspection tool.`,
      tags: ['core-sample', 'decision-tree', 'testing', 'evidence'],
      workflowStep: 'core-samples',
      difficulty: 'expert',
    },
    {
      category: 'terminology',
      title: 'Test Square vs. Test Strip - Key Differences',
      content: `ERIC WINN TERMINOLOGY GUIDE:

**TEST SQUARE**
Definition: A measured 10'x10' (100 sq ft) section of roof where you document every piece of damage
Purpose: Statistical sampling to extrapolate total damage across entire roof
Method: Mark with chalk or tape, count every hail hit, measure every bruise
Evidence: Photos from multiple angles, diagram showing impact locations
Insurance Standard: Most carriers require minimum 3 test squares per roof slope

**TEST STRIP** 
Definition: A 3-foot wide strip running from ridge to eave
Purpose: Verify damage consistency from top to bottom of roof plane
Method: Document damage pattern variation by elevation
Evidence: Continuous photo series showing damage gradient
When Used: Slopes with suspected differential damage

CRITICAL DIFFERENCES:
📐 Size: Square = 100 sq ft | Strip = varies by slope length
🎯 Purpose: Square = quantify density | Strip = prove consistency  
📊 Math: Squares calculate damage per 100 sq ft | Strips show distribution
🔢 Required: Squares = usually 3+ | Strips = 1-2 per assessment

WINN METHODOLOGY BEST PRACTICE:
Always start with test squares. Only add test strips if adjuster questions whether damage is consistent across the entire roof plane.

COMMON MISCONCEPTION:
"More test squares = stronger case" ❌
REALITY: Properly documented test squares in representative areas are far more convincing than sloppy coverage of the entire roof.`,
      tags: ['test-square', 'test-strip', 'terminology', 'methodology'],
      workflowStep: 'test-squares',
      difficulty: 'beginner',
    },
    {
      category: 'best_practice',
      title: 'Soft Metals Inspection - The Smoking Gun',
      content: `ERIC WINN BEST PRACTICE: Soft metals are often the EASIEST damage to prove, yet beginners frequently overlook them.

WHAT QUALIFIES AS SOFT METALS:
🔧 Roof vents (turtle vents, ridge vents, gable vents)
🔧 Plumbing stacks and boot flashings
🔧 HVAC penetrations and caps
🔧 Gutters and downspouts
🔧 Drip edge and flashing
🔧 Satellite dishes and antenna mounts
🔧 Skylights (metal frames)

WHY SOFT METALS MATTER:
1. **Irrefutable Evidence** - Dents in metal cannot be disputed as "pre-existing"
2. **Corroborates Hail Size** - Dent diameter correlates to hail stone size
3. **Proves Storm Event** - Fresh dents support recent damage claim
4. **Easy to Photograph** - Visible damage that even non-experts can see

INSPECTION TECHNIQUE:
📸 **Photograph from Multiple Angles**
- Direct overhead shot
- Raking light angle (shows dent depth)
- Measurement with quarter or scale ruler
- Wide shot showing location on roof

📏 **Measure and Document**
- Dent diameter (correlates to hail size)
- Dent depth (indicates impact force)
- Number of impacts per vent
- Pattern of damage (random = hail, linear = mechanical)

🎯 **Strategic Importance**
Soft metal damage is often the FIRST thing insurance adjusters look for. If you document 15 dents on a single roof vent, it proves:
✅ Recent weather event occurred
✅ Hail stones were large enough to dent metal
✅ Impact force was significant
✅ Multiple strikes per area (supports widespread roof damage claim)

PHOTO COMPOSITION TIP:
Place a quarter next to each dent. Insurance adjusters see hundreds of claims - make yours crystal clear. The quarter provides instant scale reference and looks professional.

CRITICAL REMINDER:
Document soft metal damage EVEN IF the shingles look perfect. Sometimes hail causes functional damage to metal components while leaving cosmetic damage less obvious on shingles. This is still a valid claim.`,
      tags: ['soft-metals', 'inspection', 'evidence', 'hail-damage'],
      workflowStep: 'soft-metals',
      difficulty: 'beginner',
    },
    {
      category: 'common_mistake',
      title: 'Rookie Error: Confusing Hail Damage with Mechanical Damage',
      content: `ERIC WINN COMMON MISTAKE GUIDE:

THE PROBLEM:
New consultants often misidentify mechanical damage (roof traffic, fallen branches, installation errors) as hail damage. This destroys your credibility with adjusters.

HAIL DAMAGE CHARACTERISTICS:
✅ Random distribution pattern (nature is chaotic)
✅ Multiple impacts across large areas
✅ Consistent with reported storm severity
✅ Fresh damage (no oxidation, clean edges)
✅ Impacts on horizontal AND vertical surfaces
✅ Similar damage density across roof planes
✅ Soft metal damage correlates with shingle damage

MECHANICAL DAMAGE TELLS:
❌ Linear patterns (foot traffic paths)
❌ Damage concentrated near roof edges or valleys
❌ Only on easily accessible areas
❌ Different age than claimed storm date
❌ Only on horizontal surfaces (no vent damage)
❌ Inconsistent with verified weather severity

REAL-WORLD EXAMPLE:
🔴 **SCENARIO**: Homeowner claims hail damage. You see dents on shingles near chimney.

WRONG APPROACH: "I see damage, must be hail!" → Insurance denies claim

RIGHT APPROACH:
1. Check soft metals - any dents? No? ⚠️ Suspicious
2. Check distribution - only near chimney? ⚠️ Red flag  
3. Check damage age - oxidized edges? ⚠️ Pre-existing
4. Check weather data - hail size matches dent size? ⚠️ Verify
5. CONCLUSION: Likely mechanical damage from roof access during chimney repair

HOW TO HANDLE:
Be honest with client: "I see damage, but the pattern suggests roof traffic rather than storm impact. Submitting this as hail damage would likely be denied and could hurt future legitimate claims."

YOUR REPUTATION IS EVERYTHING:
One fraudulent claim identification can blacklist you with insurance carriers. Ten accurate assessments build trust. Be the consultant adjusters respect for telling the truth.

ERIC'S RULE: "If you wouldn't bet your certification on it, don't put it in the report."`,
      tags: ['hail-damage', 'mechanical-damage', 'mistakes', 'identification'],
      workflowStep: 'terrestrial',
      difficulty: 'intermediate',
    },
  ];

  try {
    for (const entry of knowledgeEntries) {
      await storage.createKnowledgeEntry(entry);
      console.log(`✅ Created: ${entry.title}`);
    }
    
    console.log(`\n🎉 Successfully seeded ${knowledgeEntries.length} knowledge base entries!`);
    console.log('📚 Eric Winn Methodology is now available for Stormy AI integration.\n');
  } catch (error) {
    console.error('❌ Error seeding knowledge base:', error);
    throw error;
  }
}

// Auto-run when executed directly
seedKnowledgeBase()
  .then(() => {
    console.log('Seeding complete!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Seeding failed:', error);
    process.exit(1);
  });
