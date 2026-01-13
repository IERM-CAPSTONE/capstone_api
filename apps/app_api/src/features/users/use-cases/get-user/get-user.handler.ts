import { Inject, Injectable } from '@nestjs/common';
import { IUserRepository, USER_REPOSITORY } from '@app/users';
import { UserResponse, toUserResponse } from '../../shared/user.response';

@Injectable()
export class GetUserHandler {
    constructor(
        @Inject(USER_REPOSITORY)
        private readonly userRepository: IUserRepository,
    ) { }

    async byId(id: string): Promise<UserResponse | null> {
        const user = await this.userRepository.findById(id);
        return user ? toUserResponse(user) : null;
    }

    async byEmail(email: string): Promise<UserResponse | null> {
        const user = await this.userRepository.findByEmail(email);
        return user ? toUserResponse(user) : null;
    }

    async byCode(code: string): Promise<UserResponse | null> {
        const user = await this.userRepository.findByCode(code);
        return user ? toUserResponse(user) : null;
    }
}
