import { Module } from '@nestjs/common';
import { UsersCoreModule } from '@app/users';

// Use Cases
import { RegisterFaceHandler, RegisterFaceEndpoint } from './use-cases/register-face';
import { AuthenticateFaceHandler, AuthenticateFaceEndpoint } from './use-cases/authenticate-face';
import { NotificationGateway } from '../../common/gateways';

@Module({
  imports: [
    UsersCoreModule,
  ],
  controllers: [
    RegisterFaceEndpoint,
    AuthenticateFaceEndpoint,
  ],
  providers: [
    RegisterFaceHandler,
    AuthenticateFaceHandler,
    NotificationGateway,
  ],
})
export class FaceRecognitionModule { }
