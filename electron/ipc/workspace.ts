import { ipcMain } from 'electron';
import {
  selectWorkspaceFolder,
  initializeWorkspace,
  getWorkspacePath,
  isWorkspaceConfigured,
  openWorkspaceFolder,
  saveWorkspacePathToFile,
} from '../workspace/manager';

export function registerWorkspaceHandlers(): void {
  // Select a workspace folder via native dialog
  ipcMain.handle('workspace:select', async () => {
    try {
      const folderPath = await selectWorkspaceFolder();
      return { success: true, path: folderPath };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  });

  // Initialize workspace at the given path
  ipcMain.handle('workspace:initialize', async (_, folderPath: string) => {
    try {
      // Save to file first (in case DB isn't ready)
      saveWorkspacePathToFile(folderPath);

      await initializeWorkspace(folderPath);
      return { success: true };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  });

  // Get the current workspace path
  ipcMain.handle('workspace:getPath', () => {
    try {
      const path = getWorkspacePath();
      return { success: true, path };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  });

  // Check if workspace is configured
  ipcMain.handle('workspace:isConfigured', () => {
    try {
      const configured = isWorkspaceConfigured();
      return { success: true, configured };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  });

  // Open workspace folder in file explorer
  ipcMain.handle('workspace:openFolder', () => {
    try {
      openWorkspaceFolder();
      return { success: true };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  });
}
