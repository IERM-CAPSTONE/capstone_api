import {
  BadRequestException,
  Body,
  Controller,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { RoleType } from '@app/users';
import { GetUser, Roles } from '../../../../common/decorators';
import { JwtAuthGuard, RolesGuard } from '../../../../common/guards';
import { ProctorCheckInDto } from './proctor-check-in.dto';
import { ProctorCheckInHandler } from './proctor-check-in.handler';

@ApiTags('FaceRecognition')
@ApiBearerAuth('JWT-auth')
@Controller('face-recognition')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ProctorCheckInEndpoint {
  constructor(private readonly handler: ProctorCheckInHandler) {}

  @Post('proctor-check-in')
  @Roles(RoleType.PROCTOR, RoleType.ADMIN, RoleType.EXAM_OFFICER)
  @ApiOperation({
    summary: 'Check in assigned proctor via face authentication',
  })
  @ApiBody({ type: ProctorCheckInDto })
  @ApiResponse({ status: 200, description: 'Proctor checked in successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async handle(
    @Body() dto: ProctorCheckInDto,
    @GetUser('userId') userId: string,
  ) {
    try {
      return await this.handler.execute(dto, userId);
    } catch (error) {
      if (error instanceof Error) {
        throw new BadRequestException(error.message);
      }
      throw error;
    }
  }
}
