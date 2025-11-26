import { storage } from './storage';
import { db } from './db';
import { trainingCourses, trainingQuizzes } from '@shared/schema';

export async function seedTrainingCourse() {
  console.log('📚 Creating "Hail Damage Identification 101" training course...\n');

  try {
    // Create the training course
    const [course] = await db.insert(trainingCourses).values({
      title: 'Hail Damage Identification 101',
      description: 'Master the fundamentals of identifying hail damage on roofing systems using Eric Winn\'s proven methodology. Learn to distinguish hail impacts from mechanical damage, understand thermal signatures, and document findings for insurance claims.',
      day: 'day1',
      subject: 'inspections',
      contentType: 'text',
      contentUrl: null,
      duration: 45,
      requiredForCertification: true,
      certificationLevel: 'junior',
      orderIndex: 1,
    }).returning();

    console.log(`✅ Created course: ${course.title} (ID: ${course.id})`);

    // Create the quiz for this course
    const [quiz] = await db.insert(trainingQuizzes).values({
      courseId: course.id,
      title: 'Hail Damage Identification Assessment',
      description: 'Test your knowledge of hail damage identification, thermal imaging interpretation, and Eric Winn methodology best practices.',
      passingScore: 85,
      timeLimit: 30,
      maxAttempts: 3,
      questions: [
        {
          id: 1,
          question: 'What is the MINIMUM hail size that typically causes functional damage to architectural shingles?',
          type: 'multiple_choice',
          options: [
            '0.75 inches',
            '1.0 inch',
            '1.25 inches',
            '1.5 inches'
          ],
          correctAnswer: 1,
          explanation: 'According to the Winn Methodology, hail stones of 1.0 inch diameter or larger typically cause measurable functional damage to architectural shingles. Smaller hail may cause cosmetic damage but rarely compromises the shingle\'s protective function.',
          points: 10
        },
        {
          id: 2,
          question: 'When viewing thermal imagery, what do BLUE/COOL spots typically indicate?',
          type: 'multiple_choice',
          options: [
            'Insulation gaps or thermal bridging',
            'Water infiltration and moisture saturation',
            'Recent hail impact locations',
            'Normal roof surface temperature'
          ],
          correctAnswer: 1,
          explanation: 'Blue or cool areas in thermal imaging indicate water infiltration, moisture saturation, or compromised insulation. Water has a higher thermal mass than dry materials and appears cooler in thermal scans.',
          points: 10
        },
        {
          id: 3,
          question: 'What is the primary purpose of documenting soft metal damage during an inspection?',
          type: 'multiple_choice',
          options: [
            'To estimate repair costs for metal components',
            'To provide irrefutable evidence of recent storm impact',
            'To identify areas requiring immediate repair',
            'To demonstrate the age of the roof system'
          ],
          correctAnswer: 1,
          explanation: 'Soft metal damage is critical because dents in metal vents, flashings, and gutters cannot be disputed as "pre-existing." Fresh dents provide irrefutable evidence that a recent storm event occurred with sufficient force to damage the roof system.',
          points: 10
        },
        {
          id: 4,
          question: 'According to Eric Winn, what distinguishes hail damage from mechanical damage?',
          type: 'multiple_choice',
          options: [
            'Hail damage shows linear patterns while mechanical damage is random',
            'Hail damage is random while mechanical damage shows concentrated patterns',
            'Hail damage only occurs on horizontal surfaces',
            'Mechanical damage always shows oxidation'
          ],
          correctAnswer: 1,
          explanation: 'Hail damage exhibits random distribution patterns (nature is chaotic) while mechanical damage typically shows linear patterns from foot traffic, concentrated damage near accessible areas, or damage only on horizontal surfaces.',
          points: 15
        },
        {
          id: 5,
          question: 'What is a "test square" in the Winn Methodology?',
          type: 'multiple_choice',
          options: [
            'A 5\'x5\' section used to estimate total roof area',
            'A 10\'x10\' (100 sq ft) section where every damage point is documented',
            'A sample removed from the roof for laboratory testing',
            'A measurement tool for calculating roof slope'
          ],
          correctAnswer: 1,
          explanation: 'A test square is a measured 10\'x10\' (100 square foot) section of roof where you document every piece of damage. This statistical sampling allows you to extrapolate total damage across the entire roof system.',
          points: 10
        },
        {
          id: 6,
          question: 'When should you take core samples during an inspection?',
          type: 'multiple_choice',
          options: [
            'On every inspection as standard practice',
            'Only when other evidence is insufficient or substrate damage is suspected',
            'Only on roofs newer than 5 years old',
            'Whenever thermal imaging shows any temperature anomalies'
          ],
          correctAnswer: 1,
          explanation: 'Core samples are DESTRUCTIVE testing and should be used strategically, not routinely. They are warranted when moisture readings exceed 20%, substrate damage is suspected, large claims require forensic evidence, or when other evidence is insufficient.',
          points: 15
        },
        {
          id: 7,
          question: 'What best describes the relationship between thermal imaging and damage assessment?',
          type: 'multiple_choice',
          options: [
            'Thermal anomalies ARE the damage and prove the claim',
            'Thermal anomalies indicate areas requiring terrestrial inspection',
            'Thermal imaging replaces the need for physical roof inspection',
            'Thermal imaging is only useful for energy audits'
          ],
          correctAnswer: 1,
          explanation: 'Thermal anomalies are NOT the damage itself - they are INDICATORS guiding you to areas requiring terrestrial inspection. Always explain to clients that thermal imaging reveals where to look, but physical inspection confirms the actual damage.',
          points: 15
        },
        {
          id: 8,
          question: 'Why is weather verification the "foundation" of every damage assessment report?',
          type: 'multiple_choice',
          options: [
            'It\'s required by all insurance companies',
            'It provides scientific proof that damaging conditions occurred',
            'It helps estimate repair costs',
            'It determines the property owner\'s deductible'
          ],
          correctAnswer: 1,
          explanation: 'Weather verification using OFFICIAL sources (NOAA, NWS) provides scientific proof that a storm event with sufficient severity occurred at the property location. Without verified weather data, insurance adjusters will reject the claim regardless of visible damage.',
          points: 15
        }
      ]
    }).returning();

    console.log(`✅ Created quiz: ${quiz.title} (ID: ${quiz.id})`);
    console.log(`   - ${quiz.questions.length} questions`);
    console.log(`   - ${quiz.timeLimit} minute time limit`);
    console.log(`   - ${quiz.passingScore}% passing score\n`);

    console.log('🎉 Training course successfully created!');
    console.log('📖 Available in WinnStorm Training Portal for junior consultant certification\n');

  } catch (error) {
    console.error('❌ Error creating training course:', error);
    throw error;
  }
}

// Auto-run when executed directly
seedTrainingCourse()
  .then(() => {
    console.log('✅ Training seeding complete!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Training seeding failed:', error);
    process.exit(1);
  });
