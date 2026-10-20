import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { asyncHandler } from '../lib/http';

const router = Router();

const startOfToday = () => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; };

router.get('/', asyncHandler(async (req, res) => {
  const date = req.query.date ? new Date(String(req.query.date)) : startOfToday();
  date.setHours(0, 0, 0, 0);
  const end = new Date(date); end.setDate(end.getDate() + 1);
  const movements = await prisma.cashMovement.findMany({ where: { createdAt: { gte: date, lt: end } }, orderBy: { createdAt: 'desc' } });
  const income = movements.filter((m) => m.type === 'INCOME').reduce((s, m) => s + Number(m.amount), 0);
  const expenses = movements.filter((m) => m.type === 'EXPENSE').reduce((s, m) => s + Number(m.amount), 0);
  res.json({ movements, income, expenses, balance: income - expenses });
}));

router.post('/movements', asyncHandler(async (req, res) => {
  const data = z.object({
    type: z.enum(['INCOME', 'EXPENSE']), category: z.string().trim().min(2),
    description: z.string().trim().min(2), amount: z.coerce.number().positive(),
  }).parse(req.body);
  const movement = await prisma.cashMovement.create({ data });
  res.status(201).json(movement);
}));

router.post('/close', asyncHandler(async (req, res) => {
  const data = z.object({ openingBalance: z.coerce.number().min(0), actualAmount: z.coerce.number().min(0), notes: z.string().optional() }).parse(req.body);
  const start = startOfToday();
  const movements = await prisma.cashMovement.findMany({ where: { createdAt: { gte: start } } });
  const net = movements.reduce((sum, movement) => sum + (movement.type === 'INCOME' ? Number(movement.amount) : -Number(movement.amount)), 0);
  const expectedAmount = data.openingBalance + net;
  const closing = await prisma.cashClosing.create({ data: { ...data, notes: data.notes || null, expectedAmount, difference: data.actualAmount - expectedAmount } });
  res.status(201).json(closing);
}));

export default router;

// hola
