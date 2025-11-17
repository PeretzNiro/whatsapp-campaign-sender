import { db } from './index.js';
import { templates, countryLimits } from './schema.js';

// Default templates to seed
const defaultTemplates = [
  {
    name: 'hello_world',
    language: 'en_US',
    category: 'utility',
    parameters: 0,
    previewText: 'Hello! Welcome to our service.',
    status: 'approved',
  },
  {
    name: 'promo_summer',
    language: 'en_US',
    category: 'marketing',
    parameters: 1,
    previewText: 'Summer Sale! Get {{1}} off on all products!',
    status: 'approved',
  },
];

// Default country limits
const defaultCountryLimits = [
  { countryCode: '+1', countryName: 'USA/Canada', maxPerSecond: 80, maxConcurrency: 15, enabled: true },
  { countryCode: '+44', countryName: 'United Kingdom', maxPerSecond: 50, maxConcurrency: 10, enabled: true },
  { countryCode: '+91', countryName: 'India', maxPerSecond: 30, maxConcurrency: 8, enabled: true },
  { countryCode: '+972', countryName: 'Israel', maxPerSecond: 50, maxConcurrency: 10, enabled: true },
  { countryCode: '+55', countryName: 'Brazil', maxPerSecond: 40, maxConcurrency: 10, enabled: true },
  { countryCode: '+86', countryName: 'China', maxPerSecond: 30, maxConcurrency: 8, enabled: true },
  { countryCode: '+81', countryName: 'Japan', maxPerSecond: 40, maxConcurrency: 10, enabled: true },
  { countryCode: '+49', countryName: 'Germany', maxPerSecond: 50, maxConcurrency: 10, enabled: true },
  { countryCode: '+33', countryName: 'France', maxPerSecond: 50, maxConcurrency: 10, enabled: true },
  { countryCode: '+39', countryName: 'Italy', maxPerSecond: 50, maxConcurrency: 10, enabled: true },
  { countryCode: '*', countryName: 'Default (All Others)', maxPerSecond: 50, maxConcurrency: 10, enabled: true },
];

export async function seedDatabase() {
  try {
    console.log('🌱 Seeding database...');

    // Seed templates
    console.log('  → Seeding templates...');
    for (const template of defaultTemplates) {
      await db.insert(templates)
        .values(template)
        .onConflictDoNothing({ target: templates.name });
    }
    console.log(`  ✓ Seeded ${defaultTemplates.length} templates`);

    // Seed country limits
    console.log('  → Seeding country limits...');
    for (const limit of defaultCountryLimits) {
      await db.insert(countryLimits)
        .values(limit)
        .onConflictDoNothing({ target: countryLimits.countryCode });
    }
    console.log(`  ✓ Seeded ${defaultCountryLimits.length} country limits`);

    console.log('✅ Database seeded successfully!');
  } catch (error) {
    console.error('❌ Failed to seed database:', error);
    throw error;
  }
}

// Run seeding if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seedDatabase()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}
