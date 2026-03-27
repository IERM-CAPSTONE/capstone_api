import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary } from 'cloudinary';
import { Readable } from 'stream';

@Injectable()
export class CloudinaryService {
    constructor(private readonly config: ConfigService) {
        cloudinary.config({
            cloud_name: config.get('CLOUDINARY_CLOUD_NAME'),
            api_key: config.get('CLOUDINARY_API_KEY'),
            api_secret: config.get('CLOUDINARY_API_SECRET'),
        });
    }

    async uploadImage(fileBuffer: Buffer, folder = 'tickets'): Promise<string> {
        return new Promise((resolve, reject) => {
            const uploadStream = cloudinary.uploader.upload_stream(
                { folder, resource_type: 'image' },
                (error, result) => {
                    if (error || !result) return reject(error);
                    resolve(result.secure_url);
                },
            );
            Readable.from(fileBuffer).pipe(uploadStream);
        });
    }
}
