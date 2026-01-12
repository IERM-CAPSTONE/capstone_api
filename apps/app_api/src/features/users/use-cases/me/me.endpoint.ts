import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Auth')
@Controller('auth/me')
export class MeEndpoint {
    @Get()
    @UseGuards(AuthGuard('jwt'))
    @ApiBearerAuth('JWT-auth')
    @ApiOperation({ summary: 'Get current authenticated user' })
    @ApiResponse({ status: 200, description: 'Current user information' })
    async me(@Req() req: any) {
        // JwtStrategy validate() returns { userId, role }
        return { userId: req.user?.userId, role: req.user?.role };
    }
}
