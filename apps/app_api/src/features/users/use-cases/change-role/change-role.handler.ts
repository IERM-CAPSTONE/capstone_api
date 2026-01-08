import { Inject, Injectable } from '@nestjs/common';
import { IUserRepository, USER_REPOSITORY } from '../../domain';
import { UserResponse, toUserResponse } from '../../shared/user.response';
import { ChangeRoleDto } from './change-role.dto';

@Injectable()
export class ChangeRoleHandler {
    constructor(
        @Inject(USER_REPOSITORY)
        private readonly userRepository: IUserRepository,
    ) { }

    async execute(id: string, dto: ChangeRoleDto): Promise<UserResponse> {
        const user = await this.userRepository.findById(id);
        if (!user) {
            throw new Error(`User '${id}' not found`);
        }

        user.changeRole(dto.role);

        const savedUser = await this.userRepository.save(user);
        return toUserResponse(savedUser);
    }
}
