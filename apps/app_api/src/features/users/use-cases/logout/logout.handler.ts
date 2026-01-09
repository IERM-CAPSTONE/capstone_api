import { Injectable } from '@nestjs/common';
import { Response } from 'express';
import { TokenService } from '@app/users';

@Injectable()
export class LogoutHandler {
    constructor(private readonly tokenService: TokenService) { }

    async handleLogout(res: Response): Promise<void> {
        this.tokenService.clearCookies(res);
    }
}
