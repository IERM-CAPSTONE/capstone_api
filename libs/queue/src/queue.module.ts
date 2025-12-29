import { Module, DynamicModule, Global } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { QUEUE_NAMES } from './queue.constants';

/**
 * QueueModule - Shared module cho Bull Queue configuration
 *
 * Sử dụng:
 * - Producer (app_api): QueueModule.forRoot()
 * - Consumer (app_background): QueueModule.forRoot()
 */
@Global()
@Module({})
export class QueueModule {
    /**
     * Đăng ký module với Redis connection
     */
    static forRoot(): DynamicModule {
        return {
            module: QueueModule,
            imports: [
                ConfigModule,
                // Đăng ký connection Redis
                BullModule.forRootAsync({
                    imports: [ConfigModule],
                    useFactory: (configService: ConfigService) => ({
                        connection: {
                            host: configService.get('REDIS_HOST', 'localhost'),
                            port: configService.get('REDIS_PORT', 6379),
                            password: configService.get('REDIS_PASSWORD', undefined),
                        },
                    }),
                    inject: [ConfigService],
                }),
                // Đăng ký các queues
                BullModule.registerQueue(
                    { name: QUEUE_NAMES.NOTIFICATION },
                    { name: QUEUE_NAMES.EMAIL },
                ),
            ],
            exports: [BullModule],
        };
    }
}
