import Database from 'better-sqlite3';
import { app } from 'electron';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

// ESM-compatible __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let db: Database.Database | null = null;

// Get the default database path (in app's userData directory)
function getDefaultDbPath(): string {
  const userDataPath = app.getPath('userData');
  return path.join(userDataPath, 'product-os.sqlite');
}

// Initialize the database
export function initializeDatabase(dbPath?: string): Database.Database {
  const targetPath = dbPath || getDefaultDbPath();

  // Ensure the directory exists
  const dbDir = path.dirname(targetPath);
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  // Create/open the database
  db = new Database(targetPath);

  // Enable foreign keys
  db.pragma('foreign_keys = ON');

  // Run schema if tables don't exist
  const tablesExist = db.prepare(
    "SELECT name FROM sqlite_master WHERE type='table' AND name='products'"
  ).get();

  if (!tablesExist) {
    runSchema(db);
  }

  return db;
}

// Run the schema SQL file
function runSchema(database: Database.Database): void {
  // Read schema.sql from the same directory
  const schemaPath = path.join(__dirname, 'schema.sql');

  if (!fs.existsSync(schemaPath)) {
    throw new Error(`Schema file not found: ${schemaPath}`);
  }

  const schema = fs.readFileSync(schemaPath, 'utf-8');

  // Execute the schema (better-sqlite3 handles multi-statement SQL)
  database.exec(schema);
}

// Get the database instance
export function getDatabase(): Database.Database {
  if (!db) {
    throw new Error('Database not initialized. Call initializeDatabase() first.');
  }
  return db;
}

// Close the database connection
export function closeDatabase(): void {
  if (db) {
    db.close();
    db = null;
  }
}

// Get list of tables (for testing)
export function getTables(): string[] {
  const database = getDatabase();
  const tables = database
    .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name")
    .all() as { name: string }[];
  return tables.map(t => t.name);
}

// Check if database is initialized
export function isDatabaseInitialized(): boolean {
  return db !== null;
}
