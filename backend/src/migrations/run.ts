import 'dotenv/config';
import { testConnection } from '../config/database';
import { up as up001, down as down001 } from './001_create_initial_schema';
import { up as up002, down as down002 } from './002_create_seed_data';

const migrations = [
  { name: '001_create_initial_schema', up: up001, down: down001 },
  { name: '002_create_seed_data', up: up002, down: down002 },
];

async function runMigrations(direction: 'up' | 'down') {
  console.log(`🔄 Running migrations ${direction}...`);
  
  const connected = await testConnection();
  if (!connected) {
    console.error('❌ Failed to connect to database');
    process.exit(1);
  }

  if (direction === 'up') {
    for (const migration of migrations) {
      console.log(`📌 Running migration: ${migration.name}`);
      await migration.up();
    }
  } else {
    for (const migration of [...migrations].reverse()) {
      console.log(`📌 Rolling back migration: ${migration.name}`);
      await migration.down();
    }
  }

  console.log(`✅ All migrations ${direction} completed`);
  process.exit(0);
}

const direction = process.argv[2] as 'up' | 'down';
if (!['up', 'down'].includes(direction)) {
  console.error('Usage: ts-node src/migrations/run.ts [up|down]');
  process.exit(1);
}

runMigrations(direction);
