import { ipcMain, shell } from 'electron';
import path from 'path';
import fs from 'fs';
import {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  CreateProductData,
  UpdateProductData,
} from '../database/queries/products';
import { getWorkspacePath } from '../workspace/manager';
import { createProductFolderStructure } from '../workspace/sync';
import {
  findProductFolder,
  getProductFolderPath,
  generateProductFolderName,
  renameProductFolder,
  writeProductJson,
  ProductJson,
} from '../workspace/folders';

export function registerProductHandlers(): void {
  // Get all products
  ipcMain.handle('products:getAll', () => {
    try {
      const products = getAllProducts();
      return { success: true, data: products };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  });

  // Get a product by ID
  ipcMain.handle('products:getById', (_, id: string) => {
    try {
      const product = getProductById(id);
      return { success: true, data: product };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  });

  // Create a new product
  ipcMain.handle('products:create', (_, data: CreateProductData) => {
    try {
      const product = createProduct(data);

      // Create folder structure immediately
      const workspacePath = getWorkspacePath();
      if (workspacePath) {
        createProductFolderStructure(product, workspacePath);
      }

      return { success: true, data: product };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  });

  // Update an existing product
  ipcMain.handle('products:update', (_, id: string, data: UpdateProductData) => {
    try {
      const product = updateProduct(id, data);

      // Handle folder updates
      const workspacePath = getWorkspacePath();
      if (workspacePath) {
        const currentFolderName = findProductFolder(id, workspacePath);

        if (currentFolderName) {
          const currentFolderPath = path.join(workspacePath, 'products', currentFolderName);

          // Check if folder name needs to change (product was renamed)
          const newFolderName = generateProductFolderName(product, workspacePath, currentFolderName);
          let finalFolderPath = currentFolderPath;

          if (newFolderName !== currentFolderName) {
            // Rename the folder
            finalFolderPath = renameProductFolder(currentFolderPath, newFolderName, workspacePath);
            console.log(`[Products] Renamed folder: ${currentFolderName} -> ${newFolderName}`);
          }

          // Update product.json with current data
          const productJson: ProductJson = {
            id: product.id,
            name: product.name,
            description: product.description,
            folder_name: newFolderName,
            created_at: product.createdAt,
            updated_at: product.updatedAt,
          };
          writeProductJson(finalFolderPath, productJson);
        }
      }

      return { success: true, data: product };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  });

  // Delete a product
  ipcMain.handle('products:delete', (_, id: string) => {
    try {
      deleteProduct(id);
      return { success: true };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  });

  // Open product folder in file explorer
  ipcMain.handle('products:openFolder', (_, productId: string) => {
    try {
      const workspacePath = getWorkspacePath();
      if (!workspacePath) {
        return { success: false, error: 'No workspace configured' };
      }

      const productPath = getProductFolderPath(productId, workspacePath);
      if (!productPath || !fs.existsSync(productPath)) {
        return { success: false, error: 'Product folder not found' };
      }

      shell.openPath(productPath);
      return { success: true };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  });

  // Get product folder path (for display)
  ipcMain.handle('products:getFolderPath', (_, productId: string) => {
    try {
      const workspacePath = getWorkspacePath();
      if (!workspacePath) {
        return { success: true, data: null };
      }

      const productPath = getProductFolderPath(productId, workspacePath);
      return { success: true, data: productPath };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  });
}
