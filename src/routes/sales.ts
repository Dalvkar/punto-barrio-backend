import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { AppError, asyncHandler } from '../lib/http';

const router = Router();
const saleSchema = z.object({
  customer: z.string().trim().optional(),
  paymentType: z.enum(['Efectivo', 'QR', 'Tarjeta']),
  items: z.array(z.object({ productId: z.coerce.number().int().positive(), quantity: z.coerce.number().int().positive() })).min(1),
});

router.get('/', asyncHandler(async (req, res) => {
  const take = Math.min(Number(req.query.limit) || 50, 100);
  const sales = await prisma.sale.findMany({ take, orderBy: { createdAt: 'desc' }, include: { items: { include: { product: true } } } });
  res.json(sales);
}));

router.get('/:id', asyncHandler(async (req, res) => {
  const sale = await prisma.sale.findUnique({ where: { id: Number(req.params.id) }, include: { items: { include: { product: true } } } });
  if (!sale) throw new AppError(404, 'Venta no encontrada');
  res.json(sale);
}));

router.post('/', asyncHandler(async (req, res) => {
  const data = saleSchema.parse(req.body);
  const grouped = new Map<number, number>();
  data.items.forEach((item) => grouped.set(item.productId, (grouped.get(item.productId) ?? 0) + item.quantity));

  const sale = await prisma.$transaction(async (tx) => {
    const productIds = [...grouped.keys()];
    const products = await tx.product.findMany({ where: { id: { in: productIds }, active: true } });
    if (products.length !== productIds.length) throw new AppError(404, 'Uno o más productos no existen');
    for (const product of products) {
      const requested = grouped.get(product.id)!;
      if (product.stock < requested) throw new AppError(409, `Stock insuficiente para ${product.name}`);
    }
    const total = products.reduce((sum, product) => sum + Number(product.price) * grouped.get(product.id)!, 0);
    const receiptCode = `V-${Date.now().toString().slice(-8)}`;
    const created = await tx.sale.create({
      data: {
        receiptCode,
        customer: data.customer || null,
        paymentType: data.paymentType,
        total,
        items: { create: products.map((product) => ({
          productId: product.id,
          quantity: grouped.get(product.id)!,
          unitPrice: product.price,
          subtotal: Number(product.price) * grouped.get(product.id)!,
        })) },
      },
      include: { items: { include: { product: true } } },
    });
    for (const product of products) {
      await tx.product.update({ where: { id: product.id }, data: { stock: { decrement: grouped.get(product.id)! } } });
    }
    await tx.cashMovement.create({ data: { type: 'INCOME', category: 'Venta', description: `Venta ${receiptCode}`, amount: total, saleId: created.id } });
    return created;
  });
  res.status(201).json(sale);
}));

export default router;

