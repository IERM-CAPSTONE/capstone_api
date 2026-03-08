import { PrismaClient } from '@prisma/client';
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
    const filePath = '/home/phuc/FPT/Code/Subjects_To_Import.xlsx';
    console.log(`🚀 Importing subjects from: ${filePath}`);

    const workbook = xlsx.readFile(filePath);
    const examParts = await prisma.examPart.findMany();

    let successCount = 0;

    for (const sheetName of workbook.SheetNames) {
        const worksheet = workbook.Sheets[sheetName];
        const items: any[] = xlsx.utils.sheet_to_json(worksheet, { defval: null });
        console.log(`Processing sheet "${sheetName}" with ${items.length} rows.`);

        for (const item of items) {
            try {
                const keys = Object.keys(item);
                const findValue = (keywords: string[]) => {
                    const foundKey = keys.find(k => keywords.some(kw => String(k).toUpperCase().includes(kw.toUpperCase())));
                    return foundKey ? item[foundKey] : null;
                };

                const code = findValue(['MÃ MÔN', 'CODE']);
                if (!code) continue;

                const name = findValue(['TÊN MÔN', 'NAME']) ? String(findValue(['TÊN MÔN', 'NAME'])).replace(/\r\n/g, ' ') : null;
                const department = findValue(['BỘ MÔN', 'DEPARTMENT']) || null;
                const detailsStr = findValue(['CHI TIẾT', 'DETAILS', 'DETAIL']) || '';
                const totalDuration = parseInt(String(findValue(['TỔNG THỜI LƯỢNG', 'DURATION']))) || null;

                // Find Semester ID by sheet name
                const semStr = String(sheetName);
                let semEntity = await prisma.semester.findFirst({
                    where: {
                        OR: [
                            { code: semStr },
                            { name: semStr }
                        ]
                    }
                });

                if (!semEntity) {
                    // Create semester if not exists
                    semEntity = await prisma.semester.create({
                        data: {
                            id: uuidv4(),
                            code: semStr,
                            name: semStr,
                            startDate: new Date(),
                            endDate: new Date(new Date().getTime() + 90 * 24 * 60 * 60 * 1000),
                        }
                    });
                }

                // Upsert Subject
                const subject = await prisma.subject.upsert({
                    where: { code: String(code) },
                    update: {
                        name: name ? String(name) : undefined,
                        semesterId: semEntity.id,
                        department: department ? String(department) : undefined,
                    },
                    create: {
                        id: uuidv4(),
                        code: String(code),
                        name: name ? String(name) : null,
                        semesterId: semEntity.id,
                        department: department ? String(department) : null,
                    }
                });

                // Parse parts
                let parts = parseSubjectParts(String(detailsStr), examParts);

                // Re-map FE to MC and set duration to 60 as requested
                parts = parts.map(p => {
                    const examPart = examParts.find(ep => ep.id === p.examPartId);
                    if (examPart && examPart.code === 'FE') {
                        const mcPart = examParts.find(ep => ep.code === 'MC');
                        if (mcPart) {
                            return { examPartId: mcPart.id, duration: 60 };
                        }
                    }
                    return p;
                });

                if (parts.length > 0) {
                    await prisma.subjectPart.deleteMany({
                        where: { subjectId: subject.id }
                    });

                    for (const part of parts) {
                        await prisma.subjectPart.create({
                            data: {
                                id: uuidv4(),
                                subjectId: subject.id,
                                examPartId: part.examPartId,
                                duration: part.duration,
                            }
                        });
                    }
                    console.log(`✅ Subject ${code}: ${parts.length} parts created.`);
                } else {
                    // Force MC 60 for cases without details
                    const mcType = examParts.find(t => t.code === 'MC');
                    if (mcType) {
                        await prisma.subjectPart.deleteMany({ where: { subjectId: subject.id } });
                        await prisma.subjectPart.create({
                            data: {
                                id: uuidv4(),
                                subjectId: subject.id,
                                examPartId: mcType.id,
                                duration: 60,
                            }
                        });
                        console.log(`✅ Subject ${code}: Forced MC (60m).`);
                    }
                }
                successCount++;
            } catch (err: any) {
                console.error(`❌ Error subject import failed: ${err.message}`);
            }
        }
    }

    console.log(`🎉 Finished! Imported ${successCount} subjects.`);
}

function parseSubjectParts(details: string, examParts: any[]): { examPartId: string; duration: number }[] {
    if (!details) return [];
    const results: { examPartId: string; duration: number }[] = [];
    const regex = /(\d+)\.\s*([^:]+):\s*(\d+)(?:\s*(?:ph|phút|min))?/gi;
    let match;

    while ((match = regex.exec(details)) !== null) {
        const partName = match[2].trim().toLowerCase();
        let duration = parseInt(match[3]);

        let examPart = examParts.find(t =>
            t.name.toLowerCase().includes(partName) ||
            t.code.toLowerCase().includes(partName)
        );

        if (!examPart) {
            if (partName.includes('đọc')) examPart = examParts.find(t => t.code === 'R');
            else if (partName.includes('nghe')) examPart = examParts.find(t => t.code === 'L');
            else if (partName.includes('viết')) examPart = examParts.find(t => t.code === 'W');
            else if (partName.includes('nói')) examPart = examParts.find(t => t.code === 'S');
            else if (partName.includes('fe')) examPart = examParts.find(t => t.code === 'FE');
        }

        if (examPart) {
            // If it's FE or mapped to FE, change to MC and 60
            if (examPart.code === 'FE') {
                const mcPart = examParts.find(t => t.code === 'MC');
                if (mcPart) {
                    examPart = mcPart;
                    duration = 60;
                }
            }
            results.push({ examPartId: examPart.id, duration });
        }
    }
    return results;
}

main()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
        await pool.end();
    });
