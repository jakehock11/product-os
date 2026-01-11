import { app, dialog } from 'electron';
import path from 'path';
import fs from 'fs';
import { getDatabase, initializeDatabase, closeDatabase, isDatabaseInitialized } from '../database/db';

// Workspace folder structure
const WORKSPACE_STRUCTURE = {
  data: 'data',
  products: 'products',
  exports: 'exports',
  exportsHistory: 'exports/history.json',
  exportsRuns: 'exports/runs',
};

const DB_FILENAME = 'product-os.sqlite';
const SETTINGS_KEY = 'workspace_path';

// Open a native folder picker dialog
export async function selectWorkspaceFolder(): Promise<string | null> {
  const result = await dialog.showOpenDialog({
    title: 'Select Workspace Folder',
    properties: ['openDirectory', 'createDirectory'],
    buttonLabel: 'Select Workspace',
  });

  if (result.canceled || result.filePaths.length === 0) {
    return null;
  }

  return result.filePaths[0];
}

// Initialize workspace folder structure
export async function initializeWorkspace(folderPath: string): Promise<void> {
  // Create main workspace directory if it doesn't exist
  if (!fs.existsSync(folderPath)) {
    fs.mkdirSync(folderPath, { recursive: true });
  }

  // Create subdirectories
  const dataDir = path.join(folderPath, WORKSPACE_STRUCTURE.data);
  const productsDir = path.join(folderPath, WORKSPACE_STRUCTURE.products);
  const exportsDir = path.join(folderPath, WORKSPACE_STRUCTURE.exports);
  const runsDir = path.join(folderPath, WORKSPACE_STRUCTURE.exportsRuns);

  for (const dir of [dataDir, productsDir, exportsDir, runsDir]) {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  // Create empty exports history file if it doesn't exist
  const historyPath = path.join(folderPath, WORKSPACE_STRUCTURE.exportsHistory);
  if (!fs.existsSync(historyPath)) {
    fs.writeFileSync(historyPath, JSON.stringify([], null, 2));
  }

  // Get the new database path
  const newDbPath = path.join(dataDir, DB_FILENAME);

  // If there's an existing database in userData, migrate it
  const userDataDbPath = path.join(app.getPath('userData'), DB_FILENAME);

  if (fs.existsSync(userDataDbPath) && !fs.existsSync(newDbPath)) {
    // Close existing database connection if open
    if (isDatabaseInitialized()) {
      closeDatabase();
    }

    // Copy the database file to the new location
    fs.copyFileSync(userDataDbPath, newDbPath);

    // Optionally remove the old database (commented out for safety)
    // fs.unlinkSync(userDataDbPath);
  }

  // Initialize/open database at the workspace path
  if (isDatabaseInitialized()) {
    closeDatabase();
  }
  initializeDatabase(newDbPath);

  // Save workspace path to settings
  saveWorkspacePath(folderPath);
}

// Get the currently configured workspace path from settings
export function getWorkspacePath(): string | null {
  try {
    if (!isDatabaseInitialized()) {
      // Try to load from a simple file fallback if DB not ready
      return loadWorkspacePathFromFile();
    }

    const db = getDatabase();
    const result = db.prepare('SELECT workspace_path FROM settings WHERE id = 1').get() as { workspace_path: string | null } | undefined;
    return result?.workspace_path || null;
  } catch {
    return loadWorkspacePathFromFile();
  }
}

// Check if workspace is configured
export function isWorkspaceConfigured(): boolean {
  const workspacePath = getWorkspacePath();
  if (!workspacePath) return false;

  // Verify the workspace folder still exists
  return fs.existsSync(workspacePath);
}

// Get the database path for the current workspace
export function getWorkspaceDbPath(): string | null {
  const workspacePath = getWorkspacePath();
  if (!workspacePath) return null;
  return path.join(workspacePath, WORKSPACE_STRUCTURE.data, DB_FILENAME);
}

// Save workspace path to settings table
function saveWorkspacePath(folderPath: string): void {
  const db = getDatabase();
  const now = new Date().toISOString();

  // Check if settings row exists
  const existing = db.prepare('SELECT id FROM settings WHERE id = 1').get();

  if (existing) {
    db.prepare('UPDATE settings SET workspace_path = ?, updated_at = ? WHERE id = 1')
      .run(folderPath, now);
  } else {
    db.prepare(`
      INSERT INTO settings (id, workspace_path, created_at, updated_at)
      VALUES (1, ?, ?, ?)
    `).run(folderPath, now, now);
  }
}

// Fallback: store workspace path in a simple file in userData
// This is used when the database isn't ready yet
const WORKSPACE_CONFIG_FILE = 'workspace-config.json';

function getConfigFilePath(): string {
  return path.join(app.getPath('userData'), WORKSPACE_CONFIG_FILE);
}

function loadWorkspacePathFromFile(): string | null {
  try {
    const configPath = getConfigFilePath();
    if (fs.existsSync(configPath)) {
      const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
      return config.workspacePath || null;
    }
  } catch {
    // Ignore errors
  }
  return null;
}

export function saveWorkspacePathToFile(folderPath: string): void {
  try {
    const configPath = getConfigFilePath();
    fs.writeFileSync(configPath, JSON.stringify({ workspacePath: folderPath }, null, 2));
  } catch {
    // Ignore errors
  }
}

// Initialize the app with workspace awareness
// Returns true if workspace is ready, false if setup is needed
export function initializeWithWorkspace(): boolean {
  // First check if we have a saved workspace path
  const savedPath = loadWorkspacePathFromFile();

  if (savedPath && fs.existsSync(savedPath)) {
    const dbPath = path.join(savedPath, WORKSPACE_STRUCTURE.data, DB_FILENAME);

    // Initialize database at workspace location
    initializeDatabase(dbPath);

    // Ensure workspace path is saved in DB settings too
    saveWorkspacePath(savedPath);

    return true;
  }

  // No workspace configured - initialize with default userData path
  // This allows the app to work before workspace selection
  initializeDatabase();
  return false;
}

// Open workspace folder in system file explorer
export function openWorkspaceFolder(): void {
  const workspacePath = getWorkspacePath();
  if (workspacePath && fs.existsSync(workspacePath)) {
    const { shell } = require('electron');
    shell.openPath(workspacePath);
  }
}
