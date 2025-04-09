import { PrismaClient } from '@prisma/client';

// Create PrismaClient instance with error logging
const prismaClientSingleton = () => {
  return new PrismaClient({
    log: ['error'],
  });
};

type PrismaClientSingleton = ReturnType<typeof prismaClientSingleton>;

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClientSingleton | undefined;
};

// Use existing instance to avoid multiple instances in development
export const prisma = globalForPrisma.prisma ?? prismaClientSingleton();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma; 