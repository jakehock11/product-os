import path from 'path';
import fs from 'fs';
import { getAllProducts, Product } from '../database/queries/products';
import { getEntities, Entity } from '../database/queries/entities';
import { getMarkdownPath, writeEntityMarkdown } from '../markdown/writer';
import { getWorkspacePath } from './manager';
import {
  generateProductFolderName,
  findProductFolder,
  writeProductJson,
  ProductJson,
} from './folders';

// Entity type folders
const ENTITY_FOLDERS = ['captures', 'problems', 'hypotheses', 'experiments', 'decisions', 'artifacts'];

// ============================================
// Logging
// ============================================

interface SyncLogger {
  log: (message: string) => void;
  flush: () => void;
}

function createSyncLogger(workspacePath: string): SyncLogger {
  const logsDir = path.join(workspacePath, 'logs');
  const logFile = path.join(logsDir, 'sync.log');
  const timestamp = new Date().toISOString();
  const messages: string[] = [];

  // Ensure logs directory exists
  if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
  }

  return {
    log: (message: string) => {
      const formattedMessage = `[${timestamp}] ${message}`;
      console.log(`[Sync] ${message}`);
      messages.push(formattedMessage);
    },
    flush: () => {
      if (messages.length > 0) {
        const content = messages.join('\n') + '\n\n';
        fs.appendFileSync(logFile, content, 'utf-8');
      }
    }
  };
}

// ============================================
// Product Folder Structure
// ============================================

export function createProductFolderStructure(product: Product, workspacePath: string): { created: boolean; folderName: string } {
  // Check if product already has a folder
  const existingFolder = findProductFolder(product.id, workspacePath);
  let folderName: string;
  let productDir: string;
  let created = false;

  if (existingFolder) {
    // Product folder exists - use it
    folderName = existingFolder;
    productDir = path.join(workspacePath, 'products', folderName);
  } else {
    // Create new folder with product name
    folderName = generateProductFolderName(product, workspacePath);
    productDir = path.join(workspacePath, 'products', folderName);

    if (!fs.existsSync(productDir)) {
      fs.mkdirSync(productDir, { recursive: true });
      created = true;
    }
  }

  const entitiesDir = path.join(productDir, 'entities');

  // Create entities subdirectories
  for (const folder of ENTITY_FOLDERS) {
    const folderPath = path.join(entitiesDir, folder);
    if (!fs.existsSync(folderPath)) {
      fs.mkdirSync(folderPath, { recursive: true });
      created = true;
    }
  }

  // Build product.json data
  const productJson: ProductJson = {
    id: product.id,
    name: product.name,
    description: product.description,
    folder_name: folderName,
    created_at: product.createdAt,
    updated_at: product.updatedAt,
  };

  // Check if product.json needs updating
  const productJsonPath = path.join(productDir, 'product.json');
  let needsUpdate = !fs.existsSync(productJsonPath);
  if (!needsUpdate) {
    try {
      const existing = JSON.parse(fs.readFileSync(productJsonPath, 'utf-8'));
      needsUpdate = existing.name !== product.name ||
                    existing.description !== product.description ||
                    existing.updated_at !== product.updatedAt ||
                    existing.folder_name !== folderName;
    } catch {
      needsUpdate = true;
    }
  }

  if (needsUpdate) {
    writeProductJson(productDir, productJson);
    created = true;
  }

  return { created, folderName };
}

// ============================================
// Sync Functions
// ============================================

export function syncWorkspaceFiles(): void {
  const workspacePath = getWorkspacePath();
  if (!workspacePath) {
    console.log('[Sync] No workspace configured, skipping sync');
    return;
  }

  const logger = createSyncLogger(workspacePath);
  logger.log('Starting workspace sync...');

  let productsCreated = 0;
  let entitiesRegenerated = 0;
  let totalProducts = 0;
  let totalEntities = 0;

  try {
    // Get all products from DB
    const products = getAllProducts();
    totalProducts = products.length;

    // Sync each product
    for (const product of products) {
      const { created, folderName } = createProductFolderStructure(product, workspacePath);
      if (created) {
        logger.log(`Created/updated folder structure for product: ${product.name} (${folderName})`);
        productsCreated++;
      }

      // Get all entities for this product
      const entities = getEntities(product.id);
      totalEntities += entities.length;

      // Check each entity's markdown file
      for (const entity of entities) {
        const markdownPath = getMarkdownPath(entity, workspacePath);
        if (!fs.existsSync(markdownPath)) {
          writeEntityMarkdown(entity, workspacePath);
          logger.log(`Regenerated markdown for ${entity.type}: ${entity.title || entity.id}`);
          entitiesRegenerated++;
        }
      }
    }

    // Summary
    logger.log(`Sync complete: ${totalProducts} products, ${totalEntities} entities checked`);
    if (productsCreated > 0 || entitiesRegenerated > 0) {
      logger.log(`Created/updated: ${productsCreated} product folders, ${entitiesRegenerated} markdown files`);
    } else {
      logger.log('All files up to date');
    }

  } catch (error) {
    logger.log(`Sync error: ${String(error)}`);
  } finally {
    logger.flush();
  }
}

// Export for use in product creation
export { ENTITY_FOLDERS };
