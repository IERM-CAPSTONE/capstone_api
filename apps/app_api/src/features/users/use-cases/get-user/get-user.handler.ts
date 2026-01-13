import { Inject, Injectable } from '@nestjs/common';
import { IUserRepository, USER_REPOSITORY } from '@app/users';
import { UserResponse, toUserResponse } from '../../shared/user.response';

@Injectable()
export class GetUserHandler {
    constructor(
        @Inject(USER_REPOSITORY)
        private readonly userRepository: IUserRepository,
    ) { }

    async execute(query: { id?: string; email?: string; code?: string }): Promise<UserResponse | null> {
        const user = await this.userRepository.findOne(query);
        return user ? toUserResponse(user) : null;
    }
}
