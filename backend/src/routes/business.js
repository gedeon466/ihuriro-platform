import express from 'express';
import { z } from 'zod';
import { execute, newId, nowIso, query, queryOne, today, withTransaction } from '../db.js';
import { audit } from '../lib/audit.js';
import {
  AppError,
  asyncHandler,
  parseBody,
  serializeLoan,
  serializeProduct,
  serializeSale,
  stockStatus,
} from '../lib/http.js';
import { canManageBusiness, requireAuth } from '../middleware/auth.js';

const router = express.Router();

router.use(requireAuth);

const productSchema = z.object({
  name: z.string().trim().min(2, 'Enter the product name.').max(120),
  category: z.string().trim().min(2, 'Enter a category.').max(60),
  stock: z.coerce.number().int().min(0).max(1000000),
  unitPrice: z.coerce.number().int().min(0).max(1000000000),
  lowStockAlert: z.coerce.number().int().min(0).max(1000000).optional().default(8),
  description: z.string().trim().max(500).optional().or(z.literal('')),
  supplierId: z.string().trim().max(40).optional().or(z.literal('')),
  expiryDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().or(z.literal('')),
});

// No defaults here, otherwise a PATCH would silently reset fields it never mentioned.
const productUpdateSchema = z.object({
  name: z.string().trim().min(2).max(120).optional(),
  category: z.string().trim().min(2).max(60).optional(),
  stock: z.coerce.number().int().min(0).max(1000000).optional(),
  unitPrice: z.coerce.number().int().min(0).max(1000000000).optional(),
  lowStockAlert: z.coerce.number().int().min(0).max(1000000).optional(),
  description: z.string().trim().max(500).optional().or(z.literal('')),
  supplierId: z.string().trim().max(40).optional().or(z.literal('')),
  expiryDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().or(z.literal('')),
});

