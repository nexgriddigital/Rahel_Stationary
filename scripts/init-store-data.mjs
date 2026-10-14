import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const mem = new Map();
globalThis.localStorage = {
  getItem: (k) => mem.get(k) || null,
  setItem: (k, v) => mem.set(k, String(v)),
  removeItem: (k) => mem.delete(k),
  clear: () => mem.clear()
};
globalThis.sessionStorage = globalThis.localStorage;
globalThis.window = {
  addEventListener: () => {},
  removeEventListener: () => {}
};

async function main() {
  const { storage } = await import('../src/services/storage.ts');
  const snapshot = {
    version: 1,
    updatedAt: new Date().toISOString(),
    products: storage.getProducts(),
    services: storage.getServices(),
    sales: storage.getSales(),
    creditAccounts: storage.getCreditAccounts(),
    expenses: storage.getExpenses(),
    shifts: storage.getShifts(),
    stockMovements: storage.getStockMovements(),
    logs: storage.getLogs(),
    settings: storage.getSettings(),
    staff: storage.getStaff(),
    notifications: storage.getNotifications(),
    parkedCarts: []
  };

  const dataDir = path.join(rootDir, 'data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  const targetPath = path.join(dataDir, 'store-data.json');
  fs.writeFileSync(targetPath, JSON.stringify(snapshot, null, 2), 'utf-8');
  console.log(`Successfully generated ${targetPath} with ${snapshot.products.length} products, ${snapshot.services.length} services, and ${snapshot.sales.length} sales.`);
}

main().catch(console.error);
