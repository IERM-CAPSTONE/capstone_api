import { Inject, Injectable } from '@nestjs/common';
import { IUserRepository, USER_REPOSITORY, UserActivity } from '@app/users';
import { v4 as uuidv4 } from 'uuid';
import { UserResponse, toUserResponse } from '../../shared/user.response';
import { ToggleStatusDto } from './toggle-status.dto';

import { NotificationGateway } from '../../../../common/gateways/notification.gateway';

@Injectable()
export class ToggleStatusHandler {
    constructor(
        @Inject(USER_REPOSITORY)
        private readonly userRepository: IUserRepository,
        private readonly notificationGateway: NotificationGateway,
    ) { }

    async execute(id: string, dto: ToggleStatusDto): Promise<UserResponse> {
        const user = await this.userRepository.findById(id);
        if (!user) {
            throw new Error(`User with ID ${id} not found`);
        }

        if (dto.isActive) {
            user.activate();
        } else {
            user.deactivate();
        }

        const updatedUser = await this.userRepository.save(user);

        // Create activity log
        const activity = UserActivity.create({
            id: uuidv4(),
            userId: updatedUser.id,
            type: updatedUser.isActive ? 'ACCOUNT_UNLOCKED' : 'ACCOUNT_LOCKED',
            details: `Account ${updatedUser.isActive ? 'unlocked' : 'locked'} for ${updatedUser.fullName} (${updatedUser.code?.value || 'N/A'})`,
            performer: 'Admin',
        });
        await this.userRepository.saveActivity(activity);

        // Notify
        this.notificationGateway.sendToAll('ACCOUNT_ACTIVITY', {
            id: activity.id,
            type: updatedUser.isActive ? 'ACCOUNT_UNLOCKED' : 'ACCOUNT_LOCKED',
            userId: updatedUser.id,
            userName: updatedUser.fullName || updatedUser.email,
            userCode: updatedUser.code?.value,
            performer: 'Admin',
            timestamp: activity.timestamp.toISOString(),
        });

        return toUserResponse(updatedUser);
    }
}
