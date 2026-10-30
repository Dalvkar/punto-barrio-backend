import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { asyncHandler } from '../lib/http';

const router = Router();

const customerSchema = z.object({
  name: z.string().trim().min(2),
  phone: z.string().trim().optional(),
  creditLimit: z.coerce.number().min(0),
});

router.get('/', asyncHandler(async (req, res) => {
  const search = String(req.query.search ?? '').trim();
  const customers = await prisma.customer.findMany({
    where: {
      active: true,
      ...(search ? {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { phone: { contains: search, mode: 'insensitive' } },
        ],
      } : {}),
    },
    orderBy: { name: 'asc' },
  });
  res.json(customers);
}));

router.post('/', asyncHandler(async (req, res) => {
  const data = customerSchema.parse(req.body);
  const customer = await prisma.customer.create({
    data: { ...data, phone: data.phone || null },
  });
  res.status(201).json(customer);
}));

export default router;
