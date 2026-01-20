import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const sessions = await prisma.examSession.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: { examRoom: true }
    });

    console.log(JSON.stringify(sessions, null, 2));
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
