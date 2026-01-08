import { Module, DynamicModule, Global } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { QUEUE_NAMES, RABBITMQ_CLIENTS, QUEUE_OPTIONS } from './queue.constants';

/**
 * QueueModule - Shared module cho RabbitMQ configuration
 *
 * Sử dụng:
 * - Producer (app_api): QueueModule.forRoot()
 * - Consumer (app_background): QueueModule.forRoot()
 */
@Global()
@Module({})
export class QueueModule {
    /**
     * Đăng ký module với RabbitMQ connection (Producer)
     * Sử dụng trong app_api để gửi messages
     */
    static forRoot(): DynamicModule {
        return {
            module: QueueModule,
            imports: [
                ConfigModule,
                // Đăng ký RabbitMQ clients
                ClientsModule.registerAsync([
                    {
                        name: RABBITMQ_CLIENTS.NOTIFICATION_SERVICE,
                        imports: [ConfigModule],
                        useFactory: (configService: ConfigService) => ({
                            transport: Transport.RMQ,
                            options: {
                                urls: [configService.get<string>('RABBITMQ_URL', 'amqp://admin:admin123@localhost:5672')],
                                queue: QUEUE_NAMES.NOTIFICATION,
                                queueOptions: {
                                    durable: QUEUE_OPTIONS.DURABLE,
                                },
                                persistent: QUEUE_OPTIONS.PERSISTENT,
                            },
                        }),
                        inject: [ConfigService],
                    },
                    {
                        name: RABBITMQ_CLIENTS.EMAIL_SERVICE,
                        imports: [ConfigModule],
                        useFactory: (configService: ConfigService) => ({
                            transport: Transport.RMQ,
                            options: {
                                urls: [configService.get<string>('RABBITMQ_URL', 'amqp://admin:admin123@localhost:5672')],
                                queue: QUEUE_NAMES.EMAIL,
                                queueOptions: {
                                    durable: QUEUE_OPTIONS.DURABLE,
                                },
                                persistent: QUEUE_OPTIONS.PERSISTENT,
                            },
                        }),
                        inject: [ConfigService],
                    },
                ]),
            ],
            exports: [ClientsModule],
        };
    }

    /**
     * Đăng ký module cho Consumer (Background Worker)
     * Sử dụng trong main.ts của app_background
     */
    static getConsumerOptions(configService: ConfigService, queueName: string) {
        return {
            transport: Transport.RMQ,
            options: {
                urls: [configService.get<string>('RABBITMQ_URL', 'amqp://admin:admin123@localhost:5672')],
                queue: queueName,
                queueOptions: {
                    durable: QUEUE_OPTIONS.DURABLE,
                },
                prefetchCount: QUEUE_OPTIONS.PREFETCH_COUNT,
                noAck: false, // Manual acknowledgment
            },
        };
    }
}
