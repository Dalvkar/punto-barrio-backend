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
  db.product.create.calls = [];
  db.product.findUnique.calls = [];
  db.product.update.calls = [];
  db.product.findMany.calls = [];
  db.sale.findMany = asyncCall(() => []);
  db.cashMovement.findMany = asyncCall(() => []);
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
});
