import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Readable } from 'stream';

@Injectable()
export class CloudinaryService {
    private readonly cloudinary: any;

    constructor(private readonly config: ConfigService) {
        this.cloudinary = this.loadCloudinary();
        this.cloudinary?.config({
            cloud_name: config.get('CLOUDINARY_CLOUD_NAME'),
            api_key: config.get('CLOUDINARY_API_KEY'),
            api_secret: config.get('CLOUDINARY_API_SECRET'),
        });
    }

    async uploadImage(fileBuffer: Buffer, folder = 'tickets'): Promise<string> {
        if (!this.cloudinary) {
            throw new Error('Cloudinary package is not installed');
        }

        return new Promise((resolve, reject) => {
            const uploadStream = this.cloudinary.uploader.upload_stream(
                { folder, resource_type: 'image' },
                (error, result) => {
                    if (error || !result) return reject(error);
                    resolve(result.secure_url);
                },
            );
            Readable.from(fileBuffer).pipe(uploadStream);
        });
    }

    private loadCloudinary(): any {
        try {
            // Avoid hard build failure when the optional package is missing locally.
            // eslint-disable-next-line @typescript-eslint/no-implied-eval
            const dynamicRequire = new Function('name', 'return require(name);') as (
                name: string,
            ) => any;
            return dynamicRequire('cloudinary').v2;
        } catch {
            return null;
        }
    }
}
