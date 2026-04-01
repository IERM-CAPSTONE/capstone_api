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

        const preferredDates = dto.preferredDates !== undefined
            ? dto.preferredDates.map((value) => new Date(value))
            : undefined;

        if (preferredDates && preferredDates.some((date) => Number.isNaN(date.getTime()))) {
            throw new Error('Invalid preferred date');
        }

        // Update using domain method (will check if status is PENDING)
        const updatedApplication = application.update({
            preferredShift: dto.preferredShift,
            preferredType: dto.preferredType,
            preferredDates,
            notes: dto.notes !== undefined ? dto.notes : undefined,
        });

        // Persist
        const saved = await this.repository.save(updatedApplication);

        return toProctorApplicationResponse(saved);
    }
}
