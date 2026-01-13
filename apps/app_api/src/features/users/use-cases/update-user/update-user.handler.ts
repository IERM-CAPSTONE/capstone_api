import { Inject, Injectable } from '@nestjs/common';
import { IUserRepository, USER_REPOSITORY } from '@app/users';
import { UserResponse, toUserResponse } from '../../shared/user.response';
import { UpdateUserDto } from './update-user.dto';

@Injectable()
export class UpdateUserHandler {
    constructor(
        @Inject(USER_REPOSITORY)
        private readonly userRepository: IUserRepository,
    ) { }

    async execute(id: string, dto: UpdateUserDto): Promise<UserResponse> {
        const user = await this.userRepository.findOne({ id });
        if (!user) {
            throw new Error(`User '${id}' not found`);
        }

        if (dto.code && (await this.userRepository.exists({ code: dto.code }, id))) {
            throw new Error(`Code '${dto.code}' already exists`);
        }

        user.updateProfile({
            fullName: dto.fullName,
            code: dto.code,
            avatarUrl: dto.avatarUrl,
        });

        const savedUser = await this.userRepository.save(user);
        return toUserResponse(savedUser);
    }
}
