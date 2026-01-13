import { Inject, Injectable } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { User, IUserRepository, USER_REPOSITORY } from '@app/users';
import { UserResponse, toUserResponse } from '../../shared/user.response';
import { CreateUserDto } from './create-user.dto';

@Injectable()
export class CreateUserHandler {
    constructor(
        @Inject(USER_REPOSITORY)
        private readonly userRepository: IUserRepository,
    ) { }

    async execute(dto: CreateUserDto): Promise<UserResponse> {
        // Check email uniqueness
        if (await this.userRepository.emailExists(dto.email)) {
            throw new Error(`Email '${dto.email}' already exists`);
        }

        // Check code uniqueness
        if (dto.code && (await this.userRepository.codeExists(dto.code))) {
            throw new Error(`Code '${dto.code}' already exists`);
        }

        // Create aggregate using factory
        const user = User.create({
            id: uuidv4(),
            email: dto.email,
            fullName: dto.fullName,
            code: dto.code,
            avatarUrl: dto.avatarUrl,
            role: dto.role,
        });

        // Persist
        const savedUser = await this.userRepository.save(user);

        return toUserResponse(savedUser);
    }
}
