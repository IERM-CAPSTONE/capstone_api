import { Inject, Injectable } from '@nestjs/common';
import { IUserRepository, USER_REPOSITORY } from '../../domain';
import { PaginatedUserResponse, toUserResponse } from '../../shared/user.response';
import { ListUsersDto } from './list-users.dto';

@Injectable()
export class ListUsersHandler {
    constructor(
        @Inject(USER_REPOSITORY)
        private readonly userRepository: IUserRepository,
    ) { }

    async execute(dto: ListUsersDto): Promise<PaginatedUserResponse> {
        const result = await this.userRepository.findPaginated({
            page: dto.page ?? 1,
            limit: dto.limit ?? 10,
            role: dto.role,
            isActive: dto.isActive,
            search: dto.search,
        });

        return {
            data: result.data.map((user) => toUserResponse(user)),
            total: result.total,
            page: result.page,
            limit: result.limit,
            totalPages: result.totalPages,
        };
    }
}
