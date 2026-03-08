import { PrismaClient, Campus } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as xlsx from 'xlsx';
import * as dotenv from 'dotenv';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';

const envFile = process.env.NODE_ENV === 'production' ? '.env.production' : '.env.development';
dotenv.config({ path: path.join(process.cwd(), envFile) });

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
    const filePath = '/home/phuc/FPT/Code/Copy of DL test tool (1).xlsx';
    console.log(`🚀 Importing subjects from: ${filePath}`);

    const workbook = xlsx.readFile(filePath);

    // Find our main semester SP26
    const semester = await prisma.semester.findFirst({
        where: { code: 'SP26' }
    });

    if (!semester) {
        console.error('❌ Semester SP26 not found!');
        return;
    }

    const mcPart = await prisma.examPart.findFirst({
        where: { code: 'MC' }
    });

    if (!mcPart) {
        console.error('❌ ExamPart MC not found! Please seed exam parts first.');
        return;
    }

    const uniqueSubjectCodes = new Set<string>();

    for (const sheetName of workbook.SheetNames) {
        const worksheet = workbook.Sheets[sheetName];
        const data: any[] = xlsx.utils.sheet_to_json(worksheet);

        for (const row of data) {
            const subjectCode = (row.SubCode || row.SubjectCode || row.subjectCode || '').trim();
            if (subjectCode) {
                uniqueSubjectCodes.add(subjectCode);
            }
        }
    }

    console.log(`Found ${uniqueSubjectCodes.size} subjects to create/update.`);

    for (const code of Array.from(uniqueSubjectCodes)) {
        try {
            const subject = await prisma.subject.upsert({
                where: { code: code },
                update: {
                    semesterId: semester.id,
                },
                create: {
                    id: uuidv4(),
                    code: code,
                    name: `Subject ${code}`,
                    semesterId: semester.id,
                }
            });

            // Create MC part for each subject
            await prisma.subjectPart.upsert({
                where: {
                    subjectId_examPartId: {
                        subjectId: subject.id,
                        examPartId: mcPart.id
                    }
                },
                update: {
                    duration: 60
                },
                create: {
                    id: uuidv4(),
                    subjectId: subject.id,
                    examPartId: mcPart.id,
                    duration: 60
                }
            });

            console.log(`✅ ${code} imported.`);
        } catch (err: any) {
            console.error(`❌ Error importing ${code}: ${err.message}`);
        }
    }

    console.log('🎉 Done!');
}

main()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
        await pool.end();
    });
