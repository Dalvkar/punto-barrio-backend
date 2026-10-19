import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const products = [
    { name: 'Arroz Grano de Oro 1 kg', sku: 'AB-001', category: 'Abarrotes', price: 9.5, cost: 7.2, stock: 24, minStock: 8 },
    { name: 'Aceite Fino 900 ml', sku: 'AB-002', category: 'Abarrotes', price: 14, cost: 11, stock: 5, minStock: 7 },
    { name: 'Leche Pil 946 ml', sku: 'LA-001', category: 'Lácteos', price: 8.5, cost: 6.8, stock: 18, minStock: 6 },
    { name: 'Yogurt frutilla 1 L', sku: 'LA-002', category: 'Lácteos', price: 13, cost: 10, stock: 4, minStock: 5 },
    { name: 'Coca-Cola 2 L', sku: 'BE-001', category: 'Bebidas', price: 15, cost: 11.5, stock: 16, minStock: 6 },
    { name: 'Agua Vital 2 L', sku: 'BE-002', category: 'Bebidas', price: 7, cost: 4.5, stock: 2, minStock: 5 },
    { name: 'Galletas Mabel 120 g', sku: 'SN-001', category: 'Snacks', price: 5, cost: 3.5, stock: 31, minStock: 10 },
    { name: 'Detergente OLA 800 g', sku: 'LI-001', category: 'Limpieza', price: 16.5, cost: 13, stock: 9, minStock: 4 },
  ];
  for (const product of products) await prisma.product.upsert({ where: { sku: product.sku }, update: {}, create: product });

  if (await prisma.sale.count() === 0) {
    const all = await prisma.product.findMany();
    for (let day = 5; day >= 0; day--) {
      const selected = all[day % all.length];
      const createdAt = new Date(); createdAt.setDate(createdAt.getDate() - day); createdAt.setHours(10 + day, 15, 0, 0);
      const total = Number(selected.price) * (day % 3 + 1);
      const sale = await prisma.sale.create({ data: { receiptCode: `DEMO-${day + 1}`, customer: day % 2 ? 'Cliente frecuente' : null, total, paymentType: day % 2 ? 'QR' : 'Efectivo', createdAt, items: { create: { productId: selected.id, quantity: day % 3 + 1, unitPrice: selected.price, subtotal: total } } } });
      await prisma.cashMovement.create({ data: { type: 'INCOME', category: 'Venta', description: `Venta ${sale.receiptCode}`, amount: total, saleId: sale.id, createdAt } });
    }
  }
}

main().then(() => console.log('Datos de demostración creados')).finally(() => prisma.$disconnect());

