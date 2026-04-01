import { Inject, Injectable } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { ProctorApplication, IProctorApplicationRepository, PROCTOR_APPLICATION_REPOSITORY } from '@app/proctor-applications';
import { ProctorApplicationResponse, toProctorApplicationResponse } from '../../shared/proctor-application.response';
import { CreateProctorApplicationDto } from './create-application.dto';

@Injectable()
export class CreateProctorApplicationHandler {
    constructor(
        @Inject(PROCTOR_APPLICATION_REPOSITORY)
        private readonly repository: IProctorApplicationRepository,
    ) { }

    async execute(dto: CreateProctorApplicationDto, teacherId: string): Promise<ProctorApplicationResponse> {
        const preferredDates = dto.preferredDates && dto.preferredDates.length > 0
            ? dto.preferredDates.map((value) => new Date(value))
            : [];

        if (preferredDates.some((date) => Number.isNaN(date.getTime()))) {
            throw new Error('Invalid preferred date');
        }

        // Create aggregate using factory
        const application = ProctorApplication.create({
            id: uuidv4(),
            teacherId,
            preferredShift: dto.preferredShift,
            preferredType: dto.preferredType,
            preferredDates,
            notes: dto.notes ?? null,
            status: 'PENDING',
        });

        // Persist
        const savedApplication = await this.repository.save(application);

        return toProctorApplicationResponse(savedApplication);
    }
}
