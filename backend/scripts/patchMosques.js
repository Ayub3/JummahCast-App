/**
 * One-time patch script: ensure all seeded admin users have mosque assignments.
 * Also updates any existing admin-001/admin-002 rows from the old in-memory seed.
 * Safe to run multiple times.
 */
import { openDb } from '../db.js';

const db = openDb();

const patches = [
  { id: 'seed-admin-1', mosque: 'green-lane-masjid' },
  { id: 'seed-admin-2', mosque: 'east-london-mosque' },
  // Legacy in-memory seeded ids (may or may not exist)
  { id: 'admin-001',    mosque: 'green-lane-masjid' },
  { id: 'admin-002',    mosque: 'east-london-mosque' },
];

for (const { id, mosque } of patches) {
  const result = db.prepare(
    'UPDATE users SET mosque = ? WHERE id = ?'
  ).run(mosque, id);
  if (result.changes > 0) {
    console.log(`✓ Patched ${id} → mosque: ${mosque}`);
  }
}

const users = db.prepare('SELECT id, email, roles, mosque FROM users ORDER BY createdAt').all();
console.log('\nCurrent users:');
users.forEach(u => {
  console.log(`  ${u.email.padEnd(35)} roles=${u.roles.padEnd(12)} mosque=${u.mosque || 'none'}`);
});
