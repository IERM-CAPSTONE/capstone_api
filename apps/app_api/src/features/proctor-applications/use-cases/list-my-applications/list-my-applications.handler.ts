import { Inject, Injectable } from '@nestjs/common';
import { IProctorApplicationRepository, PROCTOR_APPLICATION_REPOSITORY } from '@app/proctor-applications';
import { ProctorApplicationResponse, toProctorApplicationResponse } from '../../shared/proctor-application.response';

@Injectable()
export class ListMyProctorApplicationsHandler {
    constructor(
        @Inject(PROCTOR_APPLICATION_REPOSITORY)
        private readonly repository: IProctorApplicationRepository,
    ) { }

    async execute(teacherId: string): Promise<ProctorApplicationResponse[]> {
        const applications = await this.repository.findByTeacherId(teacherId);
        return applications.map(toProctorApplicationResponse);
    }
}
