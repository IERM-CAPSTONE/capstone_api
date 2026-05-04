import { Module } from '@nestjs/common';
import { ProctorApplicationsCoreModule } from '@app/proctor-applications';
import { ExamSessionsCoreModule } from '@app/exam-sessions';
import { NotificationGateway } from '../../common/gateways/notification.gateway';

// Use Cases
import { CreateProctorApplicationHandler, CreateProctorApplicationEndpoint } from './use-cases/create-application';
import { UpdateProctorApplicationHandler, UpdateProctorApplicationEndpoint } from './use-cases/update-application';
import { CancelProctorApplicationHandler, CancelProctorApplicationEndpoint } from './use-cases/cancel-application';
import { ListMyProctorApplicationsHandler, ListMyProctorApplicationsEndpoint } from './use-cases/list-my-applications';
import { ListAllProctorApplicationsHandler, ListAllProctorApplicationsEndpoint } from './use-cases/list-all-applications';
import { UpdateProctorApplicationStatusHandler, UpdateProctorApplicationStatusEndpoint } from './use-cases/update-status';
import { GetAvailableDatesHandler, GetAvailableDatesEndpoint } from './use-cases/get-available-dates';

@Module({
    imports: [ProctorApplicationsCoreModule, ExamSessionsCoreModule],
    controllers: [
        CreateProctorApplicationEndpoint,
        UpdateProctorApplicationEndpoint,
        CancelProctorApplicationEndpoint,
        ListMyProctorApplicationsEndpoint,
        ListAllProctorApplicationsEndpoint,
        UpdateProctorApplicationStatusEndpoint,
        GetAvailableDatesEndpoint,
    ],
    providers: [
        CreateProctorApplicationHandler,
        UpdateProctorApplicationHandler,
        CancelProctorApplicationHandler,
        ListMyProctorApplicationsHandler,
        ListAllProctorApplicationsHandler,
        UpdateProctorApplicationStatusHandler,
        GetAvailableDatesHandler,
        NotificationGateway,
    ],
})
export class ProctorApplicationsModule { }
