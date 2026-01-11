import { registerWorkspaceHandlers } from './workspace';

// Register all IPC handlers
export function registerAllHandlers(): void {
  registerWorkspaceHandlers();

  // Future handlers will be registered here:
  // registerProductHandlers();
  // registerEntityHandlers();
  // registerTaxonomyHandlers();
  // registerRelationshipHandlers();
  // registerExportHandlers();
  // registerSettingsHandlers();
}
