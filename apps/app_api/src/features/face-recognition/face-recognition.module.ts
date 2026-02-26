import { Module } from '@nestjs/common';
import { UsersCoreModule } from '@app/users';

// Use Cases
import { RegisterFaceHandler, RegisterFaceEndpoint } from './use-cases/register-face';
import { AuthenticateFaceHandler, AuthenticateFaceEndpoint } from './use-cases/authenticate-face';
import { CheckRegistrationHandler, CheckRegistrationEndpoint } from './use-cases/check-registration';
import { NotificationGateway } from '../../common/gateways';

@Module({
  imports: [
    UsersCoreModule,
  ],
  controllers: [
    RegisterFaceEndpoint,
    AuthenticateFaceEndpoint,
    CheckRegistrationEndpoint,
  ],
  providers: [
    RegisterFaceHandler,
    AuthenticateFaceHandler,
    CheckRegistrationHandler,
    NotificationGateway,
  ],
})
export class FaceRecognitionModule { }
