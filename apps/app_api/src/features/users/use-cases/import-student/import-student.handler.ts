import { Inject, Injectable, Logger } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import type { Express } from 'express';
import { MESSAGE_PATTERNS, RABBITMQ_CLIENTS, UserImportJobData } from '@app/queue';

@Injectable()
export class ImportStudentHandler {
    private readonly logger = new Logger(ImportStudentHandler.name);

    constructor(
        @Inject(RABBITMQ_CLIENTS.USER_SERVICE)
        private readonly userServiceClient: ClientProxy,
    ) { }

    async handle(file: Express.Multer.File): Promise<{ message: string }> {
        this.logger.log(`Sending import-account job for file: ${file.originalname}`);

        const jobData: UserImportJobData = {
            fileName: file.originalname,
            fileContent: file.buffer.toString('base64'),
            mimeType: file.mimetype,
        };

        this.userServiceClient.emit(MESSAGE_PATTERNS.USER.IMPORT_STUDENTS, jobData);

        return {
            message: 'Account import is being processed',
        };
    }
}
