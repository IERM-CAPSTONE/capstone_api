import { Module } from '@nestjs/common';
import { CloudinaryService } from './cloudinary.service';
import { UploadEndpoint } from './upload.endpoint';

@Module({
    providers: [CloudinaryService],
    controllers: [UploadEndpoint],
    exports: [CloudinaryService],
})
export class CloudinaryModule { }
