import { Inject, Injectable } from '@nestjs/common';
import { IProctorApplicationRepository, PROCTOR_APPLICATION_REPOSITORY } from '@app/proctor-applications';
import { ProctorApplicationResponse, toProctorApplicationResponse } from '../../shared/proctor-application.response';
import { UpdateProctorApplicationStatusDto } from './update-status.dto';

@Injectable()
export class UpdateProctorApplicationStatusHandler {
    constructor(
        @Inject(PROCTOR_APPLICATION_REPOSITORY)
        private readonly repository: IProctorApplicationRepository,
    ) { }

    async execute(id: string, dto: UpdateProctorApplicationStatusDto): Promise<ProctorApplicationResponse> {
        // Find existing application
        const application = await this.repository.findById(id);
        if (!application) {
            throw new Error('Application not found');
        }

        // Update status using domain method
        const updatedApplication = application.updateStatus(dto.status);

        // Persist
        const saved = await this.repository.save(updatedApplication);

        return toProctorApplicationResponse(saved);
    }
}
