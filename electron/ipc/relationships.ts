import { ipcMain } from 'electron';
import {
  getRelationshipsForEntity,
  getOutgoingRelationships,
  getIncomingRelationships,
  createRelationship,
  deleteRelationship,
  relationshipExists,
  CreateRelationshipData,
} from '../database/queries/relationships';
import { getEntityById } from '../database/queries/entities';
import { writeEntityMarkdown } from '../markdown/writer';
import { getWorkspacePath } from '../workspace/manager';

export function registerRelationshipHandlers(): void {
  // Get all relationships for an entity (both directions)
  ipcMain.handle('relationships:getForEntity', (_, entityId: string) => {
    try {
      const relationships = getRelationshipsForEntity(entityId);
      return { success: true, data: relationships };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  });

  // Get outgoing relationships only
  ipcMain.handle('relationships:getOutgoing', (_, entityId: string) => {
    try {
      const relationships = getOutgoingRelationships(entityId);
      return { success: true, data: relationships };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  });

  // Get incoming relationships only
  ipcMain.handle('relationships:getIncoming', (_, entityId: string) => {
    try {
      const relationships = getIncomingRelationships(entityId);
      return { success: true, data: relationships };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  });

  // Create a new relationship
  ipcMain.handle('relationships:create', (_, data: CreateRelationshipData) => {
    try {
      // Check if relationship already exists
      if (relationshipExists(data.sourceId, data.targetId)) {
        return { success: false, error: 'Relationship already exists between these entities' };
      }

      const relationship = createRelationship(data);

      // Regenerate markdown for the source entity (links section changed)
      const workspacePath = getWorkspacePath();
      if (workspacePath) {
        const sourceEntity = getEntityById(data.sourceId);
        if (sourceEntity) {
          writeEntityMarkdown(sourceEntity, workspacePath);
        }
      }

      return { success: true, data: relationship };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  });

  // Delete a relationship
  ipcMain.handle('relationships:delete', (_, id: string, sourceEntityId?: string) => {
    try {
      deleteRelationship(id);

      // Regenerate markdown for the source entity if provided
      if (sourceEntityId) {
        const workspacePath = getWorkspacePath();
        if (workspacePath) {
          const sourceEntity = getEntityById(sourceEntityId);
          if (sourceEntity) {
            writeEntityMarkdown(sourceEntity, workspacePath);
          }
        }
      }

      return { success: true };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  });
}
