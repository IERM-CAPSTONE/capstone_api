import {
    Controller,
    Post,
    UseInterceptors,
    UploadedFile,
    UseGuards,
    BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiConsumes, ApiBody, ApiBearerAuth } from '@nestjs/swagger';
import type { Express } from 'express';
import { RoleType } from '@app/users';
import { Roles } from '../../../../common/decorators';
import { RolesGuard, JwtAuthGuard } from '../../../../common/guards';
import { ImportSubjectsHandler } from './import-subjects.handler';

@ApiTags('Subjects')
@ApiBearerAuth('JWT-auth')
@Controller('subjects')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ImportSubjectsEndpoint {
    constructor(private readonly handler: ImportSubjectsHandler) { }

    @Post('import')
    @Roles(RoleType.ADMIN, RoleType.EXAM_OFFICER)
    @ApiOperation({ summary: 'Import subjects from Excel file' })
    @ApiConsumes('multipart/form-data')
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                file: {
                    type: 'string',
                    format: 'binary',
                },
            },
        },
    })
    @UseInterceptors(FileInterceptor('file'))
    async handle(@UploadedFile() file: Express.Multer.File) {
        if (!file) {
            throw new BadRequestException('File is required');
        }
        return await this.handler.handle(file);
    }
}
