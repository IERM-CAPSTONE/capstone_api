import { Inject, Injectable } from '@nestjs/common';
import { IUserRepository, USER_REPOSITORY } from '@app/users';

@Injectable()
export class DeleteUserHandler {
    constructor(
        @Inject(USER_REPOSITORY)
        private readonly userRepository: IUserRepository,
    ) { }

    async execute(id: string): Promise<void> {
        if (!(await this.userRepository.exists(id))) {
            throw new Error(`User '${id}' not found`);
        }
        await this.userRepository.delete(id);
    }
}
