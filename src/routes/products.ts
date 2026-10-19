import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { AppError, asyncHandler } from '../lib/http';

const router = Router();
const productSchema = z.object({
  name: z.string().trim().min(2),
  sku: z.string().trim().min(2).transform((value) => value.toUpperCase()),
  category: z.string().trim().min(2),
  price: z.coerce.number().positive(),
  cost: z.coerce.number().min(0),
  stock: z.coerce.number().int().min(0),
  minStock: z.coerce.number().int().min(0),
  active: z.boolean().optional(),
});

router.get('/', asyncHandler(async (req, res) => {
  const search = String(req.query.search ?? '').trim();
  const lowStock = req.query.lowStock === 'true';
  const products = await prisma.product.findMany({
    where: {
      active: true,
      ...(search ? { OR: [
        { name: { contains: search, mode: 'insensitive' } },
        { sku: { contains: search, mode: 'insensitive' } },
        { category: { contains: search, mode: 'insensitive' } },
      ] } : {}),
    },
    orderBy: { name: 'asc' },
  });
  res.json(lowStock ? products.filter((item) => item.stock <= item.minStock) : products);
}));

router.post('/', asyncHandler(async (req, res) => {
  const data = productSchema.parse(req.body);
  const product = await prisma.product.create({ data });
  res.status(201).json(product);
}));

router.put('/:id', asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) throw new AppError(400, 'Identificador inválido');
  const product = await prisma.product.update({ where: { id }, data: productSchema.parse(req.body) });
  res.json(product);
}));

router.delete('/:id', asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) throw new AppError(400, 'Identificador inválido');
  await prisma.product.update({ where: { id }, data: { active: false } });
  res.status(204).send();
}));

router.patch('/:id/stock', asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  const parsed = z.object({ quantity: z.coerce.number().int(), reason: z.string().trim().min(2) }).parse(req.body);
  const current = await prisma.product.findUnique({ where: { id } });
  if (!current) throw new AppError(404, 'Producto no encontrado');
  if (current.stock + parsed.quantity < 0) throw new AppError(409, 'El ajuste dejaría el stock en negativo');
  const product = await prisma.product.update({ where: { id }, data: { stock: { increment: parsed.quantity } } });
  res.json({ ...product, adjustmentReason: parsed.reason });
}));

export default router;

