import "dotenv/config";
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@prisma/client'

const connectionString = `${process.env.DATABASE_URL}`

declare global {
    var prisma: PrismaClient | undefined;
}

const adapter = new PrismaPg({ connectionString })
export const prisma = globalThis.prisma || new PrismaClient({ adapter });
if (process.env.NODE_ENV !== 'production') globalThis.prisma = prisma;

export default prisma;