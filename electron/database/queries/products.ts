import { getDatabase } from '../db';
import { nanoid } from 'nanoid';

// Product interface (matches types.ts but with snake_case for DB)
export interface Product {
  id: string;
  name: string;
  description: string | null;
  icon: string | null;
  createdAt: string;
  updatedAt: string;
  lastActivityAt: string;
}

// Database row type (snake_case)
interface ProductRow {
  id: string;
  name: string;
  description: string | null;
  icon: string | null;
  created_at: string;
  updated_at: string;
  last_activity_at: string;
}

// Create data type
export interface CreateProductData {
  name: string;
  description?: string;
  icon?: string;
}

// Update data type
export interface UpdateProductData {
  name?: string;
  description?: string;
  icon?: string;
}

// Generate a product ID with prefix
function generateProductId(): string {
  return `prod_${nanoid(12)}`;
}

// Convert database row to Product object (snake_case to camelCase)
function rowToProduct(row: ProductRow): Product {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    icon: row.icon,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    lastActivityAt: row.last_activity_at,
  };
}

// Get all products
export function getAllProducts(): Product[] {
  const db = getDatabase();
  const rows = db.prepare(`
    SELECT id, name, description, icon, created_at, updated_at, last_activity_at
    FROM products
    ORDER BY last_activity_at DESC
  `).all() as ProductRow[];

  return rows.map(rowToProduct);
}

// Get a product by ID
export function getProductById(id: string): Product | null {
  const db = getDatabase();
  const row = db.prepare(`
    SELECT id, name, description, icon, created_at, updated_at, last_activity_at
    FROM products
    WHERE id = ?
  `).get(id) as ProductRow | undefined;

  return row ? rowToProduct(row) : null;
}

// Create a new product
export function createProduct(data: CreateProductData): Product {
  const db = getDatabase();
  const id = generateProductId();
  const now = new Date().toISOString();

  db.prepare(`
    INSERT INTO products (id, name, description, icon, created_at, updated_at, last_activity_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    id,
    data.name,
    data.description || null,
    data.icon || null,
    now,
    now,
    now
  );

  // Return the created product
  const product = getProductById(id);
  if (!product) {
    throw new Error('Failed to create product');
  }
  return product;
}

// Update an existing product
export function updateProduct(id: string, data: UpdateProductData): Product {
  const db = getDatabase();
  const now = new Date().toISOString();

  // Build dynamic update query based on provided fields
  const updates: string[] = [];
  const values: (string | null)[] = [];

  if (data.name !== undefined) {
    updates.push('name = ?');
    values.push(data.name);
  }
  if (data.description !== undefined) {
    updates.push('description = ?');
    values.push(data.description || null);
  }
  if (data.icon !== undefined) {
    updates.push('icon = ?');
    values.push(data.icon || null);
  }

  // Always update timestamps
  updates.push('updated_at = ?');
  values.push(now);
  updates.push('last_activity_at = ?');
  values.push(now);

  // Add the ID for the WHERE clause
  values.push(id);

  const result = db.prepare(`
    UPDATE products
    SET ${updates.join(', ')}
    WHERE id = ?
  `).run(...values);

  if (result.changes === 0) {
    throw new Error(`Product not found: ${id}`);
  }

  // Return the updated product
  const product = getProductById(id);
  if (!product) {
    throw new Error('Failed to retrieve updated product');
  }
  return product;
}

// Delete a product (cascades to related records via foreign keys)
export function deleteProduct(id: string): void {
  const db = getDatabase();

  const result = db.prepare('DELETE FROM products WHERE id = ?').run(id);

  if (result.changes === 0) {
    throw new Error(`Product not found: ${id}`);
  }
}

// Update last_activity_at timestamp (called when entities are modified)
export function touchProduct(id: string): void {
  const db = getDatabase();
  const now = new Date().toISOString();

  db.prepare(`
    UPDATE products
    SET last_activity_at = ?
    WHERE id = ?
  `).run(now, id);
}
