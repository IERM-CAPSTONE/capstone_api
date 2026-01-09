import { Controller, Post, UploadedFile, UseInterceptors, UseGuards } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { ImportStudentHandler } from './import-student.handler';

@ApiTags('Users')
@Controller('users')
export class ImportStudentEndpoint {
    constructor(private readonly handler: ImportStudentHandler) { }

    @Post('import-students')
    @ApiOperation({ summary: 'Import sinh viên từ file Excel' })
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
    async importStudents(@UploadedFile() file: Express.Multer.File) {
        return this.handler.handle(file);
    }
}
