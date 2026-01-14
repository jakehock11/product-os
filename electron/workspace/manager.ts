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

  // Check if this is a proper workspace (has data/ subdirectory)
  // or if it's the default userData path (DB directly in folder)
  const workspaceDbPath = path.join(workspacePath, WORKSPACE_STRUCTURE.data, DB_FILENAME);
  const directDbPath = path.join(workspacePath, DB_FILENAME);

  if (fs.existsSync(workspaceDbPath)) {
    return workspaceDbPath;
  } else if (fs.existsSync(directDbPath)) {
    return directDbPath;
  }

  // Default to workspace structure path
  return workspaceDbPath;
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
    // Check if this is a proper workspace (has data/ subdirectory with DB)
    // or if it's the default userData path (DB directly in the folder)
    const workspaceDbPath = path.join(savedPath, WORKSPACE_STRUCTURE.data, DB_FILENAME);
    const directDbPath = path.join(savedPath, DB_FILENAME);

    let dbPath: string;
    if (fs.existsSync(workspaceDbPath)) {
      // Proper workspace with data/ subdirectory
      dbPath = workspaceDbPath;
    } else if (fs.existsSync(directDbPath)) {
      // Default userData location (DB directly in folder)
      dbPath = directDbPath;
    } else {
      // Saved path exists but no database found - use workspace structure
      dbPath = workspaceDbPath;
    }

    // Initialize database at the determined location
    initializeDatabase(dbPath);

    // Ensure workspace path is saved in DB settings too
    saveWorkspacePath(savedPath);

    return true;
  }

  // No workspace configured - initialize with default userData path
  // This allows the app to work before workspace selection
  initializeDatabase();

  // Save the default userData path so Settings page can show where data lives
  const userDataPath = app.getPath('userData');
  saveWorkspacePath(userDataPath);
  saveWorkspacePathToFile(userDataPath);

  return false;
}

// Open workspace folder in system file explorer
export function openWorkspaceFolder(): void {
  const workspacePath = getWorkspacePath();
  if (workspacePath && fs.existsSync(workspacePath)) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { shell } = require('electron');
    shell.openPath(workspacePath);
  }
}

// Recursively copy directory contents
function copyDirectorySync(src: string, dest: string): void {
  // Create destination directory
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }

  const entries = fs.readdirSync(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      copyDirectorySync(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

// Migrate workspace to a new location
// Copies all data to new location, keeps old as backup
export interface MigrationResult {
  success: boolean;
  newPath: string;
  backupPath: string;
  error?: string;
}

export async function migrateWorkspace(newFolderPath: string): Promise<MigrationResult> {
  const currentPath = getWorkspacePath();

  if (!currentPath) {
    return {
      success: false,
      newPath: newFolderPath,
      backupPath: '',
      error: 'No current workspace configured',
    };
  }

  // Don't migrate to the same location
  if (path.resolve(currentPath) === path.resolve(newFolderPath)) {
    return {
      success: false,
      newPath: newFolderPath,
      backupPath: currentPath,
      error: 'New location is the same as current location',
    };
  }

  try {
    // Close the database before copying
    if (isDatabaseInitialized()) {
      closeDatabase();
    }

    // Create the new workspace directory
    if (!fs.existsSync(newFolderPath)) {
      fs.mkdirSync(newFolderPath, { recursive: true });
    }

    // Check if current path is userData (default) vs a proper workspace
    const isUserData = currentPath === app.getPath('userData');
    const hasDataDir = fs.existsSync(path.join(currentPath, 'data'));

    if (isUserData || !hasDataDir) {
      // Migrating from userData - just copy the database and create structure
      const dbFile = path.join(currentPath, DB_FILENAME);
      if (fs.existsSync(dbFile)) {
        const newDataDir = path.join(newFolderPath, WORKSPACE_STRUCTURE.data);
        fs.mkdirSync(newDataDir, { recursive: true });
        fs.copyFileSync(dbFile, path.join(newDataDir, DB_FILENAME));
      }
    } else {
      // Migrating from a proper workspace - copy everything
      const itemsToCopy = ['data', 'products', 'exports', 'logs'];

      for (const item of itemsToCopy) {
        const srcPath = path.join(currentPath, item);
        const destPath = path.join(newFolderPath, item);

        if (fs.existsSync(srcPath)) {
          copyDirectorySync(srcPath, destPath);
        }
      }
    }

    // Create any missing subdirectories
    const productsDir = path.join(newFolderPath, WORKSPACE_STRUCTURE.products);
    const exportsDir = path.join(newFolderPath, WORKSPACE_STRUCTURE.exports);
    const runsDir = path.join(newFolderPath, WORKSPACE_STRUCTURE.exportsRuns);
    const dataDir = path.join(newFolderPath, WORKSPACE_STRUCTURE.data);

    for (const dir of [dataDir, productsDir, exportsDir, runsDir]) {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    }

    // Initialize database at new location
    const newDbPath = path.join(newFolderPath, WORKSPACE_STRUCTURE.data, DB_FILENAME);
    initializeDatabase(newDbPath);

    // Update settings
    saveWorkspacePath(newFolderPath);
    saveWorkspacePathToFile(newFolderPath);

    return {
      success: true,
      newPath: newFolderPath,
      backupPath: currentPath,
    };
  } catch (error) {
    // Try to recover by re-opening the old database
    try {
      const oldDbPath = path.join(currentPath, 'data', DB_FILENAME);
      const directDbPath = path.join(currentPath, DB_FILENAME);

      if (fs.existsSync(oldDbPath)) {
        initializeDatabase(oldDbPath);
      } else if (fs.existsSync(directDbPath)) {
        initializeDatabase(directDbPath);
      } else {
        initializeDatabase();
      }
    } catch {
      // Ignore recovery errors
    }

    return {
      success: false,
      newPath: newFolderPath,
      backupPath: currentPath,
      error: String(error),
    };
  }
}
