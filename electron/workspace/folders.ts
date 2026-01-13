import path from 'path';
import fs from 'fs';
import type { Product } from '../database/queries/products';

// Characters not allowed in Windows filenames
const INVALID_CHARS = /[\\/:*?"<>|]/g;

// ============================================
// Folder Name Utilities
// ============================================

// Sanitize a name for use as a folder name
export function sanitizeFolderName(name: string): string {
  return name
    .replace(INVALID_CHARS, '-')
    .replace(/\s+/g, ' ')
    .trim()
    .substring(0, 100); // Limit length
}

// Generate a folder name for a product
// Format: "ProductName" or "ProductName_shortId" if duplicate
export function generateProductFolderName(product: Product, workspacePath: string, excludeCurrentFolder?: string): string {
  const baseName = sanitizeFolderName(product.name);
  const productsDir = path.join(workspacePath, 'products');

  // Check if this name would conflict with existing folders
  if (fs.existsSync(productsDir)) {
    const existingFolders = fs.readdirSync(productsDir);
    const conflictingFolder = existingFolders.find(folder => {
      if (excludeCurrentFolder && folder === excludeCurrentFolder) {
        return false; // Don't count our own current folder as a conflict
      }
      // Check if folder name matches (case-insensitive on Windows)
      return folder.toLowerCase() === baseName.toLowerCase();
    });

    if (conflictingFolder) {
      // Check if the conflicting folder belongs to a different product
      const conflictingProductJson = path.join(productsDir, conflictingFolder, 'product.json');
      if (fs.existsSync(conflictingProductJson)) {
        try {
          const conflictingProduct = JSON.parse(fs.readFileSync(conflictingProductJson, 'utf-8'));
          if (conflictingProduct.id !== product.id) {
            // Different product with same name - add short ID suffix
            const shortId = product.id.replace('prod_', '').substring(0, 4);
            return `${baseName}_${shortId}`;
          }
        } catch {
          // If we can't read the JSON, be safe and add suffix
          const shortId = product.id.replace('prod_', '').substring(0, 4);
          return `${baseName}_${shortId}`;
        }
      }
    }
  }

  return baseName;
}

// ============================================
// Product Folder Resolution
// ============================================

// Find a product's folder by its ID (reads product.json files)
export function findProductFolder(productId: string, workspacePath: string): string | null {
  const productsDir = path.join(workspacePath, 'products');

  if (!fs.existsSync(productsDir)) {
    return null;
  }

  const folders = fs.readdirSync(productsDir);

  for (const folder of folders) {
    const productJsonPath = path.join(productsDir, folder, 'product.json');
    if (fs.existsSync(productJsonPath)) {
      try {
        const productData = JSON.parse(fs.readFileSync(productJsonPath, 'utf-8'));
        if (productData.id === productId) {
          return folder;
        }
      } catch {
        // Skip invalid JSON files
      }
    }
  }

  return null;
}

// Get the full path to a product's folder
export function getProductFolderPath(productId: string, workspacePath: string): string | null {
  const folderName = findProductFolder(productId, workspacePath);
  if (!folderName) return null;
  return path.join(workspacePath, 'products', folderName);
}

// ============================================
// Product.json Management
// ============================================

export interface ProductJson {
  id: string;
  name: string;
  description: string | null;
  folder_name: string;
  created_at: string;
  updated_at: string;
}

// Read product.json from a folder
export function readProductJson(productFolderPath: string): ProductJson | null {
  const jsonPath = path.join(productFolderPath, 'product.json');
  if (!fs.existsSync(jsonPath)) return null;

  try {
    return JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
  } catch {
    return null;
  }
}

// Write product.json to a folder
export function writeProductJson(productFolderPath: string, data: ProductJson): void {
  const jsonPath = path.join(productFolderPath, 'product.json');
  fs.writeFileSync(jsonPath, JSON.stringify(data, null, 2), 'utf-8');
}

// ============================================
// Folder Operations
// ============================================

// Rename a product folder (when product name changes)
export function renameProductFolder(
  oldFolderPath: string,
  newFolderName: string,
  workspacePath: string
): string {
  const productsDir = path.join(workspacePath, 'products');
  const newFolderPath = path.join(productsDir, newFolderName);

  if (oldFolderPath !== newFolderPath) {
    fs.renameSync(oldFolderPath, newFolderPath);
  }

  return newFolderPath;
}
