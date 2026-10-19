import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { asyncHandler } from '../lib/http';

const router = Router();

router.get('/', asyncHandler(async (req, res) => {
  const to = req.query.to ? new Date(String(req.query.to)) : new Date();
  to.setHours(23, 59, 59, 999);
  const from = req.query.from ? new Date(String(req.query.from)) : new Date(to.getFullYear(), to.getMonth(), 1);
  from.setHours(0, 0, 0, 0);
  const sales = await prisma.sale.findMany({ where: { createdAt: { gte: from, lte: to } }, include: { items: { include: { product: true } } } });
  const productMap = new Map<string, { name: string; units: number; revenue: number }>();
  sales.flatMap((sale) => sale.items).forEach((item) => {
    const current = productMap.get(item.product.name) ?? { name: item.product.name, units: 0, revenue: 0 };
    current.units += item.quantity; current.revenue += Number(item.subtotal); productMap.set(item.product.name, current);
  });
  const revenue = sales.reduce((sum, sale) => sum + Number(sale.total), 0);
  const cost = sales.flatMap((sale) => sale.items).reduce((sum, item) => sum + Number(item.product.cost) * item.quantity, 0);
  res.json({ from, to, revenue, salesCount: sales.length, averageTicket: sales.length ? revenue / sales.length : 0, estimatedProfit: revenue - cost, topProducts: [...productMap.values()].sort((a, b) => b.units - a.units).slice(0, 8) });
}));

export default router;

