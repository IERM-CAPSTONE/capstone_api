import {
    Controller,
    Post,
    UploadedFile,
    UseInterceptors,
    UseGuards,
    BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
    ApiTags,
    ApiBearerAuth,
    ApiConsumes,
    ApiBody,
    ApiOperation,
    ApiResponse,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../guards';
import { CloudinaryService } from './cloudinary.service';

@ApiTags('Upload')
@ApiBearerAuth('JWT-auth')
@Controller('upload')
@UseGuards(JwtAuthGuard)
export class UploadEndpoint {
    constructor(private readonly cloudinaryService: CloudinaryService) { }

    @Post('image')
    @ApiOperation({ summary: 'Upload an image and get back its Cloudinary URL' })
    @ApiResponse({ status: 201, description: 'Returns the uploaded image URL', schema: { example: { url: 'https://res.cloudinary.com/...' } } })
    @ApiConsumes('multipart/form-data')
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                file: { type: 'string', format: 'binary' },
            },
            required: ['file'],
        },
    })
    @UseInterceptors(
        FileInterceptor('file', {
            limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
            fileFilter: (_, file, cb) => {
                if (!file.mimetype.startsWith('image/')) {
                    return cb(new BadRequestException('Only image files are allowed'), false);
                }
                cb(null, true);
            },
        }),
    )
    async uploadImage(@UploadedFile() file: Express.Multer.File) {
        if (!file) {
            throw new BadRequestException('No file provided');
        }
        const url = await this.cloudinaryService.uploadImage(file.buffer);
        return { url };
    }
}
