import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class HttpLoggerMiddleware implements NestMiddleware {
    private logger = new Logger('HTTP');

    use(req: Request, res: Response, next: NextFunction): void {
        const { method, originalUrl, ip } = req;
        const userAgent = req.get('user-agent') || '';
        const startTime = Date.now();

        // Log incoming request
        this.logger.log(`${method} ${originalUrl} - ${ip}`);

        // Capture response
        res.on('finish', () => {
            const { statusCode } = res;
            const responseTime = Date.now() - startTime;

            // Color code based on status
            const logMessage = `${method} ${originalUrl} ${statusCode} - ${responseTime}ms`;

            if (statusCode >= 500) {
                this.logger.error(logMessage);
            } else if (statusCode >= 400) {
                this.logger.warn(logMessage);
            } else {
                this.logger.log(logMessage);
            }
        });

        next();
    }
}
