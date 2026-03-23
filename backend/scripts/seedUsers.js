/**
 * Seed Users Script
 * Creates test users for local development
 * 
 * Usage:
 *   node scripts/seedUsers.js
 */

import bcrypt from 'bcrypt';
import { nanoid } from 'nanoid';
import { openDb } from '../db.js';

const SALT_ROUNDS = 10;

const testUsers = [
  {
    email: 'admin1@jummahcast.local',
    password: 'Admin123!',
    name: 'Imam Ahmed',
    roles: ['admin'],
    mosque: 'Green Dome Masjid',
  },
  {
    email: 'admin2@jummahcast.local',
    password: 'Admin123!',
    name: 'Sheikh Abdullah',
    roles: ['admin'],
    mosque: 'Central Islamic Center',
  },
  {
    email: 'user1@jummahcast.local',
    password: 'User123!',
    name: 'Omar Hassan',
    roles: ['user'],
    mosque: null,
  },
  {
    email: 'user2@jummahcast.local',
    password: 'User123!',
    name: 'Fatima Ali',
    roles: ['user'],
    mosque: null,
  },
  {
    email: 'user3@jummahcast.local',
    password: 'User123!',
    name: 'Ibrahim Khan',
    roles: ['user'],
    mosque: null,
  },
];

async function seedUsers() {
  console.log('🌱 Seeding users...\n');

  const db = openDb();

  // Check if users table exists
  const tableExists = db
    .prepare(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='users'"
    )
    .get();

  if (!tableExists) {
    console.error('❌ Users table does not exist. Please run the server first to create tables.');
    process.exit(1);
  }

  // Check if any users already exist
  const existingUsersCount = db.prepare('SELECT COUNT(*) as count FROM users').get();
  
  if (existingUsersCount.count > 0) {
    console.log(`⚠️  Found ${existingUsersCount.count} existing users.`);
    console.log('Do you want to clear existing users and reseed? This action cannot be undone.');
    console.log('To proceed, delete users manually or uncomment the DELETE line in this script.\n');
    
    // Uncomment the line below to clear existing users
    // db.prepare('DELETE FROM users').run();
    // console.log('✅ Cleared existing users.\n');
  }

  const insertStmt = db.prepare(`
    INSERT INTO users (id, email, password, name, roles, mosque, createdAt, updatedAt)
    VALUES (@id, @email, @password, @name, @roles, @mosque, @createdAt, @updatedAt)
  `);

  let successCount = 0;
  let skipCount = 0;

  for (const user of testUsers) {
    try {
      // Check if user already exists
      const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(user.email);
      
      if (existing) {
        console.log(`⏭️  Skipping ${user.email} (already exists)`);
        skipCount++;
        continue;
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(user.password, SALT_ROUNDS);

      // Insert user
      insertStmt.run({
        id: nanoid(),
        email: user.email,
        password: hashedPassword,
        name: user.name,
        roles: JSON.stringify(user.roles),
        mosque: user.mosque,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      console.log(`✅ Created user: ${user.name} (${user.email})`);
      console.log(`   Role: ${user.roles.join(', ')}`);
      if (user.mosque) {
        console.log(`   Mosque: ${user.mosque}`);
      }
      console.log('');

      successCount++;
    } catch (error) {
      console.error(`❌ Failed to create ${user.email}:`, error.message);
    }
  }

  console.log('\n═══════════════════════════════════════');
  console.log('🎉 Seeding complete!');
  console.log(`✅ Created: ${successCount} users`);
  console.log(`⏭️  Skipped: ${skipCount} users`);
  console.log('═══════════════════════════════════════\n');

  console.log('📝 Test Credentials:\n');
  console.log('Admins:');
  console.log('  admin1@jummahcast.local / Admin123!');
  console.log('  admin2@jummahcast.local / Admin123!\n');
  console.log('Users:');
  console.log('  user1@jummahcast.local / User123!');
  console.log('  user2@jummahcast.local / User123!');
  console.log('  user3@jummahcast.local / User123!\n');

  db.close();
}

// Run the seed function
seedUsers().catch((error) => {
  console.error('❌ Seed failed:', error);
  process.exit(1);
});
