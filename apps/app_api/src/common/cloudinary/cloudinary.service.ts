import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Readable } from 'stream';
import { createHash, randomUUID } from 'crypto';

@Injectable()
export class CloudinaryService {
    private readonly cloudinary: any;
    private readonly cloudName: string | undefined;
    private readonly apiKey: string | undefined;
    private readonly apiSecret: string | undefined;

    constructor(private readonly config: ConfigService) {
        this.cloudName = config.get<string>('CLOUDINARY_CLOUD_NAME');
        this.apiKey = config.get<string>('CLOUDINARY_API_KEY');
        this.apiSecret = config.get<string>('CLOUDINARY_API_SECRET');
        this.cloudinary = this.loadCloudinary();
        this.cloudinary?.config({
            cloud_name: this.cloudName,
            api_key: this.apiKey,
            api_secret: this.apiSecret,
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

    createSignedUploadParams(folder = 'tickets') {
        if (!this.cloudName || !this.apiKey || !this.apiSecret) {
            throw new Error('Cloudinary credentials are not configured');
        }

        const timestamp = Math.floor(Date.now() / 1000);
        const expiresAt = timestamp + 5 * 60;
        const publicId = `${folder}/${timestamp}_${randomUUID().replace(/-/g, '')}`;
        const signatureBase =
            `folder=${folder}&public_id=${publicId}&timestamp=${timestamp}${this.apiSecret}`;
        const signature = createHash('sha1').update(signatureBase).digest('hex');

        return {
            cloudName: this.cloudName,
            apiKey: this.apiKey,
            timestamp,
            expiresAt,
            folder,
            publicId,
            signature,
            uploadUrl: `https://api.cloudinary.com/v1_1/${this.cloudName}/image/upload`,
        };
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
