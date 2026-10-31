import { Router } from 'express';
import { randomUUID } from 'node:crypto';
import { db } from '../db.js';
import { mapLoan, mapProduct, mapSale } from '../mappers.js';

const str = (value: unknown): string => (typeof value === 'string' ? value.trim() : '');
const num = (value: unknown, fallback = 0): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};
const int = (value: unknown, fallback = 0): number => Math.trunc(num(value, fallback));
const today = (): string => new Date().toISOString().slice(0, 10);

export const productsRouter = Router();

productsRouter.get('/', (_req, res) => {
  const rows = db.prepare('SELECT * FROM products ORDER BY name ASC').all() as any[];
  res.json(rows.map(mapProduct));
});

productsRouter.post('/', (req, res) => {
  const name = str(req.body?.name);
  const category = str(req.body?.category);

  if (!name || !category) {
    res.status(400).json({ error: 'Product name and category are required' });
    return;
  }

  const id = randomUUID();
  db.prepare(
    `INSERT INTO products (id, name, category, stock, unit_price, low_stock_alert, description)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  ).run(
    id,
    name,
    category,
    Math.max(0, int(req.body?.stock, 0)),
    Math.max(0, num(req.body?.unitPrice, 0)),
    Math.max(0, int(req.body?.lowStockAlert, 10)),
    str(req.body?.description) || null
  );

  const row = db.prepare('SELECT * FROM products WHERE id = ?').get(id) as any;
  res.status(201).json(mapProduct(row));
});

export const salesRouter = Router();

salesRouter.get('/', (_req, res) => {
  const rows = db.prepare('SELECT * FROM sales ORDER BY date DESC, rowid DESC').all() as any[];
  res.json(rows.map(mapSale));
});

salesRouter.post('/', (req, res) => {
  const productName = str(req.body?.product);
  const quantity = int(req.body?.quantity, 0);
  const product = db.prepare('SELECT * FROM products WHERE name = ?').get(productName) as any;

  if (!productName || quantity <= 0) {
    res.status(400).json({ error: 'Product and a positive quantity are required' });
    return;
  }

  const unitPrice = num(req.body?.unitPrice, product ? Number(product.unit_price) : 0);
  if (unitPrice < 0) {
    res.status(400).json({ error: 'Unit price cannot be negative' });
    return;
  }

  const id = randomUUID();
  const saleDate = str(req.body?.date) || today();
  const customer = str(req.body?.customer) || null;
  const paymentMethod = str(req.body?.paymentMethod) || 'cash';

  const insert = db.transaction(() => {
    db.prepare(
      `INSERT INTO sales (id, product_name, quantity, unit_price, customer, payment_method, date)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    ).run(id, productName, quantity, unitPrice, customer, paymentMethod, saleDate);

    if (product) {
      db.prepare('UPDATE products SET stock = MAX(stock - ?, 0) WHERE id = ?').run(quantity, product.id);
    }
  });
  insert();

  const row = db.prepare('SELECT * FROM sales WHERE id = ?').get(id) as any;
  res.status(201).json(mapSale(row));
});

export const loansRouter = Router();

loansRouter.get('/', (_req, res) => {
  const rows = db.prepare('SELECT * FROM loan_records ORDER BY date DESC, rowid DESC').all() as any[];
  res.json(rows.map(mapLoan));
});

loansRouter.post('/', (req, res) => {
  const counterparty = str(req.body?.counterparty);
  const amount = num(req.body?.amount, 0);
  const recordType = str(req.body?.type) === 'debt' ? 'debt' : 'loan';

  if (!counterparty || amount <= 0) {
    res.status(400).json({ error: 'Counterparty and a positive amount are required' });
    return;
  }

  const id = randomUUID();
  db.prepare(
    `INSERT INTO loan_records (id, record_type, counterparty, amount, date, interest_rate, due_date, notes)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    id,
    recordType,
    counterparty,
    amount,
    str(req.body?.date) || today(),
    num(req.body?.interestRate, 0),
    str(req.body?.dueDate) || null,
    str(req.body?.notes) || null
  );

  const row = db.prepare('SELECT * FROM loan_records WHERE id = ?').get(id) as any;
  res.status(201).json(mapLoan(row));
});
