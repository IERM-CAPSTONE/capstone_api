import { Inject, Injectable } from '@nestjs/common';
import { IProctorApplicationRepository, PROCTOR_APPLICATION_REPOSITORY } from '@app/proctor-applications';
import { ProctorApplicationResponse, toProctorApplicationResponse } from '../../shared/proctor-application.response';
import { NotificationGateway } from '../../../../common/gateways/notification.gateway';

@Injectable()
export class CancelProctorApplicationHandler {
    constructor(
        @Inject(PROCTOR_APPLICATION_REPOSITORY)
        private readonly repository: IProctorApplicationRepository,
        private readonly notificationGateway: NotificationGateway,
    ) { }

    async execute(id: string, teacherId: string): Promise<ProctorApplicationResponse> {
        // Find existing application
        const application = await this.repository.findById(id);
        if (!application) {
            throw new Error('Application not found');
        }

        // Verify ownership
        if (application.teacherId !== teacherId) {
            throw new Error('Unauthorized: You can only cancel your own applications');
        }

        // Cancel using domain method (will check if status allows cancellation)
        const canceledApplication = application.cancel();

        // Persist
        const saved = await this.repository.save(canceledApplication);
        const payload = toProctorApplicationResponse(saved);

        this.notificationGateway.sendToUser(saved.teacherId, 'proctor:application:updated', payload);
        if (saved.targetTeacherId && saved.targetTeacherId !== saved.teacherId) {
            this.notificationGateway.sendToUser(saved.targetTeacherId, 'proctor:application:updated', payload);
        }

        return payload;
    }
}
