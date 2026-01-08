import {
    ExceptionFilter,
    Catch,
    ArgumentsHost,
    HttpException,
    HttpStatus,
    Logger,
} from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
    private readonly logger = new Logger('ExceptionsHandler');

    constructor(private readonly httpAdapterHost: HttpAdapterHost) { }

    catch(exception: unknown, host: ArgumentsHost): void {
        // In certain situations `httpAdapter` might not be available in the
        // constructor method, thus we should resolve it here.
        const { httpAdapter } = this.httpAdapterHost;

        const ctx = host.switchToHttp();
        const request = ctx.getRequest();
        const response = ctx.getResponse();

        const httpStatus =
            exception instanceof HttpException
                ? exception.getStatus()
                : HttpStatus.INTERNAL_SERVER_ERROR;

        const message =
            exception instanceof HttpException
                ? exception.getResponse()
                : {
                    statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
                    message: (exception as Error).message || 'Internal server error',
                };

        const responseBody = {
            success: false,
            statusCode: httpStatus,
            timestamp: new Date().toISOString(),
            path: httpAdapter.getRequestUrl(request),
            method: httpAdapter.getRequestMethod(request),
            ...(typeof message === 'object' ? message : { message }),
        };

        // Log the error
        this.logError(exception, request, httpStatus);

        httpAdapter.reply(response, responseBody, httpStatus);
    }

    private logError(exception: unknown, request: any, status: number) {
        const { method, url, body, user } = request;
        const stack = exception instanceof Error ? exception.stack : '';
        const message = exception instanceof Error ? exception.message : exception;

        const errorLog = {
            method,
            url,
            status,
            message,
            user: user ? { id: user.id, email: user.email } : 'Anonymous',
            body: this.sanitizeBody(body),
            stack,
        };

        if (status >= 500) {
            this.logger.error(
                `${method} ${url} ${status} - Error: ${message}`,
                stack
            );
        } else {
            this.logger.warn(
                `${method} ${url} ${status} - Warning: ${message}`
            );
        }
    }

    private sanitizeBody(body: any) {
        if (!body) return body;
        const sanitized = { ...body };
        const sensitiveFields = ['password', 'accessToken', 'refreshToken', 'secret'];
        sensitiveFields.forEach(field => {
            if (sanitized[field]) sanitized[field] = '***';
        });
        return sanitized;
    }
}
