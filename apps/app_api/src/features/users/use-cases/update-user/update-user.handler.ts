import { Inject, Injectable } from '@nestjs/common';
import { IUserRepository, USER_REPOSITORY, UserActivity } from '@app/users';
import { v4 as uuidv4 } from 'uuid';
import { UserResponse, toUserResponse } from '../../shared/user.response';
import { UpdateUserDto } from './update-user.dto';

import { NotificationGateway } from '../../../../common/gateways/notification.gateway';

@Injectable()
export class UpdateUserHandler {
    constructor(
        @Inject(USER_REPOSITORY)
        private readonly userRepository: IUserRepository,
        private readonly notificationGateway: NotificationGateway,
    ) { }

    async execute(id: string, dto: UpdateUserDto): Promise<UserResponse> {
        const user = await this.userRepository.findById(id);
        if (!user) {
            throw new Error(`User '${id}' not found`);
        }

        if (dto.code && (await this.userRepository.codeExists(dto.code, id))) {
            throw new Error(`Code '${dto.code}' already exists`);
        }

        if (dto.email && (await this.userRepository.emailExists(dto.email, id))) {
            throw new Error(`Email '${dto.email}' already exists`);
        }

        user.updateProfile({
            fullName: dto.fullName,
            code: dto.code,
            avatarUrl: dto.avatarUrl,
        });

        if (dto.email) {
            user.updateEmail(dto.email);
        }

        if (dto.role) {
            user.changeRole(dto.role);
        }

        if (dto.isActive !== undefined) {
            if (dto.isActive) {
                if (!user.isActive) user.activate();
            } else {
                if (user.isActive) user.deactivate();
            }
        }

        const savedUser = await this.userRepository.save(user);

        // Create activity log
        const activity = UserActivity.create({
            id: uuidv4(),
            userId: savedUser.id,
            type: 'ACCOUNT_UPDATED',
            details: `Account updated for ${savedUser.fullName} (${savedUser.code?.value || 'N/A'})`,
            performer: 'Admin',
        });
        await this.userRepository.saveActivity(activity);

        // Notify
        this.notificationGateway.sendToAll('ACCOUNT_ACTIVITY', {
            id: activity.id,
            type: 'ACCOUNT_UPDATED',
            userId: savedUser.id,
            userName: savedUser.fullName || savedUser.email,
            userCode: savedUser.code?.value,
            performer: 'Admin',
            timestamp: activity.timestamp.toISOString(),
        });

        return toUserResponse(savedUser);
    }
}
