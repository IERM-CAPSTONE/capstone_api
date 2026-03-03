import { Injectable, Inject, Logger } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import type { Express } from 'express';
import { RABBITMQ_CLIENTS, MESSAGE_PATTERNS, ExamImportJobData } from '@app/queue';

@Injectable()
export class ImportSubjectsHandler {
    private readonly logger = new Logger(ImportSubjectsHandler.name);

    constructor(
        @Inject(RABBITMQ_CLIENTS.EXAM_SERVICE)
        private readonly examServiceClient: ClientProxy,
    ) { }

    async handle(file: Express.Multer.File): Promise<{ message: string }> {
        this.logger.log(`📤 Sending import-subjects job for file: ${file.originalname}`);

        const jobData: ExamImportJobData = {
            fileName: file.originalname,
            fileContent: file.buffer.toString('base64'),
            mimeType: file.mimetype,
        };

        // Emit message to RabbitMQ
        this.examServiceClient.emit(MESSAGE_PATTERNS.EXAM.IMPORT_SUBJECTS, jobData);

        return {
            message: 'Subject import file is processing',
        };
    }
}
