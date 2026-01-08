import {
    Injectable,
    NestInterceptor,
    ExecutionContext,
    CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface Response<T> {
    success: boolean;
    statusCode: number;
    message: string;
    data: T;
}

@Injectable()
export class TransformInterceptor<T>
    implements NestInterceptor<T, Response<T>> {
    intercept(
        context: ExecutionContext,
        next: CallHandler,
    ): Observable<Response<T>> {
        const response = context.switchToHttp().getResponse();
        const statusCode = response.statusCode;

        return next.handle().pipe(
            map((data) => {
                const message = data?.message || 'Operation successful';
                let responseData = data;
                let meta = undefined;

                // Handle pagination structure (e.g., from search/list results)
                if (data && typeof data === 'object' && 'data' in data && 'total' in data) {
                    const { data: listData, ...paginationMeta } = data;
                    responseData = listData;
                    meta = paginationMeta;
                }

                // Cleanup message from data if it exists
                if (responseData && typeof responseData === 'object' && 'message' in responseData) {
                    delete responseData.message;
                }

                return {
                    success: true,
                    statusCode,
                    message,
                    data: responseData,
                    ...(meta ? { meta } : {}),
                };
            }),
        );
    }
}
