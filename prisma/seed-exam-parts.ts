import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as dotenv from 'dotenv';
import * as path from 'path';

const envFile = process.env.NODE_ENV === 'production' ? '.env.production' : '.env.development';
dotenv.config({ path: path.join(process.cwd(), envFile) });

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
    console.log('🌱 Seeding Exam Types...');

    const examParts = [
        { code: 'FE', name: 'Final Exam', description: 'Final Examination' },
        { code: 'PE', name: 'Practical Exam', description: 'Practical Examination' },
        { code: 'TE', name: 'Test', description: 'Regular Test' },
        { code: 'R', name: 'Reading', description: 'Reading Component' },
        { code: 'L', name: 'Listening', description: 'Listening Component' },
        { code: 'W', name: 'Writing', description: 'Writing Component' },
        { code: 'S', name: 'Speaking', description: 'Speaking Component' },
        { code: 'MC', name: 'Multiple Choice', description: 'Multiple Choice Questions' },
    ];

    for (const type of examParts) {
        await prisma.examPart.upsert({
            where: { code: type.code },
            update: type,
            create: type,
        });
    }

    console.log('✅ Exam Types seeded successfully!');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
        await pool.end();
    });
