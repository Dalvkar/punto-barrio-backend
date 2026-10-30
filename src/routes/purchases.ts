import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { AppError, asyncHandler } from '../lib/http';

const router = Router();

const purchaseSchema = z.object({
  supplierId: z.coerce.number().int().positive(),
  invoiceNumber: z.string().trim().optional(),
  items: z.array(z.object({
    productId: z.coerce.number().int().positive(),
    quantity: z.coerce.number().int().positive(),
    unitCost: z.coerce.number().positive(),
  })).min(1),
}).superRefine((data, ctx) => {
  const productIds = data.items.map((item) => item.productId);
  if (new Set(productIds).size !== productIds.length) {
    ctx.addIssue({ code: 'custom', path: ['items'], message: 'Cada producto debe aparecer una sola vez' });
  }
});

router.get('/', asyncHandler(async (req, res) => {
  const take = Math.min(Number(req.query.limit) || 50, 100);
  const purchases = await prisma.purchase.findMany({
    take,
    orderBy: { createdAt: 'desc' },
    include: { supplier: true, items: { include: { product: true } } },
  });
  res.json(purchases);
}));

router.post('/', asyncHandler(async (req, res) => {
  const data = purchaseSchema.parse(req.body);
  const purchase = await prisma.$transaction(async (tx) => {
    const supplier = await tx.supplier.findFirst({ where: { id: data.supplierId, active: true } });
    if (!supplier) throw new AppError(404, 'Proveedor no encontrado');

    const productIds = data.items.map((item) => item.productId);
    const products = await tx.product.findMany({ where: { id: { in: productIds }, active: true } });
    if (products.length !== productIds.length) throw new AppError(404, 'Uno o más productos no existen');

    const total = data.items.reduce((sum, item) => sum + item.quantity * item.unitCost, 0);
    const created = await tx.purchase.create({
      data: {
        supplierId: data.supplierId,
        invoiceNumber: data.invoiceNumber || null,
        total,
        items: {
          create: data.items.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            unitCost: item.unitCost,
            subtotal: item.quantity * item.unitCost,
          })),
        },
      },
      include: { supplier: true, items: { include: { product: true } } },
    });

    for (const item of data.items) {
      await tx.product.update({
        where: { id: item.productId },
        data: { stock: { increment: item.quantity }, cost: item.unitCost },
      });
    }
    await tx.cashMovement.create({
      data: {
        type: 'EXPENSE',
        category: 'Proveedores',
        description: `Compra ${data.invoiceNumber || `#${created.id}`}`,
        amount: total,
      },
    });
    return created;
  });
  res.status(201).json(purchase);
}));

export default router;
