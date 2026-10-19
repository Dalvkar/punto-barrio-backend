import 'dotenv/config';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import { Prisma } from '@prisma/client';
import { ZodError } from 'zod';
import productsRouter from './routes/products';
import salesRouter from './routes/sales';
import cashRouter from './routes/cash';
import dashboardRouter from './routes/dashboard';
import reportsRouter from './routes/reports';
import { AppError } from './lib/http';
import { prisma } from './lib/prisma';

const app = express();
const allowedOrigins = (process.env.FRONTEND_URL ?? 'http://localhost:5173').split(',').map((item) => item.trim());

app.use(helmet());
app.use(cors({ origin: allowedOrigins }));
app.use(express.json());
app.use(morgan('dev'));

app.get('/api/health', async (_req, res) => {
  await prisma.$queryRaw`SELECT 1`;
  res.json({ status: 'ok', service: 'Punto Barrio API', timestamp: new Date() });
});
app.use('/api/dashboard', dashboardRouter);
app.use('/api/products', productsRouter);
app.use('/api/sales', salesRouter);
app.use('/api/cash', cashRouter);
app.use('/api/reports', reportsRouter);

app.use((_req, res) => res.status(404).json({ message: 'Ruta no encontrada' }));
app.use((error: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(error);
  if (error instanceof ZodError) return res.status(400).json({ message: 'Datos inválidos', errors: error.issues });
  if (error instanceof AppError) return res.status(error.status).json({ message: error.message });
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === 'P2002') return res.status(409).json({ message: 'Ya existe un registro con esos datos' });
    if (error.code === 'P2025') return res.status(404).json({ message: 'Registro no encontrado' });
  }
  return res.status(500).json({ message: 'Ocurrió un error inesperado' });
});

const port = Number(process.env.PORT) || 4000;
app.listen(port, '0.0.0.0', () => console.log(`API disponible en http://localhost:${port}/api`));

