import { Injectable, Logger } from '@nestjs/common';
import * as ExcelJS from 'exceljs';
import { Response } from 'express';

@Injectable()
export class DownloadAutoGenerateTemplatesHandler {
    private readonly logger = new Logger(DownloadAutoGenerateTemplatesHandler.name);

    async execute(type: 'proctor' | 'registration' | 'course', res: Response) {
        this.logger.log(`Generating auto-generate template for type: ${type}`);

        const workbook = new ExcelJS.Workbook();
        workbook.creator = 'IERM - FPTU';
        workbook.created = new Date();

        let filename = '';
        const worksheet = workbook.addWorksheet('Template');

        if (type === 'proctor') {
            filename = 'ProctorList_Template.csv';
            worksheet.columns = [
                { header: 'email', key: 'email', width: 30 }
            ];
            worksheet.addRow({ email: 'proctor1@fpt.edu.vn' });
            worksheet.addRow({ email: 'proctor2@fpt.edu.vn' });

            // For CSV, we'll write to a buffer and send
            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
            const buffer = await workbook.csv.writeBuffer();
            return res.send(buffer);
        } else if (type === 'registration') {
            filename = 'RegistrationList_Template.csv';
            worksheet.columns = [
                { header: 'Roll', key: 'roll', width: 15 },
                { header: 'SubCode', key: 'subCode', width: 15 },
                { header: 'Login', key: 'login', width: 25 },
                { header: 'ExamType', key: 'examType', width: 15 },
                { header: 'Online', key: 'online', width: 10 },
            ];
            worksheet.addRow({
                roll: 'DE180496',
                subCode: 'ACC101',
                login: 'ManhLHTDE180496',
                examType: 'FE',
                online: '',
            });

            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
            const buffer = await workbook.csv.writeBuffer();
            return res.send(buffer);
        } else if (type === 'course') {
            filename = 'ClassSchedule_Template.xlsx';
            // Match AutoGenerateScheduleProcessor parseClassSchedule expectations
            worksheet.columns = [
                { header: 'RollNumber', key: 'rollNumber', width: 15 },
                { header: 'Date', key: 'date', width: 15 },
                { header: 'Slot', key: 'slot', width: 10 },
            ];
            worksheet.addRow({
                rollNumber: 'DE180496',
                date: '2026-05-15',
                slot: 1,
            });
        }

        // Style Header Row
        const headerRow = worksheet.getRow(1);
        headerRow.height = 22;
        headerRow.eachCell((cell) => {
            cell.font = { bold: true, size: 11, color: { argb: 'FFFFFFFF' } };
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2E5FA3' } };
            cell.alignment = { vertical: 'middle', horizontal: 'center' };
            cell.border = {
                top: { style: 'thin' }, left: { style: 'thin' },
                bottom: { style: 'thin' }, right: { style: 'thin' }
            };
        });

        worksheet.views = [{ state: 'frozen', xSplit: 0, ySplit: 1 }];

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

        await workbook.xlsx.write(res);
        res.end();
    }
}
