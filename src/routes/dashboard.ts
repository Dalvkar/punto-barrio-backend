import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { asyncHandler } from '../lib/http';

const router = Router();

router.get('/', asyncHandler(async (_req, res) => {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const week = new Date(today); week.setDate(week.getDate() - 6);
  const [products, todaySales, recentSales, weeklySales, todayCashMovements] = await Promise.all([
    prisma.product.findMany({ where: { active: true }, orderBy: { stock: 'asc' } }),
    prisma.sale.findMany({ where: { createdAt: { gte: today } } }),
    prisma.sale.findMany({ take: 5, orderBy: { createdAt: 'desc' }, include: { items: true } }),
    prisma.sale.findMany({ where: { createdAt: { gte: week } }, orderBy: { createdAt: 'asc' } }),
    prisma.cashMovement.findMany({
      where: { type: 'INCOME', createdAt: { gte: today } },
      select: { amount: true },
    }),
  ]);
  const daily = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(week); date.setDate(week.getDate() + index);
    const key = date.toISOString().slice(0, 10);
    return {
      date: key,
      label: new Intl.DateTimeFormat('es', { weekday: 'short' }).format(date),
      total: weeklySales.filter((sale) => sale.createdAt.toISOString().slice(0, 10) === key).reduce((sum, sale) => sum + Number(sale.total), 0),
    };
  });
  res.json({
    todayRevenue: todaySales.reduce((sum, sale) => sum + Number(sale.total), 0),
    todayCashIncome: todayCashMovements.reduce((sum, movement) => sum + Number(movement.amount), 0),
    todaySales: todaySales.length,
    activeProducts: products.length,
    inventoryValue: products.reduce((sum, product) => sum + Number(product.cost) * product.stock, 0),
    lowStock: products.filter((product) => product.stock <= product.minStock).slice(0, 6),
    recentSales,
    weeklySales: daily,
  });
}));

export default router;

