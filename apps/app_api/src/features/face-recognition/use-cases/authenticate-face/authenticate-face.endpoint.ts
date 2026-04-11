import {
  Controller,
  Post,
  Body,
  BadRequestException,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiBearerAuth } from '@nestjs/swagger';
import { RoleType } from '@app/users';
import { GetUser, Roles } from '../../../../common/decorators';
import { RolesGuard, JwtAuthGuard } from '../../../../common/guards';
import { AuthenticateFaceDto } from './authenticate-face.dto';
import { AuthenticateFaceHandler } from './authenticate-face.handler';

@ApiTags('FaceRecognition')
@ApiBearerAuth('JWT-auth')
@Controller('face-recognition')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AuthenticateFaceEndpoint {
  constructor(private readonly handler: AuthenticateFaceHandler) {}

  @Post('authenticate')
  @Roles(RoleType.ADMIN, RoleType.EXAM_OFFICER, RoleType.STUDENT, RoleType.PROCTOR)
  @ApiOperation({ summary: 'Authenticate face with encrypted image' })
  @ApiBody({ type: AuthenticateFaceDto })
  @ApiResponse({ status: 200, description: 'Face authenticated successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async handle(
    @Body() dto: AuthenticateFaceDto,
    @GetUser('userId') userId?: string,
    @GetUser('role') role?: string,
  ) {
    try {
      return await this.handler.execute(dto, {
        userId,
        role,
      });
    } catch (error) {
      if (error instanceof Error) {
        throw new BadRequestException(error.message);
      }
      throw error;
    }
  }
}
