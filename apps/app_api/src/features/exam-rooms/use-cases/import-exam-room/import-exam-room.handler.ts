import { Injectable, Inject, Logger } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { RABBITMQ_CLIENTS, MESSAGE_PATTERNS, ExamImportJobData } from '@app/queue';

@Injectable()
export class ImportExamRoomHandler {
    private readonly logger = new Logger(ImportExamRoomHandler.name);

    constructor(
        @Inject(RABBITMQ_CLIENTS.EXAM_SERVICE)
        private readonly examServiceClient: ClientProxy,
    ) { }

    async handle(file: Express.Multer.File): Promise<{ message: string }> {
        this.logger.log(`📤 Sending import-exam-room job for file: ${file.originalname}`);

        const jobData: ExamImportJobData = {
            fileName: file.originalname,
            fileContent: file.buffer.toString('base64'),
            mimeType: file.mimetype,
        };

        // Emit message to RabbitMQ
        this.examServiceClient.emit(MESSAGE_PATTERNS.EXAM.IMPORT_ROOMS, jobData);

        return {
            message: 'Exam room import file is processing'
        };
    }
}