const saleSchema = z.object({
  product: z.string().trim().min(1, 'Choose a product.').max(120),
  quantity: z.coerce.number().int().min(1, 'Quantity must be at least one.').max(1000000),
  amount: z.coerce.number().int().min(0).max(1000000000).optional(),
  customer: z.string().trim().max(120).optional().or(z.literal('')),
  paymentMethod: z.enum(['cash', 'mobile-money', 'card', 'credit']).optional().default('cash'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

const loanSchema = z.object({
  type: z.enum(['loan', 'debt']).optional().default('loan'),
  counterparty: z.string().trim().min(2, 'Add who the loan or debt is with.').max(160),
  amount: z.coerce.number().int().min(1000, 'Loan amount is too small.').max(1000000000),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  interestRate: z.coerce.number().min(0).max(100).optional().default(0),
  dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().or(z.literal('')),
  notes: z.string().trim().max(1000).optional().or(z.literal('')),
});

const supplierSchema = z.object({
  name: z.string().trim().min(2, 'Enter the supplier name.').max(120),
  phone: z.string().trim().max(30).optional().or(z.literal('')),
  email: z.string().trim().toLowerCase().email('Enter a valid email address.').max(254).optional().or(z.literal('')),
  address: z.string().trim().max(255).optional().or(z.literal('')),
  notes: z.string().trim().max(500).optional().or(z.literal('')),
});

const STOCK_IN_REASONS = ['purchase', 'supplier-delivery', 'return', 'transfer-in', 'adjustment', 'other'];
const STOCK_OUT_REASONS = ['sale', 'damaged', 'expired', 'transfer-out', 'loss', 'other'];

function serializeSupplier(row) {
  return {
    id: row.id,
    name: row.name,
    phone: row.phone || '',
    email: row.email || '',
    address: row.address || '',
    notes: row.notes || '',
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function findSupplier(id) {
  return queryOne('SELECT * FROM suppliers WHERE id = ?', [id]);
}

async function findProduct(id) {
  return queryOne(
    `SELECT p.*, s.name AS supplier_name
     FROM products p LEFT JOIN suppliers s ON s.id = p.supplier_id
     WHERE p.id = ?`,
    [id]
  );
}

router.get(
  '/products',
  asyncHandler(async (_req, res) => {
    const rows = await query(
      `SELECT p.*, s.name AS supplier_name
       FROM products p LEFT JOIN suppliers s ON s.id = p.supplier_id
       ORDER BY p.name ASC`
    );
    res.json({ products: rows.map(serializeProduct) });
  })
);

router.post(
  '/products',
  asyncHandler(async (req, res) => {
    if (!canManageBusiness(req.user)) {
      throw new AppError(403, 'Only business accounts can manage inventory.');
    }
    const data = parseBody(productSchema, req.body);
    if (data.supplierId && !(await findSupplier(data.supplierId))) {
      throw new AppError(404, 'Supplier not found.');
    }
    const id = newId('prd');
    const timestamp = nowIso();

    try {
      await execute(
        `INSERT INTO products (id, name, category, stock, unit_price, low_stock_alert, description, supplier_id, expiry_date, status, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          id,
          data.name,
          data.category,
          data.stock,
          data.unitPrice,
          data.lowStockAlert,
          data.description || null,
          data.supplierId || null,
          data.expiryDate || null,
          stockStatus(data.stock, data.lowStockAlert),
          timestamp,
          timestamp,
        ]
      );
    } catch (error) {
      if (error.code === 'ER_DUP_ENTRY') {
        throw new AppError(409, 'A product with this name already exists.');
      }
      throw error;
    }

    const row = await findProduct(id);
    audit(req, 'product.create', 'product', id, { name: data.name });
    res.status(201).json({ product: serializeProduct(row) });
  })
);

router.patch(
  '/products/:id',
  asyncHandler(async (req, res) => {
    if (!canManageBusiness(req.user)) {
      throw new AppError(403, 'Only business accounts can manage inventory.');
    }
    const data = parseBody(productUpdateSchema, req.body);
    const row = await findProduct(req.params.id);
    if (!row) throw new AppError(404, 'Product not found.');

    const changes = [];
    const params = [];
    for (const key of ['name', 'category', 'stock']) {
      if (data[key] !== undefined) {
        changes.push(`${key} = ?`);
        params.push(data[key]);
      }
    }
    if (data.unitPrice !== undefined) {
      changes.push('unit_price = ?');
      params.push(data.unitPrice);
    }
    if (data.lowStockAlert !== undefined) {
      changes.push('low_stock_alert = ?');
      params.push(data.lowStockAlert);
    }
    if (data.description !== undefined) {
      changes.push('description = ?');
      params.push(data.description || null);
    }
    if (data.supplierId !== undefined) {
      if (data.supplierId && !(await findSupplier(data.supplierId))) {
        throw new AppError(404, 'Supplier not found.');
      }
      changes.push('supplier_id = ?');
      params.push(data.supplierId || null);
    }
    if (data.expiryDate !== undefined) {
      changes.push('expiry_date = ?');
      params.push(data.expiryDate || null);
    }
    if (changes.length === 0) throw new AppError(400, 'No changes were submitted.');

    const nextStock = data.stock !== undefined ? data.stock : Number(row.stock);
    const alertLevel =
      data.lowStockAlert !== undefined ? data.lowStockAlert : Number(row.low_stock_alert ?? 8);
    changes.push('status = ?', 'updated_at = ?');
    params.push(stockStatus(nextStock, alertLevel), nowIso(), row.id);

    try {
      await execute(`UPDATE products SET ${changes.join(', ')} WHERE id = ?`, params);
    } catch (error) {
      if (error.code === 'ER_DUP_ENTRY') {
        throw new AppError(409, 'A product with this name already exists.');
      }
      throw error;
    }

    const updated = await findProduct(row.id);
    audit(req, 'product.update', 'product', row.id, Object.keys(data));
    res.json({ product: serializeProduct(updated) });
  })
);

router.delete(
  '/products/:id',
  asyncHandler(async (req, res) => {
    if (!canManageBusiness(req.user)) {
      throw new AppError(403, 'Only business accounts can manage inventory.');
    }
    const row = await findProduct(req.params.id);
    if (!row) throw new AppError(404, 'Product not found.');

    await execute('DELETE FROM products WHERE id = ?', [row.id]);
    audit(req, 'product.delete', 'product', row.id);
    res.json({ ok: true });
  })
);

router.get(
  '/suppliers',
  asyncHandler(async (_req, res) => {
    const rows = await query('SELECT * FROM suppliers ORDER BY name ASC');
    res.json({ suppliers: rows.map(serializeSupplier) });
  })
);

router.post(
  '/suppliers',
  asyncHandler(async (req, res) => {
    if (!canManageBusiness(req.user)) {
      throw new AppError(403, 'Only business accounts can manage suppliers.');
    }
    const data = parseBody(supplierSchema, req.body);
    const id = newId('sup');
    const timestamp = nowIso();

    try {
      await execute(
        `INSERT INTO suppliers (id, name, phone, email, address, notes, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          id,
          data.name,
          data.phone || null,
          data.email || null,
          data.address || null,
          data.notes || null,
          timestamp,
          timestamp,
        ]
      );
    } catch (error) {
      if (error.code === 'ER_DUP_ENTRY') {
        throw new AppError(409, 'A supplier with this name already exists.');
      }
      throw error;
    }

    const row = await findSupplier(id);
    audit(req, 'supplier.create', 'supplier', id, { name: data.name });
    res.status(201).json({ supplier: serializeSupplier(row) });
  })
);

router.patch(
  '/suppliers/:id',
  asyncHandler(async (req, res) => {
    if (!canManageBusiness(req.user)) {
      throw new AppError(403, 'Only business accounts can manage suppliers.');
    }
    const data = parseBody(supplierSchema.partial(), req.body);
    const row = await findSupplier(req.params.id);
    if (!row) throw new AppError(404, 'Supplier not found.');

    const fields = [];
    const params = [];
    for (const key of ['name', 'phone', 'email', 'address', 'notes']) {
      if (data[key] !== undefined) {
        fields.push(`${key} = ?`);
        params.push(data[key] || null);
      }
    }
    if (fields.length === 0) throw new AppError(400, 'No supplier changes were submitted.');

    fields.push('updated_at = ?');
    params.push(nowIso(), row.id);
    try {
      await execute(`UPDATE suppliers SET ${fields.join(', ')} WHERE id = ?`, params);
    } catch (error) {
      if (error.code === 'ER_DUP_ENTRY') {
        throw new AppError(409, 'A supplier with this name already exists.');
      }
      throw error;
    }

    const updated = await findSupplier(row.id);
    audit(req, 'supplier.update', 'supplier', row.id, Object.keys(data));
    res.json({ supplier: serializeSupplier(updated) });
  })
);

router.delete(
  '/suppliers/:id',
  asyncHandler(async (req, res) => {
    if (!canManageBusiness(req.user)) {
      throw new AppError(403, 'Only business accounts can manage suppliers.');
    }
    const row = await findSupplier(req.params.id);
    if (!row) throw new AppError(404, 'Supplier not found.');

    await execute('UPDATE products SET supplier_id = NULL WHERE supplier_id = ?', [row.id]);
    await execute('DELETE FROM suppliers WHERE id = ?', [row.id]);
    audit(req, 'supplier.delete', 'supplier', row.id);
    res.json({ ok: true });
  })
);

router.get(
  '/sales',
  asyncHandler(async (req, res) => {
    const manager = canManageBusiness(req.user);
    const rows = manager
      ? await query('SELECT * FROM sales ORDER BY `date` DESC, created_at DESC LIMIT 200')
      : await query(
          'SELECT * FROM sales WHERE user_id = ? ORDER BY `date` DESC, created_at DESC LIMIT 200',
          [req.user.id]
        );

    res.json({ sales: rows.map(serializeSale) });
  })
);

router.post(
  '/sales',
  asyncHandler(async (req, res) => {
    if (!canManageBusiness(req.user)) {
      throw new AppError(403, 'Only business accounts can record sales.');
    }
    const data = parseBody(saleSchema, req.body);
    const product = await queryOne('SELECT * FROM products WHERE name = ?', [data.product]);
    const amount = data.amount ?? (product ? Number(product.unit_price) * data.quantity : 0);
    if (amount <= 0 && !data.amount) {
      throw new AppError(422, 'Add the sale amount, or record the product in inventory first.');
    }

    const id = newId('sal');
    const timestamp = nowIso();
    const date = data.date || today();
    const userName = req.user.name || req.user.email || '';
    const movementId = newId('stk');

    const row = await withTransaction(async (connection) => {
      if (product) {
        const [lockedRows] = await connection.query(
          'SELECT * FROM products WHERE id = ? FOR UPDATE',
          [product.id]
        );
        const locked = lockedRows[0];
        const available = locked ? Number(locked.stock) : 0;
        if (!locked || available < data.quantity) {
          throw new AppError(
            422,
            `Only ${available} units of ${product.name} are in stock. Record Stock In before selling more.`
          );
        }

        const nextStock = available - data.quantity;
        await connection.query(
          'UPDATE products SET stock = ?, status = ?, updated_at = ? WHERE id = ?',
          [nextStock, stockStatus(nextStock, Number(locked.low_stock_alert ?? 8)), timestamp, locked.id]
        );

        await connection.query(
          `INSERT INTO stock_movements
             (id, product_id, product_name, type, quantity, unit_price, total, reason,
              supplier_id, supplier_name, expiry_date, note, user_id, user_name, \`date\`, created_at)
           VALUES (?, ?, ?, 'out', ?, ?, ?, 'sale', NULL, NULL, NULL, ?, ?, ?, ?, ?)`,
          [
            movementId,
            locked.id,
            locked.name,
            data.quantity,
            Math.round(amount / data.quantity),
            amount,
            data.customer ? `Sale to ${data.customer}` : 'Sale',
            req.user.id,
            userName,
            date,
            timestamp,
          ]
        );
      }

      await connection.query(
        `INSERT INTO sales (id, user_id, product, quantity, amount, \`date\`, customer, payment_method, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          id,
          req.user.id,
          data.product,
          data.quantity,
          amount,
          date,
          data.customer || null,
          data.paymentMethod,
          timestamp,
        ]
      );

      const [rows] = await connection.query('SELECT * FROM sales WHERE id = ?', [id]);
      return rows[0];
    });

    audit(req, 'sale.create', 'sale', id, {
      product: data.product,
      quantity: data.quantity,
      amount,
    });
    res.status(201).json({ sale: serializeSale(row) });
  })
);

const stockMovementSchema = z.object({
  product: z.string().trim().min(1, 'Choose a product.').max(120),
  type: z.enum(['in', 'out']),
  quantity: z.coerce.number().int().min(1, 'Quantity must be at least one.').max(1000000),
  unitPrice: z.coerce.number().int().min(0).max(1000000000).optional(),
  reason: z.string().trim().min(1).max(40).optional().or(z.literal('')),
  supplierId: z.string().trim().max(40).optional().or(z.literal('')),
  expiryDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().or(z.literal('')),
  note: z.string().trim().max(255).optional().or(z.literal('')),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

function serializeMovement(row) {
  return {
    id: row.id,
    productId: row.product_id,
    product: row.product_name,
    type: row.type,
    quantity: Number(row.quantity),
    unitPrice: Number(row.unit_price),
    total: Number(row.total),
    reason: row.reason || 'other',
    supplierId: row.supplier_id || null,
    supplierName: row.supplier_name || '',
    expiryDate: String(row.expiry_date || '').slice(0, 10),
    note: row.note || '',
    userId: row.user_id || null,
    userName: row.actor_name || row.user_name || '',
    date: String(row.date || '').slice(0, 10),
    createdAt: row.created_at,
  };
}

router.get(
  '/stock-movements',
  asyncHandler(async (req, res) => {
    const manager = canManageBusiness(req.user);
    const select = `SELECT m.*, COALESCE(m.user_name, u.name) AS actor_name
                    FROM stock_movements m LEFT JOIN users u ON u.id = m.user_id`;
    const rows = manager
      ? await query(`${select} ORDER BY m.created_at DESC LIMIT 200`)
      : await query(`${select} WHERE m.user_id = ? ORDER BY m.created_at DESC LIMIT 200`, [
          req.user.id,
        ]);

    res.json({ movements: rows.map(serializeMovement) });
  })
);

router.post(
  '/stock-movements',
  asyncHandler(async (req, res) => {
    if (!canManageBusiness(req.user)) {
      throw new AppError(403, 'Only business accounts can record stock movements.');
    }
    const data = parseBody(stockMovementSchema, req.body);
    const reason = data.reason || 'other';
    const allowedReasons = data.type === 'in' ? STOCK_IN_REASONS : STOCK_OUT_REASONS;
    if (!allowedReasons.includes(reason)) {
      throw new AppError(422, 'Choose a valid reason for this stock movement.');
    }
    if (data.supplierId && data.type !== 'in') {
      throw new AppError(422, 'A supplier can only be recorded for Stock In.');
    }
    const supplier = data.supplierId ? await findSupplier(data.supplierId) : null;
    if (data.supplierId && !supplier) throw new AppError(404, 'Supplier not found.');

    const product = await queryOne('SELECT * FROM products WHERE name = ? OR id = ?', [
      data.product,
      data.product,
    ]);
    if (!product) throw new AppError(404, 'Product not found.');

    const unitPrice = data.unitPrice ?? Number(product.unit_price);
    const total = data.quantity * unitPrice;
    const id = newId('stk');
    const timestamp = nowIso();
    const date = data.date || today();
    const userName = req.user.name || req.user.email || '';

    const row = await withTransaction(async (connection) => {
      // Lock the product row so two simultaneous stock-outs cannot both pass the
      // availability check and drive the shelf count below zero.
      const [lockedRows] = await connection.query(
        'SELECT * FROM products WHERE id = ? FOR UPDATE',
        [product.id]
      );
      const locked = lockedRows[0];
      if (!locked) throw new AppError(404, 'Product not found.');

      const currentStock = Number(locked.stock);
      const nextStock =
        data.type === 'in' ? currentStock + data.quantity : currentStock - data.quantity;
      if (nextStock < 0) {
        throw new AppError(422, `Only ${currentStock} units of ${locked.name} are in stock.`);
      }

      const existingExpiry = String(locked.expiry_date || '').slice(0, 10);
      const nextExpiry =
        data.type === 'in' && data.expiryDate
          ? !existingExpiry || data.expiryDate < existingExpiry
            ? data.expiryDate
            : existingExpiry
          : existingExpiry;

      await connection.query(
        `UPDATE products
         SET stock = ?, status = ?, supplier_id = ?, expiry_date = ?, updated_at = ?
         WHERE id = ?`,
        [
          nextStock,
          stockStatus(nextStock, Number(locked.low_stock_alert ?? 8)),
          data.supplierId || locked.supplier_id || null,
          nextExpiry || null,
          timestamp,
          locked.id,
        ]
      );

      await connection.query(
        `INSERT INTO stock_movements
           (id, product_id, product_name, type, quantity, unit_price, total, reason,
            supplier_id, supplier_name, expiry_date, note, user_id, user_name, \`date\`, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          id,
          locked.id,
          locked.name,
          data.type,
          data.quantity,
          unitPrice,
          total,
          reason,
          data.supplierId || null,
          supplier?.name || null,
          data.type === 'in' ? data.expiryDate || null : null,
          data.note || null,
          req.user.id,
          userName,
          date,
          timestamp,
        ]
      );

      const [rows] = await connection.query(
        'SELECT m.*, COALESCE(m.user_name, u.name) AS actor_name FROM stock_movements m LEFT JOIN users u ON u.id = m.user_id WHERE m.id = ?',
        [id]
      );
      return rows[0];
    });

    const updatedProduct = await findProduct(product.id);
    audit(req, `stock.${data.type}`, 'product', product.id, {
      product: product.name,
      quantity: data.quantity,
      total,
      reason,
      supplier: supplier?.name || null,
    });
    res.status(201).json({
      movement: serializeMovement(row),
      product: serializeProduct(updatedProduct),
    });
  })
);

router.get(
  '/loans',
  asyncHandler(async (req, res) => {
    const manager = req.user.role === 'admin';
    const rows = manager
      ? await query('SELECT * FROM loan_records ORDER BY created_at DESC LIMIT 200')
      : await query(
          'SELECT * FROM loan_records WHERE user_id = ? ORDER BY created_at DESC LIMIT 200',
          [req.user.id]
        );

    res.json({ loans: rows.map(serializeLoan) });
  })
);

router.post(
  '/loans',
  asyncHandler(async (req, res) => {
    if (!canManageBusiness(req.user)) {
      throw new AppError(403, 'Only business accounts can request financing.');
    }
    const data = parseBody(loanSchema, req.body);
    const id = newId('loan');

    await execute(
      `INSERT INTO loan_records (id, user_id, type, counterparty, amount, \`date\`, interest_rate, due_date, notes, status, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'submitted', ?)`,
      [
        id,
        req.user.id,
        data.type,
        data.counterparty,
        data.amount,
        data.date || today(),
        data.interestRate,
        data.dueDate || null,
        data.notes || null,
        nowIso(),
      ]
    );

    const row = await queryOne('SELECT * FROM loan_records WHERE id = ?', [id]);
    audit(req, 'loan.create', 'loan', id, { amount: data.amount });
    res.status(201).json({ loan: serializeLoan(row) });
  })
);

router.get(
  '/summary',
  asyncHandler(async (req, res) => {
    const manager = canManageBusiness(req.user);
    const sales = manager
      ? await query('SELECT * FROM sales')
      : await query('SELECT * FROM sales WHERE user_id = ?', [req.user.id]);
    const products = await query('SELECT * FROM products');
    const movements = await query('SELECT type, quantity FROM stock_movements');
    const [supplierCountRow] = await query('SELECT COUNT(*) AS total FROM suppliers');

    const revenue = sales.reduce((sum, row) => sum + Number(row.amount), 0);
    const inventoryValue = products.reduce(
      (sum, row) => sum + Number(row.stock) * Number(row.unit_price),
      0
    );

    const byProduct = new Map();
    for (const sale of sales) {
      const current = byProduct.get(sale.product) || { product: sale.product, revenue: 0, units: 0 };
      current.revenue += Number(sale.amount);
      current.units += Number(sale.quantity);
      byProduct.set(sale.product, current);
    }
    const topProducts = [...byProduct.values()]
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    const todayKey = today();
    const soonKey = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const trackedExpiry = products.filter((row) => row.expiry_date && Number(row.stock) > 0);
    const expired = trackedExpiry.filter(
      (row) => String(row.expiry_date).slice(0, 10) < todayKey
    ).length;
    const expiringSoon = trackedExpiry.filter((row) => {
      const expiry = String(row.expiry_date).slice(0, 10);
      return expiry >= todayKey && expiry <= soonKey;
    }).length;

    res.json({
      summary: {
        revenue,
        salesCount: sales.length,
        unitsSold: sales.reduce((sum, row) => sum + Number(row.quantity), 0),
        lowStock: products.filter((row) => row.status === 'low-stock').length,
        outOfStock: products.filter((row) => row.status === 'out-of-stock').length,
        products: products.length,
        availableStock: products.reduce((sum, row) => sum + Number(row.stock), 0),
        totalStockIn: movements
          .filter((row) => row.type === 'in')
          .reduce((sum, row) => sum + Number(row.quantity), 0),
        totalStockOut: movements
          .filter((row) => row.type === 'out')
          .reduce((sum, row) => sum + Number(row.quantity), 0),
        suppliers: Number(supplierCountRow?.total ?? 0),
        expiringSoon,
        expired,
        inventoryValue,
        topProducts,
      },
    });
  })
);

export default router;
