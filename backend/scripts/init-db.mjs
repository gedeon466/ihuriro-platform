import 'dotenv/config';
import { applySchema, findMissingTables } from '../src/schema.js';
import { pool } from '../src/db.js';

try {
  await applySchema();
  console.log('MySQL schema applied.');
  const missing = await findMissingTables();
  if (missing.length > 0) {
    console.warn(`Still missing after migration: ${missing.join(', ')}`);
    process.exitCode = 1;
  } else {
    console.log('Every required table is present.');
  }
} catch (error) {
  console.error(`[db:init] ${error.message}`);
  process.exitCode = 1;
} finally {
  await pool.end();
}
