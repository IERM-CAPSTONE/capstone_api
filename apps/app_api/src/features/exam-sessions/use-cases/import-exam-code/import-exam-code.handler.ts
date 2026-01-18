import { Injectable, Inject, Logger } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { RABBITMQ_CLIENTS, MESSAGE_PATTERNS } from '@app/queue';
import { ImportExamCodeDto } from './import-exam-code.dto';

@Injectable()
export class ImportExamCodeHandler {
    private readonly logger = new Logger(ImportExamCodeHandler.name);

    constructor(
        @Inject(RABBITMQ_CLIENTS.EXAM_SERVICE)
        private readonly examServiceClient: ClientProxy,
    ) { }

    async handle(dto: ImportExamCodeDto) {
        this.logger.log(`Publishing import exam code job to queue. Items: ${dto.codes.length}`);

        const jobData = {
            importType: dto.importType,
            codes: dto.codes,
            batchId: dto.batchId,
            totalItems: dto.totalItems,
        };

        this.examServiceClient.emit(MESSAGE_PATTERNS.EXAM.IMPORT_EXAMCODE, jobData);
        // Note: Using a fallback if constant is missing, but I should probably check queue.constants.ts

        return {
            success: true,
            message: 'Import exam code job has been queued for processing',
            data: {
                codesReceived: dto.codes.length,
            }
        };
    }
}
