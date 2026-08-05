import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = (globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error']
})).$extends({
  query: {
    $allModels: {
      async deleteMany({ model, operation, args, query }) {
        if (!args.where || Object.keys(args.where).length === 0) {
          throw new Error(`Safety Violation: Attempted to perform a global ${operation} on ${model} without a where clause. This is blocked to prevent accidental data wipes.`);
        }
        return query(args);
      }
    }
  }
}) as PrismaClient;

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}