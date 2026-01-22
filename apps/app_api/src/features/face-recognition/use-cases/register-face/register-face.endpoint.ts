import {
  Controller,
  Post,
  Body,
  BadRequestException,
  UseGuards,
  Logger,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiBearerAuth } from '@nestjs/swagger';
import { RoleType } from '@app/users';
import { Roles, GetUser } from '../../../../common/decorators';
import { RolesGuard, JwtAuthGuard } from '../../../../common/guards';
import { RegisterFaceDto } from './register-face.dto';
import { RegisterFaceHandler } from './register-face.handler';

@ApiTags('FaceRecognition')
@ApiBearerAuth('JWT-auth')
@Controller('face-recognition')
@UseGuards(JwtAuthGuard, RolesGuard)
export class RegisterFaceEndpoint {
  private readonly logger = new Logger(RegisterFaceEndpoint.name);

  constructor(private readonly handler: RegisterFaceHandler) { }

  @Post('register')
  @Roles(RoleType.ADMIN, RoleType.EXAM_OFFICER, RoleType.STUDENT)
  @ApiOperation({ summary: 'Register face with encrypted images' })
  @ApiBody({ type: RegisterFaceDto })
  @ApiResponse({ status: 201, description: 'Face registered successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async handle(
    @Body() dto: RegisterFaceDto,
    @GetUser() user: { userId: string, role: string }
  ) {
    // Luôn luôn lấy ID từ token để đảm bảo tính chính xác và bảo mật của dữ liệu sinh trắc học
    const studentId = user.userId;
    this.logger.debug(`Registering face for student: ${studentId}`);

    try {
      return await this.handler.execute({
        ...dto,
        studentId: studentId,
      });
    } catch (error) {
      if (error instanceof Error) {
        throw new BadRequestException(error.message);
      }
      throw error;
    }
  }
}
