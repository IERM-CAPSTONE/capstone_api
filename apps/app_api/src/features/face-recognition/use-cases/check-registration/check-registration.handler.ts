import { Inject, Injectable, Logger } from '@nestjs/common';
import { IDENTITY_REPOSITORY, IIdentityRepository } from '@app/users';

@Injectable()
export class CheckRegistrationHandler {
  private readonly logger = new Logger(CheckRegistrationHandler.name);

  constructor(
    @Inject(IDENTITY_REPOSITORY)
    private readonly identityRepository: IIdentityRepository,
  ) {}

  async execute(studentId: string) {
    try {
      const identity = await this.identityRepository.findByStudentId(studentId);

      return {
        isRegistered: !!identity,
        isValid: identity?.isValid ?? false,
      };
    } catch (error) {
      this.logger.error(`Error checking face registration: ${error.message}`);
      return {
        isRegistered: false,
        error: 'Failed to check registration status',
      };
    }
  }
}
