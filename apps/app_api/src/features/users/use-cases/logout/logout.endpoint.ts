import { Controller, Post, Res } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Response } from 'express';
import { LogoutHandler } from './logout.handler';

@ApiTags('Auth')
@Controller('auth/logout')
export class LogoutEndpoint {
    constructor(private readonly handler: LogoutHandler) { }

    @Post()
    @ApiOperation({ summary: 'Logout user and clear cookies' })
    @ApiResponse({ status: 200, description: 'Logged out successfully' })
    async logout(@Res() res: Response) {
        await this.handler.handleLogout(res);
        res.json({ message: 'Logged out successfully' });
    }
}
