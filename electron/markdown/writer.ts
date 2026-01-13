import path from 'path';
import fs from 'fs';
import type { Entity, EntityType } from '../database/queries/entities';
import { generateMarkdown } from './templates';
import { findProductFolder } from '../workspace/folders';

// ============================================
// Path Helpers
// ============================================

// Get the folder name for an entity type (pluralized)
function getTypeFolderName(type: EntityType): string {
  switch (type) {
    case 'capture':
      return 'captures';
    case 'problem':
      return 'problems';
    case 'hypothesis':
      return 'hypotheses';
    case 'experiment':
      return 'experiments';
    case 'decision':
      return 'decisions';
    case 'artifact':
      return 'artifacts';
    default:
      return `${type}s`;
  }
}

// Get the markdown file path for an entity
// workspace/products/<ProductName>/entities/<type>s/<id>.md
export function getMarkdownPath(entity: Entity, workspacePath: string): string {
  const typeFolder = getTypeFolderName(entity.type);

  // Find product folder by ID (returns folder name like "SidelineHD")
  const productFolder = findProductFolder(entity.productId, workspacePath);

  // Fall back to product ID if folder not found (for new products)
  const folderName = productFolder || entity.productId;

  return path.join(
    workspacePath,
    'products',
    folderName,
    'entities',
    typeFolder,
    `${entity.id}.md`
  );
}

// Get the entities directory for a product
function getEntitiesDir(productId: string, type: EntityType, workspacePath: string): string {
  const typeFolder = getTypeFolderName(type);
  return path.join(
    workspacePath,
    'products',
    productId,
    'entities',
    typeFolder
  );
}

// ============================================
// Write Functions
// ============================================

// Write entity markdown file
export function writeEntityMarkdown(entity: Entity, workspacePath: string): void {
  const filePath = getMarkdownPath(entity, workspacePath);
  const dirPath = path.dirname(filePath);

  // Ensure directory exists
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }

  // Generate markdown content
  const content = generateMarkdown(entity);

  // Write file
  fs.writeFileSync(filePath, content, 'utf-8');
}

// Delete entity markdown file
export function deleteEntityMarkdown(entity: Entity, workspacePath: string): void {
  const filePath = getMarkdownPath(entity, workspacePath);

  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }

  // Optionally clean up empty directories
  cleanupEmptyDirs(path.dirname(filePath), workspacePath);
}

// ============================================
// Cleanup Helpers
// ============================================

// Remove empty directories up to workspace root
function cleanupEmptyDirs(dirPath: string, workspacePath: string): void {
  // Don't go above workspace
  if (!dirPath.startsWith(workspacePath) || dirPath === workspacePath) {
    return;
  }

  try {
    const contents = fs.readdirSync(dirPath);
    if (contents.length === 0) {
      fs.rmdirSync(dirPath);
      // Recursively check parent
      cleanupEmptyDirs(path.dirname(dirPath), workspacePath);
    }
  } catch {
    // Ignore errors during cleanup
  }
}

// ============================================
// Batch Operations
// ============================================

// Write multiple entity markdown files
export function writeEntitiesMarkdown(entities: Entity[], workspacePath: string): void {
  for (const entity of entities) {
    writeEntityMarkdown(entity, workspacePath);
  }
}

// Regenerate all markdown files for a product
export function regenerateProductMarkdown(
  productId: string,
  entities: Entity[],
  workspacePath: string
): void {
  const productEntities = entities.filter(e => e.productId === productId);

  for (const entity of productEntities) {
    writeEntityMarkdown(entity, workspacePath);
  }
}
