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

// For backward compatibility with previous code
export const createSupabaseClient = () => {
  console.warn('Using createSupabaseClient is deprecated. Use prisma directly instead.');
  return {
    // Minimal implementation to make existing code work
    from: (table: string) => ({
      select: () => ({
        eq: () => ({
          single: async () => ({ data: null, error: new Error('Not implemented') }),
          order: () => ({ data: [], error: null }),
        }),
        order: () => ({
          data: [],
          error: null,
        }),
      }),
      insert: () => ({ error: new Error('Not implemented') }),
      update: () => ({ error: new Error('Not implemented') }),
      delete: () => ({ error: new Error('Not implemented') }),
    }),
  };
}; 