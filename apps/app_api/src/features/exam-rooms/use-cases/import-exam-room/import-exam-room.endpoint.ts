import {
    Controller,
    Post,
    UseInterceptors,
    UploadedFile,
    UseGuards,
    BadRequestException,
    Body,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiConsumes, ApiBody, ApiBearerAuth } from '@nestjs/swagger';
import type { Express } from 'express';
import { RoleType } from '@app/users';
import { Roles } from '../../../../common/decorators';
import { RolesGuard, JwtAuthGuard } from '../../../../common/guards';
import { ImportExamRoomHandler } from './import-exam-room.handler';

@ApiTags('ExamRooms')
@ApiBearerAuth('JWT-auth')
@Controller('exam-rooms')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ImportExamRoomEndpoint {
    constructor(private readonly handler: ImportExamRoomHandler) { }

    @Post('import')
    @Roles(RoleType.ADMIN, RoleType.EXAM_OFFICER)
    @ApiOperation({ summary: 'Import exam rooms from Excel file' })
    @ApiConsumes('multipart/form-data')
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                file: {
                    type: 'string',
                    format: 'binary',
                },
                campus: {
                    type: 'string',
                    description: 'Campus to import to (e.g. HCM, HN, DN, QN, CT)',
                },
            },
        },
    })
    @UseInterceptors(FileInterceptor('file'))
    async handle(
        @UploadedFile() file: Express.Multer.File,
        @Body('campus') campus?: string,
    ) {
        if (!file) {
            throw new BadRequestException('File is required');
        }
        return await this.handler.handle(file, campus);
    }
}
