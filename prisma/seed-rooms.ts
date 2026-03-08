import { PrismaClient, Campus } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as dotenv from 'dotenv';
import * as path from 'path';

const envFile = process.env.NODE_ENV === 'production' ? '.env.production' : '.env.development';
dotenv.config({ path: path.join(process.cwd(), envFile) });

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);

const prisma = new PrismaClient({
    adapter,
    log: ['error', 'warn']
});

async function main() {
    console.log('Seeding rooms...');

    const campuses = [Campus.HN, Campus.HCM, Campus.DN, Campus.QN, Campus.CT];

    for (const campus of campuses) {
        console.log(`Seeding rooms for campus: ${campus}`);

        // Create 10 rooms per campus
        for (let i = 1; i <= 15; i++) {
            const roomNumber = `${campus}-${100 + i}`;
            await prisma.examRoom.upsert({
                where: { roomNumber: roomNumber },
                update: {
                    campus: campus,
                    capacity: 30,
                    max_rows: 6,
                    max_columns: 5,
                    status: 'Available'
                },
                create: {
                    roomNumber: roomNumber,
                    campus: campus,
                    capacity: 30,
                    max_rows: 6,
                    max_columns: 5,
                    status: 'Available'
                }
            });
        }
    }

    console.log('Seeding rooms completed.');
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
