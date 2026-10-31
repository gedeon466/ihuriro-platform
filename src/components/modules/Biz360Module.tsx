import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import {
  Briefcase, Building, Building2, Users, Package, Boxes, PackagePlus,
  PackageMinus, ShoppingCart, CreditCard, HandCoins, Receipt,
  Landmark, ShieldCheck, BarChart3, LayoutDashboard, Plus,
  Search, AlertTriangle, TrendingUp, DollarSign, Clock,
  CheckCircle, Loader2, FileText, Truck, History, CalendarClock,
  Pencil, Trash2,
} from 'lucide-react';
import { useApp } from '@/context/app-context';
import { Card, Badge, SectionHeader, SubModuleGrid, StatCard, EmptyState, Button, ProgressBar, Modal, FormField, Input, Select, Textarea } from '@/components/ui';
import { api } from '@/lib/api';
import { useApiList, useApiQuery } from '@/lib/hooks';
import type { BusinessProduct, LoanRecord, StockReason, Supplier } from '@/types';

const subModules = [
  { id: 'profile', label: 'Business Profile', icon: <Building className="w-5 h-5" />, description: 'Business information and settings' },
  { id: 'customers', label: 'Customers', icon: <Users className="w-5 h-5" />, description: 'Customer management and history' },
  { id: 'products', label: 'Products', icon: <Package className="w-5 h-5" />, description: 'Product catalog and pricing' },
  { id: 'inventory', label: 'Inventory', icon: <Boxes className="w-5 h-5" />, description: 'Stock levels and alerts' },
  { id: 'stock-in', label: 'Stock In', icon: <PackagePlus className="w-5 h-5" />, description: 'Record incoming stock' },
  { id: 'stock-out', label: 'Stock Out', icon: <PackageMinus className="w-5 h-5" />, description: 'Record outgoing stock' },
  { id: 'history', label: 'Stock History', icon: <History className="w-5 h-5" />, description: 'Every stock movement' },
  { id: 'suppliers', label: 'Suppliers', icon: <Truck className="w-5 h-5" />, description: 'Supplier records and deliveries' },
  { id: 'sales', label: 'Sales', icon: <ShoppingCart className="w-5 h-5" />, description: 'Sales records and transactions' },
  { id: 'payments', label: 'Payments', icon: <CreditCard className="w-5 h-5" />, description: 'Track payments received' },
  { id: 'loans', label: 'Loans', icon: <HandCoins className="w-5 h-5" />, description: 'Track business loans' },
  { id: 'debts', label: 'Debts', icon: <Receipt className="w-5 h-5" />, description: 'Track outstanding debts' },
  { id: 'taxes', label: 'Taxes', icon: <Landmark className="w-5 h-5" />, description: 'Tax declarations and records' },
  { id: 'banking', label: 'Banking', icon: <Building className="w-5 h-5" />, description: 'Bank accounts and transfers' },
  { id: 'insurance', label: 'Insurance', icon: <ShieldCheck className="w-5 h-5" />, description: 'Insurance policies and claims' },
  { id: 'reports', label: 'Reports', icon: <BarChart3 className="w-5 h-5" />, description: 'Business analytics and reports' },
  { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-5 h-5" />, description: 'Overview and key metrics' },
];

const stockInReasons: Array<{ value: StockReason; label: string }> = [
  { value: 'purchase', label: 'Purchase from supplier' },
  { value: 'supplier-delivery', label: 'Supplier delivery' },
  { value: 'return', label: 'Customer return' },
  { value: 'transfer-in', label: 'Transfer in' },
  { value: 'adjustment', label: 'Stock adjustment' },
  { value: 'other', label: 'Other' },
];

const stockOutReasons: Array<{ value: StockReason; label: string }> = [
  { value: 'sale', label: 'Sale to customer' },
  { value: 'damaged', label: 'Damaged product' },
  { value: 'expired', label: 'Expired product' },
  { value: 'transfer-out', label: 'Transfer out' },
  { value: 'loss', label: 'Loss or theft' },
  { value: 'other', label: 'Other' },
];

const stockReasonLabels: Record<StockReason, string> = {
  purchase: 'Purchase from supplier',
  'supplier-delivery': 'Supplier delivery',
  return: 'Customer return',
  'transfer-in': 'Transfer in',
  adjustment: 'Stock adjustment',
  sale: 'Sale',
  damaged: 'Damaged',
  expired: 'Expired',
  'transfer-out': 'Transfer out',
  loss: 'Loss or theft',
  other: 'Other',
};

const TODAY_KEY = new Date().toISOString().slice(0, 10);
const SOON_KEY = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

function expiryState(expiryDate?: string) {
  if (!expiryDate) return null;
  if (expiryDate < TODAY_KEY) return { label: 'Expired', variant: 'error' as const };
  if (expiryDate <= SOON_KEY) return { label: 'Expiring soon', variant: 'warning' as const };
  return { label: 'Fresh', variant: 'success' as const };
}

const productStatusConfig: Record<BusinessProduct['status'], { label: string; variant: 'success' | 'warning' | 'error' }> = {
  'in-stock': { label: 'In Stock', variant: 'success' },
  'low-stock': { label: 'Low Stock', variant: 'warning' },
  'out-of-stock': { label: 'Out of Stock', variant: 'error' },
};

export function Biz360Module() {
  const { currentSection, navigate, user } = useApp();
  const [showNewSale, setShowNewSale] = useState(false);
  const [showStockIn, setShowStockIn] = useState(false);
  const [showStockOut, setShowStockOut] = useState(false);
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [showAddRecord, setShowAddRecord] = useState(false);
  const [stockProductPreset, setStockProductPreset] = useState<string | undefined>(undefined);
  const [productQuery, setProductQuery] = useState('');
  const [supplierModal, setSupplierModal] = useState<{ open: boolean; supplier?: Supplier }>({ open: false });
  const [supplierToDelete, setSupplierToDelete] = useState<Supplier | null>(null);
  const [historyFilter, setHistoryFilter] = useState<'all' | 'in' | 'out'>('all');

  const { data: products, refresh: refreshProducts } = useApiList(() =>
    api.business.products().then((result) => result.products)
  );
  const { data: sales, refresh: refreshSales } = useApiList(() =>
    api.business.sales().then((result) => result.sales)
  );
  const { data: movements, refresh: refreshMovements } = useApiList(() =>
    api.business.stockMovements().then((result) => result.movements)
  );
  const { data: suppliers, refresh: refreshSuppliers } = useApiList(() =>
    api.business.suppliers().then((result) => result.suppliers)
  );
  const { data: loans, refresh: refreshLoans } = useApiList(() =>
    api.business.loans().then((result) => result.loans)
  );
  const { data: summary, refresh: refreshSummary } = useApiQuery(() =>
    api.business.summary().then((result) => result.summary)
  );

  const canManage = user?.role === 'business' || user?.role === 'admin';
  const openStockModal = (direction: 'in' | 'out', product?: string) => {
    setStockProductPreset(product);
    if (direction === 'in') setShowStockIn(true);
    else setShowStockOut(true);
  };
  const closeStockModal = (direction: 'in' | 'out') => {
    if (direction === 'in') setShowStockIn(false);
    else setShowStockOut(false);
    setStockProductPreset(undefined);
  };
  const refreshBusinessData = async () => {
    await Promise.all([refreshSales(), refreshProducts(), refreshSummary(), refreshMovements(), refreshSuppliers()]);
  };

  const totalSales = summary?.revenue ?? sales.reduce((a, s) => a + s.amount, 0);
  const lowStockCount = summary?.lowStock ?? products.filter(p => p.status === 'low-stock').length;
  const outOfStockCount = summary?.outOfStock ?? products.filter(p => p.status === 'out-of-stock').length;
  const inventoryValue = summary?.inventoryValue ?? products.reduce((a, p) => a + p.stock * p.unitPrice, 0);
  const unitsSold = summary?.unitsSold ?? sales.reduce((sum, sale) => sum + sale.quantity, 0);
  const normalizedProductQuery = productQuery.trim().toLowerCase();
  const visibleProducts = normalizedProductQuery
    ? products.filter((product) => product.name.toLowerCase().includes(normalizedProductQuery) || product.category.toLowerCase().includes(normalizedProductQuery))
    : products;
  const todayKey = new Date().toISOString().slice(0, 10);
  const todaySales = sales.filter((sale) => sale.date === todayKey).reduce((sum, sale) => sum + sale.amount, 0);
  const availableStock = summary?.availableStock ?? products.reduce((sum, product) => sum + product.stock, 0);
  const totalStockIn = summary?.totalStockIn ?? movements
    .filter((movement) => movement.type === 'in')
    .reduce((sum, movement) => sum + movement.quantity, 0);
  const expiringSoonCount = summary?.expiringSoon ?? 0;
  const expiredCount = summary?.expired ?? 0;
  const supplierCount = summary?.suppliers ?? suppliers.length;
  const expiringProducts = products
    .filter((product) => product.expiryDate)
    .sort((a, b) => String(a.expiryDate).localeCompare(String(b.expiryDate)))
    .slice(0, 6);
  const recentMovements = movements.slice(0, 8);

  const salesByDate = Object.entries(
    sales.reduce<Record<string, number>>((acc, sale) => {
      acc[sale.date] = (acc[sale.date] || 0) + sale.amount;
      return acc;
    }, {})
  )
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-7);

  if (!currentSection || currentSection === 'dashboard') {
    return (
      <>
      <div className="space-y-6 animate-fade-in">
        <SectionHeader
          title="Biz360 Rwanda"
          subtitle="Complete business management platform"
          icon={<Briefcase className="w-5 h-5" />}
          action={canManage ? <Button size="sm" icon={<Plus className="w-4 h-4" />} onClick={() => setShowNewSale(true)}>New Sale</Button> : undefined}
        />

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Total Products" value={summary?.products ?? products.length} icon={<Package className="w-5 h-5" />} color="primary" />
          <StatCard label="Available Stock" value={`${availableStock.toLocaleString()} units`} icon={<Boxes className="w-5 h-5" />} color="accent" />
          <StatCard label="Total Stock Received" value={`${totalStockIn.toLocaleString()} units`} icon={<PackagePlus className="w-5 h-5" />} color="success" />
          <StatCard label="Total Stock Sold" value={`${unitsSold.toLocaleString()} units`} icon={<PackageMinus className="w-5 h-5" />} color="warning" />
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Total Sales" value={`RWF ${totalSales.toLocaleString()}`} icon={<TrendingUp className="w-5 h-5" />} color="success" />
          <StatCard label="Inventory Value" value={`RWF ${inventoryValue.toLocaleString()}`} icon={<DollarSign className="w-5 h-5" />} color="primary" />
          <StatCard label="Low Stock Items" value={lowStockCount} icon={<AlertTriangle className="w-5 h-5" />} color="warning" />
          <StatCard label="Out of Stock" value={outOfStockCount} icon={<PackageMinus className="w-5 h-5" />} color="error" />
        </div>

        {currentSection === 'dashboard' && (
          <Card className="p-6">
            <h3 className="font-semibold text-neutral-800 mb-4">Sales Trend</h3>
            {salesByDate.length === 0 ? (
              <p className="text-sm text-neutral-500">No sales recorded yet.</p>
            ) : (
              <div className="flex items-end gap-3 h-40">
                {salesByDate.map(([date, amount]) => {
                  const maxSale = Math.max(...salesByDate.map(([, value]) => value));
                  const height = maxSale > 0 ? (amount / maxSale) * 100 : 0;
                  return (
                    <div key={date} className="flex-1 flex flex-col items-center gap-2">
                      <div className="w-full flex-1 flex items-end">
                        <div
                          className="w-full bg-gradient-to-t from-primary-500 to-accent-400 rounded-t-lg transition-all duration-500 hover:from-primary-600 hover:to-accent-500 group relative"
                          style={{ height: `${height}%` }}
                        >
                          <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs text-neutral-600 font-semibold opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                            {amount.toLocaleString()}
                          </span>
                        </div>
                      </div>
                      <span className="text-[10px] text-neutral-500">{date.slice(5)}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        )}

        {/* Low stock alert */}
        {lowStockCount > 0 && (
          <Card className="p-5 bg-warning-50 border-warning-200">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-warning-100 text-warning-600 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-warning-800">Low Stock Alert</h3>
                <p className="text-sm text-warning-700 mt-0.5">
                  {lowStockCount} products are running low and {outOfStockCount} are out of stock. Restock soon to avoid losing sales.
                </p>
                <Button size="sm" variant="outline" className="mt-3" onClick={() => navigate('biz360', 'inventory')}>View Inventory</Button>
              </div>
            </div>
          </Card>
        )}

        {/* Expiry + suppliers snapshot */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card className="p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <CalendarClock className="w-5 h-5 text-warning-600" />
                <h3 className="font-semibold text-neutral-800">Product expiry tracking</h3>
              </div>
              <Button size="sm" variant="ghost" onClick={() => navigate('biz360', 'inventory')}>Inventory</Button>
            </div>
            <p className="text-xs text-neutral-500">
              {expiringSoonCount} expiring within 30 days · {expiredCount} expired
            </p>
            <div className="mt-3 space-y-2">
              {expiringProducts.length === 0 && (
                <p className="text-sm text-neutral-400">No expiry dates recorded yet. Add one when receiving stock.</p>
              )}
              {expiringProducts.map((product) => {
                const state = expiryState(product.expiryDate);
                return (
                  <div key={product.id} className="flex items-center justify-between gap-3 text-sm">
                    <span className="min-w-0 truncate text-neutral-700">{product.name}</span>
                    <span className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-xs text-neutral-400">{product.expiryDate}</span>
                      {state && <Badge variant={state.variant} size="sm">{state.label}</Badge>}
                    </span>
                  </div>
                );
              })}
            </div>
          </Card>

          <Card className="p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Truck className="w-5 h-5 text-primary-600" />
                <h3 className="font-semibold text-neutral-800">Suppliers</h3>
              </div>
              <Button size="sm" variant="ghost" onClick={() => navigate('biz360', 'suppliers')}>Manage</Button>
            </div>
            <p className="text-xs text-neutral-500">{supplierCount} suppliers recorded</p>
            <div className="mt-3 space-y-2">
              {suppliers.length === 0 && (
                <p className="text-sm text-neutral-400">No suppliers yet. Add one to track where stock comes from.</p>
              )}
              {suppliers.slice(0, 4).map((supplier) => (
                <div key={supplier.id} className="flex items-center justify-between gap-3 text-sm">
                  <span className="min-w-0 truncate text-neutral-700">{supplier.name}</span>
                  <span className="text-xs text-neutral-400 flex-shrink-0">{supplier.phone || supplier.email || '—'}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Stock movement history */}
        <Card className="overflow-hidden">
          <div className="px-5 py-4 border-b border-neutral-100 flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-neutral-800">Stock movement history</h3>
              <p className="text-xs text-neutral-500 mt-0.5">Latest stock received and issued, with reason and the user who recorded it.</p>
            </div>
            <Button size="sm" variant="ghost" onClick={() => navigate('biz360', 'history')}>View all</Button>
          </div>
          {recentMovements.length === 0 ? (
            <p className="px-5 py-8 text-center text-sm text-neutral-500">No stock movements recorded yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-neutral-50 text-neutral-500 text-xs uppercase tracking-wider">
                  <tr>
                    <th className="text-left px-5 py-3 font-semibold">Product</th>
                    <th className="text-left px-5 py-3 font-semibold">Type</th>
                    <th className="text-left px-5 py-3 font-semibold">Qty</th>
                    <th className="text-left px-5 py-3 font-semibold">Reason</th>
                    <th className="text-left px-5 py-3 font-semibold">Recorded by</th>
                    <th className="text-left px-5 py-3 font-semibold">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {recentMovements.map((movement) => (
                    <tr key={movement.id} className="hover:bg-neutral-50">
                      <td className="px-5 py-3 font-medium text-neutral-800">{movement.product}</td>
                      <td className="px-5 py-3">
                        <Badge variant={movement.type === 'in' ? 'success' : 'warning'} size="sm">
                          {movement.type === 'in' ? 'Stock In' : 'Stock Out'}
                        </Badge>
                      </td>
                      <td className={`px-5 py-3 font-semibold ${movement.type === 'in' ? 'text-success-600' : 'text-warning-600'}`}>
                        {movement.type === 'in' ? '+' : '−'}{movement.quantity}
                      </td>
                      <td className="px-5 py-3 text-neutral-600">{stockReasonLabels[movement.reason] ?? movement.reason}</td>
                      <td className="px-5 py-3 text-neutral-500">{movement.userName || '—'}</td>
                      <td className="px-5 py-3 text-neutral-400">{movement.date}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        <SubModuleGrid items={subModules} onSelect={(id) => navigate('biz360', id)} columns={3} />
      </div>
      {canManage && (
        <>
          <BizModal type="new-sale" open={showNewSale} onClose={() => setShowNewSale(false)} onSaved={refreshBusinessData} />
          <BizModal type="add-product" open={showAddProduct} onClose={() => setShowAddProduct(false)} onSaved={refreshBusinessData} />
          <BizModal type="add-record" open={showAddRecord} onClose={() => setShowAddRecord(false)} onSaved={refreshLoans} />
        </>
      )}
    </>
  );
  }

  if (currentSection === 'inventory' || currentSection === 'products') {
    return (
      <>
      <div className="space-y-6 animate-fade-in">
        <SectionHeader
          title={currentSection === 'inventory' ? 'Inventory' : 'Products'}
          subtitle="Manage your product catalog and stock levels"
          icon={currentSection === 'inventory' ? <Boxes className="w-5 h-5" /> : <Package className="w-5 h-5" />}
          action={canManage ? (
            <div className="flex flex-wrap items-center gap-2">
              <Button size="sm" variant="outline" icon={<PackagePlus className="w-4 h-4" />} onClick={() => openStockModal('in')}>Stock In</Button>
              <Button size="sm" variant="outline" icon={<PackageMinus className="w-4 h-4" />} onClick={() => openStockModal('out')}>Stock Out</Button>
              <Button size="sm" icon={<Plus className="w-4 h-4" />} onClick={() => setShowAddProduct(true)}>Add Product</Button>
            </div>
          ) : undefined}
        />
        <div className="flex items-center gap-3">
          <div className="flex-1 relative">
            <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={productQuery}
              onChange={(event) => setProductQuery(event.target.value)}
              placeholder="Search products by name or category..."
              className="w-full pl-10 pr-4 py-2.5 border border-neutral-200 rounded-xl text-sm outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100"
            />
          </div>
          <span className="text-xs text-neutral-400 whitespace-nowrap">{visibleProducts.length} of {products.length}</span>
        </div>
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-neutral-50 text-neutral-500 text-xs uppercase tracking-wider">
                <tr>
                  <th className="text-left px-5 py-3 font-semibold">Product</th>
                  <th className="text-left px-5 py-3 font-semibold">Category</th>
                  <th className="text-left px-5 py-3 font-semibold">Stock</th>
                  <th className="text-left px-5 py-3 font-semibold">Unit Price</th>
                  <th className="text-left px-5 py-3 font-semibold">Supplier</th>
                  <th className="text-left px-5 py-3 font-semibold">Expiry</th>
                  <th className="text-left px-5 py-3 font-semibold">Status</th>
                  {canManage && <th className="text-right px-5 py-3 font-semibold">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {visibleProducts.length === 0 && (
                  <tr><td colSpan={canManage ? 8 : 7} className="px-5 py-8 text-center text-neutral-400">
                    {products.length === 0 ? 'No products recorded yet.' : 'No products match your search.'}
                  </td></tr>
                )}
                {visibleProducts.map((p) => (
                  <tr key={p.id} className="hover:bg-neutral-50">
                    <td className="px-5 py-3 font-medium text-neutral-800">{p.name}</td>
                    <td className="px-5 py-3 text-neutral-600">{p.category}</td>
                    <td className="px-5 py-3">
                      <span className={`font-semibold ${p.stock === 0 ? 'text-error-600' : p.stock < 10 ? 'text-warning-600' : 'text-neutral-700'}`}>
                        {p.stock} units
                      </span>
                    </td>
                    <td className="px-5 py-3 text-neutral-600">RWF {p.unitPrice.toLocaleString()}</td>
                    <td className="px-5 py-3 text-neutral-600">{p.supplierName || '—'}</td>
                    <td className="px-5 py-3">
                      {p.expiryDate ? (
                        <span className="flex items-center gap-2">
                          <span className="text-neutral-600">{p.expiryDate}</span>
                          {expiryState(p.expiryDate) && (
                            <Badge variant={expiryState(p.expiryDate)!.variant} size="sm">
                              {expiryState(p.expiryDate)!.label}
                            </Badge>
                          )}
                        </span>
                      ) : (
                        <span className="text-neutral-400">—</span>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      <Badge variant={productStatusConfig[p.status].variant}>{productStatusConfig[p.status].label}</Badge>
                    </td>
                    {canManage && (
                      <td className="px-5 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            icon={<PackagePlus className="w-4 h-4" />}
                            onClick={() => openStockModal('in', p.name)}
                          >
                            Stock In
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            icon={<PackageMinus className="w-4 h-4" />}
                            onClick={() => openStockModal('out', p.name)}
                          >
                            Stock Out
                          </Button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
      {canManage && (
        <>
          <BizModal type="stock-in" open={showStockIn} initialProduct={stockProductPreset} onClose={() => closeStockModal('in')} onSaved={refreshBusinessData} />
          <BizModal type="stock-out" open={showStockOut} initialProduct={stockProductPreset} onClose={() => closeStockModal('out')} onSaved={refreshBusinessData} />
          <BizModal type="add-product" open={showAddProduct} onClose={() => setShowAddProduct(false)} onSaved={refreshBusinessData} />
          <BizModal type="new-sale" open={showNewSale} onClose={() => setShowNewSale(false)} onSaved={refreshBusinessData} />
          <BizModal type="add-record" open={showAddRecord} onClose={() => setShowAddRecord(false)} onSaved={refreshLoans} />
        </>
      )}
    </>
  );
  }

  if (currentSection === 'sales') {
    return (
      <>
      <div className="space-y-6 animate-fade-in">
        <SectionHeader title="Sales" subtitle="Recent sales transactions" icon={<ShoppingCart className="w-5 h-5" />}
          action={canManage ? <Button size="sm" icon={<Plus className="w-4 h-4" />} onClick={() => setShowNewSale(true)}>New Sale</Button> : undefined} />
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          <StatCard label="Today's Sales" value={`RWF ${todaySales.toLocaleString()}`} icon={<TrendingUp className="w-5 h-5" />} color="success" />
          <StatCard label="Transactions" value={sales.length} icon={<ShoppingCart className="w-5 h-5" />} color="primary" />
          <StatCard label="Avg Sale" value={`RWF ${Math.round(totalSales / (sales.length || 1)).toLocaleString()}`} icon={<DollarSign className="w-5 h-5" />} color="accent" />
        </div>
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-neutral-50 text-neutral-500 text-xs uppercase tracking-wider">
                <tr>
                  <th className="text-left px-5 py-3 font-semibold">Product</th>
                  <th className="text-left px-5 py-3 font-semibold">Qty</th>
                  <th className="text-left px-5 py-3 font-semibold">Amount</th>
                  <th className="text-left px-5 py-3 font-semibold">Customer</th>
                  <th className="text-left px-5 py-3 font-semibold">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {sales.length === 0 && (
                  <tr><td colSpan={5} className="px-5 py-8 text-center text-neutral-400">No sales recorded yet.</td></tr>
                )}
                {sales.map((s) => (
                  <tr key={s.id} className="hover:bg-neutral-50">
                    <td className="px-5 py-3 font-medium text-neutral-800">{s.product}</td>
                    <td className="px-5 py-3 text-neutral-600">{s.quantity}</td>
                    <td className="px-5 py-3 font-semibold text-success-600">RWF {s.amount.toLocaleString()}</td>
                    <td className="px-5 py-3 text-neutral-600">{s.customer}</td>
                    <td className="px-5 py-3 text-neutral-400">{s.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
      {canManage && (
        <>
          <BizModal type="new-sale" open={showNewSale} onClose={() => setShowNewSale(false)} onSaved={refreshBusinessData} />
          <BizModal type="add-product" open={showAddProduct} onClose={() => setShowAddProduct(false)} onSaved={refreshBusinessData} />
          <BizModal type="add-record" open={showAddRecord} onClose={() => setShowAddRecord(false)} onSaved={refreshLoans} />
        </>
      )}
    </>
  );
  }

  if (currentSection === 'reports') {
    return (
      <div className="space-y-6 animate-fade-in">
        <SectionHeader title="Reports" subtitle="Business analytics and performance" icon={<BarChart3 className="w-5 h-5" />} />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Total Revenue" value={`RWF ${totalSales.toLocaleString()}`} icon={<TrendingUp className="w-5 h-5" />} color="success" />
          <StatCard label="Units Sold" value={unitsSold} icon={<ShoppingCart className="w-5 h-5" />} color="accent" />
          <StatCard label="Transactions" value={sales.length} icon={<FileText className="w-5 h-5" />} color="primary" />
          <StatCard label="Inventory Value" value={`RWF ${inventoryValue.toLocaleString()}`} icon={<Boxes className="w-5 h-5" />} color="primary" />
        </div>
        <Card className="p-6">
          <h3 className="font-semibold text-neutral-800 mb-4">Product Category Performance</h3>
          <div className="space-y-4">
            {[...new Set(products.map((product) => product.category))].map((cat) => {
              const catProducts = products.filter(p => p.category === cat);
              const catValue = catProducts.reduce((a, p) => a + p.stock * p.unitPrice, 0);
              const totalValue = products.reduce((a, p) => a + p.stock * p.unitPrice, 0);
              const pct = totalValue > 0 ? (catValue / totalValue) * 100 : 0;
              return (
                <div key={cat}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium text-neutral-700">{cat}</span>
                    <span className="text-neutral-500">RWF {catValue.toLocaleString()}</span>
                  </div>
                  <ProgressBar value={pct} color="accent" showLabel />
                </div>
              );
            })}
            {products.length === 0 && <p className="text-sm text-neutral-500">No inventory data available yet.</p>}
          </div>
        </Card>
      </div>
    );
  }

  if (currentSection === 'loans' || currentSection === 'debts') {
    const recordType = currentSection === 'loans' ? 'loan' : 'debt';
    const records = loans.filter((record) => record.type === recordType);
    const totalAmount = records.reduce((sum, record) => sum + record.amount, 0);
    return (
      <>
      <div className="space-y-6 animate-fade-in">
        <SectionHeader
          title={currentSection === 'loans' ? 'Loans' : 'Debts'}
          subtitle={currentSection === 'loans' ? 'Track money you have borrowed' : 'Track money owed to you'}
          icon={currentSection === 'loans' ? <HandCoins className="w-5 h-5" /> : <Receipt className="w-5 h-5" />}
          action={canManage ? <Button size="sm" icon={<Plus className="w-4 h-4" />} onClick={() => setShowAddRecord(true)}>Add Record</Button> : undefined}
        />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard label="Total Amount" value={`RWF ${totalAmount.toLocaleString()}`} icon={<DollarSign className="w-5 h-5" />} color={currentSection === 'loans' ? 'error' : 'warning'} />
          <StatCard label="Records" value={records.length} icon={<FileText className="w-5 h-5" />} color="primary" />
          <StatCard label="With Due Date" value={records.filter((record) => record.dueDate).length} icon={<Clock className="w-5 h-5" />} color="warning" />
        </div>
        {records.length === 0 ? (
          <EmptyState
            icon={currentSection === 'loans' ? <HandCoins className="w-8 h-8" /> : <Receipt className="w-8 h-8" />}
            title="No active records"
            description="Track your loans and debts here. Add a new record to get started."
            action={canManage ? <Button size="sm" icon={<Plus className="w-4 h-4" />} onClick={() => setShowAddRecord(true)}>Add Record</Button> : undefined}
          />
        ) : (
          <div className="space-y-3">
            {records.map((record) => (
              <Card key={record.id} className="p-5">
                <div className="flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-neutral-800 text-sm">{record.counterparty}</h3>
                      <Badge variant={record.type === 'loan' ? 'error' : 'warning'}>
                        {record.type === 'loan' ? 'Loan' : 'Debt'}
                      </Badge>
                    </div>
                    <p className="text-xs text-neutral-500 mt-1">
                      {record.date}{record.dueDate ? ` • Due ${record.dueDate}` : ''}{record.interestRate ? ` • ${record.interestRate}% interest` : ''}
                    </p>
                    {record.notes && <p className="text-xs text-neutral-400 mt-1">{record.notes}</p>}
                  </div>
                  <span className="font-semibold text-neutral-800 whitespace-nowrap">RWF {record.amount.toLocaleString()}</span>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
      {canManage && (
        <>
          <BizModal type="add-record" open={showAddRecord} onClose={() => setShowAddRecord(false)} onSaved={refreshLoans} />
          <BizModal type="new-sale" open={showNewSale} onClose={() => setShowNewSale(false)} onSaved={refreshBusinessData} />
          <BizModal type="add-product" open={showAddProduct} onClose={() => setShowAddProduct(false)} onSaved={refreshBusinessData} />
        </>
      )}
    </>
  );
  }

  if (currentSection === 'profile') {
    return (
      <div className="space-y-6 animate-fade-in">
        <SectionHeader title="Business Profile" subtitle="Your business information and settings" icon={<Building className="w-5 h-5" />} />
        <Card className="p-6">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-accent-400 to-accent-600 text-white flex items-center justify-center flex-shrink-0">
              <Building className="w-8 h-8" />
            </div>
            <div className="flex-1">
              <h2 className="font-heading font-bold text-xl text-neutral-800">{user?.name ?? 'Business account'}</h2>
              <p className="text-sm text-neutral-500 mt-1">Business workspace · Biz360 Rwanda</p>
              <div className="flex flex-wrap gap-2 mt-3">
                <Badge variant="success" size="sm">Active</Badge>
                <Badge variant="info" size="sm"><span className="capitalize">{user?.role ?? 'business'}</span></Badge>
              </div>
            </div>
            <Button size="sm" variant="outline" onClick={() => navigate('profile')}>Edit Profile</Button>
          </div>
        </Card>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Card className="p-5">
            <h3 className="font-semibold text-neutral-800 text-sm mb-3">Account Information</h3>
            <div className="space-y-2 text-sm text-neutral-600">
              <p>Owner: {user?.name ?? '—'}</p>
              <p>Phone: {user?.phone || 'Not added'}</p>
              <p>Email: {user?.email ?? '—'}</p>
            </div>
          </Card>
          <Card className="p-5">
            <h3 className="font-semibold text-neutral-800 text-sm mb-3">Business Stats</h3>
            <div className="space-y-2 text-sm text-neutral-600">
              <p>Total Products: {products.length}</p>
              <p>Inventory Value: RWF {inventoryValue.toLocaleString()}</p>
              <p>Total Sales: RWF {totalSales.toLocaleString()}</p>
              <p>Low Stock Items: {lowStockCount}</p>
            </div>
          </Card>
        </div>
        <Card className="p-5 bg-warning-50 border-warning-200">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-warning-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-warning-800 text-sm">Business registration pending integration</h3>
              <p className="text-xs text-warning-700 mt-1">
                TIN and RDB registration details are not stored yet. Official registration and tax filing must go through the authorised RRA/RDB services. Until credentials and permissions are provided, IHURIRO will not display verified registration or tax data.
              </p>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  if (currentSection === 'customers') {
    const customerMap = new Map<string, { name: string; orders: number; total: number; last: string }>();
    for (const sale of sales) {
      const name = sale.customer.trim() || 'Walk-in Customer';
      const current = customerMap.get(name) ?? { name, orders: 0, total: 0, last: sale.date };
      current.orders += 1;
      current.total += sale.amount;
      if (sale.date > current.last) current.last = sale.date;
      customerMap.set(name, current);
    }
    const customers = [...customerMap.values()].sort((a, b) => b.total - a.total);
    return (
      <div className="space-y-6 animate-fade-in">
        <SectionHeader title="Customers" subtitle="Customers derived from your recorded sales" icon={<Users className="w-5 h-5" />} />
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-neutral-50 text-neutral-500 text-xs uppercase tracking-wider">
                <tr>
                  <th className="text-left px-5 py-3 font-semibold">Name</th>
                  <th className="text-left px-5 py-3 font-semibold">Orders</th>
                  <th className="text-left px-5 py-3 font-semibold">Total Spent</th>
                  <th className="text-left px-5 py-3 font-semibold">Last Purchase</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {customers.length === 0 && (
                  <tr><td colSpan={4} className="px-5 py-8 text-center text-neutral-400">No customers yet. Record a sale to build your customer list.</td></tr>
                )}
                {customers.map((c) => (
                  <tr key={c.name} className="hover:bg-neutral-50">
                    <td className="px-5 py-3 font-medium text-neutral-800">{c.name}</td>
                    <td className="px-5 py-3 text-neutral-600">{c.orders}</td>
                    <td className="px-5 py-3 font-semibold text-success-600">RWF {c.total.toLocaleString()}</td>
                    <td className="px-5 py-3 text-neutral-400">{c.last}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    );
  }

  if (currentSection === 'payments') {
    const methodTotals = sales.reduce<Record<string, number>>((acc, sale) => {
      const method = sale.paymentMethod || 'cash';
      acc[method] = (acc[method] || 0) + sale.amount;
      return acc;
    }, {});
    const methodLabel = (method: string) => method === 'mobile-money' ? 'Mobile Money' : method.charAt(0).toUpperCase() + method.slice(1);
    return (
      <div className="space-y-6 animate-fade-in">
        <SectionHeader title="Payments" subtitle="Payments recorded through your sales" icon={<CreditCard className="w-5 h-5" />} />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Total Received" value={`RWF ${totalSales.toLocaleString()}`} icon={<CreditCard className="w-5 h-5" />} color="success" />
          <StatCard label="Mobile Money" value={`RWF ${(methodTotals['mobile-money'] || 0).toLocaleString()}`} icon={<CreditCard className="w-5 h-5" />} color="primary" />
          <StatCard label="Cash" value={`RWF ${(methodTotals.cash || 0).toLocaleString()}`} icon={<DollarSign className="w-5 h-5" />} color="accent" />
          <StatCard label="Credit" value={`RWF ${(methodTotals.credit || 0).toLocaleString()}`} icon={<Clock className="w-5 h-5" />} color="warning" />
        </div>
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-neutral-50 text-neutral-500 text-xs uppercase tracking-wider">
                <tr>
                  <th className="text-left px-5 py-3 font-semibold">Customer</th>
                  <th className="text-left px-5 py-3 font-semibold">Product</th>
                  <th className="text-left px-5 py-3 font-semibold">Amount</th>
                  <th className="text-left px-5 py-3 font-semibold">Method</th>
                  <th className="text-left px-5 py-3 font-semibold">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {sales.length === 0 && (
                  <tr><td colSpan={5} className="px-5 py-8 text-center text-neutral-400">No payments recorded yet.</td></tr>
                )}
                {sales.map((s) => (
                  <tr key={s.id} className="hover:bg-neutral-50">
                    <td className="px-5 py-3 font-medium text-neutral-800">{s.customer || 'Walk-in Customer'}</td>
                    <td className="px-5 py-3 text-neutral-600">{s.product}</td>
                    <td className="px-5 py-3 font-semibold text-success-600">RWF {s.amount.toLocaleString()}</td>
                    <td className="px-5 py-3 text-neutral-600">{methodLabel(s.paymentMethod || 'cash')}</td>
                    <td className="px-5 py-3 text-neutral-400">{s.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    );
  }

  if (currentSection === 'taxes') {
    return (
      <div className="space-y-6 animate-fade-in">
        <SectionHeader title="Taxes" subtitle="Tax declarations and records" icon={<Landmark className="w-5 h-5" />} />
        <Card className="p-5 bg-warning-50 border-warning-200">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-warning-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-warning-800">RRA integration pending</h3>
              <p className="text-sm text-warning-700 mt-1">
                IHURIRO has not been connected to Rwanda Revenue Authority systems. No tax liability, filing, or payment is shown here because these must come from an authorised RRA service.
              </p>
              <p className="text-xs text-warning-700 mt-2">
                Actual tax filing and official registration must use authorised services where available. Once API credentials and permissions are approved, declarations and deadlines will appear here.
              </p>
            </div>
          </div>
        </Card>
        <Card className="p-5">
          <h3 className="font-semibold text-neutral-800 mb-3">What is available today</h3>
          <div className="space-y-2 text-sm text-neutral-600">
            <p>Recorded sales for your own reporting: <span className="font-semibold">RWF {totalSales.toLocaleString()}</span></p>
            <p>Transactions recorded: <span className="font-semibold">{sales.length}</span></p>
            <p className="text-xs text-neutral-400">These figures are internal records only and are not a tax filing or a verified taxable-revenue statement.</p>
          </div>
        </Card>
      </div>
    );
  }

  if (currentSection === 'banking') {
    return (
      <div className="space-y-6 animate-fade-in">
        <SectionHeader title="Banking & Payments" subtitle="Bank accounts and transfers" icon={<Building2 className="w-5 h-5" />} />
        <Card className="p-5 bg-warning-50 border-warning-200">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-warning-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-warning-800">Bank integration pending</h3>
              <p className="text-sm text-warning-700 mt-1">
                No bank or mobile-money account is linked. Balances and transfers can only be shown after an approved connection to a bank or payment provider is configured on the server.
              </p>
              <p className="text-xs text-warning-700 mt-2">
                Until then, IHURIRO will not display balances it cannot verify.
              </p>
            </div>
          </div>
        </Card>
        <Card className="p-5">
          <h3 className="font-semibold text-neutral-800 mb-3">Sales by payment method</h3>
          <div className="space-y-2 text-sm text-neutral-600">
            {['cash', 'mobile-money', 'card', 'credit'].map((method) => {
              const total = sales.filter((sale) => (sale.paymentMethod || 'cash') === method).reduce((sum, sale) => sum + sale.amount, 0);
              return (
                <div key={method} className="flex items-center justify-between py-2 border-b border-neutral-100 last:border-0">
                  <span className="capitalize">{method === 'mobile-money' ? 'Mobile Money' : method}</span>
                  <span className="font-semibold text-neutral-700">RWF {total.toLocaleString()}</span>
                </div>
              );
            })}
          </div>
        </Card>
      </div>
    );
  }

  if (currentSection === 'insurance') {
    return (
      <div className="space-y-6 animate-fade-in">
        <SectionHeader title="Insurance" subtitle="Business insurance policies and claims" icon={<ShieldCheck className="w-5 h-5" />} />
        <Card className="p-5 bg-warning-50 border-warning-200">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-warning-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-warning-800">Insurance integration pending</h3>
              <p className="text-sm text-warning-700 mt-1">
                No insurer connection is configured, so policies, premiums and claim status cannot be retrieved or verified here.
              </p>
              <p className="text-xs text-warning-700 mt-2">
                Policy documents and claim applications must continue through your insurer's own authorised channels.
              </p>
            </div>
          </div>
        </Card>
        <Card className="p-6">
          <h3 className="font-semibold text-neutral-800 mb-3">What you can do today</h3>
          <ul className="space-y-2 text-sm text-neutral-600 list-disc pl-5">
            <li>Keep policy numbers, cover limits and renewal dates in your own records.</li>
            <li>Contact your insurer directly to file or follow up on a claim.</li>
            <li>Use the Reports section for the sales and inventory data IHURIRO does hold.</li>
          </ul>
        </Card>
      </div>
    );
  }

  if (currentSection === 'stock-in' || currentSection === 'stock-out') {
    const isStockIn = currentSection === 'stock-in';
    const records = movements.filter((movement) => movement.type === (isStockIn ? 'in' : 'out'));
    const recordTotal = records.reduce((sum, movement) => sum + movement.total, 0);
    const unitsMoved = records.reduce((sum, movement) => sum + movement.quantity, 0);

    return (
      <div className="space-y-6 animate-fade-in">
        <SectionHeader
          title={isStockIn ? 'Stock In' : 'Stock Out'}
          subtitle={isStockIn ? 'Goods entering the business' : 'Goods leaving the business'}
          icon={isStockIn ? <PackagePlus className="w-5 h-5" /> : <PackageMinus className="w-5 h-5" />}
          action={
            canManage ? (
              <Button
                size="sm"
                icon={<Plus className="w-4 h-4" />}
                onClick={() => openStockModal(isStockIn ? 'in' : 'out')}
              >
                {isStockIn ? 'Record Stock In' : 'Record Stock Out'}
              </Button>
            ) : undefined
          }
        />

        <Card className={`p-5 ${isStockIn ? 'bg-success-50 border-success-200' : 'bg-warning-50 border-warning-200'}`}>
          <div className="flex items-start gap-3">
            {isStockIn ? (
              <PackagePlus className="w-5 h-5 text-success-600 flex-shrink-0 mt-0.5" />
            ) : (
              <PackageMinus className="w-5 h-5 text-warning-600 flex-shrink-0 mt-0.5" />
            )}
            <div>
              <h3 className={`font-semibold ${isStockIn ? 'text-success-800' : 'text-warning-800'}`}>
                {isStockIn ? 'What counts as Stock In' : 'What counts as Stock Out'}
              </h3>
              <p className={`text-sm mt-0.5 ${isStockIn ? 'text-success-700' : 'text-warning-700'}`}>
                {isStockIn
                  ? 'Buying new products, receiving supplier goods, recording delivered quantities and updating inventory.'
                  : 'Selling products, damaged goods, expired products and transfers to another shop. Stock Out can never exceed the available stock.'}
              </p>
            </div>
          </div>
        </Card>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard
            label={isStockIn ? 'Purchase value' : 'Stock out value'}
            value={`RWF ${recordTotal.toLocaleString()}`}
            icon={<DollarSign className="w-5 h-5" />}
            color={isStockIn ? 'success' : 'warning'}
          />
          <StatCard label="Records" value={records.length} icon={<Clock className="w-5 h-5" />} color="primary" />
          <StatCard label="Units moved" value={unitsMoved} icon={<Boxes className="w-5 h-5" />} color="accent" />
        </div>

        <Card className="overflow-hidden">
          <div className="px-5 py-4 border-b border-neutral-100">
            <h3 className="font-semibold text-neutral-800">{isStockIn ? 'Stock in records' : 'Stock out records'}</h3>
            <p className="text-xs text-neutral-500 mt-0.5">
              Every record stores the product, quantity, reason, date, total and the user who recorded it.
            </p>
          </div>
          {records.length === 0 ? (
            <p className="px-5 py-8 text-center text-sm text-neutral-500">
              {isStockIn ? 'No stock received yet.' : 'No stock issued yet.'}
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-neutral-50 text-neutral-500 text-xs uppercase tracking-wider">
                  <tr>
                    <th className="text-left px-5 py-3 font-semibold">Product</th>
                    <th className="text-left px-5 py-3 font-semibold">Qty</th>
                    <th className="text-left px-5 py-3 font-semibold">Reason</th>
                    {isStockIn && <th className="text-left px-5 py-3 font-semibold">Supplier</th>}
                    {isStockIn && <th className="text-left px-5 py-3 font-semibold">Expiry</th>}
                    <th className="text-left px-5 py-3 font-semibold">Unit price</th>
                    <th className="text-left px-5 py-3 font-semibold">Total</th>
                    <th className="text-left px-5 py-3 font-semibold">Recorded by</th>
                    <th className="text-left px-5 py-3 font-semibold">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {records.map((movement) => (
                    <tr key={movement.id} className="hover:bg-neutral-50">
                      <td className="px-5 py-3 font-medium text-neutral-800">{movement.product}</td>
                      <td className="px-5 py-3 text-neutral-600">{movement.quantity} units</td>
                      <td className="px-5 py-3">
                        <Badge variant={movement.reason === 'damaged' || movement.reason === 'expired' || movement.reason === 'loss' ? 'error' : 'info'} size="sm">
                          {stockReasonLabels[movement.reason] ?? movement.reason}
                        </Badge>
                      </td>
                      {isStockIn && <td className="px-5 py-3 text-neutral-600">{movement.supplierName || '—'}</td>}
                      {isStockIn && <td className="px-5 py-3 text-neutral-600">{movement.expiryDate || '—'}</td>}
                      <td className="px-5 py-3 text-neutral-600">RWF {movement.unitPrice.toLocaleString()}</td>
                      <td className="px-5 py-3 font-semibold text-neutral-700">RWF {movement.total.toLocaleString()}</td>
                      <td className="px-5 py-3 text-neutral-500">{movement.userName || '—'}</td>
                      <td className="px-5 py-3 text-neutral-400">{movement.date}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-neutral-50">
                  <tr>
                    <td colSpan={isStockIn ? 6 : 4} className="px-5 py-3 text-right text-xs uppercase tracking-wider text-neutral-500 font-semibold">
                      Total
                    </td>
                    <td className="px-5 py-3 font-bold text-neutral-800">RWF {recordTotal.toLocaleString()}</td>
                    <td colSpan={2} />
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </Card>

        {isStockIn && (
          <Card className="overflow-hidden">
            <div className="px-5 py-4 border-b border-neutral-100">
              <h3 className="font-semibold text-neutral-800">Current stock</h3>
              <p className="text-xs text-neutral-500 mt-0.5">Live snapshot of the product catalog.</p>
            </div>
            {products.length === 0 ? (
              <p className="px-5 py-8 text-center text-sm text-neutral-500">No products recorded yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-neutral-50 text-neutral-500 text-xs uppercase tracking-wider">
                    <tr>
                      <th className="text-left px-5 py-3 font-semibold">Product</th>
                      <th className="text-left px-5 py-3 font-semibold">Category</th>
                      <th className="text-left px-5 py-3 font-semibold">Units on hand</th>
                      <th className="text-left px-5 py-3 font-semibold">Status</th>
                      <th className="text-left px-5 py-3 font-semibold">Stock value</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100">
                    {products.map((product) => {
                      const config = productStatusConfig[product.status];
                      return (
                        <tr key={product.id} className="hover:bg-neutral-50">
                          <td className="px-5 py-3 font-medium text-neutral-800">{product.name}</td>
                          <td className="px-5 py-3 text-neutral-600">{product.category}</td>
                          <td className="px-5 py-3 text-neutral-600">{product.stock} units</td>
                          <td className="px-5 py-3"><Badge variant={config.variant} size="sm">{config.label}</Badge></td>
                          <td className="px-5 py-3 font-semibold text-neutral-700">RWF {(product.stock * product.unitPrice).toLocaleString()}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        )}

        {canManage && isStockIn && (
          <BizModal type="stock-in" open={showStockIn} initialProduct={stockProductPreset} onClose={() => closeStockModal('in')} onSaved={refreshBusinessData} />
        )}
        {canManage && !isStockIn && (
          <BizModal type="stock-out" open={showStockOut} initialProduct={stockProductPreset} onClose={() => closeStockModal('out')} onSaved={refreshBusinessData} />
        )}
      </div>
    );
  }

  if (currentSection === 'history') {
    const filtered = movements.filter(
      (movement) => historyFilter === 'all' || movement.type === historyFilter
    );
    const totalIn = movements.filter((m) => m.type === 'in').reduce((sum, m) => sum + m.quantity, 0);
    const totalOut = movements.filter((m) => m.type === 'out').reduce((sum, m) => sum + m.quantity, 0);

    return (
      <div className="space-y-6 animate-fade-in">
        <SectionHeader
          title="Stock Movement History"
          subtitle="Every Stock In and Stock Out transaction, with reason and the user who recorded it"
          icon={<History className="w-5 h-5" />}
          action={
            canManage ? (
              <div className="flex flex-wrap items-center gap-2">
                <Button size="sm" variant="outline" icon={<PackagePlus className="w-4 h-4" />} onClick={() => openStockModal('in')}>Stock In</Button>
                <Button size="sm" variant="outline" icon={<PackageMinus className="w-4 h-4" />} onClick={() => openStockModal('out')}>Stock Out</Button>
              </div>
            ) : undefined
          }
        />

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard label="Stock received" value={`${totalIn.toLocaleString()} units`} icon={<PackagePlus className="w-5 h-5" />} color="success" />
          <StatCard label="Stock issued" value={`${totalOut.toLocaleString()} units`} icon={<PackageMinus className="w-5 h-5" />} color="warning" />
          <StatCard label="Transactions" value={movements.length} icon={<FileText className="w-5 h-5" />} color="primary" />
        </div>

        <div className="flex items-center gap-2">
          {(['all', 'in', 'out'] as const).map((filter) => (
            <button
              key={filter}
              type="button"
              onClick={() => setHistoryFilter(filter)}
              className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                historyFilter === filter
                  ? 'bg-primary-600 text-white'
                  : 'bg-white text-neutral-600 border border-neutral-200 hover:bg-neutral-50'
              }`}
            >
              {filter === 'all' ? 'All movements' : filter === 'in' ? 'Stock In' : 'Stock Out'}
            </button>
          ))}
        </div>

        <Card className="overflow-hidden">
          {filtered.length === 0 ? (
            <p className="px-5 py-8 text-center text-sm text-neutral-500">No stock movements match this filter.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-neutral-50 text-neutral-500 text-xs uppercase tracking-wider">
                  <tr>
                    <th className="text-left px-5 py-3 font-semibold">Date</th>
                    <th className="text-left px-5 py-3 font-semibold">Product</th>
                    <th className="text-left px-5 py-3 font-semibold">Type</th>
                    <th className="text-left px-5 py-3 font-semibold">Qty</th>
                    <th className="text-left px-5 py-3 font-semibold">Reason</th>
                    <th className="text-left px-5 py-3 font-semibold">Supplier</th>
                    <th className="text-left px-5 py-3 font-semibold">Expiry</th>
                    <th className="text-left px-5 py-3 font-semibold">Value</th>
                    <th className="text-left px-5 py-3 font-semibold">Recorded by</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {filtered.map((movement) => (
                    <tr key={movement.id} className="hover:bg-neutral-50">
                      <td className="px-5 py-3 text-neutral-400 whitespace-nowrap">{movement.date}</td>
                      <td className="px-5 py-3 font-medium text-neutral-800">{movement.product}</td>
                      <td className="px-5 py-3">
                        <Badge variant={movement.type === 'in' ? 'success' : 'warning'} size="sm">
                          {movement.type === 'in' ? 'Stock In' : 'Stock Out'}
                        </Badge>
                      </td>
                      <td className={`px-5 py-3 font-semibold ${movement.type === 'in' ? 'text-success-600' : 'text-warning-600'}`}>
                        {movement.type === 'in' ? '+' : '−'}{movement.quantity}
                      </td>
                      <td className="px-5 py-3 text-neutral-600">{stockReasonLabels[movement.reason] ?? movement.reason}</td>
                      <td className="px-5 py-3 text-neutral-600">{movement.supplierName || '—'}</td>
                      <td className="px-5 py-3 text-neutral-600">{movement.expiryDate || '—'}</td>
                      <td className="px-5 py-3 text-neutral-600">RWF {movement.total.toLocaleString()}</td>
                      <td className="px-5 py-3 text-neutral-500">{movement.userName || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        {canManage && (
          <>
            <BizModal type="stock-in" open={showStockIn} initialProduct={stockProductPreset} onClose={() => closeStockModal('in')} onSaved={refreshBusinessData} />
            <BizModal type="stock-out" open={showStockOut} initialProduct={stockProductPreset} onClose={() => closeStockModal('out')} onSaved={refreshBusinessData} />
          </>
        )}
      </div>
    );
  }

  if (currentSection === 'suppliers') {
    const suppliedProductCount = (supplierId: string) =>
      products.filter((product) => product.supplierId === supplierId).length;

    return (
      <div className="space-y-6 animate-fade-in">
        <SectionHeader
          title="Suppliers"
          subtitle="Who supplies your stock, with contact details and the products linked to them"
          icon={<Truck className="w-5 h-5" />}
          action={
            canManage ? (
              <Button size="sm" icon={<Plus className="w-4 h-4" />} onClick={() => setSupplierModal({ open: true })}>
                Add Supplier
              </Button>
            ) : undefined
          }
        />

        <Card className="overflow-hidden">
          {suppliers.length === 0 ? (
            <p className="px-5 py-10 text-center text-sm text-neutral-500">
              No suppliers recorded yet. Add a supplier so every Stock In shows where the goods came from.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-neutral-50 text-neutral-500 text-xs uppercase tracking-wider">
                  <tr>
                    <th className="text-left px-5 py-3 font-semibold">Supplier</th>
                    <th className="text-left px-5 py-3 font-semibold">Phone</th>
                    <th className="text-left px-5 py-3 font-semibold">Email</th>
                    <th className="text-left px-5 py-3 font-semibold">Address</th>
                    <th className="text-left px-5 py-3 font-semibold">Products</th>
                    {canManage && <th className="text-right px-5 py-3 font-semibold">Actions</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {suppliers.map((supplier) => (
                    <tr key={supplier.id} className="hover:bg-neutral-50">
                      <td className="px-5 py-3">
                        <p className="font-medium text-neutral-800">{supplier.name}</p>
                        {supplier.notes && <p className="text-xs text-neutral-400 mt-0.5">{supplier.notes}</p>}
                      </td>
                      <td className="px-5 py-3 text-neutral-600">{supplier.phone || '—'}</td>
                      <td className="px-5 py-3 text-neutral-600">{supplier.email || '—'}</td>
                      <td className="px-5 py-3 text-neutral-600">{supplier.address || '—'}</td>
                      <td className="px-5 py-3 text-neutral-600">{suppliedProductCount(supplier.id)}</td>
                      {canManage && (
                        <td className="px-5 py-3">
                          <div className="flex items-center justify-end gap-1">
                            <Button size="sm" variant="ghost" icon={<Pencil className="w-4 h-4" />} onClick={() => setSupplierModal({ open: true, supplier })}>
                              Edit
                            </Button>
                            <Button size="sm" variant="ghost" icon={<Trash2 className="w-4 h-4" />} onClick={() => setSupplierToDelete(supplier)}>
                              Delete
                            </Button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        {canManage && (
          <>
            <SupplierModal
              open={supplierModal.open}
              supplier={supplierModal.supplier}
              onClose={() => setSupplierModal({ open: false })}
              onSaved={refreshBusinessData}
            />
            <Modal
              open={Boolean(supplierToDelete)}
              onClose={() => setSupplierToDelete(null)}
              title="Delete supplier"
              subtitle={supplierToDelete?.name}
              icon={<Trash2 className="w-5 h-5" />}
              footer={
                <>
                  <Button variant="outline" onClick={() => setSupplierToDelete(null)}>Cancel</Button>
                  <Button
                    onClick={async () => {
                      if (!supplierToDelete) return;
                      try {
                        await api.business.deleteSupplier(supplierToDelete.id);
                        setSupplierToDelete(null);
                        await refreshBusinessData();
                      } catch {
                        setSupplierToDelete(null);
                      }
                    }}
                  >
                    Delete supplier
                  </Button>
                </>
              }
            >
              <p className="text-sm text-neutral-600">
                Past stock movements keep the supplier name, but products linked to this supplier will no longer show it.
              </p>
            </Modal>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <EmptyState
        icon={<Briefcase className="w-8 h-8" />}
        title="Section Coming Soon"
        description="This business section is being developed with full functionality."
      />
    </div>
  );
}

type BizModalType = 'new-sale' | 'stock-in' | 'stock-out' | 'add-product' | 'add-record';

function BizModal({ type, open, onClose, onSaved, initialProduct }: { type: BizModalType; open: boolean; onClose: () => void; onSaved: () => void | Promise<void>; initialProduct?: string }) {
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  // For new-sale:
  const [saleProduct, setSaleProduct] = useState('');
  const [saleQty, setSaleQty] = useState('');
  const [salePrice, setSalePrice] = useState('');
  const [saleCustomer, setSaleCustomer] = useState('');
  const [salePayment, setSalePayment] = useState('cash');
  // For stock-in / stock-out:
  const [stockProduct, setStockProduct] = useState('');
  const [stockQty, setStockQty] = useState('');
  const [stockPrice, setStockPrice] = useState('');
  const [stockReason, setStockReason] = useState<StockReason>('purchase');
  const [stockSupplierId, setStockSupplierId] = useState('');
  const [stockExpiry, setStockExpiry] = useState('');
  const [stockNote, setStockNote] = useState('');
  const [stockDate, setStockDate] = useState('');
  // For add-product:
  const [prodName, setProdName] = useState('');
  const [prodCategory, setProdCategory] = useState('');
  const [prodStock, setProdStock] = useState('');
  const [prodPrice, setProdPrice] = useState('');
  const [prodLowAlert, setProdLowAlert] = useState('');
  const [prodDesc, setProdDesc] = useState('');
  const [prodSupplierId, setProdSupplierId] = useState('');
  const [prodExpiry, setProdExpiry] = useState('');
  // For add-record:
  const [recType, setRecType] = useState<LoanRecord['type']>('loan');
  const [recCounterparty, setRecCounterparty] = useState('');
  const [recAmount, setRecAmount] = useState('');
  const [recDate, setRecDate] = useState('');
  const [recInterest, setRecInterest] = useState('');
  const [recDueDate, setRecDueDate] = useState('');
  const [recNotes, setRecNotes] = useState('');
  const { data: productOptions } = useApiList(() =>
    api.business.products().then((result) => result.products)
  );
  const { data: supplierOptions } = useApiList(() =>
    api.business.suppliers().then((result) => result.suppliers)
  );

  const selectedProduct = productOptions.find((product) => product.name === stockProduct);
  const selectedSaleProduct = productOptions.find((product) => product.name === saleProduct);

  useEffect(() => {
    if (!open) return;
    setStockReason(type === 'stock-out' ? 'sale' : 'purchase');
    setStockSupplierId('');
    setStockExpiry('');
  }, [open, type]);

  useEffect(() => {
    if (!open || !initialProduct) return;
    setStockProduct(initialProduct);
    const match = productOptions.find((product) => product.name === initialProduct);
    if (match) setStockPrice(String(match.unitPrice));
  }, [open, initialProduct, productOptions]);

  if (!open) return null;

  const resetForm = () => {
    setSaleProduct(''); setSaleQty(''); setSalePrice(''); setSaleCustomer(''); setSalePayment('cash');
    setStockProduct(''); setStockQty(''); setStockPrice(''); setStockNote(''); setStockDate('');
    setStockReason('purchase'); setStockSupplierId(''); setStockExpiry('');
    setProdName(''); setProdCategory(''); setProdStock(''); setProdPrice(''); setProdLowAlert(''); setProdDesc('');
    setProdSupplierId(''); setProdExpiry('');
    setRecType('loan'); setRecCounterparty(''); setRecAmount(''); setRecDate(''); setRecInterest(''); setRecDueDate(''); setRecNotes('');
    setSaveError(null);
  };

  const handleSave = async () => {
    setSaving(true);
    setSaveError(null);
    try {
      if (type === 'new-sale') {
        if (!saleProduct || !saleQty) {
          setSaveError('Choose a product and enter the quantity.');
          setSaving(false);
          return;
        }
        const quantity = parseInt(saleQty, 10);
        const unitPrice = salePrice ? parseFloat(salePrice) : selectedSaleProduct?.unitPrice ?? 0;
        if (!quantity || quantity < 1 || !unitPrice || unitPrice <= 0) {
          setSaveError('Enter a quantity of at least one and a unit price above zero.');
          setSaving(false);
          return;
        }
        if (selectedSaleProduct && quantity > selectedSaleProduct.stock) {
          setSaveError(
            `Only ${selectedSaleProduct.stock} units of ${selectedSaleProduct.name} are in stock. Record Stock In before selling more.`
          );
          setSaving(false);
          return;
        }
        await api.business.createSale({
          product: saleProduct,
          quantity,
          amount: Math.round(unitPrice * quantity),
          customer: saleCustomer,
          paymentMethod: salePayment,
        });
      } else if (type === 'stock-in' || type === 'stock-out') {
        if (!stockProduct || !stockQty) {
          setSaveError('Choose a product and enter the quantity.');
          setSaving(false);
          return;
        }
        const quantity = parseInt(stockQty, 10);
        const unitPrice = stockPrice ? parseInt(stockPrice, 10) : selectedProduct?.unitPrice ?? 0;
        if (!quantity || quantity < 1) {
          setSaveError('Enter a quantity of at least one.');
          setSaving(false);
          return;
        }
        if (Number.isNaN(unitPrice) || unitPrice < 0) {
          setSaveError('Enter a unit price of zero or more.');
          setSaving(false);
          return;
        }
        if (type === 'stock-out' && selectedProduct && quantity > selectedProduct.stock) {
          setSaveError(
            `Only ${selectedProduct.stock} units of ${selectedProduct.name} are in stock. Reduce the quantity or record Stock In first.`
          );
          setSaving(false);
          return;
        }
        await api.business.createStockMovement({
          product: stockProduct,
          type: type === 'stock-in' ? 'in' : 'out',
          quantity,
          unitPrice,
          reason: stockReason,
          supplierId: type === 'stock-in' && stockSupplierId ? stockSupplierId : undefined,
          expiryDate: type === 'stock-in' && stockExpiry ? stockExpiry : undefined,
          note: stockNote,
          date: stockDate || undefined,
        });
      } else if (type === 'add-product') {
        if (!prodName || !prodCategory || !prodStock || !prodPrice) {
          setSaveError('Please fill in all required fields.');
          setSaving(false);
          return;
        }
        await api.business.createProduct({
          name: prodName,
          category: prodCategory,
          stock: parseInt(prodStock, 10),
          unitPrice: parseInt(prodPrice, 10),
          lowStockAlert: parseInt(prodLowAlert, 10) || 0,
          description: prodDesc,
          supplierId: prodSupplierId || undefined,
          expiryDate: prodExpiry || undefined,
        });
      } else if (type === 'add-record') {
        if (!recCounterparty || !recAmount || !recDate) {
          setSaveError('Please fill in all required fields.');
          setSaving(false);
          return;
        }
        await api.business.createLoan({
          type: recType,
          counterparty: recCounterparty,
          amount: parseInt(recAmount, 10),
          date: recDate,
          interestRate: parseFloat(recInterest) || 0,
          dueDate: recDueDate,
          notes: recNotes,
        });
      }
      await onSaved();
      setSubmitted(true);
    } catch (err: unknown) {
      setSaveError(err instanceof Error ? err.message : 'Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const config: Record<BizModalType, { title: string; subtitle: string; icon: ReactNode; submitLabel: string }> = {
    'new-sale': { title: 'New Sale', subtitle: 'Record a new sales transaction', icon: <ShoppingCart className="w-5 h-5" />, submitLabel: 'Record Sale' },
    'stock-in': { title: 'Record Stock In', subtitle: 'Add incoming units to your inventory', icon: <PackagePlus className="w-5 h-5" />, submitLabel: 'Save Stock In' },
    'stock-out': { title: 'Record Stock Out', subtitle: 'Remove outgoing units from your inventory', icon: <PackageMinus className="w-5 h-5" />, submitLabel: 'Save Stock Out' },
    'add-product': { title: 'Add Product', subtitle: 'Add a new product to your catalog', icon: <Package className="w-5 h-5" />, submitLabel: 'Add Product' },
    'add-record': { title: 'Add Record', subtitle: 'Add a new loan or debt record', icon: <HandCoins className="w-5 h-5" />, submitLabel: 'Add Record' },
  };
  const c = config[type];

  if (submitted) {
    return (
      <Modal
        open={open}
        onClose={() => { setSubmitted(false); resetForm(); onClose(); }}
        title="Success"
        subtitle="The record has been saved"
        icon={<CheckCircle className="w-5 h-5" />}
        footer={<Button onClick={() => { setSubmitted(false); resetForm(); onClose(); }}>Done</Button>}
      >
        <p className="text-sm text-neutral-600">
          {type === 'stock-in' || type === 'stock-out'
            ? 'Your stock movement has been saved and the stock level updated.'
            : `Your ${type === 'new-sale' ? 'sale' : type === 'add-product' ? 'product' : 'record'} has been added successfully.`}
        </p>
      </Modal>
    );
  }

  return (
    <Modal
      open={open}
      onClose={() => { setSubmitted(false); resetForm(); onClose(); }}
      title={c.title}
      subtitle={c.subtitle}
      icon={c.icon}
      footer={
        <>
          <Button variant="outline" onClick={() => { setSubmitted(false); resetForm(); onClose(); }}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : c.submitLabel}
          </Button>
        </>
      }
    >
      {saveError && (
        <div className="mb-4 p-3 rounded-xl bg-error-50 border border-error-200 text-sm text-error-700 flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <span>{saveError}</span>
        </div>
      )}
      {(type === 'stock-in' || type === 'stock-out') && <>
        <FormField
          label="Product"
          hint={selectedProduct ? `${selectedProduct.stock} units available now` : undefined}
        >
          <Select
            value={stockProduct}
            onChange={(e) => {
              const name = e.target.value;
              setStockProduct(name);
              const match = productOptions.find((p) => p.name === name);
              if (match) setStockPrice(String(match.unitPrice));
            }}
          >
            <option value="" disabled>Select a product</option>
            {productOptions.map((p) => (
              <option key={p.id} value={p.name}>{p.name} · {p.stock} in stock</option>
            ))}
          </Select>
        </FormField>
        <div className="grid grid-cols-2 gap-4">
          <FormField
            label="Quantity"
            hint={
              type === 'stock-out' && selectedProduct
                ? `Max ${selectedProduct.stock} available`
                : undefined
            }
          >
            <Input type="number" min={1} max={type === 'stock-out' ? selectedProduct?.stock : undefined} placeholder="e.g., 10" value={stockQty} onChange={(e) => setStockQty(e.target.value)} />
          </FormField>
          <FormField label="Unit Price (RWF)">
            <Input type="number" placeholder="e.g., 1200" value={stockPrice} onChange={(e) => setStockPrice(e.target.value)} />
          </FormField>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Reason">
            <Select value={stockReason} onChange={(e) => setStockReason(e.target.value as StockReason)}>
              {(type === 'stock-in' ? stockInReasons : stockOutReasons).map((reason) => (
                <option key={reason.value} value={reason.value}>{reason.label}</option>
              ))}
            </Select>
          </FormField>
          {type === 'stock-in' ? (
            <FormField label="Supplier" hint="Optional">
              <Select value={stockSupplierId} onChange={(e) => setStockSupplierId(e.target.value)}>
                <option value="">No supplier</option>
                {supplierOptions.map((supplier) => (
                  <option key={supplier.id} value={supplier.id}>{supplier.name}</option>
                ))}
              </Select>
            </FormField>
          ) : (
            <FormField label="Date">
              <Input type="date" value={stockDate} onChange={(e) => setStockDate(e.target.value)} />
            </FormField>
          )}
        </div>
        {type === 'stock-in' && (
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Date">
              <Input type="date" value={stockDate} onChange={(e) => setStockDate(e.target.value)} />
            </FormField>
            <FormField label="Expiry date" hint="Optional">
              <Input type="date" value={stockExpiry} onChange={(e) => setStockExpiry(e.target.value)} />
            </FormField>
          </div>
        )}
        <FormField label="Note" hint="Optional">
          <Input placeholder={type === 'stock-in' ? 'e.g., Delivery note 042' : 'e.g., Damaged during transport'} value={stockNote} onChange={(e) => setStockNote(e.target.value)} />
        </FormField>
        <div className="flex items-center justify-between rounded-xl bg-neutral-50 border border-neutral-200 px-4 py-3">
          <span className="text-sm font-semibold text-neutral-600">Total</span>
          <span className="font-bold text-neutral-800">
            RWF {(
              (parseInt(stockQty, 10) || 0) * (parseInt(stockPrice, 10) || 0)
            ).toLocaleString()}
          </span>
        </div>
      </>}
      {type === 'new-sale' && <>
        <FormField label="Product">
          <Select
            value={saleProduct}
            onChange={(e) => {
              const name = e.target.value;
              setSaleProduct(name);
              const match = productOptions.find((p) => p.name === name);
              if (match) setSalePrice(String(match.unitPrice));
            }}
          >
            <option value="" disabled>Select a product</option>
            {productOptions.map((p) => <option key={p.id} value={p.name}>{p.name} · {p.stock} in stock</option>)}
          </Select>
        </FormField>
        <div className="grid grid-cols-2 gap-4">
          <FormField
            label="Quantity"
            hint={selectedSaleProduct ? `Max ${selectedSaleProduct.stock} available` : undefined}
          >
            <Input type="number" min={1} placeholder="e.g., 5" value={saleQty} onChange={(e) => setSaleQty(e.target.value)} />
          </FormField>
          <FormField label="Unit Price (RWF)">
            <Input type="number" placeholder="e.g., 5000" value={salePrice} onChange={(e) => setSalePrice(e.target.value)} />
          </FormField>
        </div>
        <FormField label="Customer Name">
          <Input placeholder="e.g., John Mugisha" value={saleCustomer} onChange={(e) => setSaleCustomer(e.target.value)} />
        </FormField>
        <FormField label="Payment Method">
          <Select value={salePayment} onChange={(e) => setSalePayment(e.target.value)}>
            <option value="cash">Cash</option>
            <option value="mobile-money">Mobile Money</option>
            <option value="card">Card</option>
            <option value="credit">Credit</option>
          </Select>
        </FormField>
      </>}
      {type === 'add-product' && <>
        <FormField label="Product Name">
          <Input placeholder="e.g., Rice 1kg" value={prodName} onChange={(e) => setProdName(e.target.value)} />
        </FormField>
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Category">
            <Select value={prodCategory} onChange={(e) => setProdCategory(e.target.value)}>
              <option value="" disabled>Select category</option>
              <option value="Food">Food</option>
              <option value="Household">Household</option>
              <option value="Bakery">Bakery</option>
              <option value="Dairy">Dairy</option>
              <option value="Drinks">Drinks</option>
              <option value="Other">Other</option>
            </Select>
          </FormField>
          <FormField label="Initial Stock">
            <Input type="number" placeholder="e.g., 50" value={prodStock} onChange={(e) => setProdStock(e.target.value)} />
          </FormField>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Unit Price (RWF)">
            <Input type="number" placeholder="e.g., 1200" value={prodPrice} onChange={(e) => setProdPrice(e.target.value)} />
          </FormField>
          <FormField label="Low Stock Alert At">
            <Input type="number" placeholder="e.g., 10" value={prodLowAlert} onChange={(e) => setProdLowAlert(e.target.value)} />
          </FormField>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Supplier" hint="Optional">
            <Select value={prodSupplierId} onChange={(e) => setProdSupplierId(e.target.value)}>
              <option value="">No supplier</option>
              {supplierOptions.map((supplier) => (
                <option key={supplier.id} value={supplier.id}>{supplier.name}</option>
              ))}
            </Select>
          </FormField>
          <FormField label="Expiry date" hint="Optional">
            <Input type="date" value={prodExpiry} onChange={(e) => setProdExpiry(e.target.value)} />
          </FormField>
        </div>
        <FormField label="Description" hint="Optional">
          <Textarea rows={3} placeholder="Brief product description..." value={prodDesc} onChange={(e) => setProdDesc(e.target.value)} />
        </FormField>
      </>}
      {type === 'add-record' && <>
        <FormField label="Record Type">
          <Select value={recType} onChange={(e) => setRecType(e.target.value as LoanRecord['type'])}>
            <option value="loan">Loan (money I borrowed)</option>
            <option value="debt">Debt (money owed to me)</option>
          </Select>
        </FormField>
        <FormField label="Counterparty">
          <Input placeholder="e.g., Bank of Kigali or John Mugisha" value={recCounterparty} onChange={(e) => setRecCounterparty(e.target.value)} />
        </FormField>
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Amount (RWF)">
            <Input type="number" placeholder="e.g., 500000" value={recAmount} onChange={(e) => setRecAmount(e.target.value)} />
          </FormField>
          <FormField label="Date">
            <Input type="date" value={recDate} onChange={(e) => setRecDate(e.target.value)} />
          </FormField>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Interest Rate (%)">
            <Input type="number" placeholder="e.g., 12" value={recInterest} onChange={(e) => setRecInterest(e.target.value)} />
          </FormField>
          <FormField label="Due Date">
            <Input type="date" value={recDueDate} onChange={(e) => setRecDueDate(e.target.value)} />
          </FormField>
        </div>
        <FormField label="Notes" hint="Optional">
          <Textarea rows={2} placeholder="Any additional details..." value={recNotes} onChange={(e) => setRecNotes(e.target.value)} />
        </FormField>
      </>}
    </Modal>
  );
}

function SupplierModal({
  open,
  supplier,
  onClose,
  onSaved,
}: {
  open: boolean;
  supplier?: Supplier;
  onClose: () => void;
  onSaved: () => void | Promise<void>;
}) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setName(supplier?.name || '');
    setPhone(supplier?.phone || '');
    setEmail(supplier?.email || '');
    setAddress(supplier?.address || '');
    setNotes(supplier?.notes || '');
    setError(null);
  }, [open, supplier]);

  if (!open) return null;

  const handleSave = async () => {
    if (name.trim().length < 2) {
      setError('Enter the supplier name.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const payload = { name: name.trim(), phone, email, address, notes };
      if (supplier) await api.business.updateSupplier(supplier.id, payload);
      else await api.business.createSupplier(payload);
      await onSaved();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save the supplier. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={supplier ? 'Edit supplier' : 'Add supplier'}
      subtitle={supplier ? supplier.name : 'Record where your stock comes from'}
      icon={<Truck className="w-5 h-5" />}
      footer={
        <>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : supplier ? 'Save changes' : 'Add supplier'}
          </Button>
        </>
      }
    >
      {error && (
        <div className="mb-4 p-3 rounded-xl bg-error-50 border border-error-200 text-sm text-error-700 flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}
      <FormField label="Supplier name">
        <Input placeholder="e.g., Kigali Wholesale Ltd" value={name} onChange={(e) => setName(e.target.value)} />
      </FormField>
      <div className="grid grid-cols-2 gap-4">
        <FormField label="Phone" hint="Optional">
          <Input placeholder="+250 7XX XXX XXX" value={phone} onChange={(e) => setPhone(e.target.value)} />
        </FormField>
        <FormField label="Email" hint="Optional">
          <Input type="email" placeholder="supplier@example.rw" value={email} onChange={(e) => setEmail(e.target.value)} />
        </FormField>
      </div>
      <FormField label="Address" hint="Optional">
        <Input placeholder="e.g., Nyarugenge, Kigali" value={address} onChange={(e) => setAddress(e.target.value)} />
      </FormField>
      <FormField label="Notes" hint="Optional">
        <Textarea rows={2} placeholder="Delivery days, payment terms..." value={notes} onChange={(e) => setNotes(e.target.value)} />
      </FormField>
    </Modal>
  );
}
