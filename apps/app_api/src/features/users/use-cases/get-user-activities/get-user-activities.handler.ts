import { Inject, Injectable } from '@nestjs/common';
import { IUserRepository, USER_REPOSITORY } from '@app/users';

export interface UserActivityResponse {
    id: string;
    userId: string;
    type: string;
    details: string | null;
    performer: string;
    timestamp: string;
}

@Injectable()
export class GetUserActivitiesHandler {
    constructor(
        @Inject(USER_REPOSITORY)
        private readonly userRepository: IUserRepository,
    ) { }

    async execute(userId: string): Promise<UserActivityResponse[]> {
        const activities = await this.userRepository.findActivitiesByUserId(userId);
        return activities.map(a => ({
            id: a.id,
            userId: a.userId,
            type: a.type,
            details: a.details,
            performer: a.performer,
            timestamp: a.timestamp.toISOString(),
        }));
    }

    async executeGlobal(limit: number): Promise<UserActivityResponse[]> {
        const activities = await this.userRepository.findGlobalActivities(limit);
        return activities.map(a => ({
            id: a.id,
            userId: a.userId,
            type: a.type,
            details: a.details,
            performer: a.performer,
            timestamp: a.timestamp.toISOString(),
        }));
    }
}
