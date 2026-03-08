import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@app/prisma';
import * as ExcelJS from 'exceljs';
import { Response } from 'express';
import { ExportExamSessionsDto } from './export-exam-sessions.dto';
import { format } from 'date-fns';

@Injectable()
export class ExportExamSessionsHandler {
    private readonly logger = new Logger(ExportExamSessionsHandler.name);

    constructor(private readonly prisma: PrismaService) { }

    async execute(dto: ExportExamSessionsDto, res: Response) {
        this.logger.log(`Exporting exam sessions for semester: ${dto.semesterId}`);

        // 1. Build Query
        const where: any = {};
        if (dto.semesterId) where.semesterId = dto.semesterId;
        if (dto.campus) where.campus = dto.campus;
        if (dto.examType) where.examType = dto.examType;
        if (dto.fromDate || dto.toDate) {
            where.examOpenTime = {};
            if (dto.fromDate) where.examOpenTime.gte = new Date(dto.fromDate);
            if (dto.toDate) where.examOpenTime.lte = new Date(dto.toDate);
        }

        // 2. Fetch Data
        const studentExams: any[] = await this.prisma.studentExam.findMany({
            where: { examSession: where },
            include: {
                student: true,
                examSession: {
                    include: {
                        examRoom: true,
                        examParts: true,
                    }
                },
                parts: {
                    include: { examPart: true }
                }
            },
            orderBy: [
                { examSession: { examOpenTime: 'asc' } },
                { examSession: { examRoom: { roomNumber: 'asc' } } },
                { stt: 'asc' }
            ]
        });

        // 3. Create Excel
        const workbook = new ExcelJS.Workbook();
        workbook.creator = 'IERM - FPTU';
        workbook.created = new Date();

        const worksheet = workbook.addWorksheet('Student Report');

        // Define columns (template minus CCCD and USB)
        worksheet.columns = [
            { header: 'Ca thi', key: 'session', width: 38 },
            { header: 'Mã SV', key: 'studentCode', width: 14 },
            { header: 'MemberCode', key: 'username', width: 22 },
            { header: 'Họ tên', key: 'fullName', width: 28 },
            { header: 'STT', key: 'stt', width: 6 },
            { header: 'Môn thi', key: 'subject', width: 14 },
            { header: 'Điểm danh', key: 'attendance', width: 22 },
            { header: 'Ghi chú điểm danh', key: 'attendanceNote', width: 22 },
            { header: 'Nộp bài', key: 'submission', width: 22 },
            { header: 'Ghi chú nộp bài', key: 'submissionNote', width: 22 },
            { header: 'Nộp bài phần thi', key: 'partSubmission', width: 26 },
            { header: 'Chữ ký phần thi', key: 'partSignature', width: 26 },
            { header: 'Điểm', key: 'grade', width: 10 },
            { header: 'Ghi chú', key: 'note', width: 20 },
        ];

        // Style Header Row
        const headerRow = worksheet.getRow(1);
        headerRow.height = 22;
        headerRow.eachCell((cell) => {
            cell.font = { bold: true, size: 11, color: { argb: 'FFFFFFFF' } };
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2E5FA3' } };
            cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
            cell.border = {
                top: { style: 'thin' }, left: { style: 'thin' },
                bottom: { style: 'thin' }, right: { style: 'thin' }
            };
        });

        // 4. Fill Data rows
        let rowIndex = 2;
        for (const se of studentExams) {
            const session = se.examSession;
            const openTime: Date = session.examOpenTime;
            const closeTime: Date = session.examCloseTime;
            const roomName: string = session.examRoom?.roomNumber || 'N/A';

            // Format: 26/12/2025.13h30-15h00.ALPHA 201
            const caThi = `${format(openTime, 'dd/MM/yyyy')}.${format(openTime, 'HH')}h${format(openTime, 'mm')}-${format(closeTime, 'HH')}h${format(closeTime, 'mm')}.${roomName}`;

            const row = worksheet.addRow({
                session: caThi,
                studentCode: se.student.code,
                username: se.student.username || se.student.code,
                fullName: se.student.fullName,
                stt: se.stt ?? se.seatNumber,
                subject: session.subjectCode,
                attendance: null,
                attendanceNote: null,
                submission: null,
                submissionNote: null,
                partSubmission: null,
                partSignature: null,
                grade: null,
                note: null,
            });

            // Alternating row color
            const isEven = (rowIndex % 2 === 0);
            row.eachCell({ includeEmpty: true }, (cell) => {
                cell.alignment = { vertical: 'middle', horizontal: 'left' };
                cell.border = {
                    top: { style: 'hair' }, left: { style: 'thin' },
                    bottom: { style: 'hair' }, right: { style: 'thin' }
                };
                if (isEven) {
                    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF2F6FF' } };
                }
            });
            rowIndex++;
        }

        // Freeze first row & enable auto-filter
        worksheet.views = [{ state: 'frozen', xSplit: 0, ySplit: 1 }];
        worksheet.autoFilter = {
            from: { row: 1, column: 1 },
            to: { row: 1, column: worksheet.columns.length }
        };

        // 5. Send Response
        const filename = `StudentReport_${format(new Date(), 'dd-MM-yyyy_HH-mm-ss')}.xlsx`;
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

        this.logger.log(`Exporting ${studentExams.length} rows → ${filename}`);
        await workbook.xlsx.write(res);
        res.end();
    }
}
