import { Injectable, Inject, Logger } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { RABBITMQ_CLIENTS, MESSAGE_PATTERNS, ImportProctorJobData } from '@app/queue';
import { ImportProctorDto } from './import-proctor.dto';

@Injectable()
export class ImportProctorHandler {
    private readonly logger = new Logger(ImportProctorHandler.name);

    constructor(
        @Inject(RABBITMQ_CLIENTS.EXAM_SERVICE)
        private readonly examServiceClient: ClientProxy,
    ) { }

    async handle(dto: ImportProctorDto, creatorId?: string) {
        this.logger.log(`Publishing import proctor job to queue. Proctors: ${dto.proctors.length}`);

        const jobData: ImportProctorJobData = {
            importType: dto.importType,
            proctors: dto.proctors,
            creatorId: creatorId,
            batchId: dto.batchId,
            totalItems: dto.totalItems,
        };

        this.examServiceClient.emit(MESSAGE_PATTERNS.EXAM.IMPORT_PROCTORS, jobData);

        return {
            success: true,
            message: 'Import proctor job has been queued for processing',
            data: {
                proctorsReceived: dto.proctors.length,
            }
        };
    }
}
