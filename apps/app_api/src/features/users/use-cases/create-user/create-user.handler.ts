import { Inject, Injectable } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { User, IUserRepository, USER_REPOSITORY } from '@app/users';
import { UserResponse, toUserResponse } from '../../shared/user.response';
import { CreateUserDto } from './create-user.dto';

import { NotificationGateway } from '../../../../common/gateways/notification.gateway';

@Injectable()
export class CreateUserHandler {
    constructor(
        @Inject(USER_REPOSITORY)
        private readonly userRepository: IUserRepository,
        private readonly notificationGateway: NotificationGateway,
    ) { }

    async execute(dto: CreateUserDto): Promise<UserResponse> {
        // Manual Validation (Way 1)
        if (!dto.email || !dto.email.includes('@')) {
            throw new Error(`Invalid email format: '${dto.email}'`);
        }

        if (!dto.fullName || dto.fullName.trim().length === 0) {
            throw new Error('Full name is required');
        }

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
            isActive: dto.isActive,
        });

        // Persist
        const savedUser = await this.userRepository.save(user);

        // Notify
        this.notificationGateway.sendToAll('USER_CREATED', {
            userId: savedUser.id,
            userName: savedUser.fullName || savedUser.email,
            userCode: savedUser.code?.value,
            timestamp: new Date().toISOString(),
        });

        return toUserResponse(savedUser);
    }
}
