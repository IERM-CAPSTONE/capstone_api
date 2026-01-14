import { Injectable, Inject, Logger } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { RABBITMQ_CLIENTS, MESSAGE_PATTERNS, ExamImportJobData } from '@app/queue';

@Injectable()
export class ImportExamSessionHandler {
    private readonly logger = new Logger(ImportExamSessionHandler.name);

    constructor(
        @Inject(RABBITMQ_CLIENTS.EXAM_SERVICE)
        private readonly examServiceClient: ClientProxy,
    ) { }

    async handle(file: Express.Multer.File): Promise<{ message: string }> {
        this.logger.log(`📤 Sending import-exam-session job for file: ${file.originalname}`);

        const jobData: ExamImportJobData = {
            fileName: file.originalname,
            fileContent: file.buffer.toString('base64'),
            mimeType: file.mimetype,
        };

        // Emit message to RabbitMQ
        this.examServiceClient.emit(MESSAGE_PATTERNS.EXAM.IMPORT_SESSION, jobData);

        return {
            message: 'Exam schedule import file is processing'
        };
    }
}
