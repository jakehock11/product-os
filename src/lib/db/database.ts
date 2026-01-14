import { openDB, DBSchema, IDBPDatabase } from 'idb';
import type { Product, Entity, ExportRecord, ProductSettings } from './schema';

interface ProductOSDB extends DBSchema {
  products: {
    key: string;
    value: Product;
    indexes: { 'by-updated': string };
  };
  entities: {
    key: string;
    value: Entity;
    indexes: {
      'by-product': string;
      'by-type': string;
      'by-product-type': [string, string];
      'by-updated': string;
    };
  };
  exports: {
    key: string;
    value: ExportRecord;
    indexes: { 'by-product': string };
  };
  settings: {
    key: string;
    value: ProductSettings;
  };
}

const DB_NAME = 'product-os';
const DB_VERSION = 1;

let dbInstance: IDBPDatabase<ProductOSDB> | null = null;

export async function getDB(): Promise<IDBPDatabase<ProductOSDB>> {
  if (dbInstance) return dbInstance;

  dbInstance = await openDB<ProductOSDB>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      // Products store
      const productsStore = db.createObjectStore('products', { keyPath: 'id' });
      productsStore.createIndex('by-updated', 'updatedAt');

      // Entities store
      const entitiesStore = db.createObjectStore('entities', { keyPath: 'id' });
      entitiesStore.createIndex('by-product', 'productId');
      entitiesStore.createIndex('by-type', 'type');
      entitiesStore.createIndex('by-product-type', ['productId', 'type']);
      entitiesStore.createIndex('by-updated', 'updatedAt');

      // Exports store
      const exportsStore = db.createObjectStore('exports', { keyPath: 'id' });
      exportsStore.createIndex('by-product', 'productId');

      // Settings store
      db.createObjectStore('settings', { keyPath: 'productId' });
    },
  });

  return dbInstance;
}

// Product operations
export async function getAllProducts(): Promise<Product[]> {
  const db = await getDB();
  return db.getAll('products');
}

export async function getProduct(id: string): Promise<Product | undefined> {
  const db = await getDB();
  return db.get('products', id);
}

export async function saveProduct(product: Product): Promise<void> {
  const db = await getDB();
  await db.put('products', product);
}

export async function deleteProduct(id: string): Promise<void> {
  const db = await getDB();
  const tx = db.transaction(['products', 'entities', 'exports', 'settings'], 'readwrite');

  // Delete product
  await tx.objectStore('products').delete(id);

  // Delete all entities for this product
  const entities = await tx.objectStore('entities').index('by-product').getAllKeys(id);
  for (const entityId of entities) {
    await tx.objectStore('entities').delete(entityId);
  }

  // Delete exports for this product
  const exports = await tx.objectStore('exports').index('by-product').getAllKeys(id);
  for (const exportId of exports) {
    await tx.objectStore('exports').delete(exportId);
  }

  // Delete settings
  await tx.objectStore('settings').delete(id);

  await tx.done;
}

// Entity operations
export async function getEntitiesByProduct(productId: string): Promise<Entity[]> {
  const db = await getDB();
  return db.getAllFromIndex('entities', 'by-product', productId);
}

export async function getEntitiesByProductAndType(
  productId: string,
  type: string
): Promise<Entity[]> {
  const db = await getDB();
  return db.getAllFromIndex('entities', 'by-product-type', [productId, type]);
}

export async function getEntity(id: string): Promise<Entity | undefined> {
  const db = await getDB();
  return db.get('entities', id);
}

export async function saveEntity(entity: Entity): Promise<void> {
  const db = await getDB();
  await db.put('entities', entity);

  // Update product's lastActivityAt
  const product = await db.get('products', entity.productId);
  if (product) {
    product.lastActivityAt = new Date().toISOString();
    await db.put('products', product);
  }
}

export async function deleteEntity(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('entities', id);
}

// Export operations
export async function getExportsByProduct(productId: string): Promise<ExportRecord[]> {
  const db = await getDB();
  return db.getAllFromIndex('exports', 'by-product', productId);
}

export async function saveExport(record: ExportRecord): Promise<void> {
  const db = await getDB();
  await db.put('exports', record);
}

// Settings operations
export async function getProductSettings(productId: string): Promise<ProductSettings | undefined> {
  const db = await getDB();
  return db.get('settings', productId);
}

export async function saveProductSettings(settings: ProductSettings): Promise<void> {
  const db = await getDB();
  await db.put('settings', settings);
}

// Utility to generate IDs
export function generateId(): string {
  return crypto.randomUUID();
}
