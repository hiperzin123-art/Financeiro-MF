import { PrismaClient } from '@prisma/client';
import path from 'path';

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

// Na Vercel (servidor Linux serverless), o caminho relativo precisa ser resolvido para o diretório de execução
const dbPath = path.join(process.cwd(), 'prisma', 'financeiro.db');

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    datasources: {
      db: {
        url: `file:${dbPath}`,
      },
    },
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
