import { Inject, Injectable } from '@nestjs/common';
import { IUserRepository, USER_REPOSITORY } from '@app/users';
import { toUserResponse, UserResponse } from '../../shared/user.response';
import { SearchUsersByCodesDto } from './search-users-by-codes.dto';

@Injectable()
export class SearchUsersByCodesHandler {
    constructor(
        @Inject(USER_REPOSITORY)
        private readonly userRepository: IUserRepository,
    ) { }

    async execute(dto: SearchUsersByCodesDto): Promise<UserResponse[]> {
        const users = await this.userRepository.findByCodes(dto.codes);
        return users.map((user) => toUserResponse(user));
    }
}
