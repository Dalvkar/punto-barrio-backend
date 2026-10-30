import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { AppError, asyncHandler } from '../lib/http';

const router = Router();

const creditSchema = z.object({
  customerId: z.coerce.number().int().positive(),
  items: z.array(z.object({
    productId: z.coerce.number().int().positive(),
    quantity: z.coerce.number().int().positive(),
  })).min(1),
});

router.get('/', asyncHandler(async (req, res) => {
  const take = Math.min(Number(req.query.limit) || 50, 100);
  const credits = await prisma.credit.findMany({
    take,
    orderBy: { createdAt: 'desc' },
    include: {
      customer: true,
      items: { include: { product: true } },
      payments: { orderBy: { createdAt: 'desc' } },
    },
  });
  res.json(credits);
}));

router.post('/', asyncHandler(async (req, res) => {
  const data = creditSchema.parse(req.body);
  const grouped = new Map<number, number>();
  data.items.forEach((item) => grouped.set(item.productId, (grouped.get(item.productId) ?? 0) + item.quantity));

  const credit = await prisma.$transaction(async (tx) => {
    const customer = await tx.customer.findFirst({ where: { id: data.customerId, active: true } });
    if (!customer) throw new AppError(404, 'Cliente no encontrado');

    const productIds = [...grouped.keys()];
    const products = await tx.product.findMany({ where: { id: { in: productIds }, active: true } });
    if (products.length !== productIds.length) throw new AppError(404, 'Uno o más productos no existen');
    for (const product of products) {
      if (product.stock < grouped.get(product.id)!) throw new AppError(409, `Stock insuficiente para ${product.name}`);
    }

    const total = products.reduce((sum, product) => sum + Number(product.price) * grouped.get(product.id)!, 0);
    if (Number(customer.balance) + total > Number(customer.creditLimit)) {
      throw new AppError(409, 'La venta supera el límite de crédito disponible del cliente');
    }

    const created = await tx.credit.create({
      data: {
        customerId: customer.id,
        total,
        balance: total,
        status: 'PENDING',
        items: {
          create: products.map((product) => ({
            productId: product.id,
            quantity: grouped.get(product.id)!,
            unitPrice: product.price,
            subtotal: Number(product.price) * grouped.get(product.id)!,
          })),
        },
      },
      include: { customer: true, items: { include: { product: true } }, payments: true },
    });

    for (const product of products) {
      await tx.product.update({
        where: { id: product.id },
        data: { stock: { decrement: grouped.get(product.id)! } },
      });
    }
    await tx.customer.update({ where: { id: customer.id }, data: { balance: { increment: total } } });
    return created;
  });
  res.status(201).json(credit);
}));

router.post('/:id/payments', asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) throw new AppError(400, 'Identificador inválido');
  const { amount } = z.object({ amount: z.coerce.number().positive() }).parse(req.body);

  const result = await prisma.$transaction(async (tx) => {
    const credit = await tx.credit.findUnique({ where: { id }, include: { customer: true } });
    if (!credit) throw new AppError(404, 'Fiado no encontrado');
    const currentBalance = Number(credit.balance);
    if (currentBalance <= 0) throw new AppError(409, 'El fiado ya está pagado');
    if (amount > currentBalance) throw new AppError(409, 'El abono no puede superar el saldo pendiente');

    const balance = currentBalance - amount;
    const payment = await tx.creditPayment.create({ data: { creditId: id, amount } });
    const updatedCredit = await tx.credit.update({
      where: { id },
      data: { balance, status: balance === 0 ? 'PAID' : 'PARTIAL' },
      include: { customer: true, items: { include: { product: true } }, payments: true },
    });
    await tx.customer.update({
      where: { id: credit.customerId },
      data: { balance: { decrement: amount } },
    });
    await tx.cashMovement.create({
      data: {
        type: 'INCOME',
        category: 'Cobro fiado',
        description: `Abono de ${credit.customer.name} al fiado #${id}`,
        amount,
      },
    });
    return { credit: updatedCredit, payment };
  });
  res.status(201).json(result);
}));

export default router;
