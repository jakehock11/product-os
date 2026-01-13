import { ipcMain, shell } from 'electron';
import path from 'path';
import {
  getEntities,
  getEntityById,
  createEntity,
  updateEntity,
  deleteEntity,
  promoteCapture,
  EntityFilters,
  CreateEntityData,
  UpdateEntityData,
  EntityType,
} from '../database/queries/entities';
import { writeEntityMarkdown, deleteEntityMarkdown, getMarkdownPath } from '../markdown/writer';
import { getWorkspacePath } from '../workspace/manager';

export function registerEntityHandlers(): void {
  // Get all entities for a product (with optional filters)
  ipcMain.handle('entities:getAll', (_, productId: string, filters?: EntityFilters) => {
    try {
      const entities = getEntities(productId, filters);
      return { success: true, data: entities };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  });

  // Get a single entity by ID
  ipcMain.handle('entities:getById', (_, id: string) => {
    try {
      const entity = getEntityById(id);
      return { success: true, data: entity };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  });

  // Create a new entity
  ipcMain.handle('entities:create', (_, data: CreateEntityData) => {
    try {
      const entity = createEntity(data);

      // Generate markdown file
      const workspacePath = getWorkspacePath();
      if (workspacePath) {
        writeEntityMarkdown(entity, workspacePath);
      }

      return { success: true, data: entity };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  });

  // Update an existing entity
  ipcMain.handle('entities:update', (_, id: string, data: UpdateEntityData) => {
    try {
      const entity = updateEntity(id, data);

      // Regenerate markdown file
      const workspacePath = getWorkspacePath();
      if (workspacePath) {
        writeEntityMarkdown(entity, workspacePath);
      }

      return { success: true, data: entity };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  });

  // Delete an entity
  ipcMain.handle('entities:delete', (_, id: string) => {
    try {
      // Get entity first so we can delete its markdown file
      const entity = getEntityById(id);

      // Delete markdown file if entity exists and workspace is configured
      if (entity) {
        const workspacePath = getWorkspacePath();
        if (workspacePath) {
          deleteEntityMarkdown(entity, workspacePath);
        }
      }

      // Delete from database
      deleteEntity(id);
      return { success: true };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  });

  // Promote a capture to another entity type
  ipcMain.handle('entities:promote', (_, captureId: string, targetType: EntityType) => {
    try {
      const entity = promoteCapture(captureId, targetType);

      // Generate markdown file for new entity
      const workspacePath = getWorkspacePath();
      if (workspacePath) {
        writeEntityMarkdown(entity, workspacePath);

        // Also update the original capture's markdown (it now has promoted_to_id)
        const capture = getEntityById(captureId);
        if (capture) {
          writeEntityMarkdown(capture, workspacePath);
        }
      }

      return { success: true, data: entity };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  });

  // Open entity's folder in file explorer
  ipcMain.handle('entities:openFolder', (_, entityId: string) => {
    try {
      const entity = getEntityById(entityId);
      if (!entity) {
        return { success: false, error: 'Entity not found' };
      }

      const workspacePath = getWorkspacePath();
      if (!workspacePath) {
        return { success: false, error: 'No workspace configured' };
      }

      const markdownPath = getMarkdownPath(entity, workspacePath);
      const folderPath = path.dirname(markdownPath);

      shell.openPath(folderPath);
      return { success: true };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  });

  // Get entity's file path (for display)
  ipcMain.handle('entities:getFilePath', (_, entityId: string) => {
    try {
      const entity = getEntityById(entityId);
      if (!entity) {
        return { success: true, data: null };
      }

      const workspacePath = getWorkspacePath();
      if (!workspacePath) {
        return { success: true, data: null };
      }

      const markdownPath = getMarkdownPath(entity, workspacePath);
      const relativePath = path.relative(workspacePath, markdownPath);

      return {
        success: true,
        data: {
          absolutePath: markdownPath,
          relativePath: relativePath,
        },
      };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  });
}
