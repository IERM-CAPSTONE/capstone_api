
import { PrismaClient } from '@prisma/client';

async function main() {
    const prisma = new PrismaClient();
    try {
        const res = await prisma.examRoom.create({
            data: {
                roomNumber: 999,
                capacity: 99
            }
        });
        console.log('Success:', res);
    } catch (e) {
        console.error('Error:', e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
