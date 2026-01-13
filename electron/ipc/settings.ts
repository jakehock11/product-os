import { ipcMain, shell } from 'electron';
import {
  getSettings,
  updateSettings,
  clearAllData,
  UpdateSettingsData,
} from '../database/queries/settings';
import { getWorkspacePath, selectWorkspaceFolder, initializeWorkspace, migrateWorkspace } from '../workspace/manager';
import { clearExportHistory } from '../database/queries/exports';
import { syncWorkspaceFiles } from '../workspace/sync';

export function registerSettingsHandlers(): void {
  // Get current settings
  ipcMain.handle('settings:get', () => {
    try {
      const settings = getSettings();
      return { success: true, data: settings };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  });

  // Update settings
  ipcMain.handle('settings:update', (_, data: UpdateSettingsData) => {
    try {
      const settings = updateSettings(data);
      return { success: true, data: settings };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  });

  // Change workspace folder
  ipcMain.handle('settings:changeWorkspace', async () => {
    try {
      const folderPath = await selectWorkspaceFolder();
      if (!folderPath) {
        return { success: true, data: null }; // User cancelled
      }

      await initializeWorkspace(folderPath);
      const settings = updateSettings({ workspacePath: folderPath });
      return { success: true, data: settings };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  });

  // Open workspace folder in file explorer
  ipcMain.handle('settings:openWorkspaceFolder', () => {
    try {
      const workspacePath = getWorkspacePath();
      if (!workspacePath) {
        return { success: false, error: 'No workspace configured' };
      }
      shell.openPath(workspacePath);
      return { success: true };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  });

  // Clear export history
  ipcMain.handle('settings:clearExportHistory', () => {
    try {
      clearExportHistory();
      return { success: true };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  });

  // Clear all data (DANGER ZONE)
  ipcMain.handle('settings:clearAllData', () => {
    try {
      clearAllData();
      return { success: true };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  });

  // Migrate workspace to a new location (copies data, keeps old as backup)
  ipcMain.handle('settings:migrateWorkspace', async () => {
    try {
      // Open folder picker
      const folderPath = await selectWorkspaceFolder();
      if (!folderPath) {
        return { success: true, data: null }; // User cancelled
      }

      // Perform migration
      const result = await migrateWorkspace(folderPath);

      if (!result.success) {
        return { success: false, error: result.error };
      }

      // Sync workspace files to regenerate any missing markdown
      syncWorkspaceFiles();

      // Get updated settings
      const settings = getSettings();

      return {
        success: true,
        data: {
          settings,
          backupPath: result.backupPath,
          newPath: result.newPath,
        },
      };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  });
}
