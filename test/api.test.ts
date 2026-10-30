import assert from 'node:assert/strict';
import { after, before, beforeEach, describe, test } from 'node:test';
import type { Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import type { PrismaClient } from '@prisma/client';
import { app } from '../src/app';
import { replacePrismaClient } from '../src/lib/prisma';

process.env.NODE_ENV = 'test';

type AsyncCall = ((...args: any[]) => Promise<any>) & { calls: any[][] };
const asyncCall = (implementation: (...args: any[]) => any = () => undefined): AsyncCall => {
  const fn = (async (...args: any[]) => {
    fn.calls.push(args);
    return implementation(...args);
  }) as AsyncCall;
  fn.calls = [];
  return fn;
};

const db = {
  $queryRaw: asyncCall(() => [{ value: 1 }]),
  $transaction: asyncCall(async (operation) => operation(db)),
  product: {
    create: asyncCall((args) => ({ id: 1, ...args.data })),
    findUnique: asyncCall(() => null),
    update: asyncCall(),
    findMany: asyncCall(() => []),
  },
  sale: {
    findMany: asyncCall(() => []),
  },
  cashMovement: {
    findMany: asyncCall(() => []),
    create: asyncCall((args) => ({ id: 1, ...args.data })),
  },
  supplier: {
    findMany: asyncCall(() => []),
    findFirst: asyncCall(() => null),
    create: asyncCall((args) => ({ id: 1, active: true, ...args.data })),
  },
  purchase: {
    findMany: asyncCall(() => []),
    create: asyncCall((args) => ({ id: 1, ...args.data })),
  },
  customer: {
    findMany: asyncCall(() => []),
    findFirst: asyncCall(() => null),
    create: asyncCall((args) => ({ id: 1, balance: 0, active: true, ...args.data })),
    update: asyncCall(),
  },
  credit: {
    findMany: asyncCall(() => []),
    findUnique: asyncCall(() => null),
    create: asyncCall((args) => ({ id: 1, ...args.data })),
    update: asyncCall(),
  },
  creditPayment: {
    create: asyncCall((args) => ({ id: 1, ...args.data })),
  },
};

replacePrismaClient(db as unknown as PrismaClient);

let server: Server;
let baseUrl: string;

before(async () => {
  server = await new Promise<Server>((resolve) => {
    const listeningServer = app.listen(0, '127.0.0.1', () => resolve(listeningServer));
  });
  const address = server.address() as AddressInfo;
  baseUrl = `http://127.0.0.1:${address.port}`;
});

after(() => new Promise<void>((resolve, reject) => {
  server.close((error) => error ? reject(error) : resolve());
}));

beforeEach(() => {
  db.$queryRaw.calls = [];
  db.$transaction.calls = [];
  db.product.create.calls = [];
  db.product.findUnique.calls = [];
  db.product.update.calls = [];
  db.product.findMany.calls = [];
  db.sale.findMany = asyncCall(() => []);
  db.cashMovement.findMany = asyncCall(() => []);
  db.cashMovement.create = asyncCall((args) => ({ id: 1, ...args.data }));
  db.supplier.findMany = asyncCall(() => []);
  db.supplier.findFirst = asyncCall(() => null);
  db.supplier.create = asyncCall((args) => ({ id: 1, active: true, ...args.data }));
  db.purchase.findMany = asyncCall(() => []);
  db.purchase.create = asyncCall((args) => ({ id: 1, ...args.data }));
  db.customer.findMany = asyncCall(() => []);
  db.customer.findFirst = asyncCall(() => null);
  db.customer.create = asyncCall((args) => ({ id: 1, balance: 0, active: true, ...args.data }));
  db.customer.update = asyncCall();
  db.credit.findMany = asyncCall(() => []);
  db.credit.findUnique = asyncCall(() => null);
  db.credit.create = asyncCall((args) => ({ id: 1, ...args.data }));
  db.credit.update = asyncCall();
  db.creditPayment.create = asyncCall((args) => ({ id: 1, ...args.data }));
});

const request = (path: string, init?: RequestInit) => fetch(`${baseUrl}${path}`, {
  ...init,
  headers: { 'content-type': 'application/json', ...init?.headers },
});

describe('API Punto Barrio', () => {
  test('GET /api/health comprueba la base de datos y expone el estado', async () => {
    const response = await request('/api/health');
    const body = await response.json();

    assert.equal(response.status, 200);
    assert.equal(body.status, 'ok');
    assert.equal(body.service, 'Punto Barrio API');
    assert.equal(db.$queryRaw.calls.length, 1);
    assert.ok(!Number.isNaN(Date.parse(body.timestamp)));
  });

  test('una ruta inexistente responde con el contrato 404', async () => {
    const response = await request('/api/no-existe');
    assert.equal(response.status, 404);
    assert.deepEqual(await response.json(), { message: 'Ruta no encontrada' });
  });

  test('POST /api/products rechaza cuerpos inválidos antes de escribir', async () => {
    const response = await request('/api/products', {
      method: 'POST',
      body: JSON.stringify({ name: 'A', sku: '', price: -1 }),
    });
    const body = await response.json();

    assert.equal(response.status, 400);
    assert.equal(body.message, 'Datos inválidos');
    assert.ok(Array.isArray(body.errors));
    assert.equal(db.product.create.calls.length, 0);
  });

  test('POST /api/products normaliza el SKU y convierte números', async () => {
    const response = await request('/api/products', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Arroz', sku: ' arr-01 ', category: 'Abarrotes',
        price: '12.50', cost: '9', stock: '8', minStock: '2',
      }),
    });

    assert.equal(response.status, 201);
    const createArgs = db.product.create.calls[0][0];
    assert.equal(createArgs.data.sku, 'ARR-01');
    assert.equal(createArgs.data.price, 12.5);
    assert.equal(createArgs.data.stock, 8);
  });

  test('PATCH /api/products/:id/stock impide stock negativo', async () => {
    db.product.findUnique = asyncCall(() => ({ id: 7, name: 'Leche', stock: 2 }));
    const response = await request('/api/products/7/stock', {
      method: 'PATCH',
      body: JSON.stringify({ quantity: -3, reason: 'Merma' }),
    });

    assert.equal(response.status, 409);
    assert.deepEqual(await response.json(), { message: 'El ajuste dejaría el stock en negativo' });
    assert.equal(db.product.update.calls.length, 0);
  });

  test('GET /api/dashboard separa ventas de todos los ingresos de caja', async () => {
    db.sale.findMany = asyncCall((args) => {
      if (args.take === 5 || args.orderBy?.createdAt === 'asc') return [];
      return [{ id: 1, total: '100.00', createdAt: new Date(), items: [] }];
    });
    db.cashMovement.findMany = asyncCall(() => [
      { amount: '100.00' },
      { amount: '25.00' },
    ]);

    const response = await request('/api/dashboard');
    const body = await response.json();

    assert.equal(response.status, 200);
    assert.equal(body.todayRevenue, 100);
    assert.equal(body.todayCashIncome, 125);
    assert.equal(body.todaySales, 1);
    assert.equal(db.cashMovement.findMany.calls.length, 1);
    assert.equal(db.cashMovement.findMany.calls[0][0].where.type, 'INCOME');
    assert.ok(db.cashMovement.findMany.calls[0][0].where.createdAt.gte instanceof Date);
  });

  test('POST /api/suppliers valida los datos antes de crear el proveedor', async () => {
    const response = await request('/api/suppliers', {
      method: 'POST',
      body: JSON.stringify({ name: 'A' }),
    });

    assert.equal(response.status, 400);
    assert.equal(db.supplier.create.calls.length, 0);
  });

  test('POST /api/purchases registra el egreso y repone el stock en una transacción', async () => {
    db.supplier.findFirst = asyncCall(() => ({ id: 4, name: 'Distribuidora Sur', active: true }));
    db.product.findMany = asyncCall(() => [{ id: 7, name: 'Leche', active: true }]);
    db.purchase.create = asyncCall(() => ({ id: 9, supplier: { id: 4, name: 'Distribuidora Sur' }, items: [] }));

    const response = await request('/api/purchases', {
      method: 'POST',
      body: JSON.stringify({
        supplierId: 4,
        invoiceNumber: 'F-102',
        items: [{ productId: 7, quantity: 6, unitCost: 7.5 }],
      }),
    });

    assert.equal(response.status, 201);
    assert.equal(db.$transaction.calls.length, 1);
    assert.deepEqual(db.product.update.calls[0][0].data, { stock: { increment: 6 }, cost: 7.5 });
    assert.equal(db.cashMovement.create.calls[0][0].data.type, 'EXPENSE');
    assert.equal(db.cashMovement.create.calls[0][0].data.amount, 45);
  });

  test('POST /api/credits impide superar el límite disponible del cliente', async () => {
    db.customer.findFirst = asyncCall(() => ({ id: 2, name: 'Ana', balance: 80, creditLimit: 100, active: true }));
    db.product.findMany = asyncCall(() => [{ id: 3, name: 'Arroz', price: 25, stock: 10, active: true }]);

    const response = await request('/api/credits', {
      method: 'POST',
      body: JSON.stringify({ customerId: 2, items: [{ productId: 3, quantity: 1 }] }),
    });

    assert.equal(response.status, 409);
    assert.deepEqual(await response.json(), { message: 'La venta supera el límite de crédito disponible del cliente' });
    assert.equal(db.credit.create.calls.length, 0);
    assert.equal(db.cashMovement.create.calls.length, 0);
  });

  test('POST /api/credits/:id/payments registra caja y actualiza ambos saldos', async () => {
    db.credit.findUnique = asyncCall(() => ({
      id: 11, customerId: 2, balance: 30, customer: { id: 2, name: 'Ana' },
    }));
    db.credit.update = asyncCall((args) => ({ id: 11, ...args.data }));

    const response = await request('/api/credits/11/payments', {
      method: 'POST',
      body: JSON.stringify({ amount: 30 }),
    });

    assert.equal(response.status, 201);
    assert.deepEqual(db.credit.update.calls[0][0].data, { balance: 0, status: 'PAID' });
    assert.deepEqual(db.customer.update.calls[0][0].data, { balance: { decrement: 30 } });
    assert.equal(db.cashMovement.create.calls[0][0].data.type, 'INCOME');
    assert.equal(db.cashMovement.create.calls[0][0].data.category, 'Cobro fiado');
  });
});
