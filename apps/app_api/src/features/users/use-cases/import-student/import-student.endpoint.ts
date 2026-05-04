import { Controller, Post, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Express } from 'express';
import { RoleType } from '@app/users';
import { Roles } from '../../../../common/decorators';
import { JwtAuthGuard, RolesGuard } from '../../../../common/guards';
import { ImportStudentHandler } from './import-student.handler';

@ApiTags('Users')
@ApiBearerAuth('JWT-auth')
@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ImportStudentEndpoint {
    constructor(private readonly handler: ImportStudentHandler) { }

    @Post('import-accounts')
    @Roles(RoleType.ADMIN, RoleType.EXAM_OFFICER)
    @ApiOperation({ summary: 'Import accounts from Excel or CSV file' })
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
    async importAccounts(@UploadedFile() file: Express.Multer.File) {
        return this.handler.handle(file);
    }

    @Post('import-students')
    @Roles(RoleType.ADMIN, RoleType.EXAM_OFFICER)
    @ApiOperation({ summary: 'Legacy alias for importing accounts' })
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
    async importStudentsAlias(@UploadedFile() file: Express.Multer.File) {
        return this.handler.handle(file);
    }
}
