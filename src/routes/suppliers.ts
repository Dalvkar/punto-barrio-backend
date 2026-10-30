import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { asyncHandler } from '../lib/http';

const router = Router();

const supplierSchema = z.object({
  name: z.string().trim().min(2),
  contactName: z.string().trim().optional(),
  phone: z.string().trim().optional(),
});

router.get('/', asyncHandler(async (req, res) => {
  const search = String(req.query.search ?? '').trim();
  const suppliers = await prisma.supplier.findMany({
    where: {
      active: true,
      ...(search ? {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { contactName: { contains: search, mode: 'insensitive' } },
          { phone: { contains: search, mode: 'insensitive' } },
        ],
      } : {}),
    },
    orderBy: { name: 'asc' },
  });
  res.json(suppliers);
}));

router.post('/', asyncHandler(async (req, res) => {
  const data = supplierSchema.parse(req.body);
  const supplier = await prisma.supplier.create({
    data: {
      ...data,
      contactName: data.contactName || null,
      phone: data.phone || null,
    },
  });
  res.status(201).json(supplier);
}));

export default router;
