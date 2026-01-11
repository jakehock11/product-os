import { ipcMain } from 'electron';
import {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  CreateProductData,
  UpdateProductData,
} from '../database/queries/products';

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
      return { success: true, data: product };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  });

  // Update an existing product
  ipcMain.handle('products:update', (_, id: string, data: UpdateProductData) => {
    try {
      const product = updateProduct(id, data);
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
}
