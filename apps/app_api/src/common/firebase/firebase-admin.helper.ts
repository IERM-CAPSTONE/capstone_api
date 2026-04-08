import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { cert, getApps, initializeApp } from 'firebase-admin/app';

export function ensureFirebaseAdminInitialized(
    configService: ConfigService,
    logger?: Logger,
) {
    const apps = getApps();
    if (apps.length > 0) {
        return apps[0];
    }

    const projectId =
        process.env.FIREBASE_PROJECT_ID ||
        configService.get<string>('FIREBASE_PROJECT_ID');
    let privateKey =
        process.env.FIREBASE_PRIVATE_KEY ||
        configService.get<string>('FIREBASE_PRIVATE_KEY');
    const clientEmail =
        process.env.FIREBASE_CLIENT_EMAIL ||
        configService.get<string>('FIREBASE_CLIENT_EMAIL');

    if (!projectId || !privateKey || !clientEmail) {
        const message = `Missing Firebase credentials. ProjectId: ${!!projectId}, Email: ${!!clientEmail}, Key: ${!!privateKey}`;
        logger?.error(message);
        throw new Error(message);
    }

    privateKey = privateKey.replace(/^"|"$/g, '');
    privateKey = privateKey.replace(/\\n/g, '\n');

    logger?.log(`Initializing Firebase Admin SDK for project: ${projectId}`);

    return initializeApp({
        credential: cert({
            projectId,
            privateKey,
            clientEmail,
        }),
        projectId,
    });
}
