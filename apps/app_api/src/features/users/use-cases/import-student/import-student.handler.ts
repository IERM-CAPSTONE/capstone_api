import { Injectable, Inject, Logger } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { RABBITMQ_CLIENTS, MESSAGE_PATTERNS, UserImportJobData } from '@app/queue';

@Injectable()
export class ImportStudentHandler {
    private readonly logger = new Logger(ImportStudentHandler.name);

    constructor(
        @Inject(RABBITMQ_CLIENTS.USER_SERVICE)
        private readonly userServiceClient: ClientProxy,
    ) { }

    async handle(file: Express.Multer.File): Promise<{ message: string }> {
        this.logger.log(`📤 Sending import-student job for file: ${file.originalname}`);

        const jobData: UserImportJobData = {
            fileName: file.originalname,
            fileContent: file.buffer.toString('base64'),
            mimeType: file.mimetype,
        };

        // Emit message to RabbitMQ (Fire and forget, or use send for Request-Response)
        // Since processing can take time, emit/fire-and-forget is usually better for background jobs
        this.userServiceClient.emit(MESSAGE_PATTERNS.USER.IMPORT_STUDENTS, jobData);

        return {
            message: 'file is processing'
        };
    }
}
