import { ipcMain, shell } from 'electron';
import {
  getSettings,
  updateSettings,
  clearAllData,
  UpdateSettingsData,
} from '../database/queries/settings';
import { getWorkspacePath, selectWorkspaceFolder, initializeWorkspace } from '../workspace/manager';
import { clearExportHistory } from '../database/queries/exports';

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
}
