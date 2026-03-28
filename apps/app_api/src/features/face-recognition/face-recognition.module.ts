import { Module } from '@nestjs/common';
import { UsersCoreModule } from '@app/users';
import { ExamSessionsCoreModule } from '@app/exam-sessions';

// Use Cases
import { RegisterFaceHandler, RegisterFaceEndpoint } from './use-cases/register-face';
import { AuthenticateFaceHandler, AuthenticateFaceEndpoint } from './use-cases/authenticate-face';
import { CheckRegistrationHandler, CheckRegistrationEndpoint } from './use-cases/check-registration';
import { ProctorCheckInEndpoint, ProctorCheckInHandler } from './use-cases/proctor-check-in';
import { NotificationGateway } from '../../common/gateways';

@Module({
  imports: [
    UsersCoreModule,
    ExamSessionsCoreModule,
  ],
  controllers: [
    RegisterFaceEndpoint,
    AuthenticateFaceEndpoint,
    CheckRegistrationEndpoint,
    ProctorCheckInEndpoint,
  ],
  providers: [
    RegisterFaceHandler,
    AuthenticateFaceHandler,
    CheckRegistrationHandler,
    ProctorCheckInHandler,
    NotificationGateway,
  ],
})
export class FaceRecognitionModule { }
