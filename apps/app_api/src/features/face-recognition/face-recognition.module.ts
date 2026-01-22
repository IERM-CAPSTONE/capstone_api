import { Module } from '@nestjs/common';

// Use Cases
import { RegisterFaceHandler, RegisterFaceEndpoint } from './use-cases/register-face';
import { AuthenticateFaceHandler, AuthenticateFaceEndpoint } from './use-cases/authenticate-face';

@Module({
  controllers: [
    RegisterFaceEndpoint,
    AuthenticateFaceEndpoint,
  ],
  providers: [
    RegisterFaceHandler,
    AuthenticateFaceHandler,
  ],
})
export class FaceRecognitionModule {}
