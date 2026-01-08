import { Catch, ArgumentsHost, Logger } from '@nestjs/common';
import { BaseRpcExceptionFilter, RpcException } from '@nestjs/microservices';
import { Observable, throwError } from 'rxjs';

/**
 * RabbitMQ Exception Filter
 * Xử lý các exception từ RabbitMQ message handlers
 */
@Catch()
export class RabbitMQExceptionFilter extends BaseRpcExceptionFilter {
    private readonly logger = new Logger(RabbitMQExceptionFilter.name);

    catch(exception: unknown, host: ArgumentsHost): Observable<any> {
        const error = exception instanceof Error ? exception : new Error(String(exception));

        this.logger.error(`RabbitMQ Exception: ${error.message}`, error.stack);

        if (exception instanceof RpcException) {
            return super.catch(exception, host);
        }

        return throwError(() => new RpcException({
            message: error.message,
            code: 'INTERNAL_ERROR',
        }));
    }
}
