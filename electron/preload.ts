import { contextBridge, ipcRenderer } from 'electron';

// Type definitions for IPC responses
interface IPCResult<T = unknown> {
  success: boolean;
  error?: string;
  data?: T;
}

interface SelectResult {
  success: boolean;
  path: string | null;
  error?: string;
}

interface PathResult {
  success: boolean;
  path: string | null;
  error?: string;
}

interface ConfiguredResult {
  success: boolean;
  configured: boolean;
  error?: string;
}

interface DbTestResult {
  success: boolean;
  tables?: string[];
  error?: string;
}

// Expose protected methods to the renderer process
const api = {
  // Test method to verify IPC is working
  ping: () => ipcRenderer.invoke('ping'),

  // Database namespace
  db: {
    test: () => ipcRenderer.invoke('db:test') as Promise<DbTestResult>,
  },

  // Workspace namespace
  workspace: {
    select: () => ipcRenderer.invoke('workspace:select') as Promise<SelectResult>,
    initialize: (folderPath: string) =>
      ipcRenderer.invoke('workspace:initialize', folderPath) as Promise<IPCResult>,
    getPath: () => ipcRenderer.invoke('workspace:getPath') as Promise<PathResult>,
    isConfigured: () => ipcRenderer.invoke('workspace:isConfigured') as Promise<ConfiguredResult>,
    openFolder: () => ipcRenderer.invoke('workspace:openFolder') as Promise<IPCResult>,
  },

  // Placeholders for future namespaces (will be implemented in later phases)
  // products: { ... },
  // entities: { ... },
  // taxonomy: { ... },
  // relationships: { ... },
  // exports: { ... },
  // settings: { ... },
};

// Expose the API to the renderer process
contextBridge.exposeInMainWorld('api', api);

// Type declaration for the exposed API
export type ElectronAPI = typeof api;
