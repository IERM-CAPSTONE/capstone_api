import { Module, Global, Inject } from '@nestjs/common';
import { CacheModule, CACHE_MANAGER } from '@nestjs/cache-manager';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { redisStore } from 'cache-manager-redis-yet';

export const CACHE_SERVICE = Symbol('ICacheService');

export interface ICacheService {
    get<T>(key: string): Promise<T | null | undefined>;
    set<T>(key: string, value: T, ttl?: number): Promise<void>;
    del(key: string): Promise<void>;
    delByPrefix(prefix: string): Promise<void>;
}

/**
 * Redis Cache Implementation
 */
export class RedisCacheService implements ICacheService {
    constructor(
        @Inject(CACHE_MANAGER) private cacheManager: any
    ) { }

    async get<T>(key: string): Promise<T | null | undefined> {
        return await this.cacheManager.get(key);
    }

    async set<T>(key: string, value: T, ttl?: number): Promise<void> {
        // cache-manager v5 set arguments: key, value, ttl (ms)
        await this.cacheManager.set(key, value, ttl);
    }

    async del(key: string): Promise<void> {
        await this.cacheManager.del(key);
    }

    async delByPrefix(prefix: string): Promise<void> {
        const store = this.cacheManager?.store;
        if (!store) {
            console.warn('Cache store is not available');
            return;
        }
        // In redis-yet, the client is available on the store
        const client = store.client;

        if (client && typeof client.keys === 'function') {
            const keys = await client.keys(`${prefix}*`);
            if (keys && keys.length > 0) {
                // Bulk delete
                await store.mdel(...keys);
            }
        }
    }
}

@Global()
@Module({
    imports: [
        CacheModule.registerAsync({
            imports: [ConfigModule],
            useFactory: async (configService: ConfigService) => ({
                store: await redisStore({
                    url: configService.get<string>('REDIS_URL', 'redis://localhost:6379'),
                    ttl: configService.get<number>('CACHE_TTL', 300000), // 5 minutes
                }),
            }),
            inject: [ConfigService],
        }),
    ],
    providers: [
        {
            provide: CACHE_SERVICE,
            useClass: RedisCacheService,
        },
    ],
    exports: [CACHE_SERVICE, CacheModule],
})
export class AppCacheModule { }
