import { Inject, Injectable } from '@nestjs/common';
import { IProctorApplicationRepository, PROCTOR_APPLICATION_REPOSITORY } from '@app/proctor-applications';
import { ProctorApplicationResponse, toProctorApplicationResponse } from '../../shared/proctor-application.response';
import { UpdateProctorApplicationDto } from './update-application.dto';

@Injectable()
export class UpdateProctorApplicationHandler {
    constructor(
        @Inject(PROCTOR_APPLICATION_REPOSITORY)
        private readonly repository: IProctorApplicationRepository,
    ) { }

    async execute(id: string, dto: UpdateProctorApplicationDto, teacherId: string): Promise<ProctorApplicationResponse> {
        // Find existing application
        const application = await this.repository.findById(id);
        if (!application) {
            throw new Error('Application not found');
        }

        // Verify ownership
        if (application.teacherId !== teacherId) {
            throw new Error('Unauthorized: You can only update your own applications');
        }

        // Validate preferredDate if provided
        if (dto.preferredDate !== undefined && dto.preferredDate !== null) {
            const date = new Date(dto.preferredDate);
            if (isNaN(date.getTime())) {
                throw new Error('Invalid preferred date');
            }
        }

        // Update using domain method (will check if status is PENDING)
        const updatedApplication = application.update({
            preferredShift: dto.preferredShift,
            preferredType: dto.preferredType,
            preferredDate: dto.preferredDate !== undefined ? (dto.preferredDate ? new Date(dto.preferredDate) : null) : undefined,
            notes: dto.notes !== undefined ? dto.notes : undefined,
        });

        // Persist
        const saved = await this.repository.save(updatedApplication);

        return toProctorApplicationResponse(saved);
    }
}
