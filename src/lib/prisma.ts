import { PrismaClient } from '@prisma/client';

export let prisma = new PrismaClient();

export const replacePrismaClient = (client: PrismaClient) => {
  if (process.env.NODE_ENV !== 'test') {
    throw new Error('El cliente Prisma solo puede sustituirse durante las pruebas');
  }
  prisma = client;
};

