import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { GetUserHandler } from '../get-user/get-user.handler';

@ApiTags('Auth')
@Controller('auth/me')
export class MeEndpoint {
    constructor(private readonly getUserHandler: GetUserHandler) { }

    @Get()
    @UseGuards(AuthGuard('jwt'))
    @ApiBearerAuth('JWT-auth')
    @ApiOperation({ summary: 'Get current authenticated user' })
    @ApiResponse({ status: 200, description: 'Current user information' })
    async me(@Req() req: any) {
        // JwtStrategy validate() returns { userId, role }
        const userId = req.user?.userId;
        const user = await this.getUserHandler.execute({ id: userId });
        return user;
    }
}
